import mysql from 'mysql2/promise';

export const onRequestPost = async ({ env }) => {
  let conn;
  try {
    // Connessione
    conn = await mysql.createConnection(env.DATABASE_URL);
    
    // Cancella tutto
    await conn.execute('DELETE FROM guests');
    
    // Chiudi connessione
    await conn.end();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (conn) try { await conn.end(); } catch(e){}
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};