# Workflow: Standard Dev Pipeline

입력: 사용자 프롬프트({{prompt}})

목표: 단일 커맨드로 표준 파이프라인을 시작한다.

────────────────────────────────────────────────────────

## ⚠️ 핵심 규칙

1. **이 워크플로우는 구현을 수행하지 않습니다.**
2. **사용자 프롬프트를 수정하지 않고 그대로 전달합니다.**
3. **사용자에게 플랜을 보여주고 동의를 구하지 않습니다.**
4. **모든 에이전트 호출은 오케스트레이터를 통해서만 이루어집니다.**

────────────────────────────────────────────────────────

## 실행 흐름

```
┌─────────────────────────────────────────────────────────────┐
│  사용자 프롬프트                                              │
│       ↓                                                     │
│  Orchestrator (초기화)                                       │
│       ↓                                                     │
│  Backend Developer                                          │
│       ↓                                                     │
│  Orchestrator (결과 수신 & 다음 지시)                          │
│       ↓                                                     │
│  Frontend Developer                                         │
│       ↓                                                     │
│  Orchestrator (결과 수신 & 다음 지시)                          │
│       ↓                                                     │
│  Reviewer                                                   │
│       ↓                                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PASS → Orchestrator → Done                          │    │
│  │ FAIL → Orchestrator (blockers 분석)                 │    │
│  │        → Backend (backend blockers)                 │    │
│  │        → Orchestrator                               │    │
│  │        → Frontend (frontend blockers)               │    │
│  │        → Orchestrator                               │    │
│  │        → Reviewer                                   │    │
│  │        (최대 2회 반복)                               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

────────────────────────────────────────────────────────

## 단계 생략 규칙

Orchestrator는 다음 조건에서 단계를 생략할 수 있습니다:

| 생략 가능 단계 | 조건 |
|----------------|------|
| Backend | 순수 프론트엔드 작업 (API/데이터 모델 변경 없음) |
| Frontend | 순수 백엔드 작업 (UI 변경 없음) |

**중요**: 생략 시 반드시 `skipped_phases`에 기록하고 사유를 명시해야 합니다.

────────────────────────────────────────────────────────

## 실행 지시

**시스템 제약**: 서브에이전트(Task로 호출된 에이전트)는 Task 도구를 사용할 수 없습니다.
따라서 메인 LLM이 Orchestrator의 지시에 따라 각 에이전트를 순차적으로 호출합니다.

### 실행 순서

1. **Orchestrator 호출** → 작업 분석 & 첫 번째 에이전트 지시 반환
2. **지시받은 에이전트 호출** (Backend 또는 Frontend)
3. **Orchestrator 재호출 (resume)** → 결과 수신 & 다음 에이전트 지시 반환
4. **다음 에이전트 호출** (Frontend 또는 Reviewer)
5. **Orchestrator 재호출 (resume)** → 결과 수신 & 다음 단계 결정
6. **반복** (Reviewer PASS까지 또는 최대 재작업 횟수 도달)

### ⚠️ 메인 LLM 규칙

- ✅ Orchestrator의 `next_action.agent` 지시에 따라 에이전트 호출
- ✅ 에이전트 완료 후 Orchestrator를 **resume**하여 결과 전달
- ✅ Orchestrator가 `phase: "done"`을 반환할 때까지 반복
- ✅ **초기화 후 `documentation_content.request_analysis` 확인 및 문서 작성**
- ✅ **완료 시 `documentation_content.final_report` 확인 및 문서 작성**
- ❌ Orchestrator 지시 없이 임의로 에이전트 호출 금지
- ❌ Orchestrator의 지시와 다른 에이전트 호출 금지
- ❌ **documentation_content 확인 없이 다음 단계 진행 금지**

### 실행 흐름 다이어그램

```
메인 LLM → Orchestrator (초기화)
        ← next_action + documentation_content

메인 LLM: ⚠️ 문서화 단계 (필수)
  1. documentation_content.request_analysis.should_write 확인
  2. should_write === true → Write(01-요청분석.md)
  3. next_action.agent 에이전트 호출

메인 LLM → Frontend Developer (지시 전달)
        ← 작업 완료 결과

메인 LLM → Orchestrator (resume, 결과 전달)
        ← next_action: {agent: "reviewer", ...}

메인 LLM → Reviewer (지시 전달)
        ← verdict: PASS/FAIL

메인 LLM → Orchestrator (resume, 결과 전달)
        ← phase: "done" + documentation_content

메인 LLM: ⚠️ 문서화 단계 (필수)
  1. documentation_content.final_report.should_write 확인
  2. should_write === true → Write(99-최종결과보고.md)
  3. 사용자에게 결과 보고

