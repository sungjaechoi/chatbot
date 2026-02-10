'use client';

import Link from 'next/link';
import { createClient } from '@/shared/lib/supabase/client';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center p-6"
      style={{ background: 'var(--color-cream)' }}
    >
      {/* 배경 그라디언트 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91, 122, 157, 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 100% 100%, rgba(91, 122, 157, 0.05), transparent)
          `,
        }}
      />

      <div
        className="relative w-full max-w-md rounded-3xl p-10 text-center"
        style={{
          background: 'var(--color-paper)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-ai-border)',
        }}
      >
        {/* 로고 */}
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background:
              'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-soft) 100%)',
            boxShadow: '0 8px 24px var(--color-accent-glow)',
          }}
        >
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>

        <h1
          className="mb-3 text-3xl tracking-tight"
          style={{ color: 'var(--color-ink)' }}
        >
          Document Chat
        </h1>
        <p
          className="mb-8 text-sm"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          PDF 문서와 AI 대화를 시작하세요
        </p>

        {/* Google 로그인 버튼 - 공식 브랜드 가이드라인 준수 */}
        <button
          onClick={handleGoogleLogin}
          className="focus-ring btn-lift flex w-full items-center justify-center gap-3 rounded-2xl border px-6 py-4 font-medium transition-all"
          style={{
            background: 'var(--color-paper)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-ai-border)',
          }}
        >
          {/* Google G 로고 - 공식 색상 */}
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 로그인
        </button>

        {/* Footer 법적 문서 링크 */}
        <div
          className="mt-8 flex justify-center gap-4 text-xs"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <Link href="/privacy" className="transition-colors hover:underline">
            개인정보처리방침
          </Link>
          <span>|</span>
          <Link href="/terms" className="transition-colors hover:underline">
            이용약관
          </Link>
        </div>
      </div>
    </div>
  );
}
