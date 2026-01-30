import { Message } from '@/shared/stores/chatStore';
import { useRef, useEffect } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';

interface MessageListViewProps {
  messages: Message[];
}

// 마크다운 렌더링 컴포넌트 (타입 안전성 확보)
const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="text-sm mb-2 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-2 text-sm">
      {children}
    </ol>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-2 text-sm">
      {children}
    </ul>
  ),
  li: ({ children }) => (
    <li className="text-sm">{children}</li>
  ),
};

export function MessageListView({ messages }: MessageListViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 자동 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="mt-4 text-gray-500">메시지를 입력하여 대화를 시작하세요</p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.isError
                  ? 'bg-red-100 border border-red-300 text-red-800'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {message.isError && (
                <div className="flex items-center gap-1 mb-1">
                  <svg
                    className="h-4 w-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs font-semibold text-red-700">시스템 오류</span>
                </div>
              )}
              {message.role === 'assistant' && !message.isError ? (
                <ReactMarkdown
                  skipHtml={true}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm">
                  {message.content}
                </p>
              )}
              <p
                className={`mt-1 text-xs ${
                  message.role === 'user'
                    ? 'text-blue-100'
                    : message.isError
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {message.role === 'assistant' && !message.isError && message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    참고 출처
                  </p>
                  <div className="space-y-2">
                    {message.sources.map((source, idx) => (
                      <div key={idx} className="ml-2 text-xs text-gray-600">
                        <p className="font-medium">
                          페이지 {source.pageNumber} - {source.fileName}
                          {source.score !== undefined && (
                            <span className="ml-1 text-gray-500">
                              (관련도: {(source.score * 100).toFixed(0)}%)
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-gray-500 italic">
                          {'"'}{source.snippet.slice(0, 150)}{source.snippet.length > 150 ? '...' : ''}{'"'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
      {/* 자동 스크롤을 위한 빈 div */}
      <div ref={messagesEndRef} />
    </div>
  );
}
