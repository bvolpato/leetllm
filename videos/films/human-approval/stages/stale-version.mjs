import { FRESH_PROPOSAL, PROPOSAL } from '../fixtures.mjs';
import { conditionalWrite, deploymentRow, digest, WORKED_SQL } from '../model.mjs';
import { cueClock, footer, historyColumn } from '../routing.mjs';

export function drawStaleVersion(ctx, scene, state, api) {
  const { C } = api;
  const cue = cueClock(scene, state);
  const done = (id) => cue(id).phase === 'after';
  const start = deploymentRow(PROPOSAL.revision, PROPOSAL.fromTraffic);
  const other = done('stale-other')
    ? deploymentRow(FRESH_PROPOSAL.revision, FRESH_PROPOSAL.fromTraffic)
    : start;
  const left = conditionalWrite(start, PROPOSAL);
  const right = conditionalWrite(other, PROPOSAL);
  const rebuilt = done('stale-rebuild');
  const rejected = done('stale-reject') && right.rows === 0;
  if (state.beat < 2) {
    api.focus.target('write', () => {
      WORKED_SQL.forEach((line, i) =>
        api.text(ctx, line, 115, 240 + i * 52, 35, i === 2 ? C.yellow : C.ink, 'left', 'mono'),
      );
      api.text(ctx, 'Casey approved op-17', 1805, 242, 35, C.yellow, 'right');
      api.text(ctx, digest(PROPOSAL).slice(0, 12) + '…', 1805, 305, 31, C.muted, 'right', 'mono');
    });
  } else {
    api.focus.target('repair', () => {
      api.text(
        ctx,
        rebuilt ? 'New packet · ' + FRESH_PROPOSAL.operationId : 'Preparing a new packet for B',
        115,
        248,
        42,
        C.yellow,
      );
      api.text(ctx, '10% → 25%   /   requires revision 4', 115, 321, 38, C.ink);
      if (rebuilt) {
        api.text(ctx, FRESH_PROPOSAL.evidence.join('   /   '), 1035, 248, 36, C.ink);
        api.text(
          ctx,
          'Digest ' + digest(FRESH_PROPOSAL).slice(0, 12) + '…',
          1035,
          321,
          31,
          C.muted,
          'left',
          'mono',
        );
      }
    });
  }
  api.line(ctx, 115, 407, 1805, 407, C.muted, 2);
  api.focus.target('left', () => {
    historyColumn(ctx, api, {
      x: 115,
      label: 'A · Original deployment',
      row: done('stale-left') ? left.row : start,
      evidence: 'No intervening change',
      status: done('stale-left') ? left.rows + ' row changed by op-17' : '',
      statusColor: C.green,
    });
  });
  api.focus.target('right', () => {
    historyColumn(ctx, api, {
      x: 1035,
      label: 'B · Same starting point',
      row: done('stale-right') ? right.row : other,
      evidence: done('stale-other') ? 'Another operator set 10%' : 'No intervening change yet',
      status: rejected
        ? `${PROPOSAL.revision} ≠ ${other.revision} → rejected · effects ${right.rows}`
        : done('stale-right')
          ? right.rows + ' rows changed by op-17'
          : '',
      statusColor: C.pink,
    });
  });
  api.focus.target('question', () => {
    if (state.beat >= 2) {
      footer(
        ctx,
        api,
        done('stale-review')
          ? 'Old op-17 remains rejected on B.   Review requested for op-18 · decision pending'
          : 'Old op-17 remains rejected on B.',
        C.yellow,
      );
    } else if (cue('stale-ask').phase !== 'before' && !done('stale-right')) {
      footer(ctx, api, 'After this write, what share will each canary serve?', C.yellow);
    } else if (done('stale-right')) {
      footer(ctx, api, 'One approved statement. Only the original row matched.');
    }
  });
}
export default {
  id: 'stale-version',
  draw: drawStaleVersion,
  cues: [
    'stale-sql',
    'stale-other',
    'stale-ask',
    'stale-left',
    'stale-right',
    'stale-reject',
    'stale-rebuild',
    'stale-review',
    'stale-history',
  ],
};
