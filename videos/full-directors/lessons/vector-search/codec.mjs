import {
  P,
  text,
  line,
  rect,
  circle,
  title,
  footer,
  chip,
  caption,
  heading,
  row,
  lerp,
  cue,
  on,
  arrow,
  grid,
} from './plates.mjs';
import { books, code, original, collision, sumCode } from './examples.mjs';

function vectorStrip(c, v, x, y, w, color) {
  const cell = w / v.length;
  v.forEach((val, i) => {
    rect(c, x + i * cell, y, cell - 2, 43, color);
    text(c, val, x + (i + 0.5) * cell, y + 21.5, 24, P.paper, 'center', 'Mono');
  });
}
function bookPlot(c, j, x, y, side, showBook, selected) {
  const chunk = code.chunks[j],
    col = j ? P.berry : P.sea;
  rect(c, x, y, side, side, P.white, P.grid);
  const X = (v) => x + side * (0.16 + (0.68 * v) / 2),
    Y = (v) => y + side * (0.84 - (0.68 * v) / 2);
  for (const n of [0, 1, 2]) {
    line(c, X(n), Y(0), X(n), Y(2), P.grid);
    line(c, X(0), Y(n), X(2), Y(n), P.grid);
  }
  if (showBook)
    books.books[j].forEach(([u, v], i) => {
      const a = X(u),
        b = Y(v);
      line(c, a - 5, b, a + 5, b, col, 2.2);
      line(c, a, b - 5, a, b + 5, col, 2.2);
      text(c, String(i), a + (u ? 10 : -10), b + (v ? -10 : 10), 14, col, 'center', 'Mono');
    });
  const a = [X(chunk.values[0]), Y(chunk.values[1])],
    b = [X(chunk.reconstructed[0]), Y(chunk.reconstructed[1])];
  if (selected) {
    line(c, ...a, ...b, P.rust, 3);
    circle(c, ...b, 8, null, col, 2);
  }
  circle(c, ...a, 4.7, P.gold, P.ink);
}
export function quantize(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2) {
    const split = cue(k, 1, 'Split it down the middle', 1.3),
      showBook = on(k, 1, 'The four crosses'),
      first = on(k, 2, 'In the second pair'),
      second = on(k, 2, 'Store just'),
      recon = on(k, 2, 'Compare the reconstructed'),
      error = on(k, 2, 'That is product');
    title(
      c,
      recon
        ? 'How far did reconstruction move the vector?'
        : 'What survives when the floats are put away?',
      'Product quantization   /   one codebook per coordinate pair',
    );
    if (!recon && on(k, 2, 'The codebooks stay shared')) {
      const decoding = on(k, 2, 'To decode');
      heading(c, 'Stored passage', 49, 145);
      for (let j = 0; j < 2; j++) {
        const x = 328 + j * 170,
          col = j ? P.berry : P.sea;
        rect(c, x, 181, 144, 77, col);
        text(c, 'ID ' + code.ids[j], x + 72, 219, 31, P.white, 'center', 'Mono');
        if (decoding) {
          line(c, x + 72, 262, x + 72, 318, col, 2);
          vectorStrip(c, code.chunks[j].reconstructed, x, 318, 144, col);
        }
      }
      footer(
        c,
        decoding
          ? 'Each ID retrieves two center coordinates. Join the pairs in their original order.'
          : 'Only the IDs stay with the compressed record. Each codebook is shared across records.',
      );
      return;
    }
    if (!recon) {
      for (let j = 0; j < 2; j++) {
        const x = lerp(230 + j * 250, j ? 581 : 206, split),
          y = lerp(232, 117, split),
          w = lerp(250, 143, split),
          col = j ? P.berry : P.sea,
          selected = j ? second : first;
        vectorStrip(c, code.chunks[j].values, x, y, w, split ? col : P.ink);
        if (split === 0 && j === 0) caption(c, 'Original passage vector', 230, 196);
        if (split === 1) {
          const cx = j ? 651 : 277;
          line(c, x + 71, 160, cx, 177, col, 1.5);
          bookPlot(c, j, cx - 86, 180, 172, showBook, selected);
          text(c, 'Codebook ' + (j + 1), cx, 374, 17, col, 'center', 'Mono');
        }
        if (selected) {
          rect(c, (j ? 651 : 277) - 67, 394, 134, 36, col);
          text(c, 'Keep ID ' + code.ids[j], j ? 651 : 277, 412, 17, P.white, 'center', 'Mono');
        }
      }
      footer(
        c,
        second
          ? 'Stored record   [1, 2]     Each ID addresses its own shared codebook.'
          : showBook
            ? 'Gold marks the original pair. Which numbered center is nearest on each plate?'
            : 'Four float coordinates form one passage vector.',
      );
      return;
    }
    caption(c, 'Original', 46, 140);
    vectorStrip(c, original, 46, 163, 354, P.dim);
    caption(c, 'Reconstructed from IDs 1 and 2', 46, 241);
    vectorStrip(c, code.reconstructed, 46, 264, 354, P.sea);
    const a = Math.sqrt(code.chunks[0].distances[code.ids[0]]),
      d = Math.sqrt(code.chunks[1].distances[code.ids[1]]);
    const x = 539,
      y = 352,
      s = 502,
      xx = x + a * s,
      yy = y - d * s;
    line(c, x, y, xx, y, P.sea, 4);
    line(c, xx, y, xx, yy, P.berry, 4);
    line(c, x, y, xx, yy, P.rust, 3);
    rect(c, xx - 10, y - 10, 10, 10, null, P.dim);
    text(c, '√0.08', 0.5 * (x + xx), y + 22, 17, P.sea, 'center', 'Mono');
    text(c, '√0.10', xx + 16, (yy + y) / 2, 17, P.berry, 'left', 'Mono');
    if (error)
      text(
        c,
        '≈ ' + Math.sqrt(code.error2).toFixed(2),
        x + 35,
        yy + 23,
        20,
        P.rust,
        'center',
        'Mono',
      );
    heading(c, 'Error in two disjoint pairs', 505, 140);
    footer(
      c,
      error
        ? 'Squared error = 0.08 + 0.10 = 0.18. The diagonal shows its square root.'
        : 'The two legs measure the changes within the first and second coordinate pairs.',
    );
    return;
  }
  if (b <= 4) {
    title(
      c,
      'How many bytes stay with each record?',
      'Product codes   /   768-dimensional float32 vectors',
    );
    heading(c, 'Original coordinates', 43, 136);
    heading(c, 'One-byte IDs', 541, 136);
    for (let j = 0; j < 96; j++) {
      const x = 48 + (j % 12) * 33,
        y = 172 + Math.floor(j / 12) * 22;
      rect(c, x, y, 29, 17, P.dim);
      for (let u = 1; u < 8; u++) line(c, x + u * 3.65, y + 3, x + u * 3.65, y + 14, P.paper, 0.6);
      rect(c, 549 + (j % 12) * 21, 172 + Math.floor(j / 12) * 22, 15, 17, P.sea);
    }
    text(c, '96 groups × 8 floats × 4 B', 47, 382, 18, P.ink, 'left', 'Mono');
    text(c, '96 groups × 1 B', 544, 382, 18, P.sea, 'left', 'Mono');
    if (b === 4)
      text(c, books.rawBytes / books.codeBytes + '×', 867, 244, 40, P.sea, 'center', 'Serif');
    footer(
      c,
      b === 4
        ? '3,072 B → 96 B per vector. Shared float codebooks add 768 KiB to the index.'
        : 'Each chunk has 256 choices. One byte can address every center in its book.',
    );
    return;
  }
  title(c, 'What does a rotation preserve?', 'Optimized product quantization   /   before coding');
  const theta = (cue(k, 5, 'rotate together', 2) * Math.PI) / 3,
    base = [
      [1.2, 0.25],
      [1.45, 0.9],
    ];
  const rotate = ([x, y]) => [
    x * Math.cos(theta) - y * Math.sin(theta),
    x * Math.sin(theta) + y * Math.cos(theta),
  ];
  const pos = (p, rot) => {
    const v = rot ? rotate(p) : p;
    return [rot ? 680 + v[0] * 92 : 183 + v[0] * 92, 319 - v[1] * 92];
  };
  [false, true].forEach((rot) => {
    const [ox, oy] = pos([0, 0], rot);
    line(c, ox - 64, oy, ox + 190, oy, P.dim);
    line(c, ox, oy + 43, ox, oy - 180, P.dim);
    const a = pos(base[0], rot),
      b = pos(base[1], rot);
    arrow(c, [ox, oy], a, P.sea);
    arrow(c, [ox, oy], b, P.berry);
    line(c, ...a, ...b, P.rust, 3);
    for (const end of [a, b]) line(c, end[0], end[1], end[0], oy, P.dim, 1, [3, 3]);
    text(c, rot ? 'After rotation' : 'Before rotation', ox, 397, 20, P.ink, 'center', 'Serif');
  });
  footer(
    c,
    b === 5
      ? 'A square orthogonal rotation preserves the distance between the two tips.'
      : 'Use the same transform on both sides. Dropping dimensions can change distances.',
  );
}
function lookup(c, k, b) {
  let codes = code.ids,
    reads = 0,
    total = false;
  if (on(k, 1, 'Column one')) reads = 1;
  if (on(k, 2, 'Add the entries')) reads = 2;
  if (on(k, 2, 'This shortcut')) total = true;
  if (b === 3) {
    const next = on(k, 3, 'Change just'),
      swap = on(k, 3, 'Put that one');
    codes = books.codes[swap ? 2 : next ? 1 : 0];
    reads = 2;
    total = true;
  }
  if (b === 4) {
    codes = on(k, 4, 'The bytes pick') ? books.codes[3] : books.codes[2];
    reads = 2;
    total = true;
  }
  title(
    c,
    'What does each stored ID select?',
    'Asymmetric distance computation   /   uncompressed query [0, 0, 0, 0]',
  );
  caption(c, 'Codebook ID', 263, 131);
  for (let i = 0; i < 4; i++) text(c, i, 339 + i * 117, 163, 18, P.dim, 'center', 'Mono');
  books.tables.forEach((r, j) => {
    const y = 203 + j * 85,
      col = j ? P.berry : P.sea;
    text(c, 'Chunk ' + (j + 1), 43, y + 17, 20, col);
    chip(c, codes[j], 183, y + 17, col, 18);
    r.forEach((v, i) => {
      const selected = reads > j && codes[j] === i;
      rect(c, 291 + i * 117, y - 9, 97, 57, selected ? col : P.white, selected ? col : P.grid);
      text(c, v, 339 + i * 117, y + 19, 25, selected ? P.white : P.dim, 'center', 'Mono');
    });
  });
  caption(c, 'Squared distances from each query chunk to its four centers', 43, 381);
  if (total) {
    const terms = codes.map((id, j) => books.tables[j][id]);
    text(c, terms.join(' + ') + ' = ' + sumCode(codes), 738, 262, 26, P.ink, 'left', 'Mono', 600);
  }
  footer(
    c,
    b === 4
      ? 'A 96 × 256 float32 distance table takes 96 KiB per query.'
      : 'Each ID selects one entry in its own row. Add the selected squared distances.',
  );
}
export function adc(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 4) {
    lookup(c, k, b);
    return;
  }
  if (b === 6 && on(k, 6, 'Inside a residual IVF list')) {
    on(k, 6, 'first subtract the list center');
    on(k, 6, 'and encode what remains');
    on(k, 6, 'or use equivalent precomputed terms');
    title(
      c,
      'How does the coarse center enter the score?',
      'Residual IVF-PQ   /   one list center',
    );
    const sub = (a, b) => a.map((v, i) => +(v - b[i]).toFixed(1));
    const f = collision;
    [
      ['Stored vector', f.database, sub(f.database, f.coarse)],
      ['Query', f.query, sub(f.query, f.coarse)],
    ].forEach(([name, a, v], i) => {
      const y = 191 + 121 * i;
      text(c, name, 40, y - 29, 17, P.dim);
      vectorStrip(c, a, 40, y, 260, P.dim);
      text(c, '−', 320, y + 22, 28);
      vectorStrip(c, f.coarse, 355, y, 232, P.blue);
      text(c, '=', 603, y + 22, 28);
      vectorStrip(c, v, 638, y, 276, i ? P.sea : P.berry);
    });
    line(c, 32, 386, 928, 386, P.grid);
    text(c, 'Subtract the same list center from each side. Encode the database residual.', 32, 411, 20);
    return;
  }
  const after = (n, phrase) => {
    if (b !== n) return b > n;
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart: phrase }) === 1;
  };
  const tied = after(5, 'The approximate scores tie');
  const first = after(5, 'An ID tiebreak puts A first');
  const aOnly = after(5, 'If you kept only A, rescoring A cannot recover B');
  const admit = cue(k, 5, 'Keep both as candidates instead', 0.8);
  const compare = on(k, 5, 'Compare their original');
  const winner = after(6, 'B wins');
  const outcome = winner ? collision.originalOrder[0] : aOnly && !admit ? collision.adcOrder[0] : null;

  title(c, 'What can reranking recover?', 'Code collision   /   fixed query [0, 0, 0, 0]');
  ['Record', 'Original coordinates', 'Code', 'ADC', 'Exact squared distance'].forEach((label, i) =>
    caption(c, label, [49, 151, 497, 616, 727][i], 143),
  );
  collision.originals.forEach((p, j) => {
    const y = 207 + j * 73;
    const color = j ? P.sea : P.berry;
    chip(c, p.id, 81, y, color, 19);
    vectorStrip(c, p.values, 151, y - 22, 286, color);
    text(c, '[' + p.code.join(', ') + ']', 497, y, 21, P.ink, 'left', 'Mono');
    text(c, tied ? sumCode(p.code) : '—', 634, y, 24, P.ink, 'center', 'Mono');
    text(
      c,
      winner ? p.trueDistance2.toFixed(2) : compare ? '?' : '—',
      820,
      y,
      25,
      winner ? color : P.dim,
      'center',
      'Mono',
      600,
    );
  });
  const trayY = 395;
  line(c, 43, 323, 913, 323, P.grid, 1.5);
  caption(c, 'Sent to reranker', 45, trayY);
  const slotA = 290,
    slotB = 463,
    result = 808;
  let status = 'Approximate candidate window';
  if (first) status = 'Equal ADC scores · ID order';
  if (aOnly) status = 'Only A reached the reranker';
  if (admit) status = 'Widen the candidate window';
  if (compare) status = 'Both originals are available. Which is closer?';
  if (winner) status = 'Both originals reached the reranker';
  text(c, status, 46, 351, 19, P.dim);
  for (const x of [slotA, slotB, result]) {
    rect(c, x - 51, trayY - 23, 102, 46, P.white, P.grid);
  }
  if (first) chip(c, collision.adcOrder[0].id, slotA, trayY, P.berry, 16);
  if (admit) {
    const y = lerp(340, trayY, admit * admit * (3 - 2 * admit));
    if (admit < 1) line(c, slotB, 330, slotB, y, P.sea, 2.5);
    chip(c, collision.adcOrder[1].id, slotB, y, P.sea, 16);
  }
  arrow(c, [537, trayY], [720, trayY], P.dim, 2);
  caption(c, 'Exact top 1', 744, 351);
  if (outcome)
    chip(c, outcome.id, result, trayY, winner ? P.sea : P.berry, 17);
  else if (compare) text(c, '?', result, trayY, 24, P.dim, 'center', 'Mono');
}
