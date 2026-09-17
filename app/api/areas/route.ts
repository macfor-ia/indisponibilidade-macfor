import { NextResponse } from 'next/server';
import { queries } from '../../lib/database';
import { listDistinctAreas } from '../../lib/squads';

/**
 * Endpoint público (sem auth) — usado no formulário de indisponibilidade.
 * Devolve só os valores distintos de members.area, nunca nomes/emails dos membros.
 */
export async function GET() {
  const members = await queries.getAllMembers();
  return NextResponse.json(listDistinctAreas(members));
}
