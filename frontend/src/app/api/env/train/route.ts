import { sendCommand } from '@/lib/bridge';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;

    if (backendUrl) {
      const res = await fetch(`${backendUrl.replace(/\/+$/, '')}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timesteps: body.timesteps ?? 20000 }),
      });
      const data = await res.json();
      return new Response(`data: ${JSON.stringify(data)}\n\n`, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    let isFinished = false;
    
    const stream = new ReadableStream({
      start(controller) {
        sendCommand(
          { cmd: 'train', timesteps: body.timesteps ?? 20000 },
          (data) => {
            controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
            if (data.done) {
              isFinished = true;
              controller.close();
            }
          }
        ).catch(err => {
          if (!isFinished) {
            controller.enqueue(`data: ${JSON.stringify({ ok: false, error: err.message })}\n\n`);
            controller.close();
          }
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
