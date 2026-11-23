import { bounded } from '../arithmetic.mjs';
import { scalingEvent } from '../construction.mjs';
import { band, rectangle, text } from '../defaults.mjs';
export function drawCountingContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  const result = (caption) => {
    if (end) text(ctx, api, caption, 960, 960, 36, themeColors.green, 'center');
  };
  api.focus.target('sl-counting-contract-construction', () => {
    band(ctx, api, 'Same dense weights · arithmetic is separate from storage and elapsed time');
    const names = ['X · two token rows', 'W · six stored weights', 'Y = XW'];
    const matrices = [
      [
        [1, 2, 1],
        [0, 1, 2],
      ],
      [
        [1, 0],
        [0, 2],
        [1, 1],
      ],
      [
        [2, 5],
        [2, 4],
      ],
    ];
    matrices.forEach((mat, k) => {
      const ox = 245 + k * 555;
      text(
        ctx,
        api,
        names[k],
        ox + 170,
        355,
        31,
        [themeColors.blue, themeColors.cyan, themeColors.yellow][k],
        'center',
      );
      for (let i = 0; i < mat.length; i++)
        for (let j = 0; j < mat[i].length; j++) {
          rectangle(
            ctx,
            api,
            ox + j * 100,
            400 + i * 100,
            90,
            80,
            themeColors.panel,
            [themeColors.blue, themeColors.cyan, themeColors.yellow][k],
          );
          if (k < 2 || progress > (i * mat[i].length + j + 1) / 6)
            text(
              ctx,
              api,
              mat[i][j],
              ox + j * 100 + 45,
              451 + i * 100,
              35,
              themeColors.ink,
              'center',
            );
        }
    });
    if (currentBeat === 0) {
      const exposure = Math.floor(progress * 8);
      for (let i = 0; i < 8; i++) {
        rectangle(
          ctx,
          api,
          250 + i * 180,
          715,
          145,
          70,
          i < exposure ? themeColors.cyan : themeColors.panel,
          themeColors.muted,
        );
        text(
          ctx,
          api,
          i < exposure ? 'P' + ((i % 4) + 1) : '·',
          322 + i * 180,
          761,
          28,
          i < exposure ? themeColors.bg : themeColors.muted,
          'center',
        );
      }
      text(
        ctx,
        api,
        'Repeated source positions can create new presentations',
        960,
        850,
        31,
        themeColors.muted,
        'center',
      );
    } else {
      const terms = currentBeat === 2 ? 4 : 3;
      const names2 = [
        'Forward XW',
        'Input gradient ΔY Wᵀ',
        'Weight gradient Xᵀ ΔY',
        'Recomputed XW',
      ];
      for (let i = 0; i < terms; i++) {
        const n = bounded(progress * terms - i);
        rectangle(
          ctx,
          api,
          210 + i * 420,
          730,
          360,
          78,
          themeColors.panel,
          [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][i],
        );
        rectangle(
          ctx,
          api,
          210 + i * 420,
          810,
          360 * n,
          18,
          [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][i],
        );
        text(ctx, api, names2[i], 390 + i * 420, 779, 27, themeColors.ink, 'center');
        if (n === 1) text(ctx, api, '2ND', 390 + i * 420, 880, 30, themeColors.yellow, 'center');
      }
      result(
        currentBeat === 2
          ? 'One complete recomputed forward: 6ND + 2ND = 8ND'
          : 'Count all three trainable dense multiplications: 6ND',
      );
    }
  });
}
export default {
  id: 'counting-contract',
  draw: drawCountingContract,
  cues: ['sl-counting-contract-0', 'sl-counting-contract-1', 'sl-counting-contract-2'],
};
