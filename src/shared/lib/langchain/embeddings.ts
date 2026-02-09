import { embed, embedMany } from "ai";

/**
 * Google Embeddings 모델 생성 (Vercel AI Gateway 사용)
 * 모델: google/text-embedding-005
 * - test.ts와 동일한 방식: 문자열로 모델 지정
 * - AI_GATEWAY_API_KEY 환경변수 사용
 */
export function getEmbeddingModel(): string {
  return process.env.EMBEDDING_MODEL || "google/text-embedding-005";
}

/**
 * 텍스트를 임베딩 벡터로 변환 (Vercel AI Gateway 사용)
 * @param text - 임베딩할 텍스트
 * @returns 임베딩 벡터 (모델에 따라 768 또는 3072차원)
 */
export async function embedText(text: string): Promise<number[]> {
  try {
    // test.ts와 동일한 방식: 문자열로 모델 지정
    const { embedding } = await embed({
      model: getEmbeddingModel(),
      value: text,
    });
    return embedding;
  } catch (error) {
    throw new Error(
      `임베딩 생성 실패: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 여러 텍스트를 임베딩 벡터로 변환 (Vercel AI Gateway 사용)
 * @param texts - 임베딩할 텍스트 배열
 * @returns 임베딩 벡터 배열 (모델에 따라 768 또는 3072차원)
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  try {
    // test.ts와 동일한 방식: 문자열로 모델 지정
    const { embeddings } = await embedMany({
      model: getEmbeddingModel(),
      values: texts,
    });
    return embeddings;
  } catch (error) {
    throw new Error(
      `다중 임베딩 생성 실패: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// 하위 호환성을 위한 함수 (deprecated)
export function createEmbeddings() {
  return getEmbeddingModel();
}
