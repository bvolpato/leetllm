import { after, decision, garden, ledger, river, runHolds } from '../circulation.mjs';

export default {
  id: 'fresh-library',
  cues: [
    'fresh-premises',
    'fresh-repair',
    'fresh-outcome',
    'mira-receipt',
    'mira-read',
    'mira-question',
    'mira-verdict',
    'mira-trace',
    'mira-reset',
    'mira-retry-key',
    'mira-replay',
    'file-regression',
    'untouched-count',
    'fresh-trials',
    'fresh-payoff',
  ],
  draw(ctx, scene, state, api) {
    const { C, focus } = api;
    const isMira = state.beat >= 2;
    const task = isMira ? garden : river;
    const correctedRead = after(state, 'fresh-repair');
    const replay = isMira && after(state, 'mira-replay');
    const resetting = isMira && after(state, 'mira-reset') && !replay;
    const showTrace = isMira && focus.visible('mira-trace');
    const run = isMira
      ? runHolds(task, ['op-41', replay ? 'op-41' : 'op-42'])
      : runHolds(task, ['op-17']);
    const first = run.attempts[0].receipt;
    const stale = !isMira && !correctedRead;
    const account = stale ? { version: 2, holds: [] } : run.account;
    const opened = isMira
      ? after(state, 'mira-read') && !resetting
      : state.beat > 0 || focus.visible('fresh-premises');
    const filed = state.beat >= 5 && focus.visible('file-regression');
    focus.target('case', () => {
      api.text(ctx, task.reader + ' requests one hold', 150, 284, 44, C.cyan, 'left', 'serif');
      api.text(ctx, task.title + '   ·   ' + task.book, 150, 365, 49, C.ink, 'left', 'serif');
    });
    focus.target('receipt', () => {
      if (filed) {
        api.text(ctx, 'Release evidence', 150, 486, 32, C.muted);
        api.text(ctx, 'Known retry case', 150, 573, 37, C.ink);
        api.text(ctx, '1 pass', 830, 573, 40, C.green, 'right');
        api.line(ctx, 150, 605, 830, 605, C.muted, 2);
        api.text(ctx, 'Untouched trials', 150, 690, 37, C.ink);
        api.text(ctx, after(state, 'untouched-count') ? '0' : '?', 830, 690, 40, C.yellow, 'right');
        return;
      }
      api.text(ctx, 'Permitted write receipt', 150, 490, 31, C.muted);
      if (!isMira || focus.visible('mira-receipt'))
        api.text(
          ctx,
          [first.operation, first.book, first.hold, 'v' + first.version].join(' · '),
          150,
          561,
          36,
          C.ink,
        );
      if (showTrace) {
        const last = run.attempts[1];
        api.text(
          ctx,
          replay || resetting ? 'Clean replay of this case' : 'Runtime trace after timeout',
          150,
          678,
          31,
          C.muted,
        );
        const detail = resetting
          ? focus.visible('mira-retry-key')
            ? 'Retry with op-41'
            : 'First reply lost again'
          : last.receipt.operation + (last.replay ? ' returned ' : ' created ') + last.receipt.hold;
        api.text(ctx, detail, 150, 748, 40, C.yellow);
      }
    });
    focus.target('account', () =>
      ledger(ctx, api, {
        x: 1000,
        y: 305,
        w: 765,
        task,
        account: opened ? account : null,
        heading: !opened
          ? 'Verifier'
          : stale
            ? 'Returned lookup   ·   B8'
            : 'Independent read   ·   ' + task.book,
        pending: 'Awaiting state read',
        summary: stale ? 'Returned query was for B8' : undefined,
      }),
    );
    focus.target('decision', () => {
      let label = '',
        color = C.ink;
      if (isMira) {
        if (filed) {
          if (focus.visible('fresh-payoff'))
            label = 'Group the new runs by task. Include every failure.';
          else if (focus.visible('fresh-trials'))
            label = 'Next run: untouched task, same permissions and budget.';
          else label = 'How many untouched trials did this repair run?';
          color = C.yellow;
        } else if (replay) {
          label = run.passed ? 'Known retry case passes.' : 'Known retry case fails.';
          color = C.yellow;
        } else if (resetting) {
          label = 'Read Mira’s account after the retry.';
        } else if (showTrace) {
          label = 'Test a retry with the original operation key.';
        } else if (after(state, 'mira-verdict')) {
          label = run.passed
            ? 'Pass the outcome check.'
            : 'Fail the outcome check. Exactly one B9 hold was required.';
          color = run.passed ? C.green : C.pink;
        } else if (focus.visible('mira-question')) {
          label = 'Does version 9 verify the requested outcome?';
        }
      } else if (after(state, 'fresh-outcome') && run.passed) {
        label = 'Verified: one intended hold';
        color = C.green;
      } else if (correctedRead) label = 'Check the returned row against the receipt.';
      else if (opened) label = 'Make another reservation or change the read?';
      if (label) decision(ctx, api, label, color);
    });
  },
};
