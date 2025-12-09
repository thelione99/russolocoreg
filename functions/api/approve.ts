import mysql from 'mysql2/promise';
import { Resend } from 'resend';

export const onRequestPost = async ({ request, env }) => {
  let conn;
  try {
    const { id } = await request.json();
    const resend = new Resend(env.RESEND_API_KEY);
    
    conn = await mysql.createConnection(env.DATABASE_URL);

    // 1. Aggiorna DB
    await conn.execute('UPDATE guests SET status = ?, qrCode = ? WHERE id = ?', ['APPROVED', id, id]);

    // 2. Recupera dati utente
    const [rows] = await conn.execute('SELECT * FROM guests WHERE id = ?', [id]);
    const guest = rows[0];

    if (!guest) throw new Error('Ospite non trovato');
    await conn.end(); // Chiudiamo la connessione prima di mandare la mail

    // 3. Invia Email
    await resend.emails.send({
      from: 'RUSSOLOCO <onboarding@resend.dev>', // Modifica con il tuo dominio verificato se ne hai uno
      to: [guest.email],
      subject: 'SEI DENTRO. Accesso RUSSOLOCO Approvato.',
      html: `
        <div style="background-color: #000; color: #fff; padding: 40px; font-family: sans-serif; text-align: center;">
          <h1 style="color: #ef4444; letter-spacing: 5px;">RUSSOLOCO</h1>
          <p style="font-size: 18px; margin-bottom: 30px;">Benvenuto, ${guest.firstName}.</p>
          <div style="background: #fff; padding: 20px; display: inline-block; border-radius: 10px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${id}" alt="QR Code Accesso" />
          </div>
          <p style="margin-top: 30px; color: #888; font-size: 12px;">ID: ${id}</p>
        </div>
      `
    });

    return new Response(JSON.stringify({ success: true, guest }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (conn) try { await conn.end(); } catch(e){}
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};