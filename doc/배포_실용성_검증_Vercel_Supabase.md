# PDF RAG 챗봇 — Vercel + Supabase 무료 플랜 배포 실용성 검증

> 작성일: 2026-02-09
> 대상 프로젝트: Next.js 15 기반 PDF RAG 챗봇
> 검증 범위: Vercel Hobby(무료) + Supabase Free 플랜으로 전체 서비스 배포 가능 여부

---

## 1. 현재 프로젝트 아키텍처 분석

### 1.1 기술 스택 현황

| 구성 요소 | 현재 기술 | 비고 |
|-----------|-----------|------|
| 프레임워크 | Next.js 15 (App Router) | React 19, TypeScript |
| 상태관리 | Zustand | 클라이언트 전용 |
| LLM 호출 | Vercel AI SDK → AI Gateway | google/gemini-2.5-flash |
| 임베딩 | Vercel AI SDK → AI Gateway | google/text-embedding-005 (768차원) |
| 벡터 스토어 | ChromaDB (자체 호스팅) | HTTP 클라이언트, localhost:8000 |
| PDF 처리 | pdf-parse | Node.js 런타임 필수 |
| 파일 저장 | 로컬 파일시스템 | /tmp/pdf-uploads |
| 인증 | 없음 | - |
| RDB | 없음 | - |

### 1.2 API 라우트 목록

| 엔드포인트 | 메서드 | 기능 | 런타임 |
|-----------|--------|------|--------|
| `/api/pdf/upload` | POST | PDF 업로드 (multipart/form-data) | Node.js |
| `/api/pdf/[pdfId]/save` | POST | PDF 파싱 → 임베딩 → ChromaDB 저장 | Node.js |
| `/api/pdf/[pdfId]` | DELETE | PDF 파일 및 ChromaDB 컬렉션 삭제 | Node.js |
| `/api/chat` | POST | RAG 파이프라인 (질의→검색→LLM 응답) | Node.js |
| `/api/collections` | GET | 저장된 PDF 컬렉션 목록 조회 | Node.js |
| `/api/credits` | GET | Vercel AI Gateway 크레딧 조회 | Node.js |

### 1.3 배포를 위해 해결해야 할 핵심 과제

1. **ChromaDB 의존성 제거**: 자체 호스팅 ChromaDB → Supabase pgvector로 마이그레이션
2. **파일시스템 의존성 제거**: /tmp 로컬 저장 → Supabase Storage로 마이그레이션
3. **인증 시스템 추가**: Google OAuth 로그인 구현
4. **RDB 스키마 설계**: 사용자, 작업 목록, 채팅 기록 테이블
5. **벡터 스토어 마이그레이션**: ChromaDB → Supabase pgvector

---

## 2. Vercel Hobby(무료) 플랜 검증

### 2.1 주요 제한 사항

| 항목 | 제한 | 프로젝트 영향도 |
|------|------|---------------|
| Serverless Function 실행 시간 | 최대 10초 | ⚠️ **주의** — PDF 파싱+임베딩 시 초과 가능 |
| Serverless Function 메모리 | 1,024 MB | ✅ 충분 |
| Function 번들 크기 | 250 MB (비압축) | ✅ 충분 |
| Request Body 크기 | 4.5 MB | ⚠️ **주의** — 현재 PDF 10MB 제한과 충돌 |
| 배포당 Functions 수 | 12개 | ✅ 현재 6개 라우트로 충분 |
| 월간 Function 호출 | 1,000,000회 | ✅ 개인 프로젝트에 충분 |
| 월간 대역폭 | 100 GB | ✅ 충분 |
| 월간 빌드 시간 | 6,000분 | ✅ 충분 |
| 환경변수 총 크기 | 64 KB | ✅ 충분 |

### 2.2 호환성 평가

**✅ 완전 호환 항목**
- Next.js 15 App Router — Vercel이 Next.js 제작사이므로 최적 지원
- TypeScript — 제로 설정 지원
- Vercel AI SDK / AI Gateway — 네이티브 통합
- Zustand (클라이언트 상태관리) — 프론트엔드 전용이므로 제한 없음
- SSR / SSG — 완전 지원
- Tailwind CSS — 빌드 타임 처리이므로 제한 없음

**⚠️ 수정 필요 항목**

