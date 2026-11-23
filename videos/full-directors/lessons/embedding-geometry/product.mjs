import { P, fmt, coord, mix, lerpVector } from './drawing.mjs';
import { PQ_PAIRS, PQ_QUERY } from '../../../films/embedding-geometry/fixtures.mjs';
import { dot, l2, cosine, signCode } from '../../../films/embedding-geometry/arithmetic.mjs';
import { pqTables } from '../../../films/embedding-geometry/model.mjs';

const books = PQ_PAIRS.map((v) => [[0, 0], v]);
export function nearestId(v, centers) {
  const gaps = centers.map((c) => l2(c, v));
  return gaps.indexOf(Math.min(...gaps));
}
export const encoding = PQ_PAIRS.map((v, i) => nearestId(v, books[i]));
export const lookup = (ids) => {
  const cells = pqTables(),
    terms = cells.map((row, i) => row[ids[i]]);
  return { ids, cells, terms, total: terms.reduce((a, b) => a + b, 0) };
};
export function book(d) {
  const { head, txt, box, cue, b } = d;
  const matches = cue(3, 'Center one matches'),
    sweep = cue(3, 'Repeat with the other', 2.4);
  const n = matches > 0 ? 1 + Math.min(3, Math.floor(3.999 * sweep)) : 0;
  const page = Math.max(0, n - 1),
    pair = PQ_PAIRS[page];
  head('File four pairs in four codebooks', 'Eight-coordinate document');
  PQ_PAIRS.forEach((v, i) => {
    const x = 74 + i * 302;
    box(x, 168, 250, 63, i === page ? '#304842' : P.shadow, i === page ? P.gold : P.faint);
    txt(coord(v, 1), x + 125, 210, 29, i === page ? P.gold : P.ink, 'Mono', 'center');
  });
  const x = 92,
    y = 302;
  for (let i = 3; i >= 0; i--)
    box(x + 5 * i, y + 5 * i, 621, 207, i === 0 ? '#e2d6b2' : '#637777', P.shadow, 8);
  d.line(401, 310, 401, 497, '#b6a279', 3);
  txt('Book ' + (page + 1), 98, 281, 25, P.muted);
  [0, 1].forEach((j) => {
    const cx = 248 + 307 * j;
    txt('Center ' + j, cx, 366, 28, '#334a49', 'Serif', 'center');
    txt(coord(books[page][j]), cx, 438, 33, '#182b30', 'Mono', 'center');
    if (n && j === encoding[page]) d.line(cx - 70, 462, cx + 70, 462, '#aa6833', 4);
  });
  txt('Stored byte IDs', 798, 326, 28, P.ink, 'Serif');
  for (let i = 0; i < 4; i++) {
    const xx = 795 + 101 * i;
    box(xx, 368, 82, 70, P.shadow, i < n ? P.gold : P.metal);
    txt(i < n ? encoding[i] : '·', xx + 41, 415, 34, i < n ? P.gold : P.metal, 'Mono', 'center');
    txt('b' + (i + 1), xx + 41, 475, 21, P.muted, 'Mono', 'center');
  }
  if (b === 4) txt('Training target  ·  sum of squared reconstruction errors', 71, 598, 29, P.gold);
  if (b === 5) txt('Decode with the same book version and pair order.', 71, 598, 29, P.gold);
}
export function adcState(d) {
  const active = d.cue(3, 'Each one selects') > 0,
    second = d.cue(5, 'second lookup moves') > 0,
    zero = d.cue(6, 'Try all four zero') > 0;
  return { active, ...lookup(zero ? [0, 0, 0, 0] : second ? [1, 0, 1, 1] : encoding) };
}
export function adc(d) {
  const { b, cue, head, txt, line, box, circle, rule } = d;
  if (b <= 6) {
    const s = adcState(d);
    head(
      'Score the document by reading its IDs',
      'Full-precision query  ·  squared L2  ·  center 0 is [0, 0] in every book',
    );
    ['Query pair', 'Center 1', 'ID 0', 'ID 1', 'Stored ID', 'Term'].forEach((k, i) =>
      txt(k, [53, 283, 558, 715, 885, 1080][i], 206, 24, P.muted),
    );
    PQ_QUERY.forEach((q, i) => {
      const y = 238 + i * 74;
      txt(coord(q, 1), 53, y + 39, 26, P.query, 'Mono');
      txt(coord(PQ_PAIRS[i], 1), 283, y + 39, 26, P.muted, 'Mono');
      [0, 1].forEach((j) => {
        const selected = s.active && s.ids[i] === j;
        box(
          526 + 158 * j,
          y,
          135,
          55,
          selected ? '#444532' : P.shadow,
          selected ? P.gold : P.faint,
        );
        const ready = b >= 2 || (i === 0 && j === 1 && cue(1, 'point zero two') > 0);
        txt(
          ready ? s.cells[i][j].toFixed(2) : '·',
          592 + 158 * j,
          y + 37,
          29,
          selected ? P.gold : P.ink,
          'Mono',
          'center',
        );
      });
      if (s.active) {
        txt(s.ids[i], 924, y + 38, 29, P.gold, 'Mono');
        txt(s.terms[i].toFixed(2), 1075, y + 38, 29, P.ink, 'Mono');
      }
    });
    if (s.active) {
      line(1024, 537, 1214, 537, P.gold);
      txt('Σ', 968, 589, 38, P.muted);
      const showTotal =
        s.ids[0] === 0
          ? cue(6, 'seven. The same') > 0
          : s.ids[1] === 0
            ? cue(5, 'five five', 0.75) === 1
            : cue(3, 'We used the original') > 0;
      txt(showTotal ? s.total.toFixed(2) : '…', 1063, 589, 43, P.gold, 'Mono');
    }
    d.fade(cue(6, 'ninety-six kibibytes'), () =>
      txt('96 × 256 × 4 B = 96 KiB per query', 76, 602, 25, P.muted, 'Mono'),
    );
  } else {
    const docSnap = cue(8, 'Move each document', 1.3),
      qs = cue(9, 'Move the query', 1.3);
    const q = mix(1.4, 2, qs),
      a = mix(1.4, 2, docSnap),
      points = [q, a, 2];
    const X = (x) => 270 + x * 365;
    head(
      'Which side gets encoded?',
      qs === 1
        ? 'Symmetric distance computation'
        : qs > 0
          ? 'Encoding the query'
          : docSnap === 1
            ? 'Asymmetric distance computation'
            : docSnap > 0
              ? 'Encoding the documents'
              : 'Original positions and the two centers',
    );
    txt('Centers', 65, 212, 25, P.muted);
    [0, 2].forEach((x) => {
      d.line(X(x), 226, X(x), 517, P.metal, 2, [5, 6]);
      txt(x, X(x), 213, 28, P.gold, 'Mono', 'center');
    });
    points.forEach((v, i) => {
      const y = 287 + 92 * i,
        col = [P.query, P.green, P.pink][i];
      txt(['Query', 'A', 'B'][i], 69, y + 9, 31, col, 'Serif');
      rule(X(0), y, X(2.25) - X(0), 9);
      circle(X(v), y, 10, col);
      txt(fmt(v), X(v), y - 20, 22, col, 'Mono', 'center');
    });
    txt('Squared gaps', 68, 594, 28, P.muted);
    txt('A   ' + fmt((q - a) ** 2, 3), 401, 594, 35, P.green, 'Mono');
    txt('B   ' + fmt((q - 2) ** 2, 3), 840, 594, 35, P.pink, 'Mono');
  }
}
export const rotate = (v, r) => [
  v[0] * Math.cos(r) - v[1] * Math.sin(r),
  v[0] * Math.sin(r) + v[1] * Math.cos(r),
];
export function transform(d) {
  const { b, cue, head, txt, line, circle, arrow } = d;
  if (b === 1) {
    const t = cue(1, 'Snap each document', 1.5),
      vs = [lerpVector([1, 0], [0.8, 0], t), lerpVector([0.8, 0.6], [0.8, 0.8], t)];
    head('Score the reconstructed arrows', 'q = [1, 0]');
    const o = [154, 541],
      pt = (v) => [o[0] + v[0] * 415, o[1] - v[1] * 415];
    d.ctx.beginPath();
    d.ctx.arc(...o, 415, -Math.PI / 2, 0);
    d.ctx.strokeStyle = P.faint;
    d.ctx.lineWidth = 2;
    d.ctx.stroke();
    arrow(o, pt([1, 0]), P.query, 6);
    vs.forEach((v, i) => {
      const col = i ? P.pink : P.green;
      arrow(o, pt(v), col, 4);
      txt(i ? 'B' : 'A', pt(v)[0] + 12, pt(v)[1] - 12, 24, col, 'Mono');
    });
    ['Dot', 'Cosine', 'Squared gap'].forEach((h, i) => txt(h, 694, 248 + 101 * i, 25, P.muted));
    vs.forEach((v, i) => {
      [dot([1, 0], v), cosine([1, 0], v), l2([1, 0], v) ** 2].forEach((z, j) =>
        txt(fmt(z, 3), 932 + 165 * i, 249 + 101 * j, 31, i ? P.pink : P.green, 'Mono'),
      );
    });
  } else if (b === 2) {
    const r = (cue(2, 'Turn a query', 2.2) * Math.PI) / 2,
      q = rotate([1, 0], r),
      v = rotate([0.6, 0.8], r),
      o = [410, 480],
      pt = (a) => [o[0] + a[0] * 270, o[1] - a[1] * 270];
    head('Turn the query and document together', 'Before encoding  ·  orthonormal transform');
    line(98, 480, 725, 480, P.faint);
    line(410, 178, 410, 565, P.faint);
    arrow(o, pt(q), P.query, 5);
    arrow(o, pt(v), P.green, 5);
    line(...pt(q), ...pt(v), P.gold, 3, [4, 6]);
    txt('q', pt(q)[0] + 12, pt(q)[1] + 30, 27, P.query, 'Mono');
    txt('d', pt(v)[0] - 12, pt(v)[1] - 14, 27, P.green, 'Mono');
    d.dial('Dot product', fmt(dot(q, v)), 870, 260, P.query);
    d.dial('Squared gap', fmt(l2(q, v) ** 2), 870, 397, P.gold);
  } else {
    const anchor = [4, 2],
      res = [0.8, 0.1],
      q = [5, 2],
      a = cue(3, 'Place its tail', 1.5) * (1 - cue(3, 'Place it at zero', 1.5)),
      tail = anchor.map((v) => v * a),
      end = res.map((v, i) => v + tail[i]);
    const pt = (v) => [118 + v[0] * 166, 521 - v[1] * 146];
    head(
      'Where is the origin of this code?',
      a === 1
        ? 'Reconstruction = coarse center + residual'
        : a === 0
          ? 'Residual alone  [0.8, 0.1]'
          : 'Moving the tail of the same residual',
    );
    line(...pt([0, 0]), ...pt([5.8, 0]), P.metal);
    line(...pt([0, 0]), ...pt([0, 2.25]), P.metal);
    circle(...pt(anchor), 7, P.gold);
    txt('coarse center', pt(anchor)[0] - 9, pt(anchor)[1] - 33, 24, P.gold, 'Sans', 'right');
    circle(...pt(q), 8, P.query);
    txt('q', pt(q)[0] + 16, pt(q)[1] + 11, 26, P.query, 'Mono');
    arrow(pt(tail), pt(end), P.green, 6);
    line(...pt(end), ...pt(q), P.query, 2, [5, 6]);
    txt('Tail  ' + coord(tail), 74, 606, 29, P.muted, 'Mono');
    txt('Squared gap   ' + fmt(l2(q, end) ** 2, 2), 674, 606, 32, P.query, 'Mono');
  }
}
export const signRows = [
  [0.3, -0.1, 0.8, -0.4],
  [0.5, -0.2, 0.7, 0.1],
];
export const nineSigns = [1, -1, 1, -1, 1, -1, 1, -1, 1];
export function packSigns(v) {
  const bytes = new Uint8Array(Math.ceil(v.length / 8));
  v.forEach((x, i) => {
    if (x > 0) bytes[i >> 3] |= 1 << (i % 8);
  });
  return [...bytes];
}
export const pop = (v) => v.toString(2).replaceAll('0', '').length;
export function binary(d) {
  const { b, cue, head, txt, byte } = d;
  if (b >= 4) {
    const alignedWidth = cue(6, 'At widths divisible by eight') > 0;
    const signs = alignedWidth ? nineSigns.slice(0, 8) : nineSigns;
    const packed = packSigns(signs);
    head(
      alignedWidth ? 'Eight signs fill one byte' : 'The ninth sign opens another byte',
      'Dimension 0 occupies the low bit  ·  bytes stored low first',
    );
    txt('d₀ … d₇', 98, 274, 31, P.green, 'Mono');
    byte(95, 313, packed[0], { color: P.green });
    txt('0x55', 94, 421, 34, P.green, 'Mono');
    txt('8 logical bits', 95, 482, 25, P.muted);
    if (alignedWidth) {
      txt(signs.length + ' FP32 coordinates', 714, 311, 31, P.ink);
      txt(signs.length + ' × 4 = ' + signs.length * 4 + ' bytes', 714, 371, 34, P.ink, 'Mono');
      txt('Packed / FP32   ' + packed.length + ' B / ' + signs.length * 4 + ' B', 94, 600, 30, P.ink, 'Mono');
    } else {
      txt('d₈', 718, 274, 31, P.gold, 'Mono');
      byte(714, 313, packed[1], { pad: 7 });
      txt('0x01', 712, 421, 34, P.gold, 'Mono');
      txt('7 padding bits + 1 sign', 712, 482, 25, P.muted);
    }
    return;
  }
  const packed = signRows.map((v) => packSigns(v)[0]),
    xor = packed[0] ^ packed[1];
  head(
    'Which signs survive in the byte?',
    b === 1
      ? 'Coordinate order  ·  positive → 1, otherwise → 0'
      : 'High bits on the left  ·  dimension 0 in bit 0',
  );
  signRows.forEach((v, i) => {
    const y = 236 + i * 131,
      col = i ? P.pink : P.green;
    txt(i ? 'B' : 'A', 65, y + 32, 35, col, 'Serif');
    txt(coord(v, 1), 135, y + 32, 26, col, 'Mono');
    if (b === 1) txt(v.map((x) => +(x > 0)).join('   '), 755, y + 32, 29, col, 'Mono');
    else {
      byte(599, y, packed[i], { color: col, pad: 4 });
      txt(
        '0x' + packed[i].toString(16).toUpperCase().padStart(2, '0'),
        1066,
        y + 34,
        29,
        col,
        'Mono',
      );
    }
  });
  if (b >= 2)
    d.fade(cue(2, 'Exclusive OR'), () => {
      txt('XOR', 363, 531, 31, P.ink, 'Mono');
      byte(599, 499, xor);
      if (b === 3) txt('Hamming distance   ' + pop(xor), 600, 617, 30, P.gold, 'Mono');
    });
}
export const signsA = [1, 0.01, -1, -0.01],
  signsB = [0.01, 1, -0.01, -1];
