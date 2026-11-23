import { A, B } from './fixtures.mjs';
import { partialProduct } from './model.mjs';
export function doubleBuffer(clock) {
  const stages = [
    {
      tile: 0,
      loadStart: 0,
      ready: 1,
      computeStart: 1,
      computeEnd: 2,
    },
    {
      tile: 1,
      loadStart: 1,
      ready: 2,
      computeStart: 2,
      computeEnd: 3,
    },
  ];
  const completed = stages.filter((x) => x.computeEnd <= clock).length;
  return {
    stages: stages.map((x) => ({
      ...x,
      status:
        clock < x.loadStart
          ? 'empty'
          : clock < x.ready
            ? 'loading'
            : clock < x.computeEnd
              ? 'reading'
              : 'released',
    })),
    completed,
    output: partialProduct(0, completed === 0 ? 0 : completed === 1 ? 2 : 3),
  };
}
export function fragmentAccumulation(progress) {
  const a = A.map((row) => row.slice(0, 2)),
    b = B.slice(0, 2),
    count = Math.min(2, Math.floor(2 * Math.max(0, Math.min(1, (progress - 0.15) / 0.65))));
  const output = a.map((row) =>
    b[0].map((_, column) =>
      row.slice(0, count).reduce((sum, value, k) => sum + value * b[k][column], 0),
    ),
  );
  const previous = a.map((row) =>
    b[0].map((_, column) =>
      row.slice(0, Math.max(0, count - 1)).reduce((sum, value, k) => sum + value * b[k][column], 0),
    ),
  );
  const inner = Math.max(0, count - 1),
    activeA = a.map((row) =>
      row.map((value, column) => (count > 0 && column === inner ? value : 0)),
    ),
    activeB = b.map((row, index) => row.map((value) => (count > 0 && index === inner ? value : 0)));
  return {
    a,
    b,
    activeA,
    activeB,
    count,
    previous,
    output,
  };
}
export const phaseCue = (state, beat, id) => {
  const b = state.beat ?? 0;
  if (b < beat) return 0;
  if (b > beat) return 1;
  const c = state.cues?.[id];
  return c
    ? c.phase === 'before'
      ? 0
      : c.phase === 'after'
        ? 1
        : c.progress
    : Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.12) / 0.72));
};
