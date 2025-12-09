import { connect } from '@planetscale/database';
import { Env } from '../types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const data = await request.json() as any;
    const conn = connect({ url: env.DATABASE_URL });

    const id = crypto.randomUUID();
    const now = Date.now();

    await conn.execute(
      'INSERT INTO guests (id, firstName, lastName, email, instagram, status, isUsed, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.firstName, data.lastName, data.email, data.instagram, 'PENDING', false, now]
    );

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
};