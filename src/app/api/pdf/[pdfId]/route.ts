import { NextRequest, NextResponse } from 'next/server';
import { getChromaClient, getCollectionName } from '@/shared/lib/chroma';
import { deletePDFFile, pdfFileExists } from '@/shared/lib/pdf-loader';
import { DeletePdfResponse, ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * DELETE /api/pdf/[pdfId]
 * PDF 파일 및 Chroma 컬렉션 삭제
 *
 * 삭제 순서:
 * 1. Chroma 컬렉션 삭제 (pdf_{pdfId})
 * 2. 로컬 PDF 파일 삭제 (/tmp/pdf-uploads/{pdfId}.pdf)
 *
 * 에러 처리:
 * - PDF/컬렉션이 존재하지 않으면 404 반환
 * - Chroma 삭제 실패 시 500 반환
 * - 파일 삭제 실패 시 부분 성공으로 처리 (컬렉션만 삭제된 경우)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pdfId: string }> }
) {
  try {
    const { pdfId } = await params;

    // 1. PDF 파일 존재 확인
    const { exists } = pdfFileExists(pdfId);
    const collectionName = getCollectionName(pdfId);

    // 2. Chroma 컬렉션 존재 확인
    const client = getChromaClient();
    let collectionExists = false;

    try {
      await client.getCollection({ name: collectionName });
      collectionExists = true;
    } catch {
      /* Collection not found, which is expected */
      collectionExists = false;
    }

    // 3. 파일도 컬렉션도 없으면 404 반환
    if (!exists && !collectionExists) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'PDF 파일 또는 컬렉션을 찾을 수 없습니다.',
          code: 'PDF_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Chroma 컬렉션 삭제
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
            code: 'CHROMA_DELETE_ERROR',
          },
          { status: 500 }
        );
      }
    }

    // 5. 로컬 PDF 파일 삭제
    let fileDeleted = false;
    if (exists) {
      try {
        fileDeleted = deletePDFFile(pdfId);
      } catch (error) {
        // 파일 삭제 실패 시 부분 성공으로 처리 (컬렉션은 이미 삭제됨)
        return NextResponse.json<DeletePdfResponse>(
          {
            pdfId,
            deleted: false,
            partialSuccess: true,
            collectionDeleted: true,
            fileDeleted: false,
            message: `컬렉션은 삭제되었으나 파일 삭제 실패: ${error instanceof Error ? error.message : String(error)}`,
          },
          { status: 207 }
        );
      }
    }

    // 6. 성공 응답
    const response: DeletePdfResponse = {
      pdfId,
      deleted: true,
      message: `PDF 삭제 완료 (컬렉션: ${collectionDeleted ? '삭제됨' : '없음'}, 파일: ${fileDeleted ? '삭제됨' : '없음'})`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: 'PDF 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'DELETE_ERROR',
      },
      { status: 500 }
    );
  }
}
