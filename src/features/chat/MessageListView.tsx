import { Message } from '@/shared/stores/chatStore';
import { useRef, useEffect, useState } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';

interface MessageListViewProps {
  messages: Message[];
  isLoading?: boolean;
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

export function MessageListView({ messages, isLoading }: MessageListViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div
      className="relative flex flex-1 flex-col overflow-y-auto"
      style={{ background: 'transparent' }}
    >
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <MessageBubble key={message.id} message={message} index={index} />
            ))}
            {isLoading && <LoadingIndicator />}
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
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
            background: 'linear-gradient(135deg, var(--color-accent-glow) 0%, transparent 100%)',
            border: '1px solid var(--color-ai-border)'
          }}
        >
          <svg
            className="h-10 w-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1}
            style={{ color: 'var(--color-accent)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
        </div>

        <h2
          className="mb-3 text-2xl"
          style={{ color: 'var(--color-ink)' }}
        >
          문서에 대해 질문해보세요
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-ink-muted)' }}
        >
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
            border: isUser ? 'none' : '1px solid var(--color-ai-border)'
          }}
        >
          {/* AI 메시지 좌측 악센트 바 */}
          {!isUser && !isError && (
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{
                background: 'linear-gradient(to bottom, var(--color-accent), var(--color-accent-soft))'
              }}
            />
          )}

          {/* 에러 헤더 */}
          {isError && (
            <div className="mb-2 flex items-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
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
      className="mt-2 rounded-2xl overflow-hidden"
      style={{
        background: 'var(--color-cream-dark)',
        border: '1px solid var(--color-ai-border)'
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
        style={{
          cursor: 'pointer',
          transition: 'var(--transition-fast)'
        }}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          style={{ color: 'var(--color-accent)' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
        <span
          className="text-xs font-medium tracking-wide"
          style={{ color: 'var(--color-ink)' }}
        >
          참고 출처
        </span>
        <span
          className="ml-1 flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-semibold"
          style={{
            background: 'var(--color-accent-glow)',
            color: 'var(--color-accent)'
          }}
        >
          {sources.length}
        </span>
        <svg
          className="ml-auto h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          style={{
            color: 'var(--color-ink-muted)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'var(--transition-base)'
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
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
              className="rounded-xl p-3"
              style={{ background: 'var(--color-paper)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-semibold"
                  style={{
                    background: 'var(--color-accent-glow)',
                    color: 'var(--color-accent)'
                  }}
                >
                  {source.pageNumber}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-ink)' }}
                >
                  {source.fileName}
                </span>
                {source.score !== undefined && (
                  <span
                    className="ml-auto text-[10px]"
                    style={{ color: 'var(--color-ink-muted)' }}
                  >
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
          border: '1px solid var(--color-ai-border)',
          boxShadow: 'var(--shadow-float)'
        }}
      >
        {/* 골드 악센트 바 */}
        <div
          className="h-8 w-1 rounded-full"
          style={{
            background: 'linear-gradient(to bottom, var(--color-accent), var(--color-accent-soft))'
          }}
        />
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full animate-pulse-subtle"
                style={{
                  background: 'var(--color-accent)',
                  animationDelay: `${i * 200}ms`
                }}
              />
            ))}
          </div>
          <span
            className="text-sm"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            답변을 생성하고 있습니다
          </span>
        </div>
      </div>
    </div>
  );
}
