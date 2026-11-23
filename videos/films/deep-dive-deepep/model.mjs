import { sum } from './arithmetic.mjs';
import { hidden, routes, source } from './fixtures.mjs';
import assert from 'node:assert/strict';
export function ledger(choices = routes) {
  const slots = [],
    destinations = new Set(),
    counts = [0, 0, 0, 0];
  for (const [token, list] of Object.entries(choices))
    for (const [topk, [expert, weight]] of list.entries()) {
      if (expert === -1) continue;
      assert(expert >= 0 && expert < 4);
      const rank = Math.floor(expert / 2),
        slot = counts[expert]++;
      destinations.add(`${token}:${rank}`);
      slots.push({
        token,
        expert,
        weight,
        topk,
        slot,
        rank,
        remote: source[token] !== rank,
        key: `${expert}:${slot}`,
        raw: hidden[token].map((v) => (expert + 1) * v),
      });
    }
  return {
    slots,
    destinations: destinations.size,
    counts,
  };
}
export function combine(rows, inverse) {
  const output = Object.fromEntries(Object.keys(hidden).map((id) => [id, [0, 0]])),
    seen = new Set();
  for (const row of rows) {
    assert(inverse.has(row.key) && !seen.has(row.key));
    seen.add(row.key);
    const token = inverse.get(row.key);
    output[token] = output[token].map((v, i) => v + row.value[i]);
  }
  assert.equal(seen.size, inverse.size);
  return output;
}
export function completeLayerReceipt(choices = routes) {
  const data = ledger(choices),
    inverse = new Map(data.slots.map((row) => [row.key, row.token]));
  const mapping = Object.fromEntries(
    Object.keys(hidden).map((token) => [
      token,
      data.slots
        .filter((row) => row.token === token)
        .map((row) => ({
          expert: row.expert,
          slot: row.slot,
          sourceRank: source[token],
          gate: row.weight,
          raw: [...row.raw],
          weighted: row.raw.map((value) => value * row.weight),
        })),
    ]),
  );
  const returned = [...data.slots].reverse().map((row) => ({
    key: row.key,
    value: row.raw.map((value) => value * row.weight),
  }));
  const restored = combine(returned, inverse);
  const reference = Object.fromEntries(
    Object.entries(hidden).map(([token, values]) => [
      token,
      values.map((value) =>
        choices[token].reduce(
          (total, [expert, gate]) => (expert < 0 ? total : total + value * (expert + 1) * gate),
          0,
        ),
      ),
    ]),
  );
  return {
    counts: [...data.counts],
    mapping,
    restored,
    returnedRows: returned.length,
    uniqueReturnedSlots: new Set(returned.map((row) => row.key)).size,
    referenceMatches: Object.keys(reference).every((token) =>
      reference[token].every((value, i) => Math.abs(value - restored[token][i]) < 1e-12),
    ),
    deviceMeasurement: 'pending',
  };
}
// Replay the saved route, then dispatch the same batch with a's first choice changed.
export function routeReplayComparison() {
  const updated = {
    ...routes,
    a: [[2, routes.a[0][1]], routes.a[1]],
  };
  const run = (choices) => {
    const receipt = completeLayerReceipt(choices);
    return {
      ...receipt,
      experts: receipt.mapping.a.map((row) => row.expert),
      destinations: ledger(choices).destinations,
    };
  };
  return { cached: run(routes), rebuilt: run(updated) };
}
export function expertThreeReplay() {
  const { slots } = ledger();
  const inverse = new Map(slots.map((r) => [r.key, r.token]));
  const returned = slots.map((r) => ({
    key: r.key,
    value: r.raw.map((v) => v * r.weight),
  }));
  const pair = returned.filter((r) => r.key.startsWith('3:'));
  const others = returned.filter((r) => !pair.includes(r));
  const reversed = [...pair].reverse();
  const detached = reversed.map((r, i) => ({ key: r.key, value: pair[i].value }));
  return {
    pair: pair.map((r) => ({ ...r, source: inverse.get(r.key) })),
    base: others.find((r) => inverse.get(r.key) === 'a').value,
    paired: combine([...others, ...reversed], inverse),
    detached: combine([...others, ...detached], inverse),
  };
}

