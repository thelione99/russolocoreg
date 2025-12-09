import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let conn;
  try {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    await conn.execute('DELETE FROM guests');
    await conn.end();
    
    return res.status(200).json({ success: true });
  } catch (error) {
    if (conn) try { await conn.end(); } catch(e){}
    return res.status(500).json({ error: error.message });
  }
}
