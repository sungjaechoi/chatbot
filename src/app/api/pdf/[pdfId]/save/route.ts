import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getChromaClient, getCollectionName, getOrCreateCollection } from '@/shared/lib/chroma';
import { loadPDFByPages, pdfFileExists } from '@/shared/lib/pdf-loader';
import { embedDocuments } from '@/shared/lib/langchain/embeddings';
import { SavePdfResponse, ErrorResponse, PDFDocumentMetadata } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * POST /api/pdf/[pdfId]/save
 * 저장된 PDF를 페이지별로 로드
 * google/text-embedding-005로 임베딩 후 Chroma에 upsert
 *
 * Request Body:
 * {
 *   "fileName": "원본파일명.pdf"  // 선택 사항, 없으면 pdfId 기반 파일명 사용
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pdfId: string }> }
) {
  try {
    const { pdfId } = await params;

    // Request body에서 원본 파일명 가져오기 (선택 사항)
    let originalFileName: string | undefined;
    try {
      const body = await request.json();
      originalFileName = body.fileName;
    } catch {
      // body가 없거나 파싱 실패 시 무시
    }

    // 1. PDF 파일 존재 확인
    const { exists, filePath } = pdfFileExists(pdfId);
    if (!exists || !filePath) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'PDF 파일을 찾을 수 없습니다.',
          code: 'PDF_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 2. PDF 로드 (페이지별)
    // 원본 파일명이 제공되면 사용, 없으면 pdfId 기반 파일명 사용
    const fileName = originalFileName || path.basename(filePath);
    const { pages, totalPages } = await loadPDFByPages(filePath, fileName);

    if (pages.length === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'PDF에서 텍스트를 추출할 수 없습니다.',
          code: 'NO_TEXT_EXTRACTED',
        },
        { status: 400 }
      );
    }

    // 3. 임베딩 생성
    const texts = pages.map((page) => page.text);
    const embeddings = await embedDocuments(texts);

    // 4. Chroma에 저장
    const client = getChromaClient();
    const collectionName = getCollectionName(pdfId);
    const collection = await getOrCreateCollection(client, collectionName);

    // 5. 문서 ID 및 메타데이터 준비
    const ids = pages.map((page) => `${collectionName}_page_${page.pageNumber}`);
    const metadatas: PDFDocumentMetadata[] = pages.map((page) => {
      const snippet = page.text.length > 80
        ? page.text.substring(0, 80) + '...'
        : page.text;

      return {
        fileName,
        pageNumber: page.pageNumber,
        snippet,
        createdAt: new Date().toISOString(),
      };
    });

    // 6. Chroma에 upsert
    await collection.upsert({
      ids,
      embeddings,
      documents: texts,
      metadatas,
    });

    const response: SavePdfResponse = {
      pdfId,
      status: 'embedded',
      totalPages,
      collectionName,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: 'PDF 저장 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'SAVE_ERROR',
      },
      { status: 500 }
    );
  }
}
