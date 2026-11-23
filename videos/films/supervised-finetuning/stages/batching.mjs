import { spoken } from '../construction.mjs';
import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api;
  const batches = [[4], Array(9).fill(1)];
  const sums = batches.map((row) => row.reduce((a, b) => a + b, 0));
  batches.forEach((row, j) =>
    api.focus.target(j ? 'microbatch-b' : 'microbatch-a', () => {
      const y = 355 + j * 182;
      text(ctx, api, j ? 'Microbatch B' : 'Microbatch A', 145, y + 51, 35, C.ink);
      row.forEach((v, i) =>
        upgradeBox(ctx, api, String(v), 520 + i * 114, y, 95, 83, j ? C.cyan : C.blue, 37),
      );
      text(ctx, api, 'sum  ' + sums[j], 1710, y + 51, 35, C.ink, 'center');
    }),
  );
  const total = sums.reduce((a, b) => a + b, 0),
    count = batches.flat().length;
  api.focus.target('token-mean', () => {
    const answer = spoken(state, 'batching-b2-2', 1, 0.39);
    text(
      ctx,
      api,
      answer
        ? 'Equal tokens    (' +
            sums.join(' + ') +
            ') / ' +
            count +
            ' = ' +
            (total / count).toFixed(1)
        : 'Equal tokens    (' + sums.join(' + ') + ') / ?',
      960,
      799,
      48,
      answer ? C.green : C.ink,
      'center',
    );
  });
  api.focus.target('mean-of-means', () => {
    const means = sums.map((s, i) => s / batches[i].length);
    const answer = spoken(state, 'batching-b2-3', 1, 0.67);
    text(
      ctx,
      api,
      answer
        ? 'Equal batches    (' +
            means.join(' + ') +
            ') / 2 = ' +
            ((means[0] + means[1]) / 2).toFixed(1)
        : 'Equal batches    (mean A + mean B) / 2',
      960,
      931,
      39,
      C.muted,
      'center',
    );
  });
}

export default {
  id: 'batching',
  draw: draw,
  cues: ['batching-b1-1', 'batching-b2-1', 'batching-b2-2', 'batching-b2-3', 'batching-b3-1'],
};
