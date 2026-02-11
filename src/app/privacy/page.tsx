import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 - Document Chat",
  description: "Document Chat 서비스의 개인정보처리방침",
};

export default function PrivacyPolicyPage() {
  return (
    <div
      className="min-h-screen px-6 py-16"
      style={{ background: "var(--color-cream)" }}
    >
      <article
        className="mx-auto max-w-2xl rounded-3xl p-10"
        style={{
          background: "var(--color-paper)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-ai-border)",
        }}
      >
        <h1
          className="mb-2 text-3xl tracking-tight"
          style={{ color: "var(--color-ink)" }}
        >
          개인정보처리방침
        </h1>
        <p
          className="mb-10 text-sm"
          style={{ color: "var(--color-ink-muted)" }}
        >
          시행일: 2026년 2월 10일 | 최종 수정일: 2026년 2월 10일
        </p>

        <div
          className="space-y-8 text-sm leading-relaxed"
          style={{ color: "var(--color-ink-light)" }}
        >
          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: "var(--color-ink)" }}
            >
              1. 수집하는 개인정보
            </h2>
            <p>
              Document Chat(이하 &quot;서비스&quot;)은 Google OAuth를 통해 다음
              정보를 수집합니다:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>이름 (Google 계정 표시 이름)</li>
              <li>이메일 주소</li>
              <li>프로필 사진 URL</li>
              <li>Google 계정 고유 식별자 (UID)</li>
            </ul>
            <p className="mt-2">
              서비스 이용 과정에서 다음 정보가 추가로 생성 및 저장됩니다:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>업로드한 PDF 문서 파일 및 메타데이터</li>
              <li>AI 채팅 대화 내역 (질문 및 응답)</li>
              <li>서비스 이용 기록 (크레딧 사용 내역)</li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: "var(--color-ink)" }}
            >
              2. 개인정보 수집 및 이용 목적
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>계정 생성 및 인증:</strong> Google OAuth를 통한 간편
                로그인 및 사용자 식별
              </li>
              <li>
                <strong>서비스 제공:</strong> PDF 문서 업로드, AI 기반 문서 질의
                응답 기능 제공
              </li>
              <li>
                <strong>사용자 프로필 표시:</strong> 앱 내에서 사용자 이름 및
                프로필 사진 표시
              </li>
              <li>
                <strong>서비스 개선:</strong> 이용 패턴 분석을 통한 서비스 품질
                향상
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: "var(--color-ink)" }}
            >
              3. 데이터 저장 및 보관
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>저장 위치:</strong> Supabase 클라우드 인프라 (AWS 기반)
              </li>
              <li>
                <strong>암호화:</strong> 전송 중(TLS/SSL) 및 저장 시(AES-256)
                암호화 적용
              </li>
              <li>
                <strong>보관 기간:</strong> 회원 탈퇴 요청 시까지 보관하며, 탈퇴
                요청 후 30일 이내 완전 삭제
              </li>
              <li>
                <strong>PDF 파일:</strong> Supabase Storage에 암호화 저장되며,
                해당 사용자만 접근 가능
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: "var(--color-ink)" }}
            >
              4. 데이터 공유 및 제3자 제공
            </h2>
            <p>
              서비스는 사용자의 개인정보를 제3자에게 판매하거나 광고 목적으로
              사용하지 않습니다. 다만, 다음의 경우에 한해 데이터가 제3자에게
              전달될 수 있습니다:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>AI 응답 생성:</strong> 사용자의 질문과 관련 문서 내용이
                AI 모델 제공업체(Anthropic 등)에 전송됩니다. 이 데이터는 응답
                생성에만 사용되며 학습에 활용되지 않습니다.
              </li>
              <li>
                <strong>인프라 제공업체:</strong> Supabase(데이터 저장),
                Vercel(호스팅) 등 서비스 운영에 필수적인 인프라 제공업체
              </li>
              <li>
                <strong>법적 요구:</strong> 법률에 의해 요구되는 경우
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: "var(--color-ink)" }}
            >
              5. Google API 데이터 관련 정책
            </h2>
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--color-ai-bg)",
                border: "1px solid var(--color-ai-border)",
              }}
            >
              <p>
                본 서비스의 Google API를 통해 수신한 사용자 데이터의 사용 및
                다른 앱으로의 전송은{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "var(--color-accent)" }}
                >
                  Google API Services User Data Policy
                </a>
                를 준수하며, Limited Use 요구사항을 포함합니다.
              </p>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                Google 데이터는 서비스의 핵심 기능(로그인 인증, 프로필 표시)
                제공에만 사용됩니다.
              </li>
              <li>
                사용자 동의 없이 Google 데이터를 제3자에게 전달하지 않습니다.
              </li>
              <li>Google 사용자 데이터를 판매하지 않습니다.</li>
              <li>Google 데이터를 광고 타겟팅 목적으로 사용하지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: "var(--color-ink)" }}
            >
              6. 사용자 권리
            </h2>
            <p>사용자는 다음 권리를 행사할 수 있습니다:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>정보 열람:</strong> 수집된 개인정보의 열람을 요청할 수
                있습니다.
              </li>
              <li>
                <strong>정보 수정:</strong> 부정확한 개인정보의 정정을 요청할 수
                있습니다.
              </li>
              <li>
                <strong>계정 삭제:</strong> 계정 삭제 및 모든 관련
                데이터(업로드한 PDF, 대화 기록 등)의 완전 삭제를 요청할 수
                있습니다.
              </li>
              <li>
                <strong>데이터 이동:</strong> 저장된 데이터의 사본을 요청할 수
                있습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: "var(--color-ink)" }}
            >
              7. 연락처
            </h2>
            <p>
              개인정보 관련 문의, 열람/수정/삭제 요청은 아래 연락처로 문의해
              주세요:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                이메일:{" "}
                <span
                  className="font-medium"
                  style={{ color: "var(--color-accent)" }}
                >
                  sungjaechoi@gmail.com
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: "var(--color-ink)" }}
            >
              8. 개인정보처리방침 변경
            </h2>
            <p>
              본 개인정보처리방침이 변경되는 경우, 변경 사항을 서비스 내 공지
              또는 이메일을 통해 사전 고지합니다. 변경된 방침은 공지된
              시행일부터 효력이 발생합니다.
            </p>
          </section>
        </div>

        <div className="mt-10 flex gap-4 text-sm">
          <Link
            href="/terms"
            className="underline"
            style={{ color: "var(--color-accent)" }}
          >
            서비스 이용약관
          </Link>
          <Link
            href="/login"
            className="underline"
            style={{ color: "var(--color-accent)" }}
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </article>
    </div>
  );
}
