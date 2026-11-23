import { ttClamp } from '../arithmetic.mjs';
import { testTimeCoreFrame, ttCue } from '../construction.mjs';
import { arrow, card, focusTarget, text } from '../defaults.mjs';
export function drawScalingEvidence(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('scaling-evidence', state);
  const prog = (name, beat = 0) => ttCue(state, name, beat);
  function content() {
    if (currentBeat === 0) {
      card(ctx, api, '3 R1-distilled models', 180, 330, 650, 110, themeColors.blue, 35);
      card(ctx, api, 'GSM8K / MATH500 / AIME2024', 1040, 330, 700, 110, themeColors.cyan, 30);
      card(ctx, api, 'reasoning prefix', 180, 620, 430, 100, themeColors.blue, 29);
      card(ctx, api, 'further continuation', 1340, 620, 430, 100, themeColors.blue, 29);
      focusTarget(ctx, api, 'tt-forced-extension', () => {
        const q = prog('tt-forced-extension').p;
        api.rect(ctx, 760, 620, 280, 100, themeColors.panel, themeColors.yellow, 10);
        components.fade(1 - ttClamp(q * 2), () =>
          text(ctx, api, '</think>', 900, 682, 34, themeColors.yellow, 'center'),
        );
        components.fade(ttClamp(q * 2 - 1), () =>
          text(ctx, api, 'Wait', 900, 682, 34, themeColors.yellow, 'center'),
        );
        arrow(ctx, api, 640, 670, 730, 670, themeColors.yellow);
        if (q > 0) arrow(ctx, api, 1070, 670, 1310, 670, themeColors.cyan);
      });
      text(
        ctx,
        api,
        'Forced continuation can reduce measured task performance',
        960,
        990,
        32,
        themeColors.pink,
        'center',
      );
    } else if (currentBeat === 1) {
      card(ctx, api, 'Distraction tasks', 210, 350, 650, 130, themeColors.pink, 39);
      card(ctx, api, 'Constraint tracking', 1060, 350, 650, 130, themeColors.yellow, 39);
      text(
        ctx,
        api,
        'Record model + task + intervention',
        960,
        740,
        42,
        themeColors.cyan,
        'center',
      );
      text(
        ctx,
        api,
        'Measure returned answers at each tested budget',
        960,
        925,
        36,
        themeColors.ink,
        'center',
      );
    } else {
      card(ctx, api, 'Pretraining FLOPs', 190, 345, 620, 130, themeColors.blue, 40);
      card(ctx, api, 'Lifetime inference FLOPs', 1110, 345, 620, 130, themeColors.cyan, 36);
      text(ctx, api, '+', 960, 435, 58, themeColors.yellow, 'center');
      focusTarget(ctx, api, 'tt-lifetime-work', () => {
        const q = prog('tt-lifetime-work', 2).p;
        for (let i = 0; i < 8; i++)
          api.circle(
            ctx,
            350 + i * 175,
            700,
            10 + q * 18,
            i < 4 ? themeColors.blue : themeColors.cyan,
          );
      });
      text(
        ctx,
        api,
        'Workload size + difficulty-estimation cost',
        960,
        940,
        37,
        themeColors.yellow,
        'center',
      );
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
  id: 'scaling-evidence',
  draw: drawScalingEvidence,
  cues: [
    'tt-scaling-evidence-0',
    'tt-forced-extension',
    'tt-scaling-evidence-1',
    'tt-scaling-evidence-2',
    'tt-lifetime-work',
  ],
};
