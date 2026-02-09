import { NextResponse } from 'next/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * GET /api/cron/keep-alive
 * Supabase Free 프로젝트 비활성 방지 (5일마다 ping)
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // 간단한 쿼리로 Supabase를 활성 상태로 유지
    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
