import { spawn, ChildProcess } from 'child_process';
import path from 'path';

interface QueueItem {
  cmd: string;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  onData?: (data: any) => void;
  timeoutId?: NodeJS.Timeout;
}

// Preserve across Next.js Turbopack / HMR reloads
const globalAny = globalThis as any;
if (!globalAny.__bridgeProcess) globalAny.__bridgeProcess = null;
if (!globalAny.__commandQueue) globalAny.__commandQueue = [];

function getBackendUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
}

function getPythonPath(): string {
  const isWindows = process.platform === 'win32';
  const rootDir = path.resolve(process.cwd(), '..');
  if (isWindows) {
    const fs = require('fs');
    const venvPython = path.join(rootDir, '.venv', 'Scripts', 'python.exe');
    if (fs.existsSync(venvPython)) return venvPython;
    return path.join(rootDir, 'airplane_env', 'Scripts', 'python.exe');
  }
  return path.join(rootDir, '.venv', 'bin', 'python');
}

function startBridge(): ChildProcess {
  if (globalAny.__bridgeProcess && !globalAny.__bridgeProcess.killed) {
    return globalAny.__bridgeProcess;
  }

  const rootDir = path.resolve(process.cwd(), '..');
  const pythonPath = getPythonPath();
  const bridgeScript = path.resolve(rootDir, 'src', 'server', 'bridge.py');

  console.log(`[bridge] Spawning python bridge: ${pythonPath} ${bridgeScript}`);

  const proc = spawn(pythonPath, [bridgeScript], {
    cwd: rootDir,
    env: { ...process.env, PYTHONPATH: rootDir },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (proc.stderr) {
    proc.stderr.on('data', (data) => {
      console.error(`[bridge stderr] ${data.toString().trim()}`);
    });
  }

  let buffer = '';
  if (proc.stdout) {
    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        let parsed: any;
        try {
          parsed = JSON.parse(line);
        } catch (err) {
          console.error('[bridge] Non-JSON stdout line:', line);
          continue;
        }

        const queue: QueueItem[] = globalAny.__commandQueue;
        const current = queue[0];
        if (!current) {
          console.warn('[bridge] Received output with empty queue:', parsed);
          continue;
        }

        // Handle streaming progress (e.g. training updates)
        if (current.onData && parsed.training === true) {
          try {
            current.onData(parsed);
          } catch (e) {
            console.error('[bridge] onData error:', e);
          }
          continue;
        }

        // Terminal response for this command — shift off queue immediately
        queue.shift();
        if (current.timeoutId) clearTimeout(current.timeoutId);

        try {
          if (current.onData) {
            current.onData(parsed);
          }
          current.resolve(parsed);
        } catch (e) {
          current.reject(e);
        }
      }
    });
  }

  proc.on('error', (err) => {
    console.error('[bridge] Process error:', err);
  });

  proc.on('exit', (code) => {
    console.log(`[bridge] Process exited with code ${code}`);
    globalAny.__bridgeProcess = null;
    const queue: QueueItem[] = globalAny.__commandQueue;
    while (queue.length > 0) {
      const item = queue.shift();
      if (item?.timeoutId) clearTimeout(item.timeoutId);
      item?.reject(new Error(`Bridge exited with code ${code}`));
    }
  });

  globalAny.__bridgeProcess = proc;
  return proc;
}

export async function sendCommand(obj: any, onData?: (data: any) => void): Promise<any> {
  const backendUrl = getBackendUrl();

  // If remote HTTP backend URL is configured (e.g. on Render)
  if (backendUrl) {
    const baseUrl = backendUrl.replace(/\/+$/, '');
    if (obj.cmd === 'state') {
      const res = await fetch(`${baseUrl}/state`, { cache: 'no-store' });
      return res.json();
    } else if (obj.cmd === 'reset') {
      const res = await fetch(`${baseUrl}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed: obj.seed,
          num_of_rows: obj.num_of_rows,
          seats_per_row: obj.seats_per_row,
        }),
      });
      return res.json();
    } else if (obj.cmd === 'step') {
      const res = await fetch(`${baseUrl}/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: obj.action,
          policy: obj.policy,
        }),
      });
      return res.json();
    } else if (obj.cmd === 'train') {
      const res = await fetch(`${baseUrl}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timesteps: obj.timesteps ?? 20000 }),
      });
      const data = await res.json();
      if (onData) onData(data);
      return data;
    }
  }

  // Local fallback: spawn python child process bridge
  return new Promise((resolve, reject) => {
    let proc = globalAny.__bridgeProcess;
    if (!proc || proc.killed) {
      proc = startBridge();
    }

    if (!proc || !proc.stdin) {
      return reject(new Error('Bridge stdin is unavailable'));
    }

    const isTrain = obj.cmd === 'train';
    const timeoutMs = isTrain ? 120000 : 15000;

    const queueItem: QueueItem = {
      cmd: obj.cmd,
      resolve,
      reject,
      onData,
    };

    queueItem.timeoutId = setTimeout(() => {
      const queue: QueueItem[] = globalAny.__commandQueue;
      const idx = queue.indexOf(queueItem);
      if (idx !== -1) {
        queue.splice(idx, 1);
        reject(new Error(`Bridge command '${obj.cmd}' timed out after ${timeoutMs / 1000}s`));
      }
    }, timeoutMs);

    globalAny.__commandQueue.push(queueItem);

    try {
      proc.stdin.write(JSON.stringify(obj) + '\n');
    } catch (e) {
      const queue: QueueItem[] = globalAny.__commandQueue;
      const idx = queue.indexOf(queueItem);
      if (idx !== -1) queue.splice(idx, 1);
      if (queueItem.timeoutId) clearTimeout(queueItem.timeoutId);
      reject(e);
    }
  });
}
