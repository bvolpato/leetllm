import { CACHE_K, CACHE_POSITIONS, CACHE_Q, content } from './fixtures.mjs';
import { dot, permissionMask, rotaryScore, rotateHead, softmax } from './arithmetic.mjs';
export function cachePositionFrame(shift = 0, reset = 0, repair = 0) {
  const queryPosition = 5 + Math.round(8 * shift),
    keyPosition = 3 + Math.round(8 * shift);
  const keyPhasePosition = keyPosition - Math.round(8 * shift * reset * (1 - repair));
  const relativePhase = (keyPhasePosition - queryPosition) * 0.5;
  return {
    queryPosition,
    keyPosition,
    keyPhasePosition,
    relativePhase,
    score: rotaryScore([1, 0], [1, 0], queryPosition, keyPhasePosition, [0.5]),
  };
}
export const contentWeights = content.map((q) =>
  softmax(content.map((k) => (q[0] * k[0] + q[1] * k[1]) / Math.sqrt(2))),
);
export const contentOutputs = contentWeights.map((weights) =>
  [0, 1].map((channel) =>
    weights.reduce((sum, weight, index) => sum + weight * content[index][channel], 0),
  ),
);
export function pairingTrace() {
  const q = [1, 2, 3, 4],
    k = [4, 3, 2, 1],
    frequencies = [1, 0.01],
    permutation = [0, 2, 1, 3];
  const score = (a, z, layout) =>
    dot(rotateHead(a, 5, frequencies, layout), rotateHead(z, 2, frequencies, layout));
  return {
    q,
    k,
    permutation,
    adjacent: score(q, k, 'adjacent'),
    wrong: score(q, k, 'split'),
    converted: score(
      permutation.map((i) => q[i]),
      permutation.map((i) => k[i]),
      'split',
    ),
  };
}
export function cacheFixture(frequencies = [1, 0.01]) {
  const queries = CACHE_Q.map((q, i) => rotateHead(q, CACHE_POSITIONS[i], frequencies)),
    keys = CACHE_K.map((k, i) => rotateHead(k, CACHE_POSITIONS[i], frequencies));
  const row = (query, keys, mask) =>
    softmax(keys.map((k, i) => (!mask || mask[i] ? dot(query, k) / 2 : -Infinity)));
  const full = queries.map((q, i) =>
    row(
      q,
      keys,
      CACHE_POSITIONS.map((p) => p <= CACHE_POSITIONS[i]),
    ),
  );
  const incremental = queries.map((q, i) =>
    row(q, keys.slice(0, i + 1)).concat(Array(2 - i).fill(0)),
  );
  const unmasked = queries.map((q) => row(q, keys));
  const reset = row(rotateHead(CACHE_Q[2], 0, frequencies), keys);
  const newFrequencies = [1, 0.005],
    newQuery = rotateHead(CACHE_Q[2], 802, newFrequencies),
    newKeys = CACHE_K.map((k, i) => rotateHead(k, CACHE_POSITIONS[i], newFrequencies));
  return {
    queries,
    keys,
    full,
    incremental,
    unmasked,
    reset,
    mixed: row(newQuery, keys),
    repaired: row(newQuery, newKeys),
    newKeys,
    newQuery,
  };
}

// Physical columns can move together with their value rows. Outputs retain logical value order.
export function cacheChunkInSlots(queryIndices, storageOrder, masked) {
  const fixture = cacheFixture();
  const keys = storageOrder.map((index) => fixture.keys[index]);
  const permissions = permissionMask(
    queryIndices.map((index) => CACHE_POSITIONS[index]),
    storageOrder.map((index) => CACHE_POSITIONS[index]),
  ).map((row) => row.map((allowed) => !masked || allowed));
  const outputs = queryIndices.map((index, row) => {
    const inSlotOrder = softmax(
      keys.map((key, slot) =>
        permissions[row][slot]
          ? dot(fixture.queries[index], key) / Math.sqrt(key.length)
          : -Infinity,
      ),
    );
    const output = Array(keys.length).fill(0);
    storageOrder.forEach((logical, slot) => {
      output[logical] = inSlotOrder[slot];
    });
    return output;
  });
  return { permissions, outputs, reference: queryIndices.map((index) => fixture.full[index]) };
}
