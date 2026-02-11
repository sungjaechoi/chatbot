'use client';

interface ProgressBarProps {
  progress: number; // 0 ~ 100
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full">
      {/* 라벨 + 퍼센트 */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
          {label || '진행률'}
        </span>
        <span className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>
          {Math.round(clampedProgress)}%
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: '#2d3342' }}
      >
        <div
          className="stitch-shimmer relative h-full overflow-hidden rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${clampedProgress}%`,
            background: 'var(--color-accent)',
          }}
        />
      </div>
    </div>
  );
}
