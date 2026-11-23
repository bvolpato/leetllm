import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { table, place, column, numberLine, dot, arrow, to, assertEqual } from 'vizmatic/stage';
import { scalarEncode } from '../../../films/embedding-geometry/arithmetic.mjs';

export default function scalarCodec(s, c) {
  const [picture] = area.rows([10, 1], 'none');
  const [upper, lower] = picture.rows([2, 6], 'wide');
  const regions = upper.columns(6, 'normal');
  const fields = ['x', 'x / scale', 'round', 'clip', 'byte', 'scale × code'];
  const captions = fields.map((x, i) =>
    place(label(x, { size: 34, color: i === 4 ? 'blue' : 'dim' }), regions[i], 'top'),
  );
  const encode = place(
    column([note('(x − 2)'), note('/ scale')], { gap: 'tight' }),
    regions[1],
    'top',
  );
  const decode = place(
    column([note('2 +'), note('scale × code')], { gap: 'tight' }),
    regions[5],
    'top',
  );
  const mark = place(dot(22, 'yellow'), regions[0]);
  const x = 0.424,
    bound = 1.27,
    scale = bound / 127;
  const count = x / scale,
    code = scalarEncode(x, bound);
  const decoded = code * scale;
  assertEqual(code, 42, 'signed byte for 0.424');
  assertEqual(decoded.toFixed(2), '0.42', 'decoded coordinate');
  const values = [x, count.toFixed(1), Math.round(count), code, code, decoded.toFixed(2)].map(
    (v, i) =>
      place(mono(String(v), { size: 48, color: i === 4 ? 'blue' : 'ink' }), regions[i], 'bottom'),
  );
  const links = regions.slice(0, -1).map((r, i) =>
    arrow(r.point('center'), regions[i + 1].point('center'), {
      stroke: 'dim',
      width: 3,
      pad: 24,
    }),
  );
  const [left, right] = lower.columns(2, 'loose');
  const [realArea, codeArea, mappingArea] = left.rows([2, 2, 1], 'wide');
  const ruler = place(
    numberLine({
      range: [2, 3],
      length: realArea.width - 100,
      ticks: [2, 3],
      points: [{ name: 'real x', value: 2 }],
      size: 36,
      labelSize: 34,
    }),
    realArea,
  );
  const bytes = place(
    numberLine({
      range: [0, 255],
      length: codeArea.width - 100,
      ticks: [0, 255],
      points: [{ name: 'code', value: 0 }],
      size: 36,
      labelSize: 34,
    }),
    codeArea,
  );
  const maps = place(mono('0 → 2       255 → 3', { size: 36, color: 'yellow' }), mappingArea);
  const signed = place(
    column(
      [
        label('signed reconstruction'),
        mono('x̂ = scale × code', { size: 36 }),
        note('same calibration for every row'),
      ],
      { gap: 'wide' },
    ),
    left,
  );
  const codec = place(
    table(
      ['field', { key: 'contract', sample: 'q·offset + q·scale·code', marks: true }],
      [
        { id: 'scale', field: 'scale', contract: 'bound / 127' },
        { id: 'byte', field: 'byte domain', contract: '-127 … +127' },
        { id: 'offset', field: 'offset', contract: null },
        { id: 'point', field: 'zero point', contract: null },
        { id: 'dot', field: 'one dot term', contract: null },
      ],
      { size: 34, width: right.width },
    ),
    right,
  );
  s.add(heading(c.title), captions, links, mark, signed, codec, values[0]);
  c.after('step', () =>
    s.play(
      codec.setCell('scale', 'contract', {
        value: bound + ' / 127 = ' + scale.toFixed(2),
      }),
    ),
  );
  ['divide', 'round', 'clip', 'byte', 'decode'].forEach((cue, i) => {
    c.on(cue, () =>
      s.play(to(mark, (n) => n.moveTo(regions[i + 1].point('center')), { duration: 0.6 })),
    );
    c.show(cue, values[i + 1], { after: true });
  });
  c.on('freeze', () => s.play(codec.light('scale')));
  c.swap(
    'range-codec',
    [captions[1], captions[5], signed, mark, ...values],
    [encode, decode, ruler, bytes],
  );
  c.on('range-codec', () =>
    s.play(
      codec.setCell('scale', 'contract', { value: '(3 − 2) / 255' }),
      codec.setCell('byte', 'contract', { value: '0 … 255' }),
      { duration: 0.5 },
    ),
  );
  c.after('zero', () =>
    s.play(ruler.move('real x', 2, { duration: 0.3 }), bytes.move('code', 0, { duration: 0.3 })),
  );
  c.after('range', () =>
    s.play(ruler.move('real x', 3, { duration: 1.2 }), bytes.move('code', 255, { duration: 1.2 })),
  );
  c.show('range', maps, { after: true });
  const offset = 2,
    step = (3 - 2) / 255;
  const zeroPoint = -offset / step;
  assertEqual(offset + step * 0, 2, 'code zero reconstructs two');
  assertEqual(offset + step * 255, 3, 'code 255 reconstructs three');
  assertEqual(zeroPoint, -510, 'invalid byte zero point');
  const unknown = place(mono('2 + code / 255 = 0', { size: 64 }), upper);
  const solved = place(mono('2 + (' + zeroPoint + ') / 255 = 0', { size: 64 }), upper);
  const dotTerm = place(mono('q × (offset + scale × code)', { size: 56 }), upper);
  c.swap(
    'locate-zero',
    [captions[0], encode, captions[2], captions[3], captions[4], decode, ...links],
    unknown,
  );
  c.swap('invalid', unknown, solved, { after: true });
  c.swap('dot', solved, dotTerm);
  const widerStep = 3 / 255;
  assertEqual(widerStep / step, 3, 'step ratio after including zero');
  const comparison = place(
    mono('[2, 3]   1/255      [0, 3]   3/255', { size: 34, color: 'yellow' }),
    mappingArea,
  );
  c.swap('widen-range', maps, comparison, { after: true });
  c.after('invalid', () =>
    s.play(codec.setCell('point', 'contract', { value: '-510: invalid', state: 'fail' }), {
      duration: 0.5,
    }),
  );
  c.after('offset', () =>
    s.play(
      codec.setCell('offset', 'contract', { value: 'real offset = 2' }),
      ruler.move('real x', 2),
      bytes.move('code', 0),
      { duration: 0.8 },
    ),
  );
  c.on('dot', () =>
    s.play(codec.setCell('dot', 'contract', { value: 'q·offset + q·scale·code' }), {
      duration: 0.5,
    }),
  );
}
