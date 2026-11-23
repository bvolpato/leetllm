import { projectionBudget } from '../model.mjs';
import { resultAfter } from '../construction.mjs';
import { text, rect } from '../defaults.mjs';
export function drawTinyPeft(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const earned = (id, index, start = 0.1, end = 0.8) =>
    beat > index ||
    (beat === index && api.focus.progress(id, api.phase(progress, start, end)) >= 0.999);
  ctx.save();
  {
    api.focus.target('tiny-peft-mechanism', () => {
      const countReady = earned('tiny-count', 0, 0.4, 0.8);
      const initialized = earned('tiny-no-op', 1, 0.05, 0.25);
      const grads = api.focus.progress('tiny-gradients', stage(1, 0.25, 0.5));
      const saved = earned('tiny-save-reload', 1, 0.5, 0.8);
      text(ctx, api, 'Tiny Qwen2  ·  random weights  ·  CPU', 190, 285, 29, themeColors.muted);
      text(
        ctx,
        api,
        'PyTorch 2.13.0 · Transformers 5.16.1 · PEFT 0.20.0',
        190,
        345,
        28,
        themeColors.muted,
      );
      const rows = projectionBudget(16, 32, 8, 2);
      for (const [i, row] of rows.entries()) {
        const x = 190 + (i % 4) * 390,
          y = 435 + Math.floor(i / 4) * 190;
        rect(ctx, api, x, y, 320, 170, themeColors.panel, themeColors.blue);
        text(ctx, api, row.name + '_proj', x + 160, y + 45, 31, themeColors.blue, 'center', 'mono');
        text(
          ctx,
          api,
          `${row.out} × ${row.input}`,
          x + 160,
          y + 95,
          29,
          themeColors.blue,
          'center',
          'mono',
        );
        if (countReady) {
          rect(ctx, api, x + 225, y + 105, 90, 50, '#ffd75e30', themeColors.yellow, 4);
          text(
            ctx,
            api,
            String(row.count),
            x + 270,
            y + 140,
            28,
            themeColors.yellow,
            'center',
            'mono',
          );
        }
      }
      if (countReady)
        text(
          ctx,
          api,
          resultAfter(state, 'tiny-wrapped-result', 1)
            ? '3408 base + 512 factors = 3920 wrapped parameters'
            : `${resultAfter(state, 'tiny-base-result', 0) ? '3408 base' : 'base ?'} + 512 factors = wrapped ?`,
          190,
          855,
          35,
          themeColors.ink,
          'left',
          'mono',
        );
      if (beat === 1) {
        const checks = [
          initialized ? 'initial output unchanged' : 'initial output: checking',
          grads >= 0.999 ? 'two-step factor gradients verified' : 'two-step gradients: checking',
          saved
            ? 'save → same seeded base → reload → merge: output checks pass'
            : 'saved adapter: pending',
        ];
        checks.forEach((s, i) =>
          text(
            ctx,
            api,
            s,
            190,
            920 + i * 49,
            28,
            [initialized, grads >= 0.999, saved][i] ? themeColors.green : themeColors.muted,
          ),
        );
      } else if (beat === 2) {
        text(
          ctx,
          api,
          'For the larger model, print each target name, shape and trainable count.',
          190,
          940,
          30,
          themeColors.green,
        );
        text(
          ctx,
          api,
          'Measure peak GPU memory and score both held-out sets.',
          190,
          1005,
          28,
          themeColors.muted,
        );
      }
    });
  }
  ctx.restore();
}
export default {
  id: 'tiny-peft',
  draw: drawTinyPeft,
  cues: [
    'tiny-peft-1',
    'tiny-count',
    'tiny-base-result',
    'tiny-peft-2',
    'tiny-no-op',
    'tiny-gradients',
    'tiny-save-reload',
    'tiny-wrapped-result',
    'tiny-peft-3',
  ],
};
