import { NextRequest, NextResponse } from 'next/server';
import { executeRAGPipeline } from '@/shared/lib/langchain/rag';
import { createClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { getMessages } from '@/shared/lib/supabase/chat-service';
import { ChatRequest, ChatResponse, ErrorResponse, ChatHistoryMessage } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * POST /api/chat
 * body: { pdfId, message }
 * 질의 임베딩 → pgvector TopK 검색 → LLM 답변 생성
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

    // 1. 요청 바디 파싱
    const body: ChatRequest = await request.json();
    const { pdfId, message } = body;

    // 2. 입력 검증
    if (!pdfId || !message) {
      return NextResponse.json<ErrorResponse>(
        { error: 'pdfId와 message는 필수 입력값입니다.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (message.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: '메시지는 비어있을 수 없습니다.', code: 'EMPTY_MESSAGE' },
        { status: 400 }
      );
    }

    // 3. PDF 문서 존재 확인
    const adminSupabase = createAdminClient();
    const { count } = await adminSupabase
      .from('pdf_documents')
      .select('*', { count: 'exact', head: true })
      .eq('pdf_id', pdfId);

    if (!count || count === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          error: '해당 PDF의 임베딩 데이터를 찾을 수 없습니다. 먼저 PDF를 저장해주세요.',
          code: 'COLLECTION_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. 대화 히스토리 조회 (최근 N개 메시지, 에러 메시지 제외)
    const historyLimit = parseInt(process.env.CHAT_HISTORY_LIMIT || '10', 10);
    let chatHistory: ChatHistoryMessage[] = [];

    try {
      const messages = await getMessages(user.id, pdfId);

      // is_error = true인 메시지 제외 후 최근 N개 선택
      const validMessages = messages
        .filter((msg) => !msg.is_error)
        .slice(-historyLimit);

      chatHistory = validMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
    } catch (error) {
      // 히스토리 조회 실패해도 RAG는 계속 진행 (첫 대화처럼 처리)
      console.error('대화 히스토리 조회 실패:', error);
    }

    // 5. RAG 파이프라인 실행 (대화 히스토리 포함)
    const topK = parseInt(process.env.TOP_K || '6', 10);
    const { answer, sources, usage } = await executeRAGPipeline(pdfId, message, topK, chatHistory);

    // 6. 채팅 메시지 DB 저장
    try {
      // 세션 조회 또는 생성
      const { data: session } = await adminSupabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('pdf_id', pdfId)
        .single();

      let sessionId: string;
      if (session) {
        sessionId = session.id;
      } else {
        const { data: newSession } = await adminSupabase
          .from('chat_sessions')
          .insert({ user_id: user.id, pdf_id: pdfId })
          .select('id')
          .single();
        sessionId = newSession!.id;
      }

      // user 메시지 저장
      await adminSupabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'user',
        content: message,
      });

      // assistant 메시지 저장
      await adminSupabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: answer,
        sources: sources || null,
        usage: usage || null,
      });
    } catch {
      // DB 저장 실패해도 응답은 반환
    }

    const response: ChatResponse = {
      answer,
      sources,
      usage,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '답변 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'CHAT_ERROR',
      },
      { status: 500 }
    );
  }
}
