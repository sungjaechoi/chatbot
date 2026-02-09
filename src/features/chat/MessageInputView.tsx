import { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface MessageInputViewProps {
  isLoading: boolean;
  isLoadingHistory: boolean;
  historyError?: string | null;
  onSend: (message: string) => void;
}

export function MessageInputView({ isLoading, isLoadingHistory, historyError, onSend }: MessageInputViewProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // historyError가 있을 때는 isLoadingHistory를 무시하여 입력 활성화
  const isDisabled = isLoading || (isLoadingHistory && !historyError);

  // 텍스트 영역 자동 높이 조절
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !isDisabled) {
      onSend(trimmedInput);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="relative z-10 border-t"
      style={{
        borderColor: 'var(--color-ai-border)',
        background: 'var(--color-cream)'
      }}
    >
      {/* 그라데이션 오버레이 (스크롤 페이드 효과) */}
      <div
        className="pointer-events-none absolute -top-20 left-0 right-0 h-20"
        style={{
          background: 'linear-gradient(to top, var(--color-cream), transparent)'
        }}
      />

      <div className="mx-auto max-w-4xl px-6 py-5">
        <div
          className="relative flex items-end gap-3 rounded-2xl p-2 transition-shadow duration-200"
          style={{
            background: 'var(--color-paper)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-ai-border)'
          }}
        >
          {/* 텍스트 입력 영역 */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoadingHistory ? "이전 대화를 불러오는 중..." : "문서에 대해 질문해보세요..."}
            disabled={isDisabled}
            rows={1}
            className="flex-1 resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed placeholder:opacity-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              color: 'var(--color-ink)',
              minHeight: '48px',
              maxHeight: '200px'
            }}
          />

          {/* 전송 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isDisabled}
            className="focus-ring btn-lift flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: input.trim() && !isDisabled
                ? 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-soft) 100%)'
                : 'var(--color-cream-dark)',
              boxShadow: input.trim() && !isDisabled
                ? '0 4px 12px var(--color-accent-glow)'
                : 'none'
            }}
            aria-label="전송"
          >
            {isDisabled ? (
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke={input.trim() ? 'white' : 'var(--color-ink-muted)'}
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            )}
          </button>
        </div>

        {/* 힌트 텍스트 */}
        <p
          className="mt-3 text-center text-xs"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              background: 'var(--color-cream-dark)',
              border: '1px solid var(--color-ai-border)'
            }}
          >
            Enter
          </kbd>
          {' '}전송 · {' '}
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              background: 'var(--color-cream-dark)',
              border: '1px solid var(--color-ai-border)'
            }}
          >
            Shift + Enter
          </kbd>
          {' '}줄바꿈
        </p>
      </div>
    </div>
  );
}
