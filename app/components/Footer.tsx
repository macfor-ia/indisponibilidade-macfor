export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-4 mt-auto">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-9 text-center text-xs text-[var(--text-dim)]">
        © {new Date().getFullYear()} Macfor · Sistema de Indisponibilidade
      </div>
    </footer>
  );
}
