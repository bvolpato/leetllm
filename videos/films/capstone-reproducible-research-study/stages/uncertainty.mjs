import { cueProgress, earlyEpisodes, ledger, signed, summary } from '../evidence.mjs';

const sourceSeeds = [0, 6, 14, 23];
const sample = [6, 6, 14, 0].map((seed) => ledger[seed]);
const estimate = summary(sample);

export function drawUncertainty(ctx, scene, state, api) {
  const { C } = api;
  const select =
    (2 * cueProgress(state, 'sample-six-twice', 0, 0.45, 0.56) +
      cueProgress(state, 'sample-fourteen', 0, 0.58, 0.65) +
      cueProgress(state, 'sample-four', 0, 0.66, 0.72)) /
    4;
  const answer = cueProgress(state, 'average-draw', 1, 0.1, 0.46) === 1;
  api.focus.target('paired-draw', () => {
    api.text(ctx, 'Four worked seed rows for practice', 145, 256, 37, C.ink);
    const x = (i) => 335 + 420 * i;
    sourceSeeds.forEach((seed, i) => {
      const { gain } = ledger[seed];
      api.text(ctx, `Seed ${seed}`, x(i), 352, 33, C.muted, 'center');
      api.text(
        ctx,
        `${signed(gain)} / ${earlyEpisodes}`,
        x(i),
        426,
        46,
        gain >= 0 ? C.cyan : C.pink,
        'center',
      );
    });
    api.text(ctx, 'One draw with replacement', 145, 810, 32, C.muted);
    sample.forEach((row, i) => {
      const p = api.clamp(4 * select - i);
      api.line(ctx, x(i) - 165, 722, x(i) + 165, 722, C.muted, 3);
      if (p === 0) return;
      const origin = x(sourceSeeds.indexOf(row.seed));
      const xx = origin + p * (x(i) - origin);
      const yy = 455 + p * 245;
      api.text(
        ctx,
        `#${row.seed}   ${signed(row.gain)} / 30`,
        xx,
        yy,
        34,
        row.gain >= 0 ? C.cyan : C.pink,
        'center',
      );
    });
    if (select === 1) {
      const label = `100 × (−9 − 9 + 20 + 3) / (4 × 30) = ${answer ? signed(estimate.points, 1) + ' points' : '?'}`;
      api.text(ctx, label, 960, 903, 44, answer ? C.yellow : C.ink, 'center');
    }
    api.text(
      ctx,
      state.beat >= 1
        ? 'Study interval: draw 24 whole pairs from the 24 retained rows.'
        : 'Each fraction is the difference in goals divided by 30 training episodes.',
      960,
      976,
      31,
      C.muted,
      'center',
    );
  });
}
export default { id: 'uncertainty', draw: drawUncertainty, cues: ['sample-four', 'average-draw'] };
