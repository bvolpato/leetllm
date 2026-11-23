import { badge, label, line } from './defaults.mjs';

export const eventX = [570, 1110, 1600];

export function ticketTimeline(ctx, api, replay) {
  const { C } = api;
  const headers = replay
    ? ['1   Pending', '2   Reviewer approves', '3   Approved']
    : ['Now', 'Reviewer approval', 'After approval'];
  headers.forEach((text, i) =>
    badge(api, ctx, text, eventX[i], 437, i === 1 ? C.yellow : C.ink, 33),
  );
  line(api, ctx, eventX[1], 461, eventX[1], 537, C.yellow, 3);
  line(api, ctx, eventX[1], 629, eventX[1], 704, C.yellow, 3);
}

export function answerTrack(ctx, api, { name, y, events, progress = 1, verdict }) {
  const { C } = api;
  label(api, ctx, name, 125, y + 14, 40, C.ink);
  line(api, ctx, eventX[0], y, eventX[2], y, C.muted, 3);
  if (progress > 0) {
    line(api, ctx, eventX[0], y, api.lerp(eventX[0], eventX[2], progress), y, C.blue, 6);
  }
  for (const [i, event] of events.entries()) {
    if (!event) continue;
    const x = eventX[i];
    api.circle(ctx, x, y, 13, event.color ?? C.blue, C.bg, 3);
    badge(api, ctx, event.text, x, y + 64, event.color ?? C.ink, 32);
  }
  if (verdict) label(api, ctx, verdict.text, 125, y + 61, 29, verdict.color);
}
