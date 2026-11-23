import { maxSimMatrix } from '../model.mjs';
import {
  arrow,
  codeText,
  coreEquation,
  coreText,
  cueDone,
  cueVisible,
  focusTargets,
  line,
  rectangle,
} from '../defaults.mjs';
export function drawLateMaxsim(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  {
    focusTargets(
      ctx,
      api,
      [
        'token-storage',
        'row-maxima',
        'maxsim-vectors',
        'maxsim-first',
        'maxsim-second',
        'maxsim-sum',
        'reuse-token',
        'compression-scope',
        'centroid-pruning',
      ],
      () => {
        if (currentBeat === 0) {
          coreText(
            ctx,
            api,
            'Contextual document-token vectors stored before query',
            150,
            315,
            34,
            themeColors.blue,
          );
          for (let i = 0; i < 3; i++) {
            const x = 240 + i * 530;
            coreText(
              ctx,
              api,
              'document token ' + (i + 1),
              x + 170,
              430,
              29,
              themeColors.blue,
              'center',
            );
            teaching.grid({
              x,
              y: 480,
              width: 340,
              height: 90,
              rows: 1,
              columns: 4,
              labels: [['d₁', 'd₂', 'd₃', '…']],
              fill: themeColors.panel,
              stroke: themeColors.blue,
              textColor: themeColors.blue,
              fontSize: 29,
            });
          }
          if (cueVisible(ctx, api, 'row-maxima')) {
            ['query token 1', 'query token 2'].forEach((v, i) => {
              coreText(ctx, api, v, 180, 740 + i * 120, 31, themeColors.yellow);
              arrow(
                ctx,
                api,
                {
                  x: 600,
                  y: 730 + i * 120,
                },
                {
                  x: 1160,
                  y: 730 + i * 120,
                },
                themeColors.muted,
              );
              coreText(
                ctx,
                api,
                'best document-token dot product',
                1220,
                740 + i * 120,
                29,
                themeColors.green,
              );
            });
            coreText(
              ctx,
              api,
              'sum the independent maxima',
              960,
              980,
              35,
              themeColors.cyan,
              'center',
            );
          }
        } else if (currentBeat >= 3) {
          coreText(
            ctx,
            api,
            'Same three stored document-token vectors',
            150,
            300,
            33,
            themeColors.blue,
          );
          const vectors = [
              [0.9, Math.sqrt(0.19)],
              [0.6, 0.8],
              [-0.8, -0.6],
            ],
            centers = [
              [0.5, 0.5],
              [0.5, 0.5],
              [-0.5, -0.5],
            ],
            compressed = cueVisible(ctx, api, 'compression-scope'),
            pruned = cueVisible(ctx, api, 'centroid-pruning');
          vectors.forEach((d, i) => {
            const y = 430 + i * 150,
              color = i === 2 && pruned ? themeColors.muted : themeColors.blue;
            coreText(ctx, api, 'd' + (i + 1), 150, y, 32, color);
            codeText(
              ctx,
              api,
              '[' + d.map((v) => v.toFixed(3)).join(', ') + ']',
              250,
              y,
              28,
              color,
            );
            if (compressed) {
              const c = centers[i],
                r = d.map((v, j) => v - c[j]);
              arrow(
                ctx,
                api,
                {
                  x: 650,
                  y: y - 12,
                },
                {
                  x: 790,
                  y: y - 12,
                },
                themeColors.muted,
              );
              codeText(
                ctx,
                api,
                '[' + c.map((v) => v.toFixed(3)).join(', ') + ']',
                850,
                y,
                27,
                themeColors.yellow,
              );
              coreText(ctx, api, '+', 1180, y, 31, themeColors.ink);
              codeText(
                ctx,
                api,
                '[' + r.map((v) => v.toFixed(3)).join(', ') + ']',
                1260,
                y,
                27,
                themeColors.cyan,
              );
            }
            if (pruned && i === 2) {
              line(ctx, api, 150, 760, 1720, 760, themeColors.pink, 3);
              coreText(
                ctx,
                api,
                'supplied coarse-stage rejection',
                1460,
                820,
                27,
                themeColors.pink,
                'center',
              );
            }
          });
          if (compressed) {
            coreText(ctx, api, 'centroid c', 1000, 365, 28, themeColors.yellow, 'center');
            coreText(ctx, api, 'residual d − c', 1430, 365, 28, themeColors.cyan, 'center');
            coreText(
              ctx,
              api,
              'Representation sketch; actual quantization determines bytes.',
              960,
              900,
              28,
              themeColors.muted,
              'center',
            );
          }
          if (pruned)
            coreText(
              ctx,
              api,
              'This supplied prune keeps both maxima: 6 token comparisons → 4',
              960,
              975,
              30,
              themeColors.green,
              'center',
            );
          else if (cueVisible(ctx, api, 'reuse-token'))
            coreText(
              ctx,
              api,
              'Each query row chooses independently; no one-to-one assignment.',
              960,
              975,
              30,
              themeColors.ink,
              'center',
            );
        } else {
          const mat = maxSimMatrix(),
            plot = teaching.axes({
              x: 210,
              y: 435,
              width: 470,
              height: 470,
              xDomain: [-1.1, 1.1],
              yDomain: [-1.1, 1.1],
              equalUnits: true,
              xTicks: [-1, 0, 1],
              yTicks: [-1, 0, 1],
              fontSize: 24,
              color: themeColors.muted,
            });
          [
            [0.9, Math.sqrt(0.19)],
            [0.6, 0.8],
            [-0.8, -0.6],
          ].forEach((v, i) => {
            const a = plot.point(0, 0),
              z = plot.point(...v);
            arrow(ctx, api, a, z, [themeColors.blue, themeColors.green, themeColors.pink][i], 3);
            coreText(
              ctx,
              api,
              'd' + (i + 1),
              z.x + (i === 2 ? -28 : 20),
              z.y + (i === 2 ? 35 : -10),
              27,
              [themeColors.blue, themeColors.green, themeColors.pink][i],
              i === 2 ? 'right' : 'left',
            );
          });
          coreText(ctx, api, 'Unit document vectors', 450, 350, 31, themeColors.blue, 'center');
          coreText(ctx, api, 'q₁=(1,0), q₂=(0,1)', 1260, 350, 32, themeColors.yellow, 'center');
          const summed = cueDone(ctx, api, 'maxsim-sum');
          const first = summed || cueDone(ctx, api, 'maxsim-first');
          const second = summed || cueDone(ctx, api, 'maxsim-second');
          const maxima = mat.map((row) => Math.max(...row));
          mat.forEach((r, i) =>
            r.forEach((v, j) => {
              const x = 875 + j * 225,
                y = 480 + i * 170,
                win = v === maxima[i] && (i === 0 ? first : second),
                shown = cueVisible(ctx, api, i === 0 ? 'maxsim-vectors' : 'second-row');
              rectangle(
                ctx,
                api,
                x,
                y,
                190,
                100,
                win && shown ? themeColors.green : themeColors.muted,
              );
              if (shown)
                coreText(
                  ctx,
                  api,
                  String(Number(v.toFixed(3))),
                  x + 95,
                  y + 63,
                  34,
                  win ? themeColors.green : themeColors.muted,
                  'center',
                );
            }),
          );
          ['q₁', 'q₂'].forEach((v, i) =>
            coreText(ctx, api, v, 840, 545 + i * 170, 31, themeColors.yellow, 'right'),
          );
          ['d₁', 'd₂', 'd₃'].forEach((v, i) =>
            coreText(ctx, api, v, 970 + i * 225, 425, 29, themeColors.blue, 'center'),
          );
          coreText(ctx, api, 'Row maximum', 1685, 425, 29, themeColors.green, 'center');
          [first, second].forEach((settled, i) => {
            const y = 480 + i * 170;
            rectangle(ctx, api, 1570, y, 230, 100, settled ? themeColors.green : themeColors.muted);
            coreText(
              ctx,
              api,
              settled ? maxima[i].toFixed(3) : '?',
              1685,
              y + 63,
              37,
              settled ? themeColors.green : themeColors.muted,
              'center',
            );
          });
          if (summed)
            coreEquation(
              ctx,
              api,
              String.raw`\max_j q_1^Td_j+\max_j q_2^Td_j=${maxima[0]}+${maxima[1]}=${(maxima[0] + maxima[1]).toFixed(1)}`,
              1250,
              910,
              37,
              themeColors.green,
            );
          else if (cueVisible(ctx, api, 'second-row'))
            coreText(
              ctx,
              api,
              second
                ? `${maxima[0]} + ${maxima[1]} = ?`
                : 'Which token wins row two? What do the two winners add up to?',
              1260,
              873,
              30,
              themeColors.yellow,
              'center',
            );
        }
      },
    );
  }
}
export default {
  id: 'late-maxsim',
  draw: drawLateMaxsim,
  cues: [
    'token-storage',
    'row-maxima',
    'maxsim-vectors',
    'maxsim-first',
    'second-row',
    'maxsim-second',
    'maxsim-sum',
    'reuse-token',
    'compression-scope',
    'centroid-pruning',
  ],
};
