import { ChatSource } from '@/shared/types';
import { retrieveRelevantDocuments, formatContextsForLLM } from './retriever';
import { generateAnswer, createRAGPrompt, createRAGSystemPrompt } from './llm';

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 질문 타입 분류
 * - FACT: 단순 사실 질문
 * - COMPOSITE: 여러 정보를 종합해야 하는 질문
 * - INFERENCE: 추론이 필요한 질문
 * - NOT_IN_DOC: 문서에 없는 정보에 대한 질문
 * - AMBIGUOUS: 모호한 질문
 */
export type QuestionType = 'FACT' | 'COMPOSITE' | 'INFERENCE' | 'NOT_IN_DOC' | 'AMBIGUOUS';

/**
 * 평가용 Retrieved Chunk 정보
 */
export interface EvaluationChunk {
  chunkId: string;
  rank: number;
  score: number;
  pageNumber: number;
  fileName: string;
  content: string;
  snippet: string;
}

/**
 * 확장된 ChatSource (chunkId, rank 포함)
 */
export interface ExtendedChatSource extends ChatSource {
  chunkId: string;
  rank: number;
}

/**
 * 평가용 RAG 결과
 */
export interface EvaluationRAGResult {
  answer: string;
  sources: ExtendedChatSource[];
  retrievedChunks: EvaluationChunk[];
}

/**
 * 평가 결과 타입
 */
export interface EvaluationResult {
  questionType: QuestionType;
  retrieval: {
    supporting_chunks: Array<{ chunk_id: string; rank: number }>;
    hit_at_k: 0 | 1;
    best_rank: number | null;
  };
  answer: {
    claims: Array<{
      claim: string;
      label: 'supported' | 'unsupported' | 'contradicted';
      evidence_chunk_id: string | null;
    }>;
    scores: {
      correctness: number;
      groundedness: number;
      completeness: number;
    };
  };
  root_cause: 'OK' | 'RETRIEVAL_FAIL' | 'GENERATION_FAIL' | 'BOTH_FAIL';
  fix_suggestions: string[];
}

/**
 * 평가 입력 옵션
 */
