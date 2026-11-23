import { createHash } from 'node:crypto';
export const sameLayout = (a, b) =>
  ['model', 'revision', 'layout', 'dtype', 'blocks'].every((key) => a[key] === b[key]);
export const eligibleWorker = (source, worker, requestedBlocks) =>
  sameLayout(source, worker) && worker.freeBlocks >= requestedBlocks;
export const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function allocate(free, requests) {
  let used = 0;
  return requests.map((blocks) => {
    if (used + blocks > free) return false;
    used += blocks;
    return true;
  });
}
export function traceWithQueue(delay) {
  const earlyKvReady = 150,
    setupDone = 150,
    transferStart = Math.max(earlyKvReady, setupDone) + delay;
  return [
    {
      name: 'prefill',
      start: 0,
      end: 180,
    },
    {
      name: 'transfer-setup',
      start: 0,
      end: 150,
    },
    {
      name: 'queue',
      start: 150,
      end: 150 + delay,
    },
    {
      name: 'transfer',
      start: transferStart,
      end: transferStart + 180,
    },
    {
      name: 'decode-to-first-token',
      start: transferStart + 180,
      end: transferStart + 250,
    },
  ];
}
