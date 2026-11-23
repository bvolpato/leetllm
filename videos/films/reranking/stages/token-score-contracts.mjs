const vocab = ['yes', 'no', 'other'];
const logits = [2, 1, 3];
const masses = logits.map(Math.exp);

export function drawTokenScoreContracts(ctx, scene, state, api) {
  const { C, focus } = api;
  const colors = [C.green, C.yellow, C.blue];
  const done = (id) => focus.progress(id, 0) === 1;
  const beat = state.beat ?? 0;
  if (beat === 0) {
    focus.target('position', () => {
      api.text(ctx, 'Final prompt position', 140, 309, 43, C.muted);
      api.text(ctx, 'Question + passage    →    relevant?', 140, 444, 60, C.ink);
      api.text(ctx, 'yes logit', 145, 635, 57, C.green);
      api.text(ctx, 'no logit', 691, 635, 57, C.yellow);
      if (done('token-rule'))
        api.text(ctx, 'Binary yes score   =   sigmoid(yes logit − no logit)', 140, 874, 52, C.ink);
    });
    return;
  }
  if (beat < 3 && focus.progress('second-pair', 0) === 0) {
    focus.target('masses', () => {
      api.text(ctx, 'Three possible tokens   /   shares rounded to 3 decimals', 140, 270, 44, C.ink);
      vocab.forEach((token, i) => {
        const x = 144 + i * 530;
        api.text(ctx, token + '   ·   logit ' + logits[i], x, 379, 39, colors[i]);
        api.text(ctx, 'exp(' + logits[i] + ') ≈ ' + masses[i].toFixed(2), x, 449, 35, C.muted);
      });
    });
    focus.target('shares', () => {
      const trackX = 570,
        width = 1050;
      const rows = [
        { n: 2, y: 591, title: 'Yes or no', begun: true, revealed: done('binary-complete') },
        {
          n: 3,
          y: 790,
          title: 'Whole vocabulary',
          begun: focus.progress('restore-other', 0) > 0,
          revealed: done('full-probability'),
        },
      ];
      for (const { n, y, title, begun, revealed } of rows) {
        if (!begun) continue;
        const total = masses.slice(0, n).reduce((a, b) => a + b, 0);
        api.text(ctx, title, 140, y + 50, 37, C.ink);
        if (!revealed) {
          api.rect(ctx, trackX, y, width, 80, C.panel, C.muted, 6);
          api.text(
            ctx,
            n === 2 ? 'Share for yes?' : 'Larger or smaller than the binary share?',
            trackX + 30,
            y + 51,
            37,
            C.green,
          );
        } else {
          let x = trackX;
          for (let i = 0; i < n; i++) {
            const w = (width * masses[i]) / total;
            api.rect(ctx, x + 2, y, w - 4, 80, C.panel, colors[i], 6);
            api.text(ctx, vocab[i], x + w / 2, y + 52, 34, colors[i], 'center');
            x += w;
          }
        }
        const denominator = logits
          .slice(0, n)
          .map((z) => 'e^' + z)
          .join('+');
        api.math(
          ctx,
          `e^${logits[0]}/(${denominator})=${revealed ? (masses[0] / total).toFixed(3) : '?'}`,
          trackX,
          y + 134,
          38,
          revealed ? C.green : C.muted,
        );
      }
    });
    return;
  }
  focus.target('passages', () => {
    api.text(ctx, 'Same two passages, two ways to sort', 140, 275, 46, C.ink);
    const xs = [142, 530, 790, 1110, 1460];
    ['Passage', 'yes', 'no', 'yes only', 'yes − no'].forEach((v, i) =>
      api.text(ctx, v, xs[i], 418, 37, C.muted),
    );
    const pairs = [
      [2, 1],
      [3, 4],
    ];
    const bestYes = Math.max(...pairs.map(([yes]) => yes));
    const bestGap = Math.max(...pairs.map(([yes, no]) => yes - no));
    pairs.forEach(([yes, no], i) => {
      const y = 554 + i * 153;
      const values = [
        i === 0 ? 'A' : 'B',
        yes,
        no,
        done('single-order') ? yes : '?',
        done('difference-order') ? yes - no : '?',
      ];
      values.forEach((v, j) => {
        const winner =
          (j === 3 && yes === bestYes && done('single-order')) ||
          (j === 4 && yes - no === bestGap && done('difference-order'));
        api.text(ctx, String(v), xs[j], y, 50, winner ? C.green : C.ink);
      });
    });
    api.text(ctx, 'First passage', xs[0], 905, 38, C.muted);
    const names = ['A', 'B'];
    const yesWinner = names[pairs.findIndex(([yes]) => yes === bestYes)];
    const gapWinner = names[pairs.findIndex(([yes, no]) => yes - no === bestGap)];
    api.text(
      ctx,
      done('single-order') ? `Single Yes → ${yesWinner} first` : 'Who wins on yes?',
      xs[3] + 50,
      905,
      34,
      done('single-order') ? C.green : C.yellow,
      'center',
    );
    api.text(
      ctx,
      done('difference-order') ? `Yes−No → ${gapWinner} first` : 'Who wins on the gap?',
      xs[4] + 90,
      905,
      34,
      done('difference-order') ? C.green : C.yellow,
      'center',
    );
  });
}
export default {
  id: 'token-score-contracts',
  draw: drawTokenScoreContracts,
  cues: [
    'token-rule',
    'toy-logits',
    'binary-complete',
    'restore-other',
    'full-probability',
    'second-pair',
    'single-order',
    'difference-order',
  ],
};
