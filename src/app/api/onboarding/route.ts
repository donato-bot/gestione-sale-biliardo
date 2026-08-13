// ==========================================
// FILE: src/app/api/onboarding/route.ts
// OBIETTIVO: API Backend per Varo, Kill Switch, Cancellazione e Invio Email (Resend Dinamico)
// ==========================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// --- HELPER FUNCTION: Inizializza Supabase Admin ---
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Configurazione Server Errata (Ambiente)");
  }
  return createClient(supabaseUrl, supabaseKey);
}

// --- HELPER FUNCTION: Verifica Autorizzazione Super Admin ---
async function verifySuperAdmin(request: Request, supabaseAdmin: any) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) throw new Error("Token mancante");

  const token = authHeader.split(" ")[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  
  if (authError || !user || user.email?.toLowerCase() !== "donatorzz1946@gmail.com") {
    throw new Error("Accesso negato: Solo il Super Admin può eseguire questa operazione.");
  }
  return user;
}


// ==========================================
// METODO POST: Creazione/Aggiornamento Sala e INVIO EMAIL
// ==========================================
export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await verifySuperAdmin(request, supabaseAdmin);

    const body = await request.json();
    const { nomeSala, emailManager, passwordTemporanea, numeroBiliardi } = body;

    if (!nomeSala || !emailManager || !passwordTemporanea) {
      return NextResponse.json({ error: "Parametri incompleti" }, { status: 400 });
    }

    const tavoliInt = parseInt(numeroBiliardi, 10) || 0;
    const nomeFormattato = nomeSala.toUpperCase();

    // 1. SignUp
    const { error: createError } = await supabaseAdmin.auth.signUp({
      email: emailManager,
      password: passwordTemporanea,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` }
    });

    if (createError && !createError.message.toLowerCase().includes("already registered")) {
      console.error("ERRORE SignUp:", createError);
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // 2. Verifica se la sala esiste già e Database Insert
    const { data: existingSala } = await supabaseAdmin
      .from('sale')
      .select('id')
      .eq('name', nomeFormattato)
      .maybeSingle();

    let insertSalaError = null;

    if (existingSala) {
      const { error } = await supabaseAdmin
        .from('sale')
        .update({
          manager_email: emailManager.toLowerCase(),
          numero_biliardi: tavoliInt,
          is_active: true,
          scadenza_contributo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('name', nomeFormattato);
      insertSalaError = error;
    } else {
      const { error } = await supabaseAdmin
        .from('sale')
        .insert([
          { 
            name: nomeFormattato, 
            manager_email: emailManager.toLowerCase(), 
            numero_biliardi: tavoliInt,
            is_active: true,
            scadenza_contributo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      insertSalaError = error;
    }

    if (insertSalaError) {
      console.error("ERRORE DB:", insertSalaError);
      return NextResponse.json({ error: insertSalaError.message }, { status: 400 });
    }

    // 3. Registra l'azione
    await supabaseAdmin.from('admin_logs').insert([{
      manager_email: emailManager.toLowerCase(),
      azione: 'VARO CLUB',
      dettagli: `Creata/Aggiornata sala '${nomeFormattato}' con ${tavoliInt} biliardi.`
    }]);

    // 4. SPEDIZIONE EMAIL CON RESEND (Ora legge la chiave in tempo reale!)
    if (!process.env.RESEND_API_KEY) {
      console.error("⚠️ ALLARME: La chiave RESEND_API_KEY non è stata trovata. Controlla di aver salvato il file .env.local!");
    } else {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const urlPiattaforma = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      
      const { error: emailError } = await resend.emails.send({
        from: 'Il Campione <onboarding@resend.dev>', 
        to: [emailManager.toLowerCase()],
        subject: `[IL CAMPIONE] Credenziali Ufficiali: ${nomeFormattato}`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 40px 20px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #11131a; border: 2px solid #0891b2; border-radius: 16px; padding: 40px; box-shadow: 0 0 20px rgba(8, 145, 178, 0.2);">
              <h1 style="color: #22d3ee; text-transform: uppercase; letter-spacing: 2px; font-style: italic; margin-bottom: 10px;">
                IL CAMPIONE
              </h1>
              <p style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 40px;">
                Terminale di Rete Unificato
              </p>
              
              <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 20px;">
                BENVENUTO A BORDO, <br>
                <span style="color: #22d3ee;">${nomeFormattato}</span>
              </h2>
              
              <p style="color: #d1d5db; line-height: 1.6; margin-bottom: 30px;">
                La tua plancia di comando è stata varata con successo ed è pronta per l'operatività. Sono stati configurati <strong>${tavoliInt}</strong> biliardi per il tuo club.
              </p>

              <div style="background-color: #000000; border: 1px solid #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: left;">
                <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px; text-transform: uppercase;">Le tue credenziali di accesso:</p>
                <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Email:</strong> <span style="color: #22d3ee;">${emailManager.toLowerCase()}</span></p>
                <p style="margin: 0; font-size: 16px;"><strong>Password:</strong> <span style="color: #22d3ee;">${passwordTemporanea}</span></p>
              </div>

              <p style="color: #ef4444; font-size: 12px; margin-bottom: 30px;">
                ⚠️ Per ragioni di sicurezza, ti invitiamo a modificare la password al tuo primo accesso tramite le impostazioni del profilo.
              </p>

              <a href="${urlPiattaforma}/login" style="display: inline-block; background-color: #0891b2; color: #000000; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 15px 30px; border-radius: 8px;">
                ACCEDI ALLA PLANCIA
              </a>
            </div>
            <p style="color: #6b7280; font-size: 11px; margin-top: 30px;">
              Questa è una comunicazione generata automaticamente dal sistema IL CAMPIONE.<br>Non rispondere a questa email.
            </p>
          </div>
        `
      });

      if (emailError) {
        console.error("⚠️ ERRORE INVIO EMAIL RESEND:", emailError);
      } else {
        console.log("✅ EMAIL RESEND INVIATA CON SUCCESSO A:", emailManager);
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("ERRORE FATALE API POST:", err);
    return NextResponse.json({ error: err.message }, { status: err.message.includes('Accesso negato') ? 403 : 500 });
  }
}

