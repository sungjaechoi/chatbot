# backend-developer.md 에이전트 상태 평가

> 작성일: 2026-02-09
> 평가 대상: `.claude/agents/backend-developer.md`
> 비교 기준: `doc/변경사항_요약_Supabase_마이그레이션.md`, 실제 코드베이스

---

## 1. 평가 요약

| 항목 | 판정 |
|------|------|
| **전체 상태** | **심각한 불일치 (OUTDATED)** |
| 설명(description) | ChromaDB 참조 — 실제는 Supabase pgvector |
| 핵심 책임 (섹션 1) | Chroma 로컬 DB 기준 — 실제는 Supabase RPC |
| 절대 규칙 (섹션 2) | "로컬/프라이빗 우선", "로컬 개발 환경 타깃" — 실제는 Vercel 배포 |
| 구현 기준 (섹션 3) | 로컬 파일 IO 기준 — 실제는 Supabase Storage |
| Chroma 설계 원칙 (섹션 4) | 전체 섹션이 무효 |
| RAG 응답 품질 (섹션 5) | 일부 유효 (범용적 원칙) |
| 코드 품질 기준 (섹션 6) | 유효 (범용적 기준) |
| 출력 가이드 (섹션 7) | 일부 불일치 (`chromadb` 의존성 참조) |
| 완료 조건 (섹션 8) | Chroma 기반 end-to-end 기준 — 실제와 불일치 |

---

## 2. 항목별 상세 분석

### 2.1 YAML Front Matter (description)

**현재 (`backend-developer.md`)**
```
"LangChain + 로컬 Chroma 벡터 스토어 기반 RAG 백엔드 로직을 구현할 때 사용하는 에이전트입니다."
```

**실제 코드베이스**
- `chromadb` 패키지 제거됨 (`package.json` 변경)
- `src/shared/lib/chroma.ts` 삭제됨
- 벡터 스토어: Supabase pgvector (`match_documents` RPC)
- 파일 저장: Supabase Storage

**판정**: 설명 전체 재작성 필요

---

### 2.2 핵심 책임 (섹션 1)

| 에이전트 문서 내용 | 실제 코드베이스 | 불일치 |
|-------------------|----------------|--------|
| "Chroma 로컬 DB에 저장/업서트" | `adminSupabase.from('pdf_documents').upsert()` | **불일치** |
| "임베딩 생성" | Vercel AI SDK `embed()` / `embedMany()` 사용 | 부분 일치 (LangChain이 아닌 Vercel AI SDK) |
| "Retriever로 유사도 검색" | `supabase.rpc('match_documents')` — LangChain Retriever 아님 | **불일치** |
| "Next AI Gateway를 통한 LLM 호출" | Vercel AI Gateway 사용 | 일치 |
| "문서 로딩/전처리" | `pdf-parse` + Supabase Storage 다운로드 | 부분 일치 |

**판정**: LangChain 파이프라인 의존도가 크게 줄었고, Supabase RPC + Vercel AI SDK 중심으로 전환됨

---

### 2.3 절대 규칙 (섹션 2)

| 규칙 | 실제 상태 | 불일치 |
|------|----------|--------|
| "로컬/프라이빗 우선" | Supabase 클라우드 서비스 사용 | **불일치** |
| "Chroma는 로컬 영속(persist) 모드" | ChromaDB 완전 제거 | **무효** |
| "로컬 개발 환경을 기본 타깃" | Vercel 배포 환경 타깃 | **불일치** |
| "외부 호스팅 벡터DB 변경 제안 금지" | 이미 Supabase pgvector로 변경 완료 | **무효** |

**판정**: 배포 환경 전환으로 4개 규칙 중 3개가 현실과 충돌

---

### 2.4 구현 기준 (섹션 3)

| 기준 | 실제 코드 | 불일치 |
|------|----------|--------|
| "파일 IO는 프로젝트 루트 하위 고정 디렉토리" | Supabase Storage 사용 (`supabase.storage.from('pdfs')`) | **불일치** |
| "예: `./data/chroma` 또는 `./chroma_db`" | 해당 디렉토리 없음 | **무효** |
| "Chroma 클라이언트 생성/재사용 구조" | Supabase Admin Client 싱글턴 | **불일치** |
| "App Router Route Handler 사용" | 동일 | 일치 |
| "Node runtime 기본" | 동일 | 일치 |

**판정**: 인프라 관련 기준이 전면 교체 필요

---

### 2.5 Chroma(Local) 설계 원칙 (섹션 4) — 전체 무효

이 섹션은 ChromaDB 전용 설계 지침으로, 현재 코드베이스에 해당 사항이 **전혀 없음**.

| 원칙 | 실제 대응 |
|------|----------|
| "collection 이름은 명확하고 고정" | `pdf_documents` 테이블의 `pdf_id` 컬럼으로 대체 |
| "metadata에 source, chunk_index, page..." | `pdf_documents` 테이블 컬럼으로 대체 (`page_number`, `file_name`, `snippet`) |
| "chunking 전략 조절" | 페이지 단위 분할 (chunking 없음) |
| "Retriever 설정(k 값, score threshold)" | `match_documents` RPC의 `match_count` 파라미터 |

**판정**: "Supabase pgvector 설계 원칙"으로 전면 교체 필요

---

### 2.6 출력 가이드 — 작업 완료 보고 (섹션 7.2)

```json
"dependencies_added": ["chromadb", "@ai-sdk/google"]
```

**실제**: `chromadb` 제거됨. `@supabase/supabase-js`, `@supabase/ssr` 추가됨.

**판정**: 예시 업데이트 필요

---

### 2.7 완료 조건 (섹션 8)

