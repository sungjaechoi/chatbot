import { NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { AccountDeletionResponse, ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * POST /api/account/delete
 * 회원 탈퇴 (소프트 딜리트)
 *
 * 동작:
 * 1. 사용자 인증 확인
 * 2. profiles 테이블에 deleted_at, deletion_scheduled_at 업데이트 (30일 유예)
 * 3. middleware에서 deleted_at 체크로 접근 차단 (ban 대신)
 * 4. 재로그인 시 /account/deleted에서 신규 가입 가능 (데이터 초기화)
 * 5. 미재가입 시 30일 후 크론 작업으로 데이터 영구 삭제
 */
export async function POST() {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. 이미 탈퇴한 사용자인지 확인
    const adminSupabase = createAdminClient();
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('deleted_at, deletion_scheduled_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json<ErrorResponse>(
        {
          error: '프로필 조회 중 오류가 발생했습니다.',
          details: profileError.message,
          code: 'PROFILE_FETCH_ERROR',
        },
        { status: 500 }
      );
    }

    if (profile?.deleted_at || profile?.deletion_scheduled_at) {
      return NextResponse.json<ErrorResponse>(
        {
          error: '이미 탈퇴 처리된 계정입니다.',
          code: 'ALREADY_DELETED',
        },
        { status: 409 }
      );
    }

    // 3. 소프트 딜리트: deleted_at, deletion_scheduled_at 업데이트
    const now = new Date();
    const deletionScheduledAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일 후

    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        deleted_at: now.toISOString(),
        deletion_scheduled_at: deletionScheduledAt.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json<ErrorResponse>(
        {
          error: '회원 탈퇴 처리 중 오류가 발생했습니다.',
          details: updateError.message,
          code: 'UPDATE_ERROR',
        },
        { status: 500 }
      );
    }

    // 4. 성공 응답
    // 참고: ban 처리 대신 middleware에서 deleted_at 체크로 접근 차단
    // 재로그인 시 /account/deleted 페이지에서 신규 가입(데이터 초기화) 가능
    const response: AccountDeletionResponse = {
      success: true,
      message: '회원 탈퇴가 완료되었습니다. 30일 후 데이터가 영구 삭제됩니다.',
      deletionScheduledAt: deletionScheduledAt.toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '회원 탈퇴 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'DELETE_ACCOUNT_ERROR',
      },
      { status: 500 }
    );
  }
}
