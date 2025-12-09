import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let conn;
  try {
    const { qrContent } = req.body;
    conn = await mysql.createConnection(process.env.DATABASE_URL);

    const [rows] = await conn.execute('SELECT * FROM guests WHERE id = ?', [qrContent]);
    const guest = rows[0];

    if (!guest) {
      await conn.end();
      return res.status(200).json({ valid: false, message: 'QR NON TROVATO', type: 'error' });
    }

    if (guest.status !== 'APPROVED') {
      await conn.end();
      return res.status(200).json({ valid: false, message: 'NON APPROVATO', type: 'error' });
    }

    if (guest.isUsed) {
      const time = new Date(guest.usedAt).toLocaleTimeString();
      await conn.end();
      return res.status(200).json({ 
        valid: false, 
        guest,
        message: `GIÀ ENTRATO ALLE ${time}`, 
        type: 'warning' 
      });
    }

    const now = Date.now();
    await conn.execute('UPDATE guests SET isUsed = true, usedAt = ? WHERE id = ?', [now, guest.id]);
    await conn.end();
    
    guest.isUsed = true;
    guest.usedAt = now;

    return res.status(200).json({ 
      valid: true, 
      guest, 
      message: 'ACCESSO CONSENTITO', 
      type: 'success' 
    });

  } catch (error) {
    if (conn) try { await conn.end(); } catch(e){}
    return res.status(500).json({ valid: false, message: 'ERRORE SERVER', type: 'error' });
  }
}
