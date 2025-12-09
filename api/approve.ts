import { connect } from '@planetscale/database';
import { Resend } from 'resend';
import { Env } from '../types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { id } = await request.json() as { id: string };
    const conn = connect({ url: env.DATABASE_URL });
    const resend = new Resend(env.RESEND_API_KEY);

    // 1. Aggiorna DB
    await conn.execute('UPDATE guests SET status = ?, qrCode = ? WHERE id = ?', ['APPROVED', id, id]);

    // 2. Recupera dati utente
    const result = await conn.execute('SELECT * FROM guests WHERE id = ?', [id]);
    const guest: any = result.rows[0];

    if (!guest) throw new Error('Ospite non trovato');

    // 3. Invia Email
    // NOTA: Sostituisci 'inviti@tuodominio.com' con il tuo indirizzo verificato su Resend
    await resend.emails.send({
      from: 'RUSSOLOCO <onboarding@resend.dev>', 
      to: [guest.email],
      subject: 'SEI DENTRO. Accesso RUSSOLOCO Approvato.',
      html: `
        <div style="background-color: #000; color: #fff; padding: 40px; font-family: sans-serif; text-align: center;">
          <h1 style="color: #ef4444; letter-spacing: 5px;">RUSSOLOCO</h1>
          <p style="font-size: 18px; margin-bottom: 30px;">Benvenuto, ${guest.firstName}.</p>
          
          <div style="background: #fff; padding: 20px; display: inline-block; border-radius: 10px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${id}" alt="QR Code Accesso" />
          </div>
          
          <p style="margin-top: 30px; color: #888; font-size: 12px;">ID UNIVOCO: ${id}</p>
          <p style="color: #888; font-size: 12px;">Mostra questo QR all'ingresso. Non inoltrare.</p>
        </div>
      `
    });

    return new Response(JSON.stringify({ success: true, guest }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
};