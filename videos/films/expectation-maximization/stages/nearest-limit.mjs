import { posterior } from '../arithmetic.mjs';
import { constructedFrame } from '../construction.mjs';
import { boundGeometry } from '../model.mjs';
import {
  drawConstructedHead,
  drawConstructedLine,
  drawConstructedNote,
  drawConstructedPlot,
  drawConstructedText,
} from '../defaults.mjs';
export function drawNearestLimit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = constructedFrame(state),
    currentBeat = f.beat,
    colors = [themeColors.blue, themeColors.pink],
    teaching = boundGeometry();
  const shares = (values, x, y, w = 1100, h = 70) => {
    let left = x;
    values.forEach((v, i) => {
      api.rect(ctx, left, y, w * v, h, colors[i]);
      if (v * w > 100)
        drawConstructedText(
          ctx,
          api,
          v.toFixed(4),
          left + (w * v) / 2,
          y + h * 0.68,
          30,
          themeColors.bg,
          'center',
        );
      left += w * v;
    });
  };
  api.focus.target('nearest-limit-operation', () => {
    const v =
        400 *
        Math.exp(
          -7 *
            (currentBeat === 0 ? f.progress('nearest-shrink') : f.progress('nearest-tie-shrink')),
        ),
      x = currentBeat === 0 ? 50 : 60,
      prior = currentBeat === 0 ? 0.5 : 0.25,
      model = {
        weights: [prior, 1 - prior],
        means: [30, 90],
        variances: [v, v],
      },
      q = posterior([x], model)[0];
    drawConstructedHead(
      ctx,
      api,
      currentBeat === 0
        ? 'Unique closer center · fixed positive priors'
        : 'Exact distance tie · unequal fixed priors',
    );
    const p = drawConstructedPlot(
      ctx,
      api,
      250,
      400,
      1400,
      180,
      [0, 120],
      [0, 1],
      'latency (ms)',
      '',
      [0, 30, 60, 90, 120],
      [],
    );
    [30, 90].forEach((mu, i) => {
      const a = p.point(mu, 0.5);
      api.circle(ctx, a.x, a.y, 13, colors[i]);
      drawConstructedText(ctx, api, 'mean ' + mu, a.x, 385, 29, colors[i], 'center');
    });
    const a = p.point(x, 0.5);
    drawConstructedLine(ctx, api, a.x, 435, a.x, 555, themeColors.yellow, 4);
    drawConstructedText(ctx, api, 'x = ' + x, a.x, 685, 34, themeColors.yellow, 'center');
    drawConstructedText(
      ctx,
      api,
      'shared variance ' + v.toFixed(3) + ' ms² · priors ' + prior + ' / ' + (1 - prior),
      960,
      770,
      32,
      themeColors.cyan,
      'center',
    );
    shares(q, 410, 835, 1100, 80);
    drawConstructedNote(
      ctx,
      api,
      currentBeat === 0
        ? 'The exponential distance advantage dominates fixed priors as the shared variance shrinks.'
        : 'Equal distance factors cancel; shrinking the common variance does not break the tie.',
    );
  });
}
export default {
  id: 'nearest-limit',
  draw: drawNearestLimit,
  cues: ['nearest-limit-0', 'nearest-shrink', 'nearest-limit-1', 'nearest-tie-shrink'],
};
