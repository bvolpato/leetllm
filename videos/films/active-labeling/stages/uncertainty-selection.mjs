import { pool } from '../fixtures.mjs';
import { phase, sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawUncertaintySelection(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat,
    progress = state.beatP,
    q = phase(progress),
    modelState = sampleModel('uncertainty-selection', state);
  {
    if (state.cues?.['select-queue'])
      modelState.queue = [...pool]
        .sort((a, b) => b.uncertainty - a.uncertainty)
        .slice(0, Math.ceil(2 * api.focus.progress('select-queue', 0)));
    text(ctx, api, 'Fixed estimates from the current model', 140, 265, 33);
    const x = (value) => 220 + value * 900,
      y = 510;
    api.focus.target('estimate-ruler', () => api.line(ctx, x(0), y, x(1), y, themeColors.muted, 3));
    [0, 0.5, 1].forEach((value) =>
      text(ctx, api, value.toFixed(1), x(value), y + 65, 27, themeColors.muted, 'center'),
    );
    modelState.pool.forEach((item, i) => {
      api.focus.target('fixed-estimates', () =>
        api.circle(
          ctx,
          x(item.probability),
          y,
          11,
          modelState.queue.includes(item) ? themeColors.yellow : themeColors.blue,
        ),
      );
      api.focus.target('fixed-estimates', () =>
        text(
          ctx,
          api,
          item.id,
          x(item.probability),
          y - 55 - (i % 2) * 65,
          29,
          themeColors.ink,
          'center',
        ),
      );
      text(
        ctx,
        api,
        `${item.id} · ${item.label} · p=${item.probability.toFixed(2)} · U=${item.uncertainty.toFixed(2)}`,
        150,
        720 + i * 50,
        25,
        modelState.queue.includes(item) ? themeColors.yellow : themeColors.muted,
      );
    });
    text(ctx, api, 'P(reviewer prefers A)', 670, 655, 28, themeColors.muted, 'center');
    text(ctx, api, 'Ranked review queue', 1530, 335, 30, themeColors.yellow, 'center');
    modelState.queue.forEach((item, i) =>
      api.focus.target('review-queue', () =>
        card(
          ctx,
          api,
          `${i + 1}. ${item.id} · ${item.label}`,
          1280,
          405 + i * 160,
          500,
          themeColors.yellow,
          100,
          27,
        ),
      ),
    );
    text(
      ctx,
      api,
      'The selector moves records into a queue; their estimates stay fixed.',
      960,
      980,
      27,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'uncertainty-selection',
  draw: drawUncertaintySelection,
  cues: ['fixed-uncertainty', 'select-queue', 'review-questions'],
};
