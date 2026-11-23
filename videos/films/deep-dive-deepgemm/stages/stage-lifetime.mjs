import { sampleDeepGemmChapter } from '../construction.mjs';
import {
  drawBox,
  drawEquation,
  drawGrid,
  drawLink,
  drawSubtitle,
  drawText,
} from '../defaults.mjs';
export function drawStageLifetime(ctx, scene, state, api) {
  return api.focus.target('stage-lifetime-construction', () => {
    const { C: themeColors, components: components } = api,
      modelState = sampleDeepGemmChapter('stage-lifetime', state),
      { b: currentBeat, g: teaching2 } = modelState;
    const done = (beat, index) => teaching2(beat, index) >= 1;
    {
      if (currentBeat === 0) {
        drawSubtitle(ctx, api, 'A logical coordinate follows its actual element strides');
        drawGrid(
          ctx,
          api,
          Array.from(
            {
              length: 3,
            },
            (_, r) =>
              Array.from(
                {
                  length: 4,
                },
                (_, col) => r * 8 + col * 2,
              ),
          ),
          170,
          365,
          800,
          420,
          themeColors.blue,
          34,
          [
            {
              row: 1,
              column: 3,
              fill: themeColors.panel,
              stroke: themeColors.yellow,
            },
          ],
        );
        drawText(
          ctx,
          api,
          'View [3, 4] · strides [8, 2]',
          570,
          850,
          31,
          themeColors.blue,
          'center',
        );
        drawEquation(ctx, api, '(1,3)\\mapsto1\\cdot8+3\\cdot2', 1390, 445, 41);
        if (done(0, 2))
          drawText(ctx, api, 'Actual offset 14', 1380, 610, 46, themeColors.green, 'center');
        if (done(0, 3)) {
          drawText(
            ctx,
            api,
            'Packed assumption → offset 7',
            1380,
            735,
            34,
            themeColors.pink,
            'center',
          );
          api.arrow(ctx, 1000, 590, 1130, 590, themeColors.green, 4);
        }
        if (teaching2(0, 5) > 0)
          drawBox(
            ctx,
            api,
            'Repair descriptor / materialize layout',
            1080,
            850,
            680,
            90,
            themeColors.green,
            30,
          );
      } else {
        drawSubtitle(ctx, api, 'Each storage handoff has its own completion');
        const p = currentBeat === 1 ? teaching2(1, 0) : 1,
          scale = currentBeat === 1 ? teaching2(1, 1) : 1,
          mma = currentBeat === 2 ? teaching2(2, 1) : 0;
        const src = drawBox(
            ctx,
            api,
            'Global tensor + descriptor',
            140,
            370,
            520,
            100,
            themeColors.blue,
            31,
          ),
          shared = drawBox(
            ctx,
            api,
            p >= 1 ? 'Shared operands · ready' : 'Shared operands · loading',
            760,
            370,
            500,
            100,
            p >= 1 ? themeColors.blue : themeColors.muted,
            30,
          ),
          acc = drawBox(
            ctx,
            api,
            mma >= 1 ? 'TMEM · complete' : 'TMEM · waiting',
            1370,
            370,
            410,
            100,
            mma >= 1 ? themeColors.green : themeColors.muted,
            27,
          );
        drawLink(ctx, api, src, shared, p, themeColors.blue);
        const s0 = drawBox(
            ctx,
            api,
            'Global block scales',
            140,
            610,
            520,
            100,
            themeColors.pink,
            31,
          ),
          s1 = drawBox(ctx, api, 'Shared scale stage', 760, 610, 500, 100, themeColors.pink, 30),
          s2 = drawBox(
            ctx,
            api,
            scale >= 1 ? 'TMEM scales · ready' : 'TMEM scales · pending',
            1370,
            610,
            410,
            100,
            scale >= 1 ? themeColors.pink : themeColors.muted,
            28,
          );
        drawLink(ctx, api, s0, s1, p, themeColors.pink);
        drawLink(ctx, api, s1, s2, scale, themeColors.pink);
        if (currentBeat === 2 && done(2, 0)) {
          drawLink(ctx, api, shared, acc, mma, themeColors.cyan);
          drawLink(ctx, api, s2, acc, mma, themeColors.pink);
        }
        const out = drawBox(
          ctx,
          api,
          mma >= 1 ? 'Output / slot released' : 'Output waits for accumulator',
          710,
          850,
          980,
          100,
          mma >= 1 ? themeColors.green : themeColors.muted,
          31,
        );
        if (mma >= 1) {
          const points = [
            {
              x: 1796,
              y: 420,
            },
            {
              x: 1830,
              y: 420,
            },
            {
              x: 1830,
              y: 900,
            },
            {
              x: 1706,
              y: 900,
            },
          ];
          api.path(ctx, points, {
            color: themeColors.green,
            width: 3,
          });
          components.particle({
            points,
            progress: teaching2(2, 2),
            radius: 6,
            fill: themeColors.green,
          });
        }
        drawText(ctx, api, 'Selected SM100 path', 150, 925, 28, themeColors.yellow);
      }
    }
  });
}
export default {
  id: 'stage-lifetime',
  draw: drawStageLifetime,
  cues: [
    'stage-lifetime-b0',
    'dg-stage-lifetime-0-0',
    'dg-stage-lifetime-0-1',
    'dg-stage-lifetime-0-2',
    'dg-stage-lifetime-0-3',
    'dg-stage-lifetime-0-4',
    'dg-stage-lifetime-0-5',
    'stage-lifetime-b1',
    'dg-stage-lifetime-1-0',
    'dg-stage-lifetime-1-1',
    'dg-stage-lifetime-1-2',
    'dg-stage-lifetime-1-3',
    'dg-stage-lifetime-1-4',
    'stage-lifetime-b2',
    'dg-stage-lifetime-2-0',
    'dg-stage-lifetime-2-1',
    'dg-stage-lifetime-2-2',
    'dg-stage-lifetime-2-3',
    'dg-stage-lifetime-2-4',
  ],
};
