import { cueEnded, cueProgress, focusOn, line, text } from '../defaults.mjs';
import { fixedSampleLosses } from '../fixtures.mjs';

const candidates = [
  { name: 'P2', misses: [2, 7, 12, 16, 24, 29, 38] },
  { name: 'P7', misses: fixedSampleLosses.flatMap((loss, i) => (loss ? [i + 1] : [])) },
  { name: 'P9', misses: [3, 7, 15, 21, 33, 40] },
];

const doubleCharge = 3;
const ticketOrder = [
  doubleCharge,
  ...Array.from({ length: 40 }, (_, i) => i + 1).filter((n) => n !== doubleCharge),
];

function drawRoutingTicket(ctx, state, api) {
  const { C } = api;
  const route = cueProgress(state, 'misroute');
  const landed = cueEnded(state, 'misroute');
  const entry = Math.min(1, state.t / 1.4);
  const x = 375 + 270 * entry + 425 * route;
  const y = 204 + 35 * entry + 146 * route * route;
  const trays = [
    { x: 150, name: 'Billing' },
    { x: 1020, name: 'Password resets' },
  ];

  for (const tray of trays) {
    api.rect(ctx, tray.x + 28, 589, 692, 155, C.panel, C.muted, 20);
  }
  api.rect(ctx, x, y, 648, 350, C.ink, undefined, 13);
  text(ctx, api, 'SUPPORT TICKET  03', x + 36, y + 60, 32, C.panel);
  text(ctx, api, 'Router P7', x + 610, y + 60, 32, C.panel, 'right');
  text(ctx, api, 'I was charged twice.', x + 36, y + 140, 57, C.bg);
  line(ctx, api, x + 36, y + 173, x + 612, y + 173, C.muted, 3);
  for (const baseline of [236, 296]) {
    text(ctx, api, 'May 8   Subscription', x + 36, y + baseline, 37, C.panel);
    text(ctx, api, '$18', x + 610, y + baseline, 42, C.panel, 'right');
  }
  for (const tray of trays) {
    const tx = tray.x;
    const rim = [
      [0, 700],
      [206, 700],
      [240, 733],
      [508, 733],
      [542, 700],
      [748, 700],
      [722, 864],
      [26, 864],
    ].map(([dx, py]) => ({ x: tx + dx, y: py }));
    api.path(ctx, rim, { closed: true, fill: C.panel, color: C.blue, width: 5 });
    text(ctx, api, tray.name, tx + 374, 819, 51, C.ink, 'center');
  }
  if (landed) {
    api.rect(ctx, 1640, 754, 66, 66, C.pink, undefined, 6);
    line(ctx, api, 1655, 769, 1691, 805, C.bg, 6);
    line(ctx, api, 1691, 769, 1655, 805, C.bg, 6);
  }
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const scoring = cueProgress(state, 'score-tickets');
  if (state.beat === 0 && scoring === 0) {
    ctx.save();
    try {
      ctx.globalAlpha = 1;
      focusOn(api, 'routing-ticket', () => drawRoutingTicket(ctx, state, api));
    } finally {
      ctx.restore();
    }
    return;
  }
  const scored = ticketOrder.slice(0, 1 + Math.floor(39 * scoring));
  const selected = cueEnded(state, 'choose-p-seven');
  focusOn(api, 'ticket-rows', () => {
    text(ctx, api, 'Development tickets   ·   3 of 1,000 prompts', 345, 315, 40, C.ink);
    text(ctx, api, 'Wrong routes', 1650, 315, 35, C.muted, 'center');
    for (const [i, candidate] of candidates.entries()) {
      const y = 420 + i * 128;
      const winner = selected && candidate.name === 'P7';
      text(ctx, api, candidate.name, 145, y + 12, 52, winner ? C.yellow : C.ink);
      for (let j = 0; j < 40; j++) {
        const x = 345 + j * 27 + Math.floor(j / 10) * 25;
        const known = scored.includes(j + 1);
        const miss = candidate.misses.includes(j + 1);
        const color = !known ? C.muted : miss ? C.pink : C.blue;
        api.rect(ctx, x, y - 22, 20, 42, known ? color : C.panel, color, 4);
        if (known && miss) {
          line(ctx, api, x + 4, y - 8, x + 16, y + 6, C.bg, 3);
          line(ctx, api, x + 16, y - 8, x + 4, y + 6, C.bg, 3);
        }
      }
      const count = candidate.misses.filter((ticket) => scored.includes(ticket)).length;
      text(
        ctx,
        api,
        count + ' / ' + scored.length,
        1650,
        y + 14,
        47,
        winner ? C.yellow : C.muted,
        'center',
      );
      if (winner) line(ctx, api, 144, y + 42, 242, y + 42, C.yellow, 6);
    }
  });
  focusOn(api, 'selection-desk', () => {
    const prompt =
      state.beat === 0
        ? scored.length === 40
          ? 'Which prompt makes the fewest mistakes?'
          : 'Ticket 03   ·   the double charge'
        : selected
          ? 'P7   ·   36 correct routes out of 40'
          : 'Which prompt would you keep?';
    text(ctx, api, prompt, 960, 856, 53, selected ? C.yellow : C.ink, 'center');
    text(
      ctx,
      api,
      state.beat >= 2
        ? 'Release rule   ·   95% upper error bound below 20%'
        : 'Each column is the same ticket for all three prompts.',
      960,
      960,
      38,
      C.muted,
      'center',
    );
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['misroute', 'score-tickets', 'choose-p-seven', 'release-rule'],
};
