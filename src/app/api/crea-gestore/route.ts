export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Connessione Admin a Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Inizializzazione del motore Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

    // 1. Creazione dell'utente tramite le API di amministrazione
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true 
    });

    if (error) {
      console.error("Errore Auth Admin:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 2. Invio automatico dell'Email di benvenuto con Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Il Campione <onboarding@resend.dev>', // Mittente predefinito per i test
      to: [email],
      subject: 'Benvenuto a bordo de "Il Campione"',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #333;">
          <h1 style="color: #047857; font-style: italic; text-transform: uppercase;">Direzione Gara</h1>
          <p>Benvenuto a bordo del nuovo sistema gestionale <strong>Il Campione</strong>.</p>
          <p>Il tuo spazio riservato e blindato &egrave; stato varato con successo. Ecco le tue chiavi di accesso esclusive per prendere il comando:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 10px 0;"><strong>URL di Accesso:</strong> <a href="https://sale-biliardo.vercel.app/login" style="color: #2563eb; text-decoration: none;">https://sale-biliardo.vercel.app/login</a></p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0;"><strong>Password Provvisoria:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${password}</span></p>
          </div>
          
          <h3 style="color: #111827;">I tuoi primi 3 passi appena entri:</h3>
          <ol style="line-height: 1.6;">
            <li><strong>Genera i Campi:</strong> Al tuo primo accesso, usa il box per generare il numero esatto dei tuoi biliardi.</li>
            <li><strong>Personalizza:</strong> Usa il tasto CONFIGURA sotto ogni tavolo per assegnare un nome e impostare la tariffa oraria.</li>
            <li><strong>Avvia la Partita:</strong> Premi START e STOP. Il sistema calcoler&agrave; l'incasso matematico in automatico.</li>
          </ol>
          <p style="margin-top: 30px; font-weight: bold; color: #047857;">Buon lavoro e buon biliardo!</p>
        </div>
      `
    });

    if (emailError) {
      console.error("Errore invio email:", emailError);
      return NextResponse.json(
        { message: 'Utente creato su DB, ma errore nell\'invio della mail automatica' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: 'Varo completato ed email inviata con successo', user: data.user },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("Errore interno API:", err);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}