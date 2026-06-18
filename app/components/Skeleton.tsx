interface SkeletonProps {
  rows?: number;
  className?: string;
}

export function Skeleton({ rows = 3, className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-[var(--surface)] border border-[var(--border)] rounded-xl animate-pulse"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}
