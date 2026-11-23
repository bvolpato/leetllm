import { mae } from '../arithmetic.mjs';
import { folds, splitTestDays } from '../fixtures.mjs';
import { card, cueProgress, cueReveal, focus, text } from '../defaults.mjs';
export function drawTimeOrder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    const splitIntervals = Array.from(
      {
        length: 31,
      },
      (_, index) => {
        const day = index + 1,
          heldOut = splitTestDays.has(day);
        return {
          id: `jan-${day}`,
          lane: 'shuffled',
          start: day,
          end: day + 1,
          color: heldOut ? themeColors.pink : themeColors.blue,
          focusTarget:
            day === 31
              ? 'time-order-jan31-training'
              : day === 6
                ? 'time-order-jan6-heldout'
                : undefined,
        };
      },
    );
    const randomTimeline = focus(ctx, api, 'time-order-shuffled-split', () =>
      api.teaching.timeline({
        x: 200,
        y: 440,
        width: 1520,
        height: 190,
        domain: [1, 32],
        lanes: [
          {
            id: 'shuffled',
            label: 'Shuffled split',
          },
        ],
        intervals: splitIntervals,
        time: 32,
        ticks: [1, 6, 25, 31],
        formatTime: (day) => `Jan ${day}`,
        labelWidth: 205,
        fontSize: 22,
        color: themeColors.muted,
        cursorColor: themeColors.yellow,
        trackColor: themeColors.panel,
      }),
    );
    cueReveal(ctx, api, 'time-order-beat-1-jan6', currentBeat > 0, () => {
      const x = randomTimeline.point(6.5);
      text(ctx, api, 'Jan 6 · held out', x, 672, 24, themeColors.pink);
      api.line(ctx, x, 640, x, 650, themeColors.pink, 2);
    });
    cueReveal(ctx, api, 'time-order-beat-1-jan31', currentBeat > 0, () => {
      const x = randomTimeline.point(31.5);
      text(ctx, api, 'Jan 31 · training', x - 42, 672, 24, themeColors.blue, 'right');
      api.line(ctx, x, 640, x, 650, themeColors.blue, 2);
    });
    cueReveal(ctx, api, 'time-order-feature-availability', currentBeat > 1, () =>
      card(
        ctx,
        api,
        'Feature values stop at their availability time',
        375,
        695,
        themeColors.cyan,
        1170,
        58,
        1,
        'time-order-feature-availability',
      ),
    );
    const chronologyProgress = cueProgress(
      ctx,
      api,
      'time-order-rolling-origin',
      currentBeat > 2 ? 1 : 0,
    );
    cueReveal(ctx, api, 'time-order-chronological-split', currentBeat > 1, () =>
      api.teaching.timeline({
        x: 200,
        y: 765,
        width: 1520,
        height: 140,
        domain: [1, 32],
        lanes: [
          {
            id: 'chronological',
            label: 'Forecast origins',
          },
        ],
        time: 26.05 + 5.9 * chronologyProgress,
        intervals: [
          {
            id: 'train-through-25',
            lane: 'chronological',
            start: 1,
            end: 26,
            label: 'Train · Jan 1–25',
            color: themeColors.blue,
            focusTarget: 'time-order-chronological-split',
          },
          {
            id: 'test-26-31',
            lane: 'chronological',
            start: 26,
            end: 32,
            label: 'Test · Jan 26–31',
            color: themeColors.pink,
            focusTarget: 'time-order-test-window',
          },
        ],
        ticks: [1, 26, 31],
        formatTime: (day) => `Jan ${day}`,
        labelWidth: 205,
        fontSize: 21,
        color: themeColors.muted,
        cursorColor: themeColors.cyan,
        trackColor: themeColors.panel,
      }),
    );
    const earlierMae = Math.round(mae(folds[0]) * 10) / 10;
    const launchMae = Math.round(mae(folds[1]) * 10) / 10;
    cueReveal(ctx, api, 'time-order-earlier-mae-result', currentBeat > 2, () =>
      focus(ctx, api, 'time-order-earlier-mae', () =>
        api.teaching.valueChange({
          x: 310,
          y: 910,
          width: 570,
          height: 68,
          from: 0,
          to: earlierMae,
          progress: 1,
          label: 'Earlier week · MAE jobs',
          format: (value) => value.toFixed(1),
          fontSize: 28,
          showDelta: false,
          color: themeColors.cyan,
          restColor: themeColors.ink,
        }),
      ),
    );
    cueReveal(ctx, api, 'time-order-launch-mae-result', currentBeat > 2, () =>
      focus(ctx, api, 'time-order-launch-mae', () =>
        api.teaching.valueChange({
          x: 1040,
          y: 910,
          width: 570,
          height: 68,
          from: 0,
          to: launchMae,
          progress: 1,
          label: 'Launch week · MAE jobs',
          format: (value) => value.toFixed(1),
          fontSize: 28,
          showDelta: false,
          color: themeColors.pink,
          restColor: themeColors.ink,
        }),
      ),
    );
  }
}
export default {
  id: 'time-order',
  draw: drawTimeOrder,
  cues: [
    'time-order-shuffled-split',
    'time-order-beat-1-jan31',
    'time-order-beat-1-jan6',
    'time-order-beat-1-leak',
    'time-order-feature-availability',
    'time-order-chronological-split',
    'time-order-rolling-origin',
    'time-order-earlier-mae-result',
    'time-order-launch-mae-result',
  ],
};
