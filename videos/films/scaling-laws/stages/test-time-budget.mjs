import { spoken } from '../cue.mjs';
import { scalingEvent } from '../construction.mjs';
import { band, line, rectangle, text } from '../defaults.mjs';
export function drawTestTimeBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  const result = (caption) => {
    if (end) text(ctx, api, caption, 960, 960, 36, themeColors.green, 'center');
  };
  api.focus.target('sl-test-time-budget-construction', () => {
    band(ctx, api, 'Same trained weights for every draft');
    const count = currentBeat === 0 ? 4 : currentBeat === 1 ? 16 : 4,
      visible =
        currentBeat === 1
          ? Math.floor(
              spoken(scene, state, 'draft-one').progress +
                3 * spoken(scene, state, 'draft-four').progress +
                12 * spoken(scene, state, 'draft-sixteen').progress,
            )
          : Math.min(count, Math.floor(progress * count));
    rectangle(ctx, api, 200, 425, 240, 190, themeColors.panel, themeColors.blue);
    text(ctx, api, '8B weights', 320, 535, 34, themeColors.blue, 'center');
    for (let i = 0; i < count; i++) {
      const x = 650 + (i % 4) * 255,
        y = 350 + Math.floor(i / 4) * 125;
      rectangle(
        ctx,
        api,
        x,
        y,
        205,
        77,
        i < visible ? themeColors.cyan : themeColors.panel,
        themeColors.muted,
      );
      text(
        ctx,
        api,
        'Candidate ' + (i + 1),
        x + 102,
        y + 49,
        26,
        i < visible ? themeColors.bg : themeColors.muted,
        'center',
      );
      if (i < visible) {
        line(ctx, api, 450, 520, 555, 520, themeColors.muted, 2);
        line(ctx, api, 555, 520, 555, y - 18, themeColors.muted, 2);
        line(ctx, api, 555, y - 18, x + 102, y - 18, themeColors.muted, 2);
        line(ctx, api, x + 102, y - 18, x + 102, y - 7, themeColors.muted, 2);
      }
    }
    text(
      ctx,
      api,
      currentBeat === 1
        ? visible +
            ' complete drafts × 512 tokens × 16B FLOPs = ' +
            (visible * 512 * 16e9).toExponential(2) +
            ' FLOPs'
        : '512 generated positions per candidate · verifier work excluded',
      960,
      905,
      31,
      themeColors.muted,
      'center',
    );
    result(
      currentBeat === 0
        ? 'Drafts share the same trained weights'
        : currentBeat === 1
          ? 'Dense generation only   ·   prompt, attention and verifier work excluded'
          : 'MATH/PaLM2-S* study used task-specific revision and verifier training',
    );
  });
}
export default {
  id: 'test-time-budget',
  draw: drawTestTimeBudget,
  cues: [
    'sl-test-time-budget-0',
    'sl-test-time-budget-1',
    'sl-test-time-budget-2',
    'draft-one',
    'draft-four',
    'draft-sixteen',
  ],
};
