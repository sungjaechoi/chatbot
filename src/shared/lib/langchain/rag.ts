import { ChatSource, UsageInfo } from '@/shared/types';
import { retrieveRelevantDocuments, formatContextsForLLM } from './retriever';
import { generateAnswer, createRAGPrompt, createRAGSystemPrompt } from './llm';

/**
 * RAG 파이프라인 실행
 * 1. 질의 임베딩
 * 2. Retriever로 유사도 검색
 * 3. 프롬프트 구성
 * 4. LLM 호출 및 응답 생성
 */
export async function executeRAGPipeline(
  pdfId: string,
  question: string,
  topK: number = 6
): Promise<{
  answer: string;
  sources: ChatSource[];
  usage?: UsageInfo;
}> {
  try {
    // 1. Retrieval: 관련 문서 검색
    const retrievalResults = await retrieveRelevantDocuments(pdfId, question, topK);

    if (retrievalResults.length === 0) {
      return {
        answer: '죄송합니다. 질문과 관련된 내용을 문서에서 찾을 수 없습니다.',
        sources: [],
      };
    }

    // 2. 컨텍스트 포맷팅
    const contexts = formatContextsForLLM(retrievalResults);

    // 3. 프롬프트 생성
    const systemPrompt = createRAGSystemPrompt();
    const prompt = createRAGPrompt(question, contexts);

    // 4. LLM 응답 생성
    const { result } = await generateAnswer(prompt, systemPrompt);

    // 5. 전체 응답 텍스트 수집
    let fullAnswer = '';
    for await (const textPart of result.textStream) {
      fullAnswer += textPart;
    }

    // 6. Sources 생성 (metadata의 snippet을 그대로 사용)
    const sources: ChatSource[] = retrievalResults.map((result) => ({
      pageNumber: result.pageNumber,
      fileName: result.fileName,
      snippet: result.snippet,
      score: result.score,
    }));

    // 7. Usage 정보 추출 (API 응답 값 사용)
    let usage: UsageInfo | undefined;
    try {
      const usageData = await result.usage;
      if (usageData && usageData.inputTokens !== undefined && usageData.outputTokens !== undefined) {
        usage = {
          prompt_tokens: usageData.inputTokens,
          completion_tokens: usageData.outputTokens,
          // AI SDK streamText 응답에 cost 필드가 없으므로 0으로 설정
          total_cost: 0,
        };
      }
    } catch (error) {
      // usage 정보 추출 실패해도 응답은 반환
      console.error('Usage 정보 추출 실패:', error);
    }

    return {
      answer: fullAnswer,
      sources,
      usage,
    };
  } catch (error) {
    throw new Error(
      `RAG 파이프라인 실행 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
