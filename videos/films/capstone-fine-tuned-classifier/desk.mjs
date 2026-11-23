import { operationProgress, resultAfter } from '../../lib/lesson-definition.mjs';
import { sampleNarrationCues } from '../../lib/narration-cues.mjs';
import { estimatedTimeline } from '../../lib/stage-lesson.mjs';
import { clamp01 } from './arithmetic.mjs';

const storyboardClocks = new WeakMap();

export function sceneClock(scene, state) {
  let { cues, t } = state;
  if (!cues) {
    if (!storyboardClocks.has(scene)) {
      storyboardClocks.set(scene, estimatedTimeline({ scenes: [scene] }).scenes[0]);
    }
    const timeline = storyboardClocks.get(scene);
    const beat = timeline.beats[state.beat ?? 0];
    t = beat.start + (state.beatP ?? 0) * (beat.until - beat.start);
    cues = sampleNarrationCues(timeline.visualCues, t);
  }
  const clock = { cues };
  return {
    progress: (id) => operationProgress(clock, id),
    after: (id) => resultAfter(clock, id),
    travelAfter: (id) => clamp01((t - cues[id].end) / 0.65),
  };
}

const ticketText = [
  ['“I’m asking again.', 'Where’s the key', 'rotation guide?”'],
  ['“Could you restore', 'my key during', 'the freeze?”'],
];

const ticketNames = { Freeze: 'Freeze request', 'Angry routine': 'Guide question' };

export function drawTicket(ctx, api, index, y, offset = 0) {
  const x = (index ? 997 : 135) + offset;
  const { C } = api;
  const seam = x + 142;
  const height = 236;
  api.path(
    ctx,
    [
      { x, y },
      { x: seam - 14, y },
      { x: seam, y: y + 14 },
      { x: seam + 14, y },
      { x: x + 785, y },
      { x: x + 785, y: y + height },
      { x: seam + 14, y: y + height },
      { x: seam, y: y + height - 14 },
      { x: seam - 14, y: y + height },
      { x, y: y + height },
    ],
    { closed: true, fill: C.ink, width: 0 },
  );
  for (let dy = 24; dy < height - 24; dy += 22) {
    api.line(ctx, seam, y + dy, seam, y + dy + 10, C.muted, 3);
  }
  const keyX = x + 69;
  api.circle(ctx, keyX, y + 66, 22, null, C.bg, 8);
  api.line(ctx, keyX, y + 88, keyX, y + 139, C.bg, 8);
  api.line(ctx, keyX, y + 114, keyX + 18, y + 114, C.bg, 8);
  api.line(ctx, keyX, y + 135, keyX + 14, y + 135, C.bg, 8);
  api.text(ctx, index ? 'B' : 'A', keyX, y + 204, 43, C.bg, 'center', 'mono');
  api.text(ctx, ticketText[index].join('\n'), seam + 48, y + 70, 48, C.bg, 'left', 'serif');
}

export function drawScoreDesk(
  ctx,
  api,
  tickets,
  threshold,
  { firstY, spacing, showRoutes = true, pendingTicket, domain = [0, 1] },
) {
  const { C } = api;
  const left = 774;
  const right = 1400;
  const [min, max] = domain;
  const position = (value) => left + ((right - left) * (value - min)) / (max - min);
  const top = firstY - 42;
  const bottom = firstY + (tickets.length - 1) * spacing + 42;
  const boundary = position(threshold);

  api.text(ctx, 'Ticket', 122, top - 32, 29, C.muted);
  api.text(ctx, 'Label', 510, top - 32, 29, C.muted);
  api.text(ctx, 'Score', 675, top - 32, 29, C.muted, 'center');
  api.text(ctx, min.toFixed(2), left, top - 32, 29, C.muted, 'center');
  api.text(ctx, max.toFixed(2), right, top - 32, 29, C.muted, 'center');
  api.text(ctx, 'Intake result', 1490, top - 32, 29, C.muted);
  api.text(ctx, 'Cutoff  ' + threshold.toFixed(2), boundary, top - 32, 31, C.yellow, 'center');
  api.rect(ctx, boundary, top, right - boundary, bottom - top, '#10252f', null, 0);
  api.line(ctx, boundary, top, boundary, bottom, C.yellow, 4);
  tickets.forEach((row, i) => {
    const y = firstY + spacing * i;
    const review = row.p >= threshold;
    const error = review !== Boolean(row.y);
    const name = ticketNames[row.id] ?? row.id;
    api.text(ctx, name, 122, y + 11, 33, C.ink);
    api.text(ctx, row.y ? 'Urgent' : 'Routine', 510, y + 10, 29, C.muted);
    const supplied = row.id !== pendingTicket;
    api.text(ctx, supplied ? row.p.toFixed(2) : '…', 675, y + 10, 30, C.ink, 'center');
    api.line(ctx, left, y, right, y, C.muted, 1.6);
    if (supplied) api.circle(ctx, position(row.p), y, 15, C.ink, C.bg, 3);
    if (supplied && showRoutes) {
      const label = review
        ? row.y
          ? 'Required review'
          : 'Extra review'
        : row.y
          ? 'Missed review'
          : 'Guarded agent';
      api.text(ctx, label, 1490, y + 10, 32, error ? C.pink : C.ink);
    }
  });
}

export function sweep(from, to, progress) {
  const start = Math.round(from * 100);
  const change = Math.round(to * 100) - start;
  return (start + Math.trunc(change * progress)) / 100;
}
