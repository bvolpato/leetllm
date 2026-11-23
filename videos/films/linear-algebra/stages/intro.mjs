import { clamp, sum } from '../arithmetic.mjs';
import { event } from '../construction.mjs';
import { target, text } from '../defaults.mjs';
import { A, labels } from '../fixtures.mjs';

const railY = 562;
const countX = (count) => 300 + count * 660;

function drawTicket(ctx, api, flags, i, x, y) {
  const { C } = api;
  const rollback = i === 1;
  const color = rollback ? C.pink : C.blue;
  const width = 504;
  const height = 150;
  const left = rollback ? x + 48 : x - 48 - width;
  const top = rollback ? y + 38 : y - 38 - height;
  const radius = rollback ? 24 : 14;
  const dx = (rollback ? left : left + width) - x;
  const dy = (rollback ? top + 18 : top + height - 18) - y;
  const tip = radius / Math.hypot(dx, dy);
  api.line(ctx, x + dx, y + dy, x + dx * tip, y + dy * tip, color, 4);
  api.rect(ctx, left, top, width, height, C.panel, color, 15);
  const iconX = left + 20;
  const iconY = top + 28;
  api.rect(ctx, iconX, iconY, 100, 92, color, color, 8);
  api.line(ctx, iconX + 2, iconY + 21, iconX + 98, iconY + 21, C.panel, 3);
  for (const offset of [11, 21, 31]) api.circle(ctx, iconX + offset, iconY + 11, 2, C.panel);
  if (rollback) {
    api.path(ctx, [
      { x: iconX + 75, y: iconY + 76 },
      { x: iconX + 75, y: iconY + 51 },
      { x: iconX + 25, y: iconY + 51 },
    ], { color: C.panel, width: 6 });
    api.path(ctx, [
      { x: iconX + 40, y: iconY + 36 },
      { x: iconX + 25, y: iconY + 51 },
      { x: iconX + 40, y: iconY + 66 },
    ], { color: C.panel, width: 6 });
  } else {
    api.rect(ctx, iconX + 11, iconY + 49, 78, 13, color, C.panel, 5);
    api.rect(ctx, iconX + 12, iconY + 50, 25, 11, C.panel, C.panel, 4);
  }
  text(ctx, api, labels[i], left + 146, top + 66, 53, color);
  text(ctx, api, 'Slow ' + flags[0], left + 148, top + 119, 32, flags[0] ? color : C.muted);
  text(ctx, api, 'Rollback ' + flags[1], left + 273, top + 119, 32, flags[1] ? color : C.muted);
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const firstLanding = event(state, 0, 'ticket-first', 0.18, 0.7);
  const secondLanding = event(state, 2, 'count-flags', 0, 0.23);
  const filed = event(state, 2, 'file-opening-notes', 0.4, 0.7);
  const approach = 1 - (1 - clamp(state.t / (state.cues?.['ticket-first']?.start || 4))) ** 3;
  const slowTravel = 0.7 * approach + 0.3 * firstLanding;
  const arrival = (1 - clamp(state.t / 1.4)) ** 2;
  const lift = event(state, 1, 'opening-question', 0, 0.35);
  const pinkOffsetX = 214 + 142 * arrival - 62 * lift;
  const pinkOffsetY = 163 + 82 * arrival - 52 * lift;

  text(ctx, api, 'Flag count', 226, railY + 13, 39, C.ink, 'right');
  api.line(ctx, countX(0) - 50, railY, countX(2) + 54, railY, C.ink, 4);
  for (const count of [0, 1, 2]) {
    const x = countX(count);
    api.line(ctx, x, railY - 11, x, railY + 11, C.ink, 3);
    text(ctx, api, String(count), x, railY + 92, 48, C.ink, 'center');
  }

  A.slice(0, 2).forEach((flags, i) => {
    const dx = i ? pinkOffsetX * (1 - secondLanding) : -315 * (1 - slowTravel);
    const dy = i ? pinkOffsetY * (1 - secondLanding) : -158 * (1 - slowTravel);
    const x = countX(sum(flags)) + dx;
    const y = railY + dy;
    target(ctx, api, 'opening-ticket-' + i, () => {
      if (filed < 1) {
        ctx.save();
        ctx.globalAlpha *= 1 - filed;
        drawTicket(ctx, api, flags, i, x, y);
        ctx.restore();
      }
      const color = filed === 1 ? C.yellow : i ? C.pink : C.blue;
      if (i) api.circle(ctx, x, y, 24, '#00000000', color, 7);
      else api.circle(ctx, x, y, 14, color);
    });
  });
  if (filed === 1) text(ctx, api, 'One stored value for either ticket', 960, 760, 46, C.ink, 'center');
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['ticket-first', 'opening-question', 'count-flags', 'file-opening-notes'],
};
