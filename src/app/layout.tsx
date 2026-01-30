import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 900",
  preload: true,
});

export const metadata: Metadata = {
  title: "Chatbot",
  description: "AI Chatbot Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${pretendard.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
