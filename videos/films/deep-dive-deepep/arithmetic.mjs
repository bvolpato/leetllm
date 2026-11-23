import assert from 'node:assert/strict';
export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export const sum = (xs) => xs.reduce((a, v) => a + v, 0);
export function bf16(value) {
  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, value, true);
  const bits = view.getUint32(0, true),
    rounded = ((bits + 0x7fff + ((bits >>> 16) & 1)) & 0xffff0000) >>> 0;
  view.setUint32(0, rounded, true);
  return view.getFloat32(0, true);
}
export function destinationExpectation(E, G, k) {
  assert([E, G, k].every(Number.isInteger) && E > 0 && G > 0 && E % G === 0 && k >= 0 && k <= E);
  const choose = (n, r) =>
    r > n
      ? 0
      : Array.from(
          {
            length: r,
          },
          (_, i) => (n - i) / (i + 1),
        ).reduce((a, b) => a * b, 1);
  return G * (1 - choose(E - E / G, k) / choose(E, k));
}
export function communicationBudget(
  rawSMs,
  { preferOverlap = true, deviceSMs = 132, pool = 128 } = {},
) {
  assert(
    Number.isFinite(rawSMs) &&
      rawSMs >= 0 &&
      Number.isInteger(deviceSMs) &&
      deviceSMs > 0 &&
      Number.isInteger(pool) &&
      pool >= 0,
  );
  const margin = rawSMs * 1.25,
    aligned = Math.max(4, Math.ceil(margin / 2) * 2),
    floored = preferOverlap ? aligned : Math.max(aligned, 64),
    sms = Math.min(deviceSMs, floored);
  return {
    rawSMs,
    margin,
    aligned,
    floored,
    sms,
    directRequest: Math.min(sms, 9),
    hybridRequest: 16 * sms + 1,
    direct: Math.min(Math.min(sms, 9), pool),
    hybrid: Math.min(16 * sms + 1, pool),
    pool,
    deviceSMs,
  };
}
export function redundantGradient(original, extra, participants, required) {
  assert.deepEqual(
    [...participants].sort(),
    [...required].sort(),
    'Every local participant must join',
  );
  assert.equal(original.length, extra.length);
  return original.map((v, i) => v + extra[i]);
}
export function deferredWaitTrace(calls) {
  assert(Number.isInteger(calls) && calls >= 0);
  const trace = { dependencyCalls: 0, hookCalls: 0, results: [] };
  let hook = () => ['rows', 'indices', 'gates', 'handle'];
  const event = {
    wait() {
      trace.dependencyCalls++;
      if (!hook) return null;
      const result = hook();
      trace.hookCalls++;
      hook = null;
      return result;
    },
  };
  for (let stream = 0; stream < calls; stream++) trace.results.push(event.wait());
  return trace;
}
