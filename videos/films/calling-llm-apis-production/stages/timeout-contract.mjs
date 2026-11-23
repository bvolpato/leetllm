import { phase } from '../arithmetic.mjs';
import { apiChapterState } from '../construction.mjs';
import { chapterText, footer, heading, panel, strokeLine } from '../defaults.mjs';
export function drawTimeoutContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    modelState = apiChapterState('timeout-contract', state),
    u = modelState.p,
    done = modelState.settled;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Transport timers cover different waits');
      const names = ['pool', 'connect', 'write', 'read chunk'],
        xs = [220, 550, 880, 1210];
      names.forEach((v, i) => {
        panel(ctx, api, v, xs[i], 420, 280, 100, i === 3 ? themeColors.cyan : themeColors.blue, 30);
        const q = phase(u, i * 0.2, i * 0.2 + 0.25);
        api.rect(ctx, xs[i], 650, 280 * q, 30, themeColors.cyan);
      });
      footer(ctx, api, 'DNS / TLS / proxy / reuse affect the actual connect path');
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Heartbeats satisfy reads while useful text stays absent');
      strokeLine(ctx, api, 300, 510, 1640, 510, themeColors.blue);
      strokeLine(ctx, api, 300, 760, 1640, 760, themeColors.pink);
      chapterText(ctx, api, 'read events', 260, 460, 25, themeColors.blue, 'right');
      chapterText(ctx, api, 'first visible text', 260, 710, 25, themeColors.pink, 'right');
      for (let i = 0; i < 6; i++)
        if (modelState.clock >= modelState.readEvents[i]) {
          api.circle(ctx, 340 + i * 210, 510, 10, themeColors.blue);
          chapterText(ctx, api, 'heartbeat', 340 + i * 210, 570, 20, themeColors.blue, 'center');
        }
      const nowX = 300 + 1340 * u;
      strokeLine(ctx, api, nowX, 605, nowX, 675, themeColors.yellow, 4);
      chapterText(
        ctx,
        api,
        'task clock ' + modelState.clock.toFixed(1) + ' s',
        960,
        955,
        26,
        themeColors.yellow,
        'center',
      );
      panel(ctx, api, 'No nonempty text delta', 490, 835, 940, 85, themeColors.pink, 30);
      footer(ctx, api, 'Task deadline keeps running across retrieval, waits and validation');
    } else {
      heading(ctx, api, 'The deadline starts cancellation');
      panel(ctx, api, 'wait_for: 1 ms', 230, 420, 610, 100, themeColors.yellow, 32);
      panel(ctx, api, 'stub sleep: 20 ms', 1080, 420, 610, 100, themeColors.blue, 32);
      strokeLine(ctx, api, 300, 690, 1620, 690, themeColors.muted);
      api.rect(ctx, 300, 650, 1320 * 0.05, 80, themeColors.yellow);
      if (u > 0.3)
        panel(
          ctx,
          api,
          'cancel requested\nawait cleanup',
          360 + 850 * phase(u, 0.3, 0.85),
          790,
          480,
          130,
          themeColors.pink,
          29,
        );
      footer(
        ctx,
        api,
        'The caller waits for cleanup. Check remote work with the provider.',
      );
    }
  }
}
export default {
  id: 'timeout-contract',
  draw: drawTimeoutContract,
  cues: ['ap-timeout-contract-0', 'ap-timeout-contract-1', 'ap-timeout-contract-2'],
};
