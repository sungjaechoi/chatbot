import { NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase/server';
import { CreditUsageSummaryResponse, ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * GET /api/credits/usage
 * 인증된 사용자의 크레딧 사용량 요약 조회
 *
 * Response:
 * {
 *   total_prompt_tokens: number,
 *   total_completion_tokens: number,
 *   total_tokens: number,
 *   total_cost: number,
 *   chat_count: number,
 *   embedding_count: number
 * }
 */
export async function GET() {
  try {
    // 1. 인증 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. RPC 함수 호출 (Server Client 사용 - 인증된 유저 컨텍스트)
    const { data, error } = await supabase.rpc('get_user_credit_usage_summary');

    if (error) {
      throw new Error(`사용량 조회 실패: ${error.message}`);
    }

    // 3. 응답 반환
    // RPC는 단일 행을 반환하지만 배열 형태로 리턴되므로 첫 번째 요소 추출
    const summary: CreditUsageSummaryResponse = data && data.length > 0 ? data[0] : {
      total_prompt_tokens: 0,
      total_completion_tokens: 0,
      total_tokens: 0,
      total_cost: 0,
      chat_count: 0,
      embedding_count: 0,
    };

    return NextResponse.json<CreditUsageSummaryResponse>(summary, { status: 200 });
  } catch (error) {
    console.error('크레딧 사용량 조회 오류:', error);
    return NextResponse.json<ErrorResponse>(
      {
        error: '크레딧 사용량 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'USAGE_QUERY_ERROR',
      },
      { status: 500 }
    );
  }
}
