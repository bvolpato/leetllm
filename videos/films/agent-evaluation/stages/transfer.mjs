import { after, decision, ledger, river, runHolds } from '../circulation.mjs';

export default {
  id: 'transfer',
  cues: ['episode-evidence', 'representative-tasks', 'db-diff', 'scope-question', 'retain-result'],
  draw(ctx, scene, state, api) {
    const { C, focus } = api;
    const run = runHolds(river, ['op-17']);
    const database = focus.visible('db-diff');
    focus.target('page', () => {
      api.rect(ctx, 140, 325, 750, 402, C.panel, C.blue, 10);
      api.text(ctx, 'Library website', 185, 395, 34, C.blue);
      api.line(ctx, 185, 434, 845, 434, C.muted, 2);
      api.text(ctx, 'River Stories', 185, 527, 52, C.ink, 'left', 'serif');
      api.text(ctx, '“Your book is reserved.”', 185, 650, 43, C.ink);
    });
    focus.target('account', () =>
      ledger(ctx, api, {
        x: 1020,
        y: 325,
        w: 750,
        task: river,
        account: database ? run.account : null,
        heading: 'Library database',
        pending: 'Read the account',
      }),
    );
    focus.target('trace', () => {
      if (after(state, 'retain-result'))
        decision(
          ctx,
          api,
          'Host trace   ·   op-17   ·   Lena / B7   ·   permitted before dispatch',
          C.green,
        );
      else if (focus.visible('scope-question'))
        decision(ctx, api, 'Does either record show permission for this write?');
      else if (state.beat === 0) decision(ctx, api, 'What could a grader learn from the page?');
      else decision(ctx, api, 'What could a grader learn from the database?');
    });
  },
};
