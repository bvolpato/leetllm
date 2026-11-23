import { hidden, initialWeights, vocabulary } from './fixtures.mjs';
export function outputProjection(weights = initialWeights) {
  return projectContext(hidden, weights);
}
export function projectContext(context, weights = initialWeights) {
  const logits = weights.map((row) => row.reduce((sum, w, i) => sum + w * context[i], 0));
  const exp = logits.map((z) => Math.exp(z - Math.max(...logits)));
  const probabilities = exp.map((x) => x / exp.reduce((sum, v) => sum + v, 0));
  return {
    weights,
    logits,
    probabilities,
    selected: vocabulary[probabilities.indexOf(Math.max(...probabilities))],
  };
}
export function sharedQueryRead(query) {
  const keys = [
    [Math.SQRT2, 0],
    [0, Math.SQRT2],
    [Math.SQRT2, 0],
    [0, Math.SQRT2],
  ];
  const storedValues = [
    [2, 0],
    [0, 2],
    [2, 0],
    [0, 2],
  ];
  const scores = keys.map(
    (key) => query.reduce((sum, value, i) => sum + value * key[i], 0) / Math.SQRT2,
  );
  const exp = scores.map(Math.exp),
    denominator = exp.reduce((sum, value) => sum + value, 0);
  const shares = exp.map((value) => value / denominator);
  return {
    keys,
    values: storedValues,
    scores,
    shares,
    output: [0, 1].map((axis) =>
      storedValues.reduce((sum, value, i) => sum + value[axis] * shares[i], 0),
    ),
  };
}
export function learningTrace() {
  let weights = initialWeights.map((row) => [...row]);
  return Array.from(
    {
      length: 13,
    },
    (_, step) => {
      const current = {
        step,
        ...outputProjection(weights),
      };
      weights = weights.map((row, token) =>
        row.map(
          (w, axis) =>
            w - 0.7 * (current.probabilities[token] - Number(token === 0)) * hidden[axis],
        ),
      );
      return current;
    },
  );
}

export function rotaryPair(queryPosition, keyPosition) {
  const rotate = ([x, y], position) => {
    const angle = 0.1 * position;
    return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
  };
  const query = rotate([1, 0], queryPosition);
  const key = rotate([0, 1], keyPosition);
  return { query, key, score: query[0] * key[0] + query[1] * key[1] };
}
