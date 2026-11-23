import { vectorLane } from '../arithmetic.mjs';
import {
  after,
  arrow,
  codeText,
  detailText,
  focusTarget,
  footer,
  line,
  visible,
} from '../defaults.mjs';
export function drawCapturedNative(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    focusTarget(ctx, api, 'native-build-labels', () => {
      detailText(
        ctx,
        api,
        'Actual build · CUDA 13.2.78 · RTX 5070 Ti · compute 12.0',
        150,
        275,
        28,
        themeColors.cyan,
      );
      codeText(
        ctx,
        api,
        'native sm_120   |   standalone PTX .version 9.2 / .target sm_90',
        150,
        325,
        26,
        themeColors.muted,
      );
    });
    if (currentBeat < 3) {
      focusTarget(ctx, api, 'native-values', () => {
        const ready = [
          after(api, 'load-r4'),
          after(api, 'load-r4'),
          after(api, 'add-r9'),
          after(api, 'store-r9'),
        ];
        detailText(ctx, api, 'index i = 1', 150, 415, 35, themeColors.yellow);
        codeText(ctx, api, 'x[1] = 0.25', 150, 485, 32, themeColors.blue);
        codeText(ctx, api, 'y[1] = −2', 150, 550, 32, themeColors.pink);
        if (currentBeat >= 1 && after(api, 'load-r4') && !visible(ctx, api, 'add-r9'))
          detailText(
            ctx,
            api,
            'Which register holds\nthe sum before the store?',
            150,
            660,
            29,
            themeColors.yellow,
          );
        const lane = vectorLane(1);
        const rows = [
          ['0110', 'LDG.E R4, [...]', 'R4', lane.x, themeColors.blue],
          ['0120', 'LDG.E R7, [...]', 'R7', lane.y, themeColors.pink],
          ['0140', 'FADD R9, R4, R7', 'R9', lane.sum, themeColors.green],
          ['0150', 'STG.E [...], R9', 'out[1]', lane.sum, themeColors.green],
        ];
        rows.forEach(([offset, instruction, name, value, color], i) => {
          const y = 410 + i * 120;
          codeText(ctx, api, offset, 590, y, 25, themeColors.muted);
          codeText(
            ctx,
            api,
            instruction,
            740,
            y,
            30,
            currentBeat >= 1 && ready[i] ? color : themeColors.muted,
          );
          if (currentBeat >= 1 && ready[i]) {
            arrow(ctx, api, 1200, y - 10, 1300, y - 10, color);
            detailText(ctx, api, `${name} = ${value}`, 1340, y, 34, color);
          }
        });
        if (currentBeat >= 1 && after(api, 'load-r4')) {
          line(ctx, api, 740, 920, 1710, 920, themeColors.green);
          detailText(
            ctx,
            api,
            'Predicate exits invalid indices before these accesses.',
            740,
            968,
            27,
            themeColors.muted,
          );
        }
      });
      footer(ctx, api, 'Actual native byte offsets and values belong to this one captured cubin.');
    } else {
      focusTarget(ctx, api, 'native-report', () => {
        detailText(ctx, api, 'ptxas allocation report', 150, 420, 35, themeColors.cyan);
        if (visible(ctx, api, 'resource-twelve')) {
          [
            ['Registers', 12],
            ['Stack bytes', 0],
            ['Spill loads / stores', '0 / 0'],
          ].forEach(([k, v], i) => {
            detailText(ctx, api, k, 160, 530 + i * 110, 30);
            detailText(ctx, api, v, 660, 530 + i * 110, 42, themeColors.yellow);
          });
        }
      });
      focusTarget(ctx, api, 'native-fixtures', () => {
        if (visible(ctx, api, 'shape-fixtures')) {
          detailText(ctx, api, 'Actual native CUDA fixtures', 1050, 420, 32, themeColors.green);
          [1, 255, 256, 257, 1000].forEach((n, i) => {
            codeText(
              ctx,
              api,
              `n=${String(n).padEnd(4)}  PASS`,
              1080,
              510 + i * 62,
              30,
              themeColors.green,
            );
          });
          detailText(ctx, api, 'memcheck: 0 errors', 1080, 860, 29, themeColors.green);
        }
      });
      footer(ctx, api, 'A skipped write leaves NaN in the output slot.');
    }
  }
}
export default {
  id: 'captured-native',
  draw: drawCapturedNative,
  cues: [
    'capture-labels',
    'capture-inputs',
    'load-r4',
    'add-r9',
    'store-r9',
    'resource-twelve',
    'shape-fixtures',
  ],
};
