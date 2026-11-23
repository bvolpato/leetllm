import { testTimeCoreFrame } from '../construction.mjs';
import { card, focusTarget, text } from '../defaults.mjs';
export function drawEffortCutoff(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('effort-cutoff', state);
  function content() {
    if (currentBeat === 0) {
      card(ctx, api, 'Effort guidance', 210, 350, 600, 130, themeColors.cyan, 40);
      card(ctx, api, 'Hard output cap', 1110, 350, 600, 130, themeColors.yellow, 40);
      for (let i = 0; i < 5; i++) {
        api.circle(ctx, 330 + i * 75, 670, 18, themeColors.cyan);
      }
      api.rect(ctx, 1190, 620, 410, 100, null, themeColors.yellow, 0);
      text(ctx, api, 'Policy preference', 510, 850, 36, themeColors.cyan, 'center');
      text(ctx, api, 'Lifecycle boundary', 1410, 850, 36, themeColors.yellow, 'center');
    } else if (currentBeat === 1) {
      text(
        ctx,
        api,
        '64-token limit · no visible text',
        960,
        290,
        40,
        themeColors.yellow,
        'center',
      );
      focusTarget(ctx, api, 'tt-hidden-cap', () => {
        const n = m.consumed;
        for (let i = 0; i < 64; i++)
          api.rect(
            ctx,
            240 + (i % 16) * 91,
            390 + Math.floor(i / 16) * 90,
            65,
            57,
            i < n ? themeColors.pink : themeColors.panel,
            i < n ? undefined : themeColors.muted,
            0,
          );
        text(ctx, api, `${n} generated reasoning tokens`, 960, 835, 37, themeColors.pink, 'center');
      });
      if (m.capResult.done) {
        card(
          ctx,
          api,
          'INCOMPLETE · visible output empty',
          480,
          910,
          960,
          90,
          themeColors.pink,
          33,
        );
      }
    } else {
      card(ctx, api, 'Response lifecycle: completed', 200, 325, 680, 110, themeColors.blue);
      card(
        ctx,
        api,
        'Returned answer: 5000',
        1040,
        325,
        680,
        110,
        m.wrongResult.done ? themeColors.pink : themeColors.blue,
      );
      focusTarget(ctx, api, 'tt-completed-wrong', () => {
        text(
          ctx,
          api,
          'Shared prompt + eight private tails',
          960,
          557,
          36,
          themeColors.muted,
          'center',
        );
        text(
          ctx,
          api,
          `4,000 + 8 × 1,000 = ${m.wrongResult.done ? '12,000' : '?'}`,
          960,
          687,
          62,
          themeColors.ink,
          'center',
        );
        if (m.wrongResult.done) {
          text(
            ctx,
            api,
            'Status PASS   ·   usable text PASS   ·   task FAIL',
            960,
            900,
            40,
            themeColors.pink,
            'center',
          );
        }
      });
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
  id: 'effort-cutoff',
  draw: drawEffortCutoff,
  cues: [
    'tt-effort-cutoff-0',
    'tt-effort-cutoff-1',
    'tt-hidden-cap',
    'tt-effort-cutoff-2',
    'tt-completed-wrong',
  ],
};
