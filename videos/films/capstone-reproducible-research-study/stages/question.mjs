import { cueProgress, earlyEpisodes, ledger, signed } from '../evidence.mjs';

export function drawQuestion(ctx, scene, state, api) {
  const { C } = api;
  const sparse = [
    cueProgress(state, 'read-first-sparse', 0, 0.25, 0.48),
    cueProgress(state, 'read-second-sparse', 1, 0.12, 0.38),
  ];
  const shaped = [
    cueProgress(state, 'open-first-seed', 0, 0.49, 0.83),
    cueProgress(state, 'open-second-seed', 1, 0.39, 0.58),
  ];
  api.focus.target('goal-counts', () => {
    api.text(ctx, 'Goals in the first 30 training episodes per learner', 135, 261, 40, C.ink);
    for (const [i, seed] of [14, 6].entries()) {
      const x = 135 + 855 * i;
      api.text(ctx, `Seed ${seed}`, x, 372, 42, C.ink);
      const row = ledger[seed];
      for (const [j, name] of ['sparse', 'shaped'].entries()) {
        const p = j ? shaped[i] : sparse[i];
        const y = 450 + 142 * j;
        const count = Math.floor(row[name] * p);
        const color = j ? C.cyan : C.blue;
        api.text(ctx, j ? 'Shaped' : 'Sparse', x, y, 31, color);
        api.text(
          ctx,
          p === 0 ? '…' : `${count} / ${earlyEpisodes}`,
          x + 700,
          y,
          35,
          C.ink,
          'right',
        );
        for (let k = 0; k < earlyEpisodes; k++)
          api.rect(ctx, x + 24 * k, y + 19, 17, 48, k < count ? color : C.panel, undefined, 2);
      }
      if (shaped[i] === 1)
        api.text(ctx, `${signed(row.gain)} goals`, x, 766, 51, row.gain > 0 ? C.cyan : C.pink);
    }
    const note =
      shaped[1] === 1 && state.beat === 1
        ? 'Which seed belongs in the study average?'
        : state.beat >= 2
          ? 'One seed supplies one pair. Keep all 24 pairs.'
          : 'Each filled mark stands for one goal.';
    api.text(ctx, note, 960, 947, 37, C.ink, 'center');
  });
}
export default {
  id: 'question',
  draw: drawQuestion,
  cues: ['open-first-seed', 'open-second-seed', 'retain-both'],
};
