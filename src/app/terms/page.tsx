import Link from 'next/link';

export const metadata = {
  title: '서비스 이용약관 - Document Chat',
  description: 'Document Chat 서비스의 이용약관',
};

export default function TermsOfServicePage() {
  return (
    <div
      className="min-h-screen px-6 py-16"
      style={{ background: 'var(--color-cream)' }}
    >
      <article
        className="mx-auto max-w-2xl rounded-3xl p-10"
        style={{
          background: 'var(--color-paper)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-ai-border)',
        }}
      >
        <h1
          className="mb-2 text-3xl tracking-tight"
          style={{ color: 'var(--color-ink)' }}
        >
          서비스 이용약관
        </h1>
        <p
          className="mb-10 text-sm"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          시행일: 2026년 2월 10일 | 최종 수정일: 2026년 2월 10일
        </p>

        <div
          className="space-y-8 text-sm leading-relaxed"
          style={{ color: 'var(--color-ink-light)' }}
        >
          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              제1조 (목적)
            </h2>
            <p>
              본 약관은 Document Chat(이하 &quot;서비스&quot;)이 제공하는 PDF
              문서 기반 AI 채팅 서비스의 이용 조건 및 절차에 관한 사항을
              규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              제2조 (서비스 범위)
            </h2>
            <p>서비스는 다음 기능을 제공합니다:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Google 계정을 통한 간편 로그인</li>
              <li>PDF 문서 업로드 및 관리</li>
              <li>업로드된 PDF 문서에 대한 AI 기반 질의 응답 (RAG)</li>
              <li>대화 세션 관리 및 히스토리 보관</li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              제3조 (계정 및 인증)
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                서비스는 Google OAuth를 통한 로그인만 지원하며, 별도의 회원가입
                절차는 없습니다.
              </li>
              <li>
                사용자는 자신의 Google 계정 보안에 대한 책임을 집니다.
              </li>
              <li>
                서비스는 사용자의 Google 계정 기본 프로필 정보(이름, 이메일,
                프로필 사진)만을 수집합니다.
              </li>
            </ol>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              제4조 (사용자 의무)
            </h2>
            <p>사용자는 다음 사항을 준수해야 합니다:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>타인의 저작권을 침해하는 문서를 업로드하지 않습니다.</li>
              <li>불법적이거나 유해한 콘텐츠를 포함한 문서를 업로드하지 않습니다.</li>
              <li>서비스를 악의적 목적(해킹, 스팸, 자동화 남용 등)으로 사용하지 않습니다.</li>
              <li>서비스의 정상적인 운영을 방해하는 행위를 하지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              제5조 (크레딧 및 이용 제한)
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                서비스 이용에는 크레딧이 소모되며, 크레딧이 소진되면 일부 기능
                사용이 제한될 수 있습니다.
              </li>
              <li>
                크레딧 정책은 서비스 운영 상황에 따라 변경될 수 있으며, 변경 시
                사전에 공지합니다.
              </li>
            </ol>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              제6조 (AI 응답의 한계)
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                AI가 생성하는 응답은 참고 목적이며, 정확성을 보장하지 않습니다.
              </li>
              <li>
                중요한 의사결정에는 반드시 원본 문서를 직접 확인하시기 바랍니다.
              </li>
              <li>
                AI 응답으로 인한 손해에 대해 서비스 제공자는 책임을 지지 않습니다.
              </li>
            </ol>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              제7조 (데이터 및 콘텐츠)
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                사용자가 업로드한 PDF 문서의 저작권은 원저작권자에게 귀속됩니다.
              </li>
              <li>
                서비스는 업로드된 문서를 AI 질의 응답 기능 제공 목적으로만
                사용합니다.
              </li>
              <li>
                사용자의 데이터 처리에 관한 세부 사항은{' '}
                <Link
                  href="/privacy"
                  className="underline"
                  style={{ color: 'var(--color-accent)' }}
                >
                  개인정보처리방침
                </Link>
                을 참조하시기 바랍니다.
              </li>
            </ol>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              제8조 (책임 제한)
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                서비스는 &quot;있는 그대로(AS IS)&quot; 제공되며, 특정 목적에의
                적합성을 보장하지 않습니다.
              </li>
              <li>
                천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해
                책임을 지지 않습니다.
              </li>
              <li>
                사용자의 부주의 또는 본 약관 위반으로 인한 손해에 대해 책임을
                지지 않습니다.
              </li>
            </ol>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              제9조 (계정 해지 및 데이터 삭제)
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                사용자는 언제든지 계정 삭제를 요청할 수 있습니다.
              </li>
              <li>
                계정 삭제 시 업로드한 PDF 문서, 대화 기록 등 모든 데이터가 30일
                이내 완전 삭제됩니다.
              </li>
              <li>
                약관 위반 시 서비스 제공자는 사전 통보 후 계정을 정지 또는
                해지할 수 있습니다.
              </li>
            </ol>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              제10조 (분쟁 해결)
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                본 약관과 관련된 분쟁은 대한민국 법률에 따라 해결됩니다.
              </li>
              <li>
                서비스 이용과 관련한 분쟁이 발생한 경우, 양 당사자는 원만한
                해결을 위해 성실히 협의합니다.
              </li>
              <li>
                협의가 이루어지지 않는 경우 관할 법원에 소를 제기할 수 있습니다.
              </li>
            </ol>
          </section>

          <section>
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              제11조 (약관 변경)
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                본 약관은 서비스 운영상 필요한 경우 변경될 수 있습니다.
              </li>
              <li>
                약관 변경 시 시행일 7일 전까지 서비스 내 공지 또는 이메일을 통해
                사전 고지합니다.
              </li>
              <li>
                변경된 약관에 동의하지 않는 사용자는 계정을 해지할 수 있습니다.
              </li>
            </ol>
          </section>
        </div>

        <div className="mt-10 flex gap-4 text-sm">
          <Link
            href="/privacy"
            className="underline"
            style={{ color: 'var(--color-accent)' }}
          >
            개인정보처리방침
          </Link>
          <Link
            href="/login"
            className="underline"
            style={{ color: 'var(--color-accent)' }}
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </article>
    </div>
  );
}
