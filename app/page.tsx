import { HomeClient } from './HomeClient';

// Página de entrada — nunca pode ficar em cache de longo prazo na CDN (ver
// app/(pages)/login/page.tsx pro motivo completo), senão visitas diferentes
// caem em cópias desencontradas de deploys antigos. Esse export só funciona
// vindo de um Server Component — por isso a UI real mora em HomeClient.tsx.
export const dynamic = 'force-dynamic';

export default function Home() {
  return <HomeClient />;
}
