import {
  assertEqual,
  column,
  heatmap,
  indicate,
  place,
  rect,
  arrow,
  boxOf,
  row,
} from 'vizmatic/stage';
import { area, heading, label, mono, note, namedBox } from '../../kit-narrated.mjs';
import { NESTED_Q, NESTED_D } from '../../../films/contrastive-learning/fixtures.mjs';
import { nestedLoss, finiteUnit } from '../../../films/contrastive-learning/arithmetic.mjs';
export default function nestedLossScene(s, c) {
  const [body, foot] = area.rows([7, 1], 'normal');
  const sides = body.columns(2, 'loose');
  const grids = [NESTED_Q, NESTED_D].map((v, i) =>
    place(
      heatmap(v, {
        size: 34,
        cellWidth: 95,
        cellHeight: 85,
        values: true,
        rowLabels: i ? ['d A', 'd B'] : ['q A', 'q B'],
        format: (x) => x.toFixed(2),
      }),
      sides[i],
    ),
  );
  const widths = [2, 4, 6],
    losses = widths.map(nestedLoss);
  const lanes = body.rows(3, 'normal');
  const routes = widths.map((width, i) => {
    const [wRegion, normRegion, scoreRegion, lossRegion] = lanes[i].columns([1, 3, 2, 1], 'loose');
    const q = NESTED_Q.map((v) => v.slice(0, width)),
      d = NESTED_D.map((v) => v.slice(0, width));
    const qn = q.map(finiteUnit),
      dn = d.map(finiteUnit);
    const scores = qn.map((v) => dn.map((w) => v.reduce((sum, x, j) => sum + x * w[j], 0)));
    const widthLabel = place(label('width ' + width, { size: 34, color: 'cyan' }), wRegion);
    const normalization = place(
      column(
        [
          note('separate prefix normalization'),
          mono('q ÷ [' + q.map((v) => Math.hypot(...v).toFixed(3)).join(', ') + ']', {
            size: 34,
            color: 'cyan',
          }),
          mono('d ÷ [' + d.map((v) => Math.hypot(...v).toFixed(3)).join(', ') + ']', {
            size: 34,
            color: 'green',
          }),
        ],
        { gap: 'tight', align: 'center' },
      ),
      normRegion,
    );
    const matrix = heatmap(scores, {
      cellWidth: 120,
      cellHeight: 70,
      size: 34,
      values: true,
      domain: [0, 1],
      format: (v) => v.toFixed(3),
    });
    const score = place(
      column([note('Q̂ D̂ᵀ · τ = 0.2'), matrix], { gap: 'tight', align: 'center' }),
      scoreRegion,
    );
    const result = place(
      column([note('InfoNCE'), mono(losses[i].toFixed(4), { color: 'yellow' })], {
        gap: 'normal',
        align: 'center',
      }),
      lossRegion,
    );
    const links = [
      [widthLabel, normalization],
      [normalization, score],
      [score, result],
    ].map(([a, b]) =>
      arrow(boxOf(a).point('right'), boxOf(b).point('left'), { stroke: 'dim', width: 3, pad: 15 }),
    );
    matrix.numbers.flat().forEach((n) => n.set('visible', false));
    return { widthLabel, normalization, score, matrix, result, links };
  });
  const mean = losses.reduce((a, b) => a + b, 0) / losses.length;
  const average = place(mono('(L₂ + L₄ + L₆) / 3 = ' + mean.toFixed(4), { color: 'yellow' }), foot);
  const count = 10_000_000,
    bytes = 4,
    narrow = 64,
    wide = 768;
  const [storageRegion, shortlistRegion] = body.rows([3, 2], 'loose');
  const storageRows = storageRegion.rows(2, 'loose');
  const tracks = storageRows.map((r) =>
    place(rect(r.width, 45, { fill: 'surface', stroke: 'dim', width: 1 }), r, 'bottom'),
  );
  const bars = [narrow, wide].map((width, i) => {
    const r = storageRows[i],
      w = (r.width * width) / wide;
    return rect(w, 45, { fill: i ? 'blue' : 'cyan', stroke: null }).moveTo([
      r.left + w / 2,
      boxOf(tracks[i]).cy,
    ]);
  });
  const labels = [narrow, wide].map((width, i) =>
    place(
      mono(
        '10M × ' + width + ' × float32 = ' + ((count * width * bytes) / 1e9).toFixed(2) + ' GB raw',
        { color: i ? 'blue' : 'cyan', size: 34 },
      ),
      storageRows[i],
      'top left',
    ),
  );
  const [inside, outside] = shortlistRegion.columns([1, 1], 'loose');
  const boundary = place(
    rect(inside.width, inside.height, { fill: null, stroke: 'yellow', width: 3 }),
    inside,
  );
  const shortlist = place(
    column(
      [
        note('Short-prefix shortlist'),
        label('d₁, d₂ → full-width rescoring', { size: 34, color: 'cyan' }),
      ],
      { gap: 'normal', align: 'center' },
    ),
    inside,
  );
  const omitted = place(
    column(
      [
        note('Outside the selected set'),
        label('required d₃ stays omitted', { size: 34, color: 'red' }),
      ],
      { gap: 'normal', align: 'center' },
    ),
    outside,
  );
  const missing = place(note('Full-width scoring applies only to selected candidates'), foot);
  assertEqual(count * narrow * bytes, 2_560_000_000, 'short-prefix raw bytes');
  const skeleton = routes.flatMap((r) => [r.widthLabel, r.score, r.result.nodes[0], r.links]);
  s.add(heading(c.title), grids);
  c.swap('cl-nested-loss-slice', grids, skeleton);
  c.show(
    'repair-nested-normalize',
    routes.map((r) => r.normalization),
    { after: true },
  );
  c.show(
    'cl-nested-loss-loss',
    routes.map((r) => r.matrix.numbers.flat()),
    { after: true },
  );
  for (const [i, cue] of [
    'cl-nested-loss-two',
    'cl-nested-loss-four',
    'cl-nested-loss-six',
  ].entries())
    c.show(cue, routes[i].result.nodes[1], { after: true });
  c.show('cl-nested-loss-mean', average, { after: true });
  c.swap(
    'repair-nested-search',
    [skeleton, routes.map((r) => r.normalization), routes.map((r) => r.result.nodes[1]), average],
    [tracks, boundary, shortlist, omitted],
  );
  c.show('cl-nested-loss-bytes', [bars, labels], { after: true });
  c.show('cl-nested-loss-missing', missing);
}
