import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Questa riga è LA MAGIA: dice a Vercel di non testare questo file durante la build!
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Chiavi Supabase mancanti" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Qui in futuro metteremo la logica per cercare le scadenze
    // const { data } = await supabase.from('soci').select('*');

    return NextResponse.json({ message: "Cron Job configurato e pronto all'uso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}