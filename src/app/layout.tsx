import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeInitializer } from "@/shared/components/ThemeInitializer";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 900",
  preload: true,
});

export const metadata: Metadata = {
  title: "Document Chat",
  description: "PDF 문서와 AI 대화를 시작하세요",
  verification: {
    google: "e-kf0osr0ssGYaylRzPOcIu4hXUKj31hZ-9mSOs_3lk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Google Material Icons & Symbols */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1&display=swap" rel="stylesheet" />
        {/* FOUC(Flash of Unstyled Content) 방지: 페이지 로드 즉시 테마 적용 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme-storage');
                  var theme = 'system';
                  var resolved = null;

                  if (stored) {
                    var parsed = JSON.parse(stored);
                    theme = parsed?.state?.theme || 'system';
                    resolved = parsed?.state?.resolvedTheme;
                  }

                  var finalTheme;
                  if (theme === 'light') {
                    finalTheme = 'light';
                  } else if (theme === 'dark') {
                    finalTheme = 'dark';
                  } else {
                    // system 모드이거나 theme이 없는 경우
                    // resolvedTheme이 있으면 사용, 없으면 시스템 설정 확인
                    if (resolved === 'dark' || resolved === 'light') {
                      finalTheme = resolved;
                    } else {
                      finalTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                  }

                  document.documentElement.setAttribute('data-theme', finalTheme);
                } catch (e) {
                  // 에러 시 시스템 설정 따름
                  var fallback = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.setAttribute('data-theme', fallback);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${pretendard.variable} font-sans antialiased`}
      >
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
