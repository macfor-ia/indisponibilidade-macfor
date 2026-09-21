import type { Metadata } from "next";
import "./globals.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Providers } from "./providers";
import { Footer } from "./components/Footer";

export const metadata: Metadata = {
  title: "Indisponibilidade",
  description: "Sistema de controle de indisponibilidade da Macfor",
};

// Roda antes do React hidratar, pra já aplicar o tema salvo (escuro/claro/azul)
// sem piscar a tela com o tema errado por uma fração de segundo.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var theme = (saved === 'light' || saved === 'blue') ? saved : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    var link = document.getElementById('prime-theme-link');
    if (link) link.href = theme === 'dark' ? '/prime-themes/lara-dark-blue.css' : '/prime-themes/lara-light-blue.css';
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="dark" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
         <link href="/icon.png" rel="icon" />
        <link id="prime-theme-link" rel="stylesheet" href="/prime-themes/lara-dark-blue.css" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
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
