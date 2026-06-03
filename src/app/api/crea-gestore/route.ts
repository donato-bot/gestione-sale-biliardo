import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inizializziamo Supabase usando la CHIAVE MASTER (Service Role Key).
// Questa chiave conferisce poteri assoluti al server, permettendo di creare utenti
// scavalcando le regole RLS. Non viene MAI inviata al browser.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(request: Request) {
  try {
    // Estrazione dei dati inviati dalla Torre di Controllo
    const { email, password } = await request.json();

    // Validazione geometrica: senza questi dati non si procede
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Parametri incompleti. Email e password sono obbligatori.' }, 
        { status: 400 }
      );
    }

    // Creazione dell'utente tramite l'API di amministrazione di Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Fondamentale: bypassa la mail di conferma standard di Supabase, poiché inviamo noi l'email di benvenuto personalizzata con Resend
    });

    // Se Supabase rifiuta la creazione (es. email già esistente)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Creazione avvenuta con successo, restituiamo semaforo verde alla Torre di Controllo
    return NextResponse.json({ success: true, user: data.user });

  } catch (err: any) {
    // Gestione di eventuali errori critici del server
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}