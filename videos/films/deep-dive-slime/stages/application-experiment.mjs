import { progress } from '../phrase-clock.mjs';

const tests = [
  [3, 7],
  [7, 7],
];

export function drawApplicationExperiment(ctx, scene, state, api) {
  const { C } = api;
  const p = (beat, sentence) =>
    progress(scene, state, 'sl-application-experiment-b' + beat + '-s' + sentence);
  return api.focus.target('sl-application-experiment-mechanism', () => {
    if (state.beat < 2) {
      api.text(ctx, 'last.py', 118, 310, 36, C.muted);
      api.text(ctx, 'return xs[0]', 118, 420, 80, C.ink, 'left', 'mono');
      const columns = [150, 570, 950, 1290, 1660];
      ['Verifier', 'Input', 'Expected', 'Returned', 'Reward'].forEach((label, i) =>
        api.text(ctx, label, columns[i], 565, 36, C.muted),
      );
      tests.forEach((xs, i) => {
        if (i === 1 && p(0, 1) === 0) return;
        const revealed = i === 0 || p(1, 0) === 1;
        const actual = xs[0];
        const expected = xs.at(-1);
        const reward = Number(actual === expected);
        const y = 700 + i * 160;
        api.line(ctx, 118, y - 85, 1800, y - 85, C.muted, 2);
        api.text(ctx, 'Test ' + (i + 1), columns[0], y, 53, C.ink);
        api.text(
          ctx,
          '[' + xs.join(', ') + ']',
          columns[1],
          y,
          52,
          i ? C.yellow : C.ink,
          'left',
          'mono',
        );
        api.text(ctx, String(expected), columns[2], y, 60, C.ink);
        api.text(ctx, revealed ? String(actual) : '?', columns[3], y, 60, C.ink);
        api.text(
          ctx,
          revealed ? String(reward) : '?',
          columns[4],
          y,
          60,
          revealed ? (reward ? C.green : C.pink) : C.muted,
        );
      });
      return;
    }
    const checks = [
      ['CPU', 'Check the token mask.'],
      ['GPU', 'Run a training update.'],
      ['Multiple nodes', 'Read each engine’s loaded version.'],
    ];
    api.text(ctx, 'Which part of the run changed?', 128, 340, 62, C.ink);
    checks.forEach(([where, check], i) => {
      const y = 522 + i * 150;
      const active = p(2, 2) > i / 3;
      api.text(ctx, where, 145, y, 45, active ? C.cyan : C.muted);
      api.text(ctx, check, 690, y, 48, active ? C.ink : C.muted);
    });
  });
}
export default {
  id: 'application-experiment',
  draw: drawApplicationExperiment,
  cues: [
    'sl-application-experiment-b0-operation',
    'sl-application-experiment-b0-s0',
    'sl-application-experiment-b0-s1',
    'sl-application-experiment-b1-operation',
    'sl-application-experiment-b1-s0',
    'sl-application-experiment-b1-s1',
    'sl-application-experiment-b1-s2',
    'sl-application-experiment-b2-operation',
    'sl-application-experiment-b2-s0',
    'sl-application-experiment-b2-s1',
    'sl-application-experiment-b2-s2',
    'sl-application-experiment-b2-s3',
  ],
};
