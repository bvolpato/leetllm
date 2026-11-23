import { serviceTrace } from '../arithmetic.mjs';
import { drawRequestLedger } from '../request-ledger.mjs';

export function drawGates(ctx, scene, state, api) {
  const { C, text } = api;
  const trace = serviceTrace();
  const cue = state.cues?.['gates-beat-2-focus-1'];
  const joined =
    state.beat > 1 || (state.beat === 1 && (cue ? cue.phase === 'after' : state.beatP > 0.56));
  const laterCue = state.cues?.['ag-gates-later'];
  const showLater = state.beat > 0 || (laterCue ? laterCue.phase !== 'before' : state.beatP > 0.36);
  api.focus.target('request-pairs', () => {
    drawRequestLedger(ctx, api, trace, { showLater, joint: joined });
    if (state.beat === 2) {
      const rank = Math.ceil(0.95 * trace.requests.length);
      const pick = state.cues?.['ag-gates-rank'];
      const reveal = pick ? pick.phase === 'after' : state.beatP > 0.45;
      for (const [label, key, limit, y] of [
        ['First token', 'firstMs', 450, 765],
        ['Later gap', 'laterMs', 45, 837],
      ]) {
        const times = trace.requests.map((r) => r[key]).sort((a, b) => a - b);
        text(ctx, label, 144, y + 12, 32, C.ink);
        times.forEach((ms, i) => {
          const selected = reveal && i + 1 === rank;
          api.circle(
            ctx,
            440 + 39 * i,
            y,
            selected ? 17 : 9,
            selected ? C.yellow : ms >= limit ? C.pink : C.muted,
          );
        });
        text(
          ctx,
          reveal ? '19th time   ' + times[rank - 1] + ' ms' : 'Fastest to slowest',
          1290,
          y + 12,
          33,
          reveal ? C.yellow : C.muted,
        );
      }
      text(
        ctx,
        'Both limits on one ticket   ' + trace.joint.length + ' of 20',
        960,
        945,
        43,
        C.green,
        'center',
      );
      const jointTarget = state.cues?.['ag-gates-joint-target'];
      if (jointTarget ? jointTarget.phase !== 'before' : state.beatP > 0.75)
        text(ctx, '95% joint compliance requires 19 tickets.', 960, 1005, 32, C.ink, 'center');
      return;
    }
    text(ctx, 'First token   ' + trace.first.length + ' / 20', 145, 795, 38, C.ink);
    if (showLater) text(ctx, 'Later gaps   ' + trace.later.length + ' / 20', 785, 795, 38, C.ink);
    if (!joined) {
      text(ctx, 'How many requests meet both limits?', 960, 947, 46, C.yellow, 'center');
    } else {
      text(
        ctx,
        trace.joint.length + ' / 20 = ' + (100 * trace.joint.length) / trace.requests.length + '%',
        960,
        924,
        55,
        C.green,
        'center',
      );
      text(ctx, 'Requests that meet both limits', 960, 1000, 33, C.ink, 'center');
    }
  });
}
export default {
  id: 'gates',
  draw: drawGates,
  cues: [
    'ag-gates-first',
    'ag-gates-later',
    'gates-beat-2-focus-1',
    'ag-gates-rank',
    'ag-gates-joint-target',
  ],
};
