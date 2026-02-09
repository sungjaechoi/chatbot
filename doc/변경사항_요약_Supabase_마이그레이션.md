# 변경사항 요약 — Supabase 마이그레이션 & 배포 준비

> 작성일: 2026-02-09
> 관련 문서: `배포_실용성_검증_Vercel_Supabase.md`, `수동_설정_가이드_Vercel_Supabase.md`

---

## 1. 왜 이 작업이 필요했는가?

기존 프로젝트는 **로컬 환경 전용** 구조였다:

| 구성 요소 | 기존 (로컬 전용) | 문제점 |
|-----------|-----------------|--------|
| 벡터 스토어 | ChromaDB (localhost:8000) | 별도 서버 필요, 배포 불가 |
| 파일 저장 | 로컬 파일시스템 (`/tmp/pdf-uploads`) | Vercel Serverless는 /tmp 미지원 |
| 인증 | 없음 | 누구나 접근 가능 |
| 데이터 영속성 | 없음 (메모리/로컬만) | 채팅 기록·작업 목록 유실 |

**Vercel + Supabase 무료 플랜**으로 배포하려면 이 4가지 의존성을 모두 제거해야 했다.

`배포_실용성_검증_Vercel_Supabase.md`는 이 마이그레이션이 기술적으로 가능한지, 무료 플랜 제한에 걸리지 않는지를 사전 검증한 문서이다.

---

## 2. 변경된 파일 전체 목록

### 2.1 삭제된 파일

| 파일 | 이유 |
|------|------|
| `src/shared/lib/chroma.ts` | ChromaDB 클라이언트 → Supabase로 대체되어 불필요 |

### 2.2 수정된 파일 (21개)

| 파일 | 변경 내용 | 카테고리 |
|------|----------|----------|
| `package.json` | `chromadb` 제거, `@supabase/supabase-js` + `@supabase/ssr` 추가 | 의존성 |
| `package-lock.json` | 위 변경에 따른 lock 파일 갱신 | 의존성 |
| `next.config.ts` | Supabase 관련 빌드 설정 추가 | 설정 |
| `src/shared/lib/langchain/embeddings.ts` | 임베딩 모델 설정 수정 | 벡터 스토어 |
| `src/shared/lib/langchain/retriever.ts` | ChromaDB 쿼리 → Supabase `match_documents` RPC 호출로 변경 | 벡터 스토어 |
| `src/shared/lib/pdf-loader.ts` | 로컬 파일 읽기 → Supabase Storage에서 다운로드로 변경 | 파일 저장 |
| `src/app/api/pdf/upload/route.ts` | 로컬 저장 → Supabase Storage 직접 업로드 방식으로 변경 | 파일 저장 |
| `src/app/api/pdf/[pdfId]/save/route.ts` | ChromaDB upsert → Supabase `pdf_documents` 테이블 insert | 벡터 스토어 |
| `src/app/api/pdf/[pdfId]/route.ts` | ChromaDB 컬렉션 삭제 → Supabase 행 삭제 + Storage 파일 삭제 | 벡터 스토어 |
| `src/app/api/collections/route.ts` | ChromaDB listCollections → Supabase `get_user_collections` RPC | 벡터 스토어 |
| `src/app/api/chat/route.ts` | 컬렉션 존재 확인 변경 + 채팅 메시지 DB 저장 로직 추가 | 벡터 스토어 + 채팅 기록 |
| `src/app/api/evaluate/route.ts` | 인증 컨텍스트 적용 | 인증 |
| `src/app/page.tsx` | 대규모 축소 — 로직을 `HomeClient.tsx`로 분리 | 리팩토링 |
| `src/app/chat/[pdfId]/page.tsx` | 대규모 축소 — 로직을 `ChatPageClient.tsx`로 분리 | 리팩토링 |
| `src/features/chat/ChatView.tsx` | 채팅 기록 불러오기 UI 반영 | 채팅 기록 |
| `src/features/pdf/PdfUploadContainer.tsx` | Supabase Storage 직접 업로드 방식으로 변경 | 파일 저장 |
| `src/features/pdf/PdfUploadModalContainer.tsx` | 위와 동일 | 파일 저장 |
| `src/shared/stores/chatStore.ts` | 채팅 기록 복원(hydrate) 로직 추가 | 채팅 기록 |
| `src/shared/stores/pdfStore.ts` | Supabase 연동 반영 | 상태 관리 |
| `src/shared/types/index.ts` | 새 타입 정의 추가 (Task, ChatSession 등) | 타입 |

### 2.3 신규 추가된 파일

#### 인증 시스템
| 파일 | 역할 |
|------|------|
| `src/middleware.ts` | 모든 요청에서 Supabase 세션 검증, 미인증 시 `/login` 리다이렉트 |
| `src/app/login/page.tsx` | Google OAuth 로그인 페이지 |
| `src/app/auth/callback/` | OAuth 콜백 처리 (code → session 교환) |
| `src/shared/hooks/useAuth.ts` | 클라이언트 인증 상태 훅 |

