import { NextResponse } from 'next/server';
import { queries } from '../../lib/database';
import { listDistinctSquads } from '../../lib/squads';

/**
 * Endpoint público (sem auth) — usado pela tela de cadastro, antes do login.
 * Devolve só os rótulos "Área - Cliente", nunca nomes/emails dos membros.
 */
export async function GET() {
  const members = await queries.getAllMembers();
  return NextResponse.json(listDistinctSquads(members));
}
