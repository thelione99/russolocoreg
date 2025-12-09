import { connect } from '@planetscale/database';
import { Env } from '../types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { id } = await request.json() as { id: string };
    const conn = connect({ url: env.DATABASE_URL });

    await conn.execute('UPDATE guests SET status = ? WHERE id = ?', ['REJECTED', id]);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
};