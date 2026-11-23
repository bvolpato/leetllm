import { lexicalTokens } from '../../lib/captions.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';

const estimated = new WeakMap();

// Source-only stills use word positions. The production clock supplies measured phrase times.
export function cueClock(scene, state) {
  function get(id) {
    if (state.cues?.[id]) return state.cues[id];
    if (!scene.beats) return { phase: 'before', progress: 0 };
    if (!estimated.has(scene)) {
      const spans = validateVisualCues(scene).map(({ id, beat, first, last }) => {
        const words = lexicalTokens(scene.beats[beat].say).length;
        return [id, { beat, start: first / words, end: (last + 1) / words }];
      });
      estimated.set(scene, new Map(spans));
    }
    const span = estimated.get(scene).get(id);
    if (!span) throw new Error(scene.id + ': missing cue ' + id);
    const position = state.beat - span.beat + state.beatP;
    const progress = Math.max(0, Math.min(1, (position - span.start) / (span.end - span.start)));
    return {
      progress,
      phase: position < span.start ? 'before' : position < span.end ? 'during' : 'after',
    };
  }
  return {
    p: (id) => get(id).progress,
    started: (id) => get(id).phase !== 'before',
    after: (id) => get(id).phase === 'after',
  };
}

// The limit lives on its own lane. Reservations and available time use the same origin and scale.
export function drawReservation(
  ctx,
  api,
  plan,
  { left, width, domain, y, progress, limit = plan.remaining },
) {
  const { C } = api;
  const x = (seconds) => left + (width * seconds) / domain;
  api.line(ctx, left, y, x(domain), y, C.muted, 2);
  for (let t = 0; t <= domain; t++) {
    api.line(ctx, x(t), y, x(t), y + 13, C.muted, 2);
    api.text(ctx, t + ' s', x(t), y + 49, 25, C.muted, 'center');
  }
  api.line(ctx, left, y - 113, x(limit), y - 113, C.blue, 10);
  api.line(ctx, x(limit), y - 131, x(limit), y - 96, C.blue, 4);
  api.text(ctx, Number(limit.toFixed(1)) + ' s available', x(limit), y - 151, 33, C.blue, 'right');
  const parts = [
    [plan.floor, C.yellow],
    [plan.jitter, C.cyan],
    [plan.call, C.blue],
    [plan.check, C.green],
  ];
  let start = 0;
  parts.forEach(([length, color], i) => {
    const painted = length * progress[i];
    if (painted > 0)
      api.rect(ctx, x(start), y - 78, (width * painted) / domain, 48, color, undefined, 0);
    start += length;
  });
}

export function drawAge(ctx, api, { left, width, maxAge, y, age, minimum, ageShown, policyShown }) {
  const { C } = api;
  const x = (days) => left + (width * days) / maxAge;
  api.line(ctx, left, y, x(maxAge), y, C.muted, 3);
  for (let d = 0; d <= maxAge; d += 10) {
    api.line(ctx, x(d), y + 4, x(d), y + 18, C.muted, 2);
    api.text(ctx, String(d), x(d), y + 54, 26, C.muted, 'center');
  }
  api.text(ctx, 'Key age in days', left, y + 117, 29, C.muted);
  if (policyShown) {
    api.line(ctx, x(minimum), y - 96, x(minimum), y + 4, C.yellow, 4);
    api.text(ctx, 'P-7 minimum · ' + minimum, x(minimum), y - 118, 32, C.yellow, 'center');
  }
  if (ageShown) {
    api.circle(ctx, x(age), y, 12, C.cyan);
    api.text(ctx, 'Stale · ' + age + ' days', x(age), y - 37, 34, C.cyan, 'center');
  }
}
