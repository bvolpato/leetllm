import { counts, parallel, serial } from './fixtures.mjs';
export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const expertProjectionFlops = (rows) =>
  2 * rows * 4096 * (2 * 2048) + 2 * rows * 2048 * 4096;
export function packing(alignment) {
  const padded = counts.map((v) => Math.ceil(v / alignment) * alignment),
    useful = sum(counts),
    capacity = sum(padded);
  return {
    alignment,
    padded,
    useful,
    capacity,
    utilization: useful / capacity,
    usefulFlops: expertProjectionFlops(useful),
    paddedFlops: expertProjectionFlops(capacity),
  };
}
export function scaledDot() {
  const a = [1, 2, 3, 4],
    z = [2, 1, -1, 2],
    sa = [0.5, 2],
    sz = [2, 0.25],
    raw = [0, 1].map((g) => sum([0, 1].map((i) => a[2 * g + i] * z[2 * g + i]))),
    products = sa.map((v, i) => v * sz[i]),
    partial = raw.map((v, i) => v * products[i]);
  return {
    a,
    z,
    sa,
    sz,
    raw,
    products,
    partial,
    result: sum(partial),
    explicit: sum(a.map((v, i) => v * sa[Math.floor(i / 2)] * z[i] * sz[Math.floor(i / 2)])),
  };
}
export function copyLayoutViews() {
  const shape = [2, 3],
    strides = [shape[1], 1];
  const view = (shape, strides) => ({
    shape,
    strides,
    accepted: strides.at(-1) === 1,
  });
  return {
    base: view(shape, strides),
    transpose: view([...shape].reverse(), [...strides].reverse()),
  };
}
export function indexerReference(key = [1, -0.5]) {
  const queries = [
      [1, 0],
      [0, 1],
    ],
    weights = [0.4, 0.6];
  const dots = queries.map((query) => sum(query.map((value, i) => value * key[i])));
  const relu = dots.map((value) => Math.max(0, value));
  return {
    key,
    queries,
    dots,
    relu,
    weights,
    score: sum(relu.map((value, i) => value * weights[i])),
  };
}
export function ringSchedule(slots) {
  if (slots !== 1 && slots !== 2)
    throw new RangeError('This two-chunk illustration supports one or two slots');
  return (slots === 1 ? serial : parallel).map((event) => ({
    ...event,
  }));
}
export function gemmTile(progress) {
  const a = [
      [1, 2],
      [0, -1],
    ],
    z = [
      [3, 4],
      [1, -1],
    ],
    result = a.map((row) => z.map((weight) => sum(row.map((v, k) => v * weight[k])))),
    stage = Math.min(8, Math.floor(progress * 8 + 1e-9)),
    completed = Math.floor(stage / 2),
    focus = Math.min(3, completed),
    i = Math.floor(focus / 2),
    j = focus % 2,
    coordinates = stage === 8 ? 2 : stage % 2,
    partial = sum(a[i].slice(0, coordinates).map((v, k) => v * z[j][k]));
  return {
    a,
    z,
    result,
    completed,
    focus,
    i,
    j,
    coordinates,
    partial,
  };
}
export const bounded = (value) => Math.max(0, Math.min(1, value));
export const interpolate = (a, b, p) => a + (b - a) * bounded(p);
export function alignExpertRows(rows, alignment) {
  if (
    !Number.isInteger(alignment) ||
    alignment < 1 ||
    !Array.isArray(rows) ||
    rows.some((n) => !Number.isInteger(n) || n < 0)
  )
    throw new RangeError('Non-negative expert rows and positive integer alignment required');
  const capacities = rows.map((n) => Math.ceil(n / alignment) * alignment),
    useful = sum(rows),
    capacity = sum(capacities),
    padding = capacity - useful;
  return {
    rows: [...rows],
    alignment,
    capacities,
    useful,
    capacity,
    padding,
    paddingShare: capacity ? padding / capacity : 0,
    overhead: useful ? padding / useful : 0,
  };
}
export function compressedKeySelection(values, start, end, k = 1) {
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    end < start ||
    !Number.isInteger(k) ||
    k < 0 ||
    end - start > values.length
  )
    throw new RangeError('Invalid compressed score span');
  return values
    .slice(0, end - start)
    .map((score, column) => ({
      score,
      column,
      token: start + column,
    }))
    .sort((a, b) => b.score - a.score || a.column - b.column)
    .slice(0, k);
}
export function sparseCachePosition(blocks, width, column, validBlocks = blocks.length) {
  if (
    !Number.isInteger(width) ||
    width < 1 ||
    !Number.isInteger(column) ||
    column < 0 ||
    !Number.isInteger(validBlocks) ||
    validBlocks < 0 ||
    validBlocks > blocks.length
  )
    throw new RangeError('Invalid sparse column');
  const valid = blocks.slice(0, validBlocks);
  if (valid.some((v, i) => !Number.isInteger(v) || v < 0 || (i > 0 && v <= valid[i - 1])))
    throw new RangeError('Sparse block prefix must be unique and increasing');
  const blockIndex = Math.floor(column / width),
    offset = column % width;
  if (blockIndex >= validBlocks) throw new RangeError('Sparse column exceeds valid prefix');
  return {
    blockIndex,
    block: valid[blockIndex],
    offset,
    token: valid[blockIndex] * width + offset,
  };
}
export function expertWeightedReturn(results, weights) {
  if (
    results.length !== weights.length ||
    !results.length ||
    results.some((v) => !Number.isFinite(v)) ||
    weights.some((v) => !Number.isFinite(v))
  )
    throw new RangeError('Finite matching expert returns and weights required');
  const contributions = results.map((v, i) => v * weights[i]);
  return {
    results,
    weights,
    contributions,
    total: sum(contributions),
  };
}

// Widths may be fractional while the drawing moves between two integer layouts.
export function packSegments(rows, widths, assemble = 1) {
  let next = 0;
  return rows.map((count, i) => {
    const segment = { count, width: widths[i], start: next * assemble };
    next += segment.width;
    return segment;
  });
}

export function compareReturnedRows(reference, returned) {
  if (reference.length !== returned.length) throw new RangeError('Expected one value per source row');
  const matches = reference.map((value, i) => value === returned[i]);
  return { matches, pass: matches.every(Boolean), total: sum(returned) };
}
