import { NextResponse } from 'next/server';
import { supabase } from '../../lib/database';

export async function GET() {
  try {
    const { error } = await supabase.from('users5').select('id').limit(1);
    if (error) {
      console.error('[health] falha na conexão com o banco:', error);
      return NextResponse.json({ status: 'error', db: false, message: error.message }, { status: 503 });
    }
    return NextResponse.json({ status: 'ok', db: true });
  } catch (e: any) {
    console.error('[health] erro inesperado:', e.message);
    return NextResponse.json({ status: 'error', db: false, message: e.message }, { status: 503 });
  }
}
