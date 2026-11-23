import { average } from './arithmetic.mjs';
export const VECTOR_A = Object.freeze([1, 3]);
export const VECTOR_B = Object.freeze([3, 1]);
export function tiesExample() {
  const raw = [
    [1, 0.1],
    [-0.3, 0.1],
    [-0.3, 0.1],
  ];
  const trimmed = raw.map((vector) =>
    vector.map((value, i) =>
      Math.abs(value) === Math.min(...vector.map(Math.abs)) && vector.length > 1 ? 0 : value,
    ),
  );
  const electedSigns = trimmed[0].map((_, i) =>
    Math.sign(trimmed.reduce((sum, row) => sum + row[i], 0)),
  );
  const merged = electedSigns.map((elected, i) => {
    const active =
      elected === 0
        ? []
        : trimmed.map((row) => row[i]).filter((value) => Math.sign(value) === elected);
    return active.length ? active.reduce((sum, value) => sum + value, 0) / active.length : 0;
  });
  return {
    raw,
    trimmed,
    electedSigns,
    merged,
  };
}
export function sphereMidpoints() {
  const linear = [0.75, Math.sqrt(3) / 4];
  const spherical = [Math.sqrt(3) / 2, 0.5];
  return {
    linear,
    linearNorm: Math.hypot(...linear),
    spherical,
    sphericalNorm: Math.hypot(...spherical),
  };
}
export function permutationExample() {
  const a = {
    input: [1, -1],
    output: [2, 1],
  };
  const b = {
    input: [-1, 1],
    output: [1, 2],
  };
  const alignedB = {
    input: [b.input[1], b.input[0]],
    output: [b.output[1], b.output[0]],
  };
  const merge = (other) => ({
    input: average(a.input, other.input),
    output: average(a.output, other.output),
  });
  return {
    a,
    b,
    alignedB,
    naive: merge(b),
    aligned: merge(alignedB),
  };
}
export function adapterMergeExample() {
  const factors = [
    {
      a: [1, 0],
      b: [1, 0],
    },
    {
      a: [0, 1],
      b: [0, 1],
    },
  ];
  const desired = [0, 1].map((i) =>
    [0, 1].map((j) => factors.reduce((n, f) => n + 0.5 * f.b[i] * f.a[j], 0)),
  );
  const meanA = average(factors[0].a, factors[1].a),
    meanB = average(factors[0].b, factors[1].b);
  const wrong = meanB.map((v) => meanA.map((w) => v * w));
  return {
    factors,
    desired,
    wrong,
    rank: 2,
  };
}
export function dareMaskExample() {
  const delta = [0.2, -0.4, 0.1, 0.6],
    keep = 0.5,
    mask = [0, 0, 1, 1];
  const masked = delta.map((v, i) => (v * mask[i]) / keep);
  const expectations = delta.map(
    (_, i) =>
      Array.from(
        {
          length: 16,
        },
        (_, n) => (delta[i] * ((n >> i) & 1)) / keep,
      ).reduce((s, v) => s + v, 0) / 16,
  );
  return {
    delta,
    keep,
    mask,
    masked,
    expectations,
    overlap: 0.1 ** 2 / (1 - 0.9 ** 2),
  };
}
export function independentDropOutcomes() {
  const cells = Array.from(
    {
      length: 100,
    },
    (_, i) => ({
      row: Math.floor(i / 10),
      column: i % 10,
      keepA: Math.floor(i / 10) === 0,
      keepB: i % 10 === 0,
    }),
  );
  const both = cells.filter((c) => c.keepA && c.keepB).length;
  const active = cells.filter((c) => c.keepA || c.keepB).length;
  return {
    cells,
    both,
    active,
    exactlyOne: active - both,
    neither: cells.length - active,
    conditional: both / active,
  };
}
export function soupSelectionFixture() {
  const models = [
      [1.2, 0.8],
      [0.7, 1.3],
      [0.4, 0.4],
    ],
    target = [1, 1];
  const mse = (predictions) =>
    predictions.reduce((n, v, i) => n + (v - target[i]) ** 2, 0) / target.length;
  const retained = [models[0]],
    steps = [];
  for (let i = 1; i < models.length; i++) {
    const predictions = target.map(
      (_, j) =>
        [...retained, models[i]].reduce((sum, row) => sum + row[j], 0) / (retained.length + 1),
    );
    const previous = target.map(
      (_, j) => retained.reduce((sum, row) => sum + row[j], 0) / retained.length,
    );
    const accepted = mse(predictions) <= mse(previous);
    steps.push({
      candidate: i,
      predictions,
      loss: mse(predictions),
      previousLoss: mse(previous),
      accepted,
    });
    if (accepted) retained.push(models[i]);
  }
  const finalPredictions = target.map(
    (_, j) => retained.reduce((sum, row) => sum + row[j], 0) / retained.length,
  );
  const untouchedInputs = [
      [1, 1],
      [-1, 1],
    ],
    untouchedPredictions = untouchedInputs.map((x) =>
      x.reduce((sum, v, i) => sum + v * finalPredictions[i], 0),
    );
  return {
    models,
    target,
    seedLoss: mse(models[0]),
    steps,
    finalPredictions,
    untouchedInputs,
    untouchedPredictions,
    untouchedLoss: mse(untouchedPredictions),
  };
}
export function passthroughFixture() {
  const layers = Array.from(
    {
      length: 8,
    },
    (_, i) => ({
      source: i < 4 ? 'A' : 'B',
      index: i,
      gain: i < 4 ? [1, 1] : [2, 1],
    }),
  );
  const evaluate = (input) =>
    layers.reduce((v, layer) => v.map((x, i) => x * layer.gain[i]), input);
  return {
    layers,
    probes: [
      [1, 0],
      [0, 1],
    ].map((input) => ({
      input,
      output: evaluate(input),
      target: input,
    })),
  };
}
export function precisionMergeExample() {
  const base = 1,
    specialist = 1.002,
    step = 2 ** -7,
    round = (v) => Math.round(v / step) * step;
  const wide = base + 0.5 * (specialist - base);
  return {
    base,
    specialist,
    step,
    wide,
    roundedInput: round(specialist),
    roundedOutput: round(wide),
  };
}
