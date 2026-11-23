import { hardwareDecision } from '../arithmetic.mjs';
import { accEvent } from '../construction.mjs';

export function drawFreshHardware(ctx, scene, state, api) {
  const { C, text, line, circle, rect } = api;
  const at = (name, beat) => accEvent(scene, state, name, beat);
  const rows = hardwareDecision();
  const clockX = (ms) => 545 + 2.6 * ms;
  const rank = state.beat >= 1 && at('rank', 1) === 1;
  const select = state.beat >= 1 && at('select', 1) === 1;
  const showRate = select && at('rate', 1) === 1;
  const inspectLate = state.beat === 2 && at('trace', 2) > 0;
  const costCue = state.cues?.['ag-fresh-hardware-cost'];
  const showCost = select && (costCue ? costCue.phase === 'after' : at('cost', 1) === 1);
  api.focus.target('candidate-clocks', () => {
    text(ctx, 'First token by 300 ms   ·   average later gap ≤ 30 ms', 138, 263, 40, C.ink);
    text(
      ctx,
      '10 responses × 40 tokens per run. Both configurations pass quality and fit.',
      140,
      329,
      31,
      C.muted,
    );
    const limit = clockX(300);
    line(ctx, limit, 420, limit, 805, C.yellow, 4);
    text(ctx, '300 ms', limit, 398, 34, C.yellow, 'center');
    rows.forEach((r, i) => {
      const y = 516 + i * 227;
      const col = select ? (r.eligible ? C.green : C.pink) : C.blue;
      text(ctx, 'Candidate ' + r.id, 140, y - 28, 43, col);
      text(ctx, r.raw + ' raw tokens/s', 141, y + 29, 32, C.ink);
      text(ctx, r.seconds + ' s  ·  $' + r.cost.toFixed(2), 141, y + 79, 30, C.muted);
      line(ctx, clockX(0), y, clockX(450), y, C.muted, 3);
      // A pile contains all requests with the same first-token latency.
      const piles = new Map();
      const admitted =
        i === 0
          ? Math.ceil(9 * at('inputs', 0)) + Number(at('tenth', 0) > 0)
          : Math.ceil(r.first.length * at('b-run', 0));
      for (const value of r.first.slice(0, admitted)) piles.set(value, (piles.get(value) ?? 0) + 1);
      for (const [ms, count] of piles) {
        const x = clockX(ms);
        const tail = rank && ms === r.p95First;
        if (inspectLate && i === 0 && tail) circle(ctx, x, y, 41, null, C.yellow, 4);
        circle(ctx, x, y, 32, tail ? C.yellow : C.blue);
        text(ctx, String(count), x, y + 12, 33, C.bg, 'center');
        text(ctx, ms + ' ms', x, y + 83, 32, tail ? C.yellow : C.ink, 'center');
        if (tail)
          text(
            ctx,
            (i === 0 ? 'R10  ·  ' : '') + 'rank ' + Math.ceil(0.95 * r.first.length),
            x,
            y - 57,
            27,
            C.yellow,
            'center',
          );
      }
    });
    if (!select) {
      text(
        ctx,
        'Circle = request count at that time   ·   Every request averages 20 ms per later token',
        960,
        883,
        31,
        C.muted,
        'center',
      );
      text(
        ctx,
        rank ? 'Read the tenth time in each run.' : 'Which candidate meets both p95 limits?',
        960,
        968,
        46,
        C.yellow,
        'center',
      );
    } else if (inspectLate) {
      rect(ctx, 142, 864, 12, 114, C.yellow, undefined, 0);
      text(
        ctx,
        'A   /   Request 10   /   First token at ' + rows[0].p95First + ' ms',
        177,
        907,
        40,
        C.yellow,
      );
      text(
        ctx,
        'Inspect queue time, kernels and transfers in the request trace.',
        177,
        972,
        36,
        C.ink,
      );
    } else {
      const b = rows.find((r) => r.eligible);
      rect(ctx, 142, 864, 12, 114, C.green, undefined, 0);
      text(
        ctx,
        showRate
          ? 'Select ' +
              b.id +
              '   ·   ' +
              b.requestEligibleTokens +
              ' tokens / ' +
              b.seconds +
              ' s = ' +
              b.eligibleGoodput +
              ' eligible tokens/s'
          : 'Select ' + b.id + '   ·   Both p95 limits met',
        177,
        907,
        40,
        C.green,
      );
      text(
        ctx,
        showCost
          ? b.requestEligibleTokens +
              ' tokens / $' +
              b.cost.toFixed(2) +
              ' = ' +
              b.tokensPerDollar.toLocaleString('en-US') +
              ' eligible tokens per dollar'
          : 'Full interval cost   $' + b.cost.toFixed(2),
        177,
        972,
        36,
        C.ink,
      );
    }
  });
}
export default {
  id: 'fresh-hardware',
  draw: drawFreshHardware,
  cues: [
    'ag-fresh-hardware-inputs',
    'ag-fresh-hardware-tenth',
    'ag-fresh-hardware-b-run',
    'ag-fresh-hardware-rank',
    'ag-fresh-hardware-select',
    'ag-fresh-hardware-rate',
    'ag-fresh-hardware-cost',
    'ag-fresh-hardware-trace',
  ],
};
