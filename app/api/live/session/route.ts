/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { headers } from 'next/headers';

// START SESSION
export async function POST(req: Request) {
  try {
    // 1. Read Server-Side Headers for IP & User Agent
    const headersList = headers();
    const ip = (await headersList).get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const userAgent = (await headersList).get('user-agent') || 'unknown';

    // 2. Read Client-Side Data from Body
    const { modelName, user_id, client_identifier, latitude, longitude, device_type, screen_res } = await req.json();
    console.log("ip:", ip)
    console.log("userAgent:", userAgent)
    console.log("client_identifier:", client_identifier)
    console.log("longitude:", longitude)
    console.log("latitude:", latitude)
    console.log("device_type:", device_type)
    console.log("screen_res:", screen_res)
    const result = await query(
      `INSERT INTO live_sessions 
       (model_name, user_id, client_ip, user_agent, client_identifier, latitude, longitude, device_type, screen_res) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id`,
      [modelName, user_id, ip, userAgent, client_identifier, latitude, longitude, device_type, screen_res]
    );

    return NextResponse.json({ id: result.rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: 'DB Error' }, { status: 500 });
  }
}

// END SESSION
export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();
    await query(
      "UPDATE live_sessions SET ended_at = NOW(), status = $1 WHERE id = $2",
      [status || 'completed', id]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'DB Error' }, { status: 500 });
  }
}