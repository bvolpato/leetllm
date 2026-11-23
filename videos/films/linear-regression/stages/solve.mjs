import { clamp } from '../arithmetic.mjs';
import { data } from '../fixtures.mjs';
import { directed } from '../construction.mjs';
import { predict } from '../model.mjs';
import { box, equation, target, text } from '../defaults.mjs';
export function drawSolve(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  {
    if (currentBeat === 0) {
      const count = Math.min(5, Math.floor(directed(state, 'solve-rows', 0.15, 0.8) * 5) + 1);
      text(ctx, api, 'ones', 410, 295, 30, themeColors.blue, 'center');
      text(ctx, api, 'input', 650, 295, 30, themeColors.cyan, 'center');
      text(ctx, api, 'prediction', 1370, 295, 30, themeColors.green, 'center');
      data.forEach((row, i) => {
        const y = 355 + i * 115;
        box(ctx, api, 330, y, 160, 85, themeColors.blue);
        box(ctx, api, 570, y, 160, 85, themeColors.cyan);
        equation(ctx, api, '1', 410, y + 58, 40, themeColors.ink, 'center');
        equation(ctx, api, String(row.x), 650, y + 58, 40, themeColors.ink, 'center');
        target(ctx, api, 'design-predictions', () => {
          box(ctx, api, 1230, y, 280, 85, i < count ? themeColors.green : themeColors.muted);
          if (i < count) {
            equation(
              ctx,
              api,
              String(predict(row.x)),
              1370,
              y + 58,
              40,
              themeColors.green,
              'center',
            );
            api.arrow(ctx, 1080, y + 42, 1200, y + 42, themeColors.green, 4);
          }
        });
      });
      equation(
        ctx,
        api,
        '\\times\\begin{bmatrix}100\\\\20\\end{bmatrix}',
        920,
        640,
        49,
        themeColors.ink,
        'center',
      );
    } else if (currentBeat === 1) {
      const project = directed(state, 'solve-project', 0.15, 0.45),
        balance = directed(state, 'solve-balances', 0.5, 0.8),
        O = {
          x: 300,
          y: 775,
        },
        P = {
          x: 950,
          y: 775,
        },
        Y = {
          x: 950,
          y: 390,
        };
      text(ctx, api, '2D slice through ŷ and e', 680, 285, 32, themeColors.muted, 'center');
      text(
        ctx,
        api,
        'directions shown; residual length magnified',
        680,
        330,
        24,
        themeColors.muted,
        'center',
      );
      api.path(
        ctx,
        [
          {
            x: 220,
            y: 775,
          },
          {
            x: 1080,
            y: 775,
          },
        ],
        {
          color: themeColors.muted,
          width: 2,
        },
      );
      text(ctx, api, 'slice of col(X)', 700, 850, 29, themeColors.muted, 'center');
      target(ctx, api, 'projection-vectors', () => {
        api.arrow(ctx, O.x, O.y, Y.x, Y.y, themeColors.yellow, 6);
        text(ctx, api, 'target y', Y.x + 25, Y.y, 32, themeColors.yellow);
        const end = {
          x: api.lerp(Y.x, P.x, project),
          y: api.lerp(Y.y, P.y, project),
        };
        api.path(ctx, [Y, end], {
          color: themeColors.pink,
          width: 5,
        });
        api.arrow(ctx, O.x, O.y, O.x + (P.x - O.x) * project, P.y, themeColors.green, 7);
        if (project === 1) {
          api.arrow(ctx, P.x, P.y, Y.x, Y.y, themeColors.pink, 6);
          api.path(
            ctx,
            [
              {
                x: P.x - 28,
                y: P.y,
              },
              {
                x: P.x - 28,
                y: P.y - 28,
              },
              {
                x: P.x,
                y: P.y - 28,
              },
            ],
            {
              color: themeColors.ink,
              width: 3,
            },
          );
          text(ctx, api, 'fitted ŷ', 610, 740, 32, themeColors.green);
          text(ctx, api, 'residual e', 980, 605, 32, themeColors.pink);
        }
      });
      target(ctx, api, 'projection-balances', () => {
        text(ctx, api, 'Full 5D check', 1480, 390, 32, themeColors.ink, 'center');
        const e = data.map((row) => row.y - predict(row.x)),
          weighted = e.map((v, i) => v * data[i].x);
        if (balance > 0) {
          text(ctx, api, 'ones · residual', 1480, 480, 28, themeColors.blue, 'center');
          equation(
            ctx,
            api,
            `[${e.join(',')}]\\cdot\\mathbf1=0`,
            1480,
            550,
            33,
            themeColors.blue,
            'center',
          );
        }
        if (balance === 1) {
          text(ctx, api, 'input · residual', 1480, 665, 28, themeColors.cyan, 'center');
          equation(
            ctx,
            api,
            `${weighted.map((v) => (v < 0 ? '(' + v + ')' : v)).join('+')}=0`,
            1480,
            735,
            33,
            themeColors.cyan,
            'center',
          );
          equation(ctx, api, 'X^Te=0', 1480, 880, 47, themeColors.green, 'center');
        }
      });
    } else {
      const swap = directed(state, 'solve-duplicate', 0.2, 0.7),
        z = Math.round(8 * swap * 10) / 10,
        a = 20 - 2 * z;
      text(ctx, api, 'one input column duplicated', 960, 300, 34, themeColors.muted, 'center');
      target(ctx, api, 'duplicate-weights', () => {
        equation(
          ctx,
          api,
          `100+${a.toFixed(1)}x+${z.toFixed(1)}(2x)`,
          960,
          470,
          64,
          themeColors.yellow,
          'center',
        );
        equation(ctx, api, '=100+20x', 960, 620, 58, themeColors.green, 'center');
      });
      data.forEach((row, i) => {
        const x = 330 + i * 315;
        box(ctx, api, x - 95, 760, 190, 100, themeColors.green);
        text(ctx, api, String(predict(row.x)), x, 827, 42, themeColors.ink, 'center');
      });
      text(ctx, api, 'Every prediction stays fixed.', 960, 975, 33, themeColors.muted, 'center');
    }
  }
}
export default {
  id: 'solve',
  draw: drawSolve,
  cues: ['solve-rows', 'solve-project', 'solve-balances', 'solve-duplicate'],
};
