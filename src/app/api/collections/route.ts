import { NextResponse } from 'next/server';
import { getChromaClient } from '@/shared/lib/chroma';
import {
  GetCollectionsResponse,
  CollectionInfo,
  ErrorResponse,
  CollectionsMeta,
} from '@/shared/types';

export const runtime = 'nodejs';

/**
 * GET /api/collections
 * Chroma에 저장된 모든 PDF 컬렉션 목록 조회
 *
 * 응답 형식:
 * {
 *   collections: [
 *     {
 *       pdfId: string,
 *       fileName: string,
 *       documentCount: number,
 *       createdAt?: string
 *     }
 *   ],
 *   meta: {
 *     total: number,      // 전체 컬렉션 수
 *     success: number,    // 성공적으로 조회된 컬렉션 수
 *     failed: number      // 조회 실패한 컬렉션 수
 *   }
 * }
 */
export async function GET() {
  try {
    const client = getChromaClient();

    // Chroma에서 모든 컬렉션 조회
    const allCollections = await client.listCollections();

    // pdf_ 접두사를 가진 컬렉션만 필터링
    const pdfCollections = allCollections.filter((collection) =>
      collection.name.startsWith('pdf_')
    );

    // 컬렉션 정보 추출
    const collectionsInfo: CollectionInfo[] = [];
    let failedCount = 0;

    for (const collection of pdfCollections) {
      try {
        // 컬렉션에서 pdfId 추출 (pdf_ 접두사 제거)
        const pdfId = collection.name.replace('pdf_', '');

        // 컬렉션 객체 가져오기
        const chromaCollection = await client.getCollection({
          name: collection.name,
        });

        // 컬렉션 내 문서 개수 조회
        const count = await chromaCollection.count();

        // 메타데이터에서 파일명 추출을 위해 첫 번째 문서 조회
        let fileName = 'Unknown';
        let createdAt: string | undefined;

        if (count > 0) {
          // 첫 번째 문서 1개만 조회
          const result = await chromaCollection.get({
            limit: 1,
          });

          // 메타데이터에서 fileName 추출
          if (
            result.metadatas &&
            result.metadatas.length > 0 &&
            result.metadatas[0]
          ) {
            const metadata = result.metadatas[0];
            fileName =
              typeof metadata.fileName === 'string'
                ? metadata.fileName
                : 'Unknown';
            createdAt =
              typeof metadata.createdAt === 'string'
                ? metadata.createdAt
                : undefined;
          }
        }

        collectionsInfo.push({
          pdfId,
          fileName,
          documentCount: count,
          createdAt,
        });
      } catch {
        // 특정 컬렉션 조회 실패 시 카운트 증가 및 계속 진행
        failedCount++;
      }
    }

    // 메타 정보 생성
    const meta: CollectionsMeta = {
      total: pdfCollections.length,
      success: collectionsInfo.length,
      failed: failedCount,
    };

    const response: GetCollectionsResponse = {
      collections: collectionsInfo,
      meta,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '컬렉션 목록 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'COLLECTIONS_FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}
