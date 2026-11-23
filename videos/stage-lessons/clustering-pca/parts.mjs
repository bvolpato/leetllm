import {
  scatter,
  place,
  line,
  circle,
  dynamic,
  group,
  barChart,
  boxOf,
  decimal,
} from 'vizmatic/stage';
import { area, note, label, mono } from '../kit-narrated.mjs';
export {
  xy,
  messages,
  labels,
  seeds,
  centroids,
  pca,
  query,
  clusterTrials,
  transferDocuments,
  transferQuery,
  scaleFixture,
  means,
  stds,
  inertia,
  initialInertia,
  updatedInertia,
  coarseDistances,
} from '../../films/clustering-pca/fixtures.mjs';
export { distance, mix, silhouette, lloyd } from '../../films/clustering-pca/arithmetic.mjs';
export {
  seedMass,
  emptyCenterRepair,
  energyRows,
  scaleCalculation,
  cosine,
  validateModel,
} from '../../films/clustering-pca/model.mjs';
import { xy, messages, labels } from '../../films/clustering-pca/fixtures.mjs';
export const IDS = ['A', 'B', 'C', 'D', 'E', 'F'];
// Colors identify current assignments, not permanent reviewed topic names.
export const COLORS = ['cyan', 'blue', 'pink', 'green'];
export const STATE = {
  intro: 'The original two-coordinate search returns B, just ahead of C.',
  neighbors: 'Original points; all three pairs inspected.',
  'algorithm-contract': 'Original points; shape and finite-value contract checked.',
  kmeans: 'Three model means; assignments 0,0,1,1,2,2.',
  initialization: 'Empty center repaired at F; subsequent fit computed.',
  'seeding-mass': 'Selected A and F; nearest-seed masses recomputed.',
  'choose-k': 'Three-group partition restored.',
  'silhouette-ledger': 'All six scores collected.',
  'objective-ties': 'Separate square split bottom/top.',
  scale: 'Separate metadata fixture standardized.',
  'scale-boundary': 'Same stored transform applied to queries.',
  pca: 'Centered original cloud and first principal line; reversed sign.',
  'solver-contract': 'One fifth of each squared-score total gives its sample variance.',
  compression: 'Searching all six returns C on PC1 and B after the second coordinate is restored.',
  'variance-ledger': 'All six energy contributions collected.',
  'metric-choice': 'Separate vectors normalized.',
  'spherical-centers': 'Separate groups; zero-sum fallback required.',
  'centered-cosine': 'Separate article vectors centered.',
  ivf: 'Original query; two lists open; B recovered.',
  'ivf-work': 'Sixteen of 4096 balanced lists selected; coarse work separate.',
  takeaway: 'A one-coordinate tie returns B by storage order. Both coordinates recover sign-in help.',
  'audit-labels': 'Original six IDs split into singleton groups.',
  'fresh-seed-repair': 'Separate rectangle; better restart inertia four.',
};
export const [ribbon, body, foot] = area.rows([1, 7, 1], 'normal');
export const [left, right] = body.columns([2, 1], 'loose');
export function cloud(region = left, options = {}) {
  const equal = options.equal ?? true;
  const coords = options.coords ?? xy;
  const names = options.names ?? IDS;
  const x = options.x ?? [0, 10],
    y = options.y ?? [0, 6];
  const plotHeight = region.height * (options.heightRatio ?? 0.68);
  const unit = Math.min((region.width * 0.9) / (x[1] - x[0]), plotHeight / (y[1] - y[0]));
  const chart = place(
    scatter(
      coords.map((p, i) => ({
        x: p[0],
        y: p[1],
        name: names[i],
        side: options.autoNames
          ? undefined
          : (options.sides?.[i] ?? ([0, 4].includes(i) ? 'under' : i === 2 ? 'over' : 'right')),
        group: options.assigned ? `g${labels[i]}` : 'none',
        color: options.colors?.[i],
      })),
      {
        width: equal ? unit * (x[1] - x[0]) : region.width * 0.9,
        height: equal ? unit * (y[1] - y[0]) : plotHeight,
        x,
        y,
        labelSize: 34,
        nameSize: 36,
        radius: 15,
        xLabel: options.xLabel ?? 'coordinate 1',
        yLabel: options.yLabel ?? 'coordinate 2',
        groupLabels: false,
        groups: {
          none: { color: 'ink', label: false },
          ...Object.fromEntries(COLORS.map((color, i) => [`g${i}`, { color, label: false }])),
        },
      },
    ),
    region,
  );
  const frame = chart.region();
  const measured = boxOf(chart);
  chart.moveTo([
    measured.cx + region.cx - frame.cx,
    measured.cy + region.cy - region.height * 0.04 - frame.cy,
  ]);
  // This patch layer protects point labels when projection or assignment strokes pass behind them.
  chart.span({ x }, { shaded: false });
  const p = ([a, b]) => {
    const r = chart.region();
    return [
      r.left + ((a - x[0]) / (x[1] - x[0])) * r.width,
      r.bottom - ((b - y[0]) / (y[1] - y[0])) * r.height,
    ];
  };
  return { chart, p, coords, names };
}
export function identity() {
  return place(
    note('A/B: billing     C/D: login     E/F: release     •     invented coordinates'),
    ribbon,
  );
}
export function messageKey(region = right) {
  const rows = region.rows(6, 'normal');
  return messages.map((m, i) =>
    place(label(`${IDS[i]}  ${m.text}`, { size: 34 }), rows[i], 'left'),
  );
}
export function rings(map, centers, colors = COLORS) {
  return centers.map((p, i) =>
    circle(14, { stroke: colors[i], width: 5 }).moveTo(map.p(p)).zIndex(-2),
  );
}
export function links(map, points, centers, assignments, amount = () => 1) {
  return dynamic(() =>
    group(
      ...points.flatMap((p, i) =>
        amount() > i / points.length
          ? [
              line(map.p(p), map.p(centers()[assignments[i]]), {
                stroke: COLORS[assignments[i]],
                width: 4,
                opacity: 0.65,
              }),
            ]
          : [],
      ),
    ),
  ).zIndex(-1);
}
export function scoreBars(region, names, values, options = {}) {
  return place(
    barChart(
      names.map((name, i) => ({
        label: name,
        value: values[i],
        color: options.colors?.[i] ?? COLORS[i % COLORS.length],
      })),
      {
        width: region.width * 0.9,
        height: Math.max(40, region.height - 120),
        labelSize: 34,
        max: options.max ?? Math.max(...values, 1),
        showValues: options.showValues ?? true,
        format: options.format ?? ((v) => v.toFixed(2)),
        ...options,
      },
    ),
    region,
    'bottom',
  );
}
export function liveNumber(region, get, prefix = '', digits = 2, color = 'yellow') {
  const measure = place(mono(`${prefix}99999.9999`, { size: 40, color }), region, 'left');
  const value = decimal(get, { digits, prefix, size: 40, color, font: 'mono' });
  value.moveTo(boxOf(measure).point('center'));
  return value;
}
