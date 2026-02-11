# PDF 기반 RAG 챗봇 - 코드 상세 설명서

이 문서는 프로젝트의 모든 소스 파일에 대한 한 줄 단위 코드 설명과 전체 실행 플로우를 상세히 기술합니다.

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [디렉토리 구조](#2-디렉토리-구조)
3. [실행 플로우](#3-실행-플로우)
4. [타입 정의](#4-타입-정의-srcsharedtypesindexts)
5. [API 라우트](#5-api-라우트)
6. [페이지 컴포넌트](#6-페이지-컴포넌트)
7. [Feature 컴포넌트](#7-feature-컴포넌트)
8. [상태 관리 (Zustand)](#8-상태-관리-zustand)
9. [핵심 라이브러리](#9-핵심-라이브러리)

---

## 1. 프로젝트 개요

**기술 스택**: Next.js 15 + TypeScript + React 19 + Zustand + LangChain + Chroma + Tailwind CSS

**핵심 기능**:
- PDF 문서 업로드 및 텍스트 추출
- 페이지 단위 임베딩 생성 (Google Text Embedding)
- Chroma 벡터 DB 저장
- RAG 기반 질의응답 (Google Gemini)

---

## 2. 디렉토리 구조

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API 엔드포인트
│   │   ├── chat/route.ts         # POST /api/chat
│   │   ├── collections/route.ts  # GET /api/collections
│   │   ├── evaluate/route.ts     # POST /api/evaluate
│   │   └── pdf/
│   │       ├── upload/route.ts   # POST /api/pdf/upload
│   │       └── [pdfId]/
│   │           ├── route.ts      # DELETE /api/pdf/[pdfId]
│   │           └── save/route.ts # POST /api/pdf/[pdfId]/save
│   ├── chat/[pdfId]/page.tsx     # 채팅 페이지
│   ├── page.tsx                  # 메인 홈페이지
│   ├── layout.tsx                # 루트 레이아웃
│   └── globals.css               # 글로벌 스타일
├── features/                     # 기능별 모듈 (Container/View 패턴)
│   ├── chat/                     # 채팅 기능
│   │   ├── ChatContainer.tsx     # 채팅 로직
│   │   ├── ChatView.tsx          # 채팅 UI
│   │   ├── MessageListView.tsx   # 메시지 목록
│   │   └── MessageInputView.tsx  # 메시지 입력
│   └── pdf/                      # PDF 업로드 기능
│       ├── PdfUploadContainer.tsx
│       ├── PdfUploadView.tsx
│       ├── PdfUploadModalContainer.tsx
│       ├── PdfUploadModalView.tsx
│       └── CollectionListView.tsx
└── shared/                       # 공유 리소스
    ├── components/               # 공용 UI 컴포넌트
    │   └── SpinnerView.tsx
    ├── lib/                      # 유틸리티 라이브러리
    │   ├── chroma.ts             # Chroma 클라이언트
    │   ├── pdf-loader.ts         # PDF 파싱
    │   └── langchain/            # RAG 파이프라인
    │       ├── embeddings.ts     # 임베딩 생성
    │       ├── llm.ts            # LLM 호출
    │       ├── rag.ts            # RAG 메인 로직
    │       ├── retriever.ts      # 문서 검색
    │       └── rag-evaluate.ts   # RAG 평가
    ├── stores/                   # Zustand 상태 관리
    │   ├── chatStore.ts
    │   └── pdfStore.ts
    └── types/                    # TypeScript 타입 정의
        └── index.ts
```

---

## 3. 실행 플로우

### 3.1 PDF 업로드 및 임베딩 플로우

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PDF 업로드 및 임베딩 플로우                        │
└─────────────────────────────────────────────────────────────────────────┘

1. 사용자가 PDF 파일 선택
   │
   ▼
2. PdfUploadContainer / PdfUploadModalContainer
   │ - 파일 크기 검증 (10MB 제한)
   │ - FormData 생성
   │
   ▼
3. POST /api/pdf/upload
   │ - multipart/form-data 파싱
   │ - PDF 파일 타입 검증
   │ - savePDFFile() 호출 → UUID 기반 pdfId 생성
   │ - /tmp/pdf-uploads/{pdfId}.pdf 저장
   │
   ▼
4. 클라이언트: pdfId 수신 후 임베딩 요청
   │
   ▼
5. POST /api/pdf/[pdfId]/save
   │ - pdfFileExists() 확인
   │ - loadPDFByPages() → 페이지별 텍스트 추출
   │ - embedDocuments() → Google Embedding API 호출
   │ - getOrCreateCollection() → Chroma 컬렉션 생성/조회
   │ - collection.upsert() → 임베딩 벡터 저장
   │
   ▼
6. 완료 → 채팅 페이지로 이동 (/chat/[pdfId])
```

### 3.2 RAG 질의응답 플로우

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RAG 질의응답 플로우                               │
└─────────────────────────────────────────────────────────────────────────┘

1. 사용자가 메시지 입력 후 전송
   │
   ▼
2. ChatContainer.handleSendMessage()
   │ - 사용자 메시지를 chatStore에 추가
   │ - POST /api/chat 호출
   │
   ▼
3. POST /api/chat
   │ - 입력 검증 (pdfId, message)
   │ - collectionExists() 확인
   │ - executeRAGPipeline() 호출
   │
   ▼
4. executeRAGPipeline() [rag.ts]
   │
   ├─▶ 4.1 retrieveRelevantDocuments() [retriever.ts]
   │   │ - embedText(query) → 질의 임베딩
   │   │ - collection.query() → Chroma TopK 검색
   │   │ - distance → similarity score 변환
   │   │
   │   ▼
   ├─▶ 4.2 formatContextsForLLM() [retriever.ts]
   │   │ - 검색 결과를 프롬프트용 컨텍스트로 변환
   │   │
   │   ▼
   ├─▶ 4.3 createRAGSystemPrompt() + createRAGPrompt() [llm.ts]
   │   │ - 시스템 프롬프트 생성 (규칙 정의)
   │   │ - 사용자 프롬프트 생성 (컨텍스트 + 질문)
   │   │
   │   ▼
   └─▶ 4.4 generateAnswer() [llm.ts]
       │ - streamText() → Google Gemini 스트리밍 호출
       │ - 응답 텍스트 수집
       │
       ▼
5. ChatResponse 반환
   │ - answer: LLM 생성 답변
   │ - sources: 참조 페이지 정보 (페이지번호, 파일명, snippet, score)
   │
   ▼
6. ChatContainer
   │ - AI 응답을 chatStore에 추가
   │ - MessageListView에서 렌더링
```

### 3.3 메인 페이지 상태 흐름

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        메인 페이지 상태 흐름                             │
└─────────────────────────────────────────────────────────────────────────┘

페이지 로드
    │
    ▼
fetchCollections() → GET /api/collections
    │
    ├─▶ isLoadingCollections = true
    │   │
    │   ▼
    │   "loading" 상태 → SpinnerView 표시
    │
    ▼
collections 로드 완료
    │
    ├─▶ collections.length === 0
    │   │
    │   ▼
    │   "empty" 상태 → PdfUploadContainer 표시
    │
    ├─▶ collections.length === 1
    │   │
    │   ▼
    │   "single_auto_select" 상태
    │   → 자동으로 /chat/[pdfId]로 이동
    │
    └─▶ collections.length >= 2
        │
        ▼
        "multiple_select" 상태
        → CollectionListView 표시
        → 사용자가 PDF 선택 or 삭제 or 새 업로드
```

---

## 4. 타입 정의 (`src/shared/types/index.ts`)

```typescript
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ PDF 업로드 관련 타입 정의                                               │
// └─────────────────────────────────────────────────────────────────────────┘

// PDF 업로드 API 응답 타입
// - 업로드 완료 시 반환되는 정보
export interface UploadPdfResponse {
  pdfId: string;           // UUID 기반 고유 식별자
  fileName: string;        // 원본 파일명
  fileSize: number;        // 파일 크기 (bytes)
  uploadedAt: string;      // 업로드 시간 (ISO 8601)
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ PDF 저장/임베딩 관련 타입 정의                                          │
// └─────────────────────────────────────────────────────────────────────────┘

// 임베딩 저장 완료 응답 타입
export interface SavePdfResponse {
  pdfId: string;           // PDF 고유 식별자
  status: 'embedded';      // 상태 (항상 'embedded')
  totalPages: number;      // 전체 페이지 수
  collectionName: string;  // Chroma 컬렉션 이름 (pdf_{pdfId})
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 챗봇 메시지 관련 타입 정의                                              │
// └─────────────────────────────────────────────────────────────────────────┘

// 채팅 API 요청 바디
export interface ChatRequest {
  pdfId: string;           // 대상 PDF 식별자
  message: string;         // 사용자 질문
}

// 채팅 응답의 출처 정보
// - RAG 검색 결과에서 추출된 참조 페이지 정보
export interface ChatSource {
  pageNumber: number;      // 페이지 번호
  fileName: string;        // PDF 파일명
  snippet: string;         // 해당 페이지 텍스트 미리보기 (80자)
  score?: number;          // 유사도 점수 (0~1, 높을수록 관련성 높음)
}

// 채팅 API 응답 타입
export interface ChatResponse {
  answer: string;          // LLM이 생성한 답변
  sources: ChatSource[];   // 참조 출처 목록
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 프론트엔드 채팅 메시지 타입                                             │
// └─────────────────────────────────────────────────────────────────────────┘

// 채팅 UI에서 사용하는 메시지 타입
export interface Message {
  id: string;              // 고유 ID (user-{timestamp} 또는 assistant-{timestamp})
  role: 'user' | 'assistant';  // 발신자 역할
  content: string;         // 메시지 내용
  timestamp: Date;         // 전송 시간
  sources?: ChatSource[];  // AI 응답의 경우 참조 출처
  isError?: boolean;       // 에러 메시지 여부
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ PDF Document Metadata (Chroma 저장용)                                  │
// └─────────────────────────────────────────────────────────────────────────┘

// Chroma에 저장되는 문서 메타데이터
// - index signature는 Chroma Metadata 타입 호환성을 위함
export interface PDFDocumentMetadata {
  fileName: string;        // PDF 파일명
  pageNumber: number;      // 페이지 번호
  snippet: string;         // 텍스트 미리보기
  createdAt: string;       // 생성 시간
  [key: string]: string | number | boolean;  // Chroma 호환용 인덱스 시그니처
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 컬렉션 관련 타입 정의                                                   │
// └─────────────────────────────────────────────────────────────────────────┘

// 컬렉션(PDF) 정보
export interface CollectionInfo {
  pdfId: string;           // PDF 고유 식별자
  fileName: string;        // PDF 파일명
  documentCount: number;   // 임베딩된 페이지(문서) 수
  createdAt?: string;      // 생성 시간
}

// 컬렉션 목록 조회 메타 정보
export interface CollectionsMeta {
  total: number;           // 전체 컬렉션 수
  success: number;         // 성공적으로 조회된 수
  failed: number;          // 조회 실패 수
}

// 컬렉션 목록 API 응답
export interface GetCollectionsResponse {
  collections: CollectionInfo[];  // 컬렉션 목록
  meta: CollectionsMeta;          // 메타 정보
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ PDF 삭제 응답 타입 정의                                                 │
// └─────────────────────────────────────────────────────────────────────────┘

// PDF 삭제 API 응답
export interface DeletePdfResponse {
  pdfId: string;           // 삭제된 PDF 식별자
  deleted: boolean;        // 완전 삭제 여부
  message: string;         // 결과 메시지
  partialSuccess?: boolean;    // 부분 성공 여부 (컬렉션만 삭제 등)
  collectionDeleted?: boolean; // 컬렉션 삭제 여부
  fileDeleted?: boolean;       // 파일 삭제 여부
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 에러 응답 타입                                                          │
// └─────────────────────────────────────────────────────────────────────────┘

// 모든 API의 에러 응답 형식
export interface ErrorResponse {
  error: string;           // 사용자 친화적 에러 메시지
  details?: string;        // 상세 에러 정보 (개발용)
  code?: string;           // 에러 코드 (프로그래밍용)
}
```

---

## 5. API 라우트

### 5.1 PDF 업로드 (`src/app/api/pdf/upload/route.ts`)

```typescript
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 의존성 import                                                           │
// └─────────────────────────────────────────────────────────────────────────┘
import { NextRequest, NextResponse } from 'next/server';     // Next.js 서버 요청/응답 타입
import { savePDFFile } from '@/shared/lib/pdf-loader';        // PDF 파일 저장 함수
import { UploadPdfResponse, ErrorResponse } from '@/shared/types';  // 타입 정의

// Node.js 런타임 사용 (Edge 런타임에서는 fs 사용 불가)
export const runtime = 'nodejs';

/**
 * POST /api/pdf/upload
 * multipart/form-data로 PDF 파일을 수신하여 임시 저장
 * 반환: { pdfId, fileName, fileSize, uploadedAt }
 */
export async function POST(request: NextRequest) {
  try {
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 1단계: FormData에서 파일 추출                                        │
    // └─────────────────────────────────────────────────────────────────────┘
    const formData = await request.formData();     // multipart/form-data 파싱
    const file = formData.get('file') as File;     // 'file' 필드에서 File 객체 추출

    // 파일 존재 여부 검증
    if (!file) {
      return NextResponse.json<ErrorResponse>(
        { error: '파일이 제공되지 않았습니다.', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 2단계: 파일 타입 검증                                                │
    // └─────────────────────────────────────────────────────────────────────┘
    if (file.type !== 'application/pdf') {
      return NextResponse.json<ErrorResponse>(
        { error: 'PDF 파일만 업로드 가능합니다.', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 3단계: 파일 크기 검증 (10MB 제한)                                    │
    // └─────────────────────────────────────────────────────────────────────┘
    const MAX_FILE_SIZE = 10 * 1024 * 1024;        // 10MB를 바이트로 환산
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ErrorResponse>(
        { error: '파일 크기가 너무 큽니다. (최대 10MB)', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 4단계: File 객체를 Buffer로 변환                                     │
    // └─────────────────────────────────────────────────────────────────────┘
    const arrayBuffer = await file.arrayBuffer();  // File → ArrayBuffer
    const buffer = Buffer.from(arrayBuffer);       // ArrayBuffer → Node.js Buffer

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 5단계: PDF 파일 저장                                                 │
    // └─────────────────────────────────────────────────────────────────────┘
    // savePDFFile: UUID 생성 → /tmp/pdf-uploads/{pdfId}.pdf 저장
    const { pdfId, fileName } = savePDFFile(buffer, file.name);

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 6단계: 성공 응답 반환                                                │
    // └─────────────────────────────────────────────────────────────────────┘
    const response: UploadPdfResponse = {
      pdfId,                               // 생성된 UUID
      fileName,                            // 원본 파일명
      fileSize: file.size,                 // 파일 크기
      uploadedAt: new Date().toISOString() // 업로드 시간
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 예외 처리: 서버 에러 응답                                            │
    // └─────────────────────────────────────────────────────────────────────┘
    return NextResponse.json<ErrorResponse>(
      {
        error: 'PDF 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'UPLOAD_ERROR'
      },
      { status: 500 }
    );
  }
}
```

### 5.2 PDF 임베딩 저장 (`src/app/api/pdf/[pdfId]/save/route.ts`)

```typescript
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 의존성 import                                                           │
// └─────────────────────────────────────────────────────────────────────────┘
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';                                      // 경로 처리
import { getChromaClient, getCollectionName, getOrCreateCollection } from '@/shared/lib/chroma';
import { loadPDFByPages, pdfFileExists } from '@/shared/lib/pdf-loader';
import { embedDocuments } from '@/shared/lib/langchain/embeddings';
import { SavePdfResponse, ErrorResponse, PDFDocumentMetadata } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * POST /api/pdf/[pdfId]/save
 * 저장된 PDF를 페이지별로 로드하여 임베딩 후 Chroma에 저장
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pdfId: string }> }  // Next.js 15 동적 params
) {
  try {
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 1단계: URL 파라미터 및 요청 바디 파싱                                 │
    // └─────────────────────────────────────────────────────────────────────┘
    const { pdfId } = await params;                // URL에서 pdfId 추출

    // 요청 바디에서 원본 파일명 가져오기 (선택 사항)
    let originalFileName: string | undefined;
    try {
      const body = await request.json();
      originalFileName = body.fileName;            // 클라이언트가 전송한 원본 파일명
    } catch {
      // body가 없거나 JSON 파싱 실패 시 무시 (optional 필드)
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 2단계: PDF 파일 존재 확인                                            │
    // └─────────────────────────────────────────────────────────────────────┘
    const { exists, filePath } = pdfFileExists(pdfId);
    if (!exists || !filePath) {
      return NextResponse.json<ErrorResponse>(
        { error: 'PDF 파일을 찾을 수 없습니다.', code: 'PDF_NOT_FOUND' },
        { status: 404 }
      );
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 3단계: PDF 로드 (페이지별 텍스트 추출)                                │
    // └─────────────────────────────────────────────────────────────────────┘
    const fileName = originalFileName || path.basename(filePath);
    // loadPDFByPages: pdf-parse 라이브러리로 페이지별 텍스트 추출
    const { pages, totalPages } = await loadPDFByPages(filePath, fileName);

    if (pages.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'PDF에서 텍스트를 추출할 수 없습니다.', code: 'NO_TEXT_EXTRACTED' },
        { status: 400 }
      );
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 4단계: 임베딩 생성                                                   │
    // └─────────────────────────────────────────────────────────────────────┘
    const texts = pages.map((page) => page.text);  // 페이지별 텍스트 배열
    // embedDocuments: Google Text Embedding API 호출
    const embeddings = await embedDocuments(texts);

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 5단계: Chroma 컬렉션 준비                                            │
    // └─────────────────────────────────────────────────────────────────────┘
    const client = getChromaClient();              // 싱글톤 클라이언트
    const collectionName = getCollectionName(pdfId);  // "pdf_{pdfId}" 형식
    const collection = await getOrCreateCollection(client, collectionName);

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 6단계: 문서 ID 및 메타데이터 준비                                     │
    // └─────────────────────────────────────────────────────────────────────┘
    // 각 페이지에 고유 ID 부여: "{collectionName}_page_{pageNumber}"
    const ids = pages.map((page) => `${collectionName}_page_${page.pageNumber}`);

    // 메타데이터: 파일명, 페이지번호, snippet(80자 미리보기), 생성시간
    const metadatas: PDFDocumentMetadata[] = pages.map((page) => {
      const snippet = page.text.length > 80
        ? page.text.substring(0, 80) + '...'
        : page.text;

      return {
        fileName,
        pageNumber: page.pageNumber,
        snippet,
        createdAt: new Date().toISOString()
      };
    });

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 7단계: Chroma에 upsert (존재하면 업데이트, 없으면 삽입)               │
    // └─────────────────────────────────────────────────────────────────────┘
    await collection.upsert({
      ids,                    // 문서 ID 배열
      embeddings,             // 임베딩 벡터 배열
      documents: texts,       // 원본 텍스트 배열
      metadatas               // 메타데이터 배열
    });

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 8단계: 성공 응답 반환                                                │
    // └─────────────────────────────────────────────────────────────────────┘
    const response: SavePdfResponse = {
      pdfId,
      status: 'embedded',
      totalPages,
      collectionName
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: 'PDF 저장 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'SAVE_ERROR'
      },
      { status: 500 }
    );
  }
}
```

### 5.3 PDF 삭제 (`src/app/api/pdf/[pdfId]/route.ts`)

```typescript
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 의존성 import                                                           │
// └─────────────────────────────────────────────────────────────────────────┘
import { NextRequest, NextResponse } from 'next/server';
import { getChromaClient, getCollectionName } from '@/shared/lib/chroma';
import { deletePDFFile, pdfFileExists } from '@/shared/lib/pdf-loader';
import { DeletePdfResponse, ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * DELETE /api/pdf/[pdfId]
 * PDF 파일 및 Chroma 컬렉션 삭제
 * 삭제 순서: Chroma 컬렉션 → 로컬 파일
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pdfId: string }> }
) {
  try {
    const { pdfId } = await params;

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 1단계: PDF 파일 존재 확인                                            │
    // └─────────────────────────────────────────────────────────────────────┘
    const { exists } = pdfFileExists(pdfId);
    const collectionName = getCollectionName(pdfId);

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 2단계: Chroma 컬렉션 존재 확인                                       │
    // └─────────────────────────────────────────────────────────────────────┘
    const client = getChromaClient();
    let collectionExists = false;

    try {
      await client.getCollection({ name: collectionName });
      collectionExists = true;
    } catch {
      collectionExists = false;  // 컬렉션 없음 (예상된 케이스)
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 3단계: 파일과 컬렉션 모두 없으면 404                                  │
    // └─────────────────────────────────────────────────────────────────────┘
    if (!exists && !collectionExists) {
      return NextResponse.json<ErrorResponse>(
        { error: 'PDF 파일 또는 컬렉션을 찾을 수 없습니다.', code: 'PDF_NOT_FOUND' },
        { status: 404 }
      );
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 4단계: Chroma 컬렉션 삭제                                            │
    // └─────────────────────────────────────────────────────────────────────┘
    let collectionDeleted = false;
    if (collectionExists) {
      try {
        await client.deleteCollection({ name: collectionName });
        collectionDeleted = true;
      } catch (error) {
        return NextResponse.json<ErrorResponse>(
          {
            error: 'Chroma 컬렉션 삭제 중 오류가 발생했습니다.',
            details: error instanceof Error ? error.message : String(error),
            code: 'CHROMA_DELETE_ERROR'
          },
          { status: 500 }
        );
      }
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 5단계: 로컬 PDF 파일 삭제                                            │
    // └─────────────────────────────────────────────────────────────────────┘
    let fileDeleted = false;
    if (exists) {
      try {
        fileDeleted = deletePDFFile(pdfId);
      } catch (error) {
        // 파일 삭제 실패 시 부분 성공 응답 (207 Multi-Status)
        return NextResponse.json<DeletePdfResponse>(
          {
            pdfId,
            deleted: false,
            partialSuccess: true,
            collectionDeleted: true,
            fileDeleted: false,
            message: `컬렉션은 삭제되었으나 파일 삭제 실패: ${error instanceof Error ? error.message : String(error)}`
          },
          { status: 207 }
        );
      }
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 6단계: 성공 응답                                                     │
    // └─────────────────────────────────────────────────────────────────────┘
    const response: DeletePdfResponse = {
      pdfId,
      deleted: true,
      message: `PDF 삭제 완료 (컬렉션: ${collectionDeleted ? '삭제됨' : '없음'}, 파일: ${fileDeleted ? '삭제됨' : '없음'})`
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: 'PDF 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'DELETE_ERROR'
      },
      { status: 500 }
    );
  }
}
```

### 5.4 채팅 API (`src/app/api/chat/route.ts`)

```typescript
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 의존성 import                                                           │
// └─────────────────────────────────────────────────────────────────────────┘
import { NextRequest, NextResponse } from 'next/server';
import { executeRAGPipeline } from '@/shared/lib/langchain/rag';
import { collectionExists, getChromaClient, getCollectionName } from '@/shared/lib/chroma';
import { ChatRequest, ChatResponse, ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * POST /api/chat
 * RAG 기반 질의응답
 * 질의 임베딩 → Chroma TopK 검색 → LLM 답변 생성
 */
export async function POST(request: NextRequest) {
  try {
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 1단계: 요청 바디 파싱                                                │
    // └─────────────────────────────────────────────────────────────────────┘
    const body: ChatRequest = await request.json();
    const { pdfId, message } = body;

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 2단계: 입력 검증                                                     │
    // └─────────────────────────────────────────────────────────────────────┘
    if (!pdfId || !message) {
      return NextResponse.json<ErrorResponse>(
        { error: 'pdfId와 message는 필수 입력값입니다.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (message.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: '메시지는 비어있을 수 없습니다.', code: 'EMPTY_MESSAGE' },
        { status: 400 }
      );
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 3단계: Chroma 컬렉션 존재 확인                                       │
    // └─────────────────────────────────────────────────────────────────────┘
    const client = getChromaClient();
    const collectionName = getCollectionName(pdfId);
    const exists = await collectionExists(client, collectionName);

    if (!exists) {
      return NextResponse.json<ErrorResponse>(
        {
          error: '해당 PDF의 임베딩 데이터를 찾을 수 없습니다. 먼저 PDF를 저장해주세요.',
          code: 'COLLECTION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 4단계: RAG 파이프라인 실행                                           │
    // └─────────────────────────────────────────────────────────────────────┘
    const topK = parseInt(process.env.TOP_K || '6', 10);  // 검색 결과 개수 (기본 6)
    // executeRAGPipeline: 검색 → 프롬프트 생성 → LLM 호출
    const { answer, sources } = await executeRAGPipeline(pdfId, message, topK);

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 5단계: 응답 반환                                                     │
    // └─────────────────────────────────────────────────────────────────────┘
    const response: ChatResponse = {
      answer,    // LLM 생성 답변
      sources    // 참조 페이지 정보
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '답변 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'CHAT_ERROR'
      },
      { status: 500 }
    );
  }
}
```

### 5.5 컬렉션 목록 조회 (`src/app/api/collections/route.ts`)

```typescript
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 의존성 import                                                           │
// └─────────────────────────────────────────────────────────────────────────┘
import { NextResponse } from 'next/server';
import { getChromaClient } from '@/shared/lib/chroma';
import { GetCollectionsResponse, CollectionInfo, ErrorResponse, CollectionsMeta } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * GET /api/collections
 * Chroma에 저장된 모든 PDF 컬렉션 목록 조회
 */
export async function GET() {
  try {
    const client = getChromaClient();

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 1단계: 모든 컬렉션 조회 및 필터링                                     │
    // └─────────────────────────────────────────────────────────────────────┘
    const allCollections = await client.listCollections();
    // "pdf_" 접두사를 가진 컬렉션만 필터링 (우리 앱에서 생성한 것만)
    const pdfCollections = allCollections.filter((collection) =>
      collection.name.startsWith('pdf_')
    );

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 2단계: 각 컬렉션 정보 추출                                           │
    // └─────────────────────────────────────────────────────────────────────┘
    const collectionsInfo: CollectionInfo[] = [];
    let failedCount = 0;

    for (const collection of pdfCollections) {
      try {
        // pdfId 추출: "pdf_" 접두사 제거
        const pdfId = collection.name.replace('pdf_', '');

        // 컬렉션 객체 가져오기
        const chromaCollection = await client.getCollection({ name: collection.name });

        // 문서 개수 조회
        const count = await chromaCollection.count();

        // 메타데이터 추출을 위해 첫 번째 문서 조회
        let fileName = 'Unknown';
        let createdAt: string | undefined;

        if (count > 0) {
          const result = await chromaCollection.get({ limit: 1 });

          if (result.metadatas?.[0]) {
            const metadata = result.metadatas[0];
            fileName = typeof metadata.fileName === 'string' ? metadata.fileName : 'Unknown';
            createdAt = typeof metadata.createdAt === 'string' ? metadata.createdAt : undefined;
          }
        }

        collectionsInfo.push({
          pdfId,
          fileName,
          documentCount: count,
          createdAt
        });
      } catch {
        failedCount++;  // 개별 컬렉션 조회 실패 시 카운트 증가
      }
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 3단계: 메타 정보 생성 및 응답 반환                                    │
    // └─────────────────────────────────────────────────────────────────────┘
    const meta: CollectionsMeta = {
      total: pdfCollections.length,
      success: collectionsInfo.length,
      failed: failedCount
    };

    const response: GetCollectionsResponse = {
      collections: collectionsInfo,
      meta
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '컬렉션 목록 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'COLLECTIONS_FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}
```

---

## 6. 페이지 컴포넌트

### 6.1 루트 레이아웃 (`src/app/layout.tsx`)

```typescript
import type { Metadata } from "next";               // Next.js 메타데이터 타입
import localFont from "next/font/local";            // 로컬 폰트 로더
import "./globals.css";                              // 글로벌 CSS

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 로컬 폰트 설정 (Pretendard Variable)                                    │
// └─────────────────────────────────────────────────────────────────────────┘
const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",  // 폰트 파일 경로
  variable: "--font-sans",                              // CSS 변수명
  display: "swap",                                      // 폰트 로드 전략
  weight: "100 900",                                    // 가변 폰트 두께 범위
  preload: true                                         // 사전 로드 활성화
});

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 페이지 메타데이터                                                        │
// └─────────────────────────────────────────────────────────────────────────┘
export const metadata: Metadata = {
  title: "Chatbot",
  description: "AI Chatbot Application"
};

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 루트 레이아웃 컴포넌트                                                   │
// └─────────────────────────────────────────────────────────────────────────┘
export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">                                 {/* 한국어 설정 */}
      <body className={`${pretendard.variable} font-sans antialiased`}>
        {children}                                   {/* 페이지 콘텐츠 */}
      </body>
    </html>
  );
}
```

### 6.2 메인 페이지 (`src/app/page.tsx`)

```typescript
'use client';  // 클라이언트 컴포넌트 선언

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 의존성 import                                                           │
// └─────────────────────────────────────────────────────────────────────────┘
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';         // Next.js 라우터
import { useShallow } from 'zustand/react/shallow';  // Zustand 얕은 비교 훅
import { usePdfStore } from '@/shared/stores/pdfStore';
import { PdfUploadContainer } from '@/features/pdf/PdfUploadContainer';
import { PdfUploadModalContainer } from '@/features/pdf/PdfUploadModalContainer';
import { SpinnerView } from '@/shared/components/SpinnerView';
import { CollectionListView } from '@/features/pdf/CollectionListView';
import type { CollectionInfo } from '@/shared/types';

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 페이지 상태 타입 정의                                                    │
// └─────────────────────────────────────────────────────────────────────────┘
// - loading: 컬렉션 로딩 중
// - error: 로드 실패
// - empty: PDF 0개 (업로드 화면)
// - single_auto_select: PDF 1개 (자동 이동)
// - multiple_select: PDF 2개 이상 (선택 화면)
type PageState = 'loading' | 'error' | 'empty' | 'single_auto_select' | 'multiple_select';

export default function Home() {
  const router = useRouter();

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ Zustand 스토어에서 상태와 액션 추출 (useShallow로 불필요한 리렌더 방지)   │
  // └─────────────────────────────────────────────────────────────────────────┘
  const {
    isEmbedding,
    isLoadingCollections,
    isDeletingPdf,
    collections,
    error,
    fetchCollections,
    deleteCollection
  } = usePdfStore(
    useShallow((state) => ({
      isEmbedding: state.isEmbedding,
      isLoadingCollections: state.isLoadingCollections,
      isDeletingPdf: state.isDeletingPdf,
      collections: state.collections,
      error: state.error,
      fetchCollections: state.fetchCollections,
      deleteCollection: state.deleteCollection
    }))
  );

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 로컬 상태                                                               │
  // └─────────────────────────────────────────────────────────────────────────┘
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasAutoSelected = useRef(false);              // 자동 선택 완료 플래그
  const prevCollectionsLengthRef = useRef(collections.length);  // 이전 컬렉션 수

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 초기 컬렉션 데이터 로드                                                 │
  // └─────────────────────────────────────────────────────────────────────────┘
  useEffect(() => {
    fetchCollections();
  }, []);

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 자동 선택 대상 계산 (PDF가 1개일 때)                                    │
  // └─────────────────────────────────────────────────────────────────────────┘
  const autoSelectTarget = useMemo(() => {
    if (collections.length === 1) {
      return collections[0];
    }
    return null;
  }, [collections]);

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 삭제 감지 시 자동 선택 플래그 리셋                                       │
  // └─────────────────────────────────────────────────────────────────────────┘
  useEffect(() => {
    const prevLength = prevCollectionsLengthRef.current;
    const currentLength = collections.length;

    if (currentLength < prevLength) {
      hasAutoSelected.current = false;  // 삭제 발생 시 리셋
    }

    prevCollectionsLengthRef.current = currentLength;
  }, [collections]);

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ PDF 1개일 때 자동 선택 및 라우터 이동                                   │
  // └─────────────────────────────────────────────────────────────────────────┘
  useEffect(() => {
    if (hasAutoSelected.current) return;      // 이미 선택 완료
    if (isLoadingCollections) return;          // 로딩 중

    if (autoSelectTarget) {
      hasAutoSelected.current = true;
      router.push(`/chat/${autoSelectTarget.pdfId}`);  // 채팅 페이지로 이동
    }
  }, [isLoadingCollections, autoSelectTarget]);

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 이벤트 핸들러                                                           │
  // └─────────────────────────────────────────────────────────────────────────┘
  const handleUploadComplete = async () => {
    setIsModalOpen(false);
    hasAutoSelected.current = false;  // 업로드 완료 시 자동 선택 리셋
    await fetchCollections();
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSelectCollection = (collection: CollectionInfo) => {
    router.push(`/chat/${collection.pdfId}`);
  };

  const handleNewPdfFromList = () => setIsModalOpen(true);

  const handleDeleteCollection = async (pdfId: string) => {
    try {
      await deleteCollection(pdfId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.';
      alert(errorMessage);
    }
  };

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 현재 페이지 상태 계산                                                   │
  // └─────────────────────────────────────────────────────────────────────────┘
  const getCurrentState = (): PageState => {
    if (isLoadingCollections) return 'loading';
    if (error) return 'error';
    if (collections.length === 0) return 'empty';
    if (collections.length === 1) return 'single_auto_select';
    return 'multiple_select';
  };

  const currentState = getCurrentState();

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 상태별 렌더링 분기                                                      │
  // └─────────────────────────────────────────────────────────────────────────┘

  // 1. 로딩 상태
  if (currentState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <SpinnerView message="기존 데이터를 확인하고 있습니다..." size="lg" />
        </div>
      </div>
    );
  }

  // 2. 에러 상태
  if (currentState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg max-w-md w-full">
          <p className="text-red-500 font-semibold text-center mb-2">
            컬렉션을 불러오는데 실패했습니다.
          </p>
          <p className="text-gray-500 text-sm text-center mb-6">{error}</p>
          <div className="flex gap-2">
            <button onClick={() => fetchCollections()} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded">
              다시 시도
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex-1 px-4 py-2 bg-green-500 text-white rounded">
              새 PDF 업로드
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. 임베딩 진행 중
  if (isEmbedding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <SpinnerView message="PDF를 분석하고 있습니다..." size="lg" />
        </div>
      </div>
    );
  }

  // 4. PDF 1개 - 자동 선택 진행 중
  if (currentState === 'single_auto_select') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <SpinnerView message="PDF를 불러오는 중..." size="lg" />
        </div>
      </div>
    );
  }

  // 5. PDF 2개 이상 - 선택 화면
  if (currentState === 'multiple_select') {
    return (
      <>
        <CollectionListView
          collections={collections}
          onSelectCollection={handleSelectCollection}
          onDeleteCollection={handleDeleteCollection}
          onNewPdf={handleNewPdfFromList}
          isDeletingPdf={isDeletingPdf}
        />
        <PdfUploadModalContainer
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUploadComplete={handleUploadComplete}
        />
      </>
    );
  }

  // 6. PDF 0개 - 업로드 화면
  return <PdfUploadContainer onUploadComplete={handleUploadComplete} />;
}
```

### 6.3 채팅 페이지 (`src/app/chat/[pdfId]/page.tsx`)

```typescript
'use client';

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 의존성 import                                                           │
// └─────────────────────────────────────────────────────────────────────────┘
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePdfStore } from '@/shared/stores/pdfStore';
import { ChatContainer } from '@/features/chat/ChatContainer';
import { PdfUploadModalContainer } from '@/features/pdf/PdfUploadModalContainer';
import { SpinnerView } from '@/shared/components/SpinnerView';

/**
 * 동적 라우트: /chat/[pdfId]
 * URL의 pdfId로 PDF 정보를 조회하고 채팅 UI 렌더링
 */
export default function ChatPage() {
  const params = useParams();
  const router = useRouter();

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ Zustand 스토어에서 상태 추출                                            │
  // └─────────────────────────────────────────────────────────────────────────┘
  const {
    pdfId: storePdfId,
    collections,
    isLoadingCollections,
    error: collectionsError,
    fetchCollections,
    selectCollection,
    clearSelection
  } = usePdfStore();

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 로컬 상태                                                               │
  // └─────────────────────────────────────────────────────────────────────────┘
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const urlPdfId = params.pdfId as string;  // URL에서 추출한 pdfId

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 초기화: collections 로드                                                │
  // └─────────────────────────────────────────────────────────────────────────┘
  useEffect(() => {
    const initialize = async () => {
      if (collections.length === 0 && !isLoadingCollections) {
        await fetchCollections();
      }
      setIsInitializing(false);
    };
    initialize();
  }, [collections.length, isLoadingCollections, fetchCollections]);

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ pdfId 검증 및 스토어 동기화                                             │
  // └─────────────────────────────────────────────────────────────────────────┘
  useEffect(() => {
    if (isInitializing || isLoadingCollections) return;
    if (collectionsError) return;

    if (collections.length > 0) {
      // URL의 pdfId가 컬렉션에 존재하는지 확인
      const targetCollection = collections.find((c) => c.pdfId === urlPdfId);

      if (!targetCollection) {
        setNotFound(true);  // 존재하지 않는 pdfId
        return;
      }

      // 스토어 동기화 (URL과 스토어의 pdfId가 다른 경우)
      if (storePdfId !== urlPdfId) {
        selectCollection(targetCollection);
      }
    } else {
      router.replace('/');  // 컬렉션이 비어있으면 메인으로
    }
  }, [urlPdfId, storePdfId, collections, isInitializing, isLoadingCollections, collectionsError]);

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ notFound 상태 - 3초 후 메인으로 리다이렉트                               │
  // └─────────────────────────────────────────────────────────────────────────┘
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (notFound) {
      timeoutId = setTimeout(() => {
        router.replace('/');
      }, 3000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);  // cleanup
    };
  }, [notFound]);

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 이벤트 핸들러                                                           │
  // └─────────────────────────────────────────────────────────────────────────┘
  const handleBack = () => {
    clearSelection();
    router.push('/');
  };

  const handleNewPdf = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleUploadComplete = async () => {
    setIsModalOpen(false);
    await fetchCollections();
  };

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 렌더링 분기                                                             │
  // └─────────────────────────────────────────────────────────────────────────┘

  // 로딩 중
  if (isInitializing || isLoadingCollections) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <SpinnerView message="채팅을 준비하고 있습니다..." size="lg" />
      </div>
    );
  }

  // 에러 상태
  if (collectionsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg max-w-md w-full">
          <p className="text-red-500 font-semibold text-center mb-2">
            채팅을 불러오는데 실패했습니다.
          </p>
          <button onClick={() => fetchCollections()} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // PDF를 찾을 수 없음
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-700 font-semibold">해당 PDF를 찾을 수 없습니다.</p>
        <p className="text-sm text-gray-500">잠시 후 메인 화면으로 이동합니다...</p>
      </div>
    );
  }

  // 스토어에 pdfId가 없으면 로딩 표시
  if (!storePdfId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <SpinnerView message="로딩 중..." size="lg" />
      </div>
    );
  }

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 정상 렌더링: 채팅 UI                                                    │
  // └─────────────────────────────────────────────────────────────────────────┘
  return (
    <>
      <ChatContainer onNewPdf={handleNewPdf} onBack={handleBack} />
      <PdfUploadModalContainer
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
}
```

---

## 7. Feature 컴포넌트

### 7.1 ChatContainer (`src/features/chat/ChatContainer.tsx`)

```typescript
'use client';

import { useChatStore } from '@/shared/stores/chatStore';
import { usePdfStore } from '@/shared/stores/pdfStore';
import { ChatView } from './ChatView';

interface ChatContainerProps {
  onNewPdf: () => void;    // 새 PDF 업로드 버튼 핸들러
  onBack?: () => void;      // 뒤로가기 버튼 핸들러
}

/**
 * 채팅 기능의 로직 컨테이너
 * - 상태 관리 (messages, isLoading)
 * - API 통신 (POST /api/chat)
 * - ChatView에 props 전달
 */
export function ChatContainer({ onNewPdf, onBack }: ChatContainerProps) {
  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ Zustand 스토어에서 상태 추출                                            │
  // └─────────────────────────────────────────────────────────────────────────┘
  const { messages, isLoading, addMessage, setIsLoading, setError } = useChatStore();
  const { pdfId, pdfFileName } = usePdfStore();

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 메시지 전송 핸들러                                                      │
  // └─────────────────────────────────────────────────────────────────────────┘
  const handleSendMessage = async (content: string) => {
    if (!pdfId || isLoading) return;  // pdfId 없거나 로딩 중이면 무시

    try {
      // 1. 사용자 메시지 추가 (낙관적 업데이트)
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content,
        timestamp: new Date()
      };
      addMessage(userMessage);

      setIsLoading(true);
      setError(null);

      // 2. API 호출
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfId, message: content })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '메시지 전송에 실패했습니다.');
      }

      const data = await response.json();

      // 3. AI 응답 추가 (sources 포함)
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: data.answer,
        timestamp: new Date(),
        sources: data.sources  // 참조 페이지 정보
      };
      addMessage(assistantMessage);
    } catch (err) {
      // 4. 에러 처리 - 에러 메시지도 채팅에 표시
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);

      const errorMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant' as const,
        content: `오류: ${errorMessage}`,
        timestamp: new Date(),
        isError: true  // 에러 플래그
      };
      addMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ View 컴포넌트 렌더링                                                    │
  // └─────────────────────────────────────────────────────────────────────────┘
  return (
    <ChatView
      messages={messages}
      isLoading={isLoading}
      pdfFileName={pdfFileName}
      onSendMessage={handleSendMessage}
      onNewPdf={onNewPdf}
      onBack={onBack}
    />
  );
}
```

### 7.2 ChatView (`src/features/chat/ChatView.tsx`)

```typescript
import { Message } from '@/shared/stores/chatStore';
import { MessageListView } from './MessageListView';
import { MessageInputView } from './MessageInputView';

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  pdfFileName: string | null;
  onSendMessage: (message: string) => void;
  onNewPdf: () => void;
  onBack?: () => void;
}

/**
 * 채팅 UI 레이아웃 (프레젠테이션 컴포넌트)
 * - 헤더: 뒤로가기, 제목, 새 PDF 버튼
 * - 메시지 영역: MessageListView
 * - 입력 영역: MessageInputView
 */
export function ChatView({
  messages,
  isLoading,
  pdfFileName,
  onSendMessage,
  onNewPdf,
  onBack
}: ChatViewProps) {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* ┌─────────────────────────────────────────────────────────────────────┐
          │ 헤더 영역                                                           │
          └─────────────────────────────────────────────────────────────────────┘ */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 뒤로가기 버튼 (옵션) */}
            {onBack && (
              <button onClick={onBack} className="...">
                <svg>...</svg>
              </button>
            )}
            {/* 앱 아이콘 및 제목 */}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">PDF 챗봇</h1>
              {pdfFileName && (
                <p className="text-xs text-gray-500">{pdfFileName}</p>
              )}
            </div>
          </div>
          {/* 새 PDF 업로드 버튼 */}
          <button onClick={onNewPdf} className="...">
            새로운 PDF
          </button>
        </div>
      </div>

      {/* ┌─────────────────────────────────────────────────────────────────────┐
          │ 메시지 영역                                                         │
          └─────────────────────────────────────────────────────────────────────┘ */}
      <MessageListView messages={messages} />

      {/* ┌─────────────────────────────────────────────────────────────────────┐
          │ 입력 영역                                                           │
          └─────────────────────────────────────────────────────────────────────┘ */}
      <MessageInputView isLoading={isLoading} onSend={onSendMessage} />
    </div>
  );
}
```

### 7.3 MessageListView (`src/features/chat/MessageListView.tsx`)

```typescript
import { Message } from '@/shared/stores/chatStore';
import { useRef, useEffect } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';

interface MessageListViewProps {
  messages: Message[];
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 마크다운 렌더링 컴포넌트 커스터마이징                                     │
// └─────────────────────────────────────────────────────────────────────────┘
const markdownComponents: Components = {
  p: ({ children }) => <p className="text-sm mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 text-sm">{children}</ol>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-2 text-sm">{children}</ul>,
  li: ({ children }) => <li className="text-sm">{children}</li>
};

/**
 * 메시지 목록 렌더링 컴포넌트
 * - 빈 상태 표시
 * - 메시지 버블 렌더링 (사용자/AI)
 * - AI 응답의 마크다운 렌더링
 * - 참조 출처 표시
 * - 자동 스크롤
 */
export function MessageListView({ messages }: MessageListViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 새 메시지 시 자동 스크롤                                                │
  // └─────────────────────────────────────────────────────────────────────────┘
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {/* ┌─────────────────────────────────────────────────────────────────────┐
          │ 빈 상태 표시                                                        │
          └─────────────────────────────────────────────────────────────────────┘ */}
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-500">메시지를 입력하여 대화를 시작하세요</p>
        </div>
      ) : (
        // ┌─────────────────────────────────────────────────────────────────────┐
        // │ 메시지 렌더링                                                       │
        // └─────────────────────────────────────────────────────────────────────┘
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'                    // 사용자 메시지
                  : message.isError
                  ? 'bg-red-100 border border-red-300 text-red-800'  // 에러 메시지
                  : 'bg-gray-200 text-gray-900'                      // AI 응답
              }`}
            >
              {/* 에러 아이콘 */}
              {message.isError && (
                <div className="flex items-center gap-1 mb-1">
                  <svg className="h-4 w-4 text-red-600">...</svg>
                  <span className="text-xs font-semibold text-red-700">시스템 오류</span>
                </div>
              )}

              {/* 메시지 내용 (AI는 마크다운 렌더링) */}
              {message.role === 'assistant' && !message.isError ? (
                <ReactMarkdown skipHtml={true} components={markdownComponents}>
                  {message.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm">
                  {message.content}
                </p>
              )}

              {/* 타임스탬프 */}
              <p className={`mt-1 text-xs ${...}`}>
                {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>

              {/* ┌─────────────────────────────────────────────────────────────────────┐
                  │ 참조 출처 표시 (AI 응답에만)                                         │
                  └─────────────────────────────────────────────────────────────────────┘ */}
              {message.role === 'assistant' && !message.isError && message.sources?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="text-xs font-semibold text-gray-700 mb-2">참고 출처</p>
                  <div className="space-y-2">
                    {message.sources.map((source, idx) => (
                      <div key={idx} className="ml-2 text-xs text-gray-600">
                        <p className="font-medium">
                          페이지 {source.pageNumber} - {source.fileName}
                          {source.score !== undefined && (
                            <span className="ml-1 text-gray-500">
                              (관련도: {(source.score * 100).toFixed(0)}%)
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-gray-500 italic">
                          "{source.snippet.slice(0, 150)}..."
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
      {/* 자동 스크롤 앵커 */}
      <div ref={messagesEndRef} />
    </div>
  );
}
```

### 7.4 MessageInputView (`src/features/chat/MessageInputView.tsx`)

```typescript
import { useState, KeyboardEvent } from 'react';

interface MessageInputViewProps {
  isLoading: boolean;
  onSend: (message: string) => void;
}

/**
 * 메시지 입력 UI 컴포넌트
 * - Enter로 전송, Shift+Enter로 줄바꿈
 * - 로딩 중 비활성화
 */
export function MessageInputView({ isLoading, onSend }: MessageInputViewProps) {
  const [input, setInput] = useState('');

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 메시지 전송 핸들러                                                      │
  // └─────────────────────────────────────────────────────────────────────────┘
  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !isLoading) {
      onSend(trimmedInput);
      setInput('');  // 입력 필드 초기화
    }
  };

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 키보드 이벤트 핸들러 (Enter로 전송)                                     │
  // └─────────────────────────────────────────────────────────────────────────┘
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();  // 기본 줄바꿈 방지
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex gap-2">
        {/* 텍스트 입력 영역 */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
          disabled={isLoading}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 ..."
        />
        {/* 전송 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="rounded-lg bg-blue-600 px-6 py-2 ..."
        >
          {isLoading ? (
            <svg className="h-5 w-5 animate-spin">...</svg>  // 로딩 스피너
          ) : (
            '전송'
          )}
        </button>
      </div>
    </div>
  );
}
```

---

## 8. 상태 관리 (Zustand)

### 8.1 Chat Store (`src/shared/stores/chatStore.ts`)

```typescript
import { create } from 'zustand';
import { ChatSource, Message } from '@/shared/types';

// 타입 re-export (다른 곳에서 import 편의)
export type { ChatSource, Message };

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 채팅 상태 인터페이스                                                     │
// └─────────────────────────────────────────────────────────────────────────┘
interface ChatState {
  messages: Message[];         // 채팅 메시지 배열
  isLoading: boolean;           // API 호출 중 여부
  error: string | null;         // 에러 메시지

  addMessage: (message: Message) => void;      // 메시지 추가
  setIsLoading: (loading: boolean) => void;    // 로딩 상태 설정
  setError: (error: string | null) => void;    // 에러 설정
  clearMessages: () => void;                    // 모든 메시지 초기화
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ Zustand 스토어 생성                                                      │
// └─────────────────────────────────────────────────────────────────────────┘
export const useChatStore = create<ChatState>((set) => ({
  // 초기 상태
  messages: [],
  isLoading: false,
  error: null,

  // 메시지 추가 (불변성 유지)
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  // 로딩 상태 설정
  setIsLoading: (loading) => set({ isLoading: loading }),

  // 에러 설정
  setError: (error) => set({ error }),

  // 메시지 및 에러 초기화 (PDF 변경 시 호출)
  clearMessages: () => set({ messages: [], error: null })
}));
```

### 8.2 PDF Store (`src/shared/stores/pdfStore.ts`)

```typescript
import { create } from 'zustand';
import type { CollectionInfo, GetCollectionsResponse, DeletePdfResponse } from '@/shared/types';
import { useChatStore } from './chatStore';

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ PDF 상태 인터페이스                                                      │
// └─────────────────────────────────────────────────────────────────────────┘
interface PdfState {
  pdfId: string | null;              // 현재 선택된 PDF ID
  pdfFileName: string | null;         // 현재 선택된 PDF 파일명
  isUploading: boolean;               // 파일 업로드 중
  isEmbedding: boolean;               // 임베딩 생성 중
  isLoadingCollections: boolean;      // 컬렉션 목록 로딩 중
  isDeletingPdf: boolean;             // PDF 삭제 중
  collections: CollectionInfo[];      // 저장된 PDF 목록
  error: string | null;               // 에러 메시지

  // 액션
  setPdfId: (id: string | null) => void;
  setPdfFileName: (name: string | null) => void;
  setIsUploading: (loading: boolean) => void;
  setIsEmbedding: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchCollections: () => Promise<void>;           // 컬렉션 목록 조회
  selectCollection: (collection: CollectionInfo) => void;  // PDF 선택
  deleteCollection: (pdfId: string) => Promise<void>;      // PDF 삭제
  clearSelection: () => void;                       // 선택 해제
  reset: () => void;                                // 전체 상태 초기화
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ Zustand 스토어 생성                                                      │
// └─────────────────────────────────────────────────────────────────────────┘
export const usePdfStore = create<PdfState>((set, get) => ({
  // 초기 상태
  pdfId: null,
  pdfFileName: null,
  isUploading: false,
  isEmbedding: false,
  isLoadingCollections: false,
  isDeletingPdf: false,
  collections: [],
  error: null,

  // 기본 setter
  setPdfId: (id) => set({ pdfId: id }),
  setPdfFileName: (name) => set({ pdfFileName: name }),
  setIsUploading: (loading) => set({ isUploading: loading }),
  setIsEmbedding: (loading) => set({ isEmbedding: loading }),
  setError: (error) => set({ error }),

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 컬렉션 목록 조회 (GET /api/collections)                                 │
  // └─────────────────────────────────────────────────────────────────────────┘
  fetchCollections: async () => {
    set({ isLoadingCollections: true, error: null });
    try {
      const response = await fetch('/api/collections');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch collections');
      }

      const data: GetCollectionsResponse = await response.json();
      set({ collections: data.collections });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, collections: [] });
    } finally {
      set({ isLoadingCollections: false });
    }
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ PDF 선택                                                                │
  // └─────────────────────────────────────────────────────────────────────────┘
  selectCollection: (collection: CollectionInfo) => {
    set({
      pdfId: collection.pdfId,
      pdfFileName: collection.fileName
    });
    // 채팅 메시지 초기화 (새 PDF 선택 시)
    useChatStore.getState().clearMessages();
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ PDF 삭제 (DELETE /api/pdf/[pdfId])                                      │
  // └─────────────────────────────────────────────────────────────────────────┘
  deleteCollection: async (pdfId: string) => {
    set({ isDeletingPdf: true, error: null });
    try {
      const response = await fetch(`/api/pdf/${pdfId}`, { method: 'DELETE' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete PDF');
      }

      const data: DeletePdfResponse = await response.json();

      // 완전 실패가 아니면 (부분 성공 허용) 목록에서 제거
      if (!data.deleted && !data.partialSuccess) {
        throw new Error(data.message || 'Failed to delete PDF');
      }

      set((state) => ({
        collections: state.collections.filter((c) => c.pdfId !== pdfId)
      }));

      // 현재 선택된 PDF가 삭제된 경우 선택 해제
      if (get().pdfId === pdfId) {
        set({ pdfId: null, pdfFileName: null });
        useChatStore.getState().clearMessages();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isDeletingPdf: false });
    }
  },

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ 선택 해제 (뒤로가기 시)                                                 │
  // └─────────────────────────────────────────────────────────────────────────┘
  clearSelection: () => {
    set({ pdfId: null, pdfFileName: null });
    useChatStore.getState().clearMessages();
  },

  // 전체 상태 초기화
  reset: () => set({
    pdfId: null,
    pdfFileName: null,
    isUploading: false,
    isEmbedding: false,
    error: null
  })
}));
```

---

## 9. 핵심 라이브러리

### 9.1 Chroma 클라이언트 (`src/shared/lib/chroma.ts`)

```typescript
import { ChromaClient } from 'chromadb';

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ Chroma 클라이언트 싱글톤                                                 │
// │ - 동시성/중복 초기화 방지                                                │
// │ - 전체 애플리케이션에서 하나의 인스턴스만 사용                            │
// └─────────────────────────────────────────────────────────────────────────┘
let chromaClientInstance: ChromaClient | null = null;

export function getChromaClient(): ChromaClient {
  if (!chromaClientInstance) {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    chromaClientInstance = new ChromaClient({
      path: chromaUrl  // Chroma 서버 주소
    });
  }
  return chromaClientInstance;
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ PDF별 컬렉션 이름 생성                                                   │
// │ 전략: pdf_{pdfId} (각 PDF마다 독립된 컬렉션)                             │
// │ - 격리성 높음: 검색 시 해당 PDF만 대상                                   │
// │ - 삭제 용이: 컬렉션 단위 삭제                                            │
// └─────────────────────────────────────────────────────────────────────────┘
export function getCollectionName(pdfId: string): string {
  return `pdf_${pdfId}`;
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 컬렉션 존재 여부 확인                                                    │
// └─────────────────────────────────────────────────────────────────────────┘
export async function collectionExists(
  client: ChromaClient,
  collectionName: string
): Promise<boolean> {
  try {
    await client.getCollection({ name: collectionName });
    return true;
  } catch {
    return false;  // 컬렉션 없으면 false
  }
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 컬렉션 생성 또는 가져오기                                                │
// └─────────────────────────────────────────────────────────────────────────┘
export async function getOrCreateCollection(
  client: ChromaClient,
  collectionName: string
) {
  try {
    // 기존 컬렉션이 있으면 반환
    const collection = await client.getCollection({ name: collectionName });
    return collection;
  } catch {
    // 없으면 새로 생성 (코사인 유사도 사용)
    return await client.createCollection({
      name: collectionName,
      metadata: { 'hnsw:space': 'cosine' }  // 코사인 유사도 설정
    });
  }
}
```

### 9.2 PDF 로더 (`src/shared/lib/pdf-loader.ts`)

```typescript
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
// pdf-parse의 테스트 파일 로드 버그를 피하기 위해 lib 직접 import
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ PDF 파일을 페이지별로 로드                                               │
// │ - pdf-parse의 pagerender 옵션으로 페이지별 텍스트 추출                   │
// └─────────────────────────────────────────────────────────────────────────┘
export async function loadPDFByPages(
  filePath: string,
  fileName: string
): Promise<{
  pages: Array<{ pageNumber: number; text: string }>;
  fileName: string;
  totalPages: number;
}> {
  try {
    // 1. PDF 파일 읽기
    const dataBuffer = fs.readFileSync(filePath);

    // 2. 페이지별 텍스트 저장용 Map
    const pageTexts = new Map<number, string>();

    // 3. pdf-parse로 페이지별 텍스트 추출
    const pdfData = await pdfParse(dataBuffer, {
      // pagerender: 각 페이지 처리 콜백
      pagerender: async (pageData: any) => {
        const textContent = await pageData.getTextContent();
        // 텍스트 아이템들을 공백으로 연결
        const pageText = textContent.items.map((item: any) => item.str).join(' ');

        // pageIndex는 0부터 시작하므로 +1
        const pageNumber = pageData.pageIndex + 1;
        pageTexts.set(pageNumber, pageText);

        return pageText;
      }
    });

    const totalPages = pdfData.numpages;

    // 4. Map을 배열로 변환 (빈 페이지 제외)
    const pages: Array<{ pageNumber: number; text: string }> = [];
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageText = pageTexts.get(pageNum);
      if (pageText && pageText.trim()) {
        pages.push({
          pageNumber: pageNum,
          text: pageText.trim()
        });
      }
    }

    if (pages.length === 0) {
      throw new Error("PDF에서 텍스트를 추출할 수 없습니다.");
    }

    return { pages, fileName, totalPages };
  } catch (error) {
    throw new Error(
      `PDF 파일 로드 중 오류: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 임시 업로드 디렉토리 생성                                                │
// └─────────────────────────────────────────────────────────────────────────┘
export function ensureUploadDir(): string {
  const uploadDir = process.env.UPLOAD_DIR || "/tmp/pdf-uploads";

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return uploadDir;
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ PDF 파일 저장                                                            │
// │ - UUID 생성 → /tmp/pdf-uploads/{uuid}.pdf 저장                          │
// └─────────────────────────────────────────────────────────────────────────┘
export function savePDFFile(
  buffer: Buffer,
  originalFileName: string
): { pdfId: string; filePath: string; fileName: string } {
  const pdfId = uuidv4();                        // UUID 생성
  const uploadDir = ensureUploadDir();
  const ext = path.extname(originalFileName);    // 확장자 추출
  const fileName = `${pdfId}${ext}`;             // {uuid}.pdf
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, buffer);            // 파일 저장

  return {
    pdfId,
    filePath,
    fileName: originalFileName                    // 원본 파일명 유지
  };
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ PDF 파일 존재 여부 확인                                                  │
// └─────────────────────────────────────────────────────────────────────────┘
export function pdfFileExists(pdfId: string): {
  exists: boolean;
  filePath?: string;
} {
  const uploadDir = process.env.UPLOAD_DIR || "/tmp/pdf-uploads";

  if (!fs.existsSync(uploadDir)) {
    return { exists: false };
  }

  // pdfId로 시작하는 파일 찾기
  const files = fs.readdirSync(uploadDir);
  const pdfFile = files.find((file) => file.startsWith(pdfId));

  if (pdfFile) {
    return {
      exists: true,
      filePath: path.join(uploadDir, pdfFile)
    };
  }

  return { exists: false };
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ PDF 파일 삭제                                                            │
// └─────────────────────────────────────────────────────────────────────────┘
export function deletePDFFile(pdfId: string): boolean {
  try {
    const { exists, filePath } = pdfFileExists(pdfId);

    if (!exists || !filePath) {
      return false;
    }

    fs.unlinkSync(filePath);  // 파일 삭제
    return true;
  } catch (error) {
    throw new Error(
      `PDF 파일 삭제 중 오류: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
```

### 9.3 임베딩 생성 (`src/shared/lib/langchain/embeddings.ts`)

```typescript
import { embed, embedMany } from "ai";  // Vercel AI SDK

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 임베딩 모델 설정                                                         │
// │ - Vercel AI Gateway 사용                                                │
// │ - 기본: google/text-embedding-005                                       │
// └─────────────────────────────────────────────────────────────────────────┘
export function getEmbeddingModel(): string {
  return process.env.EMBEDDING_MODEL || "google/text-embedding-005";
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 단일 텍스트 임베딩 (질의용)                                              │
// │ @returns 768차원 임베딩 벡터                                             │
// └─────────────────────────────────────────────────────────────────────────┘
export async function embedText(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: getEmbeddingModel(),  // 문자열로 모델 지정 (AI Gateway)
      value: text
    });
    return embedding;
  } catch (error) {
    throw new Error(
      `임베딩 생성 실패: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 다중 텍스트 임베딩 (문서용)                                              │
// │ @returns 768차원 임베딩 벡터 배열                                        │
// └─────────────────────────────────────────────────────────────────────────┘
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  try {
    const { embeddings } = await embedMany({
      model: getEmbeddingModel(),
      values: texts  // 배치 처리
    });
    return embeddings;
  } catch (error) {
    throw new Error(
      `다중 임베딩 생성 실패: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
```

### 9.4 LLM 호출 (`src/shared/lib/langchain/llm.ts`)

```typescript
import { streamText } from "ai";  // Vercel AI SDK 스트리밍

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ LLM 설정 인터페이스                                                      │
// └─────────────────────────────────────────────────────────────────────────┘
export interface LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ RAG 시스템 프롬프트 생성                                                 │
// │ - 컨텍스트 기반 답변 규칙 정의                                           │
// └─────────────────────────────────────────────────────────────────────────┘
export function createRAGSystemPrompt(): string {
  return `당신은 PDF 문서 기반의 질문응답 AI 어시스턴트입니다.

규칙:
1. 제공된 컨텍스트(PDF 문서 내용)를 기반으로만 답변하세요.
2. 컨텍스트에 없는 내용은 추측하지 마세요.
3. 확실하지 않으면 "제공된 문서에서 해당 정보를 찾을 수 없습니다"라고 답변하세요.
4. 명확하고 간결하게 답변하세요.
5. 가능한 한 여러 관련 정보를 종합하여 답변하세요.
6. 답변 시 출처 페이지를 (페이지 X) 형식으로 명시하세요.`;
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ RAG 프롬프트 생성                                                        │
// │ - 검색된 컨텍스트와 질문을 조합                                          │
// └─────────────────────────────────────────────────────────────────────────┘
export function createRAGPrompt(
  question: string,
  contexts: Array<{ pageNumber: number; content: string }>
): string {
  // 컨텍스트를 "[페이지 N]\n내용" 형식으로 포맷팅
  const contextText = contexts
    .map((ctx) => `[페이지 ${ctx.pageNumber}]\n${ctx.content}`)
    .join("\n\n---\n\n");

  return `다음은 PDF 문서에서 검색된 관련 내용입니다:

${contextText}

질문: ${question}

답변:`;
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ LLM 스트리밍 응답 생성                                                   │
// │ - Vercel AI Gateway 사용                                                │
// │ - 기본: google/gemini-2.5-flash                                         │
// └─────────────────────────────────────────────────────────────────────────┘
export async function generateAnswer(
  prompt: string,
  systemPrompt: string,
  config: LLMConfig = {}
) {
  const model = config.model || process.env.LLM_MODEL || "google/gemini-2.5-flash";

  return streamText({
    model,                           // 문자열로 모델 지정
    system: systemPrompt,            // 시스템 프롬프트
    prompt,                          // 사용자 프롬프트
    temperature: config.temperature ?? 0.3  // 낮은 온도로 일관성 유지
  });
}
```

### 9.5 문서 검색 (`src/shared/lib/langchain/retriever.ts`)

```typescript
import { getChromaClient, getCollectionName } from '../chroma';
import { embedText } from './embeddings';
import { PDFDocumentMetadata } from '@/shared/types';

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 검색 결과 타입                                                           │
// └─────────────────────────────────────────────────────────────────────────┘
export interface RetrievalResult {
  pageNumber: number;
  fileName: string;
  content: string;           // 전체 페이지 텍스트
  snippet: string;           // 미리보기 (80자)
  score: number;             // 유사도 점수 (0~1)
  metadata: PDFDocumentMetadata;
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ Chroma에서 유사도 검색 수행                                              │
// │ @param pdfId - 대상 PDF ID                                              │
// │ @param query - 검색 질의                                                │
// │ @param topK - 반환할 결과 수 (기본 6)                                   │
// └─────────────────────────────────────────────────────────────────────────┘
export async function retrieveRelevantDocuments(
  pdfId: string,
  query: string,
  topK: number = 6
): Promise<RetrievalResult[]> {
  try {
    const client = getChromaClient();
    const collectionName = getCollectionName(pdfId);

    // 1. 컬렉션 가져오기
    const collection = await client.getCollection({ name: collectionName });

    // 2. 질의 임베딩 생성
    const queryEmbedding = await embedText(query);

    // 3. 유사도 검색 (TopK)
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK
    });

    // 4. 결과 변환
    const documents: RetrievalResult[] = [];

    if (
      results.documents?.[0] &&
      results.metadatas?.[0] &&
      results.distances?.[0]
    ) {
      for (let i = 0; i < results.documents[0].length; i++) {
        const doc = results.documents[0][i];
        const metadata = results.metadatas[0][i] as unknown as PDFDocumentMetadata;
        const distance = results.distances[0][i];

        if (doc && metadata && distance !== null && distance !== undefined) {
          documents.push({
            pageNumber: metadata.pageNumber,
            fileName: metadata.fileName,
            content: doc,
            snippet: metadata.snippet || '',
            score: 1 - distance,  // distance → similarity (코사인)
            metadata
          });
        }
      }
    }

    return documents;
  } catch (error) {
    throw new Error(
      `문서 검색 중 오류: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ Retrieval 결과를 LLM 컨텍스트 형식으로 변환                               │
// └─────────────────────────────────────────────────────────────────────────┘
export function formatContextsForLLM(
  results: RetrievalResult[]
): Array<{ pageNumber: number; content: string }> {
  return results.map((result) => ({
    pageNumber: result.pageNumber,
    content: result.content
  }));
}
```

### 9.6 RAG 파이프라인 (`src/shared/lib/langchain/rag.ts`)

```typescript
import { ChatSource } from '@/shared/types';
import { retrieveRelevantDocuments, formatContextsForLLM } from './retriever';
import { generateAnswer, createRAGPrompt, createRAGSystemPrompt } from './llm';

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ RAG 파이프라인 실행                                                      │
// │ 1. 질의 임베딩 (retriever 내부)                                         │
// │ 2. Retriever로 유사도 검색                                              │
// │ 3. 프롬프트 구성                                                        │
// │ 4. LLM 호출 및 응답 생성                                                │
// └─────────────────────────────────────────────────────────────────────────┘
export async function executeRAGPipeline(
  pdfId: string,
  question: string,
  topK: number = 6
): Promise<{
  answer: string;
  sources: ChatSource[];
}> {
  try {
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 1단계: Retrieval - 관련 문서 검색                                    │
    // └─────────────────────────────────────────────────────────────────────┘
    const retrievalResults = await retrieveRelevantDocuments(pdfId, question, topK);

    // 검색 결과가 없으면 기본 응답 반환
    if (retrievalResults.length === 0) {
      return {
        answer: '죄송합니다. 질문과 관련된 내용을 문서에서 찾을 수 없습니다.',
        sources: []
      };
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 2단계: 컨텍스트 포맷팅                                               │
    // └─────────────────────────────────────────────────────────────────────┘
    const contexts = formatContextsForLLM(retrievalResults);

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 3단계: 프롬프트 생성                                                 │
    // └─────────────────────────────────────────────────────────────────────┘
    const systemPrompt = createRAGSystemPrompt();
    const prompt = createRAGPrompt(question, contexts);

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 4단계: LLM 응답 생성 (스트리밍)                                      │
    // └─────────────────────────────────────────────────────────────────────┘
    const result = await generateAnswer(prompt, systemPrompt);

    // 스트리밍 응답 수집
    let fullAnswer = '';
    for await (const textPart of result.textStream) {
      fullAnswer += textPart;
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ 5단계: Sources 생성                                                  │
    // └─────────────────────────────────────────────────────────────────────┘
    const sources: ChatSource[] = retrievalResults.map((result) => ({
      pageNumber: result.pageNumber,
      fileName: result.fileName,
      snippet: result.snippet,
      score: result.score
    }));

    return {
      answer: fullAnswer,
      sources
    };
  } catch (error) {
    throw new Error(
      `RAG 파이프라인 실행 중 오류: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
```

---

## 부록: 환경 변수

| 변수명 | 기본값 | 설명 |
|--------|--------|------|
| `AI_GATEWAY_API_KEY` | - | Vercel AI Gateway API 키 (필수) |
| `CHROMA_URL` | `http://localhost:8000` | Chroma 서버 URL |
| `EMBEDDING_MODEL` | `google/text-embedding-005` | 임베딩 모델 |
| `LLM_MODEL` | `google/gemini-2.5-flash` | LLM 모델 |
| `UPLOAD_DIR` | `/tmp/pdf-uploads` | PDF 업로드 디렉토리 |
| `TOP_K` | `6` | 유사도 검색 결과 개수 |

---

*문서 생성일: 2026-01-30*
