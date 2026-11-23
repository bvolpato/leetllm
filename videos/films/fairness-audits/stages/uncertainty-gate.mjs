import * as vizmatic from 'vizmatic';
import { wilson } from '../arithmetic.mjs';
import { auditBoard } from '../audit-board.mjs';

const examples = [
  [-7, 8],
  [-2, 21],
];
const margin = 10;

function sampleLayout(ids, draws, spacing) {
  const sources = ids.map((id, i) => ({ id, x: 118, y: 354 + spacing * i }));
  const destinations = draws.map((sourceId, i) => ({ sourceId, x: 1110, y: 354 + spacing * i }));
  return {
    sources,
    plan: vizmatic.planSampleCopies?.(
      sources.map(({ id, y }) => ({ id, x: 690, y })),
      destinations,
    ),
  };
}

const claims = sampleLayout(['p1', 'p4', 'p5', 'p6'], ['p4', 'p4', 'p1', 'p6'], 120);
const customers = sampleLayout(['A', 'B'], ['A', 'A'], 204);

export function drawUncertaintyGate(ctx, scene, state, api) {
  const { C, text, line, rect, dot, ticket, focus, after, started, progress } = auditBoard(
    ctx,
    scene,
    state,
    api,
  );
  if (state.beat === 0) {
    focus('interval', () => {
      const upper = wilson(0, 6)[1],
        x = (v) => 585 + v * 1140;
      text('Zero successes in six trials', 113, 280, 48);
      for (let i = 0; i < 6; i++) ticket('0', 665 + i * 150, 375, C.muted);
      for (const [j, method] of ['Wald', 'Wilson'].entries()) {
        const y = 543 + 154 * j;
        text(method, 225, y + 16, 46);
        line(x(0), y, x(1), y, '#464b57', 3);
        dot(x(0), y, 11, C.muted);
        if (j && started('wilson-bound')) {
          line(x(0), y, x(upper), y, C.blue, 8);
          dot(x(upper), y, 12, C.blue);
          if (after('wilson-value'))
            text((100 * upper).toFixed(1) + '%', x(upper), y - 28, 39, C.blue, 'center');
        }
      }
      text('0%', x(0), 806, 32, C.muted, 'center');
      text('100%', x(1), 806, 32, C.muted, 'center');
      if (started('wilson-bound'))
        text('Wilson upper bound   =   1.96² / (6 + 1.96²)', 960, 962, 41, C.ink, 'center');
    });
  } else if (state.beat === 1) {
    focus('pairs', () => {
      const clustered = state.beatP >= 0.36;
      const layout = clustered ? customers : claims;
      if (!layout.plan) {
        text('Source cases', 117, 298, 39);
        text('One resample with replacement', 984, 298, 39);
        const sources = ['p1', 'p4', 'p5', 'p6'],
          sampled = ['p4', 'p4', 'p1', 'p6'];
        const n = Math.ceil(4 * progress('resample'));
        function caseSlip(id, x, y) {
          rect(x, y, 579, 87, C.panel, id === 'p4' ? C.yellow : C.muted);
          text(id, x + 28, y + 55, 35);
          text('Formal', x + 137, y + 55, 30, C.blue);
          text('Conversational', x + 309, y + 55, 30, C.pink);
        }
        sources.forEach((id, i) => caseSlip(id, 117, 360 + 125 * i));
        sampled.slice(0, n).forEach((id, i) => caseSlip(id, 984, 360 + 125 * i));
        text('One draw carries both versions of a claim.', 960, 956, 42, C.yellow, 'center');
        return;
      }
      const count = clustered
        ? Math.max(0, (state.beatP - 0.412) / 0.09)
        : Math.max(0, (state.beatP - 0.06) / 0.072);
      text(clustered ? 'Example customers' : 'Source claims', 118, 288, 41);
      text('One bootstrap sample', 1110, 288, 41);
      function wordings(id, x, y) {
        text(id, x, y, 32);
        text('Formal', x + 106, y, 31, C.blue);
        text('Conversational', x + 255, y, 31, C.pink);
      }
      function packet(id, x, y) {
        const selected = id === (clustered ? 'A' : 'p4');
        const border = selected ? C.yellow : C.muted;
        if (clustered) {
          const rows = id === 'A' ? ['A1', 'A2'] : ['B1'];
          rect(x, y, 558, 59 + rows.length * 51, C.panel, border);
          text('Customer ' + id, x + 22, y + 42, 33, border);
          rows.forEach((claim, i) => wordings(claim, x + 22, y + 93 + 51 * i));
        } else {
          rect(x, y, 558, 81, C.panel, border);
          wordings(id, x + 22, y + 53);
        }
      }
      layout.sources.forEach(({ id, x, y }) => packet(id, x, y));
      for (const copy of layout.plan.at(count)) {
        if (copy.progress === 1) {
          packet(copy.sourceId, copy.x, copy.y);
        } else {
          const x = copy.x - 155 * copy.progress;
          const rows = clustered && copy.sourceId === 'A' ? ['A1', 'A2'] : [copy.sourceId];
          rect(x, copy.y + 8, 148, 15 + rows.length * 48, C.panel, C.yellow);
          rows.forEach((id, i) => {
            const y = copy.y + 36 + i * 48;
            text(id, x + 10, y + 8, 29);
            line(x + 71, y - 6, x + 132, y - 6, C.blue, 5);
            line(x + 71, y + 8, x + 132, y + 8, C.pink, 5);
          });
        }
        if (copy.occurrence > 1 && copy.progress === 1)
          text('×' + copy.occurrence, copy.x + 583, copy.y + 52, 36, C.yellow);
      }
      text(
        clustered
          ? 'Each draw of customer A brings claims A1 and A2.'
          : 'Both wordings travel with their claim.',
        960,
        942,
        40,
        C.ink,
        'center',
      );
    });
  } else {
    focus('interval', () => {
      const second = started('example-two'),
        [lo, hi] = examples[Number(second)];
      const x = (p) => 200 + ((p + 30) / 60) * 1520;
      text('Signed TPR gap   ·   formal minus conversational', 116, 270, 41);
      text('Acceptable range', 960, 357, 35, C.green, 'center');
      rect(x(-margin), 397, x(margin) - x(-margin), 340, C.panel, C.green, 4);
      for (const p of [-margin, margin])
        text((p > 0 ? '+' : '') + p + ' pp', x(p), 795, 35, C.green, 'center');
      line(x(0), 411, x(0), 717, C.muted, 2);
      text('0', x(0), 795, 34, C.muted, 'center');
      if (started(second ? 'example-two' : 'example-one')) {
        line(x(lo), 578, x(hi), 578, C.yellow, 8);
        for (const p of [lo, hi]) {
          dot(x(p), 578, 11, C.yellow);
          text((p > 0 ? '+' : '') + p, x(p), 524, 37, C.yellow, 'center');
        }
      }
      const inside = lo >= -margin && hi <= margin;
      const decided = after(second ? 'uncertainty-fail' : 'uncertainty-pass');
      const verdict = inside
        ? 'PASS: whole interval inside tolerance'
        : 'FAIL: interval exceeds tolerance';
      if (!inside && started('measure-excess')) {
        const left = x(margin);
        const right = left + (x(hi) - left) * progress('measure-excess');
        line(left, 625, right, 625, C.ink, 3);
        for (const end of [left, right]) line(end, 616, end, 634, C.ink, 3);
        if (after('measure-excess'))
          text(hi - margin + ' pp over', (left + right) / 2, 691, 33, C.ink, 'center');
      }
      if (decided && !inside) {
        line(x(margin), 578, x(hi), 578, C.red, 8);
        dot(x(hi), 578, 11, C.red);
      }
      text(
        decided ? verdict : 'Does the whole interval fit between −10 and +10 points?',
        960,
        944,
        41,
        C.ink,
        'center',
      );
      text('Illustrative intervals', 1780, 1022, 27, C.muted, 'right');
    });
  }
}
export default { id: 'uncertainty-gate', draw: drawUncertaintyGate };
