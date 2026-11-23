import { chunkScheduleState, deepGemmSentenceProgress } from '../construction.mjs';
import { drawText } from '../defaults.mjs';
import { sentenceCues } from '../fixtures.mjs';

export function drawOverlap(ctx, scene, state, api) {
  const { b, events, end, time, owners } = chunkScheduleState(state);
  const { C } = api;
  const g = (i) => deepGemmSentenceProgress(scene.id, state, b, i);
  const x = (t) => 380 + t * 168;
  const single = b === 3;
  api.focus.target('overlap-tape', () => {
    const heading = [
      'One chunk at a time',
      'Replay with two slots',
      'Two slots',
      'Replay with one slot',
    ][b];
    drawText(ctx, api, heading, 135, 247, 42);
    drawText(ctx, api, 'Time in schedule units', 1730, 247, 30, C.muted, 'right');
    for (let tick = 0; tick <= 8; tick++) {
      api.line(ctx, x(tick), 339, x(tick), 352, C.muted, 2);
      drawText(ctx, api, tick, x(tick), 320, 29, C.muted, 'center');
    }
    api.line(ctx, x(0), 350, x(8), 350, C.muted, 2);
    ['Communication', 'Compute'].forEach((lane, i) => {
      const y = 403 + i * 169;
      drawText(ctx, api, lane, 125, y + 61, 30);
      const active = events.find((e) => e.lane === i && time >= e.start && time < e.end);
      const waiting = active?.id === 'B dispatch' && !owners[1];
      drawText(ctx, api, active && !waiting ? active.id : 'free', 125, y + 97, 27, C.muted);
      api.rect(ctx, x(0), y, x(8) - x(0), 100, C.panel, undefined, 0);
    });
    for (const event of events) {
      if (time <= event.start) continue;
      const stop = Math.min(time, event.end);
      const y = 403 + event.lane * 169;
      const [owner, operation] = event.id.split(' ');
      const color = owner === 'A' ? C.blue : C.pink;
      api.rect(ctx, x(event.start), y, x(stop) - x(event.start), 100, color, undefined, 0);
      if (stop === event.end) {
        const mid = (x(event.start) + x(event.end)) / 2;
        drawText(ctx, api, owner, mid, y + 40, 34, C.bg, 'center');
        drawText(ctx, api, operation, mid, y + 81, 27, C.bg, 'center');
      }
    }
    api.line(ctx, x(time), 355, x(time), 389, C.yellow, 4);
    api.circle(ctx, x(time), 389, 7, C.yellow);
    api.line(ctx, x(time), 684, x(time), 717, C.yellow, 4);
    const slot = (n, owner, x0) => {
      const color = owner === 'A' ? C.blue : owner === 'B' ? C.pink : C.muted;
      api.rect(ctx, x0, 763, 465, 97, C.panel, color, 6);
      drawText(
        ctx,
        api,
        `Slot ${n}   ·   ${owner ? 'holds ' + owner : 'free'}`,
        x0 + 233,
        824,
        38,
        color,
        'center',
      );
    };
    drawText(ctx, api, 'Ring storage', 125, 824, 32);
    if (single || b === 0) slot(0, owners[0] ?? owners[1], x(0));
    else {
      slot(0, owners[0], x(0));
      slot(1, owners[1], x(0) + 520);
    }
    let status = 'Dispatch 1    +    compute 2    +    combine 1   per chunk';
    if (b === 1 && g(2) > 0) status = 'Can B dispatch at time 1? Which slot can it take?';
    if (single && time < 4)
      status = 'B waits for slot 0 while the communication lane is free at time 1';
    if (time >= end) status = `Both chunks are back at time ${end}`;
    drawText(ctx, api, status, 960, 970, 39, C.yellow, 'center');
  });
}
export default { id: 'overlap', draw: drawOverlap, cues: sentenceCues('overlap') };
