import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        // 1. Individua le sale che scadono tra esattamente 3 giorni [cite: 2026-02-21]
        const dataTarget = new Date();
        dataTarget.setDate(dataTarget.getDate() + 3);
        const dataIso = dataTarget.toISOString().split('T')[0];

        const { data: saleInScadenza, error } = await supabaseAdmin
            .from('sale')
            .select('*')
            .eq('is_active', true)
            .filter('scadenza_contributo', 'gte', `${dataIso}T00:00:00`)
            .filter('scadenza_contributo', 'lte', `${dataIso}T23:59:59`);

        if (error) throw error;

        if (!saleInScadenza || saleInScadenza.length === 0) {
            return NextResponse.json({ message: "Nessuna scadenza imminente rilevata." });
        }

        // 2. Invio Massivo degli Avvisi [cite: 2026-02-10]
        for (const sala of saleInScadenza) {
            await resend.emails.send({
                from: 'Amministrazione <onboarding@resend.dev>',
                to: sala.manager_email,
                subject: `⚠️ Avviso di Scadenza: ${sala.name}`,
                html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #d97706;">Promemoria Scadenza Contributo</h2>
            <p>Gentile Manager di <strong>${sala.name}</strong>,</p>
            <p>Ti informiamo che il tuo contributo scadrà tra <strong>3 giorni</strong>.</p>
            <p>Per evitare la sospensione automatica dei tavoli prevista per il giorno ${new Date(sala.scadenza_contributo).toLocaleDateString()}, ti invitiamo a regolarizzare la tua posizione.</p>
            <hr />
            <p style="font-size: 12px; color: #666;">Questo è un messaggio automatico dalla Torre di Controllo.</p>
          </div>
        `
            });

            // 3. Registrazione nei Log [cite: 2026-02-10]
            await supabaseAdmin.from('admin_logs').insert({
                azione: 'AVVISO_SCADENZA',
                target_email: sala.manager_email
            });
        }

        return NextResponse.json({ success: true, inviati: saleInScadenza.length });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}