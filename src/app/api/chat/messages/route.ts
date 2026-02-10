import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase/server';
import { getMessagesBySessionId, verifySessionOwner } from '@/shared/lib/supabase/chat-service';
import type { ErrorResponse, Message, MessagesResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * GET /api/chat/messages?sessionId=xxx
 * 특정 세션의 메시지 목록 조회
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

    const sessionId = request.nextUrl.searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json<ErrorResponse>(
        { error: 'sessionId는 필수 파라미터입니다.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const isOwner = await verifySessionOwner(sessionId, user.id);
    if (!isOwner) {
      return NextResponse.json<ErrorResponse>(
        { error: '이 세션에 접근할 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const messageRows = await getMessagesBySessionId(sessionId);

    const messages: Message[] = messageRows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      timestamp: new Date(row.created_at),
      sources: row.sources || undefined,
      isError: row.is_error,
      usage: row.usage || undefined,
    }));

    return NextResponse.json<MessagesResponse>({ messages }, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '메시지 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'MESSAGES_ERROR',
      },
      { status: 500 }
    );
  }
}
