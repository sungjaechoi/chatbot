import { NextRequest, NextResponse } from 'next/server';
import { evaluateRAG, QuestionType } from '@/shared/lib/langchain/rag-evaluate';
import { collectionExists, getChromaClient, getCollectionName } from '@/shared/lib/chroma';
import { ErrorResponse } from '@/shared/types';

export const runtime = 'nodejs';

/**
 * 평가 요청 타입
 */
interface EvaluateRequest {
  pdfId: string;
  question: string;
  expectedAnswer?: string;
  topK?: number;
  questionType?: QuestionType;
}

/**
 * POST /api/evaluate
 * RAG 시스템 품질 평가 API
 * - Retrieval 품질 평가 (Hit@K, Best Rank, MRR)
 * - Generation 품질 평가 (Correctness, Groundedness, Completeness)
 * - 근본 원인 분류 (OK, RETRIEVAL_FAIL, GENERATION_FAIL, BOTH_FAIL)
 * - 질문 타입 분류 (FACT, COMPOSITE, INFERENCE, NOT_IN_DOC, AMBIGUOUS)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 바디 파싱
    const body: EvaluateRequest = await request.json();
    const { pdfId, question, expectedAnswer, topK, questionType } = body;

    // 2. 입력 검증
    if (!pdfId || !question) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'pdfId와 question은 필수 입력값입니다.',
          code: 'INVALID_INPUT',
        },
        { status: 400 }
      );
    }

    if (question.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'question은 비어있을 수 없습니다.',
          code: 'EMPTY_QUESTION',
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

    // 4. 평가 실행
    const evaluationTopK = topK || parseInt(process.env.TOP_K || '6', 10);
    const result = await evaluateRAG(pdfId, question, expectedAnswer, {
      topK: evaluationTopK,
      questionType,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      {
        error: '평가 실행 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        code: 'EVALUATION_ERROR',
      },
      { status: 500 }
    );
  }
}
