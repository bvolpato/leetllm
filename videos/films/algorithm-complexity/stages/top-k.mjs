import { SCORES, TOP_TWO } from '../fixtures.mjs';
import { lerp, part, smooth } from '../construction.mjs';
import { heapSnapshot } from '../model.mjs';
import { arrow, box, focus, math, text } from '../defaults.mjs';
export function drawTopK(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    const s = heapSnapshot(state),
      root = {
        x: 1260,
        y: 400,
      },
      child = {
        x: 1260,
        y: 650,
      };
    focus(ctx, api, themeColors, 'heap-work', () => {
      if (beat < 2) {
        text(ctx, api, themeColors, 'Input-order scores', 455, 270, 34, themeColors.muted);
        SCORES.forEach((d, i) =>
          box(
            ctx,
            api,
            themeColors,
            d.name + ' · ' + d.score.toFixed(1),
            140,
            345 + i * 130,
            590,
            90,
            i < s.completed ? themeColors.green : themeColors.blue,
            32,
          ),
        );
        text(
          ctx,
          api,
          themeColors,
          'Weakest retained score at the root',
          1450,
          205,
          32,
          themeColors.yellow,
        );
        arrow(
          ctx,
          api,
          root.x + 190,
          root.y + 110,
          child.x + 190,
          child.y - 20,
          themeColors.muted,
          3,
        );
        const heap = s.heap;
        const scoreLabel = (d) => d.name + ' · ' + d.score.toFixed(1);
        let rootDoc = heap[0],
          childDoc = heap[1];
        box(ctx, api, themeColors, '', root.x, root.y, 380, 90, themeColors.yellow, 31);
        box(ctx, api, themeColors, '', child.x, child.y, 380, 90, themeColors.green, 31);
        if (s.first < 1) {
          rootDoc = undefined;
          childDoc = undefined;
          if (s.first > 0 && s.first < 0.2)
            box(
              ctx,
              api,
              themeColors,
              scoreLabel(SCORES[0]),
              lerp(960, 1450, smooth(s.first / 0.2)) - 190,
              400,
              380,
              90,
              themeColors.blue,
              28,
            );
          else if (s.first >= 0.2 && s.first <= 0.5)
            box(
              ctx,
              api,
              themeColors,
              scoreLabel(SCORES[0]),
              1260,
              400,
              380,
              90,
              themeColors.blue,
              28,
            );
          else if (s.first > 0.5) {
            let x = 1450,
              y = 445;
            if (s.first < 0.62) x = lerp(1450, 960, smooth(part(s.first, 0.5, 0.62)));
            else if (s.first < 0.74) {
              x = 960;
              y = lerp(445, 695, smooth(part(s.first, 0.62, 0.74)));
            } else {
              x = lerp(960, 1450, smooth(part(s.first, 0.74, 0.85)));
              y = 695;
            }
            box(
              ctx,
              api,
              themeColors,
              scoreLabel(SCORES[0]),
              x - 190,
              y - 45,
              380,
              90,
              themeColors.blue,
              28,
            );
            if (s.first > 0.65)
              box(
                ctx,
                api,
                themeColors,
                scoreLabel(SCORES[1]),
                1260,
                lerp(235, 400, smooth(part(s.first, 0.65, 1))),
                380,
                90,
                themeColors.yellow,
                28,
              );
          }
        }
        if (s.replace > 0 && s.replace < 1) {
          rootDoc = s.replace <= 0.5 ? SCORES[1] : undefined;
          childDoc = SCORES[0];
          if (s.replace > 0.5) {
            const p = part(s.replace, 0.5, 1),
              x = lerp(1450, 960, smooth(part(p, 0, 0.5))),
              y = lerp(445, 835, smooth(part(p, 0.5, 1)));
            box(
              ctx,
              api,
              themeColors,
              scoreLabel(SCORES[1]),
              x - 210,
              y - 45,
              420,
              90,
              themeColors.pink,
              26,
            );
          }
          const approach = part(s.replace, 0, 0.5),
            x = lerp(960, 1450, smooth(part(approach, 0.5, 1))),
            y =
              s.replace <= 0.5
                ? lerp(650, 280, smooth(part(approach, 0, 0.5)))
                : lerp(280, 445, smooth(part(s.replace, 0.5, 1)));
          box(
            ctx,
            api,
            themeColors,
            scoreLabel(SCORES[2]),
            x - 210,
            y - 45,
            420,
            90,
            themeColors.yellow,
            26,
          );
        }
        if (rootDoc)
          box(
            ctx,
            api,
            themeColors,
            rootDoc.name + ' · ' + rootDoc.score.toFixed(1),
            root.x,
            root.y,
            380,
            90,
            themeColors.yellow,
            28,
          );
        if (childDoc)
          box(
            ctx,
            api,
            themeColors,
            childDoc.name + ' · ' + childDoc.score.toFixed(1),
            child.x,
            child.y,
            380,
            90,
            themeColors.green,
            28,
          );
        if (s.reject > 0) {
          const p = smooth(s.reject);
          box(
            ctx,
            api,
            themeColors,
            scoreLabel(SCORES[3]),
            820,
            lerp(735, 855, p),
            350,
            85,
            themeColors.pink,
            26,
          );
        }
        text(
          ctx,
          api,
          themeColors,
          s.completed === 4
            ? 'Final winners: ' + TOP_TWO.map((d) => d.name).join(' + ')
            : s.replace > 0 && s.replace < 1
              ? 'Cutoff update in progress'
              : 'Current retained records',
          1260,
          1010,
          32,
          s.completed === 4 ? themeColors.green : themeColors.muted,
        );
      }
    });
    focus(ctx, api, themeColors, 'heap-path', () => {
      if (beat === 2) {
        text(ctx, api, themeColors, 'A repair follows one branch', 620, 270, 37);
        const points = [
          {
            x: 600,
            y: 385,
          },
          {
            x: 330,
            y: 550,
          },
          {
            x: 870,
            y: 550,
          },
          {
            x: 195,
            y: 735,
          },
          {
            x: 465,
            y: 735,
          },
          {
            x: 735,
            y: 735,
          },
          {
            x: 1005,
            y: 735,
          },
        ];
        for (let i = 1; i < points.length; i++) {
          const p = points[Math.floor((i - 1) / 2)],
            to = points[i];
          arrow(
            ctx,
            api,
            p.x,
            p.y + 46,
            to.x,
            to.y - 55,
            i === 2 || i === 6 ? themeColors.cyan : themeColors.muted,
            3,
          );
        }
        points.forEach((p, i) =>
          box(
            ctx,
            api,
            themeColors,
            String(i + 1),
            p.x - 75,
            p.y - 40,
            150,
            80,
            i === 0 || (i === 2 && s.path > 0.3) || (i === 6 && s.path > 0.7)
              ? themeColors.yellow
              : themeColors.blue,
            32,
          ),
        );
        if (s.path > 0) {
          const a = s.path <= 0.5 ? points[0] : points[2],
            z = s.path <= 0.5 ? points[2] : points[6],
            f = smooth((s.path % 0.5) * 2);
          arrow(
            ctx,
            api,
            a.x,
            a.y + 50,
            lerp(a.x, z.x, f),
            lerp(a.y + 50, z.y - 60, f),
            themeColors.yellow,
            6,
          );
        }
      }
    });
    focus(ctx, api, themeColors, 'heap-bill', () => {
      if (beat === 2) {
        math(
          ctx,
          api,
          themeColors,
          String.raw`T_{\mathrm{select}}=O(n\log k),\quad M_{\mathrm{heap}}=O(k)`,
          1430,
          450,
          35,
          themeColors.cyan,
        );
        text(ctx, api, themeColors, '2 ≤ k ≤ n', 1450, 525, 28, themeColors.muted);
        box(
          ctx,
          api,
          themeColors,
          '12 score products remain',
          1190,
          640,
          570,
          105,
          themeColors.yellow,
          33,
        );
        math(
          ctx,
          api,
          themeColors,
          String.raw`M_{\mathrm{input}}=\Theta(nd)`,
          1440,
          875,
          42,
          themeColors.blue,
        );
      }
    });
  }
}
export default {
  id: 'top-k',
  draw: drawTopK,
  cues: ['heap-first', 'heap-replace', 'heap-reject', 'heap-path', 'heap-bill'],
};
