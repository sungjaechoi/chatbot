import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { deletePDFFile } from '@/shared/lib/pdf-loader';
import { DeletePdfResponse, ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * DELETE /api/pdf/[pdfId]
 * PDF 벡터 데이터 + Storage 파일 삭제
 */
export async function DELETE(
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

    const adminSupabase = createAdminClient();

    // 1. pdf_documents에서 해당 PDF 확인
    const { count } = await adminSupabase
      .from('pdf_documents')
      .select('*', { count: 'exact', head: true })
      .eq('pdf_id', pdfId)
      .eq('user_id', user.id);

    const storagePath = `${user.id}/${pdfId}.pdf`;

    if (!count || count === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'PDF를 찾을 수 없습니다.', code: 'PDF_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 2. pdf_documents 행 삭제
    let documentsDeleted = false;
    const { error: deleteError } = await adminSupabase
      .from('pdf_documents')
      .delete()
      .eq('pdf_id', pdfId)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json<ErrorResponse>(
        {
          error: '벡터 데이터 삭제 중 오류가 발생했습니다.',
          details: deleteError.message,
          code: 'VECTOR_DELETE_ERROR',
        },
        { status: 500 }
      );
    }
    documentsDeleted = true;

    // 3. Storage 파일 삭제
    let fileDeleted = false;
    try {
      fileDeleted = await deletePDFFile(storagePath);
    } catch {
      // Storage 파일 삭제 실패 시 부분 성공으로 처리
    }

    // 4. chat_sessions 및 chat_messages 삭제 (cascade)
    await adminSupabase
      .from('chat_sessions')
      .delete()
      .eq('pdf_id', pdfId)
      .eq('user_id', user.id);

    const response: DeletePdfResponse = {
      pdfId,
      deleted: true,
      message: `PDF 삭제 완료 (문서: ${documentsDeleted ? '삭제됨' : '실패'}, 파일: ${fileDeleted ? '삭제됨' : '없음'})`,
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