// ==========================================
// METODO PATCH: Toggle Kill Switch
// ==========================================
export async function PATCH(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await verifySuperAdmin(request, supabaseAdmin);

    const body = await request.json();
    const { id, is_active } = body;

    if (!id || typeof is_active !== 'boolean') {
      return NextResponse.json({ error: "Parametri ID o stato mancanti" }, { status: 400 });
    }

    const { data: salaData, error: fetchError } = await supabaseAdmin.from('sale').select('manager_email, name').eq('id', id).single();
    if (fetchError || !salaData) throw new Error("Sala non trovata.");

    const { error: updateError } = await supabaseAdmin
      .from('sale')
      .update({ is_active })
      .eq('id', id);

    if (updateError) throw updateError;

    await supabaseAdmin.from('admin_logs').insert([{
      manager_email: salaData.manager_email,
      azione: is_active ? 'RIATTIVAZIONE CONTRATTO' : 'SOSPENSIONE CONTRATTO',
      dettagli: `Lo stato della sala '${salaData.name}' è stato impostato su ${is_active ? 'ATTIVO' : 'SOSPESO'}.`
    }]);

    return NextResponse.json({ success: true, is_active });

  } catch (err: any) {
    console.error("ERRORE FATALE API PATCH:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ==========================================
// METODO DELETE: Eliminazione Definitiva Sala
// ==========================================
export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await verifySuperAdmin(request, supabaseAdmin);

    const body = await request.json();
    const { id, manager_email } = body;

    if (!id || !manager_email) {
      return NextResponse.json({ error: "ID Sala o Email mancanti per l'eliminazione" }, { status: 400 });
    }

    await supabaseAdmin.from('admin_logs').insert([{
      manager_email: manager_email,
      azione: 'ELIMINAZIONE DEFINITIVA',
      dettagli: `La sala con ID ${id} è stata eliminata definitivamente dal Super Admin.`
    }]);

    const { error: deleteError } = await supabaseAdmin
      .from('sale')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("ERRORE ELIMINAZIONE:", deleteError);
      return NextResponse.json({ error: `Errore database: ${deleteError.message}. Controlla i vincoli di Cascade.` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Sala eliminata correttamente" });

  } catch (err: any) {
    console.error("ERRORE FATALE API DELETE:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}