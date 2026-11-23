export function nucleus(probabilities, threshold = 0.8) {
  const order = probabilities
    .map((p, i) => ({
      p,
      i,
    }))
    .sort((a, b) => b.p - a.p || a.i - b.i);
  let total = 0;
  const ids = [];
  for (const item of order) {
    ids.push(item.i);
    total += item.p;
    if (total >= threshold) break;
  }
  return ids;
}
export function decodeNormalize(values) {
  if (!values.length || values.some((v) => !Number.isFinite(v) || v < 0))
    throw new RangeError('finite nonnegative weights required');
  const sum = values.reduce((s, v) => s + v, 0);
  if (!(sum > 0)) throw new RangeError('empty eligible pool');
  return values.map((v) => v / sum);
}
export function decodeSoftmax(logits, temperature = 1) {
  if (
    !logits.length ||
    logits.some((v) => Number.isNaN(v) || v === Infinity) ||
    !Number.isFinite(temperature) ||
    temperature < 0
  )
    throw new RangeError('invalid logits or temperature');
  const max = Math.max(...logits);
  if (!Number.isFinite(max)) throw new RangeError('empty eligible pool');
  if (temperature === 0) return logits.map((_, i) => Number(i === logits.indexOf(max)));
  return decodeNormalize(logits.map((v) => Math.exp((v - max) / temperature)));
}
export function decodeSupport(probabilities, kind, value) {
  if (
    (kind === 'k' && (!Number.isInteger(value) || value < 1)) ||
    (kind === 'p' && (!Number.isFinite(value) || value <= 0 || value > 1)) ||
    (kind === 'min' && (!Number.isFinite(value) || value < 0 || value > 1))
  )
    throw new RangeError('invalid support parameter');
  const p = decodeNormalize(probabilities),
    rank = p
      .map((v, i) => ({
        v,
        i,
      }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v || a.i - b.i);
  let ids;
  if (kind === 'k') ids = rank.slice(0, value).map((x) => x.i);
  else if (kind === 'min') ids = rank.filter((x) => x.v >= value * rank[0].v).map((x) => x.i);
  else if (kind === 'p') {
    ids = [];
    let sum = 0;
    for (const x of rank) {
      ids.push(x.i);
      sum += x.v;
      if (sum >= value - 1e-12) break;
    }
  } else throw new RangeError('unknown support rule');
  const mass = ids.reduce((s, i) => s + p[i], 0);
  return {
    ids,
    mass,
    values: p.map((v, i) => (ids.includes(i) ? v / mass : 0)),
  };
}
export function decodeRepetition(logits, history, penalty) {
  if (!Number.isFinite(penalty) || penalty <= 0)
    throw new RangeError('positive repetition penalty required');
  if (history.some((i) => !Number.isInteger(i) || i < 0 || i >= logits.length))
    throw new RangeError('invalid token identity');
  const seen = new Set(history);
  return logits.map((v, i) => (!seen.has(i) ? v : v < 0 ? v * penalty : v / penalty));
}
export const decodeLengthScore = (log, length, alpha) => log / Math.pow((5 + length) / 6, alpha);
