import { column, place, rect, dynamic, table, numberLine } from 'vizmatic/stage';
import { area, chip, mono } from '../kit-narrated.mjs';
import {
  ruleScores,
  exactRoute,
} from '../../films/bitter-lesson-compute-over-heuristics/model.mjs';
import { fixedBudgetPlans } from '../../films/bitter-lesson-compute-over-heuristics/arithmetic.mjs';

export const POLICY_FLOOR = 0.95;

export const BODY = area.inset(0, 'normal');

// The live training worksheet derives token exposure from fixed work.
export function budgetRectangle(s, region, initial = fixedBudgetPlans()[0], fixed = true) {
  const [plotArea, read] = region.rows([4, 1], 'wide');
  const [vertical, plot] = plotArea.columns([1, 3], 'normal');
  const n = s.value(initial.parameters / 1e9),
    d = s.value(initial.tokens / 1e9);
  const maxN = Math.max(...fixedBudgetPlans().map((plan) => plan.parameters)) / 1e9,
    maxD = Math.max(...fixedBudgetPlans().map((plan) => plan.tokens)) / 1e9;
  const tokens = () => (fixed ? (initial.parameters * initial.tokens) / 1e18 / n.value : d.value);
  const base = plot.inset('wide');
  const frame = rect(base.width, base.height, { stroke: 'dim', fill: null, width: 2 }).moveTo(
    base.point('center'),
  );
  const body = dynamic(() => {
    const w = (base.width * n.value) / maxN,
      h = (base.height * tokens()) / maxD;
    return rect(w, h, { fill: 'blue', opacity: 0.35, stroke: 'blue', width: 4 }).moveTo([
      base.left + w / 2,
      base.bottom - h / 2,
    ]);
  });
  const values = dynamic(() => [
    mono('N = ' + n.value.toFixed(0) + 'B', { color: 'blue', size: 36 }).moveTo([
      base.left + (base.width * n.value) / maxN / 2,
      base.bottom + 48,
    ]),
    mono('D = ' + tokens().toFixed(0) + 'B', { color: 'green', size: 29 }).moveTo([
      vertical.point('center')[0],
      base.bottom - (base.height * tokens()) / maxD / 2,
    ]),
  ]);
  return { n, d, frame, body, values, nodes: [frame, body, values] };
}

export function ruleBoard(initialResults = false) {
  const [main, foot] = BODY.rows([5, 1], 'wide');
  const [ports, reports] = main.columns([1, 3], 'loose');
  const conditions = place(
    column(
      ['timeout', 'citation', 'password'].map((word) =>
        chip(word + ' → ' + exactRoute(word), { color: 'dim' }),
      ),
      { gap: 'wide' },
    ),
    ports,
  );
  const data = ruleScores().baselineCases;
  const rows = data.map((r, i) => ({
    id: 'R' + i,
    report: r.text,
    expected: r.expected,
    route: {
      value: initialResults ? r.predicted.replaceAll('_', ' ') : '',
      state: initialResults ? (r.predicted === r.expected ? 'pass' : 'fail') : 'pending',
    },
  }));
  const ledger = place(
    table(
      [
        { key: 'report', label: 'Report', sample: 'the response used an unsupported claim' },
        { key: 'expected', label: 'Reviewed queue', sample: 'latency' },
        { key: 'route', label: 'Router output', sample: 'manual review', marks: true },
      ],
      rows,
      { width: reports.width, size: 34, leading: 1.6, maxRows: 6 },
    ),
    reports,
  );
  return { main, foot, ports, reports, conditions, ledger, data, nodes: [conditions, ledger] };
}

export function gateRuler(scale, initialScore, pointLabel = false) {
  return place(
    numberLine({
      range: [0.9, 1],
      ticks: [0.9, POLICY_FLOOR, 1],
      length: scale.width - 100,
      size: 34,
      labelSize: 34,
      format: (v) => v.toFixed(2),
      thresholds: [{ at: POLICY_FLOOR, label: 'floor', color: 'yellow' }],
      points: [{ name: 'score', value: initialScore, label: pointLabel, color: 'blue' }],
      bands: ['review', 'numeric pass'],
    }),
    scale,
  );
}

export function trainingTotal() {
  return mono((fixedBudgetPlans()[0].flops / 1e21).toFixed(2) + ' zettaFLOPs', {
    size: 54,
    color: 'yellow',
  });
}
