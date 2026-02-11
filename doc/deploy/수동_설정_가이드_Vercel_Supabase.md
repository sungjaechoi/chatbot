# PDF RAG 챗봇 — 수동 설정 가이드

> 코드 마이그레이션은 완료된 상태입니다. 이 문서는 **직접 수동으로 수행해야 하는 외부 서비스 설정 작업**만 정리합니다.

---

## 목차

1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [DB 스키마 실행](#2-db-스키마-실행)
3. [Storage 버킷 확인](#3-storage-버킷-확인)
4. [Google Cloud OAuth 설정](#4-google-cloud-oauth-설정)
5. [Supabase Auth Google Provider 연결](#5-supabase-auth-google-provider-연결)
6. [로컬 환경변수 설정](#6-로컬-환경변수-설정)
7. [로컬 테스트](#7-로컬-테스트)
8. [Vercel 배포](#8-vercel-배포)
9. [프로덕션 리다이렉트 URL 업데이트](#9-프로덕션-리다이렉트-url-업데이트)
10. [배포 후 검증 체크리스트](#10-배포-후-검증-체크리스트)

---

## 1. Supabase 프로젝트 생성

### 1.1 프로젝트 생성

1. https://supabase.com 접속 → **Sign In**
2. **New Project** 클릭
3. 설정 입력:
   - **Organization**: 기존 org 선택 또는 새로 생성
   - **Project name**: `pdf-rag-chatbot` (자유)
   - **Database Password**: 안전한 비밀번호 입력 (별도 메모)
   - **Region**: `Northeast Asia (Tokyo)` — 한국에서 가장 가까운 리전
   - **Plan**: Free
4. **Create new project** 클릭 → 프로비저닝 대기 (1~2분)

### 1.2 키 정보 기록

프로젝트 생성 후 **Settings → API** 페이지에서 다음 3개 값을 메모:

| 항목            | 위치                         | 용도                       |
| --------------- | ---------------------------- | -------------------------- |
| **Project URL** | Settings → API → Project URL | `NEXT_PUBLIC_SUPABASE_URL` |

(https://your-project-ref.supabase.co)
| **anon public** | Settings → API → Project API keys | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
your-supabase-anon-key
| **service_role** | Settings → API → Project API keys (숨김 해제) | `SUPABASE_SERVICE_ROLE_KEY` |
your-supabase-service-role-key

> **주의**: `service_role` 키는 RLS를 우회하므로 **절대 클라이언트에 노출하면 안 됩니다**. 서버 사이드(API 라우트)에서만 사용합니다.

---

## 2. DB 스키마 실행

### 2.1 SQL Editor 열기

1. Supabase 대시보드 → 좌측 메뉴 **SQL Editor** 클릭
2. **New query** 클릭

### 2.2 스키마 실행

프로젝트의 `supabase/schema.sql` 파일 전체 내용을 SQL Editor에 붙여넣고 **Run** 실행합니다.

이 SQL은 다음을 생성합니다:

| 항목                       | 설명                                                 |
| -------------------------- | ---------------------------------------------------- |
| `vector` 확장              | pgvector 활성화                                      |
| `profiles` 테이블          | 사용자 프로필 (auth.users 연계, 트리거 자동 생성)    |
| `tasks` 테이블             | 사용자 작업 목록                                     |
| `chat_sessions` 테이블     | 채팅 세션 (PDF별 1개)                                |
| `chat_messages` 테이블     | 채팅 메시지 (sources JSONB, usage JSONB)             |
| `pdf_documents` 테이블     | PDF 벡터 데이터 (embedding vector(768), HNSW 인덱스) |
| `match_documents` RPC      | 코사인 유사도 벡터 검색 함수                         |
| `get_user_collections` RPC | 사용자별 PDF 목록 집계 함수                          |
| `pdfs` Storage 버킷        | PDF 파일 저장소 (10MB 제한, RLS 적용)                |
| RLS 정책                   | 모든 테이블 + Storage에 사용자별 격리 정책           |
| 트리거                     | 신규 가입 시 profiles 자동 생성                      |

### 2.3 실행 확인

SQL 실행 후 다음을 확인합니다:

1. **Table Editor** → 5개 테이블 존재 확인: `profiles`, `tasks`, `chat_sessions`, `chat_messages`, `pdf_documents`
2. **Database → Functions** → 3개 함수 확인: `handle_new_user`, `match_documents`, `get_user_collections`
3. 각 테이블 옆 **RLS** 아이콘이 활성화(잠금 표시) 되어있는지 확인

> **에러 발생 시**: `CREATE EXTENSION IF NOT EXISTS vector` 에서 에러가 나면, **Database → Extensions** 에서 `vector` 를 수동으로 활성화한 후 나머지 SQL을 다시 실행하세요.

---

## 3. Storage 버킷 확인

SQL 스키마 실행으로 `pdfs` 버킷이 자동 생성됩니다. 확인:

1. Supabase 대시보드 → **Storage** 클릭
2. `pdfs` 버킷이 존재하는지 확인
3. 버킷 설정 확인:
   - **Public**: `off` (비공개)
   - **File size limit**: `10 MB`

### 버킷이 안 보이는 경우 (수동 생성)

1. **Storage** → **New bucket** 클릭
2. 설정:
   - **Name**: `pdfs`
   - **Public bucket**: `off` (체크 해제)
   - **File size limit**: `10485760` (10MB)
3. **Create bucket** 클릭

### Storage RLS 정책 확인

1. **Storage** → `pdfs` 버킷 → **Policies** 탭
2. 3개 정책이 존재하는지 확인:
   - `Users can upload own PDFs` (INSERT)
   - `Users can read own PDFs` (SELECT)
   - `Users can delete own PDFs` (DELETE)

> 정책이 없으면 `supabase/schema.sql`의 Storage RLS 부분(마지막 섹션)만 다시 실행하세요.

---

## 4. Google Cloud OAuth 설정

### 4.1 Google Cloud 프로젝트 생성/선택

1. https://console.cloud.google.com 접속
2. 상단 프로젝트 선택기 → **새 프로젝트** (또는 기존 프로젝트 사용)
3. 프로젝트 이름: `pdf-rag-chatbot` (자유)

### 4.2 OAuth 동의 화면 설정

1. 좌측 메뉴: **API 및 서비스** → **OAuth 동의 화면**
2. User Type: **외부** 선택 → **만들기**
3. 필수 입력:
   - **앱 이름**: `Document Chat` (또는 원하는 이름)
   - **사용자 지원 이메일**: 본인 이메일
   - **개발자 연락처**: 본인 이메일
4. **범위(Scopes)**: 기본값 유지 (추가 불필요) → **저장 후 계속**
5. **테스트 사용자**: 본인 이메일 추가 → **저장 후 계속**

> **중요**: 앱이 "테스트" 상태일 때는 테스트 사용자로 등록된 구글 계정만 로그인 가능합니다. 다른 사람도 사용하게 하려면 나중에 **앱 게시**를 해야 합니다.

### 4.3 OAuth 2.0 클라이언트 ID 생성

1. 좌측 메뉴: **API 및 서비스** → **사용자 인증 정보**
2. 상단 **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
3. 설정:
   - **애플리케이션 유형**: 웹 애플리케이션
   - **이름**: `PDF RAG Chatbot` (자유)
   - **승인된 자바스크립트 원본**:
     ```
     http://localhost:3000
     ```
   - **승인된 리다이렉션 URI**:
     ```
     http://localhost:3000/auth/callback
     https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
     ```
     > `<YOUR_SUPABASE_PROJECT_REF>`는 Supabase Project URL에서 `https://` 뒤, `.supabase.co` 앞 부분입니다.
     > 예: URL이 `https://abcdefghij.supabase.co`이면 → `https://abcdefghij.supabase.co/auth/v1/callback`

4. **만들기** 클릭
5. **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 메모

---

## 5. Supabase Auth Google Provider 연결

1. Supabase 대시보드 → **Authentication** → **Providers**
2. **Google** 항목 클릭 → 토글 **활성화**
3. 입력:
   - **Client ID**: 4.3에서 메모한 클라이언트 ID
   - **Client Secret**: 4.3에서 메모한 클라이언트 보안 비밀번호
4. **Save** 클릭

### 리다이렉트 URL 확인

같은 페이지에서 **Callback URL (for OAuth)** 값을 확인합니다. 형식:

```
https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
```

이 URL이 4.3의 "승인된 리다이렉션 URI"에 정확히 등록되어 있는지 다시 확인하세요.

---

## 6. 로컬 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 입력합니다:

```bash
# Vercel AI Gateway API Key
AI_GATEWAY_API_KEY=your_ai_gateway_api_key_here

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# 모델 설정 (Vercel AI Gateway 형식)
EMBEDDING_MODEL=google/text-embedding-004
LLM_MODEL=google/gemini-2.5-flash

# RAG 설정
TOP_K=6
```

각 값의 출처:

| 변수                            | 출처                                               |
| ------------------------------- | -------------------------------------------------- |
| `AI_GATEWAY_API_KEY`            | Vercel 대시보드 → Settings → AI Gateway            |
| `NEXT_PUBLIC_SUPABASE_URL`      | [1.2](#12-키-정보-기록)에서 메모한 Project URL     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [1.2](#12-키-정보-기록)에서 메모한 anon public 키  |
| `SUPABASE_SERVICE_ROLE_KEY`     | [1.2](#12-키-정보-기록)에서 메모한 service_role 키 |

---

## 7. 로컬 테스트

### 7.1 의존성 설치

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` 플래그가 필요합니다 (`@langchain/community` 패키지의 peer dependency 충돌 때문).

### 7.2 개발 서버 실행

```bash
npm run dev
```

### 7.3 기능 테스트 순서

| 순서 | 테스트 항목                          | 예상 결과                             |
| ---- | ------------------------------------ | ------------------------------------- |
| 1    | `http://localhost:3000` 접속         | `/login` 페이지로 리다이렉트          |
| 2    | Google 로그인 버튼 클릭              | Google OAuth 화면 표시                |
| 3    | Google 계정으로 로그인               | 메인 페이지(`/`)로 이동               |
| 4    | Supabase `profiles` 테이블 확인      | 로그인한 사용자 프로필 자동 생성 확인 |
| 5    | PDF 업로드 테스트 (10MB 이하)        | 업로드 완료 + 임베딩 처리             |
| 6    | Supabase Storage `pdfs` 버킷 확인    | `{userId}/{pdfId}.pdf` 파일 존재      |
| 7    | Supabase `pdf_documents` 테이블 확인 | 벡터 데이터 행 존재                   |
| 8    | 채팅 질의 테스트                     | RAG 응답 + 출처 표시                  |
| 9    | Supabase `chat_messages` 테이블 확인 | user/assistant 메시지 저장 확인       |
| 10   | 페이지 새로고침                      | 이전 채팅 기록 복원 확인              |
| 11   | 작업 목록 추가/완료/삭제             | CRUD 동작 확인                        |
| 12   | 로그아웃                             | `/login`으로 리다이렉트               |

### 7.4 빌드 테스트

```bash
npm run build
```

에러 없이 빌드가 완료되어야 합니다. (2개의 `<img>` vs `next/image` 경고는 무시 가능)

---

## 8. Vercel 배포

### 8.1 GitHub 리포지토리 연결

1. https://vercel.com 접속 → **Add New Project**
2. GitHub 리포지토리 선택 (또는 Import)
3. **Framework Preset**: `Next.js` (자동 감지)

### 8.2 빌드 설정

| 항목                 | 값                               |
| -------------------- | -------------------------------- |
| **Build Command**    | `npm run build` (기본값)         |
| **Output Directory** | `.next` (기본값)                 |
| **Install Command**  | `npm install --legacy-peer-deps` |
| **Node.js Version**  | 18.x 이상                        |

> **중요**: Install Command를 반드시 `npm install --legacy-peer-deps`로 설정하세요. 기본값(`npm install`)으로 하면 peer dependency 충돌로 빌드가 실패합니다.

### 8.3 환경변수 설정

Vercel 대시보드 → **Settings** → **Environment Variables**에서 다음을 추가:

| 변수                            | 값                                     | Environment                      |
| ------------------------------- | -------------------------------------- | -------------------------------- |
| `AI_GATEWAY_API_KEY`            | Vercel AI Gateway API 키               | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://your-project-ref.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 키                       | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service_role 키               | Production, Preview, Development |
| `EMBEDDING_MODEL`               | `google/text-embedding-004`            | Production, Preview, Development |
| `LLM_MODEL`                     | `google/gemini-2.5-flash`              | Production, Preview, Development |
| `TOP_K`                         | `6`                                    | Production, Preview, Development |

### 8.4 배포

**Deploy** 클릭 → 빌드 로그 확인 → 배포 완료 후 프로덕션 URL 기록

예: `https://your-app-name.vercel.app`

---

## 9. 프로덕션 리다이렉트 URL 업데이트

배포 후 프로덕션 도메인이 확정되면, 두 곳의 리다이렉트 URL을 업데이트해야 합니다.

### 9.1 Google Cloud Console 업데이트

1. https://console.cloud.google.com → **API 및 서비스** → **사용자 인증 정보**
2. 생성한 OAuth 2.0 클라이언트 ID 클릭
3. **승인된 자바스크립트 원본** 추가:
   ```
   https://your-app-name.vercel.app
   ```
4. **승인된 리다이렉션 URI** 추가:
   ```
   https://your-app-name.vercel.app/auth/callback
   ```
5. **저장**

### 9.2 Supabase Auth 리다이렉트 URL 업데이트

1. Supabase 대시보드 → **Authentication** → **URL Configuration**
2. **Site URL** 변경:
   ```
   https://your-app-name.vercel.app
   ```
3. **Redirect URLs** 추가:
   ```
   https://your-app-name.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
   > localhost는 로컬 개발용으로 함께 등록해둡니다.
4. **Save**

---

## 10. 배포 후 검증 체크리스트

프로덕션 URL에서 다음을 순서대로 테스트합니다:

### 인증

- [ ] 프로덕션 URL 접속 시 `/login` 리다이렉트
- [ ] Google 로그인 성공
- [ ] 로그인 후 메인 페이지 도달
- [ ] 로그아웃 시 `/login` 리다이렉트
- [ ] 페이지 새로고침 시 세션 유지

### PDF 업로드 & RAG

- [ ] PDF 업로드 성공 (소형: 1MB 이하)
- [ ] PDF 업로드 성공 (중형: 3~5MB)
- [ ] 임베딩 처리 완료 (채팅 화면 진입 가능)
- [ ] 채팅 질의 → RAG 응답 + 출처 표시
- [ ] 크레딧 표시 동작

### 채팅 기록

- [ ] 페이지 새로고침 후 이전 채팅 기록 복원
- [ ] 다른 PDF 선택 후 복귀 → 각 PDF별 독립 기록 확인

### 작업 목록

- [ ] 작업 추가
- [ ] 작업 완료 토글
- [ ] 작업 삭제

### 컬렉션

- [ ] PDF 목록 표시
- [ ] PDF 삭제 → 목록에서 제거 + Storage 파일 삭제

### Cron (비활성 방지)

- [ ] Vercel 대시보드 → **Settings** → **Crons** → `keep-alive` 크론 등록 확인
- [ ] 수동 테스트: `https://your-app-name.vercel.app/api/cron/keep-alive` 접속 시 `{"ok":true}` 응답

> `vercel.json`에 크론이 정의되어 있으므로 배포 시 자동 등록됩니다. 5일마다 Supabase에 ping하여 Free 플랜 비활성 일시정지(7일)를 방지합니다.

---

## 트러블슈팅

### 빌드 실패: peer dependency 에러

```
npm ERR! ERESOLVE unable to resolve dependency tree
```

→ Install Command를 `npm install --legacy-peer-deps`로 설정하세요.

### Google 로그인 후 콜백 에러

```
redirect_uri_mismatch
```

→ Google Cloud Console의 "승인된 리다이렉션 URI"에 다음 두 개가 모두 등록되어있는지 확인:

- `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
- `https://your-app-name.vercel.app/auth/callback` (프로덕션 배포 후)

### Supabase 비활성 일시정지

Free 플랜에서 7일 이상 미사용 시 프로젝트가 일시정지됩니다.

- 대시보드에서 수동 재시작 가능
- `vercel.json`의 Cron Job이 5일마다 자동으로 ping하므로 정상 배포 후에는 발생하지 않습니다

### PDF 업로드 후 임베딩 타임아웃

Vercel Hobby 플랜은 함수 실행 시간이 10초로 제한됩니다.

- 30페이지 이하 PDF는 대부분 10초 내에 처리됩니다
- 대용량 PDF(50페이지 이상)에서 타임아웃이 발생하면, 더 작은 PDF로 분할하여 업로드하세요

### vector 확장 활성화 실패

SQL Editor에서 `CREATE EXTENSION IF NOT EXISTS vector` 에러 시:

1. Supabase 대시보드 → **Database** → **Extensions**
2. 검색창에 `vector` 입력
3. `vector` 확장을 수동으로 **Enable** 클릭
4. 나머지 SQL을 다시 실행
