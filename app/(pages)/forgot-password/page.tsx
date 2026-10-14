import { ForgotPasswordClient } from './ForgotPasswordClient';

// Mesmo motivo do /login: não pode ficar em cache longo na CDN da Hostinger.
export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
