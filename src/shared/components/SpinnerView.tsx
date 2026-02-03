interface SpinnerViewProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SpinnerView({ message = '로딩 중...', size = 'md' }: SpinnerViewProps) {
  const sizeConfig = {
    sm: { spinner: 'w-6 h-6', border: '2px', text: 'text-xs' },
    md: { spinner: 'w-10 h-10', border: '2.5px', text: 'text-sm' },
    lg: { spinner: 'w-14 h-14', border: '3px', text: 'text-base' },
  };

  const config = sizeConfig[size];

  return (
    <div className="flex flex-col items-center justify-center gap-5 p-6">
      {/* 스피너 */}
      <div className="relative">
        {/* 배경 원 */}
        <div
          className={`${config.spinner} rounded-full`}
          style={{
            border: `${config.border} solid var(--color-cream-dark)`
          }}
        />
        {/* 회전 원 */}
        <div
          className={`${config.spinner} absolute inset-0 animate-spin rounded-full`}
          style={{
            border: `${config.border} solid transparent`,
            borderTopColor: 'var(--color-accent)',
            borderRightColor: 'var(--color-accent-soft)'
          }}
        />
      </div>

      {/* 메시지 */}
      {message && (
        <p
          className={`${config.text} font-medium tracking-wide`}
          style={{ color: 'var(--color-ink-muted)' }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
