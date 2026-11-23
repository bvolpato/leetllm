import {
  arrow,
  assertEqual,
  barChart,
  boxOf,
  column,
  dot,
  dynamic,
  group,
  indicate,
  line,
  place,
  rect,
  row,
  to,
} from 'vizmatic/stage';
import { area, chip, heading, label, mono, namedBox, note } from '../kit-narrated.mjs';
import { POLICY_TOKENS, POLICY_LOGITS } from '../../films/beam-search/fixtures.mjs';
import { stablePolicy } from '../../films/beam-search/arithmetic.mjs';

// Token identity is stable. Yellow is current attention. Red means failure.
export const COLORS = ['cyan', 'blue', 'green', 'pink'];
export const WORDS = POLICY_TOKENS;
export const LOGITS = POLICY_LOGITS;
export const PROBABILITIES = stablePolicy().probabilities;
export const WORKSHEET = [0.568, 0.345, 0.077, 0.01];
export const FLAT = [0.28, 0.25, 0.24, 0.23];
assertEqual(
  WORKSHEET.reduce((sum, p) => sum + Math.round(p * 1000), 0),
  1000,
  'exact filter worksheet mass',
);
assertEqual(
  FLAT.reduce((sum, p) => sum + p, 0),
  1,
  'flat filter worksheet mass',
);
export const STATE = {
  'policy-premise': 'the same prefix takes create by argmax and revoke at draw .75',
  'search-space': 'one ancestral path through a three-way tree',
  'logit-shift': 'normalized original row; uniform .75 selects revoke',
  'logit-boundaries': 'stable finite row; all-masked row rejected',
  'greedy-loop': 'create plus punctuation, EOS separate',
  'opening': 'Mia opening weights remain visible; horizon four and EOS completion stated',
  'probabilities': 'opened/the cumulative product .225 and its log rule are visible',
  'first-beam': 'opened and looked are retained; slept is dashed and readable',
  'search-lattice': 'four columns show completed .153 route and unfinished quietly route',
  'stopping': 'EOS-completed .190 and .153 products remain beside their token paths',
  'length-score': 'mean-log rulers favor opened the door with EOS-inclusive lengths',
  'width': 'widths one/two/three show cumulative work 11/18/25 and raw winners',
  'wider-counterexample': 'retained final masses show width two .09 versus width three .04',
  'length-conventions': 'GNMT and mean-log scoring yield different candidate orderings',
  'penalty-sign': 'seen positive and negative logits decrease; deploy is the new mode',
  'temperature-scale': 'three finite candidates approach equal mass; masked quota remains zero',
  'stream-replay': 'seed-seven streams match; the separate near-tie greedy mode changes',
  'filter-k': 'flat-row top two are normalized; separate tail process reaches .632',
  'filter-p': 'flat row retains all four under top-p .90',
  'filter-min-p': 'flat row retains all four above the .028 cutoff',
  'filter-boundaries': 'unrounded first-three mass .989594 remains below .99',
  'filter-order': 'top-k then top-p retains A; reverse order retains A and B',
  'grammar-bytes': 'partial cre stays in enum state; evidence filter remains separate',
  'local-conditioning': 'whole-string probabilities .069/.931 divide valid masses by .58',
  'best-of-n': 'evaluator ranks A/B/C while generator still ranks B/C/A',
  'process-evidence': 'B first score rises to .99; minima .92/.90 still select A',
  'thought-search': 'reward .2 changes B to three visits and parent to eleven visits',
  'speculative-balance': 'biased redraw .72/.16/.12 differs from target outlines',
  'speculative-block': 'separate all-pass iteration shows three draft tokens plus target draw',
  'audit-receipt': 'two hundred requested answers preserve cohort identities and limited cases',
  'synthesis': 'changed conditional row recomputes frontier and completed winners',
  'fresh-policy': 'the first-word repair selects backup; the reordered complete answer matches the guide at all three steps',
};

export function rotationGuide(region, words = ['create', 'deploy', 'revoke']) {
  const [title, body] = region.rows([1, 2], 'tight');
  const caption = place(note('Retrieved guide · first rotation step?'), title);
  const steps = words.map((word, i) => chip(word, { color: i === 0 ? 'cyan' : 'dim' }));
  const flow = place(row(steps, { gap: 'loose' }), body);
  const links = steps.slice(1).map((step, i) =>
    arrow(boxOf(steps[i]).point('right'), boxOf(step).point('left'), {
      stroke: 'dim',
      pad: 12,
      width: 3,
    }),
  );
  return { nodes: [caption, flow, links], steps };
}

