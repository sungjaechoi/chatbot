# Document Chat

PDF 문서를 업로드하고 AI와 대화하는 RAG(Retrieval-Augmented Generation) 챗봇입니다.

업로드한 PDF를 벡터 임베딩으로 변환하여 저장하고, 질문 시 관련 문맥을 검색해 정확한 답변을 생성합니다.

## 주요 기능

- **PDF 기반 RAG 대화** — PDF 업로드 → 텍스트 추출 → 임베딩 → 벡터 유사도 검색 → LLM 답변 (출처 페이지 포함)
- **다중 세션** — 하나의 PDF에서 주제별로 여러 대화 세션을 생성·관리
- **크레딧 시스템** — 사용자별 API 사용량을 토큰 단위로 추적하고 잔액 표시
- **Google OAuth 인증** — Supabase Auth 기반 로그인, 미들웨어 라우트 보호
- **테마 전환** — Light / Dark / System 3단 토글
- **회원 탈퇴** — 소프트 딜리트 후 30일 유예, 재가입 시 자동 복구

## 기술 스택

| 영역             | 기술                                             |
| ---------------- | ------------------------------------------------ |
| **프레임워크**   | Next.js 15 (App Router), React 19                |
| **인증**         | Supabase Auth (Google OAuth)                     |
| **데이터베이스** | Supabase PostgreSQL + pgvector                   |
| **파일 저장소**  | Supabase Storage                                 |
| **AI / LLM**     | Vercel AI SDK, LangChain                         |
| **임베딩**       | Google text-embedding-004 (3072차원)             |
| **LLM 모델**     | Google Gemini 2.5 Flash                          |
| **상태 관리**    | Zustand                                          |
| **스타일링**     | Tailwind CSS v4, CSS Variables, Material Symbols |
| **배포**         | Vercel                                           |

## Claude Code 활용

이 프로젝트는 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)의 커스텀 에이전트 시스템을 활용하여 개발되었습니다. `.claude/` 디렉토리에 5개의 전문 에이전트와 2개의 커스텀 커맨드를 정의하여, 단일 명령으로 DB 스키마 설계부터 백엔드·프론트엔드 구현, 코드 리뷰까지 자동화된 개발 파이프라인을 구성했습니다.

### 에이전트 파이프라인

`/workflow` 커맨드를 실행하면 Orchestrator가 아래 순서로 전문 에이전트를 호출합니다:

```
사용자 요청
    ↓
Orchestrator ─── 요청 분석 & 작업 계획 수립
    ↓
Schema Developer ─── DB 테이블/RLS/RPC 설계 (필요 시)
    ↓
Backend Developer ─── API 라우트 & RAG 파이프라인 구현
    ↓
Frontend Developer ─── UI 컴포넌트 & 상태 관리 구현
    ↓
Reviewer ─── 보안·품질·통합 검증 (PASS/FAIL)
    ↓
  FAIL → Orchestrator가 blocker 분류 후 재작업 지시 (최대 2회)
  PASS → 완료 보고서 자동 생성
```

### 에이전트 구성

| 에이전트               | 역할                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| **Orchestrator**       | 파이프라인 지휘자. 작업 분석, 에이전트 호출 순서 결정, 상태 추적, 리뷰 실패 시 재작업 루프 관리 |
| **Schema Developer**   | Supabase DB 스키마 변경 전문. 마이그레이션/롤백 SQL, RLS 정책, pgvector 인덱스 설계             |
| **Backend Developer**  | Next.js API 라우트 구현. Supabase 연동, RAG 파이프라인, Vercel 배포 제약 고려                   |
| **Frontend Developer** | React UI 구현. Container/View 패턴, Zustand 상태 관리, 접근성·반응형 처리                      |
| **Reviewer**           | 코드 품질 검증. 보안·타입·성능·UX를 PASS/FAIL로 판정하고, 실패 시 구체적 수정 지시 제공        |

### 커스텀 커맨드

| 커맨드             | 용도                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `/workflow`        | 표준 개발 파이프라인 실행. 사용자 프롬프트를 Orchestrator에 전달하여 전체 흐름 시작             |
| `/frontend-design` | 프로덕션 수준의 고품질 UI 생성. 디자인 컨셉·톤·차별화 포인트를 정의한 뒤 코드 생성             |

### 작업 기록

모든 워크플로우 실행 결과는 `doc/workflow/` 디렉토리에 자동 기록됩니다:

```
doc/workflow/{YYYYMMDD}-{작업명}/
├── 01-요청분석.md      # 요구사항, 작업 범위, 완료 조건, 실행 계획
└── 99-최종결과보고.md   # 변경 파일, API 변경, 스키마 변경, 미해결 사항
```

