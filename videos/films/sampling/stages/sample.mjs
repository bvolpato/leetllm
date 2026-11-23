import { begun } from '../construction.mjs';
import { lateProbability, sampleFrame } from '../model.mjs';
import {
  drawOriginalSamplingDot,
  drawOriginalSamplingEquation,
  drawOriginalSamplingPath,
  drawOriginalSamplingTarget,
  drawOriginalSamplingText,
} from '../defaults.mjs';
export function drawSample(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const guide = (q, x, top, color) =>
    drawOriginalSamplingPath(ctx, api, [q.point(x, 0), q.point(x, top)], color, 3);
  const percent = (value) => (100 * value).toFixed(1) + '%';
  {
    const f = sampleFrame(state),
      q = api.teaching.axes({
        x: 230,
        y: 410,
        width: 1400,
        height: 380,
        xDomain: [0, 20],
        yDomain: [0, 7],
        xTicks: [0, 6, 10, 15, 20],
        yTicks: [],
        xLabel: 'duration bins (seconds)',
        yLabel: '',
      });
    guide(q, 10, 7, themeColors.pink);
    drawOriginalSamplingText(
      ctx,
      api,
      '10-second timer',
      1550,
      355,
      29,
      themeColors.pink,
      'center',
    );
    const destination = (row) => q.point(row.bin * 2 + 1, row.stack + 0.5);
    drawOriginalSamplingTarget(ctx, api, 'sample-points', () => {
      f.landed.forEach((row) => {
        const at = destination(row);
        drawOriginalSamplingDot(ctx, api, at, row.late ? themeColors.pink : themeColors.blue, 21);
        drawOriginalSamplingText(
          ctx,
          api,
          String(row.id),
          at.x,
          at.y + 7,
          20,
          themeColors.bg,
          'center',
        );
      });
      if (f.moving) {
        const end = destination(f.moving),
          start = {
            x: end.x,
            y: 350,
          },
          at = {
            x: end.x,
            y: api.lerp(start.y, end.y, f.moving.progress),
          };
        drawOriginalSamplingDot(
          ctx,
          api,
          at,
          f.moving.late ? themeColors.pink : themeColors.blue,
          21,
        );
        drawOriginalSamplingText(
          ctx,
          api,
          String(f.moving.id),
          at.x,
          at.y + 7,
          20,
          themeColors.bg,
          'center',
        );
      }
      drawOriginalSamplingText(
        ctx,
        api,
        f.moving
          ? `request ${f.moving.id} · u=${f.moving.u.toFixed(3)} → ${f.moving.seconds.toFixed(2)} s`
          : f.n
            ? `last arrival: request ${f.landed.at(-1).id} · ${f.landed.at(-1).seconds.toFixed(2)} s`
            : 'Recorded stream ready · first request pending',
        960,
        290,
        32,
        themeColors.yellow,
        'center',
      );
    });
    drawOriginalSamplingTarget(ctx, api, 'sample-count', () => {
      drawOriginalSamplingText(
        ctx,
        api,
        `${f.late} late / ${f.n} landed`,
        960,
        910,
        44,
        themeColors.pink,
        'center',
      );
      drawOriginalSamplingText(
        ctx,
        api,
        f.n
          ? `sample rate ${percent(f.rate)} · model rate ${percent(lateProbability)}`
          : 'The denominator counts arrived requests',
        960,
        965,
        30,
        themeColors.muted,
        'center',
      );
    });
    drawOriginalSamplingTarget(ctx, api, 'sample-tail', () => {
      if (beat === 2 && begun(state, 'sample-tail-budget', 0.5)) {
        drawOriginalSamplingEquation(
          ctx,
          api,
          'P(\\text{none above p95})=0.95^{20}\\approx0.358',
          960,
          355,
          37,
          themeColors.yellow,
          'center',
        );
      }
    });
  }
}
export default {
  id: 'sample',
  draw: drawSample,
  cues: ['sample-five', 'sample-twenty', 'sample-tail-budget'],
};
