import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase/server';
import { getMessagesBySessionId, verifySessionOwner, updateSessionTitle } from '@/shared/lib/supabase/chat-service';
import { generateAnswer } from '@/shared/lib/langchain/llm';
import type { ErrorResponse, TitleGenerationResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * POST /api/chat/sessions/[sessionId]/title
 * 세션의 메시지를 기반으로 LLM에게 제목 자동 생성 요청
 */
export async function POST(
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

    const messages = await getMessagesBySessionId(sessionId);

    if (messages.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: '메시지가 없는 세션입니다. 제목을 생성할 수 없습니다.', code: 'NO_MESSAGES' },
        { status: 400 }
      );
    }

    // 비용 최소화: 최대 5개 메시지만 사용 (에러 메시지 제외)
    const validMessages = messages
      .filter((msg) => !msg.is_error)
      .slice(0, 5);

    if (validMessages.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: '유효한 메시지가 없습니다. 제목을 생성할 수 없습니다.', code: 'NO_VALID_MESSAGES' },
        { status: 400 }
      );
    }

    // 대화 요약
    const conversationSummary = validMessages
      .map((msg) => `${msg.role}: ${msg.content.slice(0, 200)}`)
      .join('\n');

    // LLM을 통한 제목 생성
    const systemPrompt = '당신은 대화 내용을 분석하여 간결한 제목을 생성하는 AI입니다.';
    const prompt = `다음 대화 내용을 10자 내외의 한국어 제목으로 요약해주세요. 제목만 출력하세요.

${conversationSummary}`;

    const { result } = await generateAnswer(
      prompt,
      systemPrompt,
      { temperature: 0.3 }
    );

    const generatedText = await result.text;

    // 제목 정리 (앞뒤 공백, 따옴표 제거, 20자 제한)
    let generatedTitle = generatedText.trim().replace(/^["']|["']$/g, '');

    if (generatedTitle.length > 20) {
      generatedTitle = generatedTitle.slice(0, 20);
    }

    if (generatedTitle.length === 0) {
      generatedTitle = '새 대화';
    }

    // 세션 제목 업데이트
    await updateSessionTitle(sessionId, generatedTitle);

    return NextResponse.json<TitleGenerationResponse>({ title: generatedTitle }, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '제목 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'TITLE_GENERATION_ERROR',
      },
      { status: 500 }
    );
  }
}
