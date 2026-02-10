import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { loadPDFByPages } from '@/shared/lib/pdf-loader';
import { embedDocuments, getEmbeddingModel } from '@/shared/lib/langchain/embeddings';
import { logCreditUsage, fetchGatewayTotalUsed } from '@/shared/lib/supabase/credit-service';
import { SavePdfResponse, ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * POST /api/pdf/[pdfId]/save
 * Storage에서 PDF를 다운로드하여 페이지별 임베딩 후 pdf_documents 테이블에 저장
 *
 * Request Body:
 * {
 *   "fileName": "원본파일명.pdf",
 *   "storagePath": "userId/pdfId.pdf"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pdfId: string }> }
) {
  try {
    const { pdfId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    let fileName: string;
    let storagePath: string;
    try {
      const body = await request.json();
      fileName = body.fileName;
      storagePath = body.storagePath;
    } catch {
      return NextResponse.json<ErrorResponse>(
        { error: 'fileName과 storagePath는 필수 입력값입니다.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (!fileName || !storagePath) {
      return NextResponse.json<ErrorResponse>(
        { error: 'fileName과 storagePath는 필수 입력값입니다.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // 1. Storage에서 PDF 다운로드 및 페이지별 파싱
    const { pages, totalPages } = await loadPDFByPages(storagePath, fileName);

    if (pages.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'PDF에서 텍스트를 추출할 수 없습니다.', code: 'NO_TEXT_EXTRACTED' },
        { status: 400 }
      );
    }

    // 2. 임베딩 생성
    const texts = pages.map((page) => page.text);
    const beforeTotalUsed = await fetchGatewayTotalUsed();
    const { embeddings, usage } = await embedDocuments(texts);

    // 3. pdf_documents 테이블에 저장 (admin 클라이언트 사용 — RLS 우회)
    const adminSupabase = createAdminClient();

    const documents = pages.map((page, index) => {
      const snippet = page.text.length > 80
        ? page.text.substring(0, 80) + '...'
        : page.text;

      return {
        id: `${pdfId}_page_${page.pageNumber}`,
        user_id: user.id,
        pdf_id: pdfId,
        file_name: fileName,
        page_number: page.pageNumber,
        content: page.text,
        snippet,
        embedding: JSON.stringify(embeddings[index]),
      };
    });

    const { error: insertError } = await adminSupabase
      .from('pdf_documents')
      .upsert(documents);

    if (insertError) {
      throw new Error(`벡터 저장 실패: ${insertError.message}`);
    }

    // 4. 크레딧 사용량 기록 (non-blocking)
    // AI Gateway total_used 전/후 차이로 실제 비용 계산 후 기록
    // NOTE: 임베딩 API는 input tokens만 반환하므로 prompt_tokens에 매핑, completion_tokens=0
    (async () => {
      const afterTotalUsed = await fetchGatewayTotalUsed();
      const cost = (beforeTotalUsed != null && afterTotalUsed != null)
        ? Math.max(0, afterTotalUsed - beforeTotalUsed)
        : 0;
      await logCreditUsage({
        userId: user.id,
        actionType: 'embedding',
        modelName: getEmbeddingModel(),
        promptTokens: usage.tokens,  // 임베딩 API의 input tokens → prompt_tokens에 매핑
        completionTokens: 0,         // 임베딩 API는 completion tokens 없음
        totalCost: cost,
        pdfId,
        metadata: {
          fileName,
          totalPages,
          textsCount: texts.length,
        },
      });
    })().catch((error) => {
      console.error('크레딧 사용량 기록 실패:', error);
    });

    const response: SavePdfResponse = {
      pdfId,
      status: 'embedded',
      totalPages,
      collectionName: pdfId,
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
