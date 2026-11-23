import { PRACTICE_PROPOSAL as packet } from '../fixtures.mjs';
import { conditionalWrite, deploymentRow, digest, operationTarget } from '../model.mjs';
import { cueClock, footer, historyColumn } from '../routing.mjs';

function practiceHistories() {
  const external = { ...packet, operationId: 'maintenance-57' };
  const left = operationTarget(packet.revision, packet.fromTraffic);
  left.apply(external.operationId, external);
  const stale = conditionalWrite(left.row, packet);
  const right = operationTarget(packet.revision, packet.fromTraffic);
  right.apply(packet.operationId, packet);
  return {
    start: deploymentRow(packet.revision, packet.fromTraffic),
    stale,
    applied: right.row,
    receipt: right.query(packet.operationId),
  };
}
const histories = practiceHistories();

export function drawFreshPacket(ctx, scene, state, api) {
  const { C } = api;
  const cue = cueClock(scene, state);
  const done = (id) => cue(id).phase === 'after';
  const { start, stale, applied, receipt } = histories;
  const confirmed = done('fresh-receipt');

  api.focus.target('packet', () => {
    api.text(ctx, 'Casey’s approved packet', 115, 267, 42, C.yellow, 'left', 'serif');
    api.text(
      ctx,
      packet.operationId +
        '    /    canary ' +
        packet.trafficPercent +
        '%    /    requires revision ' +
        packet.revision,
      115,
      349,
      40,
      C.ink,
    );
    api.text(
      ctx,
      'Digest  ' + digest(packet).slice(0, 12) + '…',
      1805,
      274,
      30,
      C.muted,
      'right',
      'mono',
    );
  });
  api.line(ctx, 115, 407, 1805, 407, C.muted, 2);
  api.focus.target('left', () => {
    historyColumn(ctx, api, {
      x: 115,
      label: 'Worker A',
      shareLabel: 'Last observed share',
      row: done('fresh-other') ? stale.row : start,
      evidence: done('fresh-other') ? 'Another operator changed the router' : 'First reading',
      status: done('fresh-stale')
        ? 'Stale · 0 rows changed by op-58'
        : done('fresh-zero')
          ? 'op-58 returned ' + stale.rows + ' rows changed'
          : '',
      statusColor: done('fresh-stale') ? C.pink : C.ink,
    });
  });
  api.focus.target('right', () => {
    historyColumn(ctx, api, {
      x: 1035,
      label: 'Worker B',
      shareLabel: 'Last observed share',
      row: done('fresh-read') ? applied : start,
      evidence: confirmed
        ? 'Receipt  ' +
          receipt.operationId +
          '  ·  ' +
          receipt.trafficPercent +
          '% at revision ' +
          receipt.revision
        : done('fresh-query')
          ? 'Looking up receipt for ' + packet.operationId
          : done('fresh-timeout')
            ? 'Timeout after dispatch · no local receipt'
            : done('fresh-send')
              ? 'Request sent · ' + packet.operationId
              : 'First reading',
      status: confirmed
        ? 'Executed · matched the operation key'
        : done('fresh-loss')
          ? 'reply lost · local UNKNOWN'
          : state.beat === 2
            ? 'response in transit'
            : '',
      statusColor: confirmed ? C.green : C.yellow,
    });
  });
  api.focus.target('question', () => {
    if (done('fresh-close'))
      footer(
        ctx,
        api,
        'Both routers serve 15%. Only worker B has a receipt for its write.',
        C.green,
      );
    else if (done('fresh-answer')) footer(ctx, api, 'Look up worker B’s operation key.', C.yellow);
    else if (cue('fresh-ask').phase !== 'before')
      footer(ctx, api, 'Which worker still needs a receipt lookup?', C.yellow);
    else if (cue('fresh-predict').phase !== 'before' && state.beat === 0)
      footer(ctx, api, 'Does the matching digest permit worker A to write?', C.yellow);
  });
}
export default {
  id: 'fresh-packet',
  draw: drawFreshPacket,
  cues: [
    'fresh-packet',
    'fresh-other',
    'fresh-predict',
    'fresh-zero',
    'fresh-send',
    'fresh-loss',
    'fresh-timeout',
    'fresh-read',
    'fresh-ask',
    'fresh-answer',
    'fresh-stale',
    'fresh-query',
    'fresh-receipt',
    'fresh-close',
  ],
};
