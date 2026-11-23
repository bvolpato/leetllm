// Scene `kv-state`: calculate the state that must move.
//
// The picture: the payload as a slab. K and V are two sheets, each a stack of layers, as wide as
// the tokens and as high as the heads. Each factor of the formula lights its side of the slab and
// its column in the row under it. Then the row multiplies, factor by factor. The token side
// stretches and the bytes follow. Last, the details of a production layout change the same slab.
import { boxOf, commas, dynamic, place, rect, row, text, to } from 'vizmatic/stage';
import { cacheShape } from '../../../films/inference-data-plane/fixtures.mjs';
import { area, chipRow, heading } from '../../kit-narrated.mjs';
import { COLOR, SIDE, SLAB, factorRow, slab } from '../parts.mjs';

/** The factors in the order of the lesson: tensors, layers, tokens, heads, head width, bytes. */
const FACTORS = [
  { key: 'tensors', name: 'tensors' },
  { key: 'layers', name: 'layers' },
  { key: 'positions', name: 'tokens', widest: '256' },
  { key: 'kvHeads', name: 'KV heads' },
  { key: 'headWidth', name: 'head width' },
  { key: 'bytes', name: 'bytes' },
];
/** A longer prompt, for the proportion: two times the positions of the toy. */
const LONGER = cacheShape.positions * 2;

export default function kvState(s, c) {
  const [stage, foot] = area.rows([5, 2], 'normal');
  const payload = slab(s, stage, { ...SLAB.toy, depth: 0 });

  const tokens = s.value(cacheShape.positions),
    shown = s.value(0), // the columns of the row that have their number
    count = s.value(0), // the factors that the running product holds
    total = s.value(0), // 0 to 1: the result in kibibytes shows
    resultOn = s.value(1); // the longer-prompt answer waits for its spoken phrase to end
  const read = (factor) =>
    Math.round(factor.key === 'positions' ? tokens.value : cacheShape[factor.key]);
  /** The running product of the first factors, in bytes. */
  const product = () =>
    FACTORS.slice(0, Math.ceil(count.value)).reduce((bytes, factor) => bytes * read(factor), 1);
  const factors = factorRow(
    FACTORS.map((factor) => ({ ...factor, read: () => read(factor) })),
    { lit: () => payload.lit.value, shown: () => shown.value },
  );
  const [rowBand, detailBand] = foot.rows([3, 2], 'normal');
  const resultBed = rect(470, 130, { fill: null, stroke: null });
  place(row([factors.block, resultBed], { gap: 'wide', align: 'top' }), rowBand, 'top');
  const result = dynamic(() => {
    const held = Math.ceil(count.value);
    if (held <= 0 || resultOn.value === 0) return null;
    const box = boxOf(resultBed);
    const bytes = product();
    return [
      text(
        `${held < FACTORS.length ? 'running: ' : '= '}${commas(bytes)}${held >= FACTORS.length ? ' bytes' : ''}`,
        {
          font: 'mono',
          size: 44,
          color: 'ink',
          anchor: 'left',
        },
      ).at(box.left, box.top + 32),
      total.value > 0 &&
        text(`= ${bytes / 1024} KiB`, {
          font: 'mono',
          size: 52,
          color: COLOR.mark,
          anchor: 'left',
        })
          .at(box.left, box.top + 98)
          .opacity(total.value),
    ].filter(Boolean);
  });
  const details = place(
    chipRow(['rank shards', 'block padding', 'quantization', 'metadata', 'the buffer']),
    detailBand,
    'top',
  );

  s.add(heading(c.title), payload.sheets, payload.tabs, factors.numbers, result);

  // Beat 0: each factor has a side of the slab and a column of the row.
  const name = (cue, index, also = []) => {
    c.show(cue, [factors.names[index], index > 0 && factors.times[index - 1]].filter(Boolean));
    c.on(cue, () => {
      payload.lit.set(index);
      s.play(shown.to(index + 1, { duration: 0.3 }), ...also);
    });
  };
  c.on('kv-layer', () => s.play(payload.depth.to(0, { duration: 0.1 })));
  name('kv-tensors', SIDE.tensors);
  name('kv-layers', SIDE.layers, [payload.depth.to(SLAB.toy.depth, { duration: 0.8 })]);
  name('kv-tokens', SIDE.tokens);
  name('kv-heads', SIDE.heads);
  name('kv-width', SIDE.width);
  name('kv-bytes', SIDE.bytes);

  // Beat 1: the row multiplies. The side of the factor that joins the product is yellow.
  c.on('kv-multiply', () => payload.lit.set(-1));
  const extend = c.cue('kv-extends');
  const step = (extend.end - extend.start) / FACTORS.length;
  FACTORS.forEach((_, index) =>
    c.on(
      'kv-extends',
      () => {
        payload.lit.set(index);
        count.set(Math.min(index + 1, FACTORS.length - 1));
      },
      index * step,
    ),
  );
  const totalCue = c.cue('kv-total-reveal');
  c.after(
    'kv-total-reveal',
    () => {
      payload.lit.set(-1);
      count.set(FACTORS.length);
      s.play(total.to(1, { duration: 0.3 }));
    },
    Math.ceil((totalCue.end + 0.04) * 30) / 30 + 1 / 60 - totalCue.end,
  );
  // A longer prompt: the token side stretches, and the bytes follow it.
  c.on('kv-longer', () => {
    resultOn.set(0);
    payload.lit.set(SIDE.tokens);
    s.play(tokens.to(LONGER, { duration: 1.6 }), payload.w.to(SLAB.toy.w * 2, { duration: 1.6 }));
  });
  c.after('kv-proportional', () => {
    payload.lit.set(-1);
    resultOn.set(1);
  });

  // Beat 2: what a production layout adds to the same slab.
  c.on('kv-production', () =>
    s.play(
      tokens.to(cacheShape.positions, { duration: 0.8 }),
      payload.w.to(SLAB.toy.w, { duration: 0.8 }),
    ),
  );
  c.show('kv-production', details);
  const detail = (cue, index, change) => {
    c.on(cue, () =>
      s.play(
        ...details.chips.map((chip, at) =>
          to(chip.text, (n) => n.color(at === index ? COLOR.mark : at < index ? 'dim' : 'ink'), {
            duration: 0.3,
          }),
        ),
        ...details.chips.map((chip, at) =>
          to(chip.frame, (n) => n.stroke(at === index ? COLOR.mark : 'gridStrong'), {
            duration: 0.3,
          }),
        ),
        ...change(),
      ),
    );
  };
  detail('kv-shards', 0, () => [payload.cut.to(1, { duration: 0.8 })]);
  detail('kv-padding', 1, () => [
    payload.blocks.to(1, { duration: 0.5 }),
    payload.pad.to(1, { duration: 0.8 }),
  ]);
  detail('kv-quantization', 2, () => {
    payload.lit.set(SIDE.bytes);
    return [];
  });
  detail('kv-metadata', 3, () => {
    payload.lit.set(-1);
    return [payload.meta.to(1, { duration: 0.6 })];
  });
  detail('kv-buffers', 4, () => [payload.buffer.to(1, { duration: 0.8 })]);
}
