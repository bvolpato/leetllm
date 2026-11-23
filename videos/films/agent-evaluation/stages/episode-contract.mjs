import { after, book, decision, ledger, river, runHolds } from '../circulation.mjs';

const inherited = { version: 12, holds: [{ id: 'old-4', reader: 'Lena', book: 'B8' }] };

export default {
  id: 'episode-contract',
  cues: ['identify-resource', 'inherited-hold', 'reset-account', 'memory-reset', 'clean-snapshot'],
  draw(ctx, scene, state, api) {
    const { C, focus } = api;
    const reset = after(state, 'reset-account');
    const cleared = after(state, 'memory-reset');
    focus.target('request', () => {
      book(ctx, api, river, 150, 285);
      api.text(ctx, 'Test episode', 395, 353, 35, C.cyan);
      api.text(ctx, 'One B7 hold for Lena', 395, 425, 43, C.ink, 'left', 'serif');
    });
    focus.target('agent-memory', () => {
      api.text(ctx, 'Agent memory', 150, 643, 30, C.muted);
      api.text(
        ctx,
        cleared ? 'Cache empty' : 'Old lookup for B8',
        150,
        708,
        42,
        cleared ? C.ink : C.yellow,
      );
      api.text(
        ctx,
        cleared ? 'Prior approval invalidated' : 'Approval from the last run',
        150,
        770,
        33,
        C.muted,
      );
    });
    focus.target('account', () =>
      ledger(ctx, api, {
        x: 1050,
        y: 330,
        w: 685,
        task: river,
        account: reset ? runHolds(river, []).account : inherited,
      }),
    );
    if (after(state, 'clean-snapshot'))
      decision(ctx, api, 'Same starting account and memory for every run.', C.green);
  },
};
