// The policy task, its identities, and the measured geometry used by this film.
import { axes, fitted, place, row, scatter } from 'vizmatic/stage';
import { area, chip, heading, label } from '../kit-narrated.mjs';
export * from '../../films/embedding-projection/model.mjs';
export * from '../../films/embedding-projection/fixtures.mjs';
export {
  cauchyMap,
  mapPairFixture,
  pairDistanceFor,
  savedCoordinates,
  tsneTerm,
  unitFinite,
} from '../../films/embedding-projection/arithmetic.mjs';
export const COLORS = {
  rotation: 'green',
  security: 'blue',
  access: 'pink',
  query: 'cyan',
  focus: 'yellow',
  failure: 'red',
};
export const NAMES = ['R1', 'R2', 'S1', 'S2', 'A1', 'A2'];
export const POINT_COLORS = NAMES.map((_, i) => ['green', 'blue', 'pink'][Math.floor(i / 2)]);
export const [TOP, BODY, FOOT] = area.rows([1, 6, 1], 'normal');
export const [LEFT, RIGHT] = BODY.columns([3, 2], 'loose');
export const STATE = {
  opening: 'the merge clause and the key question share a map address',
  budget: '256 float32 coordinates',
  projection: 'the nearest clause changes when the merge depth is restored',
  methods: 'leading PCA axis and separate neighbor objective',
  tsne: 'pair q equals p',
  umap: 'union weight 0.92',
  verify: 'three of six hand-map neighbors match',
  serving: 'one saved artifact for both lanes',
  'policy-baseline': 'two relevant clauses retrieved',
  'geometry-budget': 'raw vectors separated from full-index costs',
  'pca-fit': 'centered diagonal fixture',
  'pca-query': 'centering changes the angle and a query at the mean has no direction',
  'recall-sweep': 'a fixed six-dimensional index loses judged chunks as document noise rises',
  'tsne-contract': 'all map pairs share a normalizer',
  'umap-contract': 'graph memberships and map forces separated',
  'random-projection': 'fixed matrix, measured overlap 0.317',
  'scalar-binary': 'sign bits lose magnitudes',
  'product-quantization': 'one centroid ID per block',
  'native-prefix': 'shortlist limits rescoring',
  'release-experiment': 'invalid native recall leaves no eligible candidate',
  'fresh-projection': 'the shared artifact puts the rotation rule back above the merge rule',
};
export function taskHeader() {
  return place(
    row(
      [
        label('May an 18-day-old key stay active?', { size: 36, color: 'cyan' }),
        ...NAMES.map((name, i) => chip(name, { color: POINT_COLORS[i] })),
      ],
      { gap: 'wide' },
    ),
    TOP,
  );
}
export function begin(s, c, id, title, nodes, header) {
  s.add(heading(title), header, nodes);
}
export function policyCloud(
  region = LEFT,
  source = [
    [0, 0],
    [0.2, 0],
    [3, 0],
    [3.2, 0],
    [0, 3],
    [0.2, 3],
  ],
  names = true,
  options = {},
) {
  const { queryPoint, ...plotOptions } = options;
  return place(
    fitted(region.inset('wide'), (width) =>
      scatter(
        source
          .map(([x, y], i) => ({
            x,
            y,
            name: NAMES[i],
            label: names ? NAMES[i] : false,
            color: POINT_COLORS[i],
            side: i % 2 ? 'right' : 'left',
          }))
          .concat(queryPoint ? [queryPoint] : []),
        {
          width,
          height: region.height * 0.65,
          x: [-1, 5.5],
          y: [-1, 5.5],
          radius: 12,
          labelSize: 34,
          nameSize: 36,
          grid: true,
          groupLabels: false,
          ...plotOptions,
        },
      ),
    ),
    region,
  );
}
export function mathPlot(region, options = {}) {
  return place(
    axes({
      width: region.width * 0.76,
      height: region.height * 0.66,
      x: [-4, 4],
      y: [-3, 3],
      labels: false,
      grid: true,
      tips: false,
      labelSize: 34,
      ...options,
    }),
    region,
  );
}
// The recall plot uses a logarithmic byte axis so the small PQ code remains visible.
export const CANDIDATES = [
  { name: 'full', bytes: 6144, recall: 1 },
  { name: 'native', bytes: 1024, recall: 0.984 },
  { name: 'PCA', bytes: 1024, recall: 0.971 },
  { name: 'PQ', bytes: 16, recall: 0.939 },
];
