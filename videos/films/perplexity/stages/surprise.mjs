import { box, drawText, focus, line, sub } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawSurprise(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cue = (id, f = api.phase(progress, 0.15, 0.8)) => (api.focus ? api.focus.progress(id, f) : f);
  {
    const q =
        currentBeat === 0
          ? 0.8
          : currentBeat > 1
            ? 0.02
            : api.lerp(0.8, 0.02, cue('surprise-beat-2-focus-2')),
      loss = -Math.log(q),
      bits = currentBeat > 1 ? 1 : currentBeat === 1 ? cue('surprise-bits') : 0;
    sub(ctx, api, 'Keep observed target “mat” fixed; vary the assigned probability');
    const ax = teaching.axes({
      x: 220,
      y: 420,
      width: 1040,
      height: 390,
      xDomain: [0.01, 1],
      yDomain: [0, 5],
      xTicks: [0.1, 0.5, 1],
      yTicks: [0, 2, 4],
      xLabel: 'probability assigned to “mat”',
      yLabel: 'surprise · nats',
      fontSize: 29,
    });
    teaching.curve({
      plot: ax,
      points: sampleFunction((x) => -Math.log(x), 0.01, 1, 140),
      color: themeColors.cyan,
      width: 5,
    });
    const at = ax.point(q, loss);
    line(ctx, api, at.x, ax.point(q, 0).y, at.x, at.y, themeColors.yellow, 2);
    line(ctx, api, ax.point(0.01, loss).x, at.y, at.x, at.y, themeColors.yellow, 2);
    focus(ctx, api, 'surprise-object-at-x-at-y-12-c-yellow-3', () =>
      api.circle(ctx, at.x, at.y, 12, themeColors.yellow),
    );
    focus(ctx, api, 'surprise-nats', () => {
      box(ctx, api, 'Observed: mat', 1380, 370, 380, 85, themeColors.green);
      drawText(ctx, api, 'p = ' + q.toFixed(3), 1570, 560, 43, themeColors.green, 'center');
      drawText(
        ctx,
        api,
        (currentBeat > 0 || cue('surprise-rule') > 0.7 ? '−ln(p) = ' : 'surprise = ') +
          loss.toFixed(3),
        1570,
        740,
        40,
        themeColors.yellow,
        'center',
      );
    });
    if (currentBeat === 1) {
      for (const v of [0.8, 0.4, 0.2, 0.1]) {
        const z = ax.point(v, -Math.log(v));
        api.circle(ctx, z.x, z.y, 5, themeColors.muted);
      }
      drawText(
        ctx,
        api,
        '0.8 → 0.4 → 0.2 → 0.1 · each halving adds ln(2) surprise',
        960,
        950,
        29,
        themeColors.muted,
        'center',
      );
    }
    if (bits > 0.01)
      focus(ctx, api, 'surprise-equation-string-raw-ell-text-bits-frac-ell-text-nats-ln-2-7', () =>
        drawText(
          ctx,
          api,
          (loss / Math.LN2).toFixed(3) + ' bits = nats / ln(2)',
          960,
          1010,
          35,
          themeColors.cyan,
          'center',
        ),
      );
    if (currentBeat === 2) {
      api.rect(ctx, 240, 925, 1100 * q, 40, themeColors.green);
      api.rect(
        ctx,
        240 + 1100 * q,
        925,
        1100 * (1 - q),
        40,
        themeColors.panel,
        themeColors.muted,
        1,
      );
      drawText(
        ctx,
        api,
        'Only the observed “mat” mass enters this one-hot target loss',
        960,
        350,
        31,
        themeColors.yellow,
        'center',
      );
    }
  }
}
export default {
  id: 'surprise',
  draw: drawSurprise,
  cues: [
    'surprise-beat-1-focus-1',
    'surprise-rule',
    'surprise-beat-2-focus-1',
    'surprise-beat-2-focus-2',
    'surprise-bits',
    'surprise-beat-3-focus-1',
  ],
};
