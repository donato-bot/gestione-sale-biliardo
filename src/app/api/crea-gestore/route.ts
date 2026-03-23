import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Inizializza Supabase con i super-poteri (Service Role Key)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Crea l'utente Auth su Supabase senza sloggare l'Admin
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Confermiamo l'email in automatico
    });

    if (error) throw error;

    return NextResponse.json({ success: true, user: data.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}