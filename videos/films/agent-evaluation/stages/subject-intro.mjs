import { after, decision, ledger, river, runHolds } from '../circulation.mjs';

const emptyAccount = runHolds(river, []).account;

function libraryCard(ctx, api, lift) {
  const { C } = api;
  const x = 985,
    y = 395 - 65 * lift;
  api.rect(ctx, x, y, 710, 365, '#173c49', C.cyan, 28);
  api.text(ctx, 'Library card', x + 48, y + 87, 63, C.ink, 'left', 'serif');
  api.line(ctx, x + 48, y + 125, x + 662, y + 125, C.cyan, 3);
  api.text(ctx, river.reader, x + 48, y + 212, 59, C.ink);
  let barX = x + 48;
  for (const width of [5, 11, 4, 6, 13, 5, 9, 3, 6, 12, 4, 8, 6, 3, 11, 5]) {
    api.rect(ctx, barX, y + 263, width, 53, C.cyan);
    barX += width + 5;
  }
  api.text(ctx, 'View holds', x + 660, y + 304, 38, C.cyan, 'right');
}

export default {
  id: 'subject-intro',
  cues: [
    'completion-claim',
    'choose-record',
    'inspect-account',
    'empty-account',
    'opening-verdict',
  ],
  draw(ctx, scene, state, api) {
    const { C, focus } = api;
    const opened = after(state, 'inspect-account');
    if (state.t < 0.35) ctx.globalAlpha = 1;

    api.rect(ctx, 228, 202, 526, 674, C.panel, C.muted, 54);
    api.line(ctx, 441, 234, 542, 234, C.muted, 8);
    api.line(ctx, 439, 842, 544, 842, C.muted, 6);
    focus.target('request', () => {
      api.text(ctx, 'Lena', 693, 305, 32, C.muted, 'right');
      api.rect(ctx, 286, 328, 410, 170, '#173c49', C.cyan, 22);
      api.rect(ctx, 309, 351, 86, 122, C.cyan, undefined, 5);
      api.line(ctx, 321, 355, 321, 469, C.bg, 2);
      api.text(ctx, river.book, 358, 425, 34, C.bg, 'center', 'serif');
      api.text(ctx, river.title, 414, 395, 42, C.ink, 'left', 'serif');
      api.text(ctx, 'Reserve one copy.', 414, 453, 30, C.ink);
    });
    focus.target('message', () => {
      const remaining = Math.max(0, 1 - state.t / 0.95);
      const y = 551 + 94 * remaining ** 2;
      api.text(ctx, 'Assistant', 279, y, 32, C.blue);
      api.rect(ctx, 274, y + 18, 408, 137, C.blue, undefined, 23);
      api.path(
        ctx,
        [
          { x: 274, y: y + 131 },
          { x: 264, y: y + 159 },
          { x: 310, y: y + 146 },
        ],
        { fill: C.blue, closed: true, width: 0 },
      );
      api.text(ctx, 'Your book is', 305, y + 77, 48, C.bg, 'left', 'serif');
      api.text(ctx, 'reserved.', 305, y + 130, 48, C.bg, 'left', 'serif');
    });
    focus.target('account', () => {
      if (opened) {
        ledger(ctx, api, {
          x: 985,
          y: 330,
          w: 710,
          task: river,
          account: emptyAccount,
          summary: 'All current holds',
        });
      } else {
        libraryCard(ctx, api, focus.progress('inspect-account', 0));
      }
    });
    focus.target('decision', () => {
      if (after(state, 'opening-verdict'))
        decision(ctx, api, 'Fail this run. Lena has no reservation for B7.', C.pink);
      else if (opened) decision(ctx, api, 'How many B7 holds can you find?');
    });
  },
};
