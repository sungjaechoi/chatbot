import { embedText } from './embeddings';
import { createAdminClient } from '../supabase/admin';

export interface RetrievalResult {
  pageNumber: number;
  fileName: string;
  content: string;
  snippet: string;
  score: number;
  metadata: {
    fileName: string;
    pageNumber: number;
    snippet: string;
  };
}

/**
 * Supabase pgvector에서 유사도 검색 수행
 */
export async function retrieveRelevantDocuments(
  pdfId: string,
  query: string,
  topK: number = 6
): Promise<RetrievalResult[]> {
  try {
    // 질의 임베딩
    const queryEmbedding = await embedText(query);

    const supabase = createAdminClient();

    // match_documents RPC 호출
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_pdf_id: pdfId,
      match_count: topK,
    });

    if (error) {
      throw new Error(`벡터 검색 실패: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 결과 변환
    return data.map((doc: {
      id: string;
      pdf_id: string;
      file_name: string;
      page_number: number;
      content: string;
      snippet: string;
      similarity: number;
    }) => ({
      pageNumber: doc.page_number,
      fileName: doc.file_name,
      content: doc.content,
      snippet: doc.snippet || '',
      score: doc.similarity,
      metadata: {
        fileName: doc.file_name,
        pageNumber: doc.page_number,
        snippet: doc.snippet || '',
      },
    }));
  } catch (error) {
    throw new Error(
      `문서 검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Retrieval 결과를 LLM 컨텍스트로 변환
 */
export function formatContextsForLLM(
  results: RetrievalResult[]
): Array<{ pageNumber: number; content: string }> {
  return results.map((result) => ({
    pageNumber: result.pageNumber,
    content: result.content,
  }));
}
