import { P, fmt, coord, lerpVector } from './drawing.mjs';
import {
  dot,
  robustUnit,
  cosine,
  scalarEncode,
} from '../../../films/embedding-geometry/arithmetic.mjs';
import { calibrationResult, calibrationRanking } from '../../../films/embedding-geometry/model.mjs';
export const storage = (rows, width, groups) => ({
  float: rows * width * 4,
  scalar: rows * width,
  sign: rows * Math.ceil(width / 8),
  pq: rows * groups,
  books: groups * 256 * (width / groups) * 4,
});
export function payload(d) {
  const { b, head, txt, cue, box } = d;
  const large = b >= 6,
    rows = large ? 50e6 : 1e6,
    width = large ? 768 : 1536;
  const alloc = storage(rows, width, 96);
  head(
    large ? 'How much space do 50 million rows need?' : 'What does one row cost?',
    (large ? '50 million' : '1 million') + ' rows   ×   ' + width + ' coordinates',
  );
  const factors = [
    ['FP32', alloc.float, P.query, 1],
    ['Scalar byte', alloc.scalar, P.green, large ? cue(6, 'One byte per') : cue(2, 'One byte per')],
    ['Sign bit', alloc.sign, P.pink, large ? cue(7, 'Packed signs') : cue(3, 'One bit')],
    [
      'Product IDs',
      alloc.pq,
      P.gold,
      large ? cue(7, 'ninety-six-byte') : cue(3, 'one byte for each group'),
    ],
  ];
  txt(large ? 'Payload across all rows' : 'Row payload', 308, 190, 23, P.muted);
  txt(large ? 'Total · decimal GB' : 'Bytes / row', 940, 190, 23, P.muted);
  factors.forEach(([name, n, col, a], i) =>
    d.fade(a, () => {
      const y = 232 + i * 73;
      txt(name, 67, y + 26, 26, P.ink, 'Serif');
      box(309, y, (560 * n) / alloc.float, 29, col, null, 2);
      txt(large ? fmt(n / 1e9, 1) + ' GB' : fmt(n / rows) + ' B', 940, y + 27, 30, col, 'Mono');
    }),
  );
  if (!large && b >= 4) {
    txt('PQ rows   ' + fmt(alloc.pq / 2 ** 20, 1) + ' MiB', 67, 563, 30, P.gold, 'Mono');
    d.fade(cue(5, 'one and a half'), () =>
      txt('Shared books   ' + fmt(alloc.books / 2 ** 20, 1) + ' MiB', 599, 563, 30, P.ink, 'Mono'),
    );
    d.fade(cue(5, 'keep the original vectors'), () =>
      txt(
        'Retained originals   +' + fmt(alloc.float / 2 ** 30, 2) + ' GiB',
        67,
        620,
        29,
        P.query,
        'Mono',
      ),
    );
  } else if (!large)
    txt('FP32 total   ' + fmt(alloc.float / 2 ** 30, 2) + ' GiB', 67, 574, 30, P.query, 'Mono');
}
export const signed = { value: 0.424, bound: 1.27 };
export function signedByte() {
  const step = signed.bound / 127,
    code = scalarEncode(signed.value, signed.bound);
  return { step, code, decoded: step * code, error: signed.value - step * code };
}
export function unsignedTicks(lo, hi) {
  const ticks = [];
  for (let code = 0; code <= 255; code += 17) {
    ticks.push({ code, real: lo + (code * (hi - lo)) / 255 });
  }
  return ticks;
}
export function scalar(d) {
  const { b, head, txt, cue, byte, line } = d;
  if (b <= 4) {
    head(
      'A coordinate goes into one byte',
      'Signed symmetric codec  ·  bound 1.27  ·  usable codes −127 … 127',
    );
    const s = signedByte();
    const X = (x) => 90 + ((x - 0.4) * 1080) / 0.05;
    d.line(X(0.4), 319, X(0.45), 319, P.metal, 3);
    for (let code = 40; code <= 45; code++) {
      const level = code * s.step;
      d.line(X(level), 319, X(level), 334, P.metal);
      txt(level.toFixed(2), X(level), 367, 24, P.muted, 'Mono', 'center');
    }
    d.circle(X(signed.value), 319, 9, P.query);
    txt('0.424', X(signed.value), 271, 33, P.query, 'Mono', 'center');
    d.fade(cue(2, 'recover point four two'), () => {
      d.circle(X(s.decoded), 319, 10, P.gold);
      txt('decoded', X(s.decoded) - 20, 289, 22, P.gold, 'Sans', 'right');
      d.line(X(s.decoded), 302, X(signed.value), 302, P.gold, 2);
    });
    txt('Step   ' + fmt(s.step), 90, 427, 27, P.muted, 'Mono');
    const packed = cue(2, 'Store forty-two') === 1;
    byte(90, 464, packed ? s.code : null);
    txt(packed ? 'signed byte   ' + s.code : 'signed byte', 90, 559, 27, P.gold, 'Mono');
    if (b >= 2) txt('0.424 / 0.01 = 42.4', 610, 453, 29, P.ink, 'Mono');
    d.fade(cue(2, 'recover point four two'), () =>
      txt('42 × 0.01 = ' + fmt(s.decoded), 610, 518, 33, P.gold, 'Mono'),
    );
    if (b >= 3) txt('Discarded   ' + fmt(s.error, 3), 610, 582, 27, P.pink, 'Mono');
  } else {
    const extended = cue(6, 'An interval from zero') === 1;
    const lo = extended ? 0 : 2,
      hi = 3;
    head('Where does code zero land?', 'Unsigned range-offset codec  ·  Codes 0 … 255  ·  Gold ticks mark every 17th code');
    const X = (v) => 160 + v * 320;
    txt('Code', 58, 295, 24, P.gold);
    line(X(lo), 323, X(hi), 323, P.gold, 3);
    for (const { code, real } of unsignedTicks(lo, hi)) {
      const x = X(real);
      const labeled = code % 85 === 0;
      line(x, 323, x, labeled ? 343 : 332, P.gold);
      if (labeled) txt(code, x, 295, 28, P.gold, 'Mono', 'center');
    }
    txt('Real', 58, 413, 24, P.ink);
    line(X(0), 355, X(3), 355, P.metal);
    for (let i = 0; i <= 3; i++) {
      line(X(i), 355, X(i), 375, P.metal);
      txt(i, X(i), 413, 27, P.ink, 'Mono', 'center');
    }
    if (b === 6 && !extended) {
      line(X(0), 323, X(lo), 323, P.pink, 2, [5, 6]);
      txt('−510 steps', X(1), 295, 30, P.pink, 'Mono', 'center');
    }
    txt('real = ' + lo + ' + code × ' + (hi - lo) + '/255', 92, 523, 37, P.ink, 'Mono');
    if (b >= 7)
      txt('dot term = q[i] × (offset[i] + step[i] × code[i])', 92, 599, 30, P.query, 'Mono');
  }
}
export function scaleRows() {
  return [
    [8, 0],
    [0, 1],
  ].map((row) => {
    const bounds = [10, 1],
      codes = row.map((x, i) => scalarEncode(x, bounds[i]));
    const decoded = codes.map((v, i) => (v * bounds[i]) / 127);
    return { codes, decoded, raw: dot([1, 1], codes), score: dot([1, 1], decoded) };
  });
}
export function scales(d) {
  const { head, txt, rule, circle, b, cue } = d,
    rows = scaleRows();
  head('What does one code step buy?', 'q = [1, 1]   ·   A = [8, 0]   ·   B = [0, 1]');
  const repaired = cue(4, 'Multiply each code') === 1;
  [10, 1].forEach((bound, i) => {
    if (i === 1 && b < 2) return;
    const y = 251 + i * 136,
      col = [P.green, P.pink][i],
      val = rows[i].codes[i];
    txt(i ? 'B · d₁' : 'A · d₀', 65, y + 7, 28, col, 'Mono');
    rule(269, y, 616, 127, P.metal);
    circle(269 + (val / 127) * 616, y, 10, col);
    txt('0', 268, y + 52, 23, P.muted, 'Mono');
    txt('127', 887, y + 52, 23, P.muted, 'Mono', 'right');
    txt('step ' + bound + '/127', 931, y + 12, 26, col, 'Mono');
    if (b >= 3) txt(val, 269 + (val / 127) * 616, y - 23, 30, col, 'Mono', 'center');
  });
  if (b >= 3) {
    txt(repaired ? 'Scale-weighted dot' : 'Raw code sum', 64, 530, 26, P.muted);
    rows.forEach((r, i) =>
      txt(
        (i ? 'B    ' : 'A    ') + fmt(repaired ? r.score : r.raw, 3),
        326 + i * 350,
        572,
        44,
        [P.green, P.pink][i],
        'Mono',
      ),
    );
    if (b === 5) txt('Cosine also needs the reconstructed norms.', 65, 635, 26, P.gold);
  }
}
export function calibration(d) {
  const { b, cue, head, txt, rule, circle, line } = d;
  if (b < 4) {
    head(
      'Where do the ordinary values land?',
      '101 values in [−1, 1]  ·  extra calibration value 25',
    );
    [25, 1].forEach((bound, i) =>
      d.fade(i ? cue(2, 'clipped bound') : 1, () => {
        const c = calibrationResult(bound),
          y = 260 + i * 181,
          X = (v) => 330 + (v + 1) * 269;
        txt('Bound ' + bound, 65, y + 6, 32, [P.query, P.gold][i], 'Serif');
        rule(X(-1), y + 34, 538, 10);
        txt('−1', X(-1), y + 83, 22, P.muted, 'Mono', 'center');
        txt('1', X(1), y + 83, 22, P.muted, 'Mono', 'center');
        const buckets = new Map();
        for (const val of c.output) {
          const key = val.toFixed(6);
          buckets.set(key, 1 + (buckets.get(key) || 0));
        }
        for (const [v, n] of buckets)
          line(X(+v), y + 27, X(+v), y + 22 - 6 * n, [P.query, P.gold][i], 3);
        txt('25 → ' + fmt(c.outlier), 925, y, 27, P.pink, 'Mono');
        if (b === 3) txt('MAE ' + c.mae.toFixed(4), 925, y + 51, 25, P.ink, 'Mono');
      }),
    );
    if (b === 3) txt('Clipped outlier error   25 − 1 = 24', 66, 622, 29, P.pink, 'Mono');
  } else {
    const f = calibrationRanking();
    const fine = cue(4, 'Switch to the fine'),
      coarse = cue(4, 'Use the wide');
    const stage = fine > 0 ? 'fine' : coarse > 0 ? 'coarse' : 'original';
    const arr = f[stage],
      scores = f[stage + 'Scores'];
    head(
      'Does better resolution recover the direction?',
      'q = [1, 0]  ·  equal scores break in storage order',
    );
    txt(
      { original: 'Full precision', coarse: 'Wide bound   25', fine: 'Fine bound   1' }[stage],
      66,
      214,
      37,
      P.gold,
      'Serif',
    );
    txt('Row', 68, 296, 22, P.muted);
    txt(
      stage === 'original' ? 'Original unit coordinates' : 'Coordinates after reconstruction',
      296,
      296,
      22,
      P.muted,
    );
    txt('Cosine', 942, 296, 22, P.muted);
    arr.forEach((v, i) => {
      const y = 369 + 90 * i,
        col = [P.green, P.pink][i];
      txt(i ? 'B' : 'A', 70, y, 35, col, 'Mono');
      txt(coord(v, 4), 296, y, 33, col, 'Mono');
      txt(scores[i].toFixed(6), 942, y, 30, P.ink, 'Mono');
    });
    txt('First row returned   ' + ['A', 'B'][f[stage + 'Winner']], 67, 570, 36, P.gold, 'Serif');
  }
}
export const integerRows = [
  [127, 127],
  [126, 126],
].map((v) => {
  const exact = dot([127, 127], v),
    lo = new Int8Array([exact])[0];
  return { v, exact, lo, hi: exact >> 8 };
});
export function integer(d) {
  const { head, b, cue, txt, byte, box } = d;
  const narrow = cue(2, 'Write the result') > 0,
    late = cue(3, 'You still have') > 0,
    repair = cue(3, 'Widen them before') > 0;
  const state = repair ? 'wide' : late ? 'late' : narrow ? 'narrow' : 'full';
  head(
    {
      full: 'Multiply the integer operands',
      narrow: 'Keep only the low byte',
      late: 'Cast the stored result',
      wide: 'Widen before multiplication',
    }[state],
    'Query codes  [127, 127]',
  );
  txt('Row codes', 66, 185, 22, P.muted);
  txt('High byte', 335, 185, 22, P.muted);
  txt('Low byte', 666, 185, 22, P.muted);
  txt('Score', 1041, 185, 22, P.muted);
  integerRows.forEach((r, i) => {
    const y = 239 + i * 144,
      col = [P.green, P.pink][i],
      exact = state === 'wide' || state === 'full';
    txt((i ? 'B  ' : 'A  ') + coord(r.v), 64, y + 34, 25, col, 'Mono');
    if (state === 'narrow') {
      box(333, y, 294, 48, P.shadow, P.faint);
      txt('discarded', 480, y + 33, 22, P.muted, 'Sans', 'center');
    } else byte(333, y, exact ? r.hi : 0, { width: 300, color: col });
    byte(666, y, r.lo, { width: 300, color: col });
    txt(exact ? r.exact : r.lo, 1041, y + 36, 36, col, 'Mono');
  });
  if (b === 4)
    txt(
      '1536 × 127² = ' + (1536 * 127 ** 2).toLocaleString('en-US') + ' < 2^31',
      67,
      590,
      36,
      P.gold,
      'Mono',
    );
  else
    txt(
      {
        full: 'Exact sum',
        narrow: 'INT8 result',
        late: 'Zero high bits for these positive results',
        wide: 'Wide products + wide sum',
      }[state],
      66,
      579,
      30,
      P.gold,
      'Serif',
    );
}
