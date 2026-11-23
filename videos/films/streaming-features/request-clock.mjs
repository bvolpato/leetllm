import { formatClock } from './arithmetic.mjs';

export function spoken(scene, state) {
  const cue = (name) => state.cues?.[`sf-${scene.id}-${name}`];
  return {
    started: (name) => ['during', 'after'].includes(cue(name)?.phase),
    finished: (name) => cue(name)?.phase === 'after',
    progress: (name) => cue(name)?.progress ?? 0,
  };
}

export function minuteScale(start, end, left = 345, right = 1750) {
  return (minute) => left + ((minute - start) / (end - start)) * (right - left);
}

export function requestLine(ctx, api, x, minute, top, bottom, labelGaps = []) {
  let start = top;
  for (const [low, high] of labelGaps) {
    if (low > start)
      api.line(ctx, x(minute), start, x(minute), Math.min(low, bottom), api.C.yellow, 4);
    start = Math.max(start, high);
    if (start >= bottom) break;
  }
  if (start < bottom) api.line(ctx, x(minute), start, x(minute), bottom, api.C.yellow, 4);
  api.text(ctx, `Request  ${formatClock(minute)}`, x(minute), top - 22, 33, api.C.yellow, 'center');
}

export const heartbeatLabelGaps = (rows) =>
  rows.flatMap((y) => [
    [y - 53, y - 11],
    [y + 66, y + 104],
  ]);
export const publicationLabelGaps = (y, gap) => [
  [y - 50, y - 9],
  [y + gap + 10, y + gap + 54],
  [y + 2 * gap + 10, y + 2 * gap + 54],
];

// A heartbeat keeps its worker timestamp as it travels to the readable store.
export function heartbeatTrace(
  ctx,
  api,
  { record, x, y, sent, transit, selected = false, rightLabels = false },
) {
  const { C } = api;
  api.text(ctx, record.id, 110, y + 27, 50, selected ? C.green : C.ink);
  api.line(ctx, 320, y + 25, 1780, y + 25, '#30333c', 2);
  if (!sent) return;
  const from = x(record.event);
  const to = x(record.available);
  const tip = from + (to - from) * transit;
  api.line(ctx, from, y, tip, y + 56 * transit, C.cyan, 6);
  api.circle(ctx, from, y, 10, C.cyan);
  const sentAlign = rightLabels ? 'left' : 'right';
  api.text(
    ctx,
    `sent ${formatClock(record.event)}`,
    from + (rightLabels ? 16 : -16),
    y - 15,
    32,
    C.cyan,
    sentAlign,
  );
  if (transit >= 1) {
    api.rect(ctx, to - 9, y + 47, 18, 18, C.blue, undefined, 2);
    const nearRight = to > 1550;
    api.text(
      ctx,
      `readable ${formatClock(record.available)}`,
      to + (nearRight ? -16 : 16),
      y + 96,
      32,
      C.blue,
      nearRight ? 'right' : 'left',
    );
  } else if (transit > 0) {
    api.circle(ctx, tip, y + 56 * transit, 8, C.cyan);
  }
}

export function receipt(ctx, api, { y, label, value, color = api.C.ink, font = 'sans' }) {
  api.line(ctx, 104, y - 51, 1808, y - 51, '#575961', 2);
  api.text(ctx, label, 110, y + 6, 34, api.C.muted);
  api.text(ctx, value, 1800, y + 8, 46, color, 'right', font);
}

export function publicationTrace(
  ctx,
  api,
  { x, cutoff, record, sent = true, ingestProgress, publishProgress, startY = 330, gap = 118 },
) {
  const { C } = api;
  const steps = [
    { label: 'Worker sent', time: record.event, color: C.cyan, progress: sent ? 1 : 0 },
    { label: 'Broker received', time: record.ingested, color: C.muted, progress: ingestProgress },
    { label: 'Store published', time: record.available, color: C.blue, progress: publishProgress },
  ];
  for (const [i, step] of steps.entries()) {
    const y = startY + gap * i;
    api.text(ctx, step.label, 105, y + 11, 30, step.color);
    api.line(ctx, 394, y, 1780, y, '#343740', 2);
    const end = x(step.time);
    if (i && step.progress > 0) {
      const start = x(steps[i - 1].time);
      const tip = start + (end - start) * step.progress;
      const tipY = y - gap + gap * step.progress;
      api.line(ctx, start, y - gap, tip, tipY, step.color, 5);
      if (step.progress < 1) api.circle(ctx, tip, tipY, 8, step.color);
    }
    if (step.progress < 1) continue;
    if (i === 2) api.rect(ctx, end - 10, y - 10, 20, 20, C.blue, undefined, 2);
    else api.circle(ctx, end, y, 10, step.color);
    const towardLeft = i === 1 || end > 1570 || (end < x(cutoff) && x(cutoff) - end < 180);
    api.text(
      ctx,
      formatClock(step.time),
      end + (towardLeft ? -18 : 18),
      y + (i ? 45 : -12),
      34,
      step.color,
      towardLeft ? 'right' : 'left',
    );
  }
}
