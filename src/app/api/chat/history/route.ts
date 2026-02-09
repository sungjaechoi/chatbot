import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase/server';
import { getMessages } from '@/shared/lib/supabase/chat-service';
import { ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * GET /api/chat/history?pdfId=xxx
 * 특정 PDF의 채팅 히스토리 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const pdfId = request.nextUrl.searchParams.get('pdfId');
    if (!pdfId) {
      return NextResponse.json<ErrorResponse>(
        { error: 'pdfId는 필수 파라미터입니다.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const messages = await getMessages(user.id, pdfId);

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '채팅 히스토리 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'HISTORY_ERROR',
      },
      { status: 500 }
    );
  }
}
