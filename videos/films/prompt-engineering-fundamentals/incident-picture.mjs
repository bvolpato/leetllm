import { chapterText } from './defaults.mjs';

const left = 250;
const right = 1660;
export function minuteRuler(ctx, api, y, maximum, ticks) {
  const x = (minute) => left + ((right - left) * minute) / maximum;
  api.line(ctx, left, y, right, y, api.C.muted, 4);
  for (const minute of ticks) {
    api.line(ctx, x(minute), y - 10, x(minute), y + 12, api.C.muted, 3);
    chapterText(ctx, api, minute, x(minute), y + 59, 32, api.C.ink, 'center');
  }
  return x;
}

export function markMinute(ctx, api, x, y, label, color, above = true) {
  const tip = above ? y - 80 : y + 90;
  api.line(ctx, x, y, x, tip, color, 5);
  api.circle(ctx, x, y, 8, color);
  chapterText(ctx, api, label, x, above ? tip - 18 : tip + 44, 36, color, 'center');
}

export function measure(ctx, api, from, to, y, color, label) {
  api.line(ctx, from, y, to, y, color, 6);
  for (const x of [from, to]) api.line(ctx, x, y - 13, x, y + 13, color, 4);
  if (label) chapterText(ctx, api, label, (from + to) / 2, y - 24, 39, color, 'center');
}

export function paperLine(ctx, api, label, value, y, color, valueTarget) {
  api.rect(ctx, 180, y, 1560, 98, api.C.panel, undefined, 8);
  api.rect(ctx, 180, y, 8, 98, color, undefined, 0);
  chapterText(ctx, api, label, 220, y + 61, 30, color);
  const drawValue = () => chapterText(ctx, api, value, 652, y + 63, 36, api.C.ink);
  if (valueTarget) api.focus.target(valueTarget, drawValue);
  else drawValue();
}
