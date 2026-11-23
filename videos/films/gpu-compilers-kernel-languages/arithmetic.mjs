import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.68);
  return q * q * (3 - 2 * q);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export function vectorLane(index) {
  const x = index * 0.25;
  const y = (index % 7) - 3;
  return { x, y, sum: x + y };
}
// Both captured packages contain compute_90 PTX. This comparison disables its JIT
// on the same 12.0 device, using the known native compatibility of these two images.
export const nativeOnlyRuns = [
  { build: 'A', image: 'sm_120', selection: resolve(true, false) },
  { build: 'B', image: 'sm_90', selection: resolve(false, false) },
];
export function enumeratedAccesses(n, block, inclusive) {
  return coverage(n, block)
    .flat()
    .filter(({ index }) => (inclusive ? index <= n : index < n))
    .map(({ index }) => index);
}
export function residency(r) {
  const perWarp = Math.ceil((32 * r) / 256) * 256,
    perBlock = perWarp * 8,
    blocks = Math.min(Math.floor(65536 / perBlock), 8);
  return {
    r,
    perWarp,
    perBlock,
    blocks,
    warps: blocks * 8,
    occupancy: blocks / 8,
  };
}
export function coverage(n, block) {
  return Array.from(
    {
      length: Math.ceil(n / block),
    },
    (_, program) =>
      Array.from(
        {
          length: block,
        },
        (_, lane) => ({
          index: program * block + lane,
          valid: program * block + lane < n,
        }),
      ),
  );
}
export function resolve(native, ptx) {
  return native ? 'LOAD NATIVE' : ptx ? 'JIT THEN LOAD' : 'MISSING IMAGE';
}
export function specializationFixture(factor, rebuild) {
  const source = '(x + y) * HEADER_SCALE',
    key = (scale) =>
      JSON.stringify({
        source,
        header: {
          scale,
        },
        target: 'JS teaching miniature',
        dtype: 'number',
      });
  const compile = (scale) => (x, y) => (x + y) * scale,
    old = compile(1),
    cache = new Map([[key(1), old]]),
    recipe = key(factor),
    hit = cache.has(recipe);
  if (!hit && rebuild) cache.set(recipe, compile(factor));
  return {
    factor,
    cached: old(4, 5),
    required: compile(factor)(4, 5),
    keyMatches: hit,
    compiled: !hit && cache.has(recipe),
    current: cache.get(recipe)?.(4, 5) ?? null,
  };
}
export function liveSlots(extend = false) {
  const intervals = [
    {
      id: 'A',
      start: 0,
      end: extend ? 5 : 3,
    },
    {
      id: 'B',
      start: 2,
      end: 6,
    },
    {
      id: 'C',
      start: 4,
      end: 7,
    },
  ];
  return {
    intervals,
    counts: Array.from(
      {
        length: 8,
      },
      (_, i) => intervals.filter((x) => x.start <= i && x.end >= i).length,
    ),
    required: extend ? 3 : 2,
  };
}
export function tailSummary(n, block) {
  assert(Number.isSafeInteger(n) && n >= 0 && Number.isSafeInteger(block) && block > 0);
  const blocks = Math.floor(n / block) + (n % block !== 0 ? 1 : 0),
    positions = blocks * block;
  return {
    n,
    block,
    blocks,
    positions,
    valid: n,
    masked: positions - n,
    lastValid: n === 0 ? 0 : n % block || block,
  };
}
export function recipeDigest(overrides = {}) {
  const recipe = {
    source: 'vector_add.cu@article',
    toolchain: 'nvcc13.2.78',
    target: 'sm_120',
    flags: ['-O3', '-lineinfo'],
    shape: [1000],
    stride: [1],
    dtype: 'float32',
    block: 256,
    warps: 4,
    stages: 2,
    ...overrides,
  };
  return createHash('sha256').update(JSON.stringify(recipe)).digest('hex');
}
export function artifactDigest(bytes) {
  return createHash('sha256').update(Uint8Array.from(bytes)).digest('hex');
}
export function publishedPair(kernelBytes, manifest) {
  const actual = artifactDigest(kernelBytes);
  const expected = manifest.kernelSha256;
  return { actual, expected, matches: actual === expected };
}
export function coldPhases(native = false) {
  let end = 0;
  return [
    ['initialize', 10],
    ['load module', 5],
    ...(native ? [] : [['PTX JIT', 60]]),
    ['publish cache', 2],
    ['first launch', 1],
  ].map(([id, duration]) => {
    const start = end;
    end += duration;
    return {
      id,
      duration,
      start,
      end,
    };
  });
}
