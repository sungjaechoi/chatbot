import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase/server';
import { getSessionsByPdfId, createSession } from '@/shared/lib/supabase/chat-service';
import type { ErrorResponse, SessionListResponse, SessionResponse, CreateSessionRequest, ChatSession } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * GET /api/chat/sessions?pdfId=xxx
 * 특정 PDF의 세션 목록 조회
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

    const sessionRows = await getSessionsByPdfId(user.id, pdfId);

    const sessions: ChatSession[] = sessionRows.map((row) => ({
      id: row.id,
      pdfId: row.pdf_id,
      title: row.title ?? null,
      createdAt: row.created_at,
      lastMessageAt: row.last_message_at ?? row.created_at,
    }));

    return NextResponse.json<SessionListResponse>({ sessions }, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '세션 목록 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'SESSION_LIST_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/sessions
 * body: { pdfId, title? }
 * 새 세션 생성
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

    const body: CreateSessionRequest = await request.json();
    const { pdfId } = body;

    if (!pdfId) {
      return NextResponse.json<ErrorResponse>(
        { error: 'pdfId는 필수 입력값입니다.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Note: title 파라미터는 마이그레이션 후 활성화될 예정 (현재는 지원하지 않음)
    const sessionRow = await createSession(user.id, pdfId);

    const session: ChatSession = {
      id: sessionRow.id,
      pdfId: sessionRow.pdf_id,
      title: sessionRow.title ?? null,
      createdAt: sessionRow.created_at,
      lastMessageAt: sessionRow.last_message_at ?? sessionRow.created_at,
    };

    return NextResponse.json<SessionResponse>({ session }, { status: 201 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '세션 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'SESSION_CREATE_ERROR',
      },
      { status: 500 }
    );
  }
}
