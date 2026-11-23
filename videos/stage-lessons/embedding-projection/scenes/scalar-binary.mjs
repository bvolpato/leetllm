import {
  arrow,
  assertEqual,
  column,
  dot,
  group,
  line,
  linear,
  place,
  rect,
  to,
} from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { BODY, FOOT, LEFT, RIGHT, TOP } from '../parts.mjs';

export default function scalarBinary(s, c) {
  const a = [-1, -0.3, 0.4, 1];
  const b = [-0.8, 0.2, 0.5, -0.4];
  const maximum = Math.max(...a.map(Math.abs));
  const scale = 127 / maximum;
  const original = a[1];
  const scaled = original * scale;
  const code = Math.max(-127, Math.min(127, Math.round(scaled)));
  const decoded = code / scale;
  const signed = (n, digits) => n.toFixed(digits).replace('-', '−');
  assertEqual(code, -38, 'stored coordinate');

  const title = heading(c.title);
  const source = place(label('One coordinate from the document vector', { size: 42 }), TOP);
  const rulerY = LEFT.cy + 37;
  const x = (value) => LEFT.left + LEFT.width * (0.14 + (0.72 * (value + 0.301)) / 0.003);
  const ticks = [-0.301, -0.3, -0.299, -0.298];
  const ruler = group(
    place(label('Magnified coordinate', { size: 42 }), LEFT, 'top'),
    line([x(ticks[0]), rulerY], [x(ticks.at(-1)), rulerY], { stroke: 'dim', width: 4 }),
    ...ticks.flatMap((t) => [
      line([x(t), rulerY - 12], [x(t), rulerY + 12], { stroke: 'dim', width: 3 }),
      mono(signed(t, 3), { size: 31 }).at(x(t), rulerY + 48),
    ]),
    dot(17, 'cyan').at(x(original), rulerY),
    label('original', { size: 38, color: 'cyan' }).at(x(original), rulerY - 66),
  );
  const marker = dot(12, 'yellow').at(x(original), rulerY);
  const restored = label('decoded', { size: 38, color: 'yellow' }).at(x(decoded), rulerY - 66);
  const steps = RIGHT.rows(4, 'normal');
  const math = (words, i, color = 'ink') => place(mono(words, { size: 46, color }), steps[i]);
  const calibration = math('scale = 127 / ' + maximum + ' = ' + scale, 0);
  const product = math(signed(original, 1) + ' × ' + scale + ' = ' + signed(scaled, 1), 1);
  const stored = math('integer code = ' + signed(code, 0), 2, 'yellow');
  const value = math(signed(code, 0) + ' / ' + scale + ' ≈ ' + signed(decoded, 5), 3, 'yellow');
  const clipRule = place(
    label('Use the saved scale for queries. Clip codes to [−127, 127].', { size: 38 }),
    FOOT,
  );
  const scalar = [
    title,
    source,
    ruler,
    marker,
    restored,
    calibration,
    product,
    stored,
    value,
    clipRule,
  ];
  s.add(title, source, ruler);
  c.show('quantize-scale', calibration, { after: true });
  c.show('quantize-multiply', product, { after: true });
  c.show('quantize-code', stored, { after: true });
  c.show('quantize-reconstruct', marker);
  c.on('quantize-reconstruct', () =>
    s.play(
      to(marker, (node) => node.at(x(decoded), rulerY), {
        duration: c.cue('quantize-decoded').end - c.cue('quantize-reconstruct').start,
        ease: linear,
      }),
    ),
  );
  c.show('quantize-decoded', [restored, value], { after: true });
  c.show('quantize-reuse', clipRule);

  const binaryTitle = heading('Which signs differ?');
  const signRule = place(label('Positive → 1     •     Zero or negative → 0', { size: 40 }), TOP);
  const rows = BODY.rows(3, 'wide');
  const bits = a.map((v) => Number(v > 0));
  const other = b.map((v) => Number(v > 0));
  const xor = bits.map((v, i) => v ^ other[i]);
  const cells = rows.map((r) => r.columns([1.4, 1, 1, 1, 1], 'normal'));
  const rowNames = ['Vector A', 'Vector B', 'A XOR B'].map((name, i) =>
    place(label(name, { size: 48 }), cells[i][0], 'left'),
  );
  const chip = (text, i, j, color, size = 62) => {
    const cell = cells[i][j + 1];
    return place(
      group(
        rect(cell.width * 0.86, cell.height * 0.77, {
          radius: 12,
          fill: 'surface',
          stroke: color,
          width: 3,
        }),
        mono(text, { size, color }),
      ),
      cell,
    );
  };
  const floats = [a, b].flatMap((row, i) => row.map((v, j) => chip(signed(v, 1), i, j, 'dim')));
  const signs = [a, b].flatMap((row, i) =>
    row.map((v, j) => chip(signed(v, 1) + ' → ' + Number(v > 0), i, j, 'cyan', 43)),
  );
  const mask = xor.map((v, j) => chip(String(v), 2, j, v ? 'yellow' : 'dim'));
  const count = xor.reduce((sum, bit) => sum + bit, 0);
  assertEqual(count, 2, 'sign disagreements');
  const distance = place(label('Hamming distance = ' + count, { size: 44, color: 'yellow' }), FOOT);
  const dimensions = 256;
  const bytes = place(
    label(
      dimensions +
        ' coordinates     •     float32 ' +
        (dimensions * 4).toLocaleString('en-US') +
        ' B     •     int8 ' +
        dimensions +
        ' B     •     packed ' +
        dimensions / 8 +
        ' B',
      { size: 39 },
    ),
    FOOT,
  );
  c.swap('binary-start', scalar, [binaryTitle, signRule, rowNames.slice(0, 2), floats]);
  c.swap('binary-sign', floats, signs, { after: true });
  c.show('binary-xor', [rowNames[2], mask]);
  c.show('binary-count', distance, { after: true });
  c.swap('codec-bytes', distance, bytes, { after: true });

  const limit = 100,
    factor = 2.4,
    candidates = Math.ceil(limit * factor);
  assertEqual(candidates, 240, 'compressed candidates for full-vector rescoring');
  const searchTitle = heading('Which clauses can rescoring bring back?');
  const settings = place(
    label('Qdrant     •     limit ' + limit + '     •     oversampling ' + factor, { size: 42 }),
    TOP,
  );
  const [pool, bridge, result] = BODY.columns([2, 0.7, 2], 'wide');
  const stage = (region, name, detail, color) =>
    place(
      column([label(name, { size: 50 }), mono(detail, { size: 68, color })], { gap: 'wide' }),
      region,
    );
  const requested = stage(pool, 'Compressed search', limit + ' × ' + factor, 'blue');
  const poolCount = stage(pool, 'Compressed search', candidates + ' candidates', 'blue');
  const next = arrow([bridge.left, bridge.cy], [bridge.right, bridge.cy], {
    stroke: 'dim',
    width: 7,
  });
  const finalCount = stage(result, 'Rescore full vectors', 'top ' + limit, 'green');
  const turbo = place(
    label('TurboQuant     •     Rotate vectors, then quantize the coordinates.', { size: 39 }),
    FOOT,
  );
  const measure = place(
    label('Measure final recall and full request latency, including vector fetches.', { size: 38 }),
    FOOT,
  );
  c.swap(
    'shortlist-start',
    [binaryTitle, signRule, rowNames, signs, mask, bytes],
    [searchTitle, settings, requested],
  );
  c.swap('oversample', requested, poolCount, { after: true });
  c.show('rescore', [next, finalCount]);
  c.show('turbo-rotation', turbo);
  c.swap('codec-pin', turbo, measure);
}
