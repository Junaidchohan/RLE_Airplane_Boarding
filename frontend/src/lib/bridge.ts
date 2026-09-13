import { spawn, ChildProcess } from 'child_process';
import path from 'path';

let bridgeProcess: ChildProcess | null = null;
let commandQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

function getPythonPath(): string {
  // We're inside frontend/src/lib, the project root is 3 levels up
  const isWindows = process.platform === 'win32';
  const rootDir = path.resolve(process.cwd(), '..');
  
  if (isWindows) {
    return path.join(rootDir, 'airplane_env', 'Scripts', 'python.exe');
  }
  return path.join(rootDir, '.venv', 'bin', 'python');
}

function startBridge() {
  if (bridgeProcess && !bridgeProcess.killed) return bridgeProcess;

  const pythonPath = getPythonPath();
  const bridgeScript = path.resolve(process.cwd(), '..', 'bridge.py');

  console.log(`[bridge] Starting python bridge at ${bridgeScript}`);

  bridgeProcess = spawn(pythonPath, [bridgeScript], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (bridgeProcess.stderr) {
    bridgeProcess.stderr.on('data', (data) => {
      console.error(`[bridge stderr] ${data.toString().trim()}`);
    });
  }

  if (bridgeProcess.stdout) {
    let buffer = '';
    bridgeProcess.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const request = commandQueue[0];
          if (request) {
            const shouldRemove = request.resolve(parsed);
            if (shouldRemove) {
              commandQueue.shift();
            }
          } else {
            console.warn('[bridge warning] Received response but no command was queued', parsed);
          }
        } catch (e) {
          console.error('[bridge error] Failed to parse JSON from stdout', line);
        }
      }
    });
  }

  bridgeProcess.on('error', (err) => {
    console.error('[bridge error] Process error:', err);
  });

  bridgeProcess.on('exit', (code) => {
    console.log(`[bridge] Process exited with code ${code}`);
    bridgeProcess = null;
    // Reject any pending commands
    while (commandQueue.length > 0) {
      const req = commandQueue.shift();
      req?.reject(new Error(`Bridge exited with code ${code}`));
    }
  });

  // Keep it globally across hot reloads
  (global as any).bridgeProcess = bridgeProcess;
  (global as any).commandQueue = commandQueue;

  return bridgeProcess;
}

export function sendCommand(obj: any, onData?: (data: any) => void): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!bridgeProcess || bridgeProcess.killed) {
      startBridge();
    }
    
    if (!bridgeProcess || !bridgeProcess.stdin) {
      return reject(new Error('Bridge is not running'));
    }

    commandQueue.push({ 
      resolve: (val) => {
        if (onData) {
          onData(val);
          // If training is done, resolve the promise entirely
          if (val.done === true) {
            resolve(val);
            return true; // remove from queue
          }
          return false; // keep in queue
        } else {
          resolve(val);
          return true; // remove from queue
        }
      }, 
      reject 
    });
    
    try {
      bridgeProcess.stdin.write(JSON.stringify(obj) + '\n');
    } catch (e) {
      reject(e);
    }
  });
}
