import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET( request: Request, { params }: { params: Promise<{ id: string }> } ) {
  const  { id }  = await params ;
    
  try {
    // Run queries in parallel for speed    
    const [sessionResult, messagesResult] = await Promise.all([
      query('SELECT * FROM live_sessions WHERE id = $1', [id]),
      query('SELECT * FROM live_messages WHERE session_id = $1 ORDER BY created_at ASC', [id])
    ]);
    
    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({
      metadata: sessionResult.rows[0],
      messages: messagesResult.rows
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database Error' }, { status: 500 });
  }
}