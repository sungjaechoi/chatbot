import { createAdminClient } from './admin';

/**
 * 크레딧 사용량 기록 파라미터
 */
export interface CreditUsageParams {
  userId: string;
  actionType: 'chat' | 'embedding';
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalCost?: number;
  sessionId?: string | null;
  pdfId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Vercel AI Gateway에서 현재 total_used 값을 조회
 *
 * @returns total_used (누적 사용 금액), 실패 시 null
 */
export async function fetchGatewayTotalUsed(): Promise<number | null> {
  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) return null;

    const response = await fetch('https://ai-gateway.vercel.sh/v1/credits', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.total_used != null ? Number(data.total_used) : null;
  } catch {
    return null;
  }
}

/**
 * credit_usage_logs 테이블에 사용량 기록
 *
 * - Admin Client(service_role)로 RLS 우회하여 INSERT
 * - INSERT 후 DB 트리거(on_credit_usage_log_insert)가 profiles.total_credits_used를 자동 누적
 * - non-blocking: 실패 시 console.error만 출력하고 throw하지 않음
 * - total_tokens는 DB에서 GENERATED ALWAYS AS로 자동 계산되므로 INSERT하지 않음
 *
 * @param params - 크레딧 사용량 정보
 */
export async function logCreditUsage(params: CreditUsageParams): Promise<void> {
  try {
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase.from('credit_usage_logs').insert({
      user_id: params.userId,
      action_type: params.actionType,
      model_name: params.modelName,
      prompt_tokens: params.promptTokens,
      completion_tokens: params.completionTokens,
      total_cost: params.totalCost ?? 0,
      session_id: params.sessionId ?? null,
      pdf_id: params.pdfId ?? null,
      metadata: params.metadata ?? {},
    });

    if (error) {
      console.error('[logCreditUsage] 크레딧 사용량 기록 실패:', error);
    }
  } catch (error) {
    // 절대 throw하지 않음 (non-blocking)
    console.error('[logCreditUsage] 크레딧 사용량 기록 중 오류:', error);
  }
}
