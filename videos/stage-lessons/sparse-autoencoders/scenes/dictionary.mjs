// Scene `dictionary`: a code picks two columns, and their arrows rebuild the activation.
//
// The picture: the dot of the lesson and the five unit columns. Two bars rise in the strip, their
// arrows take the length of their coefficients and join tip to tail on the dot, in both orders.
// Then the encoder shows: two dashed readers that do not point as the columns do. Each one stands
// at a right angle to the column of the other feature. Tied weights swing the readers on the
// columns, and the bars read too much.
import {
  angleMark,
  arrow,
  assertEqual,
  column,
  fade,
  grid,
  indicate,
  place,
  rect,
  rightAngle,
  row,
  tex,
} from 'vizmatic/stage';
import { encoderFixture } from '../../../films/sparse-autoencoders/model.mjs';
import { chipRow, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  EXAMPLE_SLOTS,
  SIDE,
  board,
  code,
  dictionary,
  strip,
  target,
  vec,
} from '../parts.mjs';

const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export default function dictionaryScene(s, c) {
  const b = board();
  const [d1, d2] = dictionary;
  const encoder = encoderFixture();
  assertEqual(
    encoder.estimated.map((value) => Number(value.toFixed(9))),
    code,
    'the encoder of the lesson estimates the code',
  );
  assertEqual(
    encoder.weights.slice(0, 2).map((row) => Number(vec.length(row).toFixed(9))),
    [5 / 3, 5 / 3].map((v) => Number(v.toFixed(9))),
    'encoder row gains',
  );
  const [stripBand, lower] = SIDE.rows([4, 5], 'normal');
  const z = strip(s, stripBand, { max: 2.5, colors: EXAMPLE_SLOTS });

  // The two selected columns. `scaled` takes each arrow from unit length to its coefficient, and
  // `joined` moves the start of one arrow to the tip of the other.
  const scaled = s.value(0),
    pinkJoined = s.value(0),
    blueJoined = s.value(0);
  const length = (i) => 1 + (code[i] - 1) * scaled.value;
  const blueStart = () => vec.scale(d2, length(1) * blueJoined.value);
  const pinkStart = () => vec.scale(d1, length(0) * pinkJoined.value);
  const blue = b.arrowOf(
    blueStart,
    () => vec.add(blueStart(), vec.scale(d1, length(0))),
    COLOR.first,
  );
  const pink = b.arrowOf(
    pinkStart,
    () => vec.add(pinkStart(), vec.scale(d2, length(1))),
    COLOR.second,
  );
  const unused = dictionary
    .slice(2)
    .map((d) => arrow(b.P([0, 0]), b.P(d), { stroke: 'dim', width: 5, tip: 20 }));
  const point = b.dotOf(target, COLOR.activation);
  const pointTag = b.tagOf(target, 'x', COLOR.activation, [48, -36], { font: undefined, size: 44 });
  s.add(heading(c.title), unused, blue, pink, point, pointTag, z.rail, z.glyphs, z.bars, z.numbers);
  c.take(b.plane);

  // Beat 0. The code, the scaling, the sum.
  c.on('dict-code', () =>
    s.play(z.z[0].to(code[0], { duration: 0.9 }), z.z[1].to(code[1], { duration: 0.9 })),
  );
  c.on('dictionary-b1-1', () => s.play(scaled.to(1, { duration: 1.2 })));
  c.on('dict-add', () => s.play(pinkJoined.to(1, { duration: 1.3 })));
  const rebuilt = b.ringOf(target, COLOR.activation, 24);
  const sum = place(tex('\\hat{x} = 1.5\\,d_1 + 1\\,d_2', { size: 50 }), lower, 'top');
  sum.part('1.5').forEach((glyph) => glyph.color(COLOR.first));
  sum.part('d_1').forEach((glyph) => glyph.color(COLOR.first));
  sum.part('1\\,d_2').forEach((glyph) => glyph.color(COLOR.second));
  c.show('dictionary-b1-2', [rebuilt, sum], { after: true });

  // Beat 1. The other order of the sum reaches the same dot. Three columns stay unused.
  c.on('dictionary-b2-1', () => {
    s.play(pinkJoined.to(0, { duration: 1.3 }), blueJoined.to(1, { duration: 1.3 }));
    s.wait(0.7);
    s.play(pinkJoined.to(1, { duration: 1.3 }), blueJoined.to(0, { duration: 1.3 }));
  });
  c.on('dict-unused', () =>
    s.play(...unused.map((ray) => indicate(ray, { color: COLOR.mark, scale: 1.12 }))),
  );
  const count = [label('5 columns'), label('>'), label('2 axes')];
  const over = label('overcomplete', { color: COLOR.mark });
  const known = mono('z = [1.5, 1, 0, 0, 0]');
  place(
    column([row(count, { gap: 'normal' }), over, known], { gap: 'normal', align: 'center' }),
    lower,
    'bottom',
  );
  c.show('dict-more', count);
  c.show('dict-overcomplete', over, { after: true });
  c.show('dictionary-b2-2', known);

  // Beat 2. The encoder reads, and the decoder writes. A reader is not its column.
  const tied = s.value(0);
  const reader = (i) => lerp2(encoder.weights[i], dictionary[i], tied.value);
  const readers = [0, 1].map((i) =>
    b.arrowOf([0, 0], () => reader(i), EXAMPLE_SLOTS[i], { width: 5, dash: [14, 10] }),
  );
  const drops = [0, 1].map((i) => b.shadowOf(target, () => reader(i), EXAMPLE_SLOTS[i], 8));
  // Each reader stands at a right angle to the column of the other feature, so it does not see it:
  // the drop line from the dot runs along that column. The mark of the right angle is at its foot.
  const blind = [0, 1].map((i) => {
    const at = b.foot(target, encoder.weights[i]);
    return rightAngle(b.P(at), b.P([0, 0]), b.P(target), { color: EXAMPLE_SLOTS[i], width: 3 });
  });
  c.hide(2, [sum, ...count, over, known]);
  c.onBeat(2, () => s.play(z.z[0].to(0, { duration: 0.6 }), z.z[1].to(0, { duration: 0.6 })));
  // The two jobs, named at the right: a dashed row reads, and a solid column writes.
  const jobs = [label('bars: encoder estimates'), label('solid arrows: supplied code')];
  const gains = [
    note('normalized shadow × row norm = dot product'),
    mono('0.90 × 5/3 = 1.50', { color: COLOR.first }),
    mono('0.60 × 5/3 = 1.00', { color: COLOR.second }),
  ];
  place(column(gains, { gap: 'tight', align: 'center' }), lower);
  c.show('dictionary-encode', [...readers, ...drops, ...blind, jobs[0], ...gains]);
  c.hide('dictionary-hook-context', gains, { lead: 0.35, fade: 0.15 });
  c.on(
    'dictionary-encode',
    () => s.play(z.z[0].to(code[0], { duration: 1.2 }), z.z[1].to(code[1], { duration: 1.2 })),
    1.6,
  );
  c.on('dictionary-b3-1', () =>
    s.play(indicate(blue, { scale: 1.06 }), indicate(pink, { scale: 1.06 })),
  );
  c.show('dictionary-b3-1', jobs[1]);
  const gap = angleMark(b.P([0, 0]), b.P(d1), b.P(encoder.weights[0]), {
    radius: 150,
    color: COLOR.mark,
    width: 5,
  });
  const untied = label('a row is not its column', { color: COLOR.mark });
  place(column([...jobs, untied], { gap: 'tight', align: 'center' }), lower, 'top');
  c.show('dict-untied', [gap, untied]);
  const hook = [
    note('match the hook'),
    chipRow(['checkpoint', 'layer', 'token positions', 'normalization'], {
      maxWidth: lower.width,
      color: COLOR.mark,
      stroke: COLOR.mark,
    }),
  ];
  place(column(hook, { gap: 'tight', align: 'left' }), lower, 'bottom');
  c.show('dictionary-hook-context', hook);

  // The shapes: one reader row for each slot, and one column for each slot.
  // A cell is a square of 40 with a dark border, so the cells of a table read as cells.
  const cells = (rows, columns, tint) =>
    Array.from({ length: rows * columns }, (_, k) =>
      rect(40, 40, {
        radius: 6,
        stroke: 'bg',
        width: 4,
        fill: tint(Math.floor(k / columns), k % columns),
        opacity: 0.85,
      }),
    );
  const encoderCells = cells(5, 2, (rowIndex) => EXAMPLE_SLOTS[rowIndex]);
  const decoderCells = cells(2, 5, (_, columnIndex) => EXAMPLE_SLOTS[columnIndex]);
  const grids = [
    column(
      [
        label('encoder'),
        grid(encoderCells, { columns: 2, gap: 'none' }),
        tex('M \\times D', { size: 40 }),
      ],
      { gap: 'tight', align: 'center' },
    ),
    column(
      [
        label('decoder'),
        grid(decoderCells, { columns: 5, gap: 'none' }),
        tex('D \\times M', { size: 40 }),
      ],
      { gap: 'tight', align: 'center' },
    ),
  ];
  place(row(grids, { gap: 'loose', align: 'center' }), lower);
  const shapes = grids.flatMap((block) => block.nodes);
  const [encoderShape, decoderShape] = grids.map((block) => block.nodes.at(-1));
  const withoutShapes = shapes.filter((node) => node !== encoderShape && node !== decoderShape);
  c.swap('dictionary-dimensions', [...jobs, untied, ...hook], withoutShapes);
  c.show('dict-shapes', [encoderShape, decoderShape]);

  // The bias: taken off before the readers, and put back after the columns.
  const encode = tex('z = \\mathrm{ReLU}\\big(W_e\\,(x - b) + c\\big)', { size: 44 });
  const decode = tex('\\hat{x} = W_d\\,z + b', { size: 44 });
  const learned = note('b is learned: it need not be the mean of the data');
  place(column([encode, decode, learned], { gap: 'normal', align: 'center' }), lower);
  c.swap('dict-bias', shapes, encode);
  c.on(
    'dict-bias',
    () => s.play(indicate(encode.part('b'), { color: COLOR.mark, scale: 1.5 })),
    0.5,
  );
  c.show('dict-bias-add', decode);
  c.on(
    'dict-bias-add',
    () => s.play(indicate(decode.part('b'), { color: COLOR.mark, scale: 1.5 })),
    0.5,
  );
  c.show('dict-not-mean', learned);

  // Tied weights: the readers swing on the columns, and each one now also reads the other feature.
  const overRead = [0, 1].map((i) => vec.dot(dictionary[i], target));
  const estimateLabel = label('bars: encoder estimates');
  const supplied = note('solid arrows: supplied z = [1.5, 1, 0, 0, 0]');
  const always = label('tied: reader = column, always');
  const tooMuch = label('each reader now sees both features', { color: COLOR.wrong });
  const atStart = label('tied start: free after step 0', { color: COLOR.mark });
  place(
    column([estimateLabel, supplied, always, tooMuch, atStart], { gap: 'normal', align: 'center' }),
    lower,
  );
  c.swap(
    'dictionary-tying',
    [encode, decode, learned, gap, ...blind],
    [always, estimateLabel, supplied],
  );
  c.show('dictionary-tying', tooMuch, { after: true, lead: -1.2 });
  c.hide('dict-tied-init', tooMuch, { lead: -1.4 });
  c.on('dictionary-tying', () =>
    s.play(
      tied.to(1, { duration: 1.6 }),
      z.z[0].to(overRead[0], { duration: 1.6 }),
      z.z[1].to(overRead[1], { duration: 1.6 }),
    ),
  );
  // A drop line passes over a number of the axes while the readers swing, so the numbers leave for the swing.
  c.on('dictionary-tying', () => s.play(fade(b.plane.numbers, 0, { duration: 0.3 })));
  c.on('dict-tied-init', () => s.play(fade(b.plane.numbers, 1, { duration: 0.3 })), 2.8);
  c.hide('dict-tied-init', always);
  c.show('dict-tied-init', atStart);
  c.show('dict-tied-init', gains.slice(1), { lead: -3 });
  c.on(
    'dict-tied-init',
    () =>
      s.play(
        tied.to(0, { duration: 1.8 }),
        z.z[0].to(code[0], { duration: 1.8 }),
        z.z[1].to(code[1], { duration: 1.8 }),
      ),
    0.8,
  );
  c.keep(b.plane);
}