#### Supabase 클라이언트 유틸리티
| 파일 | 역할 |
|------|------|
| `src/shared/lib/supabase/admin.ts` | `service_role` 키 기반 — RLS 우회 서버 전용 클라이언트 |
| `src/shared/lib/supabase/server.ts` | 쿠키 기반 — API 라우트에서 인증된 사용자 컨텍스트 |
| `src/shared/lib/supabase/client.ts` | 브라우저용 Supabase 클라이언트 |
| `src/shared/lib/supabase/middleware.ts` | 미들웨어 전용 세션 갱신 로직 |
| `src/shared/lib/supabase/chat-service.ts` | 채팅 기록 CRUD 서비스 |
| `src/shared/lib/supabase/task-service.ts` | 작업 목록 CRUD 서비스 |

#### 작업 목록 기능 (신규)
| 파일 | 역할 |
|------|------|
| `src/app/api/tasks/route.ts` | 작업 목록 API (GET/POST) |
| `src/app/api/tasks/[taskId]/` | 개별 작업 API (PATCH/DELETE) |
| `src/features/tasks/TaskListContainer.tsx` | 작업 목록 로직 컨테이너 |
| `src/features/tasks/TaskListView.tsx` | 작업 목록 UI (입력 + 리스트) |
| `src/features/tasks/TaskItemView.tsx` | 개별 작업 아이템 UI (완료 토글, 삭제) |
| `src/shared/stores/taskStore.ts` | 작업 목록 Zustand 스토어 |

#### 채팅 기록 영속화 (신규)
| 파일 | 역할 |
|------|------|
| `src/app/api/chat/history/route.ts` | 채팅 기록 조회 API |

#### 페이지 리팩토링
| 파일 | 역할 |
|------|------|
| `src/features/home/HomeClient.tsx` | 홈 페이지 클라이언트 컴포넌트 (기존 `page.tsx`에서 분리) |
| `src/features/chat/ChatPageClient.tsx` | 채팅 페이지 클라이언트 컴포넌트 (기존 `page.tsx`에서 분리) |

#### 인프라 & 배포
| 파일 | 역할 |
|------|------|
| `supabase/schema.sql` | 전체 DB 스키마 (5 테이블 + 2 RPC + Storage 버킷 + RLS) |
| `vercel.json` | Vercel 크론 설정 (Supabase 비활성 방지 ping) |
| `src/app/api/cron/keep-alive/` | 5일마다 Supabase에 ping하는 크론 API |

#### 문서
| 파일 | 역할 |
|------|------|
| `doc/배포_실용성_검증_Vercel_Supabase.md` | 무료 플랜 배포 가능 여부 사전 검증 |
| `doc/수동_설정_가이드_Vercel_Supabase.md` | Supabase/Google OAuth/Vercel 수동 설정 가이드 |

---

## 3. 아키텍처 변화 요약

```
[변경 전]                              [변경 후]
┌─────────────┐                       ┌─────────────┐
│  Next.js    │                       │  Next.js    │
│  (로컬 dev) │                       │  (Vercel)   │
└──────┬──────┘                       └──────┬──────┘
       │                                     │
  ┌────┴────┐                          ┌─────┴──────┐
  │ChromaDB │ ← 벡터 검색              │ Supabase   │ ← 통합 백엔드
  │localhost │                         │            │
  └─────────┘                          │ ├─ pgvector│ ← 벡터 검색
                                       │ ├─ Auth    │ ← Google OAuth
  ┌─────────┐                          │ ├─ Storage │ ← PDF 파일
  │/tmp 로컬 │ ← PDF 저장              │ ├─ RDB     │ ← 채팅/작업/프로필
  └─────────┘                          │ └─ RLS     │ ← 사용자 격리
                                       └────────────┘
  인증: 없음                           인증: Google OAuth
  영속성: 없음                         영속성: 완전 (DB + Storage)
```

---

## 4. `배포_실용성_검증_Vercel_Supabase.md`가 추가된 이유

이 문서는 **마이그레이션 착수 전 의사결정 근거**로 작성되었다:

1. **Vercel Hobby 무료 플랜 제한 분석** — Function 10초 타임아웃, Request Body 4.5MB 제한 등이 프로젝트에 미치는 영향 검증
2. **Supabase Free 플랜 제한 분석** — 500MB DB 한도로 벡터 데이터 + 채팅 기록이 감당 가능한지 시뮬레이션
3. **기능별 구현 실용성** — Google OAuth, 작업 목록, 채팅 기록, pgvector 마이그레이션 각각의 난이도/용량 추정
4. **작업 체크리스트** — 전체 마이그레이션에 필요한 11단계 작업을 순서대로 정리
5. **리스크 대응** — 타임아웃, DB 용량 초과, 비활성 일시정지 등에 대한 사전 대응 전략

**핵심 결론**: $0/월로 배포 가능하되, PDF 업로드 방식 변경(클라이언트 → Supabase Storage 직접 업로드)과 채팅 기록 보관 정책이 필요하다는 것을 사전에 확인했다.

---

## 5. 스크린샷의 "작업 목록" 기능

스크린샷에 보이는 **작업 목록** UI는 이번 마이그레이션에서 새로 추가된 기능이다:

- `tasks` 테이블 (Supabase RDB) 에 사용자별 작업 저장
- RLS 정책으로 본인 작업만 CRUD 가능
- Container/View 패턴 적용 (`TaskListContainer` → `TaskListView` → `TaskItemView`)
- Zustand `taskStore`로 클라이언트 상태 관리
- `배포_실용성_검증` 문서의 §4.3에서 "구현 복잡도 ⭐⭐(낮음)"으로 판정된 후 구현됨
