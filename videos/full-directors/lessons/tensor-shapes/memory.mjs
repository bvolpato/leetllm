import {
  batch,
  bytesPerFeature,
  reshapeBatch0,
  sentenceWords,
  tokenStride,
  transposeBatch0,
  transposeReadOffsets,
  writeExample,
} from './examples.mjs';
import {
  arrow,
  beat,
  brace,
  brass,
  clamp,
  cue,
  dim,
  foot,
  frame,
  galley,
  ink,
  line,
  milk,
  mono,
  name,
  paper,
  row,
  sort,
  stock,
  teal,
  text,
  tray,
} from './typecase.mjs';

const material = (v) => stock[Math.floor(v / 4)];
function flatRail(c, y, values, focus = []) {
  const x = 102,
    w = 63;
  tray(c, x - 4, y - 4, values.length * w + 8, 52);
  values.forEach((v, i) => sort(c, x + i * w, y, w, 43, v, material(v), focus.includes(i)));
}
export function layouts(c, k) {
  const b = beat(k);
  if (b === 2) {
    const inferred = cue(k, 2, 'Keep that four-feature grouping', 0.6) > 0;
    name(c, 'C-order read', 258, 118, 26, milk, 'center');
    batch.forEach((r, i) => {
      text(c, 'Sentence ' + i, 50, 160 + i * 106, 17, milk);
      row(c, r.flat(), 50, 176 + i * 106, 33, 42, r.flat().map(material));
    });
    arrow(c, 460, 246, 52);
    name(c, 'Four per row', 696, 115, 26, milk, 'center');
    const allRows = batch.flat();
    allRows.forEach((r, t) => {
      const yy = 144 + 40 * t;
      if (inferred) {
        row(c, r, 636, yy, 42, 37, r.map(material));
        name(c, sentenceWords.flat()[t], 619, yy + 16, 18, material(r[0]), 'right');
      }
    });
    if (!inferred) mono(c, '[ ?, 4 ]', 696, 230, 29, brass, 'center');
    foot(
      c,
      inferred ? 'x.reshape(-1, 4)    24 / 4 = 6 rows' : 'x.reshape(-1, 4)    How many rows fit?',
    );
    return;
  }
  const xL = 169,
    xR = 624,
    y = 142,
    w = 56,
    h = 41;
  const layout = (matrix, x, amount, isTranspose) => {
    tray(c, x - 4, y - 4, w * 3 + 8, h * 4 + 10);
    matrix.forEach((r, t) =>
      r.forEach((v, j) => {
        const i = t * 3 + j;
        const p = clamp(amount * 12 - i);
        if (p <= 0) return;
        const focus = b === 5 && (isTranspose ? t === 3 : t === 2);
        c.save();
        c.beginPath();
        c.rect(x + j * w, y + t * h, p * w, h);
        c.clip();
        sort(c, x + j * w, y + t * h, w, h, v, material(v));
        c.restore();
        if (focus && p === 1) frame(c, x + j * w, y + t * h, w, h);
      }),
    );
  };
  const regroup = cue(k, 1, 'Try a reshape', 3.8);
  const transpose = cue(k, 3, 'transpose the axes', 3.1);
  name(c, 'Regroup in threes', xL + 83, 109, 24, milk, 'center');
  layout(reshapeBatch0, xL, regroup, false);
  if (b >= 3) {
    name(c, 'Read along the token axis', xR + 84, 109, 24, milk, 'center');
    for (let t = 0; t < 4; t++) mono(c, 'f' + t, xR - 14, y + (t + 0.45) * h, 15, dim, 'right');
    layout(transposeBatch0, xR, transpose, true);
    sentenceWords[0].forEach((v, t) => text(c, v, xR + (t + 0.5) * w, 322, 14, stock[t], 'center'));
  } else {
    name(c, 'Original words', 687, 109, 24, milk, 'center');
    galley(c, batch[0], sentenceWords[0], 612, 146, 52, 46);
  }
  const showStride = cue(k, 3, 'Track feature three', 1) > 0;
  flatRail(c, 355, batch[0].flat(), showStride ? [3, 7, 11] : []);
  if (showStride) {
    const a = 102 + 3.5 * 63;
    brace(c, a, 408, 4 * 63, b >= 4 ? tokenStride + ' bytes' : '4 feature positions');
  }
  foot(
    c,
    b === 1
      ? 'x.reshape(2, 4, 3)    ·    sentence 0'
      : b === 3
        ? 'x.transpose(0, 2, 1)    ·    same stored buffer'
        : b === 4
          ? '4 positions × ' + bytesPerFeature + ' bytes = ' + tokenStride + ' bytes'
          : 'Last features    Birds 3     migrate 7     south 11',
    { x: 303, y: 328, max: 548 },
  );
}

