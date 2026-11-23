import { cueStep } from '../construction.mjs';

const rate = 20;
const survival = (ms) => Math.exp((-rate * ms) / 1000);
const percent = (p) => (100 * p).toFixed(1) + '%';

export function drawServiceRate(ctx, scene, state, api) {
  const { C } = api;
  const elapsed = cueStep(state, 'service-elapsed', 1, 0.1, 0.43);
  const answer = cueStep(state, 'sp-service-rate-1', 2, 0, 0.24);
  api.focus.target('sp-service-rate-visual', () => {
    const plot = api.teaching.axes({
      x: 215,
      y: 341,
      width: 1000,
      height: 463,
      xDomain: [0, 200],
      yDomain: [0, 1],
      xTicks: [0, 50, 100, 150, 200],
      yTicks: [0, 0.5, 1],
      xLabel: 'time since service began (ms)',
      yLabel: 'fraction still busy',
    });
    api.teaching.curve({
      plot,
      points: Array.from({ length: 201 }, (_, x) => ({ x, y: survival(x) })),
      color: C.cyan,
      width: 5,
    });
    const start = 50 * elapsed,
      end = start + 100;
    const intervalY = 913,
      a = plot.point(start, 0).x,
      b = plot.point(end, 0).x;
    api.line(ctx, a, intervalY, b, intervalY, C.yellow, 5);
    for (const [ms, x] of [
      [start, a],
      [end, b],
    ]) {
      const top = plot.point(ms, survival(ms));
      api.line(ctx, x, intervalY - 12, x, intervalY + 12, C.yellow, 4);
      api.line(ctx, x, top.y, x, plot.point(ms, 0).y, C.yellow, 3);
      api.circle(ctx, x, top.y, 10, C.yellow);
    }
    api.text(ctx, '100 ms', (a + b) / 2, intervalY + 60, 38, C.yellow, 'center');
    const readout = (label, value, y, color) => {
      api.text(ctx, label, 1545, y, 33, C.muted, 'center');
      api.text(ctx, value, 1545, y + 73, 50, color, 'center');
    };
    if (state.beat === 0) {
      readout('Service rate', rate + ' / second', 390, C.ink);
      if (cueStep(state, 'sp-service-rate-0', 0, 0.45, 0.65) === 1)
        readout('Mean service time', 1000 / rate + ' ms', 568, C.cyan);
      readout('Busy past 100 ms', percent(survival(100)), 748, C.yellow);
    } else if (state.beat < 3) {
      readout('Already in service', Math.round(start) + ' ms', 413, C.ink);
      readout(
        'Chance of another 100 ms',
        answer === 1 ? percent(survival(end) / survival(start)) : '?',
        638,
        C.yellow,
      );
    } else {
      readout('Python rate', rate + ' / second', 377, C.cyan);
      readout('NumPy scale', 1 / rate + ' s', 570, C.yellow);
      readout('If scale is 20 s', rate * rate + '× the mean', 762, C.pink);
    }
  });
}

export default {
  id: 'service-rate',
  draw: drawServiceRate,
  cues: ['sp-service-rate-0', 'service-elapsed', 'sp-service-rate-1', 'sp-service-rate-2'],
};
