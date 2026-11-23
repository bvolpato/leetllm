// Scene `vocabulary-tiles`: the matrix of logits, and a loss that does not store it.
//
// The picture: one rectangle is the matrix, positions by vocabulary. It fills with bytes. Then it
// is an outline again, and one tile at a time crosses it while a running maximum and a running
// sum keep what the loss needs.
import {
  assertEqual,
  beside,
  column,
  draw,
  dynamic,
  group,
  line,
  place,
  rect,
  row,
  text,
} from 'vizmatic/stage';
import { completeModel } from '../../../films/softmax/model.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { MARK_COLOR } from '../parts.mjs';

export default function vocabularyTiles(s, c) {
  const model = completeModel();
  const tileCount = model.tiles.length;
  const [left, right] = area.columns([3, 2], 'loose');
  const [plot] = left.rows([5, 1], 'normal');
  const box = plot.inset('loose', 'wide');

  // The matrix: an outline, a fill that rises, and a tile that crosses it.
  const frame = place(
    rect(box.width, box.height, { stroke: 'ink', width: 3, fill: null, radius: 6 }),
    box,
  );
  const filled = s.value(0),
    tile = s.value(-1);
  const fill = dynamic(() => {
    const height = box.height * filled.value;
    return height < 1
      ? []
      : [
          rect(box.width, height, { fill: 'blue', stroke: null, opacity: 0.6 }).at(
            box.cx,
            box.bottom - height / 2,
          ),
        ];
  });
  const width = box.width / tileCount;
  const cuts = group(
    ...Array.from({ length: tileCount - 1 }, (_, i) =>
      line([box.left + width * (i + 1), box.top], [box.left + width * (i + 1), box.bottom], {
        stroke: 'dim',
        width: 2,
      }),
    ),
  );
  const lit = dynamic(() =>
    tile.value < 0
      ? []
      : [
          rect(width, box.height, { fill: MARK_COLOR, stroke: null, opacity: 0.32 }).at(
            box.left + width * (tile.value + 0.5),
            box.cy,
          ),
        ],
  );
  const down = mono('16 × 4,096 positions', { size: 37 }),
    across = mono('× 128,256 classes', { size: 40 });
  place(row([down, across], { gap: 'normal' }), left.rows([5, 1], 'normal')[1], 'top');
  s.add(heading(c.title), frame, fill, lit);

  // The count of bytes.
  const bytes = [
    note('float32 logits'),
    mono(`${model.bytes.toLocaleString('en-US')}`, { size: 44, color: MARK_COLOR }),
    mono('bytes at 4 bytes per score', { size: 34 }),
    mono(`${(model.bytes / 1e9).toFixed(2)} GB · ${(model.bytes / 2 ** 30).toFixed(2)} GiB`, {
      size: 40,
    }),
  ];
  place(column(bytes, { gap: 'normal' }), right, 'left');
  c.show('vocabulary-tiles-0', bytes[0]);
  c.show('vocab-positions', down);
  c.show('vocab-matrix', across);
  c.on('vocab-bytes', () =>
    s.play(filled.to(1, { duration: c.cue('vocab-bytes').end - c.cue('vocab-bytes').start })),
  );
  c.show('vocab-bytes', [bytes[1], bytes[2]], { after: true });
  c.show('vocab-gib', bytes[3], { after: true });

  // Tiles: the matrix is not stored. A running maximum and a running sum cross it.
  const [first, second] = model.tiles;
  const baseline = s.value(first.maximum);
  const incoming = s.value(0);
  const prior = () => first.total * Math.exp(first.maximum - baseline.value);
  const addition = () =>
    incoming.value * second.values.reduce((sum, z) => sum + Math.exp(z - baseline.value), 0);
  assertEqual(
    prior() * Math.exp(first.maximum - second.maximum) +
      second.values.reduce((sum, z) => sum + Math.exp(z - second.maximum), 0),
    second.total,
    'merged tile sum',
  );
  const running = [
    chip('allocated before the loss call'),
    label('Two tiles from one example row'),
    dynamic(() =>
      text('baseline ' + baseline.value.toFixed(1), { size: 40, font: 'mono', color: MARK_COLOR }),
    ),
    dynamic(() =>
      text('running sum ' + (prior() + addition()).toFixed(3), {
        size: 40,
        font: 'mono',
        color: MARK_COLOR,
      }),
    ),
    mono('log-sum-exp ' + second.logSumExp.toFixed(3), { size: 40 }),
    mono('target score 2   ·   loss ' + (second.logSumExp - first.values[0]).toFixed(3), {
      size: 35,
      color: 'green',
    }),
  ];
  const [stats, accumulatorBand] = right.rows([3, 2], 'normal');
  place(column(running, { gap: 'normal' }), stats, 'left');
  const [barBand, factorBand] = accumulatorBand.rows([1, 1], 'wide');
  const scale = barBand.width / second.total;
  const accumulator = dynamic(() => [
    rect(Math.max(1, prior() * scale), 64, { fill: 'dim', stroke: null }).at(
      barBand.left + (prior() * scale) / 2,
      barBand.cy,
    ),
    ...(addition() > 0
      ? [
          rect(addition() * scale, 64, { fill: MARK_COLOR, stroke: null }).at(
            barBand.left + prior() * scale + (addition() * scale) / 2,
            barBand.cy,
          ),
        ]
      : []),
  ]);
  const factor = place(
    mono('max 2 → 4\nprior × exp(2 − 4)', { size: 36, color: MARK_COLOR }),
    factorBand,
    'top left',
  );
  const merged = place(note('prior + incoming, at max 4'), factorBand, 'top left');
  c.swap('vocabulary-tiles-1', bytes, running[0]);
  const values = model.tiles.map(({ values }, i) =>
    mono(`[${values.join(', ')}]`, { size: 52 }).moveTo(
      box.columns(tileCount, 'none')[i].point('center'),
    ),
  );
  const selected = beside(
    note('first score = observed word’s logit', { color: 'green', size: 26 }),
    values[0],
    'under',
    'normal',
  );
  c.on('tile-fused', () => {
    tile.set(0);
    s.play(filled.to(0, { duration: 0.4 }));
  });
  c.swap(
    'tile-fused',
    [down, across, running[0]],
    [draw(cuts), values[0], running[1], running[2], running[3], accumulator],
  );
  c.on('tile-incoming', () => tile.set(1));
  c.show('tile-incoming', values[1]);
  c.show('tile-rescale', factor);
  c.on('tile-rescale', () => s.play(baseline.to(second.maximum, { duration: 1.6 })));
  c.on('tile-add', () => s.play(incoming.to(1, { duration: 1.1 })));
  c.swap('tile-add', factor, merged);
  c.show('tile-picked', selected);
  c.show('tile-target', running[5], { after: true });
  c.show('tile-result', running[4], { after: true });

  // The source of the method, and what to measure.
  const source = [
    label('Cut Cross-Entropy', { color: MARK_COLOR }),
    note('projection and loss in one step'),
    chip('no whole matrix in GPU memory'),
    chip('measure the full training step'),
  ];
  place(column(source, { gap: 'normal' }), right, 'left');
  c.swap(
    'vocabulary-tiles-2',
    [running[1], running[2], running[3], running[5], running[4], accumulator, merged, selected],
    [source[0], source[1]],
  );
  c.show('tile-full-contract', source[2]);
  c.show('tile-measure', source[3]);
}
