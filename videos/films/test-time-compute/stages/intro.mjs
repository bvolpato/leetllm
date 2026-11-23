import { text } from '../defaults.mjs';
import { roomPlan } from '../seating.mjs';
import { answer, seats, tables } from '../fixtures.mjs';
import { sceneClock } from '../scene-clock.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneClock(scene, state);
  const label = (s, x, y, size, color = C.ink) => text(ctx, api, s, x, y, size, color);
  const tableCount = tables * seats;
  roomPlan(ctx, api, cue('chair-tables').p, cue('extra-chairs').p);
  label(cue('chair-tables').done ? '4 tables  ×  8 chairs' : 'Seating plan', 118, 215, 36, C.blue);

  api.focus.target('draft', () => {
    label('Model’s first answer', 1060, 337, 43, C.muted);
    label(tableCount, 1050, 517, 192, C.ink);
    label('chairs', 1290, 509, 66, C.ink);
  });
  api.line(ctx, 1060, 563, 1770, 563, C.muted, 2);
  api.focus.target('sum', () => {
    if (!cue('table-subtotal').started) return;
    label(cue('include-wall').started ? '4 × 8  +  12' : '4 × 8', 1060, 660, 60);
    if (cue('room-total').done) label(`= ${answer} chairs`, 1060, 768, 86, C.green);
  });
  api.focus.target('decision', () => {
    if (cue('fixed-weight-work').started) label('One extra check', 1060, 886, 46, C.cyan);
    else if (cue('send-question').started && !cue('table-subtotal').started)
      label('How many chairs altogether?', 1060, 658, 46, C.yellow);
  });
}

export default { id: 'intro', draw: drawIntro };