export function flattenTranspose(c, k) {
  const source = batch[0].flat();
  const readCues = [
    ['zero, four, eight', 'Read across its first row'],
    ['four, eight', false],
    ['eight. The next', false],
    ['one. Two steps', 'The next row starts at one'],
  ];
  const readCount = readCues.filter(([phrase, captionStart]) =>
    cue(k, 7, phrase, 0, captionStart),
  ).length;
  const visited = transposeReadOffsets.slice(0, readCount);
  name(c, 'Source buffer · sentence 0', 480, 96, 22, milk, 'center');
  flatRail(c, 119, source, visited);

  const x = 138,
    y = 206,
    w = 58,
    h = 32;
  name(c, 'Transpose · C-order read', x + 1.5 * w, 182, 21, milk, 'center');
  tray(c, x - 4, y - 4, 3 * w + 8, 4 * h + 8);
  transposeBatch0.forEach((values, i) => row(c, values, x, y + i * h, w, h, values.map(material)));
  if (cue(k, 7, 'Read across its first row', 0)) frame(c, x - 2, y - 2, 3 * w + 2, h);
  if (readCount === 4) frame(c, x - 2, y + h, w, h, teal);

  name(c, 'First source offsets (elements)', 622, 211, 23, milk, 'center');
  visited.forEach((offset, i) => {
    const center = 449 + i * 115;
    const color = i === 3 ? teal : brass;
    mono(c, offset, center, 267, 34, color, 'center');
    if (i === 0) return;
    const step = offset - visited[i - 1];
    arrow(c, center - 88, 267, 61, color);
    mono(c, (step > 0 ? '+' : '−') + Math.abs(step), center - 57, 299, 21, color, 'center');
  });

  const copying = cue(k, 7, 'copies the transposed rows', 2.7);
  name(
    c,
    copying ? 'New buffer · sentence 0' : 'Flattened order · sentence 0',
    480,
    360,
    21,
    milk,
    'center',
  );
  tray(c, 98, 381, 764, 48);
  transposeReadOffsets.forEach((offset, i) => {
    const p = clamp(copying * transposeReadOffsets.length - i);
    if (p > 0)
      sort(c, 102 + i * 63, 385 - 5 * (1 - p), 63, 40, source[offset], material(source[offset]));
  });
  foot(c, 'x.transpose(0, 2, 1).reshape(2, 12)', { x: 630, y: 324 });
}

export function memory(c, k) {
  const b = beat(k);
  const shared = cue(k, 2, 'Read it through either window', 0.45) > 0;
  const copyShown = cue(k, 4, 'The zero in the source survives', 0) === 1;
  const rewound = cue(k, 5, 'Rewind that write', 0.35) === 1;
  const copyWrite = copyShown && !rewound;
  const sourceWrite = cue(k, 6, 'This time Birds changes', 0) === 1;
  const data = writeExample({ sliceWrite: shared, copyWrite, sourceWrite });
  if (b <= 2) {
    const x = 72,
      w = 65,
      y = 299,
      cellX = x + 4.5 * w;
    const ports = [
      [67, 'Source', 'x[0, 1, 0]', data.source[4]],
      [547, 'Slice', 'middle[0, 0]', data.middle[0][0]],
    ];
    for (const [left, label, addr, v] of ports) {
      paper(c, left, 118, 339, 105);
      text(c, label, left + 17, 143, 18, ink);
      mono(c, addr, left + 17, 186, 22, ink);
      mono(c, v, left + 288, 177, 39, ink, 'center');
      const mid = left + 169;
      line(c, mid, 223, mid, 243, brass, 1.5);
      line(c, mid, 243, cellX, 274, brass, 1.5);
    }
    line(c, cellX, 274, cellX, y, brass, 2);
    const values = Array.from(data.source.slice(0, 12));
    row(c, values, x, y, w, 52, batch[0].flat().map(material), 4);
    brace(c, x + 4 * w, 371, 4 * w, 'migrate · bytes 16 through 31');
    foot(
      c,
      b === 1
        ? 'Next write    middle = x[:, 1, :]     middle[0, 0] = 99'
        : 'x[0, 1, 0] and middle[0, 0] reach one address.',
    );
    return;
  }
  const sourceSide = cue(k, 5, 'Put the batch index on the source', 0) > 0;
  const words = sentenceWords[0][0];
  name(c, words + ' · first feature', 480, 114, 28, milk, 'center');
  const xL = 90,
    xR = 550;
  const side = (x, label, role, values, selected) => {
    name(c, label, x + 155, 185, 27, milk, 'center');
    tray(c, x - 4, 220, 320, 79);
    row(c, Array.from(values.slice(0, 4)), x, 225, 78, 66, stock[0]);
    if (selected) frame(c, x - 1, 222, 78, 70, brass);
    brace(c, x, 322, 312, role, dim);
  };
  side(xL, 'x', 'source', data.source, sourceSide);
  side(
    xR,
    'picked',
    copyShown ? 'separate memory' : 'retrieved result',
    data.picked,
    !sourceSide && !rewound,
  );
  const code = sourceSide ? 'x[[0], 0, 0] = -1' : 'picked[0, 0, 0] = -1';
  if (rewound && !sourceSide) {
    text(c, 'Both first features are back at zero.', 480, 393, 22, milk, 'center');
  } else {
    const writeStatus = copyWrite || sourceWrite ? 'After the write' : 'Next write';
    text(c, writeStatus, 480, 374, 17, dim, 'center');
    mono(c, code, 480, 405, 24, brass, 'center');
  }
  foot(c, 'picked = x[[0, 1]]');
}
