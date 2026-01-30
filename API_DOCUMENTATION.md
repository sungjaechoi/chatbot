# PDF RAG 챗봇 API 문서

## 개요

PDF 기반 RAG (Retrieval-Augmented Generation) 챗봇의 백엔드 API입니다.

### 기술 스택

- **LLM 임베딩**: google/text-embedding-005
- **답변 LLM**: google/gemini-2.5-flash
- **벡터 DB**: Chroma (로컬, 포트 8000)
- **프레임워크**: Next.js 15 (App Router)
- **LangChain**: TypeScript

---

## API 엔드포인트

### 1. PDF 업로드

**POST** `/api/pdf/upload`

PDF 파일을 업로드하고 임시 저장합니다.

#### 요청

```bash
curl -X POST http://localhost:3000/api/pdf/upload \
  -F "file=@document.pdf"
```

#### 응답 (200 OK)

```json
{
  "pdfId": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "document.pdf",
  "fileSize": 1048576,
  "uploadedAt": "2026-01-28T05:30:00.000Z"
}
```

#### 에러 응답

```json
{
  "error": "PDF 파일만 업로드 가능합니다.",
  "code": "INVALID_FILE_TYPE"
}
```

**에러 코드:**
- `NO_FILE` (400): 파일이 제공되지 않음
- `INVALID_FILE_TYPE` (400): PDF 파일이 아님
- `FILE_TOO_LARGE` (400): 파일 크기 초과 (최대 10MB)
- `UPLOAD_ERROR` (500): 업로드 처리 중 오류

---

### 2. PDF 저장/임베딩

**POST** `/api/pdf/[pdfId]/save`

업로드된 PDF를 텍스트로 파싱하고, 페이지별로 임베딩을 생성한 후 Chroma에 저장합니다.

#### 요청

```bash
# 원본 파일명을 포함하여 요청 (권장)
curl -X POST http://localhost:3000/api/pdf/550e8400-e29b-41d4-a716-446655440000/save \
  -H "Content-Type: application/json" \
  -d '{"fileName": "원본문서.pdf"}'

# 원본 파일명 없이 요청 (pdfId 기반 파일명 사용)
curl -X POST http://localhost:3000/api/pdf/550e8400-e29b-41d4-a716-446655440000/save
```

#### 요청 스키마

```typescript
{
  fileName?: string;  // 선택 사항: 원본 파일명 (미제공 시 pdfId 기반 파일명 사용)
}
```

#### 응답 (200 OK)

```json
{
  "pdfId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "embedded",
  "totalPages": 42,
  "collectionName": "pdf_550e8400-e29b-41d4-a716-446655440000"
}
```

#### 에러 응답

```json
{
  "error": "PDF 파일을 찾을 수 없습니다.",
  "code": "PDF_NOT_FOUND"
}
```

**에러 코드:**
- `PDF_NOT_FOUND` (404): PDF 파일을 찾을 수 없음
- `NO_TEXT_EXTRACTED` (400): PDF에서 텍스트 추출 실패
- `SAVE_ERROR` (500): 저장/임베딩 처리 중 오류

---

### 3. 챗봇 대화

**POST** `/api/chat`

PDF 내용을 기반으로 질문에 답변합니다.

#### 요청

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "pdfId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "이 문서의 주요 내용은 무엇인가요?"
  }'
