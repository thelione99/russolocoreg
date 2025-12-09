import { connect } from '@planetscale/database';
import { Env, Guest } from '../types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { qrContent } = await request.json() as { qrContent: string };
    const conn = connect({ url: env.DATABASE_URL });

    // 1. Cerca l'ospite
    const result = await conn.execute('SELECT * FROM guests WHERE id = ?', [qrContent]);
    const guest = result.rows[0] as unknown as Guest;

    // 2. Validazioni
    if (!guest) {
      return new Response(JSON.stringify({ valid: false, message: 'QR NON TROVATO', type: 'error' }));
    }

    if (guest.status !== 'APPROVED') {
      return new Response(JSON.stringify({ valid: false, message: 'NON APPROVATO', type: 'error' }));
    }

    if (guest.isUsed) {
      const time = new Date(guest.usedAt!).toLocaleTimeString();
      return new Response(JSON.stringify({ 
        valid: false, 
        guest,
        message: `GIÀ ENTRATO ALLE ${time}`, 
        type: 'warning' 
      }));
    }

    // 3. Segna come usato (Ingresso riuscito)
    const now = Date.now();
    await conn.execute('UPDATE guests SET isUsed = true, usedAt = ? WHERE id = ?', [now, guest.id]);
    
    // Aggiorna l'oggetto locale per ritornarlo al frontend
    guest.isUsed = true;
    guest.usedAt = now;

    return new Response(JSON.stringify({ 
      valid: true, 
      guest, 
      message: 'ACCESSO CONSENTITO', 
      type: 'success' 
    }));

  } catch (error) {
    return new Response(JSON.stringify({ valid: false, message: 'ERRORE SERVER', type: 'error' }));
  }
};