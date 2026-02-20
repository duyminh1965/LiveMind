import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { sessionId, sender, text } = await req.json();
    
    // Safety check
    if (!sessionId || !text) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const result = await query(
      'INSERT INTO live_messages (session_id, sender, content) VALUES ($1, $2, $3) RETURNING id',
      [sessionId, sender, text]
    );
    
    return NextResponse.json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'DB Error' }, { status: 500 });
  }
}