import { exclusive } from '../arithmetic.mjs';
import { ARTICLE_INPUT } from '../fixtures.mjs';
import { signed } from '../score-trace.mjs';
import {
  drawExtendedArrow,
  drawExtendedBox,
  drawExtendedLine,
  drawExtendedTarget,
  drawExtendedText,
  drawExtendedTitle,
} from '../defaults.mjs';
export function drawLibraryBaseline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const q = (id, a = 0.12, z = 0.8) => {
    const v = state.cues?.[id];
    return v
      ? v.phase === 'before'
        ? 0
        : v.phase === 'after'
          ? 1
          : api.clamp(v.progress)
      : api.phase(progress, a, z);
  };
  const started = (id, a = 0.2) => q(id, a, a + 0.01) > 0;
  {
    if (currentBeat === 0) {
      drawExtendedTitle(ctx, api, 'Select whole-array or in-kernel cooperative output');
      drawExtendedTarget(ctx, api, 'library-types', () => {
        drawExtendedBox(
          ctx,
          api,
          'DeviceReduce / DeviceScan',
          160,
          380,
          720,
          100,
          themeColors.blue,
          35,
        );
        drawExtendedBox(
          ctx,
          api,
          'BlockReduce / BlockScan',
          1040,
          380,
          720,
          100,
          themeColors.cyan,
          35,
        );
        drawExtendedText(ctx, api, 'Whole-array result', 520, 555, 31, themeColors.blue);
        drawExtendedText(ctx, api, 'Inside a custom kernel', 1400, 555, 31, themeColors.cyan);
        const widen = q('library-baseline-step-1', 0.65, 0.95);
        drawExtendedBox(ctx, api, 'int32 loaded value', 180, 705, 480, 90, themeColors.blue, 34);
        drawExtendedBox(
          ctx,
          api,
          widen >= 1 ? 'int64 intermediate' : 'Widen before combine',
          1050,
          705,
          640,
          90,
          themeColors.yellow,
          34,
        );
        drawExtendedArrow(ctx, api, 695, 750, 1010, 750, themeColors.yellow);
      });
    } else if (currentBeat === 1) {
      drawExtendedTitle(ctx, api, 'Scratch lifetime spans the asynchronous operation');
      drawExtendedTarget(ctx, api, 'library-storage', () => {
        const qv = q('library-baseline-step-2', 0.1, 0.4),
          finish = started('library-finish', 0.65);
        ['Query bytes', 'Allocate scratch', 'Execute', 'Stream complete'].forEach((v, i) =>
          drawExtendedBox(
            ctx,
            api,
            v,
            180 + i * 440,
            415,
            360,
            90,
            i === 3 && finish ? themeColors.green : themeColors.blue,
            29,
          ),
        );
        drawExtendedLine(ctx, api, 360, 660, 1680, 660, themeColors.muted);
        api.rect(ctx, 620, 700, finish ? 1050 : 600 + 400 * qv, 80, themeColors.cyan);
        drawExtendedText(ctx, api, 'Scratch remains alive', 1140, 840, 34, themeColors.cyan);
        drawExtendedText(
          ctx,
          api,
          'Reuse outside timed repetitions · environment APIs may manage storage',
          960,
          960,
          30,
          themeColors.yellow,
        );
      });
    } else {
      const lane = 2;
      const slot = exclusive(ARTICLE_INPUT.map((play) => Number(play > 0)))[lane];
      const play = signed(ARTICLE_INPUT[lane]);
      drawExtendedTitle(ctx, api, 'Packing positive plays');
      drawExtendedTarget(ctx, api, 'library-fusion', () => {
        const fused = started('library-fused', 0.35);
        [
          ['CUB scan + pack', themeColors.blue],
          ['Fused kernel', themeColors.cyan],
        ].forEach(([name, col], i) => {
          if (i === 1 && !fused) return;
          const y = 435 + i * 290;
          drawExtendedText(ctx, api, name, 290, y + 58, 37, col);
          drawExtendedBox(ctx, api, 'Scan flags', 550, y, 265, 87, col, 35);
          drawExtendedArrow(ctx, api, 839, y + 43, 922, y + 43, col);
          drawExtendedBox(ctx, api, 'Slot ' + slot, 946, y, 270, 87, col, 40);
          drawExtendedArrow(ctx, api, 1240, y + 43, 1323, y + 43, col);
          drawExtendedBox(ctx, api, 'out[' + slot + '] = ' + play, 1346, y, 365, 87, col, 40);
          drawExtendedText(
            ctx,
            api,
            i === 0 ? 'Write and reread in memory' : 'Keep in a register',
            1081,
            y + 159,
            33,
            col,
          );
        });
      });
    }
    return;
  }
  return;
}
export default {
  id: 'library-baseline',
  draw: drawLibraryBaseline,
  cues: [
    'library-baseline-step-1',
    'library-block',
    'library-baseline-step-2',
    'library-finish',
    'library-baseline-step-3',
    'library-fused',
  ],
};
