import { bound } from '../arithmetic.mjs';
import { started } from '../construction.mjs';
import { generationState } from '../model.mjs';
import { card, heading, row, target, text } from '../defaults.mjs';
export function drawGeneration(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bound(state.beatP ?? 0),
    cues = state.cues;
  const colors = [themeColors.blue, themeColors.green, themeColors.pink, themeColors.yellow];
  const begins = (id, fallback = progress > 0.15) => started(cues, id, fallback);
  text(ctx, api, 'S1 · supplied conditional rows', 960, 205, 23, themeColors.muted, 'center');
  {
    const v = generationState(currentBeat, progress, cues),
      start = 500,
      width = 230,
      stride = 270;
    heading(
      ctx,
      api,
      v.stopped ? 'End selected · generation stopped' : 'One possible sampled rollout',
    );
    row(ctx, api, ['The', 'cat'], 340, {
      left: start,
      width,
      gap: 40,
    });
    target(ctx, api, 'generation-token', () => {
      if (v.selected)
        card(
          ctx,
          api,
          'slept',
          start + 2 * stride,
          600 - 260 * v.append,
          width,
          100,
          themeColors.green,
          42,
        );
      else card(ctx, api, 'next ?', start + 2 * stride, 600, width, 100, themeColors.muted, 38);
    });
    const y = 790,
      x = 300,
      stripWidth = 1320;
    target(ctx, api, 'generation-distribution', () => {
      let left = x;
      v.distribution.forEach((item, i) => {
        const w = stripWidth * item.probability;
        api.rect(ctx, left, y, w, 100, colors[i]);
        text(
          ctx,
          api,
          item.token + ' ' + item.probability.toFixed(2),
          left + w / 2,
          945,
          32,
          colors[i],
          'center',
        );
        left += w;
      });
    });
    target(ctx, api, 'generation-selection', () => {
      const visible = v.next
        ? currentBeat === 1 && begins('generation-stop', progress > 0.15)
        : v.selected;
      text(
        ctx,
        api,
        visible ? 'Fixed sample u = ' + v.sample.toFixed(2) : 'Sample pending',
        600,
        665,
        32,
        themeColors.yellow,
        'center',
      );
      if (visible) {
        const sx = x + stripWidth * v.sample;
        api.line(ctx, sx, 735, sx, 775, themeColors.yellow, 5);
        api.circle(ctx, sx, 730, 8, themeColors.yellow);
      }
    });
    target(ctx, api, 'generation-stop', () =>
      text(
        ctx,
        api,
        v.stopped
          ? 'Selected end · output: The cat slept'
          : v.next
            ? 'P(next | The cat slept)'
            : 'P(next | The cat)',
        960,
        1025,
        34,
        v.stopped ? themeColors.green : themeColors.ink,
        'center',
      ),
    );
  }
}
export default {
  id: 'generation',
  draw: drawGeneration,
  cues: ['generation-sample', 'generation-append', 'generation-next', 'generation-stop'],
};
