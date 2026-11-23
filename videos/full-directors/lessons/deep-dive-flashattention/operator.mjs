import assert from 'node:assert/strict';

export const scores = [1, 2, 3, 0];
export const values = [[10, 0], [0, 10], [5, 5], [9, 1]];
export const words = ['Birds', 'sing', 'softly', 'Rain', 'falls'];
export const wordValues = [2, 4, 8, 100, 200];
export const sum = xs => xs.reduce((s, x) => s + x, 0);
export const bytes = (items, heads, q, k, width) => items * heads * q * k * width;
export const lseBytes = (items, heads, q) => items * heads * q * 4;
export const unit = 2 ** 30;
export const decimals = (x, n = 3) => x.toFixed(n);
export const vector = (v, n = 3) => '[' + v.map(x => decimals(x, n)).join(', ') + ']';

function empty(dim) {
  return {max: -Infinity, mass: 0, u: Array(dim).fill(0)};
}

function merge(old, ss, vv) {
  const max = Math.max(old.max, ...ss);
  if (!ss.some(Number.isFinite)) return old;
  const factor = Math.exp(old.max - max);
  const weights = ss.map(s => Math.exp(s - max));
  return {
    max,
    mass: old.mass * factor + sum(weights),
    u: old.u.map((v, d) => v * factor + sum(vv.map((row, j) => row[d] * weights[j]))),
  };
}

export const first = merge(empty(2), scores.slice(0, 2), values.slice(0, 2));
export const merged = merge(first, scores.slice(2), values.slice(2));
export const output = merged.u.map(v => v / merged.mass);
export const lse = merged.max + Math.log(merged.mass);
export const probabilities = scores.map(s => Math.exp(s - lse));
export const shiftedOld = amount => {
  const factor = Math.exp((first.max - merged.max) * amount);
  return {factor, mass: first.mass * factor, u: first.u.map(v => v * factor)};
};

// The arriving maximum contributes a complete unit before the last key joins it.
export function mergeBars(shrink, incomingCount) {
  const old = shiftedOld(shrink);
  const weights = scores.slice(2, 2 + incomingCount).map(s => Math.exp(s - merged.max));
  const additions = [sum(weights), ...old.u.map((_, d) =>
    sum(weights.map((w, i) => w * values[2 + i][d])))];
  const retained = [old.mass, ...old.u];
  return {factor: old.factor, retained, additions, totals: retained.map((v, i) => v + additions[i])};
}

export function replay(numeratorRescale) {
  const { retained, additions, totals } = mergeBars(numeratorRescale, 2);
  const result = totals.slice(1).map(v => v / merged.mass);
  return { oldValues: retained.slice(1), newValues: additions.slice(1), result, total: sum(result) };
}

export function dense(ss, vv) {
  const max = Math.max(...ss);
  if (max === -Infinity) return vv[0].map(() => 0);
  const w = ss.map(s => Math.exp(s - max));
  return vv[0].map((_, d) => sum(vv.map((row, j) => row[d] * w[j])) / sum(w));
}
export const denseOutput = dense(scores, values);
export function rowResult(vals, keep) {
  const selected = vals.filter((_, k) => keep[k]);
  return {keep, count: selected.length, total: sum(selected), mean: selected.length ? sum(selected) / selected.length : 0};
}
export function causal(q, vals, corner = 'right', left = Infinity) {
  return Array.from({length: q}, (_, i) => {
    const stop = i + (corner === 'right' ? vals.length - q : 0);
    return rowResult(vals, vals.map((_, j) => j <= stop && j >= stop - left));
  });
}
export const decode = [10, 20, 30, 40, 50];
export const transfer = [6, 12, 24];
export const pack = cut => ({
  offsets: [0, cut, words.length],
  owners: words.map((_, i) => i < cut ? 'A' : 'B'),
  result: rowResult(wordValues, words.map((_, j) => j < cut)),
});
export const padding = [false, true];
export const maskValues = [10, 1000];
export const polarity = invert => rowResult(maskValues, padding.map(v => invert ? !v : v));
export const pageTable = [2, 0], pageSize = 256, used = 270;
export function page(id) {
  const logical = pageTable.indexOf(id);
  const live = logical < 0 ? 0 : Math.min(pageSize, Math.max(0, used - logical * pageSize));
  return {logical, live, loaded: logical >= 0, pad: logical < 0 ? 0 : pageSize - live};
}
export const heads = (q, kv) => Array.from({length: q}, (_, i) => Math.floor(i / (q / kv)));
export const group = heads(6, 2);
export const gp = [.25, .75], dp = [1, 5];
export const correction = sum(gp.map((p, i) => p * dp[i]));
export const ds = gp.map((p, i) => p * (dp[i] - correction));

