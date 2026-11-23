import { chapterCard, text } from '../defaults.mjs';
import { drawWordRows, passed, recorded } from '../ledger.mjs';

export function drawRestart(ctx, scene, state, api) {
  const { C } = api;
  const stale = passed(state, 'restart-stale', 0);
  const fresh = passed(state, 'restart-new', 1);
  const zero = passed(state, 'restart-zero', 1);
  const durable = state.beat === 2;
  const saved = passed(state, 'restart-record-boundary', 2);
  const loaded = passed(state, 'restart-load-durable-ledger', 2);
  drawWordRows(ctx, api, 125, 315, 590);
  text(ctx, api, 'Ledger observations', 890, 278, 44);
  text(ctx, api, 'Illustrative PIDs', 1750, 278, 30, C.muted, 'right');
  const row = (label, pid, count, y, color) => {
    api.line(ctx, 890, y - 54, 1750, y - 54, C.muted, 2);
    text(ctx, api, label, 904, y + 2, 36);
    text(ctx, api, String(pid), 1410, y + 2, 42, color, 'center');
    text(ctx, api, String(count), 1650, y + 2, 46, color, 'center');
  };
  text(ctx, api, 'PID', 1410, 358, 32, C.muted, 'center');
  text(ctx, api, 'Count', 1650, 358, 32, C.muted, 'center');
  api.focus.target('restart-before', () => row('Before kill', 101, recorded.count, 455, C.ink));
  api.focus.target('restart-poll', () => {
    row(
      'First poll',
      stale ? 101 : '…',
      stale ? recorded.count : '…',
      573,
      stale ? C.yellow : C.muted,
    );
    if (state.beat > 0) {
      const label = durable ? 'With checkpoint' : 'Next poll';
      const count = durable ? (loaded ? recorded.count : '…') : zero ? 0 : '?';
      row(label, fresh ? 202 : '…', count, 691, fresh ? C.green : C.muted);
    }
  });
  if (durable) {
    api.focus.target('restart-store', () => {
      chapterCard(
        ctx,
        api,
        saved ? 'B17 receipt   3     ·     Durable count   3' : 'Read the durable ledger',
        230,
        801,
        920,
        C.green,
        103,
        38,
      );
      text(
        ctx,
        api,
        loaded ? 'Read complete' : 'Constructor read',
        1230,
        870,
        37,
        loaded ? C.green : C.muted,
      );
    });
  } else {
    api.focus.target('restart-test', () => {
      api.text(
        ctx,
        'after_pid != before_pid and after_count == 0',
        960,
        843,
        42,
        C.ink,
        'center',
        'mono',
      );
      const verdict = zero
        ? 'True   ·   fresh process, constructor count'
        : fresh
          ? 'Check the new count'
          : stale
            ? 'False   ·   same process, poll again'
            : 'Waiting for a read';
      text(ctx, api, verdict, 960, 932, 35, zero ? C.green : C.yellow, 'center');
    });
  }
}
export default {
  id: 'restart',
  draw: drawRestart,
  cues: [
    'restart-old',
    'restart-stale',
    'restart-new',
    'restart-zero',
    'restart-record-boundary',
    'restart-load-durable-ledger',
  ],
};