(FAIL 시 재작업 루프 반복)
```

────────────────────────────────────────────────────────

## 에이전트 호출 규칙

| 호출 주체    | 호출 가능 대상              |
| ------------ | --------------------------- |
| Workflow     | Orchestrator만              |
| Orchestrator | Backend, Frontend, Reviewer |
| Backend      | 없음 (결과만 반환)          |
| Frontend     | 없음 (결과만 반환)          |
| Reviewer     | 없음 (결과만 반환)          |

**중요**: Backend, Frontend, Reviewer는 서로를 직접 호출할 수 없습니다.
모든 전환은 Orchestrator를 통해 이루어집니다.

────────────────────────────────────────────────────────

## 피드백 루프 상세

### FAIL 발생 시 필수 흐름

```
1. Reviewer가 FAIL 반환
       ↓
2. Orchestrator가 blockers 수신
       ↓
3. Orchestrator가 blockers를 area별로 분류
   - backend blockers → Backend 재작업 지시
   - frontend blockers → Frontend 재작업 지시
       ↓
4. Orchestrator → Backend Developer (backend blockers만)
       ↓
5. Backend 완료 → Orchestrator 수신
       ↓
6. Orchestrator → Frontend Developer (frontend blockers만)
       ↓
7. Frontend 완료 → Orchestrator 수신
       ↓
8. Orchestrator → Reviewer (재검증)
       ↓
9. PASS → Done / FAIL → 3번으로 (최대 2회)
```

### 금지 패턴

❌ `Reviewer FAIL → Backend 직접 수정 → Frontend 직접 수정`
✅ `Reviewer FAIL → Orchestrator → Backend → Orchestrator → Frontend → Orchestrator → Reviewer`

────────────────────────────────────────────────────────

## 상태 추적

Orchestrator는 매 단계마다 다음 상태를 유지해야 합니다:

```json
{
  "phase": "backend | frontend | review | fix_backend | fix_frontend | done",
  "fix_round": 0,
  "max_fix_round": 2,
  "pending_blockers": {
    "backend": [],
    "frontend": [],
    "integration": []
  }
}
```

────────────────────────────────────────────────────────

## ⚠️ 문서화 규칙 (메인 LLM 필수 책임)

**시스템 제약**: 서브에이전트는 Write 도구를 사용할 수 없습니다.
따라서 메인 LLM이 Orchestrator의 `documentation_content`를 받아 **반드시** 문서를 작성해야 합니다.

### 문서 작성 시점

| 시점 | 조건 | 작성할 파일 |
|------|------|-------------|
| Orchestrator 초기화 후 | `documentation_content.request_analysis.should_write == true` | `01-요청분석.md` |
| 워크플로우 완료 시 | `documentation_content.final_report.should_write == true` | `99-최종결과보고.md` |

### ⚠️ 필수 체크리스트

#### Orchestrator 초기화 응답 수신 후

```
1. [ ] documentation_content 필드 존재 확인
2. [ ] documentation_content.request_analysis.should_write 값 확인
3. [ ] should_write === true 이면:
       → Write 도구로 즉시 파일 작성
       → file_path: documentation_content.request_analysis.file_path
       → content: documentation_content.request_analysis.content
4. [ ] 문서 작성 완료 후 next_action.agent 에이전트 호출
```

#### 워크플로우 완료 시 (phase: "done" 또는 "max_retry_exceeded")

```
1. [ ] documentation_content 필드 존재 확인
2. [ ] documentation_content.final_report.should_write 값 확인
3. [ ] should_write === true 이면:
       → Write 도구로 즉시 파일 작성
       → file_path: documentation_content.final_report.file_path
       → content: documentation_content.final_report.content
4. [ ] 문서 작성 완료 후 사용자에게 최종 결과 보고
```

### 메인 LLM 문서화 흐름

```
1. Orchestrator 호출
        ↓
2. 응답에서 documentation_content 확인
        ↓
3. request_analysis.should_write == true 이면
   → Write 도구로 request_analysis.file_path에 content 작성
        ↓
4. next_action.agent 에이전트 호출
        ↓
... (워크플로우 진행) ...
        ↓
N. 워크플로우 완료 (phase: "done" 또는 max_retry_exceeded)
        ↓
N+1. 응답에서 documentation_content 확인
        ↓
N+2. final_report.should_write == true 이면
     → Write 도구로 final_report.file_path에 content 작성
```

### 메인 LLM 필수 동작

```
# Orchestrator 초기화 응답 수신 후
if documentation_content.request_analysis.should_write == true:
    Write(
        file_path = documentation_content.request_analysis.file_path,
        content = documentation_content.request_analysis.content
    )

# 워크플로우 완료 응답 수신 후
if documentation_content.final_report.should_write == true:
    Write(
        file_path = documentation_content.final_report.file_path,
        content = documentation_content.final_report.content
    )
```

### ⚠️ 경고

- 문서 작성을 건너뛰면 워크플로우 이력이 **영구 소실**됩니다
- documentation_content가 누락된 경우 Orchestrator에게 재요청하세요
- 다음 단계 진행 전 반드시 문서 작성을 완료하세요
