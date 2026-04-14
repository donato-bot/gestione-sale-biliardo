import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { managerEmail, salaName, cliente, dataOra } = await request.json();
    const dataFormattata = new Date(dataOra).toLocaleString('it-IT');

    const { data, error } = await resend.emails.send({
      from: 'Sistema Biliardi <onboarding@resend.dev>',
      to: [managerEmail],
      subject: `🚨 NUOVA PRENOTAZIONE: ${salaName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 4px solid #14b8a6; border-radius: 20px;">
          <h1 style="color: #14b8a6;">Nuova Richiesta Ricevuta!</h1>
          <p>Capo, c'è una nuova prenotazione in attesa di conferma per <strong>${salaName}</strong>.</p>
          <hr />
          <p><strong>Cliente:</strong> ${cliente}</p>
          <p><strong>Data e Ora:</strong> ${dataFormattata}</p>
          <hr />
          <p>Entra subito nella Plancia per confermare o rifiutare la richiesta.</p>
        </div>
      `,
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}