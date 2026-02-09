import { NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase/server';
import {
  GetCollectionsResponse,
  CollectionInfo,
  ErrorResponse,
  CollectionsMeta,
} from '@/shared/types';

export const runtime = 'nodejs';

/**
 * GET /api/collections
 * Supabase에서 사용자의 PDF 컬렉션 목록 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // get_user_collections RPC 호출
    const { data, error } = await supabase.rpc('get_user_collections');

    if (error) {
      throw new Error(`컬렉션 조회 실패: ${error.message}`);
    }

    const collectionsInfo: CollectionInfo[] = (data || []).map((row: {
      pdf_id: string;
      file_name: string;
      document_count: number;
      created_at: string;
    }) => ({
      pdfId: row.pdf_id,
      fileName: row.file_name,
      documentCount: row.document_count,
      createdAt: row.created_at,
    }));

    const meta: CollectionsMeta = {
      total: collectionsInfo.length,
      success: collectionsInfo.length,
      failed: 0,
    };

    const response: GetCollectionsResponse = {
      collections: collectionsInfo,
      meta,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '컬렉션 목록 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'COLLECTIONS_FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}