export interface EvaluationOptions {
  topK?: number;
  questionType?: QuestionType;
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 텍스트를 안전하게 축약 (head + tail 방식)
 * - 전체 텍스트가 maxLength 이하면 그대로 반환
 * - 초과하면 앞 70% + ... + 뒤 30% 형식으로 반환
 * - 평가 시 근거 문장이 잘려나가는 것을 방지
 */
export function clipText(text: string, maxLength: number = 1800): string {
  if (text.length <= maxLength) {
    return text;
  }

  const headRatio = 0.7;
  const tailRatio = 0.3;
  const headLength = Math.floor(maxLength * headRatio);
  const tailLength = Math.floor(maxLength * tailRatio);

  const head = text.slice(0, headLength);
  const tail = text.slice(-tailLength);

  return `${head}\n\n[...중략...]\n\n${tail}`;
}

// ============================================================================
// RAG 파이프라인
// ============================================================================

/**
 * 평가용 RAG 파이프라인 실행
 * - 기존 RAG와 동일한 로직이지만 평가에 필요한 상세 정보 반환
 * - chunk_id, rank, full content 포함
 * - sources에도 chunkId, rank 포함 (디버깅 용이)
 */
export async function executeRAGForEvaluation(
  pdfId: string,
  question: string,
  topK: number = 6
): Promise<EvaluationRAGResult> {
  try {
    // 1. Retrieval: 관련 문서 검색
    const retrievalResults = await retrieveRelevantDocuments(pdfId, question, topK);

    if (retrievalResults.length === 0) {
      return {
        answer: '죄송합니다. 질문과 관련된 내용을 문서에서 찾을 수 없습니다.',
        sources: [],
        retrievedChunks: [],
      };
    }

    // 2. 평가용 chunk 정보 구성 (rank 포함)
    const retrievedChunks: EvaluationChunk[] = retrievalResults.map((result, index) => ({
      chunkId: `${pdfId}_page_${result.pageNumber}`,
      rank: index + 1,
      score: result.score,
      pageNumber: result.pageNumber,
      fileName: result.fileName,
      content: result.content,
      snippet: result.snippet,
    }));

    // 3. 컨텍스트 포맷팅
    const contexts = formatContextsForLLM(retrievalResults);

    // 4. 프롬프트 생성
    const systemPrompt = createRAGSystemPrompt();
    const prompt = createRAGPrompt(question, contexts);

    // 5. LLM 응답 생성
    const result = await generateAnswer(prompt, systemPrompt);

    // 6. 전체 응답 텍스트 수집
    let fullAnswer = '';
    for await (const textPart of result.textStream) {
      fullAnswer += textPart;
    }

    // 7. Sources 생성 (chunkId, rank 포함)
    const sources: ExtendedChatSource[] = retrievalResults.map((result, index) => ({
      pageNumber: result.pageNumber,
      fileName: result.fileName,
      snippet: result.snippet,
      score: result.score,
      chunkId: `${pdfId}_page_${result.pageNumber}`,
      rank: index + 1,
    }));

    return {
      answer: fullAnswer,
      sources,
      retrievedChunks,
    };
  } catch (error) {
    throw new Error(
      `평가용 RAG 파이프라인 실행 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ============================================================================
// 평가 프롬프트
// ============================================================================

/**
 * 평가 프롬프트 생성 (개선된 버전)
 * - head+tail 방식으로 텍스트 축약 (근거 누락 방지)
 * - 질문 타입 포함
 * - root_cause 분류 기준 명문화
 */
export function buildEvaluationPrompt(
  question: string,
  chunks: EvaluationChunk[],
  answer: string,
  expectedAnswer?: string,
  questionType?: QuestionType
): string {
  // chunk 텍스트를 head+tail 방식으로 축약
  const chunksText = chunks
    .map((c) => {
      const clippedContent = clipText(c.content, 1800);
      return `- (rank=${c.rank}, chunk_id=${c.chunkId}, score=${c.score.toFixed(4)})\n${clippedContent}`;
    })
    .join('\n\n');

  const questionTypeHint = questionType ? `\n[Question Type Hint]: ${questionType}` : '';

  return `너는 RAG 시스템의 종합 품질 평가자다.
1) Retrieval이 답에 필요한 근거를 가져왔는지 평가하고,
2) Answer가 그 근거를 제대로 사용했는지 평가하며,
3) 문제가 있다면 원인을 "Retrieval 문제" vs "Generation 문제"로 분류하라.

[Question]
${question}${questionTypeHint}

[Retrieved Chunks] (Top-${chunks.length})
${chunksText}

[Model Answer]
${answer}

[Expected Answer] (있으면)
${expectedAnswer || '없음'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 판단 절차

### Step A: 질문 타입 분류
먼저 질문의 타입을 분류하라:
- FACT: 단순 사실 질문 (예: "저자는 누구인가?")
- COMPOSITE: 여러 정보를 종합해야 하는 질문 (예: "1장과 3장의 공통점은?")
- INFERENCE: 추론이 필요한 질문 (예: "저자가 주장하는 바는?")
- NOT_IN_DOC: 문서에 없는 정보에 대한 질문 (예: "저자의 취미는?")
- AMBIGUOUS: 모호한 질문 (예: "그거 설명해줘")

### Step B: Retrieval 평가
"답에 필요한 근거"가 포함된 chunk를 찾고 best_rank를 기록하라.

### Step C: Generation 평가
모델 답변의 핵심 주장들을 bullet로 쪼개고, 각 주장별로 라벨링하라:
- supported: chunk에 근거가 있고 정확하게 사용됨
- unsupported: chunk에 근거가 없는 주장
- contradicted: chunk의 내용과 모순됨

### Step D: root_cause 분류 (아래 규칙을 정확히 따를 것)

| 조건 | root_cause |
|------|------------|
| supporting_chunks가 있고, 핵심 주장들이 모두 supported | OK |
| supporting_chunks가 비어있음 (NOT_IN_DOC 질문 제외) | RETRIEVAL_FAIL |
| supporting_chunks가 있지만, unsupported/contradicted 주장이 핵심임 | GENERATION_FAIL |
| supporting_chunks가 비어있고, 모델이 단정적으로 잘못된 답변 | BOTH_FAIL |
| NOT_IN_DOC 질문인데 모델이 "모른다/없다"고 정확히 답함 | OK |
| NOT_IN_DOC 질문인데 모델이 없는 정보를 지어냄 | GENERATION_FAIL |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 출력 형식

반드시 아래 JSON 형식으로만 출력하라. 다른 텍스트는 포함하지 마라.

{
  "questionType": "FACT|COMPOSITE|INFERENCE|NOT_IN_DOC|AMBIGUOUS",
  "retrieval": {
    "supporting_chunks": [{"chunk_id": "...", "rank": 2}],
    "hit_at_k": 0 | 1,
    "best_rank": number | null
  },
  "answer": {
    "claims": [
      {"claim": "...", "label": "supported|unsupported|contradicted", "evidence_chunk_id": "..." | null}
    ],
    "scores": {
      "correctness": 0-5,
      "groundedness": 0-5,
      "completeness": 0-5
    }
  },
  "root_cause": "OK|RETRIEVAL_FAIL|GENERATION_FAIL|BOTH_FAIL",
  "fix_suggestions": ["구체적인 개선 제안"]
}`;
}

// ============================================================================
// 평가 실행
// ============================================================================

/**
 * 평가 LLM 호출 및 결과 파싱
 * - temperature=0으로 설정하여 재현성 보장
 * - JSON 파싱 안정성 강화
 */
export async function runEvaluation(evaluationPrompt: string): Promise<EvaluationResult> {
  const systemPrompt = `당신은 RAG 시스템 평가 전문가입니다.
반드시 유효한 JSON 형식으로만 응답하세요.
마크다운 코드 블록(\`\`\`)을 사용하지 마세요.
JSON 외의 텍스트를 포함하지 마세요.`;

  // temperature=0으로 설정하여 평가 재현성 보장
  const result = await generateAnswer(evaluationPrompt, systemPrompt, {
    temperature: 0,
  });

  let fullResponse = '';
  for await (const textPart of result.textStream) {
    fullResponse += textPart;
  }

  // JSON 파싱 (마크다운 코드 블록 제거)
  let jsonString = fullResponse.trim();

  // 마크다운 코드 블록 제거
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.slice(7);
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.slice(3);
  }
  if (jsonString.endsWith('```')) {
    jsonString = jsonString.slice(0, -3);
  }

  // JSON 객체 추출
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`평가 결과에서 JSON을 파싱할 수 없습니다. 응답: ${fullResponse.substring(0, 200)}`);
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    // 필수 필드 검증
    if (!parsed.retrieval || !parsed.answer || !parsed.root_cause) {
      throw new Error('평가 결과에 필수 필드가 누락되었습니다.');
    }

    return parsed as EvaluationResult;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`평가 결과 JSON 파싱 실패: ${error.message}\n응답: ${fullResponse.substring(0, 300)}`);
    }
    throw error;
  }
}

/**
 * 전체 평가 파이프라인 실행
 */
export async function evaluateRAG(
  pdfId: string,
  question: string,
  expectedAnswer?: string,
  options: EvaluationOptions = {}
): Promise<{
  question: string;
  answer: string;
  expectedAnswer?: string;
  retrievedChunks: EvaluationChunk[];
  sources: ExtendedChatSource[];
  evaluation: EvaluationResult;
}> {
  const { topK = 6, questionType } = options;

  // 1. RAG 실행
  const ragResult = await executeRAGForEvaluation(pdfId, question, topK);

  // 2. 평가 프롬프트 생성
  const evaluationPrompt = buildEvaluationPrompt(
    question,
    ragResult.retrievedChunks,
    ragResult.answer,
    expectedAnswer,
    questionType
  );

  // 3. 평가 실행
  const evaluation = await runEvaluation(evaluationPrompt);

  return {
    question,
    answer: ragResult.answer,
    expectedAnswer,
    retrievedChunks: ragResult.retrievedChunks,
    sources: ragResult.sources,
    evaluation,
  };
}
