import { rotationPolicy } from '../model.mjs';
import { point } from '../geometry.mjs';
import { text, rect, line, circle } from '../defaults.mjs';
import { cueMotion, resultAfter } from '../construction.mjs';

function key(ctx, api, x, y, paper) {
  const ink = api.C.panel;
  rect(ctx, api, x, y - 13, 150, 26, ink, undefined, 4);
  rect(ctx, api, x + 92, y + 5, 19, 33, ink, undefined, 3);
  rect(ctx, api, x + 125, y + 5, 22, 23, ink, undefined, 3);
  circle(ctx, api, x, y, 40, ink);
  circle(ctx, api, x - 5, y, 18, paper);
}

function keyReview(ctx, api, ticket, x, y) {
  const { C } = api;
  const w = 728;
  rect(ctx, api, x, y, w, 373, C.ink, undefined, 20);
  text(ctx, api, 'KEY REVIEW', x + 46, y + 65, 34, C.panel);
  text(ctx, api, ticket.id, x + w - 46, y + 65, 36, C.panel, 'right', 'mono');
  key(ctx, api, x + 87, y + 160, C.ink);
  text(ctx, api, ticket.days + ' days', x + 290, y + 190, 90, C.panel);
  const seam = y + 240;
  for (let dx = 30; dx < w - 30; dx += 36) {
    line(ctx, api, point(x + dx, seam), point(x + dx + 18, seam), C.muted, 3);
  }
  circle(ctx, api, x, seam, 13, C.bg);
  circle(ctx, api, x + w, seam, 13, C.bg);
  text(ctx, api, 'Base reply', x + 46, y + 319, 34, C.panel);
  text(ctx, api, 'Routine review', x + 290, y + 322, 49, C.panel);
}

export function drawPolicyTask(ctx, scene, state, api) {
  const { C } = api;
  const { routine, overdue, minimumDays } = rotationPolicy;
  const time = state.t ?? 0;
  if (time < 0.35) ctx.globalAlpha = 1;
  api.focus.target('rule-marker', () => {
    text(ctx, api, 'Rotation policy  ·  revision 3', 165, 262, 36, C.muted);
    text(
      ctx,
      api,
      minimumDays + ' days or older  →  Rotation owner',
      1745,
      262,
      44,
      C.yellow,
      'right',
    );
  });

  for (const [i, ticket] of [routine, overdue].entries()) {
    const x = 165 + 846 * i;
    const arrival = api.clamp((time + 0.12 * (1 - i)) / 0.92);
    const y = 412 - (1 - arrival) ** 2 * (i === 0 ? 80 : 110);
    api.focus.target(i === 0 ? 'routine-ticket' : 'overdue-ticket', () => {
      keyReview(ctx, api, ticket, x, y);
    });

    const cue = i === 0 ? 'ticket-keep' : 'ticket-route';
    const ready = resultAfter(state, cue, 1, i === 0 ? 0.42 : 0.19);
    const printing = cueMotion(state, cue, 1, i === 0 ? 0.22 : 0.02, i === 0 ? 0.42 : 0.19);
    api.focus.target('ticket-actions', () => {
      if (printing > 0) {
        const escalates = ticket.days >= minimumDays;
        const color = escalates ? C.yellow : C.blue;
        rect(ctx, api, x, 812, 728 * printing, 88, color, undefined, 10);
        if (ready) {
          text(ctx, api, 'Target reply', x + 46, 870, 34, C.panel);
          text(
            ctx,
            api,
            escalates ? 'Rotation owner' : 'Routine review',
            x + 290,
            872,
            48,
            C.panel,
          );
        }
      }
    });
  }

  if (state.beat === 1) {
    const train = cueMotion(state, 'ticket-train', 1, 0.5, 0.66);
    if (train > 0)
      api.focus.target('training-pair', () => {
        text(ctx, api, 'Weights to train', 165, 993, 36, C.ink);
        for (const [i, name] of ['A', 'B'].entries()) {
          const x = 470 + 120 * i;
          rect(ctx, api, x, 942, 94, 70, C.yellow, undefined, 8);
          text(ctx, api, name, x + 47, 991, 40, C.panel, 'center', 'mono');
        }
      });
  }

  api.focus.target('ticket-ledgers', () => {
    if (state.beat === 2) {
      const label = resultAfter(state, 'ticket-sets', 2, 0.55)
        ? 'Release rule     At least 19 of 20 correct in each set'
        : 'Held out before training     20 policy tickets     and     20 routine reviews';
      text(ctx, api, label, 165, 999, 36, C.ink);
    }
  });
}

export default {
  id: 'policy-task',
  draw: drawPolicyTask,
  cues: [
    'ticket-young',
    'ticket-old',
    'rotation-rule',
    'ticket-route',
    'ticket-keep',
    'ticket-train',
    'ticket-sets',
  ],
};
