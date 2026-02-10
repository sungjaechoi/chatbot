import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase/server';
import { updateSessionTitle, deleteSession, verifySessionOwner } from '@/shared/lib/supabase/chat-service';
import type { ErrorResponse, UpdateSessionTitleRequest } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * PATCH /api/chat/sessions/[sessionId]
 * body: { title }
 * 세션 제목 업데이트
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json<ErrorResponse>(
        { error: 'sessionId는 필수 파라미터입니다.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const body: UpdateSessionTitleRequest = await request.json();
    const { title } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: '제목은 비어있을 수 없습니다.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (title.length > 20) {
      return NextResponse.json<ErrorResponse>(
        { error: '제목은 20자를 초과할 수 없습니다.', code: 'INVALID_INPUT' },
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

    await updateSessionTitle(sessionId, title.trim());

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '세션 제목 업데이트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'SESSION_UPDATE_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/sessions/[sessionId]
 * 세션 삭제 (CASCADE로 메시지도 함께 삭제됨)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

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

    await deleteSession(sessionId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '세션 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'SESSION_DELETE_ERROR',
      },
      { status: 500 }
    );
  }
}
