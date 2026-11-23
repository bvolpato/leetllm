import {
  chapterCueProgress,
  chapterRule,
  chapterText,
  constructionFocus,
  formatChapterValue,
  valueGrid,
  withOpacity,
  zeros,
} from '../defaults.mjs';
export function drawGlobalAverageHead(ctx, scene, state, api) {
  ctx.save();

  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  constructionFocus(ctx, api, 'global-average-head', () => {
    const q = chapterCueProgress(ctx, api, 'mean-collapse'),
      channels = Array.from(
        {
          length: 6,
        },
        (_, k) =>
          Array.from(
            {
              length: 3,
            },
            (_, r) =>
              Array.from(
                {
                  length: 3,
                },
                (_, d) => (k + r + d + 1) / 12,
              ),
          ),
      ),
      means = channels.map((a) => a.flat().reduce((s, v) => s + v, 0) / 9);
    const complete = currentBeat > 0 ? 6 : Math.floor(q * 6),
      inspected = currentBeat > 0 || q === 1 ? 0 : Math.min(5, complete);
    chapterText(
      ctx,
      api,
      'Six channels · 3 × 3 each',
      630,
      285,
      29,
      themeColors.blue,
      'center',
    );
    for (let k = 5; k >= 1; k--) {
      const x = 250 + k * 28,
        y = 380 - k * 17;
      withOpacity(ctx, api, 0.35, () => {
        api.line(ctx, x, y, x + 293, y, themeColors.muted, 2);
        api.line(ctx, x + 293, y, x + 293, y + 293, themeColors.muted, 2);
        api.line(ctx, x, y, x, 380, themeColors.muted, 2);
        api.line(ctx, 543, y + 293, x + 293, y + 293, themeColors.muted, 2);
      });
    }
    valueGrid(ctx, api, channels[inspected], 250, 380, 100, {
      kind: 'image',
      font: 25,
    });
    chapterText(
      ctx,
      api,
      'selected channel C' + inspected,
      450,
      760,
      29,
      themeColors.blue,
      'center',
    );
    const target = valueGrid(
      ctx,
      api,
      means.map((v, i) => [i < complete ? v : '?']),
      1030,
      325,
      105,
      {
        font: 26,
      },
    );
    target.forEach((cell, i) =>
      chapterText(ctx, api, 'C' + i, 1175, cell.y + 60, 25, themeColors.muted, 'center'),
    );
    chapterText(ctx, api, 'one mean per channel', 1270, 285, 30, themeColors.cyan, 'center');
    if (currentBeat === 0 && q > 0 && q < 1) {
      const i = Math.min(5, complete),
        to = target[i],
        u = (q * 6) % 1,
        points = [
          {
            x: 555,
            y: 526,
          },
          {
            x: 800,
            y: 526,
          },
          {
            x: 800,
            y: to.y + to.height / 2,
          },
          {
            x: 1018,
            y: to.y + to.height / 2,
          },
        ],
        lengths = points.slice(1).map((v, j) => Math.hypot(v.x - points[j].x, v.y - points[j].y));
      let left = u * lengths.reduce((a, b) => a + b, 0),
        tip = points[0];
      for (let j = 0; j < lengths.length; j++) {
        const a = points[j],
          z = points[j + 1];
        api.line(ctx, a.x, a.y, z.x, z.y, themeColors.muted, 1);
        if (left > 0) {
          const f = Math.min(1, left / (lengths[j] || 1));
          tip = {
            x: api.lerp(a.x, z.x, f),
            y: api.lerp(a.y, z.y, f),
          };
          api.line(ctx, a.x, a.y, tip.x, tip.y, themeColors.cyan, 3);
          left -= lengths[j];
        }
      }
      api.circle(ctx, tip.x, tip.y, 5, themeColors.cyan);
      chapterText(
        ctx,
        api,
        'sum / 9 = ' + formatChapterValue(means[i]),
        450,
        850,
        30,
        themeColors.cyan,
        'center',
      );
    }
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'permuting values keeps their mean',
        650,
        940,
        32,
        themeColors.muted,
        'center',
      );
      chapterRule(ctx, api, '(N,C,H,W)\\to(N,C)', 1300, 985, 39);
    } else if (currentBeat === 1) {
      const v = chapterCueProgress(ctx, api, 'head-count');
      chapterText(ctx, api, 'same two output logits', 1500, 405, 32, themeColors.green, 'center');
      valueGrid(ctx, api, [['logit 0'], ['logit 1']], 1430, 470, 122, {
        font: 26,
      });
      if (v === 1) {
        chapterText(
          ctx,
          api,
          'flatten: 6 × 9 × 2 + 2 = 110',
          1460,
          850,
          32,
          themeColors.pink,
          'center',
        );
        chapterText(ctx, api, 'GAP: 6 × 2 + 2 = 14', 1460, 950, 36, themeColors.green, 'center');
      }
    } else {
      const v = chapterCueProgress(ctx, api, 'mean-peak');
      const peak = zeros(ctx, api, 3);
      peak[1][1] = 9;
      chapterText(
        ctx,
        api,
        'One bright response',
        1490,
        350,
        27,
        themeColors.muted,
        'center',
      );
      valueGrid(ctx, api, peak, 1370, 420, 85, {
        kind: 'image',
        active: 4,
        font: 30,
      });
      const max = Math.max(...peak.flat());
      const mean = peak.flat().reduce((sum, cell) => sum + cell, 0) / peak.flat().length;
      if (chapterCueProgress(ctx, api, 'peak-nine') === 1)
        chapterText(ctx, api, 'Max = ' + max, 1500, 800, 34, themeColors.yellow, 'center');
      if (v === 1)
        chapterText(ctx, api, 'Mean = ' + mean, 1500, 872, 34, themeColors.cyan, 'center');
    }
    return;
  });

  ctx.restore();
}
export default {
  id: 'global-average-head',
  draw: drawGlobalAverageHead,
  cues: [
    'global-average-head-b1',
    'mean-collapse',
    'global-average-head-b2',
    'head-count',
    'global-average-head-b3',
    'mean-peak',
    'peak-nine',
  ],
};
