import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ user_id: string }> }) {
  try {
    // Fetch last 50 sessions, ordered by newest first
    //query('SELECT * FROM live_sessions WHERE id = $1', [id]),    
    const { user_id } = await params;    
    const result = await query(`
      SELECT id, user_id ,started_at, ended_at, status, model_name 
      FROM live_sessions 
      WHERE user_id =$1
      ORDER BY started_at DESC 
      LIMIT 50      
    `, [user_id]);
    
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}