import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase/server';
import { UploadPdfResponse, ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * POST /api/pdf/upload
 * JSON: { pdfId, fileName, storagePath }
 * 클라이언트가 Supabase Storage에 직접 업로드 후 메타데이터만 전송
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pdfId, fileName, storagePath } = body;

    if (!pdfId || !fileName || !storagePath) {
      return NextResponse.json<ErrorResponse>(
        { error: 'pdfId, fileName, storagePath는 필수 입력값입니다.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const response: UploadPdfResponse = {
      pdfId,
      fileName,
      fileSize: 0,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: 'PDF 업로드 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'UPLOAD_ERROR',
      },
      { status: 500 }
    );
  }
}
