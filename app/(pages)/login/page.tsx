import { LoginClient } from './LoginClient';

// Página de entrada — nunca pode ficar em cache de longo prazo na CDN da
// Hostinger, senão visitas diferentes caem em cópias desencontradas de
// deploys antigos (JS/CSS de builds que já não existem mais no servidor).
// Esse export só funciona vindo de um Server Component — por isso a UI real
// mora em LoginClient.tsx.
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginClient />;
}
