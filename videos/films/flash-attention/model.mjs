import { faClamp } from './arithmetic.mjs';
import { SCORES, VALUES } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { stableSoftmax } from 'vizmatic';
export function summarize(scores, values) {
  const m = Math.max(...scores),
    weights = scores.map((v) => Math.exp(v - m));
  return {
    m,
    l: weights.reduce((a, v) => a + v, 0),
    u: weights.reduce((sum, v, i) => sum + v * values[i], 0),
  };
}
export function merge(a, b) {
  const m = Math.max(a.m, b.m),
    alpha = Math.exp(a.m - m),
    beta = Math.exp(b.m - m);
  return {
    m,
    l: alpha * a.l + beta * b.l,
    u: alpha * a.u + beta * b.u,
  };
}
export function rescaledFirstTile(progress) {
  const a = summarize(SCORES.slice(0, 2), VALUES.slice(0, 2)),
    reference = 2 + Math.max(0, Math.min(1, progress)),
    factor = Math.exp(a.m - reference);
  return {
    reference,
    factor,
    l: a.l * factor,
    u: a.u * factor,
  };
}
export function tileStream(progress) {
  const p = Math.max(0, Math.min(1, progress)),
    tile = p < 0.5 ? 0 : 1,
    travel = Math.min(1, (p - tile * 0.5) / 0.22),
    admitted = p >= 0.86 ? 2 : p >= 0.36 ? 1 : 0;
  const first = summarize(SCORES.slice(0, 2), VALUES.slice(0, 2));
  const summary =
    admitted === 0
      ? null
      : admitted === 1
        ? first
        : merge(first, summarize(SCORES.slice(2), VALUES.slice(2)));
  return {
    tile,
    travel,
    admitted,
    summary,
    output: summary ? summary.u / summary.l : null,
  };
}
export function absoluteCausalPairs(queries, keys, validKeys = keys.length) {
  return queries.map((query) =>
    keys.map((key, index) => (index >= validKeys ? 'unused' : key > query ? 'future' : 'allowed')),
  );
}
export function transferPrediction(lastValue = 4) {
  const values = [VALUES[0], VALUES[1], lastValue],
    dense = stableSoftmax(SCORES).reduce((sum, p, i) => sum + p * values[i], 0),
    first = summarize(SCORES.slice(0, 2), values.slice(0, 2)),
    last = summarize(SCORES.slice(2), values.slice(2)),
    tiled = merge(first, last);
  return {
    values,
    dense,
    tiled,
    firstOnFinalScale: first.u * Math.exp(first.m - tiled.m),
    lastContribution: lastValue,
  };
}
export function attentionInventory(batch, heads, sequence, scoreBytes = 2) {
  for (const x of [batch, heads, sequence, scoreBytes]) assert(Number.isInteger(x) && x > 0);
  return {
    score: batch * heads * sequence ** 2 * scoreBytes,
    fourPasses: 4 * batch * heads * sequence ** 2 * scoreBytes,
    lse: batch * heads * sequence * 4,
  };
}
export function tileInventory(rows, columns, d, dv = d) {
  for (const x of [rows, columns, d, dv]) assert(Number.isInteger(x) && x > 0);
  const q = rows * d * 2,
    k = columns * d * 2,
    v = columns * dv * 2,
    o = rows * dv * 4,
    s = rows * columns * 4;
  return {
    q,
    k,
    v,
    o,
    s,
    total: q + k + v + o + s,
  };
}
export function attentionBackwardRow(scores, values, upstream = 1) {
  assert(scores.length === values.length && scores.length > 0);
  const probabilities = stableSoftmax(scores),
    output = probabilities.reduce((s, p, i) => s + p * values[i], 0),
    D = upstream * output,
    dp = values.map((v) => v * upstream),
    ds = probabilities.map((p, i) => p * (dp[i] - D)),
    dv = probabilities.map((p) => p * upstream);
  return {
    probabilities,
    output,
    D,
    dp,
    ds,
    dv,
  };
}
export function causalTileClass(qFirst, qLast, kFirst, kLast) {
  assert(qFirst <= qLast && kFirst <= kLast);
  return kFirst > qLast ? 'future' : kLast <= qFirst ? 'past' : 'boundary';
}
export function finiteAccumulatorExample(value = 1e308) {
  assert(Number.isFinite(value));
  return {
    normalized: value / 2 + value / 2,
    numerator: value + value,
    accepted: Number.isFinite(value + value),
  };
}
export function cachedBlend(query, values, validLength, mode = 'absolute') {
  assert(Number.isInteger(validLength) && validLength >= 1 && validLength <= values.length);
  const allowed = values.map((_, i) =>
      mode === 'upper-left' ? i === 0 : mode === 'all' ? true : i < validLength && i <= query,
    ),
    sum = values.reduce((s, v, i) => s + (allowed[i] ? v : 0), 0),
    mass = allowed.filter(Boolean).length;
  return {
    allowed,
    m: 0,
    l: mass,
    u: sum,
    output: sum / mass,
  };
}
export function advanceTileSlot(slots, event) {
  const next = structuredClone(slots),
    s = next[event.slot];
  assert(s, 'Unknown slot');
  if (event.kind === 'issue') {
    assert.equal(s.status, 'free', 'Cannot overwrite a live slot');
    s.status = 'copying';
    s.tile = event.tile;
  } else if (event.kind === 'copy-complete') {
    assert.equal(s.status, 'copying');
    s.status = 'ready';
  } else if (event.kind === 'consume') {
    assert.equal(s.status, 'ready', 'Consumer must wait for copy completion');
    s.status = 'reading';
  } else if (event.kind === 'release') {
    assert.equal(s.status, 'reading');
    s.status = 'free';
    s.tile = null;
  } else throw Error('Unknown pipeline event');
  return next;
}
export function tilePipelinePrefix(steps) {
  let slots = {
    A: {
      status: 'free',
      tile: null,
    },
    B: {
      status: 'free',
      tile: null,
    },
  };
  const events = [
    {
      slot: 'A',
      kind: 'issue',
      tile: 0,
    },
    {
      slot: 'A',
      kind: 'copy-complete',
    },
    {
      slot: 'A',
      kind: 'consume',
    },
    {
      slot: 'B',
      kind: 'issue',
      tile: 1,
    },
    {
      slot: 'B',
      kind: 'copy-complete',
    },
    {
      slot: 'A',
      kind: 'release',
    },
    {
      slot: 'B',
      kind: 'consume',
    },
    {
      slot: 'A',
      kind: 'issue',
      tile: 2,
    },
  ];
  for (const e of events.slice(0, steps)) slots = advanceTileSlot(slots, e);
  return {
    slots,
    events: events.slice(0, steps),
  };
}
export function flashExtensionFrame(scene, state) {
  const beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    go = (id, fallback = p) => {
      const c = state.cues?.[id];
      return c
        ? c.phase === 'before'
          ? 0
          : c.phase === 'after'
            ? 1
            : faClamp(c.progress)
        : faClamp(fallback);
    },
    started = (id, fallback = p > 0.5) => {
      const c = state.cues?.[id];
      return c ? c.phase !== 'before' : fallback;
    };
  return {
    beat,
    p,
    go,
    started,
    progress: go(scene + '-beat-' + (beat + 1)),
  };
}
