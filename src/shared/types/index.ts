/**
 * PDF 업로드 관련 타입 정의
 */
export interface UploadPdfResponse {
  pdfId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

/**
 * PDF 저장/임베딩 관련 타입 정의
 */
export interface SavePdfResponse {
  pdfId: string;
  status: 'embedded';
  totalPages: number;
  collectionName: string;
}

/**
 * 챗봇 메시지 관련 타입 정의
 */
export interface ChatRequest {
  pdfId: string;
  message: string;
}

export interface ChatSource {
  pageNumber: number;
  fileName: string;
  snippet: string;
  score?: number;
}

export interface UsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  total_cost: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  usage?: UsageInfo;
}

/**
 * 프론트엔드 채팅 메시지 타입
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: ChatSource[];
  isError?: boolean;
  usage?: UsageInfo;
}

/**
 * PDF Document Metadata
 */
export interface PDFDocumentMetadata {
  fileName: string;
  pageNumber: number;
  snippet: string;
  createdAt: string;
}

/**
 * 컬렉션 정보
 */
export interface CollectionInfo {
  pdfId: string;
  fileName: string;
  documentCount: number;
  createdAt?: string;
}

/**
 * 컬렉션 목록 조회 응답 메타 정보
 */
export interface CollectionsMeta {
  total: number;
  success: number;
  failed: number;
}

/**
 * 컬렉션 목록 조회 응답
 */
export interface GetCollectionsResponse {
  collections: CollectionInfo[];
  meta: CollectionsMeta;
}

/**
 * PDF 삭제 응답 타입 정의
 */
export interface DeletePdfResponse {
  pdfId: string;
  deleted: boolean;
  message: string;
  partialSuccess?: boolean;
  collectionDeleted?: boolean;
  fileDeleted?: boolean;
}

/**
 * Credits 조회 응답
 */
export interface CreditsResponse {
  balance: number;
  total_used: number;
}

/**
 * Chat History Message (for RAG pipeline)
 */
export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Error Response
 */
export interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}
