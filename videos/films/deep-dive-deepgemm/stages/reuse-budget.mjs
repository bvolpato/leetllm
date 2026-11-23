import { bounded } from '../arithmetic.mjs';
import { sampleDeepGemmChapter } from '../construction.mjs';
import { drawBox, drawLink, drawSubtitle, drawText } from '../defaults.mjs';
export function drawReuseBudget(ctx, scene, state, api) {
  return api.focus.target('reuse-budget-construction', () => {
    const { C: themeColors, components: components } = api,
      modelState = sampleDeepGemmChapter('reuse-budget', state),
      { b: currentBeat, g: teaching2 } = modelState;
    const done = (beat, index) => teaching2(beat, index) >= 1;
    {
      drawSubtitle(
        ctx,
        api,
        currentBeat === 0
          ? 'Eight scalar identities serve sixteen operand requests'
          : 'Reuse competes with a finite storage budget',
      );
      const A = [
          [1, 2],
          [0, -1],
        ],
        B = [
          [3, 4],
          [1, -1],
        ],
        values = [...A.flat(), ...B.flat()];
      const sources = values.map((v, i) =>
        drawBox(
          ctx,
          api,
          `${i < 4 ? 'A' : 'B'}${i % 4} = ${v}`,
          150,
          340 + i * 75,
          230,
          58,
          i < 4 ? themeColors.blue : themeColors.pink,
          26,
        ),
      );
      if (currentBeat === 0) {
        const p = teaching2(0, 3),
          count = Math.min(16, Math.floor(p * 16)),
          requests = Array.from(
            {
              length: 4,
            },
            (_, out) => [
              Math.floor(out / 2) * 2,
              Math.floor(out / 2) * 2 + 1,
              4 + (out % 2) * 2,
              5 + (out % 2) * 2,
            ],
          ).flat(),
          outputs = Array.from(
            {
              length: 4,
            },
            (_, i) =>
              drawBox(
                ctx,
                api,
                `D${Math.floor(i / 2)}${i % 2}${count >= (i + 1) * 4 ? ' = ' + [11, -1, -4, 1][i] : ''}`,
                1420,
                350 + i * 145,
                320,
                90,
                themeColors.green,
                35,
              ),
          );
        if (count > 0) {
          const i = Math.min(15, count - 1);
          drawLink(
            ctx,
            api,
            sources[requests[i]],
            outputs[Math.floor(i / 4)],
            bounded(p * 16 - i),
            requests[i] < 4 ? themeColors.blue : themeColors.pink,
          );
        }
        drawText(
          ctx,
          api,
          `Requests served: ${count} / 16`,
          830,
          350,
          37,
          themeColors.cyan,
          'center',
        );
        if (done(0, 4))
          drawText(
            ctx,
            api,
            'Only 8 distinct source values',
            830,
            940,
            33,
            themeColors.green,
            'center',
          );
      } else {
        const memory = drawBox(
          ctx,
          api,
          currentBeat === 1 ? 'Shared tile · staged operands' : 'Toy storage budget',
          1170,
          360,
          580,
          100,
          themeColors.cyan,
          35,
        );
        const copying = teaching2(currentBeat, 0);
        if (copying > 0 && copying < 1) {
          const i = Math.min(7, Math.floor(copying * 8)),
            source = sources[i],
            points = [
              {
                x: source.x + source.width + 16,
                y: source.y + source.height / 2,
              },
              {
                x: 1030,
                y: source.y + source.height / 2,
              },
              {
                x: 1030,
                y: 410,
              },
              {
                x: 1154,
                y: 410,
              },
            ];
          api.path(ctx, points, {
            color: i < 4 ? themeColors.blue : themeColors.pink,
            width: 3,
          });
          components.particle({
            points,
            progress: copying * 8 - i,
            radius: 6,
            fill: i < 4 ? themeColors.blue : themeColors.pink,
          });
        }
        const pressure = currentBeat === 1 ? teaching2(1, 3) : teaching2(2, 1),
          used = Math.floor(8 + pressure * 8);
        drawText(
          ctx,
          api,
          'Registers / shared storage',
          790,
          330,
          30,
          themeColors.yellow,
          'center',
        );
        for (let i = 0; i < 16; i++)
          api.rect(
            ctx,
            1160 + (i % 8) * 72,
            660 + Math.floor(i / 8) * 82,
            60,
            60,
            i < used ? (i < 12 ? themeColors.cyan : themeColors.pink) : themeColors.panel,
            themeColors.muted,
            3,
          );
        if (used > 12) {
          const spill = drawBox(
            ctx,
            api,
            'Off-chip local memory',
            1140,
            875,
            610,
            90,
            themeColors.pink,
          );
          const points = [
            {
              x: 1766,
              y: 410,
            },
            {
              x: 1825,
              y: 410,
            },
            {
              x: 1825,
              y: 920,
            },
            {
              x: 1766,
              y: 920,
            },
          ];
          api.path(ctx, points, {
            color: themeColors.pink,
            width: 3,
          });
          components.particle({
            points,
            progress: teaching2(currentBeat, currentBeat === 1 ? 4 : 2),
            radius: 6,
            fill: themeColors.pink,
          });
        }
        drawText(
          ctx,
          api,
          currentBeat === 1
            ? 'Larger tile: reuse and pressure grow together'
            : 'Higher occupancy alone selects no winner',
          790,
          950,
          30,
          themeColors.yellow,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'reuse-budget',
  draw: drawReuseBudget,
  cues: [
    'reuse-budget-b0',
    'dg-reuse-budget-0-0',
    'dg-reuse-budget-0-1',
    'dg-reuse-budget-0-2',
    'dg-reuse-budget-0-3',
    'dg-reuse-budget-0-4',
    'dg-reuse-budget-0-5',
    'reuse-budget-b1',
    'dg-reuse-budget-1-0',
    'dg-reuse-budget-1-1',
    'dg-reuse-budget-1-2',
    'dg-reuse-budget-1-3',
    'dg-reuse-budget-1-4',
    'reuse-budget-b2',
    'dg-reuse-budget-2-0',
    'dg-reuse-budget-2-1',
    'dg-reuse-budget-2-2',
    'dg-reuse-budget-2-3',
  ],
};