| 이슈 | 상세 | 해결 방안 |
|------|------|----------|
| Function 10초 제한 | PDF 파싱 + 대량 임베딩 생성이 10초를 초과할 수 있음 | 1) PDF 업로드와 임베딩을 비동기 분리 2) 페이지 단위 청크로 분할 처리 3) 클라이언트에서 순차 요청 |
| Request Body 4.5MB | 현재 10MB PDF 업로드 제한과 충돌 | 1) Supabase Storage에 직접 업로드 (클라이언트→Supabase) 후 URL 전달 2) PDF 크기 제한을 4MB로 하향 |
| /tmp 임시성 | Vercel Serverless의 /tmp는 요청 간 공유 불가 | Supabase Storage로 완전 마이그레이션 |
| 상업적 사용 불가 | Hobby 플랜은 개인/비상업 용도만 허용 | 상업 목적 시 Pro 플랜 ($20/월) 필요 |

### 2.3 판정: ✅ 배포 가능 (수정 필요)

Next.js 프로젝트 배포에 Vercel은 최적의 선택이다. 단, PDF 업로드 크기 제한과 Function 실행 시간에 대한 아키텍처 수정이 필요하다.

---

## 3. Supabase Free 플랜 검증

### 3.1 주요 제한 사항

| 항목 | 제한 | 프로젝트 영향도 |
|------|------|---------------|
| 프로젝트 수 | 2개 | ✅ 1개면 충분 |
| DB 크기 | 500 MB | ⚠️ **핵심 병목** — 벡터 데이터 + RDB 합산 |
| 파일 스토리지 | 1 GB | ✅ PDF 저장에 충분 (100개 × 10MB = 1GB) |
| 파일 업로드 최대 크기 | 50 MB | ✅ 충분 |
| 월간 활성 사용자 (MAU) | 50,000 | ✅ 충분 |
| Edge Function 호출 | 500,000회/월 | ✅ 충분 |
| 스토리지 egress | 2 GB | ⚠️ PDF 다운로드가 많으면 부족할 수 있음 |
| 비활성 시 자동 일시정지 | 7일 | ⚠️ **주의** — 주기적 접속 또는 크론 필요 |

### 3.2 pgvector (벡터 스토어) 검증

| 항목 | 상세 | 판정 |
|------|------|------|
| pgvector 확장 사용 | Free 플랜에서 사용 가능 | ✅ |
| 최대 벡터 차원 | HNSW 인덱스 기준 4,000차원 | ✅ (현재 768차원) |
| 벡터 수 제한 | 별도 제한 없음 (DB 용량 내) | ✅ |
| 코사인 유사도 검색 | 지원 (`<=>` 연산자) | ✅ |
| 인덱스 타입 | IVFFlat, HNSW 모두 지원 | ✅ |

**벡터 저장 용량 추정**

현재 프로젝트는 768차원 임베딩(Google text-embedding-005)을 사용한다.

```
1개 벡터 = 768차원 × 4바이트(float32) = 약 3 KB
1개 PDF(30페이지 기준) = 30벡터 × 3 KB = 약 90 KB
```

| 시나리오 | PDF 수 | 벡터 수 | 벡터 데이터 크기 | 메타데이터 포함 추정 |
|---------|--------|--------|----------------|-------------------|
| 소규모 | 50개 | 1,500 | ~4.5 MB | ~10 MB |
| 중규모 | 200개 | 6,000 | ~18 MB | ~40 MB |
| 대규모 | 500개 | 15,000 | ~45 MB | ~100 MB |

→ 500 MB DB 기준, 벡터 데이터만으로는 충분한 여유가 있다. RDB 데이터(사용자, 작업 목록, 채팅 기록)와 합산해도 중규모까지는 문제없다.

### 3.3 Auth (Google OAuth) 검증

| 항목 | 상세 | 판정 |
|------|------|------|
| Google OAuth | Free 플랜에서 사용 가능 | ✅ |
| 설정 방법 | Google Cloud Console에서 OAuth 클라이언트 생성 → Supabase 대시보드에서 설정 | ✅ |
| MAU 제한 | 50,000/월 | ✅ 개인 프로젝트에 충분 |
| 세션 관리 | Supabase Auth가 JWT 기반으로 자동 처리 | ✅ |
| Next.js 통합 | `@supabase/ssr` 패키지로 App Router 지원 | ✅ |

### 3.4 Storage (PDF 파일) 검증

