import { testTimeCoreFrame, ttCue } from '../construction.mjs';
import { card, focusTarget, movingCard, text } from '../defaults.mjs';
export function drawPolicyTraining(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('policy-training', state);
  const prog = (name, beat = 0) => ttCue(state, name, beat);
  function content() {
    const lanes = ['model + training objective', 'sampling + budget', 'verifier + return policy'];
    lanes.forEach((s, i) =>
      card(
        ctx,
        api,
        s,
        160 + i * 590,
        310,
        490,
        105,
        i === 0 ? themeColors.blue : i === 1 ? themeColors.yellow : themeColors.cyan,
        29,
      ),
    );
    for (let i = 0; i < 4; i++) {
      const correct = i === 2,
        x = 230 + i * 410;
      card(
        ctx,
        api,
        `path ${i + 1}`,
        x,
        590,
        260,
        95,
        correct ? themeColors.green : themeColors.blue,
      );
      if (currentBeat >= 1)
        focusTarget(ctx, api, 'tt-training-search', () => {
          const p = prog('tt-training-search', 1).p;
          api.rect(
            ctx,
            x,
            735,
            260 * p,
            42,
            correct ? themeColors.green : themeColors.blue,
            undefined,
            0,
          );
        });
    }
    if (currentBeat === 0)
      text(
        ctx,
        api,
        'Training rewards the demonstrated target',
        960,
        940,
        32,
        themeColors.yellow,
        'center',
      );
    else if (currentBeat === 1)
      text(
        ctx,
        api,
        'Chen et al. · math problems and formal theorem proving',
        960,
        940,
        33,
        themeColors.muted,
        'center',
      );
    else {
      focusTarget(ctx, api, 'tt-selected-evaluation', () => {
        const q = prog('tt-selected-evaluation', 2).p;
        movingCard(ctx, api, 'answer', 1010, 735, 1020, 865, q, themeColors.cyan);
      });
      text(
        ctx,
        api,
        'Measure both coverage and the returned answer',
        960,
        1035,
        31,
        themeColors.green,
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
  id: 'policy-training',
  draw: drawPolicyTraining,
  cues: [
    'tt-policy-training-0',
    'tt-policy-training-1',
    'tt-training-search',
    'tt-policy-training-2',
    'tt-selected-evaluation',
  ],
};
