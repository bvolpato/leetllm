import { cueAmount, cueDone } from '../defaults.mjs';
import { dependencyState } from '../protocols.mjs';

export function drawReceiptExpiry(ctx, scene, state, api) {
  const { C } = api;
  const moved = cueAmount(state, 'expiry-clock');
  const refreshed = cueDone(state, 'expiry-refresh');
  const recomputed = cueDone(state, 'expiry-recompute');
  const changedRevision = cueDone(state, 'expiry-revision');
  const revision = changedRevision ? 'c1843' : 'c1842';
  const checked = cueDone(state, 'expiry-ready');
  const followed = cueDone(state, 'expiry-follow');
  const now = refreshed ? 1101 : moved === 1 ? 1100 : 1099;
  const receipt = (until, version = 1) => ({ revision: 'c1842', until, version });
  const receipts = {
    ci: receipt(1200),
    diff: receipt(1200),
    health: receipt(refreshed ? 1250 : 1100, refreshed ? 2 : 1),
  };
  if (!refreshed || recomputed) {
    receipts.decision = {
      ...receipt(1200),
      consumed: { ci: 1, diff: 1, health: receipts.health.version },
    };
  }
  const check = dependencyState(receipts, revision, now);
  const x = (t) => 525 + (t - 1000) * 4.9;
  const labels = { ci: 'CI', diff: 'Diff', health: 'Health', decision: 'Decision' };
  api.focus.target('lifetimes', () => {
    api.text(ctx, 'Receipts for c1842', 145, 274, 34, C.muted);
    api.text(ctx, 'Requested  /  ' + revision, 835, 274, 36, changedRevision ? C.yellow : C.ink);
    api.text(ctx, 'Now  ' + now + ' s', 1745, 274, 43, C.yellow, 'right');
    const marker = x(1099 + moved + (refreshed ? 1 : 0));
    api.line(ctx, marker, 373, marker, 837, C.yellow, 3);
    for (const [i, id] of Object.keys(labels).entries()) {
      const y = 410 + i * 122;
      const r = receipts[id];
      api.text(ctx, labels[id], 145, y + 14, 41, C.ink);
      if (!r) {
        api.text(ctx, 'Awaiting recomputation', x(1000), y + 12, 32, C.muted);
        continue;
      }
      const invalid = checked && (id !== 'decision' || followed) && !check.valid[id];
      const color = invalid ? C.pink : C.cyan;
      api.line(ctx, x(1000), y, x(r.until), y, C.muted, 3);
      const cutoff =
        id === 'decision' && followed ? Math.min(r.until, receipts.health.until) : r.until;
      api.line(ctx, x(1000), y, x(cutoff), y, color, 12);
      api.circle(ctx, x(cutoff), y, 9, C.bg, color, 4);
      if (cutoff !== r.until) api.circle(ctx, x(r.until), y, 7, C.bg, C.muted, 3);
      api.text(ctx, String(r.until), x(r.until) + 20, y - 20, 28, C.muted, 'left', 'mono');
      if (id === 'decision' && cutoff !== r.until)
        api.text(ctx, 'Used health v1', x(cutoff) - 20, y + 59, 28, C.pink, 'right');
    }
    const propagation = cueAmount(state, 'expiry-follow');
    if (propagation > 0 && !refreshed)
      api.arrow(ctx, marker + 16, 681, marker + 16, 681 + 70 * propagation, C.pink, 5);
  });
  api.focus.target('expiry-question', () => {
    let line = 'Each open circle marks an exclusive expiry time, in seconds.';
    if (cueAmount(state, 'expiry-predict') > 0)
      line = 'Which read is due? Can the old decision still be used?';
    if (checked) line = 'Rerun health. Keep the CI and diff results.';
    if (cueDone(state, 'expiry-block'))
      line = 'Refresh health before recomputing the decision. The effect waits.';
    if (refreshed)
      line = recomputed
        ? 'New decision uses health v2. Check permission before acting.'
        : 'New health v2 is in. The decision is ready to compute.';
    if (changedRevision)
      line = cueDone(state, 'expiry-reset')
        ? 'New revision   /   ready to read: ' + check.ready.join(', ')
        : 'The requested revision has changed.';
    api.text(ctx, line, 960, 967, 37, C.ink, 'center');
  });
}
export default {
  id: 'receipt-expiry',
  draw: drawReceiptExpiry,
  cues: [
    'expiry-health-row',
    'expiry-decision-row',
    'expiry-clock',
    'expiry-predict',
    'expiry-ready',
    'expiry-follow',
    'expiry-block',
    'expiry-refresh',
    'expiry-recompute',
    'expiry-revision',
    'expiry-reset',
  ],
};
