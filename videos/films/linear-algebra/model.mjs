import { apply, clamp, complete, mix, solvePair, sum } from './arithmetic.mjs';
import {
  A,
  B,
  U,
  V,
  common,
  conditioningMatrix,
  contrast,
  mean,
  severity,
  strengths,
} from './fixtures.mjs';
import { event } from './construction.mjs';
import { dotProduct, normalizeVector, multiplyMatrices } from 'vizmatic';
export function basisFrame(state) {
  const units = event(state, 0, 'unit-directions'),
    first = event(state, 1, 'common-component'),
    second = event(state, 1, 'contrast-component');
  const discard = event(state, 2, 'projection-residual'),
    x = [3, 1];
  const coefficients = V.map((v) => dotProduct(x, v));
  const parts = V.map((v, i) => v.map((value) => value * coefficients[i]));
  const combined = parts[0].map((value, i) => value * first + parts[1][i] * second);
  return {
    units,
    first,
    second,
    discard,
    x,
    coefficients,
    parts,
    combined,
    projected: parts[0],
    current: mix(x, parts[0], discard),
  };
}
export function strengthFrame(state) {
  const commonProgress = event(state, 0, 'common-scores'),
    contrastProgress = event(state, 1, 'contrast-scores');
  const commonCount = Math.min(3, Math.floor(3 * commonProgress + 1e-9)),
    contrastCount = Math.min(3, Math.floor(3 * contrastProgress + 1e-9));
  const scores = V.map((v) => apply(A, v));
  return {
    commonCount,
    contrastCount,
    scores,
    squaredTerms: scores.map((row) => row.map((value) => value * value)),
    norms: scores.map((row) => Math.hypot(...row)),
  };
}
export function gramCalculation(table = A) {
  const columns = table[0].map((_, column) => table.map((row) => row[column]));
  const products = columns.flatMap((left, row) =>
    columns.map((right, column) => ({
      row,
      column,
      terms: left.map((value, i) => [value, right[i]]),
      value: dotProduct(left, right),
    })),
  );
  const gram = columns.map((left) => columns.map((right) => dotProduct(left, right)));
  const [[a, off], [, d]] = gram,
    separation = Math.hypot(a - d, 2 * off);
  const eigenvalues = [(a + d + separation) / 2, (a + d - separation) / 2];
  const directions = eigenvalues.map((eigenvalue, i) => {
    const input = off ? [off, eigenvalue - a] : a >= d === (i === 0) ? [1, 0] : [0, 1];
    const vector = normalizeVector(input),
      action = gram.map((row) => dotProduct(row, vector));
    const scores = table.map((row) => dotProduct(row, vector)),
      squaredTerms = scores.map((value) => value * value);
    return {
      input,
      vector,
      action,
      eigenvalue,
      scores,
      squaredTerms,
      squaredNorm: dotProduct(scores, scores),
      norm: Math.hypot(...scores),
    };
  });
  return {
    columns,
    products,
    gram,
    directions,
  };
}
export const gramProductCues = ['gram-slow', 'gram-overlap', 'gram-mirror', 'gram-rollback'];
export function gramConstruction(state) {
  const build = event(state, 0, 'gram-column-products');
  const productPhases = gramProductCues.map((id, index) => {
    const cue = state.cues?.[id];
    if (cue) return cue.phase;
    const position = build * gramProductCues.length;
    if (position >= index + 1) return 'after';
    return position >= index ? 'during' : 'before';
  });
  const progress = (id) => {
    const cue = state.cues?.[id];
    return cue ? (cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress) : 1;
  };
  const direction = progress('gram-eigen-directions');
  return {
    activeProduct: Math.max(0, productPhases.findLastIndex((phase) => phase !== 'before')),
    entryCount: productPhases.filter((phase) => phase === 'after').length,
    directionProgress: [0, 1].map((i) => clamp(2 * direction - i)),
    normProgress: progress('common-strength-b3-1'),
  };
}
export function svdBuild(progress, firstSign = 1) {
  const input = [progress, 0],
    right = [common.map((v) => firstSign * v), contrast];
  const left = [U[0].map((v) => firstSign * v), U[1]];
  const coefficients = right.map((direction, i) => dotProduct(direction, input) * strengths[i]);
  const output = left[0].map((_, j) =>
    sum(left.map((direction, i) => direction[j] * coefficients[i])),
  );
  return {
    input,
    right,
    left,
    coefficients,
    output,
    reconstruction: multiplyMatrices(
      multiplyMatrices(
        A.map((_, j) => left.map((v) => v[j])),
        [
          [strengths[0], 0],
          [0, 1],
        ],
      ),
      right,
    ),
  };
}
export function svdFrame(state) {
  const rotate = event(state, 0, 'svd-input-basis'),
    scale = event(state, 1, 'singular-strengths');
  const embed = event(state, 1, 'svd-output'),
    sign = event(state, 2, 'signed-right') >= 0.5 ? -1 : 1;
  const model = svdBuild(1, sign),
    angle = (-Math.PI / 4) * rotate;
  const rotated = [Math.cos(angle), Math.sin(angle)];
  const scaled = [rotated[0] * (1 + (strengths[0] - 1) * scale), rotated[1]];
  const partProgress = state.cues?.['svd-common-output']
    ? [event(state, 1, 'svd-common-output'), embed]
    : [clamp(2 * embed), clamp(2 * embed - 1)];
  const outputParts = model.left.map((direction, i) =>
    direction.map((value) => value * model.coefficients[i]),
  );
  const firstOutput = outputParts[0].map((value) => value * partProgress[0]);
  const output = firstOutput.map((value, j) => value + outputParts[1][j] * partProgress[1]);
  return {
    rotate,
    scale,
    embed,
    sign,
    angle,
    rotated,
    scaled,
    model,
    partProgress,
    outputParts,
    output,
    firstOutputCoordinates: U.map((direction) => dotProduct(firstOutput, direction)),
    fixedOutputCoordinates: U.map((direction) => dotProduct(output, direction)),
  };
}
export function pairedSignFrame(state) {
  const progress = event(state, 0, 'signed-right'),
    sign = progress < 0.5 ? 1 : -1;
  const model = svdBuild(1, sign);
  return {
    progress,
    sign,
    right: model.right[0],
    left: model.left[0],
    coefficient: model.coefficients[0],
    firstContribution: model.left[0].map((v) => v * model.coefficients[0]),
    output: model.output,
  };
}
export function solverRoundingExample(decimals = 3, progress = 1) {
  const table = [
      [1, 1],
      [1, 1.04],
    ],
    cleanWeights = [1, 2],
    cleanTarget = apply(table, cleanWeights);
  const observations = [cleanTarget[0], cleanTarget[1] + 0.001];
  const rounded = (value) => Math.round(value * 10 ** decimals) / 10 ** decimals;
  const directTable = table.map((row) => row.map(rounded)),
    directTarget = observations.map(rounded);
  const columns = table[0].map((_, j) => table.map((row) => row[j]));
  const gram = columns.map((left) => columns.map((right) => dotProduct(left, right)));
  const projectedTarget = columns.map((column) => dotProduct(column, observations));
  const storedGram = gram.map((row) => row.map((v) => v + (rounded(v) - v) * progress));
  const storedTarget = projectedTarget.map((v) => v + (rounded(v) - v) * progress);
  const directWeights = solvePair(directTable, directTarget),
    normalWeights = solvePair(storedGram, storedTarget);
  const directPrediction = apply(table, directWeights),
    normalPrediction = apply(table, normalWeights);
  const separation = Math.hypot(gram[0][0] - gram[1][1], 2 * gram[0][1]);
  const eigenvalues = [
    (gram[0][0] + gram[1][1] + separation) / 2,
    (gram[0][0] + gram[1][1] - separation) / 2,
  ];
  return {
    table,
    cleanWeights,
    cleanTarget,
    observations,
    directTable,
    directTarget,
    gram,
    projectedTarget,
    storedGram,
    storedTarget,
    directWeights,
    normalWeights,
    directPrediction,
    normalPrediction,
    progress,
    decimals,
    directNoiseError: Math.hypot(...directWeights.map((v, i) => v - cleanWeights[i])),
    extraWeightDifference: Math.hypot(...normalWeights.map((v, i) => v - directWeights[i])),
    normalResidual: Math.hypot(...normalPrediction.map((v, i) => v - observations[i])),
    conditionNumber: Math.sqrt(eigenvalues[0] / eigenvalues[1]),
    gramConditionNumber: eigenvalues[0] / eigenvalues[1],
  };
}
export function compressionFrame(state) {
  const p = event(state, 0, 'discard-contrast');
  const rows = A.map((row) => {
    const c = V.map((v) => dotProduct(row, v));
    return common.map((value, j) => c[0] * value + (1 - p) * c[1] * contrast[j]);
  });
  return {
    progress: p,
    rows,
    error: Math.hypot(...A.flatMap((row, i) => row.map((value, j) => value - rows[i][j]))),
    coordinates: A.map((row) => V.map((v) => dotProduct(row, v))),
  };
}
export function pcaFrame(state) {
  const center = event(state, 0, 'centering-rule');
  const rows = A.map((row) => row.map((value, j) => value - mean[j] * center));
  const centered = A.map((row) => row.map((value, j) => value - mean[j]));
  const scores = V.map((v) => centered.map((row) => dotProduct(row, v)));
  const queryProgress = event(state, 2, 'center-new-row'),
    query = [2, 1];
  return {
    center,
    rows,
    centered,
    scores,
    energies: scores.map((values) => dotProduct(values, values)),
    commonCount: Math.min(3, Math.floor(3 * event(state, 1, 'common-spread') + 1e-9)),
    contrastCount: Math.min(3, Math.floor(3 * event(state, 1, 'contrast-spread') + 1e-9)),
    query,
    currentQuery: query.map((v, i) => v - queryProgress * mean[i]),
    queryProgress,
  };
}
export function rankFrame(state) {
  const duplicate = event(state, 0, 'duplicate-columns');
  const table = A.map((row, i) => row.map((v, j) => v + duplicate * (B[i][j] - v)));
  const minimum = leastSquaresFit(B).weights;
  const shift = 2 * event(state, 1, 'nullspace-rule') * (1 - event(state, 2, 'minimum-weight')),
    weights = [minimum[0] + shift, minimum[1] - shift];
  return {
    duplicate,
    table,
    shift,
    weights,
    prediction: apply(B, weights),
    nullAction: apply(B, [1, -1]),
    minimum,
  };
}
export function leastSquaresFit(table = A) {
  const columns = table[0].map((_, j) => table.map((row) => row[j]));
  const gram = columns.map((left) => columns.map((right) => dotProduct(left, right)));
  const rhs = columns.map((column) => dotProduct(column, severity));
  const determinant = gram[0][0] * gram[1][1] - gram[0][1] * gram[1][0];
  const weightSum = rhs[0] / gram[0][0];
  const weights = determinant
    ? [
        (rhs[0] * gram[1][1] - rhs[1] * gram[0][1]) / determinant,
        (gram[0][0] * rhs[1] - gram[1][0] * rhs[0]) / determinant,
      ]
    : [weightSum / 2, weightSum / 2];
  const prediction = apply(table, weights),
    residual = severity.map((v, i) => v - prediction[i]);
  return {
    target: severity,
    columns,
    weights,
    prediction,
    residual,
    squaredError: dotProduct(residual, residual),
    weightSum: sum(weights),
  };
}
export function leastSquaresFrame(state) {
  const fit = leastSquaresFit(),
    progress = event(state, 1, 'fit-projection');
  const weights = mix([1, 2], fit.weights, progress),
    prediction = apply(A, weights),
    residual = severity.map((v, i) => v - prediction[i]);
  return {
    fit,
    progress,
    weights,
    prediction,
    residual,
    squaredError: dotProduct(residual, residual),
    spanProgress: event(state, 0, 'fit-span'),
    residualProgress: event(state, 1, 'fit-residual'),
  };
}
export function duplicateFitFrame(state) {
  const fit = leastSquaresFit(B),
    progress = event(state, 0, 'duplicate-fit');
  const s = 3 + (fit.weightSum - 3) * progress,
    prediction = [s, 0, s],
    residual = severity.map((v, i) => v - prediction[i]);
  const along = normalizeVector(fit.columns[0]),
    normal = normalizeVector(fit.residual);
  return {
    fit,
    progress,
    sum: s,
    prediction,
    residual,
    squaredError: dotProduct(residual, residual),
    outputCoordinates: [dotProduct(prediction, along), dotProduct(prediction, normal)],
    targetCoordinates: [dotProduct(severity, along), dotProduct(severity, normal)],
  };
}
export function retrievalFrame(state) {
  const progress = event(state, 0, 'retrieval-ties');
  const map = (row) =>
    common.map(
      (v, j) =>
        dotProduct(row, common) * v + (1 - progress) * dotProduct(row, contrast) * contrast[j],
    );
  const query = map([1, 0]),
    rows = A.map(map);
  return {
    progress,
    query,
    rows,
    scores: rows.map((row) => dotProduct(row, query) / (Math.hypot(...row) * Math.hypot(...query))),
  };
}
export function sparseFrame(state) {
  const progress = event(state, 0, 'sparse-center');
  const values = Array.from(
    {
      length: 6,
    },
    (_, i) =>
      Array.from(
        {
          length: 6,
        },
        (_, j) => Number(i === j) - progress / 6,
      ),
  );
  return {
    progress,
    values,
    nonzeros: values.flat().filter((v) => Math.abs(v) > 1e-12).length,
  };
}
export function conditioningState(state = {}) {
  const noiseProgress = event(state, 1, 'conditioning-noise-b2-1');
  const inverseProgress = event(state, 1, 'conditioning-inverse-b2-2');
  const input = [0, 0.2],
    cleanOutput = apply(conditioningMatrix, input);
  const measuredOutput = [0, cleanOutput[1] + 0.001 * noiseProgress];
  const recovered = [0, input[1] + (measuredOutput[1] / 0.01 - input[1]) * inverseProgress];
  return {
    scale: 0.01,
    conditionNumber: 100,
    input,
    cleanOutput,
    noise: [0, 0.001],
    measuredOutput,
    recovered,
    inputError: recovered[1] - input[1],
    noiseProgress,
    inverseProgress,
  };
}
export function conditioningResult(state = {}) {
  const c = conditioningState(state);
  return !complete(c.noiseProgress) || !complete(c.inverseProgress)
    ? null
    : {
        outputWeakCoordinate: c.measuredOutput[1],
        inputWeakCoordinate: c.input[1],
        recoveredWeakCoordinate: c.recovered[1],
        absoluteError: Math.abs(c.inputError),
      };
}
export function ticketMeasurement(tickets, turn) {
  const angle = Math.PI / 4 + turn * Math.PI / 2;
  const direction = turn === 0 ? common : turn === 1 ? contrast : [Math.cos(angle), Math.sin(angle)];
  const scores = tickets.map(row => dotProduct(row, direction));
  const rows = scores.map(score => direction.map(v => v * score));
  return { direction, scores, rows };
}

export function decisionFrame(state) {
  const restored = event(state, 0, 'restore-contrast');
  const route = event(state, 1, 'route-tickets');
  const measurement = ticketMeasurement(A, restored);
  // These three nonempty binary tickets exhaust the router's input domain.
  const routes = measurement.scores.map(score => {
    if (restored !== 1) return null;
    if (score === 0) return 'Both teams';
    return score < 0 ? 'Performance' : 'Release repair';
  });
  return {
    ...measurement,
    restored,
    route,
    coordinates: A.map((row) => V.map((v) => dotProduct(row, v))),
    routes,
  };
}
export function spreadFrame(state) {
  const commonProgress = event(state, 0, 'common-spread'),
    contrastProgress = event(state, 0, 'contrast-spread');
  const angle = Math.PI / 4 + (Math.PI / 2) * contrastProgress;
  const direction = [Math.cos(angle), Math.sin(angle)],
    centered = A.map((row) => row.map((v, j) => v - mean[j]));
  const scores = centered.map((row) => dotProduct(row, direction));
  return {
    direction,
    centered,
    scores,
    projected: scores.map((value) => direction.map((v) => value * v)),
    energy: dotProduct(scores, scores),
    commonProgress,
    contrastProgress,
  };
}
