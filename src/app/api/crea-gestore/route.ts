import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ATTENZIONE: Qui usiamo la SERVICE_ROLE key (la chiave segreta del database), 
// NON la ANON key. Questo ci permette di agire con i superpoteri per creare utenti.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password sono obbligatorie' },
        { status: 400 }
      );
    }

    // 1. Creazione dell'utente tramite le API di amministrazione di Supabase
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Bypassiamo la mail di conferma: l'utente è subito attivo
    });

    if (error) {
      console.error("Errore Auth Admin:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 2. (Opzionale) Integrazione futura: Qui inserirai il codice di Resend 
    // per inviare l'email effettiva con le credenziali appena generate.
    // Al momento, il nostro sistema a schermo nella Torre di Controllo 
    // è sufficiente per permetterti di copiare le chiavi e mandarle al cliente via WhatsApp o Mail.

    return NextResponse.json(
      { message: 'Gestore creato e autorizzato con successo', user: data.user },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("Errore interno API:", err);
    return NextResponse.json(
      { error: 'Errore interno del server durante il varo' },
      { status: 500 }
    );
  }
}