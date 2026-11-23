import { bounded, loss } from './arithmetic.mjs';
import { smoothstep } from 'vizmatic';
export function budgetAllocationState(state) {
  const seconds = Number.isFinite(state.t) ? state.t - 34.624 : (state.beatP ?? 0) * 15.944;
  const progress = smoothstep((seconds - 9.8) / (12.85 - 9.8)),
    n = 10 + 10 * progress,
    d = 100 / n;
  return {
    n,
    d,
    budget: n * d,
    progress,
  };
}
export function budgetAccountingState(beat, progress) {
  const seconds = Math.max(0, Math.min(1, progress)) * [16.176, 18.048, 15.944][beat];
  const ramp = (start, end) =>
    seconds >= end - 1e-9 ? 1 : Math.max(0, Math.min(1, (seconds - start) / (end - start)));
  const amounts =
    beat > 0
      ? [1, 1, 1]
      : [
          [7.19, 10.71],
          [12.1, 13.18],
          [13.18, 15.15],
        ].map(([a, z]) => ramp(a, z));
  const labels = ['Forward', 'Input gradient', 'Weight gradient'];
  return {
    seconds,
    parts: amounts.map((amount, i) => ({
      label: labels[i],
      amount,
      units: 2,
    })),
    completed: amounts.filter((value) => value === 1).length,
    perToken: 2 * amounts.filter((value) => value === 1).length,
    showTraining: beat > 1 || (beat === 1 && seconds >= 4.85),
    allocationView: beat === 2 && seconds >= 5,
  };
}
export function growthState(state) {
  const beat = state.beat ?? 0,
    seconds = Number.isFinite(state.t) ? state.t - 0.4 : (state.beatP ?? 0) * 17.016;
  const progress = beat > 0 ? 1 : smoothstep((seconds - 3.775) / (6.9875 - 3.775)),
    n = 10 + 10 * progress,
    d = n,
    budget = n * d;
  return {
    progress,
    n,
    d,
    budget,
    loss: loss(n, d),
    baseline: {
      budget: 100,
      n: 10,
      d: 10,
      loss: loss(10, 10),
    },
  };
}
export function sampleTradeoff(beat, beatP) {
  const p = Math.max(0, Math.min(1, beatP));
  const phase = (start, end) => smoothstep((p - start) / (end - start));
  if (beat === 2)
    return {
      mode: 'prediction',
      revealLosses: false,
      candidates: [
        {
          id: 'A',
          n: 5,
          d: 20,
        },
        {
          id: 'B',
          n: 10,
          d: 10,
        },
      ].map((row) => ({
        ...row,
        loss: loss(row.n, row.d),
      })),
    };
  // Measured speech: slide right in beat0; reverse, then settle in the valley in beat1.
  const n =
    beat === 0
      ? 2.5 + 37.5 * phase(0.405, 0.84)
      : p < 0.56
        ? 2.5 + 37.5 * phase(0.155, 0.56)
        : 40 - 30 * phase(0.56, 0.7);
  const d = 100 / n;
  return {
    mode: beat === 0 ? 'allocation-sweep' : 'loss-profile-replay',
    n,
    d,
    loss: loss(n, d),
  };
}
export function fitExponentGrid() {
  const rows = [
    [1e8, 1e9, 2.895],
    [1e8, 5e9, 2.745],
    [1e8, 2e10, 2.634],
    [5e8, 1e9, 2.813],
    [5e8, 5e9, 2.663],
    [5e8, 2e10, 2.552],
    [1e9, 5e9, 2.631],
    [1e9, 2e10, 2.52],
  ].map(([n, d, loss]) => ({ n, d, loss }));
  const cells = [];
  let best;
  for (let betaMilli = 40; betaMilli <= 120; betaMilli += 2) {
    for (let alphaMilli = 40; alphaMilli <= 120; alphaMilli += 2) {
      const alpha = alphaMilli / 1000,
        beta = betaMilli / 1000;
      const sse = rows.reduce((sum, row) => {
        const predicted = 1.1 + 2.8 / row.n ** alpha + 7.8 / row.d ** beta;
        return sum + (predicted - row.loss) ** 2;
      }, 0);
      // Show a close-up of the grid while scoring every pair in the article.
      const i = (alphaMilli - 52) / 2,
        j = (betaMilli - 70) / 2;
      const cell = { i, j, alpha, beta, sse };
      if (i >= 0 && i < 19 && j >= 0 && j < 26) cells.push(cell);
      if (!best || sse < best.sse) best = cell;
    }
  }
  return { rows, cells, best };
}
export const EXPONENT_GRID = fitExponentGrid();
export function simultaneousWidthUpdate(width, coordinated = false, eta = 1) {
  const u = Array.from(
      {
        length: width,
      },
      (_, i) => (i % 2 ? -1 : 1),
    ),
    v = Array(width).fill(coordinated ? 1 / width : 1 / Math.sqrt(width));
  const f = u.reduce((s, x, i) => s + x * v[i], 0),
    error = f - 1,
    du = v.map((x) => error * x),
    dv = u.map((x) => error * x);
  const un = u.map((x, i) => x - eta * (coordinated ? width : 1) * du[i]),
    vn = v.map((x, i) => x - eta * (coordinated ? 1 / width : 1) * dv[i]);
  return {
    u,
    v,
    du,
    dv,
    un,
    vn,
    prediction: un.reduce((s, x, i) => s + x * vn[i], 0),
    target: 1,
  };
}
export function freshAllocationState(beat, progress) {
  const p = bounded(progress),
    base = {
      n: 15,
      d: 60,
    };
  if (beat === 0)
    return {
      known: false,
      constrained: false,
      candidates: [
        [7.5, 120],
        [15, 60],
        [30, 30],
      ].map(([n, d]) => ({
        n,
        d,
        loss: loss(n, d, 3, 6),
      })),
    };
  const t = beat < 2 ? 0 : beat > 2 ? 1 : smoothstep(p),
    n = 15 + 7.5 * t,
    d = 900 / n;
  return {
    known: beat > 1 || p === 1,
    constrained: beat >= 2,
    n,
    d,
    loss: loss(n, d, 3, 6),
    settled: beat > 2 || p === 1,
    base,
  };
}
