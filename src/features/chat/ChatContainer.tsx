'use client';

import { useChatStore } from '@/shared/stores/chatStore';
import { usePdfStore } from '@/shared/stores/pdfStore';
import { ChatView } from './ChatView';

interface ChatContainerProps {
  onNewPdf: () => void;
  onBack?: () => void;
}

export function ChatContainer({ onNewPdf, onBack }: ChatContainerProps) {
  const { messages, isLoading, addMessage, setIsLoading, setError } = useChatStore();
  const { pdfId, pdfFileName } = usePdfStore();

  const handleSendMessage = async (content: string) => {
    if (!pdfId || isLoading) return;

    try {
      // 사용자 메시지 추가
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content,
        timestamp: new Date(),
      };
      addMessage(userMessage);

      setIsLoading(true);
      setError(null);

      // API 호출
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfId,
          message: content,
        }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || '메시지 전송에 실패했습니다.');
        } catch {
          throw new Error('메시지 전송에 실패했습니다.');
        }
      }

      const data = await response.json();

      // AI 응답 추가 (sources 포함)
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: data.answer,
        timestamp: new Date(),
        sources: data.sources,
      };
      addMessage(assistantMessage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);

      // 에러 메시지도 채팅에 표시 (isError 플래그 추가)
      const errorMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant' as const,
        content: `오류: ${errorMessage}`,
        timestamp: new Date(),
        isError: true,
      };
      addMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatView
      messages={messages}
      isLoading={isLoading}
      pdfFileName={pdfFileName}
      onSendMessage={handleSendMessage}
      onNewPdf={onNewPdf}
      onBack={onBack}
    />
  );
}