// All sampler scenes share these regions, token columns, and unit-mass geometry.
export function rotationRow(
  s,
  {
    values = PROBABILITIES,
    words = WORDS,
    guide = true,
    max = 1,
    format = (v) => v.toFixed(3),
    live = null,
  } = {},
) {
  const [top, plot, stripRegion, foot] = area.rows([1.25, 4.1, 1, 1.3], 'wide');
  const source = guide ? rotationGuide(top) : { nodes: [], steps: [] };
  const makeChart = () =>
    place(
      barChart(
        words.map((word, i) => ({
          label: word,
          value: (live ? live() : values)[i],
          color: COLORS[i],
        })),
        {
          width: plot.width * 0.94,
          height: plot.height * 0.72,
          max,
          min: Math.min(0, ...values),
          labelSize: 40,
          showValues: true,
          format,
        },
      ),
      plot,
      'bottom',
    );
  const chart = live ? dynamic(makeChart) : makeChart();
  const signedNames =
    max !== 1
      ? words.map((word, i) =>
          place(label(word, { color: COLORS[i] }), stripRegion.columns(words.length, 'none')[i]),
        )
      : [];
  if (max !== 1) chart.labels.forEach((n) => n.opacity(0));
  const masses = values.map((v) => s.value(Math.max(0, v)));
  const enabled = s.value(Number(max === 1));
  const [stripTitle, stripBody] = stripRegion.rows([1, 1], 'tight');
  const strip = dynamic(() => {
    let from = 0;
    const nodes = masses.map((v, i) => {
      const value = live ? live()[i] : v.value;
      const width = Math.max(0.001, value * stripRegion.width);
      const center = [stripRegion.left + (from + value / 2) * stripRegion.width, stripBody.cy];
      from += value;
      return rect(width, stripBody.height, { fill: COLORS[i], stroke: null }).moveTo(center);
    });
    return group(...nodes).opacity(enabled.value);
  });
  const rail = place(
    rect(stripRegion.width, stripBody.height, { stroke: 'dim', fill: null }),
    stripBody,
  );
  const stripName = place(note('Cumulative probability · 0 to 1'), stripTitle, 'left');
  const marker = dot(10, 'yellow').moveTo([stripRegion.left, stripRegion.bottom]);
  const drawLabel = place(mono('u = 0.75', { color: 'yellow' }), foot, 'right');
  return {
    chart,
    strip,
    masses,
    foot,
    top,
    plot,
    stripRegion,
    source,
    marker,
    drawLabel,
    nodes: [...source.nodes, chart, ...signedNames, ...(max === 1 ? [rail, stripName, strip] : [])],
    update(next, duration = 1.2) {
      return [
        chart.update(next, { duration }),
        ...masses.map((v, i) => v.to(Math.max(0, next[i] ?? 0), { duration })),
      ];
    },
    markerAt(u) {
      return [stripRegion.left + u * stripRegion.width, stripRegion.bottom];
    },
  };
}

// One fixed four-step lattice. Scores come from the untouched beam-search model.
export function miaLattice(run, { firstStepPruned = false } = {}) {
  const [header, body, footer] = area.rows([0.6, 6, 1], 'normal');
  const cols = body.columns(4, 'loose');
  const headings = header
    .columns(4, 'loose')
    .map((region, i) => place(note(`Mia · step ${i + 1}`), region));
  const byKey = new Map();
  const columns = run.history.map((step, depth) => {
    const cells = cols[depth].rows(6, 'tight');
    return step.expansions.map((candidate, i) => {
      const slot =
        depth === 0
          ? [0, 3, 5][i]
          : (() => {
              const parent = step.expansions.filter((x) => x.parent === candidate.parent);
              const parents = [...new Set(step.expansions.map((x) => x.parent))];
              return parents.indexOf(candidate.parent) * 3 + parent.indexOf(candidate);
            })();
      const color = COLORS[['opened', 'looked', 'slept'].indexOf(candidate.tokens[0])];
      const cell = cells[slot];
      const pruned = firstStepPruned && depth === 0 && candidate.status === 'pruned';
      const frame = place(
        rect(270, 88, {
          stroke: firstStepPruned && depth === 0 && !pruned ? color : 'dim',
          fill: 'surface',
          radius: 10,
          dash: pruned ? [8, 8] : [],
        }),
        cell,
      );
      const words = place(
        column(
          [
            label(candidate.token, { color: pruned ? 'dim' : color, size: 34 }),
            mono(
              `${candidate.conditionalProbability.toFixed(2)} · Σ ${candidate.logProbability.toFixed(2)}`,
              { size: 29, color: 'dim' },
            ),
          ],
          { gap: 'tight', align: 'center' },
        ),
        cell,
      );
      const entry = { candidate, frame, words, color, slot, cell };
      byKey.set(candidate.tokens.join(' '), entry);
      return entry;
    });
  });
  const edges = columns.map((col, depth) =>
    depth === 0
      ? []
      : col.map((entry) => {
          const parent = byKey.get(entry.candidate.parent);
          return arrow(boxOf(parent.frame).point('right'), boxOf(entry.frame).point('left'), {
            stroke: 'dim',
            width: 2 + 5 * entry.candidate.conditionalProbability,
            pad: 8,
          });
        }),
  );
  const skeleton = [...columns.flatMap((col) => col.map((e) => e.frame)), ...edges.flat()];
  return { columns, headings, skeleton, edges, footer, byKey };
}
