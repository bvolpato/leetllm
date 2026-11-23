import { loss } from '../arithmetic.mjs';
import { spoken } from '../cue.mjs';
import { curve, line, point, text } from '../defaults.mjs';

const runs = [2, 4, 6, 8, 10, 14, 20, 30, 40].map((n, i) => ({
  x: n,
  y: loss(n, 100 / n) + 0.025 * Math.sin(i * 3),
}));

export function drawFitting(ctx, scene, state, api) {
  const { C } = api;
  const observed = 2.02,
    forecast = loss(25, 16);
  const runProgress = spoken(scene, state, 'fitting-b1-1').progress;
  const larger = spoken(scene, state, 'fitting-forecast');
  const measured = spoken(scene, state, 'fitting-observed').phase === 'after';
  const residual = spoken(scene, state, 'fitting-residual').phase === 'after';
  const x = 300,
    bottom = 815,
    width = 1200,
    height = 445;
  const yLow = 1.7,
    yHigh = 3.1;
  const X = (n) => x + ((n - 2) / 38) * width;
  const Y = (v) => bottom - ((v - yLow) / (yHigh - yLow)) * height;
  text(
    ctx,
    api,
    'Illustrative proxy runs on the same evaluation set',
    960,
    265,
    37,
    C.muted,
    'center',
  );
  api.focus.target('proxy-loss-curves', () => {
    const axes = api.teaching.axes({
      x,
      y: bottom - height,
      width,
      height,
      xDomain: [2, 40],
      yDomain: [yLow, yHigh],
      xTicks: [10, 20, 30, 40],
      yTicks: [1.9, 2.3, 2.7, 3],
      xLabel: 'Parameter units',
      yLabel: 'Fitted and observed loss',
      color: C.muted,
    });
    api.teaching.scatter({
      plot: axes,
      points: runs.slice(0, 1 + Math.floor(runProgress * (runs.length - 1))),
      radius: 8,
      color: C.blue,
    });
    curve(
      ctx,
      api,
      axes,
      (n) => loss(n, 100 / n),
      2,
      40,
      C.blue,
      spoken(scene, state, 'fitting-b2-1').progress,
    );
    if (larger.phase !== 'before') {
      curve(ctx, api, axes, (n) => loss(n, 400 / n), 2, 40, C.cyan, larger.progress);
      if (larger.phase === 'after') point(ctx, api, axes, 25, forecast, C.cyan);
    }
    if (measured) {
      line(ctx, api, X(25), Y(observed), X(25), Y(forecast), C.yellow, 4);
      point(ctx, api, axes, 25, observed, C.yellow);
      text(ctx, api, '2.02 observed', X(25) - 23, Y(observed) - 17, 32, C.yellow, 'right');
    }
    if (larger.phase === 'after')
      text(ctx, api, '1.90 forecast', X(25) + 20, Y(forecast) + 57, 32, C.cyan);
  });
  if (residual)
    text(
      ctx,
      api,
      'Observed − forecast = +' + (observed - forecast).toFixed(2) + ' nats per token',
      960,
      976,
      40,
      C.ink,
      'center',
    );
  else
    text(
      ctx,
      api,
      larger.phase === 'before' ? 'N × D = 100' : 'Larger budget   N × D = 400',
      960,
      976,
      38,
      C.muted,
      'center',
    );
}
export default {
  id: 'fitting',
  draw: drawFitting,
  cues: [
    'fitting-b1-1',
    'fitting-b2-1',
    'fitting-forecast',
    'fitting-observed',
    'fitting-residual',
    'fitting-b3-1',
  ],
};
