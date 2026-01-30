import { NextRequest, NextResponse } from 'next/server';
import { savePDFFile } from '@/shared/lib/pdf-loader';
import { UploadPdfResponse, ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * POST /api/pdf/upload
 * multipart/form-data로 PDF 파일 수신
 * 임시 저장 후 { pdfId, fileName } 반환
 */
export async function POST(request: NextRequest) {
  try {
    // Next.js formData로 파일 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json<ErrorResponse>(
        { error: '파일이 제공되지 않았습니다.', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    // PDF 파일 검증
    if (file.type !== 'application/pdf') {
      return NextResponse.json<ErrorResponse>(
        { error: 'PDF 파일만 업로드 가능합니다.', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (예: 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ErrorResponse>(
        {
          error: '파일 크기가 너무 큽니다. (최대 10MB)',
          code: 'FILE_TOO_LARGE',
        },
        { status: 400 }
      );
    }

    // File을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // PDF 파일 저장
    const { pdfId, fileName } = savePDFFile(buffer, file.name);

    const response: UploadPdfResponse = {
      pdfId,
      fileName,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: 'PDF 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'UPLOAD_ERROR',
      },
      { status: 500 }
    );
  }
}
