import { NextResponse } from 'next/server';

/**
 * Vercel Cron Job 인증 검증 유틸리티
 *
 * @param request - NextRequest 또는 Request 객체
 * @returns 인증 실패 시 NextResponse, 성공 시 null
 *
 * @example
 * ```ts
 * export async function GET(request: Request) {
 *   const authError = verifyCronSecret(request);
 *   if (authError) return authError;
 *
 *   // 인증 성공, 크론 작업 수행
 * }
 * ```
 */
export function verifyCronSecret(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null; // 인증 성공
}
