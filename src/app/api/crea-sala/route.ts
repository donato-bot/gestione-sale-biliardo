import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nomeSala, emailManager } = body;

        if (!nomeSala || !emailManager) {
            return NextResponse.json({ error: 'Nome sala ed email sono obbligatori' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const passwordProvvisoria = "Biliardo_" + Math.random().toString(36).slice(-6) + "!";

        // 1. Creazione Utente in Supabase (Accetta il trucco dell'alias con il +)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: emailManager,
            password: passwordProvvisoria,
            email_confirm: true
        });

        if (authError) throw new Error('Errore durante la creazione Utente: ' + authError.message);

        // 2. Creazione Sala nel Database
        const { data: dbData, error: dbError } = await supabaseAdmin.from('sale').insert([
            {
                name: nomeSala,
                manager_email: emailManager,
                scadenza_contributo: '2026-12-31',
                is_active: true
            }
        ]);

        if (dbError) throw new Error('Errore durante la registrazione Sala: ' + dbError.message);

        // IL TRUCCO HACKER PER RESEND: Rimuoviamo il "+alias" solo per il postino!
        const emailPerSpedizione = emailManager.includes('+')
            ? emailManager.split('+')[0] + '@' + emailManager.split('@')[1]
            : emailManager;

        // 3. Spedizione dell'Email Automatica tramite Resend
        const { error: emailError } = await resend.emails.send({
            from: 'Sistema Gestionale <onboarding@resend.dev>',
            to: [emailPerSpedizione], // Usa l'email ripulita, es: donatorzz1946@gmail.com
            subject: `Accesso attivato: ${nomeSala}`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #059669;">Benvenuto a bordo!</h2>
          <p>Il Super Admin ha appena varato la tua sala: <strong>${nomeSala}</strong>.</p>
          <p>Il tuo sistema di gestione isolato è ora online e pienamente operativo.</p>
          <br/>
          <p>Ecco le tue credenziali di accesso provvisorie:</p>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px;">
            <p><strong>Email:</strong> ${emailManager}</p>
            <p><strong>Password:</strong> ${passwordProvvisoria}</p>
          </div>
          <br/>
          <p>Puoi accedere alla tua dashboard privata da qui:</p>
          <a href="http://localhost:3000/login" style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accedi al Pannello</a>
        </div>
      `,
        });

        if (emailError) throw new Error("Sala creata, ma l'invio dell'email è fallito.");

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}