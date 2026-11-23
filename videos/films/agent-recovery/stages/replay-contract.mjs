import { arrow, centerText, cueProgress, line, note, rectangle, tag } from '../defaults.mjs';
export function drawReplayContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    rawBeat = state.beat ?? 0,
    currentBeat = rawBeat,
    done = (id) => cueProgress(ctx, api, id) === 1;
  api.focus.target('replay-contract-mechanism', () => {
    if (currentBeat === 0) {
      centerText(
        ctx,
        api,
        'One retained transaction binds operation, payload and job',
        960,
        280,
        35,
        themeColors.muted,
      );
      tag(ctx, api, 'connection A · operation 2', 410, 420, themeColors.blue, 620);
      tag(ctx, api, 'connection B · operation 2', 410, 690, themeColors.pink, 620);
      const commit = cueProgress(ctx, api, 'shared-commit');
      rectangle(ctx, api, 1120, 385, 590, 365, themeColors.panel);
      centerText(ctx, api, 'authoritative SQLite records', 1415, 350, 31, themeColors.yellow);
      if (commit > 0) {
        tag(ctx, api, 'operation 2 · unchanged payload', 1415, 475, themeColors.yellow, 540);
        tag(ctx, api, 'job-2 · queued', 1415, 640, themeColors.green, 540);
        arrow(ctx, api, 750, 420, 750 + 330 * commit, 420, themeColors.blue);
      }
      if (done('shared-replay')) {
        arrow(ctx, api, 750, 690, 1080, 690, themeColors.pink);
        centerText(ctx, api, 'both callers receive job-2', 960, 870, 38, themeColors.green);
      }
      note(
        ctx,
        api,
        'Actual article database fixture · serial writes and injected exceptions; no remote-job execution proof',
      );
    } else if (currentBeat === 1) {
      const prune = cueProgress(ctx, api, 'retention-pruned');
      centerText(
        ctx,
        api,
        'A retained response has a destination-specific lifetime',
        960,
        285,
        35,
        themeColors.muted,
      );
      line(ctx, api, 250, 500, 1670, 500, themeColors.muted);
      [0, 12, 24, 30].forEach((h) => {
        const x = 250 + (h * 1420) / 30;
        line(ctx, api, x, 485, x, 515, themeColors.muted, 2);
        centerText(ctx, api, h + 'h', x, 565, 29, themeColors.muted);
      });
      rectangle(ctx, api, 250, 435, 1136 * (1 - prune), 50, themeColors.blue);
      centerText(
        ctx,
        api,
        prune
          ? 'pruned key · prior response unavailable'
          : 'retained key → saved first executed response',
        960,
        700,
        36,
        prune ? themeColors.pink : themeColors.blue,
      );
      if (done('retention-pruned'))
        centerText(
          ctx,
          api,
          'Reconcile before a late retry can become a new operation',
          960,
          830,
          34,
          themeColors.yellow,
        );
      note(
        ctx,
        api,
        'Stripe v1 keeps executed errors; v2 has a different failed-work completion contract',
      );
    } else {
      tag(ctx, api, 'replica says not found', 420, 440, themeColors.yellow, 610);
      tag(ctx, api, 'operation may still be queued', 1430, 440, themeColors.pink, 650);
      line(ctx, api, 750, 440, 1080, 440, themeColors.muted, 2);
      centerText(ctx, api, 'lag ≠ authoritative absence', 960, 600, 44, themeColors.pink);
      tag(ctx, api, 'revision 17 · original operation', 500, 790, themeColors.blue, 720);
      tag(
        ctx,
        api,
        done('changed-revision') ? 'revision 18 · new admission' : 'unchanged payload',
        1450,
        790,
        done('changed-revision') ? themeColors.yellow : themeColors.blue,
        660,
      );
      note(
        ctx,
        api,
        'Authenticated caller + tenant scope + retained payload + destination outcome contract',
      );
    }
  });
}
export default {
  id: 'replay-contract',
  draw: drawReplayContract,
  cues: ['shared-commit', 'shared-replay', 'retention-pruned', 'changed-revision'],
};
