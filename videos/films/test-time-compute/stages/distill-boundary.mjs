import { testTimeCoreFrame, ttCue } from '../construction.mjs';
import { card, focusTarget, text } from '../defaults.mjs';
export function drawDistillBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('distill-boundary', state);
  const prog = (name, beat = 0) => ttCue(state, name, beat);
  function content() {
    card(ctx, api, 'TEACHER SYSTEM', 160, 300, 680, 95, themeColors.blue, 36);
    card(ctx, api, 'TRACE-ONLY STUDENT', 1090, 300, 680, 95, themeColors.cyan, 35);
    let trace;
    [
      'successful trace',
      'rejected alternatives',
      'verifier code',
      'reward + search policy',
    ].forEach((label, i) => {
      const shape = card(
        ctx,
        api,
        label,
        200,
        455 + i * 120,
        530,
        80,
        i === 0 ? themeColors.green : themeColors.pink,
        28,
      );
      if (i === 0) trace = shape;
    });
    const copy = card(
      ctx,
      api,
      'Provided successful trace',
      1120,
      455,
      620,
      105,
      themeColors.green,
      31,
    );
    focusTarget(ctx, api, 'tt-trace-transfer', () =>
      api.teaching.transfer({
        source: {
          shape: trace,
          opacity: 1,
        },
        target: {
          shape: copy,
          opacity: 1,
        },
        progress: prog('tt-trace-transfer').p,
        color: themeColors.green,
        particle: {
          radius: 9,
          fill: themeColors.green,
        },
      }),
    );
    if (currentBeat === 0)
      text(
        ctx,
        api,
        'Student trains on the worked solution',
        1330,
        845,
        29,
        themeColors.yellow,
        'center',
      );
    else if (currentBeat === 1) {
      card(
        ctx,
        api,
        'With verification: try an answer, then check it',
        1000,
        720,
        800,
        105,
        themeColors.yellow,
        29,
      );
      text(
        ctx,
        api,
        'Setlur et al. compared how both learners used more inference time',
        960,
        1015,
        31,
        themeColors.muted,
        'center',
      );
    } else {
      card(
        ctx,
        api,
        'Actual-task error checks + allowed budget',
        1020,
        720,
        740,
        105,
        themeColors.green,
        30,
      );
      text(
        ctx,
        api,
        'Account for each information source',
        960,
        1015,
        33,
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
  id: 'distill-boundary',
  draw: drawDistillBoundary,
  cues: [
    'tt-distill-boundary-0',
    'tt-trace-transfer',
    'tt-distill-boundary-1',
    'tt-distill-boundary-2',
  ],
};
