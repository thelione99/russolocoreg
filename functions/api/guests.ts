import mysql from 'mysql2/promise';

export const onRequestGet = async ({ env }) => {
  let conn;
  try {
    conn = await mysql.createConnection(env.DATABASE_URL);
    const [rows] = await conn.execute('SELECT * FROM guests ORDER BY createdAt DESC');
    await conn.end();
    
    return new Response(JSON.stringify(rows), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (conn) await conn.end();
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};