import { EVENTS } from '../fixtures.mjs';
import { summarize } from '../arithmetic.mjs';

const kept = ['201', '205', '206'];

export function drawSampling(ctx, scene, state, api) {
  const { C, focus } = api;
  const progress = focus.progress('retain-traces', 0);
  const full = summarize(EVENTS);
  const stored = EVENTS.filter((e) => kept.includes(e.id));
  const summary = summarize(stored, stored.length);
  const text = (value, x, y, size, color, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);
  const center = (i) => 540 + 218 * i;
  function ticket(event, x, y) {
    const color = event.unsafe ? C.pink : C.blue;
    api.rect(ctx, x - 84, y - 47, 168, 94, C.panel, color, 9);
    text(event.id, x, y + 9, 40, color, 'center');
  }

  text('Each tile is one reviewed request. Pink marks an unsafe delivery.', 120, 267, 36, C.ink);
  focus.target('all-traces', () => {
    text('Full window', 120, 434, 39, C.ink);
    text(full.unsafe + ' unsafe of ' + full.reviewed, 120, 496, 33, C.pink);
  });
  EVENTS.forEach((e, i) => focus.target('all-traces', () => ticket(e, center(i), 457)));
  focus.target('storage', () => {
    text('Trace store', 120, 717, 39, C.ink);
    if (progress === 1)
      text(summary.unsafe + ' unsafe of ' + summary.reviewed, 120, 779, 33, C.pink);
  });
  api.line(ctx, 414, 823, 1750, 823, C.muted, 2);
  if (progress > 0) {
    EVENTS.forEach((e, i) => {
      if (!kept.includes(e.id)) return;
      focus.target('storage', () => {
        const height = 94 * Math.min(1, progress * 4);
        const top = 515 + 171 * progress;
        const color = e.unsafe ? C.pink : C.blue;
        api.rect(ctx, center(i) - 84, top, 168, height, C.panel, color, 9);
        if (height > 66) text(e.id, center(i), top + height / 2 + 9, 40, color, 'center');
      });
    });
  }
  focus.target('population-question', () => {
    const revealed = state.cues?.['population-rate']?.phase === 'after';
    const asking = focus.progress('choose-population', 0) > 0;
    const label = revealed
      ? 'Report 2 / 6 for this window. Open 205 or 206 to investigate.'
      : asking
        ? 'Which fraction belongs on the all-request dashboard?'
        : 'Count at ingress and keep the six-request window intact.';
    text(label, 120, 963, 40, asking && !revealed ? C.yellow : C.ink);
  });
}

export default {
  id: 'sampling',
  draw: drawSampling,
  cues: ['count-window', 'retain-traces', 'choose-population', 'population-rate'],
};
