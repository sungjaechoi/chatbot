import { createAdminClient } from './admin';
import type { ChatSource, UsageInfo } from '@/shared/types';

export interface ChatMessageRow {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: ChatSource[] | null;
  usage: UsageInfo | null;
  is_error: boolean;
  created_at: string;
}

export interface ChatSessionRow {
  id: string;
  user_id: string;
  pdf_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

/**
 * PDF별 세션 목록 조회 (last_message_at 기준 내림차순, fallback: created_at)
 *
 * Try-Catch Fallback 패턴:
 * - 1차 시도: title, last_message_at 포함 조회 (마이그레이션 적용 후)
 * - 2차 시도: 기본 컬럼만 조회, title/last_message_at은 기본값으로 보충 (마이그레이션 전)
 */
export async function getSessionsByPdfId(userId: string, pdfId: string): Promise<ChatSessionRow[]> {
  const supabase = createAdminClient();

  try {
    // 1차 시도: title, last_message_at 포함
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id, user_id, pdf_id, title, created_at, updated_at, last_message_at')
      .eq('user_id', userId)
      .eq('pdf_id', pdfId)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ChatSessionRow[];
  } catch {
    // Fallback: title, last_message_at 없이 조회
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id, user_id, pdf_id, created_at, updated_at')
      .eq('user_id', userId)
      .eq('pdf_id', pdfId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`세션 목록 조회 실패: ${error.message}`);
    return (data || []).map(row => ({
      ...row,
      title: null,
      last_message_at: row.created_at,
    })) as ChatSessionRow[];
  }
}

/**
 * 새 세션 생성
 *
 * Try-Catch Fallback 패턴:
 * - 1차 시도: title 포함 insert (마이그레이션 적용 후)
 * - 2차 시도: 기본 필드만 insert, title/last_message_at은 기본값으로 보충 (마이그레이션 전)
 */
export async function createSession(userId: string, pdfId: string, title?: string): Promise<ChatSessionRow> {
  const supabase = createAdminClient();

  try {
    // 1차 시도: title 포함 insert
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        pdf_id: pdfId,
        title: title || null,
      })
      .select('id, user_id, pdf_id, title, created_at, updated_at, last_message_at')
      .single();

    if (error) throw error;
    return data as ChatSessionRow;
  } catch {
    // Fallback: title 없이 insert
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        pdf_id: pdfId,
      })
      .select('id, user_id, pdf_id, created_at, updated_at')
      .single();

    if (error) throw new Error(`세션 생성 실패: ${error.message}`);
    return {
      ...data,
      title: null,
      last_message_at: data.created_at,
    } as ChatSessionRow;
  }
}

/**
 * 세션 제목 업데이트
 *
 * 방어적 구현: title 컬럼이 없는 경우 silent fail (마이그레이션 전 상태 호환)
 * - 에러 메시지에 'column' 키워드가 포함된 경우만 silent fail
 * - 다른 에러는 throw
 */
export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      // 'column' 키워드 포함 시 silent fail (컬럼 미존재 에러)
      if (error.message.toLowerCase().includes('column')) {
        return;
      }
      throw new Error(`세션 제목 업데이트 실패: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('column')) {
      // 컬럼이 없는 경우 무시 (silent fail)
      return;
    }
    throw error;
  }
}

/**
 * 세션 삭제 (CASCADE로 메시지도 함께 삭제됨)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw new Error(`세션 삭제 실패: ${error.message}`);
}

/**
 * 세션별 메시지 조회
 */
export async function getMessagesBySessionId(sessionId: string): Promise<ChatMessageRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, sources, usage, is_error, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`메시지 조회 실패: ${error.message}`);
  return (data || []) as ChatMessageRow[];
}

/**
 * 세션 소유자 검증
 */
export async function verifySessionOwner(sessionId: string, userId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('chat_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .single();

  return data?.user_id === userId;
}

/**
 * last_message_at 업데이트
 *
 * 방어적 구현: last_message_at 컬럼이 없는 경우 silent fail (마이그레이션 전 상태 호환)
 * - 에러 메시지에 'column' 키워드가 포함된 경우만 silent fail
 * - 다른 에러는 throw
 */
export async function updateSessionLastMessageAt(sessionId: string): Promise<void> {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      // 'column' 키워드 포함 시 silent fail (컬럼 미존재 에러)
      if (error.message.toLowerCase().includes('column')) {
        return;
      }
      throw new Error(`세션 last_message_at 업데이트 실패: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('column')) {
      // 컬럼이 없는 경우 무시 (silent fail)
      return;
    }
    throw error;
  }
}

// ============================================================================
// 하위 호환성을 위한 기존 함수들 (deprecated)
// ============================================================================

/**
 * @deprecated 다중 세션 지원으로 인해 더 이상 사용되지 않습니다. getSessionsByPdfId를 사용하세요.
 */
export async function getOrCreateSession(userId: string, pdfId: string): Promise<string> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('pdf_id', pdfId)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: userId, pdf_id: pdfId })
    .select('id')
    .single();

  if (error) throw new Error(`세션 생성 실패: ${error.message}`);
  return created!.id;
}

/**
 * @deprecated getMessagesBySessionId를 사용하세요.
 */
export async function getMessages(userId: string, pdfId: string): Promise<ChatMessageRow[]> {
  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('pdf_id', pdfId)
    .single();

  if (!session) return [];

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, sources, usage, is_error, created_at')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`메시지 조회 실패: ${error.message}`);
  return (data || []) as ChatMessageRow[];
}

/**
 * @deprecated deleteSession을 사용하세요.
 */
export async function deleteMessages(userId: string, pdfId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('pdf_id', pdfId)
    .single();

  if (!session) return;

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('session_id', session.id);

  if (error) throw new Error(`메시지 삭제 실패: ${error.message}`);
}
