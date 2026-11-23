import { digest } from './arithmetic.mjs';
import assert from 'node:assert/strict';
export const cacheShape = {
  tensors: 2,
  layers: 4,
  positions: 128,
  kvHeads: 2,
  headWidth: 8,
  bytes: 2,
};
export const cacheBytes = Object.values(cacheShape).reduce((product, value) => product * value, 1);
export const compatible = {
  source: {
    model: 'M17',
    revision: 5,
    layout: 'TP2',
    dtype: 'bf16',
    blocks: 'paged-v2',
  },
  workerA: {
    model: 'M17',
    revision: 5,
    layout: 'TP2',
    dtype: 'bf16',
    blocks: 'paged-v2',
    freeBlocks: 60,
  },
  workerB: {
    model: 'M17',
    revision: 5,
    layout: 'TP1',
    dtype: 'bf16',
    blocks: 'paged-v2',
    freeBlocks: 72,
  },
};
export const events = [
  'queued',
  'reserved',
  'transferring',
  'transfer-complete',
  'decode-ready',
  'generated',
  'delivered',
];
export const expectedBlockIds = ['r0:0–7', 'r0:8–15', 'r0:16–23', 'r1:0–7', 'r1:8–15', 'r1:16–23'];
export const segmentData = Object.fromEntries(
  expectedBlockIds.map((id) => [id, Buffer.from(`request 4219 KV segment ${id}`)]),
);
export const trustedDigests = Object.fromEntries(
  Object.entries(segmentData).map(([id, bytes]) => [id, digest(bytes)]),
);
export const expiredAttempt = {
  operation: 'op-17',
  generation: 4,
  state: 'retired',
  expected: expectedBlockIds,
  received: expectedBlockIds.slice(0, 4),
  transportQuiescent: false,
  consumersQuiescent: false,
  chargedBlocks: 48,
  manifest: compatible.source,
  segmentData,
  visibility: 'ready',
};
export const completedAttempt = {
  ...expiredAttempt,
  state: 'transferring',
  received: expectedBlockIds,
};
export const fullyQuiescentAttempt = {
  ...expiredAttempt,
  transportQuiescent: true,
  consumersQuiescent: true,
};
export function buildProductionPayload() {
  const productionPayload = {
    bytesPerToken: 2 * 80 * 8 * 128 * 2,
    promptTokens: 8192,
    blockTokens: 16,
    outputCap: 128,
  };
  productionPayload.bytes = productionPayload.bytesPerToken * productionPayload.promptTokens;
  productionPayload.blockBytes = productionPayload.bytesPerToken * productionPayload.blockTokens;
  assert.equal(productionPayload.bytes, 2.5 * 1024 ** 3);
  assert.equal(productionPayload.blockBytes, 5 * 1024 ** 2);
  assert.equal(Math.floor(8192 / 2600), 3);
  return {
    productionPayload,
  };
}
export const { productionPayload } = buildProductionPayload();
