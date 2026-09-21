import { ReactNode } from 'react';

type PageHeaderProps = {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
};

// Painel do título de página: fica em cima de --surface (translúcido, igual à
// navbar) em vez de direto no fundo do body. No tema "Azul Macfor" o fundo é
// um azul vibrante — texto (inclusive o --text-muted) direto nele perde
// contraste, então o título sempre repousa nessa superfície clara.
export function PageHeader({ icon, title, subtitle, actions, align = 'left', className = '' }: PageHeaderProps) {
  const centered = align === 'center';
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/75 backdrop-blur-md px-5 py-4 mb-7 ${
        centered ? 'flex flex-col items-center text-center' : 'flex justify-between items-start flex-wrap gap-4'
      } ${className}`}
    >
      <div>
        <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${centered ? 'justify-center' : ''}`}>
          {icon}
          {title}
        </h1>
        {subtitle && <p className="text-[var(--text-muted)] text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
