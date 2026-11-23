import { validateModel as verifyTeachingModel } from '../../films/vectors/model.mjs';
import { arrow, beside, boxOf, dot, dynamic, group, line, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../kit-narrated.mjs';
export {
  H,
  P,
  R,
  WORDS,
  REQUEST_X,
  REQUEST_W,
  AXIS_TRAP,
  FRESH_H,
} from '../../films/vectors/fixtures.mjs';
export {
  BASE_OUTPUT,
  COMPOSED,
  REQUEST_Y,
  transform,
  transformBatch,
  scale,
  add,
  sumRows,
  mean,
  transpose,
  gram,
  batchedScoreState,
  validateModel,
  extendedFrame,
} from '../../films/vectors/model.mjs';

// A color identifies a coordinate throughout the film. Yellow marks the active calculation.
export const COLOR = {
  first: 'blue',
  second: 'pink',
  word: 'cyan',
  control: 'green',
  active: 'yellow',
  invalid: 'red',
};
export const fmt = (v) => (typeof v === 'number' ? String(Number(v.toFixed(3))) : String(v));
export const STATE = {
  intro: 'Password returns to [0.5, 0.5] and its three output bars return to 0.5.',
  coordinates: 'Password (0.5,0.5), reset swapped to (0,1).',
  directions: 'Both rows of P are complete output directions.',
  mixture: 'Password maps to (0.5,0.5,0.5).',
  dot: 'Third dot product is 0.5.',
  composition: 'Both routes reach (1,1).',
  rows: 'Three projected word rows.',
  tensor: 'Two messages, three tokens, three outputs.',
  'local-edit': 'Only password changes to (1.5,0.5,1).',
  'latency-gradient': 'Weights (1.6,1.8), separate from the next stated rule.',
  'latency-dot': 'Named order restored, five seconds.',
  'request-batch': 'Three independent predictions (2,5,7).',
  'many-outputs': 'Request outputs (2,0.2), (5,1.9), (7,2.1).',
  'shape-guard': 'Two documented features match two weight rows.',
  broadcasting: 'Feature and request offsets agree on B.priority but disagree on B.time.',
  'pairwise-scores': 'Symmetric Gram matrix, diagonal (1,1,0.5).',
  'normalized-scores': 'Nonzero directions normalized, zero rejected.',
  'batched-transpose': 'Prompt ownership preserved, correct diagonal (1,0.5).',
  pooling: 'Summary (0.5,0.5,0.5), order lost.',
  'padding-mask': 'Only real tokens count, empty denominator rejected.',
  'input-guards': 'Valid tensor passes, malformed inputs stop.',
  'linear-api': 'P is stored transposed, bias repeats over tokens.',
  'fresh-case':
    'The same projected rows give (1,2/3,5/6) with three real tokens and (0.75,0.5,0.625) with four.',
};

export function frame(c) {
  const [body, foot] = area.rows([8, 1], 'normal');
  return { title: heading(c.title), body, foot };
}

// This owned table is the word/request example itself. Its fixed cell geometry survives value changes.
export function ownedTable(
  region,
  {
    title,
    rows,
    columns,
    values,
    colors = [],
    valueColors = () => colors,
    cellColor,
    active = () => -1,
    activeCell = () => [-1, -1],
  },
) {
  const bands = region.rows([0.8, 0.7, ...rows.map(() => 1.4)], 'tight');
  const header = bands[1].columns([1.8, ...columns.map(() => 1)], 'tight');
  const names = [
    place(label(title, { size: 34 }), bands[0]),
    place(note('owner'), header[0], 'left'),
    ...columns.map((name, j) => place(note(name), header[j + 1])),
  ];
  const cells = [],
    rowNodes = [],
    cellRegions = [],
    numbers = [],
    frames = [];
  rows.forEach((name, i) => {
    const slots = bands[i + 2].columns([1.8, ...columns.map(() => 1)], 'tight');
    const color = colors[i] ?? 'cyan';
    const owner = place(label(name, { color, size: 34 }), slots[0], 'left');
    const current = [owner];
    cells[i] = [];
    cellRegions[i] = [];
    numbers[i] = [];
    frames[i] = [];
    columns.forEach((_, j) => {
      const r = slots[j + 1];
      const plate = rect(r.width, r.height * 0.78, {
        stroke: 'grid',
        fill: 'surface',
        radius: 8,
      }).moveTo(r.point('center'));
      const number = dynamic(() =>
        mono(fmt(values()[i][j]), {
          size: 38,
          color:
            active() === i || (activeCell()[0] === i && activeCell()[1] === j)
              ? 'yellow'
              : (cellColor?.(i, j) ?? valueColors()[i] ?? color),
        }).moveTo(r.point('center')),
      );
      const cell = [plate, number];
      numbers[i][j] = number;
      frames[i][j] = plate;
      cells[i][j] = cell;
      cellRegions[i][j] = r;
      current.push(...cell);
    });
    rowNodes.push(current);
  });
  return {
    nodes: [...names, ...rowNodes.flat()],
    rows: rowNodes,
    cells,
    regions: cellRegions,
    bands,
    numbers,
    frames,
    names,
    owners: rowNodes.map((r) => r[0]),
  };
}

// A large equal-unit plane retains the two-dimensional view while full strips retain every output.
export function vectorPlane(
  region,
  {
    title = 'coordinate view',
    x = 'first coordinate',
    y = 'second coordinate',
    min = -0.25,
    max = 2.25,
  } = {},
) {
  const [head, room, foot] = region.rows([1, 8, 1], 'normal');
  const plot = room.inset('wide');
  const unit = Math.min(plot.width, plot.height) / (max - min);
  const center = plot.point('center');
  const world = (a, b) => [
    center[0] + (a - (min + max) / 2) * unit,
    center[1] - (b - (min + max) / 2) * unit,
  ];
  const grid = [];
  for (let v = Math.ceil(min); v <= Math.floor(max); v++) {
    grid.push(
      line(world(v, min), world(v, max), {
        stroke: v === 0 ? 'dim' : 'grid',
        width: v === 0 ? 3 : 1,
      }),
    );
    grid.push(
      line(world(min, v), world(max, v), {
        stroke: v === 0 ? 'dim' : 'grid',
        width: v === 0 ? 3 : 1,
      }),
    );
  }
  const ticks = [];
  for (let v = Math.ceil(min * 2) / 2; v <= max; v += 0.5) {
    const a = world(v, min),
      b = world(min, v);
    grid.push(line(a, [a[0], a[1] + 8], { stroke: 'dim', width: 2 }));
    grid.push(line([b[0] - 8, b[1]], b, { stroke: 'dim', width: 2 }));
    ticks.push(mono(fmt(v), { size: 29, color: 'dim' }).moveTo([a[0], a[1] + 32]));
    ticks.push(mono(fmt(v), { size: 29, color: 'dim' }).moveTo([b[0] - 58, b[1]]));
  }
  const captions = [
    place(label(title, { size: 34 }), head),
    place(note(x + ' →   /   ' + y + ' ↑'), foot),
  ];
  const mark = (get, color = 'cyan', from = () => [0, 0]) =>
    dynamic(() => {
      const a = from(),
        b = get();
      const p = world(...a),
        q = world(...b);
      return Math.hypot(q[0] - p[0], q[1] - p[1]) < 2
        ? dot(5, color).moveTo(p)
        : arrow(p, q, { stroke: color, width: 7, pad: 0 });
    });
  const point = (get, color = 'cyan') => dynamic(() => dot(10, color).moveTo(world(...get())));
  return { nodes: [...grid, ...ticks, ...captions], lines: grid, world, mark, point };
}

// Coordinate accumulators share one zero and one scale. Their lengths follow the actual arithmetic.
export function accumulators(
  region,
  { title, names, values, max = 2, color = 'yellow', format = fmt, reference = [] },
) {
  const bands = region.rows([1.4, ...names.map(() => 1.6)], 'normal');
  const titleNode = place(label(title, { size: 34 }), bands[0]);
  const nodes = [titleNode];
  const referenceMarks = [];
  const readings = [];
  names.forEach((name, i) => {
    const [nameSlot, barSlot, valueSlot] = bands[i + 1].columns([1.2, 3, 1], 'normal');
    nodes.push(place(note(name), nameSlot, 'left'));
    const rail = rect(barSlot.width, barSlot.height * 0.45, {
      stroke: 'grid',
      fill: 'surface',
      radius: 3,
    }).moveTo(barSlot.point('center'));
    const fill = dynamic(() => {
      const v = values()[i];
      const amount = typeof v === 'number' ? Math.max(0.001, Math.min(1, v / max)) : 0.001;
      return rect(barSlot.width * amount, barSlot.height * 0.45, {
        fill: color,
        stroke: color,
        radius: 3,
      }).moveTo([barSlot.left + (barSlot.width * amount) / 2, barSlot.cy]);
    });
    const value = dynamic(() =>
      mono(format(values()[i]), {
        color: typeof values()[i] === 'number' ? color : 'red',
        size: 38,
      }).moveTo(valueSlot.point('center')),
    );
    nodes.push(rail, fill, value);
    readings.push(fill, value);
    if (reference[i] !== undefined) {
      const x = barSlot.left + (reference[i] / max) * barSlot.width;
      referenceMarks.push(
        line([x, barSlot.cy - barSlot.height * 0.33], [x, barSlot.cy + barSlot.height * 0.33], {
          stroke: 'cyan',
          width: 4,
        }),
      );
    }
  });
  return { nodes, referenceMarks, readings };
}

// The two named request-feature contributions join on one seconds ruler.
export function durationStrip(region, values, max = 8, colors = () => ['blue', 'pink']) {
  const [head, plot, ticks, foot] = region.rows([1.2, 2.5, 1.2, 1.3], 'normal');
  const scale = [place(label('Time accumulated (seconds)', { size: 34 }), head)];
  const rail = rect(plot.width, plot.height * 0.35, { stroke: 'grid', fill: 'surface' }).moveTo(
    plot.point('center'),
  );
  scale.push(rail);
  for (let value = 0; value <= max; value++) {
    const x = plot.left + (value / max) * plot.width;
    scale.push(line([x, ticks.top], [x, ticks.top + 8], { stroke: 'dim', width: 2 }));
    scale.push(mono(String(value), { size: 29, color: 'dim' }).moveTo([x, ticks.cy + 8]));
  }
  const contributions = [];
  for (let i = 0; i < 2; i++)
    contributions.push(
      dynamic(() => {
        const v = values();
        const start = i ? v[0] : 0;
        const width = Math.max(0.001, (v[i] / max) * plot.width);
        return rect(width, plot.height * 0.35, {
          fill: colors()[i],
          stroke: colors()[i],
        }).moveTo([plot.left + (start / max) * plot.width + width / 2, plot.cy]);
      }),
    );
  contributions.push(
    dynamic(() => mono(values().map(fmt).join(' + '), { size: 40 }).moveTo(foot.point('center'))),
  );
  const marker = (at) => {
    const x = plot.left + (at / max) * plot.width;
    return line([x, plot.cy - plot.height * 0.37], [x, plot.cy + plot.height * 0.37], {
      stroke: 'cyan',
      width: 4,
    });
  };
  return { scale, contributions, marker };
}

verifyTeachingModel();
export const vectorText = (values) => '[' + values.map(fmt).join(', ') + ']';

// Word and request ownership stays attached to the actual matrix-product grids.
export function productOwners(product, kind = 'words') {
  const names = kind.startsWith('requests') ? ['A', 'B', 'C'] : ['reset', 'my', 'password'];
  const scores = kind === 'scores';
  const columns = kind.startsWith('requests') ? ['prompt', 'queue'] : ['f0', 'f1'];
  const outputs = scores
    ? names
    : product.c.colCount === 1
      ? ['seconds']
      : kind.startsWith('requests')
        ? ['time', 'priority']
        : ['out 0', 'out 1', 'out 2'];
  for (const caption of product.captions) caption.set('visible', false);
  for (const sign of product.signs) sign.set('visible', false);
  const nodes = [];
  const grids = [product.a, product.b, product.c];
  const titles = kind.startsWith('requests')
    ? ['X', 'W', 'Y']
    : scores
      ? ['H', 'H.T', 'H @ H.T']
      : ['H', 'P', 'H @ P'];
  const headerY = Math.min(...grids.map((grid) => grid.region().top)) - 120;
  if (kind !== 'requests-batch')
    grids.forEach((grid, i) =>
      nodes.push(label(titles[i], { size: 34, color: 'dim' }).moveTo([grid.region().cx, headerY])),
    );
  for (const grid of [product.a, product.c])
    names.forEach((name, i) =>
      nodes.push(
        beside(
          label(name, { size: 29, color: name === 'password' || name === 'B' ? 'cyan' : 'green' }),
          grid.region({ row: i }),
          'left',
          'normal',
        ),
      ),
    );
  columns.forEach((name, j) =>
    nodes.push(beside(note(name), product.a.region({ col: j }), 'above', 'normal')),
  );
  columns.forEach((name, i) =>
    nodes.push(beside(note(name), product.b.region({ row: i }), 'left', 'normal')),
  );
  const weightColumns = scores ? names : outputs;
  weightColumns.forEach((name, j) =>
    nodes.push(
      beside(
        note(name, { size: scores ? 26 : 29 }),
        product.b.region({ col: j }),
        'above',
        'normal',
      ),
    ),
  );
  outputs.forEach((name, j) =>
    nodes.push(
      beside(
        note(name, { size: scores ? 26 : 29 }),
        product.c.region({ col: j }),
        'above',
        'normal',
      ),
    ),
  );
  return nodes;
}
