import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Providers } from "./providers";
import { Footer } from "./components/Footer";

export const metadata: Metadata = {
  title: "Indisponibilidade",
  description: "Sistema de controle de indisponibilidade da Macfor",
};

// Roda antes do React hidratar, pra já aplicar o tema salvo (escuro/claro/
// azul/vidro) sem piscar a tela com o tema errado por uma fração de segundo.
//
// O <link> do tema do PrimeReact é criado AQUI, por JS, de propósito: se ele
// fosse renderizado pelo React, o React o trataria como parte da árvore dele
// e, na hidratação, reverteria o href pro valor do servidor (sempre o tema
// escuro, já que o servidor não conhece o localStorage) — era isso que fazia
// o CSS escuro do PrimeReact voltar sozinho e deixar textos brancos em cima
// dos temas claros. Pelo mesmo motivo o <html> leva suppressHydrationWarning:
// o data-theme abaixo é alterado por este script antes do React hidratar.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var valid = ['dark', 'light', 'blue', 'glass'];
    var saved = localStorage.getItem('theme');
    var theme = valid.indexOf(saved) !== -1 ? saved : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    var link = document.getElementById('prime-theme-link');
    if (!link) {
      link = document.createElement('link');
      link.id = 'prime-theme-link';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = theme === 'dark' ? '/prime-themes/lara-dark-blue.css' : '/prime-themes/lara-light-blue.css';
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="dark" className="dark" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
         <link href="/icon.png" rel="icon" />
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <Providers>
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
