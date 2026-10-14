import { ResetPasswordClient } from './ResetPasswordClient';

// Mesmo motivo do /login: não pode ficar em cache longo na CDN da Hostinger.
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
