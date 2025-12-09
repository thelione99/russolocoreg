import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let conn;
  try {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    const [rows] = await conn.execute('SELECT * FROM guests ORDER BY createdAt DESC');
    await conn.end();
    
    return res.status(200).json(rows);
  } catch (error) {
    if (conn) await conn.end();
    return res.status(500).json({ error: error.message });
  }
}
