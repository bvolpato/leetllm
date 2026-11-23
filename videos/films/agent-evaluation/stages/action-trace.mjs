import { after, book, decision, ledger, river, runHolds } from '../circulation.mjs';

export default {
  id: 'action-trace',
  cues: ['catalog-resource', 'permit-action', 'not-executed', 'dispatch-request', 'commit-hold'],
  draw(ctx, scene, state, api) {
    const { C, focus } = api;
    const dispatched = focus.visible('dispatch-request');
    const committed = after(state, 'commit-hold');
    const run = runHolds(river, committed ? ['op-17'] : []);
    focus.target('request', () => {
      book(ctx, api, river, 150, 285);
      api.text(ctx, 'Catalog lookup', 395, 353, 35, C.cyan);
      api.text(ctx, 'River Stories', 395, 425, 48, C.ink, 'left', 'serif');
      if (focus.visible('catalog-resource')) api.text(ctx, 'Book ID   B7', 395, 495, 36, C.cyan);
    });
    focus.target('dispatch', () => {
      api.text(ctx, 'Write request', 150, 643, 30, C.muted);
      if (state.beat > 0) {
        api.text(ctx, 'op-17   ·   Lena   ·   B7', 150, 715, 43, C.ink);
        const permitted = after(state, 'permit-action');
        api.text(
          ctx,
          committed
            ? 'Receipt returned'
            : dispatched
              ? 'Dispatched'
              : permitted
                ? 'Permitted, waiting to run'
                : 'Checking permission',
          150,
          780,
          36,
          permitted ? C.cyan : C.yellow,
        );
      }
    });
    focus.target('account', () =>
      ledger(ctx, api, { x: 1050, y: 330, w: 685, task: river, account: run.account }),
    );
    if (committed) {
      const { operation, hold, version } = run.attempts[0].receipt;
      decision(ctx, api, operation + ' committed ' + hold + ' at version ' + version + '.', C.cyan);
    } else if (dispatched) {
      const p = focus.progress('dispatch-request', 0);
      api.line(ctx, 718, 840, 1110, 840, C.muted, 2);
      api.circle(ctx, 718 + 392 * p, 840, 11, C.cyan);
    }
  },
};
