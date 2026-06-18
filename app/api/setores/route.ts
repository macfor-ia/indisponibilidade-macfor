import { NextResponse } from 'next/server';
import { loadSetores } from '../../lib/setores';

export async function GET() {
  return NextResponse.json(loadSetores());
}
