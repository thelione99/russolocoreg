import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let conn;
  try {
    const data = req.body;
    const id = randomUUID();
    const now = Date.now();

    conn = await mysql.createConnection(process.env.DATABASE_URL);
    
    await conn.execute(
      'INSERT INTO guests (id, firstName, lastName, email, instagram, status, isUsed, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.firstName, data.lastName, data.email, data.instagram, 'PENDING', false, now]
    );
    
    await conn.end();

    return res.status(200).json({ success: true, id });
  } catch (error) {
    if (conn) await conn.end();
    return res.status(500).json({ error: error.message });
  }
}
