import { SetoresClient } from './SetoresClient';

// Ver app/(pages)/login/page.tsx — sem isso, a CDN da Hostinger guarda essa
// página em cache por 1 ano e passa a servir cópias de deploys diferentes
// de forma inconsistente.
export const dynamic = 'force-dynamic';

export default function SetoresPageRoute() {
  return <SetoresClient />;
}
