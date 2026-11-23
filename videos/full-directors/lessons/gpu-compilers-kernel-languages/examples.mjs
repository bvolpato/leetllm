import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const instructions = [
  ['0110', 'LDG.E', 'R4, […]'], ['0120', 'LDG.E', 'R7, […]'],
  ['0140', 'FADD', 'R9, R4, R7'], ['0150', 'STG.E', '[…], R9'],
];
export const vector = i => [0.25 * i, i % 7 - 3];
const floatView = new DataView(new ArrayBuffer(4));
export function bits(value) {
  floatView.setFloat32(0, value);
  return floatView.getUint32(0);
}
export const hex = word => word.toString(16).toUpperCase().padStart(8, '0');
export function replay(i, stored) {
  const [r4, r7] = vector(i);
  const r9 = Math.fround(r4 + r7);
  const word = bits(r9);
  return { r4, r7, r9, word, output: stored ? word : 0xffffffff };
}

// This product and sum are exact in binary64 for these integer inputs.
const factor = 4097, addend = -16785408;
const exactProduct = factor * factor;
const roundedProduct = Math.fround(exactProduct);
floatView.setUint32(0,bits(roundedProduct) + 1);
const nextFloat = floatView.getFloat32(0);
export const contraction = {
  ptx: ['mul.f32 p, a, b;', 'add.f32 d, p, c;'],
  native: ['FFMA R3, R0, R1, R2'],
  factor, addend, exactProduct, roundedProduct, nextFloat,
  fused: Math.fround(exactProduct + addend),
  separate: Math.fround(roundedProduct + addend),
};

// These cases use ordinary desktop targets. Capability codes follow CUDA target spelling.
export const fallbackTarget = 90;
export const capturedGpu = { capability: 120, readsIsa: true };
export const olderGpu = { capability: 86, readsIsa: true };
export const olderDriver = { capability: 120, readsIsa: false };
export const capabilityLabel = code => Math.floor(code / 10) + '.' + (code % 10);

export function nativeFits(cubin, capability) {
  return Math.floor(cubin / 10) === Math.floor(capability / 10) && cubin <= capability;
}
export function selection(cubin, ptxTarget, mode, { capability, readsIsa }) {
  if (mode !== 'force PTX' && nativeFits(cubin, capability)) return 'Load native cubin';
  if (mode !== 'native only' && ptxTarget != null && capability >= ptxTarget && readsIsa) {
    return 'Compile PTX, then load';
  }
  return 'Stop before launch';
}

export const phases = [
  ['Initialize', 10], ['Load module', 5], ['PTX JIT', 60],
  ['Publish', 2], ['Launch', 1],
];
export function intervals(native) {
  let time = 0;
  return phases.map(([name, delay]) => {
    const duration = native && name === 'PTX JIT' ? 0 : delay;
    const start = time;
    time += duration;
    return { name, start, duration, end: time };
  });
}
export const warmMs = 0.03;

export function allocation(registers) {
  const requested = registers * 32;
  const units = Math.ceil(requested / 256);
  const perWarp = units * 256;
  const perBlock = perWarp * 8;
  const blocks = Math.min(Math.floor(65536 / perBlock), 64 / 8);
  return { registers, requested, units, perWarp, perBlock, blocks,
    warps: blocks * 8, free: 65536 - blocks * perBlock };
}
export function lifetimes(extended) {
  const spans = [[0, extended ? 5 : 3], [2, 6], [4, 7]];
  const counts = Array.from({length: 8}, (_, i) => spans.filter(([start,end]) => start <= i && i <= end).length);
  return { spans, peak: Math.max(...counts) };
}
export const spill = { read: 4, write: 4, repeats: 20 };
export const requestedBytes = ({read, write, repeats}) => (read + write) * repeats;

