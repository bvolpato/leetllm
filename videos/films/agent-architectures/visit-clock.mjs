import { clock } from './arithmetic.mjs';
import { VISIT_HOURS } from './fixtures.mjs';

const pixelsPerMinute = 5.52;
export const clockX = (minutes) => 335 + (minutes - 14 * 60) * pixelsPerMinute;
export const timetableY = 725;

export function clockLimits(ctx, api, schedule, top = 630) {
  const { C } = api;
  for (const [t, label, color] of [
    [schedule.deadline, 'Your deadline', C.yellow],
    [VISIT_HOURS.closes, 'Museum closes', C.muted],
  ]) {
    api.text(ctx, label, clockX(t), top - 65, 27, color, 'center');
    api.text(ctx, clock(t), clockX(t), top - 21, 35, color, 'center', 'mono');
    api.line(ctx, clockX(t), top, clockX(t), timetableY + 30, color, 3);
  }
}

export function timeStrip(ctx, api, y) {
  api.line(ctx, clockX(840), y, clockX(VISIT_HOURS.closes) + 42, y, api.C.muted, 3);
}

export function durationBar(ctx, api, start, minutes, y, color, height = 44) {
  if (minutes > 0)
    api.rect(
      ctx,
      clockX(start),
      y - height / 2,
      minutes * pixelsPerMinute,
      height,
      color,
      undefined,
      3,
    );
}

export function markTime(ctx, api, minute, y, label, color, above = false) {
  const x = clockX(minute);
  api.line(ctx, x, y - 27, x, y + 27, color, 4);
  api.text(ctx, label, x, y + (above ? -45 : 82), 30, color, 'center');
}
