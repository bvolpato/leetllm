import assert from 'node:assert/strict';
export function submittedTokens(base, increment, calls) {
  return Array.from(
    {
      length: calls,
    },
    (_, i) => base + i * increment,
  );
}
export const progress = (p, a, z) => Math.max(0, Math.min(1, (p - a) / (z - a)));
export const clock = (n) =>
  String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(Math.round(n % 60)).padStart(2, '0');
export function contextLedger(P = 2000, delta = 1500, K = 10, cap = Infinity) {
  assert(Number.isInteger(K) && K > 0 && P >= 0 && delta >= 0);
  const calls = Array.from(
      {
        length: K,
      },
      (_, i) => P + Math.min(i, cap) * delta,
    ),
    total = calls.reduce((a, v) => a + v, 0),
    written = calls.at(-1),
    read = cap === Infinity ? total - written : null;
  return {
    calls,
    total,
    written,
    read,
  };
}
export function uctRows(
  parent = 10,
  children = [
    {
      id: 'rollback',
      N: 4,
      W: 1.2,
    },
    {
      id: 'diff',
      N: 5,
      W: 4.5,
    },
    {
      id: 'retry',
      N: 1,
      W: 0.1,
    },
  ],
  c = Math.SQRT2,
) {
  assert(Number.isInteger(parent) && parent >= 0 && Number.isFinite(c) && c >= 0);
  return children.map((r) => {
    assert(Number.isInteger(r.N) && r.N >= 0 && Number.isFinite(r.W) && r.W >= 0 && r.W <= r.N);
    const mean = r.N ? r.W / r.N : 0,
      bonus = r.N ? c * Math.sqrt(Math.log(Math.max(1, parent)) / r.N) : Infinity;
    return {
      ...r,
      mean,
      bonus,
      score: mean + bonus,
    };
  });
}