| 항목 | 상세 | 판정 |
|------|------|------|
| 총 용량 | 1 GB | ✅ |
| 최대 파일 크기 | 50 MB | ✅ (현재 10MB 제한) |
| 접근 제어 | RLS(Row Level Security) 기반 | ✅ |
| CDN | 기본 제공 | ✅ |
| 클라이언트 직접 업로드 | 지원 (Vercel 4.5MB 제한 우회 가능) | ✅ |

### 3.5 판정: ✅ 배포 가능 (DB 용량 모니터링 필요)

Supabase Free 플랜은 RDB, 벡터 스토어, 인증, 파일 저장소를 모두 단일 플랫폼에서 제공하므로 매우 적합하다. 다만 500 MB DB 제한과 7일 비활성 일시정지 정책에 유의해야 한다.

---

## 4. 추가 기능별 구현 실용성 분석

### 4.1 Google OAuth 로그인

**구현 복잡도**: ⭐⭐ (낮음)

```
필요 패키지: @supabase/supabase-js, @supabase/ssr
```

**구현 흐름**:
1. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
2. Supabase 대시보드 → Authentication → Providers → Google 활성화
3. Next.js 미들웨어에서 세션 검증
4. 보호된 라우트에 인증 가드 적용

**Supabase 무료 플랜 제약**: 없음 (50,000 MAU 이내)

**판정**: ✅ 완전 실현 가능

### 4.2 사용자 데이터 저장 (RDB)

**구현 복잡도**: ⭐⭐ (낮음)

**테이블 설계 예시**:
```sql
-- Supabase Auth의 auth.users 테이블과 연계
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
```

**용량 추정**: 사용자 1,000명 × 1 KB/행 = ~1 MB → 무시할 수준

**판정**: ✅ 완전 실현 가능

### 4.3 사용자 작업 목록 저장 (RDB)

**구현 복잡도**: ⭐⭐ (낮음)

**테이블 설계 예시**:
```sql
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  pdf_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',  -- pending, in_progress, completed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tasks"
  ON public.tasks FOR ALL
  USING (auth.uid() = user_id);
```

**용량 추정**: 사용자 100명 × 50개 작업 × 0.5 KB = ~2.5 MB

**판정**: ✅ 완전 실현 가능

### 4.4 채팅 기록 저장 (RDB)

**구현 복잡도**: ⭐⭐⭐ (중간)

**테이블 설계 예시**:
```sql
CREATE TABLE public.chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  pdf_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,  -- 'user' | 'assistant'
  content TEXT NOT NULL,
  sources JSONB,       -- ChatSource[] 배열
  usage JSONB,         -- UsageInfo
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions"
  ON public.chat_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages"
  ON public.chat_messages FOR ALL
  USING (
    session_id IN (
      SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
    )
  );
```

**용량 추정 (핵심 병목 포인트)**:

| 항목 | 추정 값 |
|------|---------|
| 평균 메시지 크기 (user) | ~0.2 KB |
| 평균 메시지 크기 (assistant + sources) | ~2 KB |
| 1회 대화 왕복 | ~2.2 KB |
| 1세션 평균 (20회 왕복) | ~44 KB |
| 100명 × 50세션 | ~220 MB |

→ **채팅 기록이 DB 용량의 가장 큰 부분을 차지할 수 있다.** 오래된 채팅 기록 자동 정리(retention policy) 또는 아카이빙 전략이 필요하다.

**판정**: ⚠️ 실현 가능하나, 데이터 보관 정책 설계 필수

### 4.5 벡터 스토어 마이그레이션 (ChromaDB → Supabase pgvector)

**구현 복잡도**: ⭐⭐⭐⭐ (높음) — 가장 많은 코드 변경 필요

**변경이 필요한 파일**:

| 파일 | 변경 내용 |
|------|----------|
| `src/shared/lib/chroma.ts` | 삭제 → Supabase 클라이언트로 대체 |
| `src/shared/lib/langchain/retriever.ts` | ChromaDB 쿼리 → pgvector 쿼리로 변경 |
| `src/app/api/pdf/[pdfId]/save/route.ts` | ChromaDB upsert → Supabase insert로 변경 |
| `src/app/api/pdf/[pdfId]/route.ts` | ChromaDB 컬렉션 삭제 → Supabase 행 삭제 |
| `src/app/api/collections/route.ts` | ChromaDB listCollections → Supabase 쿼리 |
| `src/app/api/chat/route.ts` | 컬렉션 존재 확인 로직 변경 |
| `package.json` | chromadb 제거 → @supabase/supabase-js 추가 |

