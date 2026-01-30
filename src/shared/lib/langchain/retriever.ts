import { getChromaClient, getCollectionName } from '../chroma';
import { embedText } from './embeddings';
import { PDFDocumentMetadata } from '@/shared/types';

export interface RetrievalResult {
  pageNumber: number;
  fileName: string;
  content: string;
  snippet: string;
  score: number;
  metadata: PDFDocumentMetadata;
}

/**
 * Chroma에서 유사도 검색 수행
 */
export async function retrieveRelevantDocuments(
  pdfId: string,
  query: string,
  topK: number = 6
): Promise<RetrievalResult[]> {
  try {
    const client = getChromaClient();
    const collectionName = getCollectionName(pdfId);

    // 컬렉션 가져오기
    const collection = await client.getCollection({ name: collectionName });

    // 질의 임베딩
    const queryEmbedding = await embedText(query);

    // 유사도 검색
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
    });

    // 결과 변환
    const documents: RetrievalResult[] = [];

    if (
      results.documents &&
      results.documents[0] &&
      results.metadatas &&
      results.metadatas[0] &&
      results.distances &&
      results.distances[0]
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
            score: 1 - distance, // distance를 similarity score로 변환 (cosine similarity)
            metadata,
          });
        }
      }
    }

    return documents;
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
