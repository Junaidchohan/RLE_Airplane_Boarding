import { NextResponse } from 'next/server';
import { sendCommand } from '@/lib/bridge';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const body = text ? JSON.parse(text) : {};
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;

    if (backendUrl) {
      const res = await fetch(`${backendUrl.replace(/\/+$/, '')}/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: body.action ?? null,
          policy: body.policy ?? 'random',
        }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    const res = await sendCommand({
      cmd: 'step',
      action: body.action ?? null,
      policy: body.policy ?? 'random',
    });
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
