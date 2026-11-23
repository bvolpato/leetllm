import { validationScores } from '../fixtures.mjs';
import { rankingMetrics } from '../model.mjs';
import { axes, cueAmount, equation, labelPoint, rectangle, segment, text } from '../defaults.mjs';
export function drawApAndTies(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-ap-and-ties-step-' + currentBeat, 0),
    resultComplete = (id) => cueAmount(ctx, api, id) === 1;
  api.focus.target('lr-ap-and-ties-mechanism', () => {
    const rows = validationScores.map((v) => ({
        ...v,
        p: currentBeat === 2 && (v.id === 'V3' || v.id === 'V4') ? 0.6 : v.p,
      })),
      r = rankingMetrics(rows),
      count =
        currentBeat === 0
          ? Math.min(8, Math.floor(cueAmount(ctx, api, 'lr-pr-membership') * 8.01))
          : 8;
    text(
      ctx,
      api,
      currentBeat === 2
        ? 'Separate supplied tie probe: V3 = V4 = 0.600'
        : 'Same eight scores, highest first',
      960,
      270,
      33,
      themeColors.muted,
    );
    r.sorted.forEach((v, i) => {
      const y = 350 + i * 61;
      rectangle(ctx, api, 240, y, 350 * v.p, 25, v.label ? themeColors.pink : themeColors.blue);
      text(ctx, api, v.id, 170, y + 23, 28, v.label ? themeColors.pink : themeColors.blue);
      text(ctx, api, v.p.toFixed(3), 680, y + 23, 28, themeColors.muted);
      if (i < count) segment(ctx, api, 230, y + 38, 750, y + 38, themeColors.yellow, 2);
    });
    if (currentBeat === 0) {
      const prefix = r.sorted.slice(0, count),
        tp = prefix.filter((v) => v.label).length,
        q = axes(ctx, api, 980, 405, 650, 410, [0, 1], [0, 1], 'recall', 'precision');
      let oldR = 0,
        oldP = 1,
        seen = 0;
      for (const group of r.groups) {
        seen += group.rows.length;
        if (seen > count) break;
        const a = q.point(oldR, oldP),
          z = q.point(oldR, group.precision),
          end = q.point(group.recall, group.precision);
        segment(ctx, api, a.x, a.y, z.x, z.y, themeColors.cyan, 4);
        segment(ctx, api, z.x, z.y, end.x, end.y, themeColors.cyan, 4);
        oldR = group.recall;
        oldP = group.precision;
      }
      labelPoint(ctx, api, q, oldR, oldP, themeColors.yellow);
      text(ctx, api, 'Queue ' + count + ' · caught ' + tp, 1350, 325, 33, themeColors.yellow);
      text(
        ctx,
        api,
        count
          ? 'Precision ' + (tp / count).toFixed(3) + ' · recall ' + (tp / 4).toFixed(3)
          : 'Empty precision: plotting convention',
        1320,
        950,
        31,
        themeColors.cyan,
      );
    } else {
      const positives = rows.filter((v) => v.label),
        negatives = rows.filter((v) => !v.label);
      for (let i = 0; i < 16; i++) {
        const pos = positives[Math.floor(i / 4)],
          neg = negatives[i % 4],
          credit = pos.p > neg.p ? 1 : pos.p === neg.p ? 0.5 : 0;
        rectangle(
          ctx,
          api,
          1565 + (i % 4) * 35,
          285 + Math.floor(i / 4) * 29,
          27,
          21,
          credit === 1 ? themeColors.green : credit === 0 ? themeColors.pink : themeColors.yellow,
        );
      }
      const groupCount =
        currentBeat === 1 ? Math.floor(op * r.groups.length + 0.001) : r.groups.length;
      let accumulated = 0;
      r.groups.forEach((g, i) => {
        if (i >= groupCount || !g.contribution) return;
        accumulated += g.contribution;
        const y = 385 + i * 60;
        text(
          ctx,
          api,
          g.precision.toFixed(3) + ' × ΔR ' + (g.contribution / g.precision).toFixed(2),
          1300,
          y,
          30,
          themeColors.cyan,
        );
      });
      if (currentBeat === 1 && resultComplete('lr-average-precision'))
        equation(ctx, api, 'AP=' + r.ap.toFixed(4), 1350, 955, 50, themeColors.yellow);
      if (currentBeat === 2) {
        text(ctx, api, 'Tied pair: half AUC credit', 1330, 870, 34, themeColors.yellow);
        if (resultComplete('lr-threshold-ties'))
          text(
            ctx,
            api,
            'Group AP ' + r.ap.toFixed(4) + ' · AUC ' + r.auc.toFixed(4),
            1330,
            965,
            34,
            themeColors.cyan,
          );
        if (resultComplete('lr-trapezoid-area')) {
          const points = [
              {
                recall: 0,
                precision: 1,
              },
              ...r.groups,
            ],
            area = points
              .slice(1)
              .reduce(
                (sum, g, i) =>
                  sum + ((g.recall - points[i].recall) * (g.precision + points[i].precision)) / 2,
                0,
              );
          text(
            ctx,
            api,
            'Trapezoidal PR area ' + area.toFixed(4),
            1330,
            1015,
            29,
            themeColors.pink,
          );
        }
      }
    }
  });
}
export default {
  id: 'ap-and-ties',
  draw: drawApAndTies,
  cues: [
    'lr-ap-and-ties-step-0',
    'lr-pr-membership',
    'lr-ap-and-ties-step-1',
    'lr-average-precision',
    'lr-ap-and-ties-step-2',
    'lr-threshold-ties',
    'lr-trapezoid-area',
  ],
};