export function signAngle(d) {
  const { b, head, txt, cue, box, line, circle, arrow } = d;
  const p = cue(1, 'exchange the', 1.6),
    v = lerpVector(signsA, signsB, p),
    cos = cosine(v, signsA);
  if (b <= 2) {
    head('Trade magnitudes within each sign', 'The sign threshold stays at zero');
    [signsA, v].forEach((a, i) => {
      const x = 114 + i * 621,
        y = 364,
        col = i ? P.pink : P.green;
      txt(i ? 'B' : 'A', x, y - 149, 34, col, 'Serif');
      line(x - 10, y, x + 421, y, P.metal);
      a.forEach((val, j) => {
        const xx = x + 102 * j,
          h = 117 * val;
        box(xx, Math.min(y, y - h), 49, Math.max(1, Math.abs(h)), col, null, 1);
        txt(fmt(val, 2), xx + 22, y + 161, 21, col, 'Mono', 'center');
      });
    });
    if (b === 2)
      txt(
        'Hamming   ' + pop(signCode(signsA) ^ signCode(v)) + '        cosine   ' + fmt(cos, 3),
        113,
        608,
        35,
        P.gold,
        'Mono',
      );
  } else if (b < 5) {
    head(
      'Which cuts separate the two directions?',
      'Plane spanned by the two vectors  ·  random hyperplane orientations',
    );
    const theta = Math.acos(cos),
      o = [390, 416],
      R = 188,
      end = (a, r) => [o[0] + r * Math.cos(a), o[1] - r * Math.sin(a)];
    circle(...o, R, null, P.faint);
    const r = (d.clock.progress * 0.95 + (b - 3) * 0.95) * Math.PI;
    line(...end(r, -R), ...end(r, R), P.gold, 4);
    arrow(o, end(0, R * 0.92), P.green, 5);
    arrow(o, end(theta, R * 0.92), P.pink, 5);
    const sides = Math.sin(-r) * Math.sin(theta - r);
    txt(
      Math.abs(sides) < 1e-10
        ? 'Cut passes through a tip'
        : sides < 0
          ? 'Cut separates the tips'
          : 'Tips share a side',
      390,
      649,
      25,
      P.gold,
      'Sans',
      'center',
    );
    d.dial('Angle / π', fmt(theta / Math.PI, 3), 788, 314, P.gold);
    txt('Expected disagreement', 788, 447, 30, P.ink, 'Serif');
    txt('Independent isotropic cuts', 788, 493, 23, P.muted);
  } else {
    head('How many distinct distances fit?', 'Fixed 384-bit query  ·  100,000 stored rows');
    for (let i = 0; i <= 384; i++) {
      const x = 83 + i * 2.85;
      line(x, 371, x, 371 + (i % 32 === 0 ? 70 : 31), P.metal, 1.4);
    }
    txt('0', 83, 494, 31, P.query, 'Mono');
    txt('384', 1176, 494, 31, P.query, 'Mono', 'right');
    txt('385 Hamming distances', 635, 287, 47, P.gold, 'Serif', 'center');
    txt('Inspect ties at the shortlist cutoff.', 635, 593, 31, P.ink, 'Serif', 'center');
  }
}
