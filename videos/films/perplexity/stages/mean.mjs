import { nll, ppl, total } from '../fixtures.mjs';
import { box, drawText, focus, line, sub } from '../defaults.mjs';
export function drawMean(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cue = (id, f = api.phase(progress, 0.15, 0.8)) => (api.focus ? api.focus.progress(id, f) : f);
  {
    const cols = [themeColors.blue, themeColors.pink, themeColors.green],
      gather = currentBeat > 0 ? 1 : cue('mean-gather'),
      equal = currentBeat > 0 ? cue('mean-equalize') : 0,
      showExp = currentBeat > 1 || (currentBeat === 1 && cue('mean-exponent') > 0.4),
      base = 880,
      H = 150;
    sub(ctx, api, 'Preserve the total surprise while constructing an equal per-target mean');
    focus(ctx, api, 'mean-object-distribution-mean-9', () =>
      nll.forEach((v, i) => {
        const t = api.clamp(gather * 3 - i),
          cum = nll.slice(0, i).reduce((n, x) => n + x, 0),
          sx = 210 + i * 430,
          sy = 880 - v * 150,
          dy = 880 - (cum + v) * 150,
          x = api.lerp(sx, 1210, api.phase(t, 0.25, 0.75)),
          y =
            t < 0.25
              ? api.lerp(sy, 300, api.phase(t, 0, 0.25))
              : t < 0.75
                ? 300
                : api.lerp(300, dy, api.phase(t, 0.75, 1));
        api.rect(ctx, x, y, 220, v * 150, cols[i]);
        if (gather < 0.01) {
          drawText(ctx, api, ['on', 'the', 'mat'][i], x + 110, 955, 33, cols[i], 'center');
          drawText(ctx, api, v.toFixed(3), x + 110, y - 35, 34, cols[i], 'center');
        }
      }),
    );
    focus(ctx, api, 'mean-simulation-11', () => {
      if (gather > 0.8) {
        drawText(
          ctx,
          api,
          'Total ' + total.toFixed(3) + ' nats',
          1320,
          340,
          33,
          themeColors.yellow,
          'center',
        );
        if (currentBeat > 0) {
          for (let i = 0; i < 3; i++) {
            const h = (total / 3) * 150,
              x = 240 + i * 285;
            api.rect(ctx, x, 880 - h * equal, 200, h * equal, cols[i]);
            drawText(ctx, api, 'equal share ' + (i + 1), x + 100, 955, 27, cols[i], 'center');
          }
          drawText(
            ctx,
            api,
            '3 × ' + (total / 3).toFixed(3) + ' = ' + total.toFixed(3),
            700,
            410,
            38,
            themeColors.yellow,
            'center',
          );
          line(
            ctx,
            api,
            210,
            880 - (total / 3) * 150,
            1030,
            880 - (total / 3) * 150,
            themeColors.yellow,
            3,
          );
        }
      }
    });
    if (currentBeat === 0)
      drawText(ctx, api, '0.693 + 2.303 + 0.223', 960, 1020, 35, themeColors.muted, 'center');
    else
      drawText(
        ctx,
        api,
        'Average loss = ' + (total / 3).toFixed(6) + ' nats per target',
        650,
        1030,
        33,
        themeColors.yellow,
        'center',
      );
    if (showExp) {
      box(
        ctx,
        api,
        'exp(' + (total / 3).toFixed(3) + ') = ' + ppl.toFixed(3),
        1220,
        930,
        550,
        85,
        themeColors.green,
        34,
      );
    }
  }
}
export default {
  id: 'mean',
  draw: drawMean,
  cues: [
    'mean-beat-1-focus-1',
    'mean-gather',
    'mean-beat-2-focus-1',
    'mean-equalize',
    'mean-exponent',
    'mean-beat-3-focus-1',
    'mean-beat-3-focus-2',
  ],
};