| 조건 | 실제 상태 |
|------|----------|
| "Chroma에 문서가 저장되고" | `pdf_documents` 테이블에 저장 |
| "질의 시 retrieval이 수행되며" | `match_documents` RPC로 수행 |
| "LLM 응답이 정상 반환" | 동일 |

**판정**: Chroma 참조를 Supabase로 교체 필요

---

### 2.8 유효한 섹션 (변경 불필요)

| 섹션 | 상태 |
|------|------|
| 역할 경계 (최우선 준수) | 유효 — 오케스트레이터 지시 준수 원칙 |
| RAG 응답 품질 원칙 (섹션 5) | 유효 — 범용적 RAG 설계 원칙 |
| 코드 품질 기준 (섹션 6) | 유효 — 보안, 에러 처리, 타입 안전성 등 범용적 기준 |
| 출력 가이드 - 형식 (섹션 7.1) | 유효 |
| 재작업 지시 수신 규칙 (섹션 9) | 유효 |

---

## 3. 연관 에이전트 영향도

`backend-developer.md`만 불일치하는 것이 아닌, **다른 에이전트도 동일한 문제를 공유**함:

| 에이전트 | 불일치 내용 | 심각도 |
|----------|-----------|--------|
| `orchestrator.md` | 설명 없음 (범용적이므로 직접 영향 적음) | 낮음 |
| `reviewer.md` | "LangChain + 로컬 Chroma" 리뷰 범위 기술 → 실제는 Supabase | **높음** |
| `reviewer.md` | "Chroma 로컬 persist" 검증 항목 → 존재하지 않는 시스템 검증 | **높음** |

---

## 4. 누락된 개념 (에이전트 문서에 없는 실제 패턴)

마이그레이션으로 도입되었으나 `backend-developer.md`에 언급되지 않은 핵심 개념들:

| 개념 | 설명 | 관련 파일 |
|------|------|----------|
| **Supabase Auth** | 모든 API에서 `supabase.auth.getUser()` 인증 필수 | 모든 route.ts |
| **Admin Client** | `service_role` 키 기반 RLS 우회 클라이언트 | `src/shared/lib/supabase/admin.ts` |
| **Server Client** | 쿠키 기반 인증 사용자 컨텍스트 | `src/shared/lib/supabase/server.ts` |
| **RLS (Row Level Security)** | 사용자 격리를 DB 레벨에서 보장 | `supabase/schema.sql` |
| **Supabase Storage** | PDF 파일 클라우드 저장 (10MB 제한) | `src/shared/lib/pdf-loader.ts` |
| **RPC 함수** | `match_documents`, `get_user_collections` | `supabase/schema.sql` |
| **채팅 기록 영속화** | `chat_sessions` + `chat_messages` 테이블 | `src/app/api/chat/route.ts` |
| **작업 목록 (Tasks)** | `tasks` 테이블 CRUD | `src/app/api/tasks/` |
| **Vercel 배포 제약** | 4.5MB body 제한, 10초 타임아웃 | 클라이언트 직접 업로드 방식 |

---

## 5. 불일치 수준 요약

```
섹션별 불일치율:

YAML description  ████████████████████ 100% 불일치
섹션 1 (핵심 책임) ██████████████░░░░░░  70% 불일치
섹션 2 (절대 규칙) ███████████████░░░░░  75% 불일치
섹션 3 (구현 기준) ████████████░░░░░░░░  60% 불일치
섹션 4 (Chroma)   ████████████████████ 100% 무효
섹션 5 (RAG 품질) ░░░░░░░░░░░░░░░░░░░░   0% (유효)
섹션 6 (코드 품질) ░░░░░░░░░░░░░░░░░░░░   0% (유효)
섹션 7 (출력 가이드)████░░░░░░░░░░░░░░░░  20% 불일치
섹션 8 (완료 조건) ████████████░░░░░░░░  60% 불일치
섹션 9 (재작업)   ░░░░░░░░░░░░░░░░░░░░   0% (유효)
```

---

## 6. 결론 및 권고

### 판정: 즉시 업데이트 필요

`backend-developer.md`는 **Supabase 마이그레이션 이전 상태**를 기술하고 있어,
현재 코드베이스와 **약 55~60%가 불일치**합니다.

이 상태로 에이전트를 사용할 경우:
- ChromaDB 기반 코드를 생성할 위험
- 로컬 파일 시스템 의존 코드를 작성할 위험
- 인증 로직을 누락할 위험
- Supabase RLS 패턴을 무시할 위험

### 권고 업데이트 항목 (우선순위순)

| 우선순위 | 항목 | 작업 |
|---------|------|------|
| **P0** | YAML description | "Supabase pgvector + Storage 기반 RAG 백엔드" 로 변경 |
| **P0** | 섹션 4 (Chroma 설계 원칙) | "Supabase pgvector 설계 원칙"으로 전면 교체 |
| **P0** | 섹션 2 (절대 규칙) | 배포 환경(Vercel + Supabase) 제약 반영 |
| **P1** | 섹션 1 (핵심 책임) | Supabase 클라이언트 사용 패턴 반영 |
| **P1** | 섹션 3 (구현 기준) | Supabase Storage/RPC/Auth 기준으로 변경 |
| **P1** | 인증 패턴 추가 | Admin/Server/Browser 클라이언트 구분 규칙 추가 |
| **P2** | 섹션 7.2 (출력 예시) | `chromadb` → `@supabase/supabase-js` 등 |
| **P2** | 섹션 8 (완료 조건) | Supabase 기반 end-to-end 기준으로 변경 |
| **P2** | `reviewer.md` 연동 | 리뷰 범위에서 Chroma 참조 제거 |
