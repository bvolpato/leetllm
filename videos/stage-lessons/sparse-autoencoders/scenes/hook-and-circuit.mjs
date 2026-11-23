// Scene `hook-and-circuit`: where a dictionary attaches to a model, and what a circuit claims.
//
// The picture: one model of three layers for the whole scene. A stream runs from the tokens to
// the logits, and each layer has an attention branch over it and an MLP branch under it. The
// hook moves from site to site. Then three features send their contributions to the logits, and
// one of them leaves. Then a feature of a transcoder writes to the MLP outputs of its layer and
// of later layers. Then attention freezes, and one edge of a graph for one prompt lights.
import {
  arrow,
  assertEqual,
  boxOf,
  circle,
  column,
  decimal,
  dot,
  draw,
  dynamic,
  fade,
  grid,
  indicate,
  line,
  pictogram,
  place,
  recolor,
  rect,
  row,
  seededRandom,
  text,
} from 'vizmatic/stage';
import { area, chipRow, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { COLOR } from '../parts.mjs';

const LAYERS = 3;
/** The readout of the article: three features, their weights, and their activations. */
const READOUT = {
  names: ['Credential', 'Urgency', 'Formatting'],
  weights: [1.2, 0.1, 0],
  activations: [0.9, 0.8, 0.7],
  colors: [COLOR.first, COLOR.second, 'dim'],
};

/** A cloud of dots in a cell: the values that one site holds. `shape` gives a point from two random numbers. */
function cloud(cell, color, seed, shape) {
  const random = seededRandom(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  return Array.from({ length: 44 }, () => {
    const [u, v] = shape(gauss(), gauss());
    return dot(4, color, { opacity: 0.8 }).at(
      cell.cx + Math.max(-1, Math.min(1, u / 2.6)) * (cell.width / 2 - 8),
      cell.cy - Math.max(-1, Math.min(1, v / 2.6)) * (cell.height / 2 - 8),
    );
  });
}

export default function hookAndCircuit(s, c) {
  const contributions = READOUT.weights.map((weight, i) => weight * READOUT.activations[i]);
  const total = contributions.reduce((sum, value) => sum + value, 0);
  assertEqual(
    [Number(total.toFixed(9)), Number((total - contributions[0]).toFixed(9))],
    [1.16, 0.08],
    'the readout, and the readout without its first feature',
  );

  // The model: tokens, three layers, logits. Each layer has an attention branch over the stream and an MLP branch under it.
  const [modelBand, lowerBand] = area.rows([5, 3], 'normal');
  const cells = modelBand
    .columns([2, 3, 3, 3, 2], 'tight')
    .map((cell) => cell.rows([2, 1, 2], 'none'));
  const streamY = cells[0][1].cy;
  const tokensBox = place(
    namedBox('tokens', { width: 170, height: 84, color: 'dim' }),
    cells[0][1],
  );
  const logitsBox = place(
    namedBox('logits', { width: 170, height: 84, color: 'dim' }),
    cells[4][1],
  );
  const stream = line(boxOf(tokensBox).point('right'), boxOf(logitsBox).point('left'), {
    stroke: 'dim',
    width: 6,
  });
  const layers = Array.from({ length: LAYERS }, (_, index) => {
    const [upper, , lower] = cells[index + 1];
    const attention = place(
      namedBox('attention', { width: 200, height: 84, color: 'dim' }),
      upper.columns(2, 'none')[0],
    );
    const mlp = place(
      namedBox('MLP', { width: 200, height: 84, color: 'dim' }),
      lower.columns(2, 'none')[1],
    );
    const branch = (box, over) => {
      const b = boxOf(box);
      const edge = over ? b.bottom : b.top;
      const readX = b.left + b.width * 0.3,
        writeX = b.right - b.width * 0.3;
      return {
        read: arrow([readX, streamY], [readX, edge], { stroke: 'dim', width: 3, pad: 8 }),
        write: arrow([writeX, edge], [writeX, streamY], { stroke: 'dim', width: 3, pad: 8 }),
        out: [writeX, (edge + streamY) / 2],
        readAt: [readX, streamY],
      };
    };
    return {
      attention,
      mlp,
      a: branch(attention, true),
      m: branch(mlp, false),
      after: [cells[index + 1][1].right, streamY],
    };
  });
  const model = [
    tokensBox,
    logitsBox,
    stream,
    ...layers.flatMap((layer) => [
      layer.attention,
      layer.mlp,
      layer.a.read,
      layer.a.write,
      layer.m.read,
      layer.m.write,
    ]),
  ];
  s.add(heading(c.title), model);

  // Beat 0. The hook moves between three sites, and each site holds other values.
  const sites = [layers[0].after, layers[1].m.out, layers[1].a.out];
  const where = s.value(0);
  const hook = dynamic(() => {
    const low = Math.min(sites.length - 2, Math.floor(where.value));
    const share = where.value - low;
    const at = [
      sites[low][0] + (sites[low + 1][0] - sites[low][0]) * share,
      sites[low][1] + (sites[low + 1][1] - sites[low][1]) * share,
    ];
    return circle(22, { stroke: COLOR.mark, width: 6, fill: null }).at(...at);
  });
  const [siteBand, cloudBand] = lowerBand.columns([5, 2], 'wide');
  const siteNames = [
    ['residual', 'the shared state so far', COLOR.first],
    ['MLP output', 'the update of one branch', COLOR.second],
    ['attention output', 'routed context, before it merges', COLOR.other],
  ];
  const siteRows = siteNames.map(([name, meaning, color]) => [
    label(name, { color }),
    label(meaning),
  ]);
  place(
    grid(siteRows.flat(), { columns: 2, gap: ['wide', 'normal'], even: true }),
    siteBand,
    'left',
  );
  const cloudCells = cloudBand.rows(3, 'tight');
  const clouds = [
    cloud(cloudCells[0], COLOR.first, 3, (u, v) => [u, v]),
    cloud(cloudCells[1], COLOR.second, 4, (u, v) => [Math.abs(u) ** 2.2 - 1.6, v * 0.35]),
    cloud(cloudCells[2], COLOR.other, 5, (u, v) => [u + v * 0.2, u * 0.8 + v * 0.25]),
  ];
  s.add(hook, siteRows[0]);
  c.on('hook-mlp', () => s.play(where.to(1, { duration: 1 })));
  c.show('hook-mlp', siteRows[1]);
  c.on('hook-attn', () => s.play(where.to(2, { duration: 1 })));
  c.show('hook-attn', siteRows[2]);
  c.show('hook-and-circuit-b0', clouds[0], { after: true });
  c.show('hook-width', [clouds[1], clouds[2]]);
  const match = [
    note('match all of these'),
    chipRow(
      [
        'checkpoint',
        'layer',
        'token position',
        'normalization',
        'projection',
        'centering',
        'rescaling',
        'dtype',
      ],
      {
        maxWidth: lowerBand.width,
        color: COLOR.mark,
        stroke: COLOR.mark,
      },
    ),
  ];
  place(column(match, { gap: 'tight', align: 'left' }), lowerBand, 'left');
  c.swap('hook-match', [...siteRows.flat(), ...clouds.flat()], match);
  // A joint dictionary has a hook at every site, and it is trained on all of them.
  const joint = sites
    .slice(0, 2)
    .map((at) => circle(22, { stroke: COLOR.mark, width: 6, fill: null }).at(...at));
  const jointNote = place(
    label('a joint dictionary: trained on every site', { color: COLOR.mark }),
    lowerBand,
    'bottom',
  );
  c.show('hook-joint', [...joint, jointNote]);

  // Beat 1. A circuit: three features send their contributions along the stream to the logits.
  const kept = s.value(1);
  const formatting = s.value(1);
  const activation = (i) => READOUT.activations[i] * [kept.value, 1, formatting.value][i];
  const contribution = (i) => activation(i) * READOUT.weights[i];
  const start = layers[0].after;
  const end = boxOf(logitsBox).point('left');
  const lanes = [-16, 0, 16];
  const paths = READOUT.colors.map((color, i) => [
    line([start[0], streamY + lanes[i]], [end[0], streamY + lanes[i]], { stroke: color, width: 5 }),
    dot(13, color).at(start[0], streamY + lanes[i]),
  ]);
  const [termBand, scoreBand] = lowerBand.columns([2, 3], 'wide');
  const [keyBand, ...termRows] = termBand.rows([0.75, 1, 1, 1], 'tight');
  const terms = [
    place(note('Activation × weight = score contribution'), keyBand, 'left'),
    ...termRows.flatMap((band, i) => [
      text(READOUT.names[i], { size: 34, color: READOUT.colors[i], anchor: 'left' }).at(
        band.left,
        band.cy,
      ),
      dynamic(() =>
        text(
          `${activation(i).toFixed(1)} × ${READOUT.weights[i].toFixed(1)} = ${contribution(i).toFixed(2)}`,
          { size: 33, font: 'mono', color: READOUT.colors[i], anchor: 'right' },
        ).at(band.right, band.cy),
      ),
    ]),
  ];
  // The contributions on one ruler, tip to tail.
  const ruler = { max: 1.3, y: scoreBand.cy + 30 };
  const at = (value) => scoreBand.left + (value / ruler.max) * scoreBand.width;
  const scale = [
    line([at(0), ruler.y + 22], [at(ruler.max), ruler.y + 22], { stroke: 'dim', width: 3 }),
    ...[0, 0.5, 1].flatMap((tick) => [
      line([at(tick), ruler.y + 22], [at(tick), ruler.y + 36], { stroke: 'dim', width: 3 }),
      text(String(tick), { size: 30, font: 'mono', color: 'dim' }).at(at(tick), ruler.y + 64),
    ]),
  ];
  const score = () => READOUT.activations.reduce((sum, _, i) => sum + contribution(i), 0);
  const stack = dynamic(() => {
    const first = contribution(0);
    return [
      first > 0.004
        ? line([at(0), ruler.y], [at(first), ruler.y], { stroke: READOUT.colors[0], width: 26 })
        : null,
      line([at(first), ruler.y], [at(first + contribution(1)), ruler.y], {
        stroke: READOUT.colors[1],
        width: 26,
      }),
    ].filter(Boolean);
  });
  const reading = [
    label('readout'),
    decimal(() => score(), { digits: 2, size: 72, color: COLOR.mark }),
  ];
  place(row(reading, { gap: 'normal' }), scoreBand, 'top');
  c.swap('hook-and-circuit-b1', [hook, ...joint, jointNote, ...match], paths.flat());
  c.show('circuit-terms', [...terms.flat(), ...scale, stack]);
  c.show('circuit-score', reading, { after: true });
  // The first contribution leaves. Then it comes back, and the control leaves: it had no part.
  c.on(
    'circuit-remove',
    () =>
      s.play(
        kept.to(0, { duration: 1.2 }),
        ...paths[0].map((node) => fade(node, 0.2, { duration: 1.2 })),
      ),
    0.8,
  );
  c.on('circuit-reset', () => {
    s.play(
      kept.to(1, { duration: 0.8 }),
      ...paths[0].map((node) => fade(node, 1, { duration: 0.8 })),
    );
  });
  c.on('circuit-control', () => {
    s.play(
      formatting.to(0, { duration: 0.8 }),
      ...paths[2].map((node) => fade(node, 0.2, { duration: 0.8 })),
    );
  });
  const real = [
    note('in a real model, test'),
    chipRow(['held-out prompts', 'matched controls', 'edit strength', 'redundant paths'], {
      maxWidth: lowerBand.width,
      color: COLOR.mark,
      stroke: COLOR.mark,
    }),
  ];
  place(column(real, { gap: 'tight', align: 'left' }), lowerBand, 'left');
  c.swap('circuit-real', [...terms.flat(), ...scale, stack, ...reading], real);
  const nullNote = place(
    label('Another path can compensate for the edit.'),
    lowerBand,
    'bottom',
  );
  c.show('circuit-null', nullNote);

  // Beat 2. A cross-layer transcoder: the features of a layer read the stream there, and write to this MLP output and the later ones.
  const outlines = layers.map((layer) => {
    const b = boxOf(layer.mlp);
    return rect(b.width + 18, b.height + 18, {
      stroke: COLOR.other,
      width: 4,
      fill: null,
      radius: 16,
    }).at(b.cx, b.cy);
  });
  const featureAt = layers.map((layer) => {
    const b = boxOf(layer.mlp);
    return [b.left - 38, b.top - 38];
  });
  const featureNodes = featureAt.map((p) => dot(14, COLOR.other).at(...p));
  const outputNodes = layers.flatMap((layer) => [
    rect(50, 50, { fill: 'bg', stroke: COLOR.other, width: 3, radius: 6 }).at(...layer.m.out),
    text('+', { size: 30, color: COLOR.activation }).at(...layer.m.out),
  ]);
  const reads = featureAt.map((at) =>
    arrow([at[0], streamY], at, { stroke: COLOR.other, width: 4, pad: 16 }),
  );
  const sumWrites = layers.map((layer) =>
    arrow([layer.m.out[0], layer.m.out[1] - 25], [layer.m.out[0], streamY], {
      stroke: COLOR.other,
      width: 4,
      pad: 7,
    }),
  );
  const writes = layers.flatMap((layer, from) =>
    layers.slice(from).flatMap((target) => {
      const source = featureAt[from];
      const lane = target.m.out[1] + 45 + from * 5;
      return [
        line([source[0], source[1] + 14], [source[0], lane], { stroke: COLOR.other, width: 4 }),
        line([source[0], lane], [target.m.out[0], lane], { stroke: COLOR.other, width: 4 }),
        arrow([target.m.out[0], lane], [target.m.out[0], target.m.out[1] + 25], {
          stroke: COLOR.other,
          width: 4,
          tip: 9,
          pad: 2,
        }),
      ];
    }),
  );
  const transcoder = place(
    label('cross-layer transcoder: features in place of each MLP', { color: COLOR.other }),
    lowerBand,
    'top',
  );
  c.swap(
    'hook-and-circuit-b2',
    [...paths.flat(), ...real, nullNote],
    [transcoder, ...outlines, ...featureNodes],
  );
  c.on('clt-reads', () =>
    s.play(
      ...layers.flatMap((layer) => [
        fade(layer.mlp, 0.2),
        fade(layer.m.read, 0),
        fade(layer.m.write, 0),
      ]),
    ),
  );
  c.show(
    'clt-reads',
    reads.map((edge) => draw(edge)),
  );
  c.show('clt-writes', [outputNodes, ...sumWrites.map((edge) => draw(edge))]);
  c.show(
    'clt-writes',
    writes.flat().map((edge) => draw(edge)),
    { stagger: true },
  );
  const combines = place(
    label('each MLP output: writers of this layer and of earlier ones'),
    lowerBand,
  );
  c.show('clt-combines', combines);
  c.on('clt-combines', () => s.play(indicate(sumWrites[2], { color: COLOR.mark, scale: 1 })));
  c.on('clt-attention', () =>
    s.play(...layers.map((layer) => indicate(layer.attention, { color: COLOR.mark, scale: 1.08 }))),
  );
  const studies = [
    note('circuits that motivate the work'),
    chipRow(['induction', 'indirect object', 'greater-than']),
  ];
  place(column(studies, { gap: 'tight', align: 'left' }), lowerBand, 'bottom left');
  c.show('clt-studies', studies);

  // Beat 3. The local replacement model of one prompt: attention is frozen, and the errors are constants.
  const [legendBand, noteBand] = lowerBand.rows([1, 1], 'tight');
  const local = place(
    label('a replacement model for one prompt', { color: COLOR.mark }),
    legendBand,
    'top',
  );
  c.swap('hook-and-circuit-b3', [transcoder, combines, ...studies], local);
  const frozen = layers.flatMap((layer) => {
    const b = boxOf(layer.attention);
    return [
      text('patterns fixed', { size: 29, color: COLOR.other }).at(b.cx, b.top - 54),
      text('norm denominators fixed', { size: 26, color: COLOR.other }).at(b.cx, b.top - 20),
    ];
  });
  c.on('replacement-frozen', () =>
    s.play(
      ...layers.flatMap((layer) =>
        [layer.a.read, layer.a.write].map((node) => recolor(node, COLOR.other)),
      ),
    ),
  );
  c.show('replacement-frozen', frozen);
  const valuePath = place(
    label('attention value/output paths stay live', { color: COLOR.other }),
    legendBand,
    'top',
  );
  c.swap('replacement-frozen', local, valuePath);
  const errors = layers.map((layer) =>
    rect(26, 26, { fill: COLOR.residual, stroke: null, radius: 5 }).at(
      layer.m.out[0] + 75,
      layer.m.out[1],
    ),
  );
  const errorLinks = layers.map((layer) =>
    arrow([layer.m.out[0] + 62, layer.m.out[1]], [layer.m.out[0] + 25, layer.m.out[1]], {
      stroke: COLOR.residual,
      width: 4,
      tip: 10,
      pad: 3,
    }),
  );
  c.show('repl-errors', [errors, ...errorLinks.map((edge) => draw(edge))]);
  const same = place(
    pictogram('check', { size: 44, accent: COLOR.residual }),
    boxOf(logitsBox).grow('none', 'loose'),
    'top',
  );
  c.show('repl-match', same);
  const legend = place(
    row(
      [
        chipRow(['● features; + output sums'], { color: COLOR.other, stroke: COLOR.other }),
        chipRow(['token embeddings']),
        chipRow(['error nodes'], { color: COLOR.residual, stroke: COLOR.residual }),
        chipRow(['output logits'], { color: COLOR.mark, stroke: COLOR.mark }),
      ],
      { gap: 'tight' },
    ),
    legendBand,
    'bottom',
  );
  c.show('repl-graph', legend);
  // One edge of the graph: from the features of layer 0 to those of layer 2, along the stream, with the MLP output between them stopped.
  const lift = streamY - 16;
  const from = featureAt[0],
    to = featureAt[2];
  const sourceSum = layers[0].m.out;
  const edge = [
    arrow(from, sourceSum, { stroke: COLOR.mark, width: 6, pad: 30 }),
    line([sourceSum[0], sourceSum[1] - 25], [sourceSum[0], lift], { stroke: COLOR.mark, width: 6 }),
    line([sourceSum[0], lift], [to[0], lift], { stroke: COLOR.mark, width: 6 }),
    arrow([to[0], lift], to, {
      stroke: COLOR.mark,
      width: 6,
      pad: 10,
    }),
  ];
  const between = layers[1].m.out;
  const stops = [
    line([between[0] - 20, between[1] - 36], [between[0] + 20, between[1] - 18], {
      stroke: COLOR.wrong,
      width: 8,
    }),
  ];
  const notes = [
    'an edge: source activation × slope on direct paths',
    'direct paths from source to target',
    'attention pattern held fixed',
    'pruned paths and error nodes can hide a mechanism',
    'check each edit in the original model',
  ].map((words) => place(label(words, { size: 36 }), noteBand));
  c.show('replacement-direct', [...stops, notes[0]]);
  c.on('replacement-direct', () => {
    s.play(fade(sumWrites[1], 0.12, { duration: 0.2 }));
    for (const segment of edge) s.play(draw(segment, { duration: 0.4 }));
  });
  c.swap('repl-not-total', notes[0], notes[1]);
  c.swap('repl-attention', notes[1], notes[2]);
  c.on('repl-attention', () =>
    s.play(...frozen.map((node) => indicate(node, { color: COLOR.mark, scale: 1 }))),
  );
  c.swap('repl-hide', notes[2], notes[3]);
  c.on('repl-hide', () =>
    s.play(...errors.map((node) => indicate(node, { color: COLOR.mark, scale: 1.5 }))),
  );
  c.swap('repl-compare', notes[3], notes[4]);
}