**pgvector 테이블 설계 예시**:
```sql
-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.pdf_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  pdf_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  snippet TEXT,
  embedding vector(768),  -- Google text-embedding-005 = 768차원
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(pdf_id, page_number)
);

-- 코사인 유사도 검색을 위한 HNSW 인덱스
CREATE INDEX ON public.pdf_documents
  USING hnsw (embedding vector_cosine_ops);

-- RLS 정책
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own documents"
  ON public.pdf_documents FOR ALL
  USING (auth.uid() = user_id);
```

**유사도 검색 함수 예시**:
```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_pdf_id TEXT,
  match_count INT DEFAULT 6
)
RETURNS TABLE (
  id UUID,
  pdf_id TEXT,
  file_name TEXT,
  page_number INTEGER,
  content TEXT,
  snippet TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pd.id,
    pd.pdf_id,
    pd.file_name,
    pd.page_number,
    pd.content,
    pd.snippet,
    1 - (pd.embedding <=> query_embedding) AS similarity
  FROM public.pdf_documents pd
  WHERE pd.pdf_id = match_pdf_id
  ORDER BY pd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

**판정**: ✅ 실현 가능 — 코드 수정량이 가장 크지만 기술적 장벽은 없음

---

## 5. DB 용량 종합 시뮬레이션 (500 MB 제한)

개인 사용 또는 소규모 사용(사용자 10~50명) 시나리오를 기준으로 한다.

### 5.1 소규모 시나리오 (사용자 10명, 6개월 운영)

| 데이터 유형 | 추정 용량 |
|-----------|----------|
| 프로필 (profiles) | ~0.01 MB |
| 작업 목록 (tasks) | ~0.25 MB |
| 채팅 세션 (chat_sessions) | ~0.05 MB |
| 채팅 메시지 (chat_messages) | ~22 MB |
| PDF 벡터 (pdf_documents) | ~10 MB |
| 인덱스 + 시스템 오버헤드 | ~15 MB |
| **합계** | **~47 MB** |

→ 500 MB 대비 **약 9% 사용** — 매우 여유

### 5.2 중규모 시나리오 (사용자 50명, 12개월 운영)

| 데이터 유형 | 추정 용량 |
|-----------|----------|
| 프로필 (profiles) | ~0.05 MB |
| 작업 목록 (tasks) | ~1.25 MB |
| 채팅 세션 (chat_sessions) | ~0.5 MB |
| 채팅 메시지 (chat_messages) | ~220 MB |
| PDF 벡터 (pdf_documents) | ~40 MB |
| 인덱스 + 시스템 오버헤드 | ~60 MB |
| **합계** | **~322 MB** |

→ 500 MB 대비 **약 64% 사용** — 운영 가능하나 모니터링 필요

### 5.3 한계 도달 시나리오

- 채팅 메시지가 약 300 MB를 초과하면 DB가 read-only 모드에 진입한다
- 이 시점에서 오래된 채팅 기록 삭제 또는 Pro 플랜 전환이 필요하다

---

## 6. 마이그레이션 작업 범위

### 6.1 패키지 변경

```diff
# 제거
- "chromadb": "^3.2.2"

# 추가
+ "@supabase/supabase-js": "^2.x"
+ "@supabase/ssr": "^0.x"
```

### 6.2 환경 변수 변경

```diff
# 제거
- CHROMA_URL=http://localhost:8000
- UPLOAD_DIR=/tmp/pdf-uploads

# 추가
+ NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
+ NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
+ SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 6.3 작업 체크리스트

| 순서 | 작업 | 예상 소요 | 난이도 |
|------|------|----------|--------|
| 1 | Supabase 프로젝트 생성 및 pgvector 활성화 | 30분 | ⭐ |
| 2 | DB 스키마 생성 (테이블, RLS, 함수) | 2시간 | ⭐⭐ |
| 3 | Supabase Auth + Google OAuth 설정 | 1시간 | ⭐⭐ |
| 4 | Supabase 클라이언트 유틸리티 작성 | 1시간 | ⭐⭐ |
| 5 | 인증 미들웨어 및 보호된 라우트 구현 | 2시간 | ⭐⭐⭐ |
| 6 | PDF 업로드 → Supabase Storage 마이그레이션 | 2시간 | ⭐⭐⭐ |
| 7 | ChromaDB → pgvector 마이그레이션 (retriever, save) | 4시간 | ⭐⭐⭐⭐ |
| 8 | 채팅 기록 저장/조회 기능 구현 | 3시간 | ⭐⭐⭐ |
| 9 | 작업 목록 CRUD 구현 | 2시간 | ⭐⭐ |
| 10 | Vercel 배포 및 환경변수 설정 | 1시간 | ⭐ |
| 11 | E2E 테스트 및 디버깅 | 3시간 | ⭐⭐⭐ |
| **합계** | | **~21시간** | |

