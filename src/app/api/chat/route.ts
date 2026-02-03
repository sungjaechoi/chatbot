import { NextRequest, NextResponse } from 'next/server';
import { executeRAGPipeline } from '@/shared/lib/langchain/rag';
import { collectionExists, getChromaClient, getCollectionName } from '@/shared/lib/chroma';
import { ChatRequest, ChatResponse, ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * POST /api/chat
 * body: { pdfId, message }
 * 질의 임베딩 → Chroma TopK 검색 → google/gemini-2.5-flash로 답변 생성
 * 답변에 근거 페이지 번호 포함
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 바디 파싱
    const body: ChatRequest = await request.json();
    const { pdfId, message } = body;

    // 2. 입력 검증
    if (!pdfId || !message) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'pdfId와 message는 필수 입력값입니다.',
          code: 'INVALID_INPUT',
        },
        { status: 400 }
      );
    }

    if (message.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          error: '메시지는 비어있을 수 없습니다.',
          code: 'EMPTY_MESSAGE',
        },
        { status: 400 }
      );
    }

    // 3. 컬렉션 존재 확인
    const client = getChromaClient();
    const collectionName = getCollectionName(pdfId);
    const exists = await collectionExists(client, collectionName);

    if (!exists) {
      return NextResponse.json<ErrorResponse>(
        {
          error: '해당 PDF의 임베딩 데이터를 찾을 수 없습니다. 먼저 PDF를 저장해주세요.',
          code: 'COLLECTION_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. RAG 파이프라인 실행
    const topK = parseInt(process.env.TOP_K || '6', 10);
    const { answer, sources, usage } = await executeRAGPipeline(pdfId, message, topK);

    const response: ChatResponse = {
      answer,
      sources,
      usage,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '답변 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'CHAT_ERROR',
      },
      { status: 500 }
    );
  }
}
