import { connect } from '@planetscale/database';
import { Env } from '../types';

export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  try {
    const conn = connect({ url: env.DATABASE_URL });
    // Attenzione: cancella tutto tranne un utente admin fittizio se vuoi, oppure tutto
    await conn.execute('DELETE FROM guests');
    
    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
};