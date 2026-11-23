import assert from 'node:assert/strict';

export const fields = ['acl-denied-snippet', 'acl-denied-citation'];
export const friday = ['Refund pending', 'Private returns note'];
export const fixed = ['', ''];
export const limit = 500;
export const latency = 420;
export const headroom = limit - latency;
export const headroomFraction = headroom / limit;
export const sample = [
  110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 300, 360, 420, 900,
];
export const rank = Math.ceil(0.95 * sample.length);
export const requests = ['A', ...Array(19).fill('B')];
export const earlyReviews = [-3, -1, 2];
export const dev = [...Array(98).fill(true), false, false];
export const incidentWindows = [
  { weeks: 4, alerts: 4 },
  { weeks: 4, alerts: 1 },
];
export const supportPermissions = { readAssignedCase: true, bulkExport: false };

export function results(outputs) {
  return Object.fromEntries(fields.map((name, i) => [name, outputs[i] === '']));
}
export const passed = results(fixed);
export const failed = results(friday);

export function gate(checks, other, window) {
  if (
    !checks ||
    Object.keys(checks).length !== fields.length ||
    !fields.every((key) => Object.hasOwn(checks, key))
  ) {
    return { share: 0, reason: 'Check names differ' };
  }
  if (!fields.every((key) => checks[key] === true)) return { share: 0, reason: 'Access check failed' };
  if (other !== true) return { share: 0, reason: 'Other gates pending' };
  if (!window) return { share: 5, reason: 'Eligible for canary review' };
  if (window.complete !== true || !Number.isFinite(window.ms) || window.ms < 0)
    return { share: 5, reason: 'Window evidence incomplete' };
  if (window.ms >= limit) return { share: 0, reason: 'Withdraw candidate' };
  return { share: 20, reason: 'Eligible for next-stage review' };
}

export const packets = [{ ...passed, extra: true }, { ...passed, [fields[0]]: 1 }, passed];

export function record(step) {
  const build = step >= 2 ? 'B18' : 'B17';
  const checked = fields.map((_, i) => (build === 'B17' ? false : step >= 3 + i ? true : null));
  const other = step >= 5;
  const approved = step >= 6;
  const recommendation = gate(
    Object.fromEntries(fields.map((key, i) => [key, checked[i]])),
    other,
  ).share;
  return { build, checked, other, approved, recommendation, traffic: approved ? recommendation : 0 };
}

export function routing() {
  const toCandidate = requests.filter((_, i) => i === 0);
  const tenant = requests.filter((t) => t === 'A').length;
  return {
    all: requests.length,
    inA: tenant,
    routed: toCandidate.length,
    routedA: toCandidate.filter((t) => t === 'A').length,
  };
}

export function check() {
  assert.deepEqual(Object.values(failed), [false, false]);
  assert.deepEqual(Object.values(passed), [true, true]);
  assert.deepEqual(
    packets.map((p) => gate(p, true).share),
    [0, 0, 5],
  );
  assert.equal(gate({ [fields[1]]: true }, true).share, 0);
  assert.deepEqual(record(2).checked, [null, null]);
  assert.deepEqual(record(3).checked, [true, null]);
  assert.deepEqual(record(4).checked, [true, true]);
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6].map((i) => record(i).traffic),
    [0, 0, 0, 0, 0, 0, 5],
  );
  assert.equal(record(5).recommendation, 5);
  for (const key of fields)
    assert.equal(gate({ ...passed, [key]: false }, true, { complete: true, ms: latency }).share, 0);
  assert.equal(gate(passed, false, { complete: true, ms: latency }).share, 0);
  assert.equal(gate(passed, true, { complete: false, ms: latency }).share, 5);
  for (const ms of [-1, NaN, Infinity])
    assert.equal(gate(passed, true, { complete: true, ms }).share, 5);
  assert.deepEqual(
    [latency, 480, limit - 1, limit, limit + 1].map((ms) => gate(passed, true, { complete: true, ms }).share),
    [20, 20, 20, 0, 0],
  );
  assert.deepEqual(routing(), { all: 20, inA: 1, routed: 1, routedA: 1 });
  assert.equal(rank, 19);
  assert.equal(sample[rank - 1], 420);
  assert.equal(sample.at(-1), 900);
  assert.deepEqual(
    [...sample].sort((a, b) => a - b),
    sample,
  );
  assert.equal(headroom, 80);
  assert.equal(headroomFraction, 0.16);
  assert.equal(earlyReviews.filter((n) => n < 0).length, 2);
  assert.equal(dev.filter(Boolean).length, 98);
  assert.deepEqual(
    incidentWindows.map((w) => w.alerts / w.weeks),
    [1, 0.25],
  );
  assert.equal(supportPermissions.readAssignedCase, true);
  assert.equal(supportPermissions.bulkExport, false);
  return true;
}
