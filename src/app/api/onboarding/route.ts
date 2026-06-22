export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    // 0A. INIZIALIZZAZIONE RESEND PROTETTA
    const resendKey = process.env.RESEND_API_KEY || '';
    if (!resendKey) {
        return NextResponse.json({ error: 'Configurazione mail mancante' }, { status: 500 });
    }
    const resend = new Resend(resendKey);

    // 0B. INIZIALIZZAZIONE SUPABASE PROTETTA
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Configurazione database mancante' }, { status: 500 });
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

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

  } catch (error: any) {
    console.error('Errore durante l\'onboarding:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
