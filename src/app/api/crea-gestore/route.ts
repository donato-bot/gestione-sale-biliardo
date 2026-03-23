import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Controllo di sicurezza: verifica che la chiave sia stata caricata
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Manca la variabile SUPABASE_SERVICE_ROLE_KEY nel file .env.local!");
    }

    // Inizializza Supabase Admin in modalità "Server-Only"
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false // FONDAMENTALE LATO SERVER: previene errori di sessione
        }
      }
    );

    // Crea l'utente Auth su Supabase
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true // Confermiamo l'email in automatico
    });

    if (error) {
      // Se l'utente esiste già, non blocchiamo la creazione della sala!
      // In questo modo puoi assegnare una nuova sala a un gestore esistente.
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
         console.log("Utente già esistente. Procedo con l'associazione alla sala.");
         return NextResponse.json({ success: true, message: "Utente già esistente" });
      }
      throw error;
    }

    return NextResponse.json({ success: true, user: data?.user });

  } catch (error: any) {
    console.error("Errore API crea-gestore:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}