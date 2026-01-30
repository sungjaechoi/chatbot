interface SpinnerViewProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SpinnerView({ message = '로딩 중...', size = 'md' }: SpinnerViewProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div
        className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}
      />
      {message && (
        <p className="text-gray-600 text-sm font-medium">{message}</p>
      )}
    </div>
  );
}