## 아키텍처

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Next.js App     │────▶│  Supabase       │
│             │     │  (API Routes)    │     │  - PostgreSQL   │
│  React 19   │     │                  │     │  - pgvector     │
│  Zustand    │     │  Vercel AI SDK   │     │  - Storage      │
│  Tailwind   │     │  LangChain       │     │  - Auth         │
└─────────────┘     └──────────────────┘     └─────────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │  AI Gateway      │
                    │  (Google Gemini) │
                    └──────────────────┘
```

### 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API 라우트
│   │   ├── chat/                 #   채팅 (스트리밍 응답, 세션 CRUD)
│   │   ├── pdf/                  #   PDF 업로드·임베딩·삭제
│   │   ├── collections/          #   문서 목록 조회
│   │   ├── credits/              #   크레딧 잔액·사용량
│   │   ├── account/              #   회원 탈퇴·재활성화
│   │   └── cron/                 #   크론잡 (유저 정리, keep-alive)
│   ├── chat/[pdfId]/             # 채팅 페이지
│   ├── login/                    # 로그인 페이지
│   └── auth/callback/            # OAuth 콜백
│
├── features/                     # 기능별 모듈 (Container/View 패턴)
│   ├── chat/                     #   채팅 레이아웃, 사이드바, 메시지
│   ├── home/                     #   홈 대시보드
│   └── pdf/                      #   PDF 업로드, 문서 목록
│
├── shared/                       # 공통 모듈
│   ├── components/               #   UI 컴포넌트
│   ├── hooks/                    #   useAuth, useCredits
│   ├── lib/
│   │   ├── langchain/            #   RAG 파이프라인 (임베딩, 검색, 생성)
│   │   └── supabase/             #   클라이언트 (admin / server / browser)
│   ├── stores/                   #   Zustand 스토어
│   └── types/
│
└── middleware.ts                  # 인증 미들웨어
```

## 사용자 플로우

### 1. 로그인

```
로그인 페이지 → Google OAuth → Supabase Auth 콜백 → 프로필 자동 생성 → 홈으로 이동
```

### 2. PDF 업로드 → 대화 시작

```
[홈] PDF 업로드 클릭
  → 파일 선택 (최대 10MB)
  → Supabase Storage에 직접 업로드 (Vercel 4.5MB 제한 우회)
  → 서버에서 텍스트 추출 + 청크 분할
  → Google Embedding API로 벡터 변환
  → pgvector에 저장
  → 채팅 페이지로 자동 이동
```

### 3. RAG 대화

```
[채팅] 질문 입력
  → 질문을 벡터 임베딩으로 변환
  → pgvector에서 유사도 높은 청크 Top-K 검색
  → 검색된 문맥 + 대화 히스토리 → LLM 프롬프트 생성
  → Gemini가 스트리밍 응답 생성
  → 출처(페이지 번호, 관련도) 함께 표시
```

### 4. 문서 관리

```
[홈] 문서 카드 그리드
  → 카드 클릭: 해당 PDF 채팅으로 이동
  → 삭제: Storage 파일 + 벡터 데이터 + 채팅 기록 일괄 삭제
```

## DB 스키마

| 테이블              | 설명                                              |
| ------------------- | ------------------------------------------------- |
| `profiles`          | 사용자 프로필 (OAuth 연동, 크레딧 누적)           |
| `pdf_documents`     | PDF 벡터 데이터 (content, embedding, page_number) |
| `chat_sessions`     | 채팅 세션 (PDF당 다중 세션)                       |
| `chat_messages`     | 메시지 (role, content, sources, usage)            |
| `credit_usage_logs` | 토큰 사용 로그 (모델별 비용 추적)                 |

### RPC 함수

- `match_documents()` — 벡터 코사인 유사도 검색
- `get_user_collections()` — 사용자별 PDF 목록 집계
- `get_user_credit_usage_summary()` — 크레딧 사용 요약
- `cleanup_deleted_users()` — 소프트 딜리트 30일 경과 사용자 정리

## 시작하기

### 사전 요구사항

- Node.js 18+
- Supabase 프로젝트 (pgvector 확장 활성화)
- AI Gateway API 키 (Google Gemini)

### 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Gateway
AI_GATEWAY_API_KEY=

# 모델 설정
EMBEDDING_MODEL=google/text-embedding-004
LLM_MODEL=google/gemini-2.5-flash

# RAG 설정
TOP_K=6
CHAT_HISTORY_LIMIT=10

# Cron 인증
CRON_SECRET=
```

### 설치 및 실행

```bash
# 의존성 설치 (peer dep 충돌로 --legacy-peer-deps 필요)
npm install --legacy-peer-deps

# DB 스키마 적용
# supabase/schema.sql을 Supabase SQL Editor에서 실행

# 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

### 빌드

```bash
npm run build
npm start
```

### Vercel Cron Jobs

`vercel.json`에 크론잡이 설정되어 있습니다:

- `/api/cron/cleanup-users` — 소프트 딜리트 사용자 30일 후 자동 삭제
- `/api/cron/keep-alive` — 콜드 스타트 방지 웜업
