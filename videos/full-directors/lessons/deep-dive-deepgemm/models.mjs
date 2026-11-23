import {
  alignExpertRows, compareReturnedRows, compressedKeySelection, expertProjectionFlops,
  expertWeightedReturn, gemmTile, indexerReference, scaledDot, sparseCachePosition,
} from '../../../films/deep-dive-deepgemm/arithmetic.mjs';
import {
  counts, finalRuns, freshReference, freshRows, layerRuns, parallel, routedReturns, serial,
} from '../../../films/deep-dive-deepgemm/fixtures.mjs';

export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const pack = (rows, alignment) => {
  const data = alignExpertRows(rows, alignment);
  return { ...data, blocks: data.capacities.map(n => n / alignment),
    usefulWork: expertProjectionFlops(data.useful) / 1e9,
    fullWork: expertProjectionFlops(data.capacity) / 1e9 };
};
export const original = counts;
export const plusOne = counts.map((n, i) => n + Number(i === 3));
export function openingRows(loaded, docked) {
  const rows = [...original];
  rows[3] = Math.floor(original[3]*loaded) + Number(docked);
  return rows;
}
export const packedStart = (data, expert) => sum(data.capacities.slice(0, expert));
export const matrix = gemmTile(1);
export const ntShape = {M:512,N:4096,K:4096};
export const ntWork = 2*ntShape.M*ntShape.N*ntShape.K/1e9;
export const scaled = scaledDot();
export const groups = scaled.sa.map((aScale, i) => ({
  a: scaled.a.slice(2*i, 2*i+2), b: scaled.z.slice(2*i, 2*i+2),
  aScale, bScale: scaled.sz[i], raw: scaled.raw[i], factor: scaled.products[i], part: scaled.partial[i],
  width: 32, tail: Array(30).fill(0),
}));
export const storedKey = [2, -1];
export const keyScale = .5;
export const heads = indexerReference(storedKey.map(v => v * keyScale));
export const scores = [.2, .9, 99];
export const range = (end) => compressedKeySelection(scores, 40, end, 2);
export const unboundedColumn = scores.indexOf(Math.max(...scores));
export const sparse = { blocks: [2, 5], width: 4, column: 5 };
export const sparseWinner = sparseCachePosition(sparse.blocks, sparse.width, sparse.column);
export const strides = [[9, 2], [3, 1]];
export const coordinate = [2, 1];
export const address = stride => sum(coordinate.map((v, i) => v * stride[i]));
export const requests = [
  { id: 'A', rows: 64, flag: 'F', dump: false },
  { id: 'B', rows: 96, flag: 'F', dump: false },
  { id: 'C', rows: 96, flag: 'F₂', dump: false },
  { id: 'D', rows: 96, flag: 'F₂', dump: true },
];
export function cacheTrace(completed) {
  const entries = new Map();
  const calls = requests.slice(0, completed).map(call => {
    const signature = ['S', call.flag, 'C'].join('/');
    const hit = entries.has(signature);
    if (!hit) entries.set(signature, {binary: entries.size + 1, dump: call.dump});
    return {...call, ...entries.get(signature), requestedDump: call.dump, hit, signature};
  });
  return { calls, entries: [...entries.values()], builds: entries.size, hits: calls.length - entries.size };
}
export const timings = layerRuns.map(run => ({...run, total: run.prep + run.kernel}));
export const flash = { ranks: 8, perRank: 512, experts: 256, topK: 6, hidden: 4096, intermediate: 2048, us: 146.5, ratio: 1.73 };
export const pro = {...flash,experts:384,hidden:7168,intermediate:3072,us:369.6,ratio:1.54};
export const directBf16 = (hasC) => ({hasC, output:'BF16', accepted:!hasC});
export const nodeTokens = flash.perRank * flash.ranks;
export const assignments = nodeTokens * flash.topK;
export const balanced = assignments / flash.ranks;
export function scheduleState(slots, time, delayed = false, allowB = true) {
  const base = slots === 1 ? serial : parallel;
  const events = delayed ? base.map(e => {
    if (e.id === 'A combine') return {...e,start:5,end:6};
    if (e.id === 'B combine') return {...e,start:6,end:7};
    return e;
  }) : base;
  const end = Math.max(...events.map(event => event.end));
  time = Math.min(end, Math.max(0, time));
  const slotOwners = Array.from({length: slots}, (_, i) => {
    for (const [j, owner] of ['A', 'B'].entries()) {
      if (owner === 'B' && !allowB) continue;
      const first = events.find(e => e.id === owner + ' dispatch');
      const last = events.find(e => e.id === owner + ' combine');
      if (j % slots === i && time >= first.start && time < last.end) return owner;
    }
    return null;
  });
  return {slots, time, events, end, slotOwners};
}
export const weighted = routedReturns.map(r => ({...r, ...expertWeightedReturn(r.values, r.weights)}));
export const fp = Math.fround;
export const large = 2 ** 25;
export const reductions = [
  [fp(large + 1), fp(fp(large + 1) - large)],
  [fp(large - large), fp(fp(large - large) + 1)],
];
export const outcomes = finalRuns.map(run => ({...run, ...compareReturnedRows(freshReference.values, run.returned)}));
export {freshRows, freshReference};