export function alignedLayout(counts, alignment) {
  const capacities = counts.map((value) => Math.ceil(value / alignment) * alignment),
    starts = counts.map((_, expert) => sum(capacities.slice(0, expert))),
    endpoints = counts.map((value, expert) => starts[expert] + value),
    capacity = sum(capacities),
    records = [];
  counts.forEach((count, expert) => {
    for (let row = 0; row < count; row++) {
      const index = records.length;
      records.push({
        token: `T${index}`,
        expert,
        slot: starts[expert] + row,
        value: (index + 1) * 10,
      });
    }
  });
  const inverse = new Map(records.map((record) => [record.slot, record.token])),
    valid = Array.from(
      {
        length: capacity,
      },
      (_, slot) => inverse.has(slot),
    );
  return {
    counts,
    alignment,
    capacities,
    starts,
    endpoints,
    capacity,
    records,
    inverse,
    valid,
  };
}
export function resolveAlignedSlot(layout, slot, value) {
  assert(layout.inverse.has(slot), `No source identity for aligned slot ${slot}`);
  return {
    token: layout.inverse.get(slot),
    value,
  };
}
export function roundTripAligned(layout, results) {
  const output = {},
    seen = new Set();
  for (const result of results) {
    const restored = resolveAlignedSlot(layout, result.slot, result.value);
    assert(!seen.has(result.slot), `Duplicate aligned slot ${result.slot}`);
    seen.add(result.slot);
    output[restored.token] = restored.value;
  }
  assert.equal(seen.size, layout.inverse.size, 'Missing aligned result slots');
  return output;
}
export class Deferred {
  constructor(results) {
    this.results = results;
    this.calls = 0;
  }
  wait() {
    return this.calls++ === 0 ? this.results : null;
  }
}
export function weightedExpertRow(values, choices, gates) {
  assert.equal(choices.length, gates.length);
  assert(values.length > 0 && values.every(Number.isFinite));
  assert(
    choices.every((k) => Number.isInteger(k) && k >= 0) && new Set(choices).size === choices.length,
  );
  assert(gates.every(Number.isFinite));
  const raw = choices.map((k) => values.map((v) => (k + 1) * v)),
    contributions = raw.map((v, i) => v.map((x) => x * gates[i]));
  return {
    raw,
    contributions,
    output: values.map((_, i) => sum(contributions.map((v) => v[i]))),
  };
}
export function expertReturnReceipt(values, choices, gates, returned) {
  const row = weightedExpertRow(values, choices, gates),
    slots = choices.map((expert, i) => ({
      key: expert + ':0',
      source: 'z',
      value: row.contributions[i],
    })),
    inverse = new Map(slots.map((slot) => [slot.key, slot.source]));
  const arrivals = returned ?? [...slots].reverse(),
    seen = new Set(),
    output = values.map(() => 0),
    trace = [];
  for (const result of arrivals) {
    assert(inverse.has(result.key), 'Return slot has no source identity');
    assert(!seen.has(result.key), 'Duplicate return slot');
    assert(
      Array.isArray(result.value) &&
        result.value.length === values.length &&
        result.value.every(Number.isFinite),
      'Invalid returned vector',
    );
    seen.add(result.key);
    result.value.forEach((value, i) => (output[i] += value));
    trace.push({
      key: result.key,
      source: inverse.get(result.key),
      value: [...result.value],
      accumulator: [...output],
    });
  }
  assert.equal(seen.size, inverse.size, 'Missing return slot');
  return {
    slots,
    arrivals,
    trace,
    output,
  };
}
