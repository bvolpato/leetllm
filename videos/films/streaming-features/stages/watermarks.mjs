import { eventRoute } from '../arithmetic.mjs';
import { drawOriginalEquation, drawOriginalText, drawOriginalVisualFocus } from '../defaults.mjs';
export function drawWatermarks(ctx, scene, state, api) {
  return api.focus.target('watermarks-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    {
      const maxCue = state.cues?.['sf-watermarks-maximum'],
        maxProgress =
          currentBeat < 1
            ? 0
            : currentBeat > 1
              ? 1
              : !maxCue || maxCue.phase === 'before'
                ? 0
                : maxCue.phase === 'after'
                  ? 1
                  : maxCue.progress;
      const maxTime = api.lerp(11 * 60 + 20, 12 * 60 + 20, maxProgress);
      const delay = 15;
      const watermark = maxTime - delay;
      const recordTime = 11 * 60 + 5;
      const xOf = (minute) => 260 + ((minute - 10 * 60) / 180) * 1280;
      api.rect(ctx, xOf(660), 430, xOf(720) - xOf(660), 150, themeColors.blue + '18');
      api.line(ctx, 260, 520, 1540, 520, themeColors.muted, 4);
      for (const hour of [10, 11, 12, 13]) {
        const x = xOf(hour * 60);
        api.line(ctx, x, 495, x, 545, themeColors.muted, 2);
        drawOriginalText(
          ctx,
          api,
          `${String(hour).padStart(2, '0')}:00`,
          x,
          585,
          28,
          themeColors.muted,
        );
      }
      const shownMax = Math.round(maxTime),
        shownWatermark = shownMax - delay;
      const recordX = xOf(recordTime),
        endX = xOf(12 * 60),
        watermarkX = xOf(shownWatermark),
        maxX = xOf(shownMax);
      drawOriginalVisualFocus(ctx, api, 'watermarks-object-recordx-520-13-c-pink-28', () =>
        api.circle(ctx, recordX, 520, 13, themeColors.pink),
      );
      drawOriginalText(ctx, api, 'record 11:05', recordX, 650, 28, themeColors.pink);
      api.circle(ctx, maxX, 520, 12, themeColors.cyan);
      drawOriginalText(
        ctx,
        api,
        `max event ${Math.floor(shownMax / 60)}:${String(shownMax % 60).padStart(2, '0')}`,
        maxX,
        285,
        28,
        themeColors.cyan,
      );
      drawOriginalVisualFocus(ctx, api, 'watermark-current', () =>
        api.line(ctx, watermarkX, 390, watermarkX, 550, themeColors.yellow, 4),
      );
      drawOriginalText(
        ctx,
        api,
        currentBeat > 1 || state.cues?.['sf-watermarks-value']?.phase === 'after'
          ? `watermark ${Math.floor(shownWatermark / 60)}:${String(shownWatermark % 60).padStart(2, '0')}`
          : 'watermark boundary',
        watermarkX,
        365,
        28,
        themeColors.yellow,
      );
      const windowEnd = xOf(12 * 60 + 30);
      drawOriginalVisualFocus(ctx, api, 'watermark-window-limit', () =>
        api.line(ctx, endX, 640, windowEnd, 640, themeColors.green, 7),
      );
      drawOriginalText(
        ctx,
        api,
        '12:00 window end + 30 min allowance',
        (endX + windowEnd) / 2,
        710,
        29,
        themeColors.green,
      );
      drawOriginalEquation(ctx, api, String.raw`W=\max(e.t)-\Delta`, 570, 820, 48, themeColors.ink);
      const behind = Math.max(0, shownWatermark - recordTime),
        shownBehind = behind;
      drawOriginalVisualFocus(
        ctx,
        api,
        'watermarks-object-min-behind-watermark-replay-rule-35',
        () =>
          drawOriginalText(
            ctx,
            api,
            currentBeat === 2 && state.cues?.['watermarks-beat-3-focus-1']?.phase === 'after'
              ? `${shownBehind} min behind watermark · replay rule: ${eventRoute(recordTime, shownWatermark)}`
              : 'Separate record lag and window retention',
            1300,
            820,
            29,
            themeColors.pink,
          ),
      );
      drawOriginalVisualFocus(
        ctx,
        api,
        'watermarks-object-window-lateness-and-event-routing-have-separate-li-36',
        () =>
          drawOriginalText(
            ctx,
            api,
            'window lateness and event routing have separate limits',
            960,
            930,
            30,
            themeColors.muted,
          ),
      );
    }
  });
}
export default {
  id: 'watermarks',
  draw: drawWatermarks,
  cues: [
    'watermarks-beat-1-focus-1',
    'watermarks-beat-2-focus-1',
    'sf-watermarks-maximum',
    'sf-watermarks-value',
    'watermarks-beat-3-focus-1',
    'watermarks-beat-3-focus-2',
    'sf-watermarks-lag',
  ],
};
