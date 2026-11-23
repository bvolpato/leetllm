import { availableHistory } from '../model.mjs';
import { detailText, heading, line, tile } from '../defaults.mjs';
export function drawAsOfHistory(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z);
  {
    const h = availableHistory();
    if (currentBeat <= 2) {
      const start = Date.parse('2026-06-29T00:00:00Z');
      const end = Date.parse('2026-07-01T16:00:00Z');
      const xOf = (time) => 250 + (1420 * (time - start)) / (end - start);
      const stamp = (time) => {
        const iso = new Date(time).toISOString();
        const month = iso.slice(5, 7) === '06' ? 'June' : 'July';
        return month + ' ' + Number(iso.slice(8, 10)) + ' · ' + iso.slice(11, 19);
      };
      const cutoff = xOf(h.decision);
      detailText(ctx, api, 'Seven-day count · July 1 at 00:05 UTC', 135, 257, 39, themeColors.ink);
      line(ctx, api, cutoff, 340, cutoff, 850, themeColors.yellow, 4);
      detailText(ctx, api, 'Decision', cutoff, 307, 32, themeColors.yellow, 'center');
      const travel =
        currentBeat === 0 ? 0 : currentBeat === 1 ? api.phase(progress, 0.05, 0.48) : 1;
      h.events.forEach((event, i) => {
        const y = 431 + 180 * i;
        const x = xOf(event.event);
        const observedX = api.lerp(x, xOf(event.observed), travel);
        detailText(ctx, api, event.id, 150, y + 9, 34, themeColors.muted);
        detailText(ctx, api, stamp(event.event), x, y - 38, 30, themeColors.blue, 'right');
        api.circle(ctx, x, y, 14, themeColors.blue);
        if (currentBeat > 0) {
          if (observedX > x + 34)
            line(ctx, api, x + 18, y, observedX - 16, y, themeColors.muted, 3);
          api.circle(ctx, observedX, y, 8, themeColors.ink);
          if (travel === 1) {
            detailText(
              ctx,
              api,
              'Readable ' + stamp(event.observed),
              observedX,
              y + 59,
              29,
              themeColors.ink,
              'center',
            );
          }
        }
      });
      const summary =
        currentBeat === 0
          ? h.naive + ' events in the window'
          : currentBeat === 1
            ? 'How many events could the router count at 00:05?'
            : h.naive + ' events in the window     /     ' + h.ready + ' readable at the decision';
      detailText(ctx, api, summary, 960, 980, 43, themeColors.yellow, 'center');
    }
    if (currentBeat === 3) {
      heading(ctx, api, 'A previously active user can have an unready training label');
      tile(ctx, api, 'June request: user u2', 280, 400, 570, 100, themeColors.blue);
      tile(ctx, api, 'August label: user u2', 1080, 400, 570, 100, themeColors.pink);
      line(ctx, api, 960, 330, 960, 870, themeColors.yellow, 4);
      detailText(ctx, api, 'July 1 fit cutoff', 960, 300, 30, themeColors.yellow, 'center');
      detailText(ctx, api, 'Features/history known', 560, 700, 32, themeColors.blue, 'center');
      detailText(
        ctx,
        api,
        'Label excluded from July fit',
        1360,
        700,
        32,
        themeColors.pink,
        'center',
      );
      if (cueProgress() > 0.6)
        detailText(
          ctx,
          api,
          'A new July request from u2 belongs to the returning-user slice',
          960,
          950,
          36,
          themeColors.yellow,
          'center',
        );
    }
    if (currentBeat === 4) {
      heading(ctx, api, 'A sample gap and an outcome interval answer different questions');
      const q = cueProgress();
      line(ctx, api, 270, 780, 1720, 780, themeColors.muted);
      [1, 2, 3, 20, 21, 22].forEach((d, i) => {
        api.circle(ctx, 380 + i * 210, 780, 12, themeColors.blue);
        detailText(ctx, api, 'day' + d, 380 + i * 210, 860, 27, themeColors.muted, 'center');
      });
      api.rect(ctx, 700, 440, 500 * q, 80, themeColors.pink);
      detailText(
        ctx,
        api,
        'Overlapping outcome interval',
        960,
        390,
        31,
        themeColors.pink,
        'center',
      );
      detailText(
        ctx,
        api,
        'Samples excluded ≠ calendar duration · neither checks label readiness',
        960,
        1000,
        34,
        themeColors.yellow,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'as-of-history',
  draw: drawAsOfHistory,
  cues: [],
};
