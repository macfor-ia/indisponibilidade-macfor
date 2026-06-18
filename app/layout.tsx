import type { Metadata } from "next";
import "./globals.css";
import "primereact/resources/themes/lara-dark-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Providers } from "./providers";
import { Footer } from "./components/Footer";

export const metadata: Metadata = {
  title: "Indisponibilidade",
  description: "Sistema de controle de indisponibilidade da Macfor",
};

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
