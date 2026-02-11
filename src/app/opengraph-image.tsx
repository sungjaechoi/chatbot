import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "Document Chat - PDF 문서와 AI 대화를 시작하세요";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const fontData = await fetch(
    new URL("../../public/fonts/PretendardVariable.woff2", import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a366e",
          fontFamily: "Pretendard",
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "60px",
          }}
        >
          {/* Stars SVG */}
          <svg
            width="220"
            height="220"
            viewBox="0 0 220 220"
            fill="none"
          >
            {/* Large star */}
            <path
              d="M80 20 L95 65 L140 80 L95 95 L80 140 L65 95 L20 80 L65 65 Z"
              fill="white"
            />
            {/* Medium star - top right */}
            <path
              d="M160 40 L167 62 L190 70 L167 78 L160 100 L153 78 L130 70 L153 62 Z"
              fill="white"
            />
            {/* Small star - bottom right */}
            <path
              d="M170 120 L175 136 L192 142 L175 148 L170 164 L165 148 L148 142 L165 136 Z"
              fill="white"
            />
          </svg>

          {/* Text area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                fontSize: "56px",
                fontWeight: 700,
                color: "white",
                letterSpacing: "-0.02em",
              }}
            >
              Document Chat
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 400,
                color: "#b4c8f0",
              }}
            >
              PDF 문서와 AI 대화를 시작하세요
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Pretendard",
          data: fontData,
          style: "normal",
        },
      ],
    }
  );
}
