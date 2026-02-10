import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { CleanupUsersResponse, ErrorResponse } from '@/shared/types';
import { verifyCronSecret } from '@/shared/lib/cron-auth';

export const runtime = 'nodejs';

/**
 * GET /api/cron/cleanup-users
 * 소프트 딜리트된 사용자 영구 삭제 (Vercel Cron Job)
 *
 * 동작:
 * 1. CRON_SECRET 검증
 * 2. cleanup_deleted_users() RPC 호출 (Storage 파일 삭제 + 삭제 대상 user_id 반환)
 * 3. 반환된 user_id 배열에 대해 각각 auth.users 삭제
 *    - auth.users 삭제 시 ON DELETE CASCADE로 profiles, pdf_documents 등 자동 삭제
 * 4. 부분 실패 처리: 일부 auth.users 삭제 실패 시에도 나머지 계속 진행
 */
export async function GET(request: NextRequest) {
  try {
    // 1. CRON_SECRET 검증
    const authError = verifyCronSecret(request);
    if (authError) return authError;

    // 2. Admin Client 생성
    const adminSupabase = createAdminClient();

    // 3. cleanup_deleted_users() RPC 호출
    const { data: userIds, error: rpcError } = await adminSupabase
      .rpc('cleanup_deleted_users');

    if (rpcError) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'cleanup_deleted_users RPC 호출 중 오류가 발생했습니다.',
          details: rpcError.message,
          code: 'RPC_ERROR',
        },
        { status: 500 }
      );
    }

    // 대상이 없으면 조기 반환
    if (!userIds || userIds.length === 0) {
      const response: CleanupUsersResponse = {
        ok: true,
        deletedCount: 0,
        userIds: [],
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(response, { status: 200 });
    }

    // 4. 각 user_id에 대해 auth.users 삭제
    const deletedUserIds: string[] = [];
    const partialFailures: { userId: string; error: string }[] = [];

    for (const userId of userIds) {
      try {
        const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId);

        if (deleteError) {
          partialFailures.push({
            userId,
            error: deleteError.message,
          });
          console.error(`auth.users 삭제 실패 (userId: ${userId}):`, deleteError);
        } else {
          deletedUserIds.push(userId);
        }
      } catch (error) {
        partialFailures.push({
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(`auth.users 삭제 중 예외 발생 (userId: ${userId}):`, error);
      }
    }

    // 5. 성공 응답
    const response: CleanupUsersResponse = {
      ok: true,
      deletedCount: deletedUserIds.length,
      userIds: deletedUserIds,
      timestamp: new Date().toISOString(),
      ...(partialFailures.length > 0 && { partialFailures }),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '사용자 정리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'CLEANUP_ERROR',
      },
      { status: 500 }
    );
  }
}
