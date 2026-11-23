import { applyUpdate, queueState } from '../arithmetic.mjs';
import { drawFooter, drawPill, drawRectangle, drawText } from '../defaults.mjs';
export function drawAtomicCrash(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (k) => state.cues?.['sf-atomic-crash-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    cueVisible = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('atomic-crash-mechanism', () => {
    drawText(
      ctx,
      api,
      'SQLite transaction     /     Q1 adds three',
      960,
      295,
      35,
      themeColors.yellow,
    );
    if (currentBeat < 2) {
      const preparingCommit =
          currentBeat === 1 && cueVisible('commit') && !resultComplete('commit'),
        committed = currentBeat === 1 && resultComplete('commit'),
        reopened =
          (currentBeat === 0 && resultComplete('reopen')) ||
          (currentBeat === 1 && resultComplete('uncommitted') && !preparingCommit && !committed),
        ledger = currentBeat === 0 ? cueVisible('ledger') : cueVisible('both'),
        tentative = ledger && !reopened && !committed,
        agg = currentBeat === 0 ? 0 : tentative ? 3 : 0;
      drawRectangle(ctx, api, 150, 420, 710, 360, themeColors.panel, themeColors.blue);
      drawRectangle(
        ctx,
        api,
        1060,
        420,
        710,
        360,
        themeColors.panel,
        committed ? themeColors.green : themeColors.yellow,
      );
      drawText(ctx, api, 'committed file', 505, 485, 34, themeColors.blue);
      drawText(ctx, api, 'transaction / tentative writes', 1415, 485, 31, themeColors.yellow);
      drawText(
        ctx,
        api,
        committed && !resultComplete('durable')
          ? 'await file reopen'
          : 'backlog ' + (committed ? 3 : 0),
        505,
        595,
        committed && !resultComplete('durable') ? 34 : 42,
        themeColors.blue,
      );
      drawText(
        ctx,
        api,
        committed
          ? resultComplete('durable')
            ? 'ledger Q1: +3 / applied'
            : 'commit receipt saved'
          : 'ledger empty',
        505,
        705,
        30,
        themeColors.blue,
      );
      drawText(
        ctx,
        api,
        committed ? 'transaction cleared' : 'backlog ' + agg,
        1415,
        595,
        committed ? 32 : 42,
        committed ? themeColors.muted : themeColors.yellow,
      );
      drawText(
        ctx,
        api,
        tentative ? 'Q1: +3 / applied' : committed ? 'committed atomically' : 'no tentative ledger',
        1415,
        705,
        29,
        committed ? themeColors.green : themeColors.muted,
      );
      if (
        (currentBeat === 0 && cueVisible('crash')) ||
        (currentBeat === 1 && resultComplete('uncommitted') && !preparingCommit && !committed)
      )
        drawPill(
          ctx,
          api,
          'process exited · transaction did not commit',
          960,
          875,
          1370,
          themeColors.pink,
        );
      if (committed)
        drawPill(
          ctx,
          api,
          resultComplete('retry')
            ? 'same Q1 retry → recorded outcome · backlog stays 3'
            : 'COMMIT completed · acknowledgment lost',
          960,
          875,
          1400,
          themeColors.green,
        );
      drawFooter(
        ctx,
        api,
        reopened
          ? 'Reopen result: backlog 0 and empty ledger'
          : committed
            ? 'Reopened committed state contains both the ID outcome and aggregate'
            : 'Ledger and aggregate must cross the same commit boundary',
      );
    } else {
      const events = [
          {
            id: 'Q1',
            delta: 3,
          },
          {
            id: 'Q2',
            delta: -1,
          },
          {
            id: 'Q3',
            delta: -5,
          },
          {
            id: 'Q4',
            delta: 10,
          },
        ],
        n = resultComplete('q4') ? 4 : resultComplete('reject') ? 3 : resultComplete('q2') ? 2 : 1,
        st = queueState();
      for (const row of events.slice(0, n)) applyUpdate(st, row);
      const repeated = resultComplete('persist');
      if (repeated)
        applyUpdate(st, {
          id: 'Q3',
          delta: -5,
        });
      drawText(ctx, api, 'committed backlog = ' + st.backlog, 960, 450, 45, themeColors.cyan);
      [...st.seen.entries()].forEach(([id, v], i) => {
        const y = 570 + i * 95;
        drawPill(
          ctx,
          api,
          id + ' / ' + (v.delta > 0 ? '+' : '') + v.delta,
          470,
          y,
          520,
          themeColors.blue,
          65,
          29,
        );
        drawText(
          ctx,
          api,
          v.result,
          1320,
          y + 10,
          31,
          v.result === 'applied' ? themeColors.green : themeColors.pink,
        );
      });
      if (resultComplete('conflict'))
        drawPill(
          ctx,
          api,
          'Q1 with changed delta → PAYLOAD CONFLICT',
          960,
          940,
          1420,
          themeColors.pink,
        );
      else if (repeated)
        drawPill(
          ctx,
          api,
          'Rejected Q3 retry keeps 12 · no new application',
          960,
          940,
          1420,
          themeColors.pink,
        );
      drawFooter(
        ctx,
        api,
        'Actual local exits and file reopens · no distributed or broker transaction proved',
      );
    }
  });
}
export default {
  id: 'atomic-crash',
  draw: drawAtomicCrash,
  cues: [
    'sf-atomic-crash-ledger',
    'sf-atomic-crash-crash',
    'sf-atomic-crash-reopen',
    'sf-atomic-crash-both',
    'sf-atomic-crash-uncommitted',
    'sf-atomic-crash-commit',
    'sf-atomic-crash-durable',
    'sf-atomic-crash-retry',
    'sf-atomic-crash-q2',
    'sf-atomic-crash-reject',
    'sf-atomic-crash-q4',
    'sf-atomic-crash-persist',
    'sf-atomic-crash-conflict',
  ],
};
