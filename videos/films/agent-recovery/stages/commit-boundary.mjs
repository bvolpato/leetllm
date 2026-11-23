import { commitDisplay } from '../construction.mjs';
import { commitScenario } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawCommitBoundary(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api;
  const beat = state.beat ?? 0;
  const progress2 = state.beatP ?? 0;
  const q = phase(progress2, 0.04, 0.9);
  {
    const before = commitScenario('before-commit');
    const after = commitScenario('after-commit');
    const snapshot = commitDisplay(beat, progress2);
    components.panel(
      {
        x: 130,
        y: 280,
        width: 790,
        height: 560,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        padding: 18,
      },
      () => {
        api.focus.target('commit-boundary-fault-before-commit', () =>
          text(ctx, api, 'Fault before commit', 525, 340, 38, themeColors.blue, 'center'),
        );
        api.focus.target('before-ledger', () =>
          card(
            ctx,
            api,
            snapshot.before.pending ? 'Ledger staged' : 'No ledger row',
            220,
            420,
            300,
            snapshot.before.pending ? themeColors.yellow : themeColors.muted,
            100,
            28,
          ),
        );
        api.focus.target('before-job', () =>
          card(
            ctx,
            api,
            snapshot.before.pending ? 'Job staged' : 'No queued job',
            560,
            420,
            300,
            snapshot.before.pending ? themeColors.yellow : themeColors.muted,
            100,
            28,
          ),
        );
        api.focus.target('rollback-result', () =>
          text(
            ctx,
            api,
            snapshot.before.rolledBack
              ? 'Transaction rolls both writes back'
              : 'Both writes remain uncommitted',
            525,
            635,
            30,
            themeColors.muted,
            'center',
          ),
        );
        api.focus.target('before-durable-count', () =>
          text(
            ctx,
            api,
            `Durable records: ${snapshot.before.durable}`,
            525,
            685,
            29,
            themeColors.yellow,
            'center',
          ),
        );
        api.focus.target('before-lookup', () =>
          text(
            ctx,
            api,
            snapshot.before.rolledBack && !before.ledger
              ? 'Lookup: no accepted operation'
              : 'Transaction buffer: ' + snapshot.before.pending + ' rows',
            525,
            735,
            31,
            themeColors.yellow,
            'center',
          ),
        );
      },
    );
    components.panel(
      {
        x: 1000,
        y: 280,
        width: 790,
        height: 560,
        fill: themeColors.panel,
        stroke: themeColors.green,
        padding: 18,
      },
      () => {
        api.focus.target('commit-boundary-reply-lost-after-commit', () =>
          text(ctx, api, 'Reply lost after commit', 1395, 340, 38, themeColors.green, 'center'),
        );
        api.focus.target('after-ledger', () =>
          card(
            ctx,
            api,
            snapshot.after.committed
              ? 'rb-842-1 → job-1'
              : snapshot.after.pending
                ? 'Ledger staged'
                : 'No ledger row',
            1090,
            420,
            300,
            snapshot.after.committed
              ? themeColors.green
              : snapshot.after.pending
                ? themeColors.yellow
                : themeColors.muted,
            100,
            28,
          ),
        );
        api.focus.target('after-job', () =>
          card(
            ctx,
            api,
            snapshot.after.committed
              ? 'job-1 · queued'
              : snapshot.after.pending
                ? 'Job staged'
                : 'No queued job',
            1430,
            420,
            300,
            snapshot.after.committed
              ? themeColors.green
              : snapshot.after.pending
                ? themeColors.yellow
                : themeColors.muted,
            100,
            28,
          ),
        );
        api.focus.target('commit-receipt', () =>
          text(
            ctx,
            api,
            snapshot.replyLost
              ? 'Reply lost · reconcile the same key'
              : snapshot.after.committed
                ? 'Both records committed atomically'
                : 'Both writes remain uncommitted',
            1395,
            635,
            30,
            themeColors.cyan,
            'center',
          ),
        );
        api.focus.target('after-durable-count', () =>
          text(
            ctx,
            api,
            `Durable records: ${snapshot.after.durable}`,
            1395,
            685,
            29,
            themeColors.green,
            'center',
          ),
        );
        api.focus.target('same-key-replay', () =>
          text(
            ctx,
            api,
            beat < 2
              ? snapshot.after.committed
                ? 'Queued · execution pending'
                : 'Commit not observed'
              : `Same-key replay → ${after.replay}`,
            1395,
            735,
            31,
            themeColors.yellow,
            'center',
          ),
        );
        if (beat === 2)
          api.focus.target('changed-payload-conflict', () =>
            text(
              ctx,
              api,
              `Changed payload: ${after.changedPayload}`,
              1395,
              780,
              27,
              themeColors.pink,
              'center',
            ),
          );
      },
    );
    api.focus.target('commit-boundary-readout-12', () =>
      text(
        ctx,
        api,
        beat === 0
          ? 'Commit boundary decides which durable records exist'
          : 'Atomic ledger + job records support repeat recognition',
        960,
        220,
        34,
        themeColors.ink,
        'center',
      ),
    );
  }
}
export default {
  id: 'commit-boundary',
  draw: drawCommitBoundary,
  cues: [
    'atomic-records',
    'paired-writes',
    'before-commit-fault',
    'after-commit-fault',
    'reconcile-key',
    'queued-status',
  ],
};
