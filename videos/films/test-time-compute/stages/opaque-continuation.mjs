import { testTimeCoreFrame, ttCue } from '../construction.mjs';
import { arrow, card, focusTarget, movingCard, text } from '../defaults.mjs';
export function drawOpaqueContinuation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('opaque-continuation', state);
  const prog = (name, beat = 0) => ttCue(state, name, beat);
  function content() {
    if (currentBeat < 2) {
      const names =
        currentBeat === 0
          ? ['response items', 'effective context', 'compatible family']
          : ['interaction ID', 'unchanged blocks', 'required signatures'];
      names.forEach((s, i) =>
        focusTarget(ctx, api, 'tt-opaque-' + i, () =>
          card(
            ctx,
            api,
            s,
            170 + i * 580,
            330,
            430,
            110,
            i === 1 ? themeColors.pink : themeColors.blue,
          ),
        ),
      );
      card(ctx, api, 'Next request state', 650, 790, 620, 100, themeColors.cyan);
      focusTarget(ctx, api, currentBeat === 0 ? 'tt-state-replay' : 'tt-signature-replay', () => {
        const q = prog(
          currentBeat === 0 ? 'tt-state-replay' : 'tt-signature-replay',
          currentBeat,
        ).p;
        for (let i = 0; i < 3; i++)
          movingCard(
            ctx,
            api,
            `item ${i + 1}`,
            300 + i * 580,
            520,
            695 + i * 180,
            665,
            q,
            i === 1 ? themeColors.pink : themeColors.blue,
          );
      });
      text(
        ctx,
        api,
        currentBeat === 0
          ? 'Discarded items cannot be reconstructed by a setting'
          : 'Readable summary stays a different artifact',
        960,
        990,
        32,
        themeColors.yellow,
        'center',
      );
    } else {
      ['Task constraints', 'Success criteria', 'Evaluation baseline'].forEach((s, i) =>
        card(ctx, api, s, 200 + i * 570, 380, 430, 115, themeColors.blue),
      );
      card(
        ctx,
        api,
        'Supported controls + measured returned answer',
        430,
        760,
        1060,
        120,
        themeColors.cyan,
        35,
      );
      for (let i = 0; i < 3; i++) arrow(ctx, api, 415 + i * 570, 535, 745 + i * 215, 710);
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
  id: 'opaque-continuation',
  draw: drawOpaqueContinuation,
  cues: [
    'tt-opaque-continuation-0',
    'tt-state-replay',
    'tt-opaque-continuation-1',
    'tt-signature-replay',
    'tt-opaque-continuation-2',
  ],
};
