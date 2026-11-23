import { testTimeCoreFrame, ttCue } from '../construction.mjs';
import { arrow, card, fillStrip, focusTarget, text } from '../defaults.mjs';
export function drawPerPromptDistribution(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('per-prompt-distribution', state);
  const prog = (name, beat = 0) => ttCue(state, name, beat);
  function content() {
    const after = currentBeat >= 1 && prog('tt-probability-shift', 1).started;
    const ps = after ? [0.99, 0.05] : [0.8, 0.2];
    text(
      ctx,
      api,
      'Fixed N = 4 · compute each prompt before averaging',
      960,
      285,
      34,
      themeColors.yellow,
      'center',
    );
    focusTarget(ctx, api, 'tt-probability-shift', () =>
      ps.forEach((v, i) => {
        const x = 280 + i * 850;
        text(
          ctx,
          api,
          `Prompt ${i + 1} · p = ${v}`,
          x + 270,
          390,
          37,
          i ? themeColors.pink : themeColors.blue,
          'center',
        );
        fillStrip(ctx, api, v, x, 460, 540, i ? themeColors.pink : themeColors.blue);
      }),
    );
    if (currentBeat === 0) {
      text(ctx, api, 'All misses: (1 − p)ᴺ', 520, 745, 42, themeColors.muted, 'center');
      text(ctx, api, 'Coverage: 1 − (1 − p)ᴺ', 1370, 745, 42, themeColors.cyan, 'center');
    } else if (currentBeat === 1) {
      focusTarget(ctx, api, 'tt-prompt-coverage', () => {
        if (m.result.done) {
          m.before.rows.forEach((v, i) => {
            const x = 280 + i * 850;
            text(
              ctx,
              api,
              'Coverage@4: ' +
                v.toFixed(4) +
                ' → ' +
                m.after.rows[i].toFixed(m.after.rows[i] > 0.9999 ? 8 : 4),
              x + 270,
              635,
              29,
              i ? themeColors.pink : themeColors.blue,
              'center',
            );
            fillStrip(ctx, api, v, x, 680, 540, themeColors.muted);
            api.rect(
              ctx,
              x,
              680,
              540 * m.after.rows[i],
              56,
              i ? themeColors.pink : themeColors.blue,
              undefined,
              0,
            );
          });
          text(ctx, api, 'Mean pass@1: 0.500 → 0.520', 960, 845, 39, themeColors.green, 'center');
          text(
            ctx,
            api,
            'Mean coverage@4: 0.7944 → 0.592747',
            960,
            975,
            39,
            themeColors.pink,
            'center',
          );
        } else
          text(
            ctx,
            api,
            'Transform each of the two prompt probabilities first',
            960,
            820,
            34,
            themeColors.muted,
            'center',
          );
      });
    } else {
      card(ctx, api, 'Candidate coverage', 210, 700, 450, 115, themeColors.green);
      card(ctx, api, 'Selector recall r', 760, 700, 400, 115, themeColors.yellow);
      card(ctx, api, 'Selected success', 1290, 700, 440, 115, themeColors.cyan);
      arrow(ctx, api, 685, 757, 720, 757);
      arrow(ctx, api, 1185, 757, 1250, 757);
      text(ctx, api, 'All N attempts remain charged', 960, 975, 38, themeColors.pink, 'center');
    }
  }
  // Existing manuscript operation targets remain attached to the actual construction.
  const bases = scene.beats.flatMap((beat) =>
    (beat.visual_cues ?? [])
      .filter((cue) => /^tt-[a-z].*-\d+$/.test(cue.id))
      .flatMap((cue) => cue.targets ?? []),
  );
  const wrap = (i) =>
    i < bases.length ? focusTarget(ctx, api, bases[i], () => wrap(i + 1)) : content();
  wrap(0);
}
export default {
  id: 'per-prompt-distribution',
  draw: drawPerPromptDistribution,
  cues: [
    'tt-per-prompt-distribution-0',
    'tt-per-prompt-distribution-1',
    'tt-probability-shift',
    'tt-prompt-coverage',
    'tt-per-prompt-distribution-2',
  ],
};
