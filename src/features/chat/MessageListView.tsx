import { Message } from '@/shared/stores/chatStore';
import { useRef, useEffect, useState } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';

interface MessageListViewProps {
  messages: Message[];
  isLoading?: boolean;
  error?: string | null;
}

// 마크다운 렌더링 컴포넌트
const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: 'var(--color-ink)' }}>{children}</strong>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-2 pl-5">{children}</ol>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-2 pl-5">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  code: ({ children }) => (
    <code
      className="rounded-md px-1.5 py-0.5 text-sm"
      style={{
        background: 'var(--color-cream-dark)',
        color: 'var(--color-ink)'
      }}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre
      className="my-4 overflow-x-auto rounded-xl p-4 text-sm"
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-cream)'
      }}
    >
      {children}
    </pre>
  ),
};

export function MessageListView({ messages, isLoading, error }: MessageListViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef<number>(0);

  useEffect(() => {
    if (messages.length > 0) {
      const diff = messages.length - prevMessagesLength.current;
      const behavior = diff >= 3 ? 'instant' : 'smooth';
      messagesEndRef.current?.scrollIntoView({ behavior: behavior as ScrollBehavior });
      prevMessagesLength.current = messages.length;
    }
  }, [messages]);

  return (
    <div
      className="relative flex flex-1 flex-col overflow-y-auto"
      style={{ background: 'transparent' }}
    >
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        {messages.length > 0 ? (
          <>
            {error && <ErrorBanner error={error} />}
            <div className="space-y-6">
              {messages.map((message, index) => (
                <MessageBubble key={message.id} message={message} index={index} />
              ))}
              {isLoading && <LoadingIndicator />}
            </div>
          </>
        ) : isLoading ? (
          <SessionLoadingState />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <EmptyState />
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}

function ErrorBanner({ error }: { error: string }) {
  return (
    <div
      className="mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
      style={{
        background: 'var(--color-error-bg)',
        color: 'var(--color-error)',
        border: '1px solid rgba(185, 28, 28, 0.2)',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
      <span>{error}</span>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <div className="max-w-md text-center">
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, var(--color-error-bg) 0%, transparent 100%)',
            border: '1px solid var(--color-border-light)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--color-error)' }}>
            error
          </span>
        </div>
        <h2 className="mb-3 text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
          오류가 발생했습니다
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
          {error}
        </p>
      </div>
    </div>
  );
}

function SessionLoadingState() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <div className="max-w-md text-center">
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(22, 67, 156, 0.05) 0%, transparent 100%)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          <svg
            className="h-8 w-8 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            style={{ color: 'var(--color-primary)' }}
          >
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
          대화를 불러오는 중
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
          이전 대화 내용을 가져오고 있습니다
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <div className="max-w-md text-center">
        {/* 데코레이티브 아이콘 */}
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(22, 67, 156, 0.05) 0%, transparent 100%)',
            border: '1px solid var(--color-border-light)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--color-primary)', opacity: 0.6 }}>
            chat_bubble
          </span>
        </div>

        <h2 className="mb-3 text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
          문서에 대해 질문해보세요
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
          업로드한 PDF 문서의 내용을 기반으로 답변을 드립니다.
          <br />
          궁금한 내용을 자유롭게 질문해주세요.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div
      className="animate-float-in"
      style={{
        animationDelay: `${index * 50}ms`,
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start'
      }}
    >
      <div
        className="relative max-w-[85%] lg:max-w-[75%]"
        style={{
          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px'
        }}
      >
        {/* 메시지 카드 */}
        <div
          className="relative overflow-hidden px-5 py-4"
          style={{
            borderRadius: 'inherit',
            background: isError
              ? 'var(--color-error-bg)'
              : isUser
                ? 'var(--color-user-bg)'
                : 'var(--color-paper)',
            color: isError
              ? 'var(--color-error)'
              : isUser
                ? 'var(--color-user-text)'
                : 'var(--color-ink)',
            boxShadow: isUser
              ? 'var(--shadow-md)'
              : 'var(--shadow-float)',
            border: isUser ? 'none' : '1px solid var(--color-border-light)'
          }}
        >
          {/* AI 메시지 좌측 악센트 바 — Stitch primary 색상 */}
          {!isUser && !isError && (
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{
                background: 'linear-gradient(to bottom, var(--color-primary), var(--color-accent))'
              }}
            />
          )}

          {/* 에러 헤더 */}
          {isError && (
            <div className="mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
              <span className="text-xs font-medium">오류가 발생했습니다</span>
            </div>
          )}

          {/* 메시지 내용 */}
          <div className={`text-[15px] leading-relaxed ${!isUser && !isError ? 'pl-3' : ''}`}>
            {message.role === 'assistant' && !isError ? (
              <ReactMarkdown skipHtml components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>

          {/* 타임스탬프 및 토큰/비용 정보 */}
          <div
            className="mt-2 text-[11px] tracking-wide"
            style={{
              color: isUser
                ? 'rgba(250, 249, 247, 0.6)'
                : 'var(--color-ink-muted)',
              paddingLeft: !isUser && !isError ? '12px' : '0'
            }}
          >
            <span>
              {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {!isUser && !isError && message.usage && (
              <span>
                {' | '}
                토큰: {message.usage.prompt_tokens + message.usage.completion_tokens}
                {message.usage.total_cost > 0 && (
                  <>
                    {' | '}
                    ${message.usage.total_cost.toFixed(4)}
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* 출처 섹션 */}
        {message.role === 'assistant' && !isError && message.sources && message.sources.length > 0 && (
          <SourcesSection sources={message.sources} />
        )}
      </div>
    </div>
  );
}

function SourcesSection({ sources }: { sources: Message['sources'] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources) return null;

  return (
    <div
      className="mt-2 rounded-xl overflow-hidden"
      style={{
        background: 'var(--color-cream-dark)',
        border: '1px solid var(--color-border-light)'
      }}
    >
      {/* 아코디언 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
        className="focus-ring w-full px-5 py-4 flex items-center gap-2 hover:bg-opacity-80 transition-colors"
        style={{ cursor: 'pointer', transition: 'var(--transition-fast)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>
          description
        </span>
        <span className="text-xs font-medium tracking-wide" style={{ color: 'var(--color-ink)' }}>
          참고 출처
        </span>
        <span
          className="ml-1 flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-semibold"
          style={{
            background: 'rgba(22, 67, 156, 0.1)',
            color: 'var(--color-primary)'
          }}
        >
          {sources.length}
        </span>
        <span
          className="material-symbols-outlined ml-auto"
          style={{
            fontSize: '16px',
            color: 'var(--color-ink-muted)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'var(--transition-base)',
          }}
        >
          expand_more
        </span>
      </button>

      {/* 아코디언 콘텐츠 */}
      <div
        style={{
          maxHeight: isExpanded ? '1000px' : '0',
          opacity: isExpanded ? '1' : '0',
          overflow: 'hidden',
          transition: 'max-height var(--transition-base), opacity var(--transition-base)'
        }}
      >
        <div className="px-5 pb-4 space-y-3">
          {sources.map((source, idx) => (
            <div
              key={idx}
              className="rounded-lg p-3"
              style={{ background: 'var(--color-paper)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-semibold"
                  style={{
                    background: 'rgba(22, 67, 156, 0.1)',
                    color: 'var(--color-primary)'
                  }}
                >
                  {source.pageNumber}
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--color-ink)' }}>
                  {source.fileName}
                </span>
                {source.score !== undefined && (
                  <span className="ml-auto text-[10px]" style={{ color: 'var(--color-ink-muted)' }}>
                    {(source.score * 100).toFixed(0)}% 관련
                  </span>
                )}
              </div>
              <p
                className="mt-2 line-clamp-2 text-xs italic leading-relaxed"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                &ldquo;{source.snippet.slice(0, 150)}{source.snippet.length > 150 ? '...' : ''}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-3 rounded-2xl px-5 py-4"
        style={{
          background: 'var(--color-paper)',
          border: '1px solid var(--color-border-light)',
          boxShadow: 'var(--shadow-float)'
        }}
      >
        {/* 네이비 악센트 바 */}
        <div
          className="h-8 w-1 rounded-full"
          style={{
            background: 'linear-gradient(to bottom, var(--color-primary), var(--color-accent))'
          }}
        />
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full animate-pulse-subtle"
                style={{
                  background: 'var(--color-primary)',
                  animationDelay: `${i * 200}ms`
                }}
              />
            ))}
          </div>
          <span className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            답변을 생성하고 있습니다
          </span>
        </div>
      </div>
    </div>
  );
}
