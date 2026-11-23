import {
  chapterBox,
  chapterCueComplete,
  chapterCueVisible,
  chapterEquation,
  chapterFooter,
  chapterLine,
  chapterMatrix,
  chapterText,
} from '../defaults.mjs';
export function drawRandomProjection(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      const r = [
          [1, 1],
          [-1, 1],
          [1, -1],
          [-1, -1],
        ].map((row) => row.map((x) => x / Math.sqrt(2))),
        doc = [1, 2, 0, 1],
        query = [1, 1, 0, 0],
        apply = (v) => [0, 1].map((k) => v.reduce((sum, x, i) => sum + x * r[i][k], 0));
      chapterText(
        ctx,
        api,
        'Reuse one supplied sign matrix · no fresh random draw',
        960,
        285,
        35,
        themeColors.ink,
      );
      chapterText(
        ctx,
        api,
        'Row vectors xR · R has shape 4 × 2 · scale 1/√2',
        960,
        340,
        29,
        themeColors.muted,
      );
      chapterMatrix(
        ctx,
        api,
        [
          ['+1', '+1'],
          ['−1', '+1'],
          ['+1', '−1'],
          ['−1', '−1'],
        ],
        780,
        380,
        180,
        105,
        themeColors.cyan,
      );
      chapterBox(ctx, api, 'Document row\n[1, 2, 0, 1]', 150, 450, 500, 145, themeColors.blue);
      chapterBox(ctx, api, 'Query row\n[1, 1, 0, 0]', 1280, 450, 500, 145, themeColors.green);
      if (chapterCueVisible(ctx, api, 'random-once')) {
        chapterBox(
          ctx,
          api,
          'xR = [' +
            apply(doc)
              .map((x) => x.toFixed(3))
              .join(', ') +
            ']',
          150,
          710,
          500,
          100,
          themeColors.blue,
        );
        chapterBox(
          ctx,
          api,
          'qR = [' +
            apply(query)
              .map((x) => x.toFixed(3))
              .join(', ') +
            ']',
          1280,
          710,
          500,
          100,
          themeColors.green,
        );
      }
      if (chapterCueVisible(ctx, api, 'random-gaussian'))
        chapterText(
          ctx,
          api,
          'Gaussian alternative: mean 0 · variance 1/k',
          960,
          890,
          33,
          themeColors.yellow,
        );
      if (chapterCueVisible(ctx, api, 'random-sparse'))
        chapterText(
          ctx,
          api,
          'Sparse rule: ±√(3/k) with 1/6 each; zero with 2/3',
          960,
          970,
          29,
          themeColors.cyan,
        );
    } else if (currentBeat === 1) {
      chapterEquation(
        ctx,
        api,
        String.raw`k\ge\frac{4\ln N}{\epsilon^2/2-\epsilon^3/3}`,
        960,
        385,
        54,
        themeColors.cyan,
      );
      if (chapterCueVisible(ctx, api, 'jl-squared'))
        chapterBox(
          ctx,
          api,
          '(1 − ε) ‖x − y‖² ≤ ‖Rx − Ry‖² ≤ (1 + ε) ‖x − y‖²',
          190,
          570,
          1540,
          130,
          themeColors.yellow,
        );
      if (chapterCueComplete(ctx, api, 'jl-dimension')) {
        chapterText(
          ctx,
          api,
          'N = 10 million · ε = 0.15 → k ≥ 6,368',
          960,
          825,
          39,
          themeColors.pink,
        );
        chapterText(
          ctx,
          api,
          'This sufficient bound exceeds the original 1,536 dimensions',
          960,
          930,
          31,
          themeColors.muted,
        );
      }
    } else {
      chapterText(
        ctx,
        api,
        'Allowed squared-distance intervals can overlap',
        960,
        285,
        35,
        themeColors.ink,
      );
      for (let i = 0; i < 2; i++) {
        const center = i ? 1.15 : 1,
          x = 350 + center * 0.85 * 800,
          z = 350 + center * 1.15 * 800;
        chapterLine(
          ctx,
          api,
          x,
          430 + i * 170,
          z,
          430 + i * 170,
          i ? themeColors.yellow : themeColors.cyan,
          15,
        );
        chapterText(
          ctx,
          api,
          'source d² = ' + center,
          450,
          475 + i * 170,
          30,
          i ? themeColors.yellow : themeColors.cyan,
        );
      }
      if (chapterCueVisible(ctx, api, 'jl-distance'))
        chapterText(
          ctx,
          api,
          'ε = .15 on d² means −7.8% to +7.2% on distance',
          960,
          790,
          33,
          themeColors.yellow,
        );
      if (chapterCueVisible(ctx, api, 'random-result'))
        chapterText(
          ctx,
          api,
          '48→16 worksheet: 192→64 raw bytes · overlap@5 = .317',
          960,
          920,
          34,
          themeColors.pink,
        );
    }
    chapterFooter(
      ctx,
      api,
      'Fixed-set existence bound · no automatic ranking or future-query guarantee',
    );
  }
  return;
}
export default {
  id: 'random-projection',
  draw: drawRandomProjection,
  cues: [
    'random-once',
    'random-gaussian',
    'random-sparse',
    'jl-bound',
    'jl-squared',
    'jl-dimension',
    'jl-rank',
    'jl-distance',
    'random-result',
  ],
};
