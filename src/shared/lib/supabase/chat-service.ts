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

/**
 * 세션 조회 또는 생성
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
 * 채팅 메시지 조회 (pdfId 기준)
 */
export async function getMessages(userId: string, pdfId: string): Promise<ChatMessageRow[]> {
  const supabase = createAdminClient();

  // 먼저 세션 찾기
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
