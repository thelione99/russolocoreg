import { connect } from '@planetscale/database';
import { Env } from '../types';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const conn = connect({ url: env.DATABASE_URL });
    const results = await conn.execute('SELECT * FROM guests ORDER BY createdAt DESC');
    
    return new Response(JSON.stringify(results.rows), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
};