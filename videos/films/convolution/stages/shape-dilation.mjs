import {
  chapterCueProgress,
  chapterOutline,
  chapterRule,
  chapterText,
  constructionFocus,
  formatChapterValue,
  valueGrid,
  zeros,
} from '../defaults.mjs';
export function drawShapeDilation(ctx, scene, state, api) {
  ctx.save();

  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  constructionFocus(ctx, api, 'shape-dilation', () => {
    const dil = currentBeat > 0 ? 1 : chapterCueProgress(ctx, api, 'dilate-weights'),
      gap = 1 + dil;
    chapterText(ctx, api, 'same nine weight identities', 580, 300, 31, themeColors.cyan, 'center');
    const lattice = valueGrid(ctx, api, zeros(ctx, api, 7), 250, 350, 68, {
      show: 0,
    });
    for (let i = 0; i < 9; i++) {
      const r = Math.floor(i / 3),
        c0 = i % 3,
        x = 250 + (1 + c0 * gap) * 68,
        y = 350 + (1 + r * gap) * 68;
      api.rect(ctx, x, y, 68, 68, themeColors.panel, themeColors.cyan, 3, 3);
      chapterText(ctx, api, 'w' + (i + 1), x + 34, y + 44, 25, themeColors.cyan, 'center');
    }
    chapterOutline(ctx, api, 318, 418, 61 + 136 * gap, 61 + 136 * gap, themeColors.yellow, 3);
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'dilation ' + formatChapterValue(gap, 1),
        1330,
        420,
        37,
        themeColors.cyan,
        'center',
      );
      chapterText(ctx, api, '9 stored coefficients', 1330, 580, 36, themeColors.green, 'center');
      if (dil === 1)
        chapterText(ctx, api, '5 × 5 footprint', 1330, 730, 42, themeColors.yellow, 'center');
      chapterRule(ctx, api, 'D(K-1)+1', 1330, 900, 45);
    } else if (currentBeat === 1) {
      const q = chapterCueProgress(ctx, api, 'dilated-starts'),
        n = Math.floor(q * 24);
      chapterText(
        ctx,
        api,
        '28 input positions · K = 3 · D = 2 · S = 1',
        1290,
        330,
        29,
        themeColors.blue,
        'center',
      );
      for (let i = 0; i < 28; i++) {
        api.rect(ctx, 1010 + i * 26, 450, 20, 80, themeColors.panel, themeColors.muted, 1, 2);
        if (i < n) api.circle(ctx, 1020 + i * 26, 590, 5, themeColors.green);
      }
      const start = Math.max(0, Math.min(23, n - 1));
      chapterOutline(ctx, api, 1006 + start * 26, 446, 132, 88, themeColors.yellow, 3);
      chapterText(ctx, api, n + ' complete starts', 1370, 700, 40, themeColors.green, 'center');
      chapterRule(
        ctx,
        api,
        '\\left\\lfloor\\frac{28-2(3-1)-1}{1}\\right\\rfloor+1' + (q === 1 ? '=24' : ''),
        1300,
        850,
        31,
      );
    } else {
      chapterText(
        ctx,
        api,
        'stride 1 · total padding D(K−1)',
        1290,
        345,
        33,
        themeColors.cyan,
        'center',
      );
      chapterText(
        ctx,
        api,
        'K = 3, D = 2: 2 left + 2 right',
        1290,
        470,
        29,
        themeColors.green,
        'center',
      );
      valueGrid(ctx, api, [['P', 'P', 1, 1, 1, 1, 'P', 'P']], 1060, 575, 65, {
        font: 27,
        selected: [
          [0, 0],
          [0, 1],
          [0, 6],
          [0, 7],
        ],
      });
      chapterText(
        ctx,
        api,
        'P: added position · 4 original positions',
        1330,
        705,
        25,
        themeColors.muted,
        'center',
      );
      chapterText(
        ctx,
        api,
        'K = 2, D = 1: total padding 1',
        1290,
        750,
        30,
        themeColors.yellow,
        'center',
      );
      if (chapterCueProgress(ctx, api, 'same-padding') > 0) {
        valueGrid(ctx, api, [[1, 1, 1, 1, 'P']], 1120, 825, 65, {
          font: 27,
        });
        chapterText(ctx, api, '0 left + 1 right', 1290, 970, 31, themeColors.yellow, 'center');
      }
    }
    return;
  });

  ctx.restore();
}
export default {
  id: 'shape-dilation',
  draw: drawShapeDilation,
  cues: [
    'shape-dilation-b1',
    'dilate-weights',
    'shape-dilation-b2',
    'dilated-starts',
    'shape-dilation-b3',
    'same-padding',
  ],
};
