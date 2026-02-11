import { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface MessageInputViewProps {
  isLoading: boolean;
  error?: string | null;
  onSend: (message: string) => void;
}

export function MessageInputView({ isLoading, onSend }: MessageInputViewProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDisabled = isLoading;

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
        borderColor: 'var(--color-border-light)',
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
          className="relative flex items-end gap-3 rounded-xl p-2 transition-shadow duration-200"
          style={{
            background: 'var(--color-paper)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-border-light)'
          }}
        >
          {/* 텍스트 입력 영역 */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading
                ? "답변을 생성하는 중..."
                : "문서에 대해 질문해보세요..."
            }
            disabled={isDisabled}
            rows={1}
            className="flex-1 resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed placeholder:opacity-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              color: 'var(--color-ink)',
              minHeight: '48px',
              maxHeight: '200px'
            }}
          />

          {/* 전송 버튼 — Stitch: 네이비 원형 */}
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isDisabled}
            className="focus-ring btn-lift flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: input.trim() && !isDisabled
                ? 'var(--color-primary)'
                : 'var(--color-cream-dark)',
              boxShadow: input.trim() && !isDisabled
                ? '0 4px 12px rgba(22, 67, 156, 0.2)'
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
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '20px',
                  color: input.trim() ? 'white' : 'var(--color-ink-muted)',
                }}
              >
                send
              </span>
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
              border: '1px solid var(--color-border-light)'
            }}
          >
            Enter
          </kbd>
          {' '}전송 · {' '}
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              background: 'var(--color-cream-dark)',
              border: '1px solid var(--color-border-light)'
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
