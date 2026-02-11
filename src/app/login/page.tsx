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
      {/* 배경 라디얼 그라데이션 (우측 상단) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 85% 10%, rgba(22, 67, 156, 0.06), transparent 70%),
            radial-gradient(ellipse 40% 30% at 10% 90%, rgba(91, 122, 157, 0.04), transparent)
          `,
        }}
      />

      <div
        className="relative w-full max-w-[480px] rounded-[2rem] p-10 text-center"
        style={{
          background: 'var(--color-paper)',
          boxShadow: 'var(--shadow-login)',
          border: '1px solid var(--color-border-light)',
        }}
      >
        {/* 앱 아이콘 — Stitch: 네이비 둥근 사각형 + auto_awesome */}
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: 'var(--color-primary)',
            boxShadow: '0 8px 24px rgba(22, 67, 156, 0.2)',
          }}
        >
          <span className="material-symbols-outlined text-white" style={{ fontSize: '32px' }}>
            auto_awesome
          </span>
        </div>

        <h1
          className="mb-3 text-[1.875rem] font-bold tracking-tight"
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

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          className="focus-ring btn-lift flex w-full items-center justify-center gap-3 rounded-xl border px-6 py-4 font-medium transition-all"
          style={{
            background: 'var(--color-paper)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          {/* Google G 로고 */}
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google로 로그인
        </button>

        {/* Footer 법적 문서 링크 */}
        <div
          className="mt-8 flex justify-center gap-4 text-sm"
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
