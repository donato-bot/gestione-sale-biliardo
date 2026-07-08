import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Inizializzazione client amministrativo (ignora le policy RLS per creare l'utente)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);
const SUPER_ADMIN = "donatorzz1946@gmail.com";

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Controllo di sicurezza basato sul token dell'utente richiedente
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.email !== SUPER_ADMIN) {
      return NextResponse.json({ error: "Accesso negato: Solo il Super Admin può varare nuovi club" }, { status: 403 });
    }

    const { nomeSala, emailManager, passwordTemporanea } = await request.json();

    if (!nomeSala || !emailManager || !passwordTemporanea) {
      return NextResponse.json({ error: "Dati incompleti" }, { status: 400 });
    }

    // 1. Creazione Utente in Supabase Auth
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: emailManager,
      password: passwordTemporanea,
      email_confirm: true,
    });

    if (createUserError) {
      return NextResponse.json({ error: `Errore creazione Auth: ${createUserError.message}` }, { status: 400 });
    }

    // 2. Calcolo scadenza automatica a 30 giorni ed inserimento nuova riga Sala nel DB
    const scadenza = new Date();
    scadenza.setDate(scadenza.getDate() + 30);

    const { error: dbError } = await supabaseAdmin
      .from("sale")
      .insert([
        {
          name: nomeSala.toUpperCase(),
          manager_email: emailManager.toLowerCase(),
          scadenza_contributo: scadenza.toISOString(),
          is_active: true,
        },
      ]);

    if (dbError) {
      // Se il DB fallisce, eliminiamo l'utente auth appena creato per consistenza
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: `Errore inserimento DB: ${dbError.message}` }, { status: 400 });
    }

    // 3. Scrittura automatica dell'evento nella Scatola Nera
    await supabaseAdmin.from("admin_logs").insert([
      {
        azione: "VARO CLUB",
        dettagli: `Creata con successo la sala ${nomeSala.toUpperCase()} associata a ${emailManager}`,
      },
    ]);

    // 4. Spedizione credenziali tramite Resend
    try {
      await resend.emails.send({
        from: "Il Campione <onboarding@ilcampione-biliardo.it>", 
        to: emailManager,
        subject: "Benvenuto su Il Campione - Credenziali della tua Plancia",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #06b6d4; text-transform: uppercase;">Il Campione</h2>
            <p>Gentile Responsabile,</p>
            <p>La tua sala <strong>${nomeSala.toUpperCase()}</strong> è stata registrata con successo sulla nostra piattaforma.</p>
            <p>Di seguito trovi le credenziali operative per accedere alla tua plancia privata:</p>
            <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; font-family: monospace; margin: 20px 0;">
              <strong>URL di Accesso:</strong> <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login">${process.env.NEXT_PUBLIC_SITE_URL}/login</a><br/>
              <strong>Email Login:</strong> ${emailManager}<br/>
              <strong>Password Temporanea:</strong> ${passwordTemporanea}
            </div>
            <p style="color: #71717a; font-size: 12px;">Ti consigliamo di modificare la password al primo accesso per motivi di sicurezza.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #a1a1aa;">Sistema di Onboarding Automatico integrato - Il Campione.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("Invio email non riuscito, ma record inseriti:", mailErr);
    }

    return NextResponse.json({ success: true, message: "Onboarding completato con successo!" });
  } catch (globalErr: any) {
    return NextResponse.json({ error: globalErr.message }, { status: 500 });
  }
}