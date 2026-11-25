import { spawn } from 'node:child_process';
import { getCompileCacheDir } from 'node:module';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const cache = getCompileCacheDir();
if (!cache) throw new Error('Set NODE_COMPILE_CACHE before preparing the production cache.');

const port = 8080;
const routes = [
  { path: '/', expectedStatus: 200 },
  { path: '/learn', expectedStatus: 200 },
  { path: '/learn/numpy-and-tensor-shapes', expectedStatus: 200 },
  { path: '/blog', expectedStatus: 200 },
  { path: '/blog/how-we-built-leetllm', expectedStatus: 200 },
  { path: '/practice', expectedStatus: 200 },
  { path: '/practice/stack-trace-reconstructor', expectedStatus: 200 },
  { path: '/glossary', expectedStatus: 200 },
  { path: '/tracks', expectedStatus: 200 },
  { path: '/robots.txt', expectedStatus: 200 },
  { path: '/api/md/numpy-and-tensor-shapes', expectedStatus: 200 },
  { path: '/api/search/learn?q=attention', expectedStatus: 200 },
  { path: '/api/glossary?q=attention', expectedStatus: 200 },
  { path: '/api/glossary/ab-testing', expectedStatus: 200 },
  { path: '/cdn/content-image/blog/how-we-built-leetllm/illustrations/_generated/content_pipeline_dark.png?w=640', expectedStatus: 200 },
  { path: '/nonexistent-prewarm-404', expectedStatus: 404 },
];
const server = spawn(process.execPath, ['server.js'], {
  env: { ...process.env, HOSTNAME: '127.0.0.1', PORT: String(port) },
  stdio: ['ignore', 'ignore', 'pipe'],
});
let errorOutput = '';
server.stderr.setEncoding('utf8');
server.stderr.on('data', (chunk) => {
  errorOutput = (errorOutput + chunk).slice(-4000);
});
let stopped;
const exit = new Promise((resolve) => {
  server.once('exit', (code, signal) => {
    stopped = { code, signal };
    resolve(stopped);
  });
  server.once('error', (error) => {
    stopped = { error };
    resolve(stopped);
  });
});

async function stopServer() {
  const requestedStop = !stopped;
  if (requestedStop) server.kill('SIGTERM');
  let timeout;
  try {
    const result = await Promise.race([
      exit,
      new Promise((resolve) => {
        timeout = setTimeout(() => resolve(null), 5000);
      }),
    ]);
    if (result === null) {
      server.kill('SIGKILL');
      await exit;
      throw new Error('Production cache preparation could not stop the server cleanly.');
    }
    if (result.error) throw result.error;
    const expectedTermination =
      requestedStop && (result.code === 143 || result.signal === 'SIGTERM');
    if (result.code !== 0 && !expectedTermination) {
      throw new Error(
        `Cache preparation server exited with ${result.code ?? result.signal}: ${errorOutput}`,
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}

try {
  const deadline = Date.now() + 30_000;
  let ready = false;
  while (Date.now() < deadline) {
    if (stopped)
      throw new Error(`Cache preparation server stopped before readiness: ${errorOutput}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/learn`, {
        signal: AbortSignal.timeout(2000),
      });
      await response.arrayBuffer();
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* The listening socket is not available during startup. */
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  if (!ready) throw new Error(`Production cache preparation did not become ready: ${errorOutput}`);
  for (const { path: route, expectedStatus } of routes) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, {
      signal: AbortSignal.timeout(5000),
    });
    await response.arrayBuffer();
    if (response.status !== expectedStatus)
      throw new Error(
        `Cache preparation returned HTTP ${response.status} (expected ${expectedStatus}) for ${route}`,
      );
  }
} finally {
  await stopServer();
}

let files = 0,
  bytes = 0;
async function inventory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await inventory(file);
    else if (entry.isFile()) {
      files++;
      bytes += (await stat(file)).size;
    }
  }
}
await inventory(cache);
if (!files) throw new Error('The production server did not flush any compiled modules.');
console.log(
  `Prepared ${files} compiled modules (${bytes} bytes) for the production Node version and user.`,
);
