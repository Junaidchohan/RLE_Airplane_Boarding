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

function getPythonPath(): string {
  const isWindows = process.platform === 'win32';
  const rootDir = path.resolve(process.cwd(), '..');
  if (isWindows) {
    return path.join(rootDir, 'airplane_env', 'Scripts', 'python.exe');
  }
  return path.join(rootDir, '.venv', 'bin', 'python');
}

function startBridge(): ChildProcess {
  if (globalAny.__bridgeProcess && !globalAny.__bridgeProcess.killed) {
    return globalAny.__bridgeProcess;
  }

  const pythonPath = getPythonPath();
  const bridgeScript = path.resolve(process.cwd(), '..', 'bridge.py');

  console.log(`[bridge] Spawning python bridge: ${pythonPath} ${bridgeScript}`);

  const proc = spawn(pythonPath, [bridgeScript], {
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

export function sendCommand(obj: any, onData?: (data: any) => void): Promise<any> {
  return new Promise((resolve, reject) => {
    let proc = globalAny.__bridgeProcess;
    if (!proc || proc.killed) {
      proc = startBridge();
    }

    if (!proc || !proc.stdin) {
      return reject(new Error('Bridge stdin is unavailable'));
    }

    const isTrain = obj.cmd === 'train';
    const timeoutMs = isTrain ? 120000 : 15000; // 15s for regular commands, 2min for train

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
