import { serviceTrace } from '../arithmetic.mjs';
import { accEvent } from '../construction.mjs';
import { drawRequestLedger } from '../request-ledger.mjs';

export function drawGoodputContract(ctx, scene, state, api) {
  const { C, text } = api;
  const at = (name, beat) => accEvent(scene, state, name, beat);
  const swap = at('move', 1);
  const moved = swap === 1;
  const trace = serviceTrace(moved ? 1 : 2);
  const counted =
    state.beat === 0 ? at('count', 0) === 1 : state.beat >= 2 && at('recount', 2) === 1;
  api.focus.target('request-pairs', () => {
    drawRequestLedger(ctx, api, trace, { joint: true, swap, pending: swap > 0 && !counted });
    text(ctx, '100 tokens per completed request', 145, 785, 35, C.ink);
    text(ctx, 'Full observation window   10 s', 1030, 785, 35, C.ink);
    if (counted || (state.beat === 1 && swap === 0)) {
      text(
        ctx,
        trace.joint.length +
          ' × 100 tokens / 10 s  =  ' +
          trace.eligibleTokens / trace.seconds +
          ' eligible tokens/s',
        960,
        903,
        49,
        C.green,
        'center',
      );
    } else {
      text(
        ctx,
        swap > 0
          ? 'Same ten seconds. How many tokens qualify now?'
          : 'Which requests contribute their 100 tokens?',
        960,
        902,
        39,
        C.yellow,
        'center',
      );
    }
    text(
      ctx,
      moved
        ? 'Same two p95s   ·   ' +
            trace.p95First +
            ' ms first token   /   ' +
            trace.p95Later +
            ' ms later gap'
        : 'Nearest-rank p95   ·   rank 19 of 20   ·   ' +
            trace.p95First +
            ' ms first token   /   ' +
            trace.p95Later +
            ' ms later gap',
      960,
      995,
      31,
      C.muted,
      'center',
    );
  });
}
export default {
  id: 'goodput-contract',
  draw: drawGoodputContract,
  cues: ['ag-goodput-contract-count', 'ag-goodput-contract-move', 'ag-goodput-contract-recount'],
};
