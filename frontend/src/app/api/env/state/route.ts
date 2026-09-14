import { NextResponse } from 'next/server';
import { sendCommand } from '@/lib/bridge';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
    if (backendUrl) {
      const res = await fetch(`${backendUrl.replace(/\/+$/, '')}/state`, { cache: 'no-store' });
      const data = await res.json();
      return NextResponse.json(data);
    }
    const res = await sendCommand({ cmd: 'state' });
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
