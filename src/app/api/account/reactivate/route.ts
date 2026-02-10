import { NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * POST /api/account/reactivate
 * 탈퇴 유저 재가입 (데이터 초기화 + 프로필 리셋)
 *
 * 동작:
 * 1. 사용자 인증 확인
 * 2. deleted_at이 설정된 사용자인지 확인
 * 3. Storage 파일 삭제 (pdfs 버킷)
 * 4. 관련 데이터 삭제 (pdf_documents, chat_sessions, credit_usage_logs)
 * 5. profiles 초기화 (deleted_at, deletion_scheduled_at → null)
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

    const adminSupabase = createAdminClient();

    // 2. deleted_at 확인
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('deleted_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json<ErrorResponse>(
        { error: '프로필 조회 중 오류가 발생했습니다.', code: 'PROFILE_FETCH_ERROR' },
        { status: 500 }
      );
    }

    if (!profile?.deleted_at) {
      return NextResponse.json<ErrorResponse>(
        { error: '탈퇴 상태가 아닌 계정입니다.', code: 'NOT_DELETED' },
        { status: 400 }
      );
    }

    // 3. Storage 파일 삭제 (pdfs 버킷의 {userId}/ 하위)
    const { data: storageFiles } = await adminSupabase.storage
      .from('pdfs')
      .list(user.id);

    if (storageFiles && storageFiles.length > 0) {
      const filePaths = storageFiles.map((file) => `${user.id}/${file.name}`);
      await adminSupabase.storage.from('pdfs').remove(filePaths);
    }

    // 4. 관련 데이터 삭제 (chat_messages는 chat_sessions CASCADE로 자동 삭제)
    await adminSupabase
      .from('credit_usage_logs')
      .delete()
      .eq('user_id', user.id);

    await adminSupabase
      .from('chat_sessions')
      .delete()
      .eq('user_id', user.id);

    await adminSupabase
      .from('pdf_documents')
      .delete()
      .eq('user_id', user.id);

    // 5. profiles 초기화
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        deleted_at: null,
        deletion_scheduled_at: null,
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json<ErrorResponse>(
        { error: '프로필 초기화 중 오류가 발생했습니다.', code: 'RESET_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '새로운 계정으로 시작합니다.',
    });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '계정 재활성화 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'REACTIVATE_ERROR',
      },
      { status: 500 }
    );
  }
}
