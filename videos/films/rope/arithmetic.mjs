import { CLOCK_FREQUENCIES, TAU } from './fixtures.mjs';
export function rotatePair([x, y], angle) {
  return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
}
export function rotaryScore(q, k, m, n, frequencies) {
  return frequencies.reduce((total, frequency, pair) => {
    const a = rotatePair(q.slice(2 * pair, 2 * pair + 2), m * frequency);
    const b = rotatePair(k.slice(2 * pair, 2 * pair + 2), n * frequency);
    return total + a[0] * b[0] + a[1] * b[1];
  }, 0);
}
export function softmax(scores) {
  const maximum = Math.max(...scores);
  const values = scores.map((score) => Math.exp(score - maximum));
  const total = values.reduce((a, b) => a + b, 0);
  return values.map((value) => value / total);
}
export const bound = (x) => Math.max(0, Math.min(1, x));
export const blend = (a, b, p) => a + (b - a) * p;
export const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
export function absoluteRow(position, frequencies = CLOCK_FREQUENCIES) {
  return frequencies.flatMap((f) => [Math.sin(position * f), Math.cos(position * f)]);
}
export function rotateHead(vector, position, frequencies, layout = 'adjacent') {
  const width = 2 * frequencies.length;
  if (
    !width ||
    width > vector.length ||
    !['adjacent', 'split'].includes(layout) ||
    ![...vector, ...frequencies, position].every(Number.isFinite)
  )
    throw Error('Invalid fixed rotary head contract');
  const out = [...vector];
  frequencies.forEach((frequency, i) => {
    const a = layout === 'adjacent' ? 2 * i : i,
      b = layout === 'adjacent' ? 2 * i + 1 : i + frequencies.length;
    const [x, y] = rotatePair([vector[a], vector[b]], position * frequency);
    out[a] = x;
    out[b] = y;
  });
  return out;
}
export function absoluteExpansion(
  shift = 0,
  matrix = [
    [1, 0],
    [0, 1],
  ],
) {
  const q = [0.8, 0.6],
    k = [0.2, 1],
    pq = absoluteRow(5 + shift, [0.5]),
    pk = absoluteRow(2 + shift, [0.5]);
  const product = (a, b) =>
    dot(
      a,
      matrix.map((row) => dot(row, b)),
    );
  const terms = [product(q, k), product(q, pk), product(pq, k), product(pq, pk)];
  return {
    q,
    k,
    pq,
    pk,
    terms,
    total: terms.reduce((a, b) => a + b, 0),
  };
}
export function frequencySchedules(scale = 4, width = 8, base = 10000, length = 4096) {
  if (!Number.isInteger(width) || width <= 2 || width % 2 || !Number.isFinite(scale) || scale < 1)
    throw Error('NTK schedule needs an even width above two and finite scale at least one');
  const original = Array.from(
      {
        length: width / 2,
      },
      (_, i) => base ** ((-2 * i) / width),
    ),
    turns = original.map((f) => (length * f) / TAU),
    gamma = turns.map((r) => bound((r - 1) / 31));
  return {
    original,
    turns,
    gamma,
    pi: original.map((f) => f / scale),
    ntk: original.map((f, i) => f * scale ** ((-2 * i) / (width - 2))),
    yarn: original.map((f, i) => f * (gamma[i] + (1 - gamma[i]) / scale)),
  };
}
export function alibiSlopes(heads) {
  if (!Number.isInteger(heads) || heads < 1) throw Error('Positive integer head count required');
  if ((heads & (heads - 1)) === 0)
    return Array.from(
      {
        length: heads,
      },
      (_, i) => 2 ** ((-8 * (i + 1)) / heads),
    );
  const smaller = 2 ** Math.floor(Math.log2(heads));
  return alibiSlopes(smaller).concat(
    alibiSlopes(smaller * 2)
      .filter((_, i) => i % 2 === 0)
      .slice(0, heads - smaller),
  );
}
export function toBfloat16(value) {
  const floats = new Float32Array([value]),
    words = new Uint32Array(floats.buffer);
  words[0] = (words[0] + 0x7fff + ((words[0] >>> 16) & 1)) & 0xffff0000;
  return floats[0];
}
export function permissionMask(queries, keys) {
  return queries.map((q) => keys.map((k) => k <= q));
}
