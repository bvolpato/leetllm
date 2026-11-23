import { assertEqual, axes, boxOf, dot, dynamic, place, rect } from 'vizmatic/stage';
import { area, mono } from '../kit-narrated.mjs';
export {
  DOCS,
  TERMS,
  QUERY,
  CATALOG,
  BINARY_TRACE,
  APPENDS,
  APPEND_EVENTS,
  SCORES,
  SCORE_TRACE,
  HEAP_TRACE,
  PAIRS,
  DEDUP,
  PREFIX_WORDS,
  PREFIX_QUERY,
  CACHE_SHAPE,
} from '../../films/algorithm-complexity/fixtures.mjs';
export {
  hashKey,
  budgetFor,
  decodeCostTrace,
  rankLexical,
  rank,
} from '../../films/algorithm-complexity/arithmetic.mjs';
export {
  buildRadixTree,
  cacheValueBytes,
  shortlist,
  radixPrefixTrace,
} from '../../films/algorithm-complexity/model.mjs';
export const COLOR = {
  input: 'cyan',
  stored: 'blue',
  retained: 'green',
  added: 'pink',
  focus: 'yellow',
  failure: 'red',
};
export const [PICTURE, FOOT] = area.rows([7, 1.5], 'wide');
export const NAMES = ['login fixture', 'runner clock', 'issuer config', 'release list'];
export const STATE = {
  opening: { visited: 4 },
  scan: { visited: 8, input: 8, comparisonInput: 32 },
  'ordered-search': { midpoints: [4, 2, 3], replay: [4, 2, 1, 0], inserted: true },
  'hash-lookup': { chainChecks: 4 },
  'radix-prefix': { scan: 12, shared: 3 },
  'amortized-append': { items: 8, writes: 14 },
  'vector-score': { n: 8, d: 6, products: 48 },
  'top-k': { winners: ['issuer-check', 'token-fixture'], products: 12 },
  'unique-pairs': { n: 8, pairs: 28, unique: 3 },
  attention: { keys: 11, reads: 30 },
  'cache-volume': { length: 4096, gib: 8 },
  'queue-measurement': { formation: 10, executionQueue: 20 },
  'work-budget': { products: 1536000, k: 1, scored: false },
  'shortlist-payoff': { k: 3, hits: 2 },
};
export function squareOrder(r, k) {
  if (r < 4 && k < 4) return r * 4 + k;
  const edge = Math.max(r, k);
  return edge * edge + (k === edge && r < edge ? r : edge + k);
}
const squareOrders = Array.from({ length: 64 }, (_, i) => squareOrder(Math.floor(i / 8), i % 8));
assertEqual(new Set(squareOrders).size, 64, 'each square cell is counted once');
assertEqual(Math.max(...squareOrders), 63, 'square growth covers all sixty-four cells');
assertEqual(squareOrders.filter((x) => x < 16).length, 16, 'the original square persists');
// The same measured grid is used for note pairs and attention positions.
export function comparisonGrid(
  s,
  region,
  { n, filled, mode, labelFor = (i) => String.fromCharCode(65 + i) },
) {
  const side = Math.min(region.width, region.height) - 80;
  const measure = place(rect(side, side), region);
  const cells = boxOf(measure)
    .rows(8, 'tight')
    .flatMap((r) => r.columns(8, 'tight'));
  const picture = dynamic(() => [
    ...cells.flatMap((cell, i) => {
      const r = Math.floor(i / 8),
        k = i % 8,
        size = Math.round(n.value);
      const present = r < size && k < size;
      const selected = mode.value === 0 ? k > r : mode.value === 1 ? true : k <= r;
      const order =
        mode.value === 0 ? (k * (k - 1)) / 2 + r : mode.value === 1 ? squareOrder(r, k) : r * 8 + k;
      const done = present && selected && order < Math.floor(filled.value + 1e-7);
      return [
        rect(cell.width, cell.height, {
          fill: done ? (mode.value === 0 ? 'cyan' : 'blue') : 'surface',
          stroke: present ? (selected ? 'dim' : 'grid') : 'faint',
          width: 2,
          opacity: present ? 1 : 0.45,
        }).moveTo(cell.point('center')),
      ];
    }),
    ...Array.from({ length: 8 }, (_, i) => {
      const a = cells[i],
        b = cells[i * 8],
        color = i < Math.round(n.value) ? 'dim' : 'faint';
      return [
        mono(labelFor(i), { size: 34, color }).moveTo([a.cx, a.top - 34]),
        mono(labelFor(i), { size: 34, color }).moveTo([b.left - 34, b.cy]),
      ];
    }).flat(),
  ]);
  return { picture, cells };
}
// The vertical axis marks powers of two so all four reference counts fit on one plot.
export function growthChart(s, region, input) {
  const plot = place(
    axes({
      x: [0, 32],
      y: [0, 10.5],
      width: region.width - 130,
      height: region.height - 140,
      xStep: 8,
      yStep: 2,
      labelSize: 34,
      labels: false,
      grid: true,
      xLabel: 'n',
      yLabel: '',
    }),
    region,
  );
  const functions = [
    { f: (n) => n, color: 'cyan' },
    { f: (n) => n * Math.log2(Math.max(1, n)), color: 'pink' },
    { f: (n) => n * n, color: 'ink' },
    { f: (n) => Math.log2(Math.max(1, n)), color: 'blue' },
  ];
  functions.forEach(({ f, color }) =>
    plot.plot((n) => Math.log2(Math.max(1, f(n))), { stroke: color, width: 4, from: 1, to: 32 }),
  );
  const markers = dynamic(() => [
    mono('work · log scale', { size: 34, color: 'dim' }).moveTo([
      plot.world(0, 10.5)[0] + 210,
      plot.world(0, 10.5)[1] - 36,
    ]),
    ...functions.map(({ f, color }) =>
      dot(9, color).moveTo(plot.world(input.value, Math.log2(Math.max(1, f(input.value))))),
    ),
    ...[0, 2, 4, 6, 8, 10].map((y) => {
      const p = plot.world(0, y);
      return mono(String(2 ** y), { size: 34, color: 'dim' }).moveTo([p[0] - 60, p[1]]);
    }),
    ...[4, 8, 16, 32].map((x) => {
      const p = plot.world(x, 0);
      return mono(String(x), { size: 34, color: 'dim' }).moveTo([p[0], p[1] + 38]);
    }),
  ]);
  return { plot, markers };
}
