import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);
const SUPER_ADMIN = "donatorzz1946@gmail.com";

// CONTROLLO DI SICUREZZA UNIFICATO
async function verificaSuperAdmin(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  
  if (!token) return null;
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user || user.email !== SUPER_ADMIN) return null;
  
  return user;
}

// 1. GESTIONE CREAZIONE (POST)
export async function POST(request: Request) {
  try {
    const adminAutenticato = await verificaSuperAdmin(request);
    if (!adminAutenticato) {
      return NextResponse.json({ error: "Accesso negato: Solo il Super Admin può varare nuovi club" }, { status: 403 });
    }

    const { nomeSala, emailManager, passwordTemporanea } = await request.json();

    if (!nomeSala || !emailManager || !passwordTemporanea) {
      return NextResponse.json({ error: "Dati incompleti" }, { status: 400 });
    }

    // Creazione Utente Auth
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: emailManager,
      password: passwordTemporanea,
      email_confirm: true,
    });

    if (createUserError) {
      return NextResponse.json({ error: `Errore creazione Auth: ${createUserError.message}` }, { status: 400 });
    }

    // Inserimento Sala nel DB
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
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: `Errore inserimento DB: ${dbError.message}` }, { status: 400 });
    }

    // Scrittura Log Scatola Nera
    await supabaseAdmin.from("admin_logs").insert([
      { azione: "VARO CLUB", dettagli: `Creata la sala ${nomeSala.toUpperCase()} (${emailManager})` },
    ]);

    // Spedizione Email
    try {
      await resend.emails.send({
        from: "Il Campione <onboarding@ilcampione-biliardo.it>", 
        to: emailManager,
        subject: "Benvenuto su Il Campione - Credenziali della tua Plancia",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #06b6d4; text-transform: uppercase;">Il Campione</h2>
            <p>La tua sala <strong>${nomeSala.toUpperCase()}</strong> è attiva.</p>
            <p>Credenziali di accesso:</p>
            <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; font-family: monospace; margin: 20px 0;">
              <strong>URL:</strong> <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login">${process.env.NEXT_PUBLIC_SITE_URL}/login</a><br/>
              <strong>Email:</strong> ${emailManager}<br/>
              <strong>Password Temporanea:</strong> ${passwordTemporanea}
            </div>
          </div>
        `,
      });
    } catch (mErr) { console.error(mErr); }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. GESTIONE ELIMINAZIONE (DELETE)
export async function DELETE(request: Request) {
  try {
    const adminAutenticato = await verificaSuperAdmin(request);
    if (!adminAutenticato) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const { id, manager_email } = await request.json();
    if (!id || !manager_email) {
      return NextResponse.json({ error: "ID sala o email manager mancanti" }, { status: 400 });
    }

    // A. Elimina la sala dal database
    const { error: dbError } = await supabaseAdmin.from("sale").delete().eq("id", id);
    if (dbError) throw dbError;

    // B. Cerca ed elimina l'utente dalle credenziali di Auth
    const { data: usersData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (!userError && usersData?.users) {
      const targetUser = usersData.users.find(u => u.email?.toLowerCase() === manager_email.toLowerCase());
      if (targetUser) {
        await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
      }
    }

    // C. Registra l'eliminazione nella Scatola Nera
    await supabaseAdmin.from("admin_logs").insert([
      { azione: "ELIMINAZIONE CLUB", dettagli: `Rimossa definitivamente la sala con ID ${id} (${manager_email})` },
    ]);

    return NextResponse.json({ success: true, message: "Sala ed utente rimossi con successo" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}