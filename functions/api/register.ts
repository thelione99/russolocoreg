import mysql from 'mysql2/promise';

export const onRequestPost = async ({ request, env }) => {
  let conn;
  try {
    const data = await request.json();
    const id = crypto.randomUUID();
    const now = Date.now();

    conn = await mysql.createConnection(env.DATABASE_URL);
    
    await conn.execute(
      'INSERT INTO guests (id, firstName, lastName, email, instagram, status, isUsed, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.firstName, data.lastName, data.email, data.instagram, 'PENDING', false, now]
    );
    
    await conn.end();

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (conn) await conn.end();
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};