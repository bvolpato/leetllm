import { testTimeCoreFrame } from '../construction.mjs';
import { arrow, card, focusTarget, text } from '../defaults.mjs';
export function drawProcessTargets(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('process-targets', state);
  function content() {
    if (currentBeat === 0) {
      card(ctx, api, 'Outcome model', 180, 360, 580, 110, themeColors.blue);
      card(ctx, api, 'Process model', 1150, 360, 580, 110, themeColors.cyan);
      card(ctx, api, 'completed trajectory', 180, 590, 580, 110, themeColors.blue);
      card(ctx, api, 'problem + prior steps', 1150, 590, 580, 110, themeColors.cyan);
      arrow(ctx, api, 470, 500, 470, 550);
      arrow(ctx, api, 1440, 500, 1440, 550);
      text(
        ctx,
        api,
        'The label recipe defines what a score means',
        960,
        915,
        39,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      card(ctx, api, 'Current step: 2 + 2 = 5', 450, 285, 1020, 95, themeColors.pink, 40);
      [4, 5, 4, 4].forEach((v, i) =>
        card(
          ctx,
          api,
          `rollout ${i + 1}: ${v}`,
          150 + i * 450,
          500,
          320,
          100,
          v === 4 ? themeColors.green : themeColors.pink,
          31,
        ),
      );
      focusTarget(ctx, api, 'tt-rollout-targets', () => {
        if (m.result.done) {
          text(ctx, api, 'Local validity: false', 450, 770, 39, themeColors.pink, 'center');
          text(ctx, api, 'Any success: 1', 980, 770, 39, themeColors.green, 'center');
          text(ctx, api, 'Fraction: 3 / 4', 1510, 770, 39, themeColors.cyan, 'center');
        } else
          text(
            ctx,
            api,
            'Count successful final answers under this completer',
            960,
            810,
            34,
            themeColors.muted,
            'center',
          );
      });
      text(
        ctx,
        api,
        m.result.done
          ? 'Three continuations repair the arithmetic'
          : 'Each continuation starts from the same wrong step',
        960,
        975,
        34,
        themeColors.yellow,
        'center',
      );
    } else {
      ['Human step-validity', 'Completion-based target', 'Last-step reward-to-go'].forEach((s, i) =>
        card(
          ctx,
          api,
          s,
          180 + i * 580,
          370,
          430,
          140,
          i === 0 ? themeColors.blue : i === 1 ? themeColors.green : themeColors.pink,
          29,
        ),
      );
      card(
        ctx,
        api,
        'Match aggregation + pruning to the actual score contract',
        260,
        780,
        1400,
        120,
        themeColors.yellow,
        33,
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
  id: 'process-targets',
  draw: drawProcessTargets,
  cues: [
    'tt-process-targets-0',
    'tt-process-targets-1',
    'tt-rollout-targets',
    'tt-process-targets-2',
  ],
};