export const mainLine = 'out[i] = SCALE * (x[i] + y[i]);';
export const includeLine = '#include "scale.cuh"';
const source = [includeLine, mainLine].join('\n');
const header = scale => '#define SCALE ' + scale;
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const identity = (scale, complete) => digest(JSON.stringify(complete ? [source, header(scale), 'float32', 'sm_120'] : [source]));
export function lookup(scale, complete) {
  const old = { scale: 1 };
  const cache = new Map([[identity(old.scale, complete), old]]);
  const key = identity(scale, complete);
  const hit = cache.has(key);
  const image = hit ? cache.get(key) : { scale };
  return { hit, key, image: image.scale, result: image.scale * (4 + 5) };
}
export const artifactA = Buffer.from([83, 73, 77, 84, 1, 2, 3, 4]);
export const artifactB = Buffer.from([83, 73, 77, 84, 2, 2, 3, 4]);
export function publication(replaced) {
  const bytes = replaced ? artifactB : artifactA;
  const actual = digest(bytes), expected = digest(artifactA);
  return { bytes, actual, expected, matches: actual === expected };
}
export function access(n, width, inclusive) {
  const count = Math.floor(n / width) + Number(n % width !== 0);
  const lanes = Array.from({length: count * width}, (_, i) => ({
    i, admit: inclusive ? i <= n : i < n, exists: i < n,
  }));
  return { lanes, count, masked: lanes.filter(l => !l.admit).length,
    extra: lanes.find(l => l.admit && !l.exists)?.i,
    valid: lanes.filter(l => l.admit && l.exists).length };
}
export const inputsNki = [2, 3, 4, 5];
export const addOne = values => values.map(v => v + 1);
export const tile = Array.from({length: 16}, (_, i) => i);
export const incrementedTile = addOne(tile);
export const tailLength = 769, blockWidth = 128;
export const owners = (thread, width) => Array.from({length: width}, (_, i) => thread * width + i);

export function check() {
  assert.deepEqual([contraction.ptx.length, contraction.native.length], [2,1]);
  assert.deepEqual([contraction.exactProduct, contraction.roundedProduct, contraction.fused, contraction.separate],
    [16785409,16785408,1,0]);
  assert.equal((contraction.roundedProduct + contraction.nextFloat) / 2, contraction.exactProduct);
  assert.deepEqual(incrementedTile, Array.from({length: 16}, (_, i) => i + 1));
  assert.deepEqual(tile, Array.from({length: 16}, (_, i) => i));
  assert.deepEqual(replay(1,false), { r4:0.25, r7:-2, r9:-1.75, word:0xbfe00000, output:0xffffffff });
  assert.equal(replay(1,true).output, replay(1,false).word);
  assert.equal(replay(2,true).r9,-0.5);
  assert.deepEqual([replay(768,false).output,replay(768,true).r9,replay(768,true).output],
    [0xffffffff,194,bits(194)]);
  const native = 'Load native cubin', jit = 'Compile PTX, then load', stop = 'Stop before launch';
  assert.equal(selection(120, fallbackTarget, 'native only', capturedGpu), native);
  assert.equal(selection(120, fallbackTarget, 'force PTX', capturedGpu), jit);
  assert.equal(selection(90, fallbackTarget, 'native only', capturedGpu), stop);
  assert.equal(selection(90, fallbackTarget, 'force PTX', capturedGpu), jit);
  assert.equal(selection(90, null, 'normal', capturedGpu), stop);
  assert.equal(selection(90, fallbackTarget, 'force PTX', olderGpu), stop);
  assert.equal(selection(90, fallbackTarget, 'force PTX', olderDriver), stop);
  assert.equal(selection(90, fallbackTarget, 'force PTX', {capability: 90, readsIsa: true}), jit);
  assert.deepEqual([false,true].map(n => intervals(n).at(-1).end),[78,18]);
  for (const [r,units,blocks,free] of [[32,4,8,0],[33,5,6,4096],[37,5,6,4096],[40,5,6,4096],[41,6,5,4096]]) {
    const a = allocation(r);
    assert.deepEqual([a.units,a.blocks,a.free,a.warps],[units,blocks,free,blocks*8]);
    assert(a.perBlock*(blocks+1)>65536);
  }
  assert.deepEqual([lifetimes(false).peak,lifetimes(true).peak,requestedBytes(spill)],[2,3,160]);
  assert.equal(requestedBytes({read:8,write:4,repeats:50}),600);
  assert.deepEqual([lookup(1,true),lookup(2,false),lookup(2,true)].map(v=>[v.hit,v.image,v.result]),
    [[true,1,9],[true,1,9],[false,2,18]]);
  assert.notEqual(lookup(1,true).key,lookup(2,true).key);
  assert.equal(lookup(1,false).key,lookup(2,false).key);
  assert.equal(publication(false).matches,true);
  assert.equal(publication(true).matches,false);
  assert.deepEqual(owners(1,2),[2,3]);
  assert.deepEqual(addOne(inputsNki),[3,4,5,6]);
  for (const [n,w] of [[10,4],[515,128],[768,128],[769,128]]) {
    const a=access(n,w,false);
    assert.deepEqual(a.lanes.filter(l=>l.admit).map(l=>l.i),Array.from({length:n},(_,i)=>i));
  }
  assert.equal(access(768,128,true).extra,undefined);
  assert.equal(access(769,128,true).extra,769);
  assert.deepEqual([access(769,128,false).count,access(769,128,false).masked],[7,127]);
  const lastIndex = tailLength - 1;
  assert.deepEqual([Math.floor(lastIndex / blockWidth), lastIndex % blockWidth, lastIndex], [6,0,768]);
}