---

## 7. 리스크 및 대응 전략

### 7.1 기술적 리스크

| 리스크 | 심각도 | 대응 전략 |
|--------|--------|----------|
| Vercel Function 10초 타임아웃으로 대용량 PDF 처리 실패 | 높음 | 페이지별 청크 분할 처리, 클라이언트에서 순차 요청, PDF 크기 상한 4MB |
| Supabase 500MB DB 한도 초과 | 중간 | 채팅 기록 retention 정책(90일), 오래된 벡터 데이터 정리, 용량 대시보드 모니터링 |
| Supabase 7일 비활성 일시정지 | 중간 | Vercel Cron Job으로 주기적 ping, 또는 외부 모니터링 서비스(UptimeRobot) 활용 |
| Request Body 4.5MB 제한 | 낮음 | Supabase Storage 클라이언트 직접 업로드로 우회 |
| Cold Start 지연 | 낮음 | 사용자 UX에서 로딩 상태 표시, 임계 API에 Edge Runtime 검토 |

### 7.2 운영 리스크

| 리스크 | 심각도 | 대응 전략 |
|--------|--------|----------|
| Hobby 플랜 상업적 사용 불가 | 높음 (상업 목적 시) | 프로토타입/개인 사용 후 Pro 플랜 전환 |
| 무료 플랜 정책 변경 가능성 | 낮음 | 정기적 공지 확인, 마이그레이션 가능한 아키텍처 유지 |

---

## 8. 최종 결론

### 8.1 종합 판정: ✅ 배포 가능

Vercel Hobby + Supabase Free 조합으로 본 프로젝트의 배포는 **기술적으로 완전히 실현 가능**하다.

### 8.2 핵심 근거

1. **Vercel**: Next.js 15 프로젝트에 대한 최적의 배포 환경을 제공하며, Serverless Function의 10초 제한은 아키텍처 수정으로 해결 가능하다.

2. **Supabase**: 단일 플랫폼에서 PostgreSQL(RDB) + pgvector(벡터 스토어) + Auth(Google OAuth) + Storage(파일 저장)를 모두 무료로 제공하므로, 기존에 분산되어 있던 인프라(ChromaDB, 로컬 파일시스템, 별도 인증)를 하나로 통합할 수 있다.

3. **비용**: $0/월 (개인 프로젝트 기준, AI Gateway 크레딧 별도)

### 8.3 권장 사항

| 항목 | 권장 |
|------|------|
| PDF 크기 제한 | 4 MB로 하향 (Vercel 제한 대응) 또는 클라이언트 직접 업로드 |
| 채팅 기록 보관 | 90일 retention 정책 적용 |
| DB 용량 모니터링 | Supabase 대시보드에서 주간 확인 |
| 비활성 방지 | Vercel Cron 또는 외부 서비스로 5일마다 ping |
| 벡터 인덱스 | 데이터 1,000건 이상 시 HNSW 인덱스 생성 |
| 점진적 마이그레이션 | 벡터 스토어 → 인증 → RDB 순서로 단계적 진행 권장 |

### 8.4 비용 시나리오

| 시나리오 | Vercel | Supabase | AI Gateway | 합계 |
|---------|--------|----------|------------|------|
| 개인 프로젝트 (무료) | $0 | $0 | 크레딧 한도 내 | **$0/월** |
| 소규모 서비스 (유료) | $20/월 (Pro) | $25/월 (Pro) | 사용량 기반 | **$45+/월** |

---

## 부록: 참고 자료

- Vercel Pricing: https://vercel.com/pricing
- Vercel Limits: https://vercel.com/docs/limits
- Supabase Pricing: https://supabase.com/pricing
- Supabase pgvector: https://supabase.com/docs/guides/database/extensions/pgvector
- Supabase Auth (Google): https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase Storage: https://supabase.com/docs/guides/storage
- Next.js + Supabase: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
