import {
  bootstrap,
  jointDifferenceMoments,
  orderedTaskResamples,
  passAtK,
  peekSequence,
  percentileInterval,
  random,
  repeatedStudies,
  subsets,
  waldMeanDifference,
} from './arithmetic.mjs';
export const paired = [
  {
    task: 'timestamp',
    a: 1,
    b: 1,
  },
  {
    task: 'permission',
    a: 0,
    b: 1,
  },
  {
    task: 'retry budget',
    a: 1,
    b: 1,
  },
  {
    task: 'deduplication',
    a: 0,
    b: 0,
  },
  {
    task: 'quota rounding',
    a: 1,
    b: 1,
  },
  {
    task: 'cache expiry',
    a: 0,
    b: 0,
  },
];
export const taskRows = Object.freeze(
  [
    ...paired.map((r) => ({
      ...r,
    })),
    ...Array.from(
      {
        length: 14,
      },
      (_, i) => ({
        task: `shared pass ${i + 1}`,
        a: 1,
        b: 1,
      }),
    ),
    ...Array.from(
      {
        length: 8,
      },
      (_, i) => ({
        task: `shared failure ${i + 1}`,
        a: 0,
        b: 0,
      }),
    ),
    ...Array.from(
      {
        length: 7,
      },
      (_, i) => ({
        task: `B-only task ${i + 1}`,
        a: 0,
        b: 1,
      }),
    ),
    ...Array.from(
      {
        length: 5,
      },
      (_, i) => ({
        task: `A-only task ${i + 1}`,
        a: 1,
        b: 0,
      }),
    ),
  ].map((r, i) =>
    Object.freeze({
      ...r,
      id: `T${String(i + 1).padStart(2, '0')}`,
      difference: r.b - r.a,
    }),
  ),
);
export const holdoutRows = Object.freeze(
  Array.from(
    {
      length: 400,
    },
    (_, i) =>
      Object.freeze({
        id: `H${String(i + 1).padStart(3, '0')}`,
        a: i < 52 ? 0 : i < 264 ? 1 : 0,
        b: i < 52 ? 1 : i < 64 ? 0 : i < 264 ? 1 : 0,
        difference: i < 52 ? 1 : i < 64 ? -1 : 0,
      }),
  ),
);
export const variantStudies = repeatedStudies(13, 0.5, 3, 20);
export const studies = {
  null: repeatedStudies(13, 0.5, 71),
  small: repeatedStudies(13, 0.65, 71),
  large: repeatedStudies(64, 0.65, 71),
};
export const developmentBootstrap = bootstrap(taskRows, 8000, 7218);
export const holdoutBootstrap = bootstrap(holdoutRows, 8000, 314159);
export const sortedDevelopmentMeans = [...developmentBootstrap.means].sort((a, b) => a - b);
export const passingCandidates = [2, 7];
export const candidateSubsets = subsets(10, 3).map((ids, i) => ({
  id: i + 1,
  ids,
  passes: ids.some((id) => passingCandidates.includes(id)),
}));
export const peeking = peekSequence(9);
export const pairedIntervalStudies = (() => {
  const rng = random(19),
    rows = jointDifferenceMoments().rows;
  return Array.from(
    {
      length: 20,
    },
    (_, i) => {
      const values = Array.from(
          {
            length: 40,
          },
          () => {
            let x = rng();
            for (const r of rows) {
              x -= r.p;
              if (x < 0) return r.b - r.a;
            }
            return 0;
          },
        ),
        r = waldMeanDifference(values);
      return {
        id: i + 1,
        values,
        ...r,
        covers: r.interval[0] <= 0 && r.interval[1] >= 0,
      };
    },
  );
})();
export const macroTaskScores = [0, 1, 2, 4].map((c) => passAtK(c, 10, 5));
export const macroTaskResamples = (() => {
  const all = orderedTaskResamples(macroTaskScores),
    first = all.find((r) => r.ids.every((id, i) => id === i));
  return [first, ...all.filter((r) => r !== first)];
})();
export const macroTaskInterval = percentileInterval(macroTaskResamples.map((r) => r.mean));
