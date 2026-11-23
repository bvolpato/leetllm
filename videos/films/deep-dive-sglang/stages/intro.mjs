import { motion, settled } from '../construction.mjs';
import { line, rectangle, slot, text } from '../defaults.mjs';

const tickets = [
  { id: 'R43', message: 'Login button throws 500', y: 260 },
  { id: 'R42', message: 'Add dark mode to settings', y: 622 },
];

function bugStamp(ctx, api, x, y, width) {
  rectangle(ctx, api, x, y, width, 93, api.C.cyan, api.C.cyan, 8);
  text(ctx, api, 'bug', x + width / 2, y + 64, 54, api.C.bg, 'center');
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const landing = 1 - Math.min(1, state.t / 1.15);
  const copy = motion(state, 'ticket-bind', 1, 0.21, 0.54);
  const sent = settled(state, 'ticket-submit', 1, 0.7);
  const from = 858;
  const to = 1440;
  const width = 216;
  const pullback = api.ease((state.t - 1.15) / 1.1);
  const zoom = 1 + 0.4 * (1 - pullback);
  ctx.save();
  ctx.translate(-40 * (1 - pullback), 35 * (1 - pullback));
  ctx.scale(zoom, zoom);
  for (const { id, message, y } of tickets) {
    const login = id === 'R43';
    if (!login && pullback < 1) continue;
    const key = id.toLowerCase();
    const color = login ? C.cyan : C.blue;
    if (pullback === 1) line(ctx, api, 1138, y + 144, 1312, y + 144, C.muted, 2);
    api.focus.target('ticket-' + key, () => {
      const outline = [
        [120, 12],
        [132, 0],
        [795, 0],
        [816, 20],
        [837, 0],
        [1108, 0],
        [1120, 12],
        [1120, 228],
        [1108, 240],
        [837, 240],
        [816, 220],
        [795, 240],
        [132, 240],
        [120, 228],
      ].map(([x, dy]) => ({ x, y: y + dy }));
      api.path(ctx, outline, { closed: true, color, fill: C.panel, width: 3 });
      for (let dy = 35; dy < 213; dy += 26) {
        line(ctx, api, 816, y + dy, 816, y + dy + 12, C.muted, 2);
      }
      text(ctx, api, 'Support ticket  ' + id, 167, y + 76, 34, color);
      text(ctx, api, message, 167, y + 167, 49, C.ink);
    });
    api.focus.target(login ? 'ticket-return' : 'ticket-pending', () => {
      text(ctx, api, 'Label', from + width / 2, y + 66, 32, C.muted, 'center');
      slot(ctx, api, login ? '' : 'pending', from, y + 98, width, 93, C.muted);
      if (login && (copy === 0 || (to - from) * copy > width + 8)) {
        bugStamp(ctx, api, from + 286 * landing, y + 98 - 42 * landing, width);
      }
    });
    if (pullback < 1) continue;
    api.focus.target('ticket-slot-' + key, () => {
      text(ctx, api, 'Explanation prompt', to + width / 2, y + 66, 36, C.ink, 'center');
      slot(ctx, api, '', to, y + 98, width, 93, C.muted);
      if (login && copy > 0) {
        bugStamp(ctx, api, from + (to - from) * copy, y + 98, width);
      }
      if (login && sent)
        text(ctx, api, 'Submitted', to + width / 2, y + 253, 36, C.green, 'center');
    });
  }
  ctx.restore();
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'ticket-bug',
    'ticket-dark',
    'ticket-ask',
    'ticket-bind',
    'ticket-submit',
    'ticket-wait',
    'intro-return',
  ],
};
