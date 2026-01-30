import { ChromaClient } from 'chromadb';

/**
 * Chroma 클라이언트 싱글톤
 * 동시성/중복 초기화를 방지하기 위해 싱글톤 패턴 사용
 */
let chromaClientInstance: ChromaClient | null = null;

export function getChromaClient(): ChromaClient {
  if (!chromaClientInstance) {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    chromaClientInstance = new ChromaClient({
      path: chromaUrl,
    });
  }
  return chromaClientInstance;
}

/**
 * PDF별 컬렉션 이름 생성
 * 전략: pdf_${pdfId} 방식 사용
 *
 * 근거:
 * - 각 PDF마다 독립된 컬렉션을 가지므로 격리성이 높음
 * - 특정 PDF의 벡터만 검색하므로 검색 성능이 우수
 * - PDF 삭제 시 컬렉션만 삭제하면 되므로 관리가 간단
 * - 단, PDF가 많아지면 컬렉션 수가 증가하는 단점이 있으나,
 *   RAG 챗봇 특성상 PDF 개수가 제한적일 것으로 예상
 */
export function getCollectionName(pdfId: string): string {
  return `pdf_${pdfId}`;
}

/**
 * 컬렉션이 존재하는지 확인
 */
export async function collectionExists(
  client: ChromaClient,
  collectionName: string
): Promise<boolean> {
  try {
    await client.getCollection({ name: collectionName });
    return true;
  } catch {
    return false;
  }
}

/**
 * 컬렉션 생성 또는 가져오기
 */
export async function getOrCreateCollection(
  client: ChromaClient,
  collectionName: string
) {
  try {
    const collection = await client.getCollection({ name: collectionName });
    return collection;
  } catch {
    // 컬렉션이 없으면 생성
    return await client.createCollection({
      name: collectionName,
      metadata: { 'hnsw:space': 'cosine' }, // 코사인 유사도 사용
    });
  }
}
