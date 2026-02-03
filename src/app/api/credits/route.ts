import { NextResponse } from 'next/server';
import { CreditsResponse, ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * GET /api/credits
 * Vercel AI Gateway Credits API 호출하여 잔액 반환
 */
export async function GET() {
  try {
    // 1. API 키 확인
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'AI_GATEWAY_API_KEY 환경변수가 설정되지 않았습니다.',
          code: 'MISSING_API_KEY',
        },
        { status: 500 }
      );
    }

    // 2. Vercel AI Gateway Credits API 호출
    const response = await fetch('https://ai-gateway.vercel.sh/v1/credits', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Credits API 호출 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // 3. 응답 포맷 변환
    const creditsResponse: CreditsResponse = {
      balance: data.balance || 0,
      total_used: data.total_used || 0,
    };

    return NextResponse.json(creditsResponse, { status: 200 });
  } catch (error) {
    console.error('Credits API 오류:', error);
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Credits 정보 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'CREDITS_ERROR',
      },
      { status: 500 }
    );
  }
}
