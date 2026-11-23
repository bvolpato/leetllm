import { gappedRows } from './fixtures.mjs';
export const clamp = (p) => Math.max(0, Math.min(1, p));
export const motion = (p) => {
  const q = clamp((p - 0.08) / 0.68);
  return q * q * (3 - 2 * q);
};
export const mix = (a, b, p) => a + (b - a) * p;
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export function rms(values, weights, eps) {
  const mean = sum(values.map((x) => x * x)) / values.length,
    scale = 1 / Math.sqrt(mean + eps);
  return {
    mean,
    scale,
    outputs: values.map((x, i) => x * scale * weights[i]),
  };
}
export const dispatch = (r) => r.cuda && r.contiguous && r.h % 128 === 0 && !r.grad;
export function layoutDispatch() {
  const rows = [0, 1].map((row) => hostTensorRow(gappedRows, row)),
    flattened = Array.from(
      {
        length: 4,
      },
      (_, i) => 4 + i,
    );
  return {
    rows,
    flattened,
    flattenedValues: flattened.map((i) => gappedRows.storage[i]),
    contiguous: gappedRows.strides[0] === gappedRows.shape[1] && gappedRows.strides[1] === 1,
    reference: rows.map((row) => rms(row.values, [1, 1, 1, 1], 1e-5).outputs),
  };
}
export function isolatedCommand(operation) {
  const allowed = ['build-K1', 'read-A', 'write-B'];
  return {
    operation,
    toolchain: 'T1',
    worker: 'W17',
    allowed: allowed.includes(operation),
    outside: ['evaluator', 'hidden cases', 'credentials', 'production'],
  };
}
export function binaryAddress(index) {
  const allocation = Array.from(
      {
        length: 8,
      },
      (_, i) => i + 1,
    ),
    valid = Number.isInteger(index) && index >= 0 && index < allocation.length;
  return {
    allocation,
    index,
    valid,
    value: valid ? allocation[index] : null,
    error: valid ? null : 'OUT_OF_ALLOCATION',
  };
}
export function hostTensorRow(fixture, row) {
  const [rows, width] = fixture.shape,
    [rowStride, columnStride] = fixture.strides;
  if (!Number.isInteger(row) || row < 0 || row >= rows) throw new RangeError('invalid logical row');
  const addresses = Array.from(
    {
      length: width,
    },
    (_, column) => row * rowStride + column * columnStride,
  );
  if (
    addresses.some(
      (address) => !Number.isInteger(address) || address < 0 || address >= fixture.storage.length,
    )
  )
    throw new RangeError('view exceeds supplied host storage');
  const values = addresses.map((address) => fixture.storage[address]);
  if (!values.every(Number.isFinite)) throw new TypeError('host values must be finite');
  return {
    addresses,
    values,
  };
}
export function executeHostKernelCase(fixture) {
  const rows = Array.from(
    {
      length: fixture.shape[0],
    },
    (_, row) => hostTensorRow(fixture, row),
  );
  const weights = Array(fixture.shape[1]).fill(1);
  const referenceCall = () => rows.map(row => rms(row.values, weights, 1e-5));
  const reference = referenceCall();
  const supported =
    fixture.shape[0] === 2 &&
    fixture.shape[1] === 4 &&
    fixture.strides[0] === 4 &&
    fixture.strides[1] === 1;
  // This deliberately flawed teaching candidate returns zeros outside its public shape/layout.
  const candidateCall = () => supported
    ? rows.map(row => rms(row.values, weights, 1e-5).outputs)
    : rows.map(row => row.values.map(() => 0));
  const candidate = candidateCall();
  // Replay the same valid call through a wrapper that checks before invoking the candidate.
  const guardedOutput = supported ? candidateCall() : referenceCall().map(row => row.outputs);
  const errors = reference.flatMap((row, i) =>
    row.outputs.map((value, j) => Math.abs(value - candidate[i][j])),
  );
  return {
    fixture,
    rows,
    reference,
    candidate,
    supported,
    guardedRoute: supported ? 'candidate' : 'reference',
    guardedOutput,
    maxError: Math.max(...errors),
    matches: reference.every((row, i) =>
      row.outputs.every((expected, j) => tolerance(expected, candidate[i][j], 1e-6, 1e-5).pass),
    ),
  };
}
export function validEpsilon(value) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isFinite(Math.fround(value)) &&
    Math.fround(value) > 0
  );
}
export function tolerance(reference, candidate, atol, rtol) {
  const error = Math.abs(candidate - reference),
    allowance = atol + rtol * Math.abs(reference);
  return {
    error,
    allowance,
    pass: error <= allowance,
  };
}
export function warpSectors(stride, base = 0) {
  const addresses = Array.from(
    {
      length: 32,
    },
    (_, lane) => base + 4 * stride * lane,
  );
  return {
    addresses,
    sectors: [
      ...new Set(
        addresses.flatMap((a) =>
          Array.from(
            {
              length: 4,
            },
            (_, byte) => Math.floor((a + byte) / 32),
          ),
        ),
      ),
    ],
    usefulBytes: 128,
  };
}
export function cacheLineReads(count) {
  return {
    reads: count,
    logicalBytes: 64 * count,
    fillBytes: count ? 64 : 0,
    hits: Math.max(0, count - 1),
  };
}
export function scoreFastP(tasks, threshold) {
  const eligible = tasks.filter((t) => t.correct && t.speedup > threshold).length;
  return {
    eligible,
    total: tasks.length,
    fraction: eligible / tasks.length,
  };
}
export function freshPromotion() {
  const fixture = { shape: [2, 2], strides: [1, 2], storage: [5, 8, 12, 15] };
  const { values, addresses } = hostTensorRow(fixture, 0);
  const weights = [1, 2], epsilon = 1e-5;
  const packed = fixture.strides[1] === 1 && fixture.strides[0] === fixture.shape[1];
  const wideCall = { cuda: true, contiguous: true, h: 128, grad: false };
  return {
    fixture,
    addresses,
    wideCall,
    wideEligible: dispatch(wideCall),
    safetyReport: null,
    values,
    weights,
    epsilon,
    route: dispatch({
      cuda: true,
      contiguous: packed,
      h: fixture.shape[1],
      grad: false,
    })
      ? 'FAST'
      : 'REFERENCE',
    ...rms(values, weights, epsilon),
  };
}
