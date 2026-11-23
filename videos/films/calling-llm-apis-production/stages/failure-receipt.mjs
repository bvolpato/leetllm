import { apiChapterState } from '../construction.mjs';
import { footer, heading, panel, travel } from '../defaults.mjs';
export function drawFailureReceipt(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    modelState = apiChapterState('failure-receipt', state),
    u = modelState.p,
    done = modelState.settled;
  {
    heading(ctx, api, 'One task receipt survives every exit');
    const names =
      currentBeat === 1
        ? ['known account', 'provider contradiction', 'validation raises', 'finally: failed']
        : currentBeat === 2
          ? ['pending task', 'attempt timeout', 'usage unknown', 'named failure']
          : ['start: failed', 'lookup facts', 'provider stub', 'validate → okay'];
    names.forEach((v, i) =>
      panel(
        ctx,
        api,
        v,
        180 + i * 430,
        410,
        370,
        100,
        i === 3
          ? done && currentBeat === 0
            ? themeColors.green
            : themeColors.pink
          : themeColors.blue,
        25,
      ),
    );
    travel(
      ctx,
      api,
      'T-17',
      {
        x: 270,
        y: 620,
      },
      {
        x: 1560,
        y: 620,
      },
      u,
      themeColors.cyan,
      160,
    );
    if (currentBeat === 0) {
      panel(ctx, api, 'fake clock\n0.00 → 0.05 ms', 440, 790, 1040, 125, themeColors.yellow, 31);
    } else if (currentBeat === 1) {
      panel(ctx, api, 'unknown account → lookup raises', 250, 780, 940, 100, themeColors.pink, 29);
      panel(
        ctx,
        api,
        done ? 'Provider calls: 1' : 'Provider calls: ?',
        1270,
        780,
        400,
        100,
        themeColors.yellow,
        28,
      );
    } else {
      panel(
        ctx,
        api,
        'Attempt A: timeout\nusage: unknown',
        250,
        755,
        620,
        145,
        themeColors.pink,
        30,
      );
      panel(
        ctx,
        api,
        'Task: named failure\nno invented policy result',
        1050,
        755,
        620,
        145,
        themeColors.yellow,
        28,
      );
      footer(ctx, api, 'HTTP, attempt and task outcomes remain distinct');
    }
  }
}
export default {
  id: 'failure-receipt',
  draw: drawFailureReceipt,
  cues: ['ap-failure-receipt-0', 'ap-failure-receipt-1', 'ap-failure-receipt-2'],
};
