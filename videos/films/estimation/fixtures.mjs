import { bootstrapBin, count, message, quantile, wilson } from './model.mjs';
import { seededRandom } from 'vizmatic';
export function buildWeeklySample() {
  const random = seededRandom(1459),
    selected = new Set();
  while (selected.size < 400) selected.add(Math.floor(random() * 100000));
  const weeklySample = [...selected].map(message);
  return {
    weeklySample,
  };
}
export const { weeklySample } = buildWeeklySample();
export const weeklyQueue = {
  size: 100000,
  specialist: 18000,
  capacity: 20000,
};
// First-pass labels from the separate, illustrative agreement exercise.
export const readerPairs = [
  { id: 17, a: 'Routine', b: 'Specialist' },
  { id: 18, a: 'Routine', b: 'Routine' },
  { id: 19, a: 'Specialist', b: 'Specialist' },
  { id: 20, a: 'Routine', b: 'Routine' },
];
export function buildSamplingBatches() {
  const rng = seededRandom(20261029);
  const simulate = (n) =>
    Array.from(
      {
        length: n,
      },
      (_, i) => ({
        id: 'S' + (i + 1),
        specialist: rng() < 0.16,
      }),
    );
  const batches100 = Array.from(
    {
      length: 40,
    },
    () => simulate(100),
  );
  const batches400 = Array.from(
    {
      length: 40,
    },
    () => simulate(400),
  );
  const coverageBatches = Array.from(
    {
      length: 24,
    },
    () => simulate(100),
  );
  return {
    batches100,
    batches400,
    coverageBatches,
  };
}
export const { batches100, batches400, coverageBatches } = buildSamplingBatches();
export const coverageIntervals = coverageBatches.map((rows) => {
  const k = count(rows),
    interval = wilson(k, rows.length);
  return {
    k,
    n: rows.length,
    interval,
    covers: interval.low <= 0.16 && interval.high >= 0.16,
  };
});
export function buildBootstrapDraws() {
  const bootstrapRandom = seededRandom(1961);
  const firstDraw = Array.from(
    {
      length: 100,
    },
    () => Math.floor(bootstrapRandom() * 100),
  );
  const positiveIndex = firstDraw[0];
  const bootstrapSamples = [
    firstDraw,
    ...Array.from(
      {
        length: 399,
      },
      () =>
        Array.from(
          {
            length: 100,
          },
          () => Math.floor(bootstrapRandom() * 100),
        ),
    ),
  ];
  return {
    firstDraw,
    positiveIndex,
    bootstrapSamples,
  };
}
export const { firstDraw, positiveIndex, bootstrapSamples } = buildBootstrapDraws();
export const bootstrapRates = bootstrapSamples.map(
  (ids) => count(ids.map((i) => weeklySample[i])) / 100,
);
export function buildBootstrapBins() {
  const bootstrapBins = Array(36).fill(0);
  for (const rate of bootstrapRates) bootstrapBins[bootstrapBin(rate)]++;
  return {
    bootstrapBins,
  };
}
export const { bootstrapBins } = buildBootstrapBins();
export const bootstrapRange = [
  quantile(
    [...bootstrapRates].sort((a, b) => a - b),
    0.025,
  ),
  quantile(
    [...bootstrapRates].sort((a, b) => a - b),
    0.975,
  ),
];
export const sliceModel = [
  {
    name: 'Routine',
    share: 0.7,
    rate: 0.12,
    expected: 84,
  },
  {
    name: 'Billing',
    share: 0.2,
    rate: 0.25,
    expected: 50,
  },
  {
    name: 'Account access',
    share: 0.1,
    rate: 0.42,
    expected: 42,
  },
];
