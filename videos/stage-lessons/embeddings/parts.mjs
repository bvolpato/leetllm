// The same plane holds each named fixture. Colors identify owners, not quality.
import { arrow, column, dot, dynamic, group, line, place, rect, row } from 'vizmatic/stage';
import { area, chip, label, mono, note } from '../kit-narrated.mjs';
export { V, RIVER, FINANCE } from '../../films/embeddings/fixtures.mjs';
export { cosine, maskedMean, rotateEmbedding } from '../../films/embeddings/arithmetic.mjs';
export const COLOR = {
  lookup: 'blue',
  river: 'cyan',
  finance: 'green',
  noise: 'pink',
  focus: 'yellow',
  failure: 'red',
};
export const [LEFT, RIGHT] = area.columns([1, 1], 'loose');
export const [CAP, PLOT, FOOT] = LEFT.rows([1, 7, 1], 'normal');
export const [TOP, MID, LOW] = RIGHT.rows([1, 1, 1], 'wide');
export const fmt = (v, digits = 3) =>
  Math.abs(v) < 1e-8 ? '0' : Number(v.toFixed(digits)).toString();
export const vec = (v) => '[' + v.map((x) => fmt(x)).join(', ') + ']';
export const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);

// End states name the fixture and its coordinates. A new fixture changes owners explicitly.
export const STATE = {
  intro: 'two charge lookups [0.8,0.2]; both retrieve phone',
  lookup: 'bank: both copies [0.5,0.5]',
  'table-contract': 'bank row selected; separate charge row [0.8,0.2]',
  neighbors: 'bank context counts [2,1,2,1]',
  'count-ppmi': 'separate apple/pear/river/lake PPMI matrix',
  factorization: 'rank-two fitted word coordinates',
  'predictive-window': 'read -> children, stories, each; night excluded',
  'negative-step': 'center after one fixed-output descent step',
  'shifted-pmi': 'apple-water has zero observed pairs under positive noise exposure',
  'glove-fit': 'log-count residuals and capped weights',
  'subword-components': 'repeated bucket sum [2,2]; mean [2/3,2/3]',
  geometry: 'unit horizontal reference and unit diagonal, cosine 0.707',
  context: 'bank river state [0.31,0.74]; finance state [0.75,0.3]',
  'article-context': 'charge invoice [0.5,0.6]; phone [0.9,0.15]',
  'elmo-layers': 'shared weights, changed token states',
  'visibility-test': 'future replacement leaves first causal state fixed',
  contrast: 'one bank row, two contextual directions',
  pooling: 'masked mean of bank, river, water, padding excluded',
  limits: 'bank population centered by one fixed mean',
  'anisotropy-check': 'pair-centered opposites; population can contain zero',
  'space-contract': 'query and documents rotated together by quarter-turn',
  transfer: 'bank preserved; river clue replaced by money',
  'fresh-representation': 'paired clockwise query and index turn restores both dot-product rankings',
};

/** The frame stays at one place. Data coordinates come from the current fixture. */
export function plane(
  s,
  {
    range = [-0.15, 1.2],
    yRange = range,
    title = 'bank: one stored row',
    xName = 'finance direction',
    yName = 'river direction',
  } = {},
) {
  const plot = PLOT.inset('normal');
  const point = (v) => {
    const xr = typeof range === 'function' ? range() : range,
      yr = typeof yRange === 'function' ? yRange() : yRange;
    const unit = Math.min(plot.width / (xr[1] - xr[0]), plot.height / (yr[1] - yr[0]));
    return [
      plot.point('center')[0] + (v[0] - (xr[0] + xr[1]) / 2) * unit,
      plot.point('center')[1] - (v[1] - (yr[0] + yr[1]) / 2) * unit,
    ];
  };
  const frame = group(
    rect(plot.width, plot.height, { stroke: 'dim', fill: 'surface', width: 2 }).moveTo(
      plot.point('center'),
    ),
    ...[0.25, 0.5, 0.75].flatMap((t) => [
      line([plot.left + t * plot.width, plot.top], [plot.left + t * plot.width, plot.bottom], {
        stroke: 'grid',
        width: 1,
      }),
      line([plot.left, plot.top + t * plot.height], [plot.right, plot.top + t * plot.height], {
        stroke: 'grid',
        width: 1,
      }),
    ]),
  );
  const cap = place(label(title, { color: 'blue' }), CAP);
  const foot = place(row([note(yName), note(' / '), note(xName)], { gap: 'tight' }), FOOT);
  const vector = (get, color = 'blue', origin = () => [0, 0], width = 5) =>
    dynamic(() => {
      const ink = typeof color === 'function' ? color() : color;
      const a = point(origin()),
        b = point(get());
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1) return [dot(6, ink).moveTo(a)];
      return [arrow(a, b, { stroke: ink, width, pad: 0 }), dot(8, ink).moveTo(b)];
    });
  return { frame, cap, foot, point, plot, vector, nodes: [frame, cap, foot] };
}

/** A right-hand lane keeps its name, coordinates, and short role together. */
export function vectorLane(region, name, values, color, sub = '') {
  const items = [
    label(name, { color }),
    mono(typeof values === 'string' ? values : vec(values), { color }),
  ];
  if (sub) items.push(note(sub));
  return place(column(items, { gap: 'normal', align: 'left' }), region, 'left');
}

/** Each colored leg is a weighted contribution in the plane. */
export function accumulation(s, p, terms, { initial = [0, 0], color = 'yellow' } = {}) {
  const progress = s.value(0);
  const state = () => {
    let at = [...initial];
    const legs = [];
    terms.forEach((term, i) => {
      const f = Math.max(0, Math.min(1, progress.value - i));
      const next = at.map((x, j) => x + term.weight * term.values[j] * f);
      legs.push({ from: at, to: next, color: term.color });
      at = next;
    });
    return { legs, total: at };
  };
  const drawing = dynamic(() =>
    state()
      .legs.filter((l) => Math.hypot(...l.to.map((x, j) => x - l.from[j])) > 1e-6)
      .flatMap((l) => [
        arrow(p.point(l.from), p.point(l.to), { stroke: l.color, width: 6, pad: 0 }),
        dot(7, l.color).moveTo(p.point(l.to)),
      ]),
  );
  const total = p.vector(
    () => state().total,
    color,
    () => [0, 0],
    2,
  );
  return { progress, drawing, total, state };
}

/** An angle arc compares two directions in the same equal-scale plane. */
export function angleArc(p, a, b, color = 'yellow', radius = 0.4) {
  return dynamic(() => {
    const av = a(),
      bv = b(),
      from = Math.atan2(av[1], av[0]),
      until = Math.atan2(bv[1], bv[0]);
    const steps = 18,
      points = Array.from({ length: steps + 1 }, (_, i) => {
        const angle = from + ((until - from) * i) / steps;
        return p.point([radius * Math.cos(angle), radius * Math.sin(angle)]);
      });
    return points.slice(1).map((v, i) => line(points[i], v, { stroke: color, width: 4 }));
  });
}
