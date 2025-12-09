import mysql from 'mysql2/promise';

export const onRequestPost = async ({ request, env }) => {
  let conn;
  try {
    const { qrContent } = await request.json();
    conn = await mysql.createConnection(env.DATABASE_URL);

    // 1. Cerca l'ospite
    const [rows] = await conn.execute('SELECT * FROM guests WHERE id = ?', [qrContent]);
    const guest = rows[0];

    if (!guest) {
      await conn.end();
      return new Response(JSON.stringify({ valid: false, message: 'QR NON TROVATO', type: 'error' }));
    }

    if (guest.status !== 'APPROVED') {
      await conn.end();
      return new Response(JSON.stringify({ valid: false, message: 'NON APPROVATO', type: 'error' }));
    }

    if (guest.isUsed) {
      const time = new Date(guest.usedAt).toLocaleTimeString();
      await conn.end();
      return new Response(JSON.stringify({ 
        valid: false, 
        guest,
        message: `GIÀ ENTRATO ALLE ${time}`, 
        type: 'warning' 
      }));
    }

    // 3. Segna come usato
    const now = Date.now();
    await conn.execute('UPDATE guests SET isUsed = true, usedAt = ? WHERE id = ?', [now, guest.id]);
    await conn.end();
    
    guest.isUsed = true;
    guest.usedAt = now;

    return new Response(JSON.stringify({ 
      valid: true, 
      guest, 
      message: 'ACCESSO CONSENTITO', 
      type: 'success' 
    }));

  } catch (error) {
    if (conn) try { await conn.end(); } catch(e){}
    return new Response(JSON.stringify({ valid: false, message: 'ERRORE SERVER', type: 'error' }));
  }
};