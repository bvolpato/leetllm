import { timedForecastScene } from '../construction.mjs';
import { friday } from '../friday-chart.mjs';
import { text } from '../defaults.mjs';

function calendarHeader(ctx, api, x, date, color) {
  const { C } = api;
  api.rect(ctx, x - 276, 264, 552, 106, color, undefined, 10);
  for (const dx of [-200, 200]) {
    api.circle(ctx, x + dx, 287, 12, C.bg);
    api.line(ctx, x + dx, 243, x + dx, 287, C.ink, 8);
  }
  text(ctx, api, date, x, 345, 50, C.bg);
}

const scene = timedForecastScene('intro', (ctx, api, clock, state) => {
  const { C } = api;
  const t = state.t ?? 0;
  const left = 438;
  const right = 1482;
  const transferY = 470;
  const tileHalfWidth = 114;
  const departure = 0.12 + 0.18 * Math.min(1, t / 0.6);
  const travel = api.lerp(departure, 1, clock.progress('copy'));
  const band = clock.progress('band');
  const observed = clock.after('observed');
  const gap = clock.after('gap');
  const review = clock.after('review');
  if (t < 0.35) ctx.globalAlpha = 1;
  api.focus.target('friday-chart', () => {
    api.rect(ctx, left - 276, 264, right - left + 552, 354, C.panel, C.muted, 12);
    api.line(ctx, left + tileHalfWidth, transferY, right - tileHalfWidth, transferY, C.muted, 2);
    calendarHeader(ctx, api, left, 'Friday 23 Jan', C.cyan);
    calendarHeader(ctx, api, right, 'Friday 30 Jan', C.blue);
    text(ctx, api, friday.forecast, left, 515, 108, C.cyan);
    text(ctx, api, 'batch jobs observed', left, 580, 31, C.ink);
    text(ctx, api, 'forecast issued Thu 29 Jan', right, 580, 31, C.ink);
    if (travel < 0.66) text(ctx, api, '?', right, 515, 92, C.muted);

    const px = api.lerp(left + 225, right, travel);
    const py = transferY - 18 * Math.sin(Math.PI * travel);
    api.rect(ctx, px - tileHalfWidth, py - 66, 2 * tileHalfWidth, 130, C.bg, C.blue, 14);
    text(ctx, api, friday.forecast, px, py + 34, 92, C.blue);

    if (!band) return;
    const center = 551;
    const scale = 38;
    const half = (friday.high - friday.forecast) * scale;
    const x = (jobs) => center + scale * (jobs - friday.forecast);
    const y = 770;
    api.line(ctx, 270, y, 1725, y, C.muted, 2);
    api.rect(ctx, center - half * band, y - 17, 2 * half * band, 34, C.blue, undefined, 3);
    api.circle(ctx, center, y, 13, C.bg, C.blue, 4);
    text(ctx, api, 'Forecast  ' + friday.forecast, center, y - 49, 37, C.blue);
    if (clock.after('band')) {
      for (const jobs of [friday.low, friday.high]) {
        api.line(ctx, x(jobs), y - 26, x(jobs), y + 27, C.blue, 3);
        text(ctx, api, jobs, x(jobs), y + 69, 32, C.blue);
      }
    }
    if (observed) {
      const actualX = x(friday.observed);
      api.circle(ctx, actualX, y, 15, C.pink);
      text(ctx, api, 'Observed  ' + friday.observed, actualX, y - 49, 37, C.pink);
      if (gap) {
        api.line(ctx, center, y, actualX, y, C.yellow, 3);
        for (const end of [center, actualX]) api.line(ctx, end, y - 10, end, y + 10, C.yellow, 3);
        text(ctx, api, '+' + friday.error + ' jobs', (center + actualX) / 2, y - 26, 46, C.yellow);
      }
    }
  });
  api.focus.target('friday-action', () => {
    let prompt = 'Will this Friday run more jobs than last Friday?';
    if (band) prompt = 'Where will Friday’s count land?';
    if (observed) prompt = 'Does the count cross the band? How far above forecast?';
    if (gap) prompt = friday.observed + ' − ' + friday.forecast + ' = ' + friday.error + ' jobs';
    if (review) prompt = 'Review the job IDs and check available capacity.';
    text(ctx, api, prompt, 960, band ? 955 : 803, 42, review ? C.yellow : C.ink);
  });
});

export const drawIntro = scene.draw;
export default scene;
