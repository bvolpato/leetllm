import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export function fit(rows) {
  const center = sum(rows.map((v) => v.x)) / rows.length,
    scale = Math.max(...rows.map((v) => v.x)) - Math.min(...rows.map((v) => v.x)),
    z = rows.map((v) => (v.x - center) / scale),
    my = sum(rows.map((v) => v.y)) / rows.length,
    mz = sum(z) / z.length;
  const slope =
    sum(z.map((v, i) => (v - mz) * (rows[i].y - my))) / sum(z.map((v) => (v - mz) ** 2));
  return {
    center,
    scale,
    slope,
    intercept: my - slope * mz,
    threshold: 0.5,
  };
}
export function score(bundle, x) {
  return bundle.intercept + (bundle.slope * ((x ?? bundle.center) - bundle.center)) / bundle.scale;
}
export function matureQuality(window) {
  assert.equal(typeof window.labelsReady, 'boolean', 'missing label maturity');
  if (!window.labelsReady || window.qualityRows === null) return null;
  const rows = window.qualityRows;
  assert(Array.isArray(rows), 'invalid quality cohort');
  assert.equal(new Set(rows.map((row) => row.id)).size, rows.length, 'duplicate outcome');
  for (const row of rows) {
    assert(typeof row.id === 'string' && row.id.length, 'missing outcome identity');
    assert.equal(typeof row.late, 'boolean', 'outcome label unavailable');
    for (const key of ['candidateCost', 'baselineCost'])
      assert(Number.isFinite(row[key]) && row[key] >= 0, 'invalid outcome cost');
  }
  if (!rows.length) return null;
  const candidateCost = sum(rows.map((row) => row.candidateCost));
  const baselineCost = sum(rows.map((row) => row.baselineCost));
  assert(Number.isFinite(candidateCost) && Number.isFinite(baselineCost), 'invalid cohort sum');
  if (!baselineCost) return null;
  return {
    count: rows.length,
    candidateCost,
    baselineCost,
    delta: candidateCost / baselineCost - 1,
  };
}
export function canary(windows) {
  try {
    assert(Array.isArray(windows), 'invalid window inventory');
    assert.equal(
      new Set(windows.map((window) => window.id)).size,
      windows.length,
      'duplicate window',
    );
    const quality = windows.map((window, index) => {
      assert(typeof window.id === 'string' && window.id.length, 'missing window identity');
      assert(Number.isInteger(window.day) && window.day >= 0, 'invalid observation day');
      assert(index === 0 || window.day > windows[index - 1].day, 'windows out of order');
      assert(Number.isFinite(window.ms) && window.ms >= 0 && window.ms <= 250, 'latency breach');
      assert(
        Number.isFinite(window.error) && window.error >= 0 && window.error <= 0.01,
        'error breach',
      );
      return matureQuality(window);
    });
    if (quality.some((value) => value !== null && value.delta > 0)) return 'ABORT';
    return windows.length < 2 || quality.at(-1) == null ? 'HOLD' : 'READY';
  } catch {
    return 'ABORT';
  }
}
export const outcomeRows = (candidateCost) =>
  [true, true, false, false].map((late, i) => ({
    id: 'online-' + (i + 1),
    late,
    candidateCost,
    baselineCost: 25,
  }));
export const canaryBeatStart = 172.17;
export const canaryBeatDuration = 27.466;
export const canaryCue = (time) => (time - canaryBeatStart) / canaryBeatDuration;
export const modelDigest = (model) =>
  createHash('sha256').update(JSON.stringify(model)).digest('hex');
export const fingerprint = (v) =>
  createHash('sha256')
    .update(
      JSON.stringify(
        Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        ),
      ),
    )
    .digest('hex');