const cases = [
  ['Square', [[1, 0],[0, 1]], [10, 20], [[1, 1],[1, 1]]],
  ['Tail decode', [[1, 2, 3]], [2, 4, 8], [[1, 1, 1]]],
  ['Empty row', [[1, 2]], [10, 20], [[0, 0]]],
  ['Packed', [[1, 2, 9, 8],[9, 8, 1, 2]], [10, 20, 100, 200], [[1, 1, 0, 0],[0, 0, 1, 1]]],
];
export function compareCases(wrong) {
  return cases.map(([name, rows, vs, mask], n) => {
    const vv = vs.map(x => [x]);
    const tiled = rows.map((row, i) => {
      let state = empty(1);
      for (let j = 0; j < row.length; j++) state = merge(state, [mask[i][j] ? row[j] : -Infinity], [vv[j]]);
      return state.mass ? state.u[0] / state.mass : 0;
    });
    const keep = n === 1 && wrong ? [[1, 0, 0]] : mask;
    const ref = rows.map((row, i) => dense(row.map((s, j) => keep[i][j] ? s : -Infinity), vv)[0]);
    const diff = Math.max(...ref.map((x, i) => Math.abs(x - tiled[i])));
    return {name, tiled, ref, diff, keep, mask};
  });
}
export const shapes = {A: [128, 2], B: [64, 1]};
export function runCache(order, repaired) {
  const map = new Map();
  return Array.from(order, name => {
    const [q,k] = shapes[name], ratio = q / k;
    const key = repaired ? ratio + ' / ' + k : String(ratio);
    if (!map.has(key)) map.set(key, name);
    return {name, key, owner: map.get(key), ok: map.get(key) === name};
  });
}
export const fallback = items => {
  const each = bytes(1, 4, 5, transfer.length, 4), total = each * items;
  return {each, total, fits: total <= 512};
};
export const trace = {submit: 0, start: 1, returned: 2, end: 41};
const near = (x, y) => assert.ok(Math.abs(x-y) < 1e-10, `${x} != ${y}`);
export function checkOperator() {
  assert.equal(bytes(8,32,8192,8192,2) / unit, 32);
  assert.equal(lseBytes(8,32,8192) / 2**20, 8);
  assert.equal(first.max, 2);
  assert.equal(merged.max, 3);
  near(first.mass, 1 + 1/Math.E);
  near(first.u[0], 10/Math.E); near(first.u[1], 10);
  for (const t of [0,.5,1]) {
    const s = shiftedOld(t);
    near(s.mass, sum(scores.slice(0,2).map(v => Math.exp(v - 2 - t))));
    near(s.u[0], 10 * Math.exp(-1-t)); near(s.u[1], 10*Math.exp(-t));
  }
  assert.ok(merged.mass >= 1);
  const partial = mergeBars(1, 1);
  assert.deepEqual(partial.additions, [1, 5, 5]);
  near(partial.totals[0], first.mass / Math.E + 1);
  mergeBars(1, 2).totals.forEach((v,i) => near(v,[merged.mass,...merged.u][i]));
  const [faulty, repairing, fixed] = [0, .5, 1].map(replay);
  const valueTotal = sum(values[0]);
  values.forEach(v => near(sum(v), valueTotal));
  assert.equal(decimals(faulty.total), '15.568');
  near(fixed.total, valueTotal);
  fixed.result.forEach((v, i) => near(v, denseOutput[i]));
  for (const [i, incoming] of faulty.newValues.entries()) {
    near(repairing.newValues[i], incoming);
    near(fixed.newValues[i], incoming);
    near(repairing.result[i], (first.u[i] * Math.exp(-.5) + incoming) / merged.mass);
  }
  assert.equal(vector(output), '[4.380, 5.620]');
  for (const chunk of [1,2,3,4]) {
    for (const shift of [-1000, 0, 1000]) {
      let acc = empty(2);
      for (let i=0; i<scores.length; i+=chunk) acc = merge(acc, scores.slice(i,i+chunk).map(n=>n+shift), values.slice(i,i+chunk));
      acc.u.forEach((u,d)=>near(u/acc.mass, denseOutput[d]));
    }
  }
  assert.deepEqual(merge(empty(2), [-Infinity,-Infinity], values.slice(0,2)), empty(2));
  near(sum(probabilities),1);
  output.forEach((x,d) => near(x,sum(probabilities.map((p,j)=>p*values[j][d]))));
  assert.deepEqual(causal(2,decode,'left').map(r=>r.mean),[10,15]);
  assert.deepEqual(causal(2,decode).map(r=>r.mean),[25,30]);
  assert.deepEqual(causal(2,decode,'right',1).map(r=>r.mean),[35,45]);
  assert.deepEqual(causal(5,transfer).map(r=>r.mean),[0,0,6,9,14]);
  for(const [cut,owners,total,mean] of [[3,'AAABB',14,14/3],[4,'AAAAB',114,28.5]]) {
    const s=pack(cut); assert.deepEqual(s.offsets,[0,cut,5]); assert.equal(s.owners.join(''),owners);
    assert.equal(s.result.total,total); assert.equal(s.result.count,cut); near(s.result.mean,mean);
  }
  assert.deepEqual([polarity(false).mean,polarity(true).mean],[1000,10]);
  assert.equal(page(2).live,256); assert.equal(page(0).live,14); assert.equal(page(0).pad,242); assert.equal(page(1).loaded,false);
  assert.ok(Number.isNaN(0*NaN)); assert.equal(0*0,0);
  near(correction,4); assert.deepEqual(ds,[-.75,.75]); near(sum(ds),0);
  assert.deepEqual(group,[0,0,0,1,1,1]);
  for(const order of ['AB','BA']) {
    assert.deepEqual(runCache(order,false).map(s=>s.ok),[true,false]);
    assert.deepEqual(runCache(order,true).map(s=>s.ok),[true,true]);
  }
  assert.ok(compareCases(false).every(r=>r.diff < 1e-12));
  assert.deepEqual(compareCases(true).filter(r=>r.diff >= 1e-12).map(r=>r.name),['Tail decode']);
  assert.deepEqual([trace.returned-trace.submit,trace.returned-trace.start,trace.end-trace.start],[2,1,40]);
  assert.deepEqual([3,2,1].map(fallback).map(s=>[s.total,s.fits]),[[720,false],[480,true],[240,true]]);
}
