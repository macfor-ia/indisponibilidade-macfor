import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  borderColor?: string;
}

export function Card({ children, className = '', onClick, borderColor }: CardProps) {
  return (
    <div
      className={`bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 backdrop-blur-sm ${onClick ? 'cursor-pointer hover:border-[var(--accent-border)] hover:bg-[var(--card-hover)] transition-all' : ''} ${className}`}
      style={borderColor ? { borderColor } : undefined}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
