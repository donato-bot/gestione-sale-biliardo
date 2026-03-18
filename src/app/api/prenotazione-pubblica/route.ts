import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// Inizializza Supabase usando le chiavi pubbliche che abbiamo configurato
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const salaId = searchParams.get('salaId');

    if (!salaId) return NextResponse.json({ error: 'Codice sala mancante' }, { status: 400 });

    const { data: sala } = await supabase.from('sale').select('manager_email, name, is_active').eq('id', salaId).single();
    if (!sala) return NextResponse.json({ error: 'Club non trovato' }, { status: 404 });
    if (!sala.is_active) return NextResponse.json({ error: 'Il servizio prenotazioni per questo club è attualmente sospeso.' }, { status: 403 });

    const { data: tavoli } = await supabase.from('tavoli').select('id, nome, tariffa').eq('manager_email', sala.manager_email);

    return NextResponse.json({ sala, tavoli });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { manager_email, tavolo_id, nome_cliente, telefono, data_prenotazione, ora_inizio, ora_fine } = body;

        const start = ora_inizio.length === 5 ? `${ora_inizio}:00` : ora_inizio;
        const end = ora_fine.length === 5 ? `${ora_fine}:00` : ora_fine;

        const { error } = await supabase.from('prenotazioni').insert([{
            manager_email,
            tavolo_id,
            nome_cliente,
            telefono,
            data_prenotazione,
            ora_inizio: start,
            ora_fine: end,
            stato: 'Nuova Online' // Segnale per la plancia
        }]);

        if (error) throw error;

        // Invia l'allarme via email al Manager, rimuovendo gli alias + dal destinatario
        await resend.emails.send({
            from: 'Centro Prenotazioni <onboarding@resend.dev>',
            to: manager_email.includes('+') ? manager_email.replace(/\+[^@]+/, '') : manager_email,
            subject: `🚨 Nuova Prenotazione Web: ${nome_cliente}`,
            html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #ea580c;">Hai ricevuto una nuova richiesta!</h2>
          <p>Un cliente ha appena prenotato un tavolo dal tuo link pubblico.</p>
          <hr />
          <p><strong>Cliente:</strong> ${nome_cliente}</p>
          <p><strong>Telefono:</strong> ${telefono || 'Non fornito'}</p>
          <p><strong>Data:</strong> ${new Date(data_prenotazione).toLocaleDateString('it-IT')}</p>
          <p><strong>Orario:</strong> ${start.slice(0, 5)} - ${end.slice(0, 5)}</p>
          <hr />
          <p style="font-size: 14px;">Accedi alla tua Torre di Controllo per <strong>confermare</strong> o <strong>rifiutare</strong> la richiesta.</p>
        </div>
      `
        });

        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}                                                               