```

#### 요청 스키마

```typescript
{
  pdfId: string;    // PDF 문서 ID
  message: string;  // 사용자 질문
}
```

#### 응답 (200 OK)

```json
{
  "answer": "이 문서는 인공지능 기반 RAG 시스템의 구현 방법에 대해 다루고 있습니다. 벡터 데이터베이스의 활용 방안을 설명하고 있습니다.",
  "sources": [
    {
      "pageNumber": 5,
      "fileName": "document.pdf",
      "snippet": "인공지능 기반 RAG(Retrieval-Augmented Generation) 시스템은 외부 지식을 활용하여...",
      "score": 0.89
    },
    {
      "pageNumber": 12,
      "fileName": "document.pdf",
      "snippet": "벡터 데이터베이스는 임베딩된 문서를 저장하고 효율적으로 검색할 수 있는 핵심...",
      "score": 0.85
    }
  ]
}
```

#### 응답 스키마

```typescript
{
  answer: string;          // LLM이 생성한 답변
  sources: Array<{         // 답변 근거가 된 문서 출처
    pageNumber: number;    // 페이지 번호
    fileName: string;      // 파일명
    snippet: string;       // 발췌문 (처음 80자)
    score?: number;        // 유사도 점수 (0~1)
  }>;
}
```

#### 에러 응답

```json
{
  "error": "해당 PDF의 임베딩 데이터를 찾을 수 없습니다. 먼저 PDF를 저장해주세요.",
  "code": "COLLECTION_NOT_FOUND"
}
```

**에러 코드:**
- `INVALID_INPUT` (400): pdfId 또는 message 누락
- `EMPTY_MESSAGE` (400): 빈 메시지
- `COLLECTION_NOT_FOUND` (404): PDF 임베딩 데이터 없음
- `CHAT_ERROR` (500): 답변 생성 중 오류

---

## 사용 흐름

1. **PDF 업로드**: `POST /api/pdf/upload` → `pdfId` 받기
2. **PDF 임베딩**: `POST /api/pdf/[pdfId]/save` → 임베딩 완료 확인
3. **질문 & 답변**: `POST /api/chat` → 반복 사용 가능

---

## 설정

### 환경변수

`.env.local` 파일에 다음 환경변수를 설정하세요:

```env
# Vercel AI Gateway API Key
AI_GATEWAY_API_KEY=your_key_here

# Google API Key
GOOGLE_API_KEY=your_google_api_key

# Chroma Vector DB
CHROMA_URL=http://localhost:8000

# 모델 설정
EMBEDDING_MODEL=google/text-embedding-005
LLM_MODEL=google/gemini-2.5-flash

# 파일 업로드
UPLOAD_DIR=/tmp/pdf-uploads

# RAG 설정
TOP_K=6
```

### Chroma 벡터 DB 실행

```bash
docker run -p 8000:8000 chromadb/chroma
```

---

## 아키텍처

### Chroma 컬렉션 설계

**전략**: `pdf_${pdfId}` 방식

**근거**:
- 각 PDF마다 독립된 컬렉션을 가져 격리성이 높음
- 특정 PDF의 벡터만 검색하므로 검색 성능 우수
- PDF 삭제 시 컬렉션만 삭제하면 되어 관리 간단
- RAG 챗봇 특성상 PDF 개수가 제한적일 것으로 예상

### RAG 파이프라인

1. **질의 임베딩**: 사용자 질문을 text-embedding-005로 벡터화
2. **유사도 검색**: Chroma에서 TopK (기본 6개) 검색
3. **컨텍스트 구성**: 검색된 페이지 내용을 프롬프트에 포함
4. **답변 생성**: gemini-2.5-flash로 스트리밍 답변 생성
5. **출처 첨부**: 답변과 함께 페이지 번호 및 발췌문 반환

---

## 폴더 구조

```
src/
├── app/
│   └── api/
│       ├── pdf/
│       │   ├── upload/
│       │   │   └── route.ts          # PDF 업로드 API
│       │   └── [pdfId]/
│       │       └── save/
│       │           └── route.ts      # PDF 저장/임베딩 API
│       └── chat/
│           └── route.ts              # 챗봇 대화 API
└── shared/
    ├── lib/
    │   ├── chroma.ts                 # Chroma 클라이언트
    │   ├── pdf-loader.ts             # PDF 로딩 유틸
    │   └── langchain/
    │       ├── embeddings.ts         # 임베딩 생성
    │       ├── llm.ts                # LLM 호출
    │       ├── retriever.ts          # 벡터 검색
    │       └── rag.ts                # RAG 파이프라인
    └── types/
        └── index.ts                  # TypeScript 타입 정의
```

---

## 에러 핸들링

모든 API는 다음 형식의 에러 응답을 반환합니다:

```typescript
{
  error: string;      // 에러 메시지
  code?: string;      // 에러 코드
  details?: string;   // 상세 정보 (개발 환경)
}
```

---

## 주의사항

1. **페이지 단위 처리**: PDF를 페이지별로 임베딩하여 처리합니다.
2. **Snippet 길이**: 각 페이지의 snippet은 첫 80자로 고정됩니다.
3. **파일 크기 제한**: 현재 최대 10MB까지 업로드 가능합니다.
4. **Chroma 실행**: API 사용 전 Chroma 서버가 실행 중이어야 합니다.
5. **환경변수**: GOOGLE_API_KEY는 반드시 설정되어야 합니다.
6. **원본 파일명**: save API 호출 시 원본 파일명을 body에 포함하는 것을 권장합니다.
