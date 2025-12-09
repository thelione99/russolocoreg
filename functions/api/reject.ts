import mysql from 'mysql2/promise';

export const onRequestPost = async ({ request, env }) => {
  let conn;
  try {
    const { id } = await request.json();
    
    // Connessione
    conn = await mysql.createConnection(env.DATABASE_URL);

    // Esegui update
    await conn.execute('UPDATE guests SET status = ? WHERE id = ?', ['REJECTED', id]);

    // Chiudi connessione
    await conn.end();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Gestione errore e chiusura forzata se serve
    if (conn) try { await conn.end(); } catch(e){}
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};