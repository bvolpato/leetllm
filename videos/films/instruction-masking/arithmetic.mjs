import assert from 'node:assert/strict';
export function firstFit(lengths, window = 16) {
  const bins = [],
    contents = [];
  for (const [i, length] of lengths.entries()) {
    assert(Number.isInteger(length) && length > 0 && length <= window);
    const found = bins.findIndex((n) => n + length <= window),
      j = found < 0 ? bins.length : found;
    if (found < 0) {
      bins.push(0);
      contents.push([]);
    }
    bins[j] += length;
    contents[j].push(i);
  }
  return {
    bins,
    contents,
    tokens: lengths.reduce((s, v) => s + v, 0),
    capacity: window * bins.length,
  };
}
export function makeAttentionMasks() {
  const segment = [0, 0, 0, 1, 1, 1],
    causal = segment.map((_v, q) => segment.map((_k, k) => Number(k <= q))),
    isolated = segment.map((v, q) => segment.map((other, k) => Number(k <= q && v === other)));
  return {
    segment,
    causal,
    isolated,
  };
}
export function attendedMean(mask, q, values) {
  const selected = values.filter((_v, k) => mask[q][k]);
  return selected.reduce((s, v) => s + v, 0) / selected.length;
}
export function eosLabels({ idOnly = false } = {}) {
  const ids = [1, 2, 3, 4, 5, 5, 5],
    valid = [1, 1, 1, 1, 1, 0, 0],
    membership = [0, 1, 1, 1, 1, 0, 0];
  const labels = ids.map((id, i) =>
    valid[i] && membership[i] && !(idOnly && id === 5) ? id : -100,
  );
  return {
    ids,
    valid,
    membership,
    labels,
    predictorLabels: labels.slice(1),
  };
}
export function lossTerms(probabilities = [0.5, 0.25, 0.8]) {
  const terms = probabilities.map((p) => -Math.log(p)),
    sum = terms.reduce((s, v) => s + v, 0);
  return {
    probabilities,
    terms,
    sum,
    count: terms.length,
    mean: sum / terms.length,
    targetLogitGradients: probabilities.map((p) => (p - 1) / terms.length),
  };
}
export function freshContract(repaired = false, extendedReply = false) {
  const pieces = [
    ['<U>', 7, 1, 0],
    ['Ready?', 11, 1, 0],
    ['<A>', 13, 1, 0],
    ['Yes', 19, 1, 1],
    ...(extendedReply ? [['indeed', 31, 1, 1]] : []),
    ['EOS', 23, 1, 1],
    ['PAD', 23, 0, 0],
  ];
  const ids = pieces.map((piece) => piece[1]);
  const valid = pieces.map((piece) => piece[2]);
  const membership = pieces.map((piece) => piece[3]);
  const labels = ids.slice(1).map((id, i) => (valid[i + 1] && membership[i + 1] ? id : -100));
  if (!repaired) labels[2] = -100;
  return {
    words: pieces.map((piece) => piece[0]),
    ids,
    valid,
    membership,
    labels,
    active: labels.filter((v) => v !== -100).length,
  };
}
export function typedGate(row) {
  if (typeof row.parity !== 'boolean' || !row.parity)
    return {
      pass: false,
      reason: 'template parity',
    };
  if (
    typeof row.rate !== 'number' ||
    !Number.isFinite(row.rate) ||
    row.rate < 0 ||
    row.rate > 1 ||
    typeof row.critical !== 'number' ||
    !Number.isInteger(row.critical) ||
    row.critical < 0 ||
    typeof row.latency !== 'number' ||
    !Number.isFinite(row.latency) ||
    row.latency < 0
  )
    return {
      pass: false,
      reason: 'invalid metrics',
    };
  return {
    pass: row.rate >= 0.98 && row.critical === 0 && row.latency <= 700,
    reason: 'typed threshold comparison',
  };
}
