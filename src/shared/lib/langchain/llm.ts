import { streamText } from "ai";
import { ChatHistoryMessage } from "@/shared/types";

/**
 * Vercel AI Gateway를 통한 LLM 호출
 * 모델: google/gemini-2.5-flash
 * - test.ts와 동일한 방식: 문자열로 모델 지정
 * - AI_GATEWAY_API_KEY 환경변수 사용
 */
export interface LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * LLM 응답 결과 (모델 정보 포함)
 */
export interface LLMResult {
  result: ReturnType<typeof streamText>;
  model: string;
}

/**
 * RAG 시스템 프롬프트 생성
 */
export function createRAGSystemPrompt(): string {
  return `당신은 PDF 문서 기반의 질문응답 AI 어시스턴트입니다.

규칙:
1. 제공된 컨텍스트(PDF 문서 내용)를 기반으로만 답변하세요.
2. 컨텍스트에 없는 내용은 추측하지 마세요.
3. 확실하지 않으면 "제공된 문서에서 해당 정보를 찾을 수 없습니다"라고 답변하세요.
4. 명확하고 간결하게 답변하세요.
5. 가능한 한 여러 관련 정보를 종합하여 답변하세요.
6. 답변 시 출처 페이지를 (페이지 X) 형식으로 명시하세요.`;
}

/**
 * RAG 프롬프트 생성
 */
export function createRAGPrompt(
  question: string,
  contexts: Array<{ pageNumber: number; content: string }>,
): string {
  const contextText = contexts
    .map((ctx) => `[페이지 ${ctx.pageNumber}]\n${ctx.content}`)
    .join("\n\n---\n\n");

  return `다음은 PDF 문서에서 검색된 관련 내용입니다:

${contextText}

질문: ${question}

답변:`;
}

/**
 * LLM 스트리밍 응답 생성
 * test.ts와 동일한 방식: 문자열로 모델 지정 (Vercel AI Gateway)
 *
 * 대화 히스토리가 제공되면 messages 배열 형식으로 사용하고,
 * 없으면 기존처럼 단일 prompt로 동작 (하위 호환)
 *
 * @param prompt - 현재 RAG 프롬프트 (컨텍스트 + 질문)
 * @param systemPrompt - 시스템 프롬프트
 * @param config - 모델 설정
 * @param chatHistory - 이전 대화 히스토리 (optional)
 * @returns LLMResult - 스트리밍 결과와 사용한 모델명
 */
export async function generateAnswer(
  prompt: string,
  systemPrompt: string,
  config: LLMConfig = {},
  chatHistory?: ChatHistoryMessage[],
): Promise<LLMResult> {
  // test.ts와 동일: 문자열로 모델 지정 "google/gemini-2.5-flash"
  const model =
    config.model || process.env.LLM_MODEL || "google/gemini-2.5-flash";

  let result;

  // 대화 히스토리가 있으면 messages 배열 형식 사용
  if (chatHistory && chatHistory.length > 0) {
    // role별 분기로 정확한 리터럴 타입 보장
    const historyMessages = chatHistory.map((msg) => {
      if (msg.role === 'user') {
        return { role: 'user' as const, content: msg.content };
      } else {
        return { role: 'assistant' as const, content: msg.content };
      }
    });

    const messages = [
      ...historyMessages,
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    result = streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: config.temperature ?? 0.3,
    });
  } else {
    // 히스토리가 없으면 기존 방식 (단일 prompt)
    result = streamText({
      model,
      system: systemPrompt,
      prompt,
      temperature: config.temperature ?? 0.3,
    });
  }

  return {
    result,
    model,
  };
}
