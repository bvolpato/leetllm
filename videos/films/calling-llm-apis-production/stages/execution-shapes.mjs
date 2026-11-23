import { phase } from '../arithmetic.mjs';
import { apiChapterState } from '../construction.mjs';
import { footer, heading, panel } from '../defaults.mjs';
export function drawExecutionShapes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    modelState = apiChapterState('execution-shapes', state),
    u = modelState.p,
    done = modelState.settled;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Choose the lifetime the application can own');
      const labels = ['buffer one decision', 'stream provisional draft', 'durable background job'];
      labels.forEach((v, i) => {
        panel(
          ctx,
          api,
          v,
          210 + i * 560,
          405,
          490,
          130,
          [themeColors.blue, themeColors.cyan, themeColors.green][i],
          29,
        );
        for (let j = 0; j < 3; j++)
          if (u > (j + i) * 0.13)
            api.rect(
              ctx,
              250 + i * 560 + j * 120,
              690,
              80,
              70,
              [themeColors.blue, themeColors.cyan, themeColors.green][i],
            );
      });
      footer(
        ctx,
        api,
        'Prompt caching can accompany several shapes; it does not replace their state ownership',
      );
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Expired batch · match each result by custom_id');
      const left = [
          ['A', 'request 1'],
          ['B', 'request 2'],
          ['C', 'request 3'],
        ],
        right = [
          ['C', 'completed'],
          ['A', 'batch_expired'],
          ['B', 'completed'],
        ];
      left.forEach(([a, z], i) =>
        panel(ctx, api, a + ' · ' + z, 230, 420 + i * 150, 530, 100, themeColors.blue, 29),
      );
      right.forEach(([a, z], i) => {
        panel(
          ctx,
          api,
          a + ' · ' + z,
          1120,
          420 + i * 150,
          570,
          100,
          z === 'completed' ? themeColors.green : themeColors.pink,
          29,
        );
        const target = left.findIndex((r) => r[0] === a),
          segment = Math.min(2, Math.floor(u * 3));
        if (segment === i) {
          const q = phase(u * 3 - i, 0, 1);
          panel(
            ctx,
            api,
            a,
            810 + 190 * q,
            440 + 150 * target + (i - target) * 150 * q,
            85,
            60,
            themeColors.yellow,
            29,
          );
        }
      });
      footer(
        ctx,
        api,
        'Inspected service: 24-hour window / 50% discount; individual item outcomes remain separate',
      );
    } else {
      heading(ctx, api, 'Stable prefix helps reuse; live boundary still needs tests');
      panel(ctx, api, 'stable context prefix', 230, 410, 1460, 110, themeColors.blue, 32);
      panel(ctx, api, 'request A', 230, 660, 650, 100, themeColors.cyan, 31);
      panel(ctx, api, 'request B', 1040, 660, 650, 100, themeColors.green, 31);
      footer(
        ctx,
        api,
        'Auth · tenant access · rates · slow paths · cancellation · concurrency · real provider failures',
      );
    }
  }
}
export default {
  id: 'execution-shapes',
  draw: drawExecutionShapes,
  cues: ['ap-execution-shapes-0', 'ap-execution-shapes-1', 'ap-execution-shapes-2'],
};
