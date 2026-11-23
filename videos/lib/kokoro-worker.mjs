import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const wrapper = fileURLToPath(new URL('../adapters/course-kokoro-worker.py', import.meta.url));

export class KokoroWorkerExit extends Error {}

function startWorker(uv, adapter, cwd) {
  const child = spawn(uv, ['run', wrapper, adapter], {
    cwd,
    detached: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let active;
  let stopped = false;
  let stderr = '';
  let lastDevice;
  child.stderr.setEncoding('utf8').on('data', (chunk) => {
    stderr = (stderr + chunk).slice(-4096);
  });
  const failed = (reason) => {
    stopped = true;
    active?.reject(new KokoroWorkerExit('Kokoro worker stopped: ' + reason + '\n' + stderr));
    active = undefined;
  };
  const closed = new Promise((resolve) => {
    child.once('error', (error) => failed(error.message));
    child.once('close', (code, signal) => {
      failed(signal ?? code);
      resolve();
    });
  });
  child.stdin.on('error', (error) => failed(error.message));
  const lines = createInterface({ input: child.stdout });
  lines.on('line', (line) => {
    try {
      const response = JSON.parse(line);
      if (!active || typeof response.ok !== 'boolean')
        throw new Error('Unexpected worker response');
      if (
        response.ok &&
        process.env.LEETLLM_KOKORO_DEVICE === 'mps' &&
        response.device !== lastDevice
      ) {
        if (response.device === 'mps' || response.device === 'cpu') {
          lastDevice = response.device;
          process.stderr.write('Kokoro narration device: ' + lastDevice + '\n');
        }
      }
      if (response.ok) active.resolve();
      else active.reject(new Error('Kokoro could not record take: ' + response.error));
      active = undefined;
    } catch (error) {
      failed(error.message);
      child.stdin.end();
    }
  });
  return {
    record(request) {
      if (stopped) throw new KokoroWorkerExit('Kokoro worker already stopped: ' + stderr);
      return new Promise((resolve, reject) => {
        active = { resolve, reject };
        child.stdin.write(JSON.stringify(request) + '\n');
      });
    },
    async close() {
      child.stdin.end();
      // EOF releases the Python worker even while it waits for an inference slot.
      const timer = new AbortController();
      try {
        await Promise.race([
          closed,
          delay(2000, null, { signal: timer.signal }).then(() => {
            try {
              process.kill(-child.pid, 'SIGKILL');
            } catch (error) {
              if (error.code !== 'ESRCH') throw error;
            }
          }),
        ]);
      } finally {
        timer.abort();
      }
      await closed;
    },
  };
}

/** A film starts the worker on its first uncached take. Concurrent callers share one model. */
export function createKokoroWorker({ uv, adapter, cwd, signal }) {
  let session;
  let queue = Promise.resolve();
  let closing = false;
  async function close() {
    closing = true;
    signal?.removeEventListener('abort', abort);
    await session?.close();
  }
  const abort = () => {
    void close();
  };
  signal?.addEventListener('abort', abort, { once: true });
  return {
    record(request) {
      const result = queue.then(async () => {
        const binary = await uv();
        if (closing || signal?.aborted) throw new Error('Kokoro worker closed');
        session ??= startWorker(binary, adapter, cwd);
        try {
          await session.record(request);
        } catch (error) {
          if (error instanceof KokoroWorkerExit) {
            await session.close();
            session = undefined;
          }
          throw error;
        }
      });
      queue = result.catch(() => {});
      return result;
    },
    close,
  };
}
