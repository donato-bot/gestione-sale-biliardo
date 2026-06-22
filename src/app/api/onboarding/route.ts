export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, nomeSala } = body;

    if (!email || !password || !nomeSala) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    // 1. CREAZIONE UTENTE IN AUTH
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

    if (authError) throw new Error(`Errore Auth: ${authError.message}`);

    // 2. CREAZIONE SALA NEL DATABASE
    const { error: dbError } = await supabaseAdmin.from('sale').insert([
      {
        name: nomeSala,
        manager_email: email,
        is_active: true,
      }
    ]);

    if (dbError) throw new Error(`Errore DB: ${dbError.message}`);

    // 3. SPEDIZIONE EMAIL CON RESEND
    const { error: emailError } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [email],
      subject: 'Benvenuto a bordo - Credenziali di Accesso',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Benvenuto ne Il Campione!</h2>
          <p>La tua sala <strong>${nomeSala}</strong> è stata configurata ed è pronta all'uso.</p>
          <p>Ecco le tue credenziali di accesso provvisorie:</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          <p>Ti consigliamo di cambiare la password al primo accesso.</p>
          <p>Buon lavoro!</p>
        </div>
      `,
    });

    if (emailError) {
      console.warn("Problema Resend:", emailError.message);
      return NextResponse.json({ 
        success: true, 
        message: '✅ VARO COMPLETATO! (Sala e Utente creati. Email non inviata per limiti di test Resend)' 
      });
    }

    // Se tutto è andato bene e anche l'email è partita
    return NextResponse.json({ success: true, message: '✅ VARO COMPLETATO! Sala creata ed email inviata.' });

    return NextResponse.json({ success: true, message: 'Onboarding completato con successo!' });

  } catch (error: any) {
    console.error('Errore durante l\'onboarding:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}