import { testTimeCoreFrame, ttCue } from '../construction.mjs';
import { arrow, card, focusTarget, movingCard, text } from '../defaults.mjs';
export function drawR1Zero(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('r1-zero', state);
  const prog = (name, beat = 0) => ttCue(state, name, beat);
  function content() {
    card(ctx, api, 'Pretrained base', 160, 340, 430, 120, themeColors.blue, 36);
    card(ctx, api, 'Reinforcement learning', 760, 340, 450, 120, themeColors.pink, 32);
    card(ctx, api, 'R1-Zero', 1390, 340, 350, 120, themeColors.cyan, 37);
    arrow(ctx, api, 620, 400, 720, 400);
    arrow(ctx, api, 1240, 400, 1350, 400);
    focusTarget(ctx, api, 'tt-zero-rewards', () => {
      const q = prog('tt-zero-rewards').p;
      movingCard(ctx, api, 'accuracy', 810, 610, 815, 510, q, themeColors.green);
      movingCard(ctx, api, 'format', 1030, 610, 1035, 510, q, themeColors.yellow);
    });
    if (currentBeat === 0) {
      text(ctx, api, 'Rule-based training reward', 960, 825, 39, themeColors.green, 'center');
      text(
        ctx,
        api,
        'No cold-start SFT or learned neural reward model in this stage',
        960,
        975,
        31,
        themeColors.muted,
        'center',
      );
    } else {
      card(ctx, api, 'Longer reasoning / reflection', 210, 770, 690, 115, themeColors.cyan, 32);
      card(ctx, api, 'Readability / language mixing', 1030, 770, 690, 115, themeColors.pink, 32);
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
  id: 'r1-zero',
  draw: drawR1Zero,
  cues: ['tt-r1-zero-0', 'tt-zero-rewards', 'tt-r1-zero-1'],
};
