import { bars, equation, optionalFocusTarget, text } from '../defaults.mjs';
export function drawSimpson(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i, a = 0.08, z = 0.86) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const F = api.components.fade;
  {
    const easy = api.focus
        ? api.focus.progress('simpson-easy-rates', phaseForBeat(0))
        : phaseForBeat(0),
      difficult = api.focus
        ? api.focus.progress('simpson-difficult-rates', phaseForBeat(0))
        : phaseForBeat(0);
    optionalFocusTarget(ctx, api, 'simpson-cohort-inputs', () => {
      api.components.card({
        label: 'Easy: 10 assistant + 90 control tickets',
        x: 235,
        y: 310,
        width: 650,
        height: 60,
        fill: themeColors.panel,
        stroke: themeColors.cyan,
        textColor: themeColors.cyan,
        fontSize: 26,
        padding: 10,
      });
      api.components.card({
        label: 'Difficult: 90 assistant + 10 control tickets',
        x: 1100,
        y: 310,
        width: 650,
        height: 60,
        fill: themeColors.panel,
        stroke: themeColors.pink,
        textColor: themeColors.pink,
        fontSize: 26,
        padding: 10,
      });
    });
    const reveal = (id, fallback, paint) =>
      api.focus ? api.focus.reveal(id, paint) : fallback ? paint() : undefined;
    reveal('simpson-easy-rates', currentBeat > 0 || progress > 0.45, () =>
      optionalFocusTarget(ctx, api, 'simpson-object-distribution-simpson-10', () =>
        bars(
          ctx,
          api,
          [0.9, 0.8],
          ['assistant', 'control'],
          230,
          650,
          [themeColors.cyan, themeColors.pink],
          easy,
        ),
      ),
    );
    reveal('simpson-difficult-rates', currentBeat > 0 || progress > 0.8, () =>
      optionalFocusTarget(ctx, api, 'simpson-difficult-rates', () =>
        bars(
          ctx,
          api,
          [0.5, 0.4],
          ['assistant', 'control'],
          1100,
          650,
          [themeColors.cyan, themeColors.pink],
          difficult,
        ),
      ),
    );
    text(ctx, api, 'EASY GROUP', 555, 270, 34, themeColors.ink, 'center');
    text(ctx, api, 'DIFFICULT GROUP', 1425, 270, 34, themeColors.ink, 'center');
    reveal('simpson-easy-rates', currentBeat > 0 || progress > 0.45, () =>
      optionalFocusTarget(ctx, api, 'simpson-object-assistant-9-10-control-72-90-14', () =>
        text(ctx, api, 'assistant 9/10; control 72/90', 555, 850, 30, themeColors.muted, 'center'),
      ),
    );
    reveal('simpson-difficult-rates', currentBeat > 0 || progress > 0.8, () =>
      text(ctx, api, 'assistant 45/90; control 4/10', 1425, 850, 30, themeColors.muted, 'center'),
    );
    reveal('simpson-beat-2-focus-2', currentBeat > 0, () =>
      optionalFocusTarget(ctx, api, 'simpson-weighted-totals', () => {
        equation(ctx, api, '0.1(0.9)+0.9(0.5)=0.54', 555, 950, 38, themeColors.cyan, 'center');
        equation(ctx, api, '0.9(0.8)+0.1(0.4)=0.76', 1425, 950, 38, themeColors.pink, 'center');
      }),
    );
    if (currentBeat > 1)
      text(
        ctx,
        api,
        'Within each group: +10 percentage points',
        960,
        1020,
        30,
        themeColors.yellow,
        'center',
      );
  }
}
export default {
  id: 'simpson',
  draw: drawSimpson,
  cues: [
    'simpson-beat-1-focus-1',
    'simpson-easy-rates',
    'simpson-difficult-rates',
    'simpson-beat-2-focus-1',
    'simpson-beat-2-focus-2',
    'simpson-beat-3-focus-1',
    'simpson-beat-3-focus-2',
  ],
};
