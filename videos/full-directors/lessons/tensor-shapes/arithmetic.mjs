import {
  batch,
  bias,
  canBroadcast,
  centered,
  centeredWhitePixel,
  featureBiasContract,
  featureMean,
  imageChannelMeans,
  precision,
  rightSquare,
  sentenceWords,
  shape,
  shifted,
  squareInput,
  tokenMean,
  tokenOffsets,
  tokenShifted,
  wrongSquare,
} from './examples.mjs';
import {
  beat,
  brace,
  brass,
  clamp,
  cue,
  dim,
  disk,
  foot,
  frame,
  galley,
  ink,
  line,
  milk,
  mono,
  name,
  paper,
  rect,
  red,
  row,
  sort,
  spokenClause,
  stock,
  teal,
  text,
  tray,
  well,
} from './typecase.mjs';

function alignment(c, dimens, sourceLabel, lowerLabel) {
  const cols = [379, 557, 735],
    y = 155;
  const padded = [...Array(3 - dimens.length).fill(1), ...dimens];
  for (let i = 0; i < 3; i++) {
    text(c, ['Batch', 'Token', 'Feature'][i], cols[i] + 57, y - 39, 21, milk, 'center');
    sort(c, cols[i], y, 115, 62, shape[i], '#dbd6be');
    const compatible = padded[i] === shape[i] || padded[i] === 1;
    line(c, cols[i] + 57, y + 63, cols[i] + 57, y + 102, compatible ? teal : red, 2);
    sort(c, cols[i], y + 104, 115, 62, padded[i], compatible ? teal : red);
  }
  name(c, sourceLabel, 323, 184, 26, milk, 'right');
  name(c, lowerLabel, 323, 285, 26, milk, 'right');
}

export function broadcasts(c, k) {
  const b = beat(k);
  if (b === 1) {
    const p = cue(k, 1, 'Follow migrate', 4.3);
    const count = Math.floor(p * 4);
    name(c, 'migrate', 188, 192, 28, stock[1], 'right');
    name(c, 'feature bias', 188, 257, 26, milk, 'right');
    row(c, batch[0][1], 218, 163, 95, 57, stock[1]);
    row(c, bias, 218, 228, 95, 57, '#c5cdbc');
    line(c, 216, 298, 600, 298, dim);
    row(
      c,
      shifted.slice(4, 8).map((v, i) => (i < count ? v : null)),
      218,
      312,
      95,
      62,
      stock[1],
    );
    for (let d = 0; d < 4; d++) mono(c, 'd' + d, 266 + d * 95, 136, 17, dim, 'center');
    text(c, 'Same four offsets', 665, 191, 22, milk);
    for (let t = 0; t < 3; t++) {
      const y = 235 + 36 * t;
      name(c, sentenceWords[0][t], 672, y, 19, stock[t]);
      for (let d = 0; d < 4; d++) rect(c, 778 + 22 * d, y - 8, 18, 16, stock[t]);
    }
    foot(c, '(2, 3, 4) + (4,)   →   24 output values');
  } else if (b < 4) {
    const fixed = cue(k, 2, 'Insert a size-one axis', 0.8) === 1;
    const dims = fixed ? [3, 1] : [3];
    alignment(c, dims, 'x', 'token bias');
    const p = cue(k, 2, 'NumPy stops here', 0.3);
    if (fixed)
      mono(
        c,
        'migrate:  ' + batch[0][1].join('  ') + '   + 20   →   ' + tokenShifted[0][1].join('  '),
        480,
        377,
        20,
        teal,
        'center',
      );
    else if (p && !canBroadcast(shape, dims))
      text(c, '3 offsets meet 4 features', 480, 377, 24, red, 'center');
    foot(c, fixed ? 'token_bias[:, None]     (3, 1)' : 'Right-align (3,) with (2, 3, 4)');
  } else if (b === 4 && cue(k, 4, 'Predict the first word', 0.4) === 0) {
    const cropped = cue(k, 4, 'Now there are three rows', 0.65);
    name(c, 'First sentence', 249, 123, 26, milk, 'center');
    galley(c, batch[0], sentenceWords[0], 138, 171, 58, 53);
    if (cropped) {
      c.save();
      c.globalAlpha = cropped * 0.88;
      rect(c, 138 + 3 * 58, 170, 58, 161, well);
      c.restore();
      frame(c, 136, 169, 3 * 58 + 3, 3 * 53 + 2);
    }
    name(c, 'One offset per word', 677, 124, 25, milk, 'center');
    tokenOffsets.forEach((n, t) => {
      name(c, sentenceWords[0][t], 665, 196 + 53 * t, 21, stock[t], 'right');
      sort(c, 687, 171 + 53 * t, 76, 49, n, stock[t]);
    });
    foot(c, 'square = x[0, :, :3]    ·    token_bias = [10, 20, 30]');
  } else squareBroadcast(c, k);
}

function squareBroadcast(c, k) {
  const b = beat(k);
  const first = cue(k, 5, 'The first additions agree', 0.5);
  const bareMiddle = cue(k, 5, 'At the middle feature the bare vector supplies twenty', 0.5);
  const columnMiddle = cue(k, 5, 'Birds keeps its ten across the row', 0.5);
  const last = cue(k, 5, 'The first cell alone', 0.5);
  const bareSum = b === 5 && spokenClause(k, 'One plus twenty gives twenty-one') === 1;
  const columnSum = b === 5 && spokenClause(k, 'one plus ten gives eleven') === 1;
  const birds = squareInput[0];
  const squareShape = `(${squareInput.length}, ${birds.length})`;
  const x = 351,
    cellW = 118,
    width = birds.length * cellW,
    offsetY = 112;
  name(c, 'Offsets by token', x - 24, 131, 25, milk, 'right');
  row(c, tokenOffsets, x, offsetY, cellW, 42, stock.slice(0, tokenOffsets.length));
  sentenceWords[0].forEach((word, t) =>
    text(c, word, x + (t + 0.5) * cellW, 98, 17, stock[t], 'center'),
  );
  const activeOffset = last ? -1 : columnMiddle ? 0 : bareMiddle ? 1 : first ? 0 : -1;
  if (activeOffset >= 0) frame(c, x + activeOffset * cellW, offsetY, cellW, 40);

  name(c, 'Features for Birds', x - 24, 192, 24, stock[0], 'right');
  row(c, birds, x, 170, cellW, 48, stock[0]);
  if (first) frame(c, x + (bareMiddle ? cellW : 0), 170, cellW, 47);

  const lanes = [
    {
      y: 235,
      label: '+ token_bias',
      source: (d) => d,
      middle: bareMiddle,
      sum: bareSum,
      values: wrongSquare[0],
    },
    {
      y: 335,
      label: '+ token_bias[:, None]',
      source: () => 0,
      middle: columnMiddle,
      sum: columnSum,
      values: rightSquare[0],
    },
  ];
  for (const { y, label, source, middle, sum, values } of lanes) {
    const sumY = y + 45;
    mono(c, label, x - 24, y + 18, 22, milk, 'right');
    mono(c, '=', x - 24, sumY + 20, 21, dim, 'right');
    rect(c, x, y, width - 3, 37, well);
    line(c, x, sumY - 4, x + width - 3, sumY - 4, dim);
    row(
      c,
      [first === 1 ? values[0] : null, sum ? values[1] : null, last === 1 ? values[2] : null],
      x,
      sumY,
      cellW,
      44,
      '#d6d6bb',
    );
    mono(c, `Shape ${squareShape}`, x + width + 22, sumY + 19, 19, milk);

    [first, middle, last].forEach((progress, d) => {
      if (!progress) return;
      const t = source(d);
      c.save();
      c.globalAlpha = progress;
      const cellX = x + d * cellW;
      c.beginPath();
      c.rect(cellX, y, cellW, 39);
      c.clip();
      const enteringY = y + 21 * (1 - progress);
      const offset = progress > 0.72 ? tokenOffsets[t] : null;
      sort(c, cellX, enteringY, cellW, 39, offset, stock[t]);
      c.restore();
    });
    if (sum) frame(c, x + cellW, sumY - 1, cellW - 1, 44);
  }
  foot(
    c,
    b === 4
      ? 'Birds needs +10 in every column. Predict its middle value.'
      : last
        ? 'Both first cells agree. The middle feature catches the error.'
        : 'Follow the offset that reaches the middle feature.',
    { y: 434 },
  );
}

function channels(c, k) {
  const moved = beat(k) === 2;
  const colors = ['#df9789', '#a9c999', '#a5bdda'];
  if (moved) {
    const p = cue(k, 2, 'the three in the means must move', 1.2);
    const spatial = cue(k, 2, 'The same red mean', 0.6) > 0;
    name(c, 'One tile', 142, 127, 26, milk, 'center');
    for (let d = 2; d >= 0; d--) {
      const px = 74 + d * 25,
        py = 213 - d * 28;
      rect(c, px - 2, py - 2, 116, 115, well);
      rect(c, px, py, 112, 111, colors[d]);
      for (let i = 1; i < 5; i++) {
        line(c, px + i * 22, py, px + i * 22, py + 110, '#ffffff44');
        line(c, px, py + i * 22, px + 111, py + i * 22, '#ffffff44');
      }
      mono(c, ['R', 'G', 'B'][d], px + 97, py + 16, 18, ink, 'center');
    }
    const start = 450,
      step = 102;
    const travel = clamp((p - 0.25) / 0.5),
      lift = Math.min(1, p * 4, (1 - p) * 4);
    const fields = [
      ['Batch', 32, 0, 0],
      ['Height', 224, 1, 2],
      ['Width', 224, 2, 3],
      ['Color', 3, 3, 1],
    ];
    name(c, 'images', 421, 218, 23, milk, 'right');
    for (const [label, value, from, to] of fields) {
      const xx = start + step * (from + (to - from) * travel);
      const yy = 193 - (label === 'Color' ? 87 * lift : 0);
      text(c, label, xx + 42, yy - 17, 17, dim, 'center');
      sort(c, xx, yy, 83, 56, value, label === 'Color' ? '#e6bd73' : '#c2c8b8');
    }
    name(c, 'mean', 421, 308, 23, milk, 'right');
    if (spatial)
      row(c, [1, 3, 1, 1], start, 284, step, 56, ['#b6c8b9', '#e6bd73', '#b6c8b9', '#b6c8b9']);
    foot(c, spatial ? '(32, 3, 224, 224) − (1, 3, 1, 1)' : 'Move color to axis 1.');
    return;
  }
  const sub = cue(k, 1, 'Subtract the means', 2.4);
  const x = 50,
    y = 172,
    s = 133;
  for (let layer = 3; layer >= 0; layer--) {
    rect(c, x + layer * 7, y - layer * 9, s, s, '#a2a59a');
    rect(c, x + 2 + layer * 7, y + 2 - layer * 9, s - 4, s - 4, '#e3e3d7');
  }
  for (let i = 1; i < 6; i++) {
    line(c, x + (s * i) / 6, y, x + (s * i) / 6, y + s, '#bdc3b6', 1);
    line(c, x, y + (s * i) / 6, x + s, y + (s * i) / 6, '#bdc3b6', 1);
  }
  frame(c, x + (2 * s) / 6, y + (2 * s) / 6, s / 6, s / 6, ink);
  text(c, 'White test tiles', x, y + 162, 18, milk);
  text(c, '224 × 224 pixels', x, y + 187, 16, dim);
  const labels = ['Red', 'Green', 'Blue'];
  for (let d = 0; d < 3; d++) {
    const cx = 366 + d * 186,
      top = 152,
      base = 322,
      h = base - top;
    name(c, labels[d], cx, 115, 27, colors[d], 'center');
    tray(c, cx - 35, top, 70, h);
    const remain = 1 - sub * imageChannelMeans[d];
    rect(c, cx - 33, base - h * remain, 66, h * remain, colors[d]);
    line(c, cx - 46, base - h, cx + 46, base - h, dim, 1);
    mono(c, '1 − ' + imageChannelMeans[d].toFixed(2), cx, 355, 21, milk, 'center');
    if (sub === 1) mono(c, centeredWhitePixel[d].toFixed(2), cx, 390, 28, colors[d], 'center');
  }
  foot(c, '(32, 224, 224, 3) − (3,)');
}
export function contracts(c, k) {
  if (beat(k) <= 2) {
    channels(c, k);
    return;
  }
  const fixed = cue(k, 4, 'With a four-entry bias', 0.7) === 1;
  const reject = cue(k, 4, 'Raise a value error', 0.5) > 0;
  const offsets = fixed ? bias : tokenOffsets;
  const contract = featureBiasContract(shape, offsets);
  name(c, 'migrate', 197, 171, 27, stock[1], 'right');
  name(c, 'incoming bias', 197, 269, 25, milk, 'right');
  for (let d = 0; d < 4; d++) {
    const x = 220 + d * 91;
    mono(c, 'd' + d, x + 44, 123, 19, dim, 'center');
    sort(c, x, 146, 90, 58, batch[0][1][d], stock[1]);
    if (d < offsets.length) {
      line(c, x + 44, 204, x + 44, 235, teal, 2);
      sort(c, x, 241, 90, 58, offsets[d], '#bdd4bd');
    } else {
      frame(c, x + 3, 242, 83, 55, reject ? red : dim);
      if (reject) mono(c, '×', x + 44, 270, 25, red, 'center');
    }
  }
  paper(c, 630, 117, 262, 224);
  text(c, 'Input contract', 650, 147, 20, ink);
  mono(c, 'x.ndim == 3', 650, 194, 18, ink);
  mono(c, 'bias.shape == (4,)', 650, 229, 17, ink);
  if (reject) name(c, contract.accepted ? 'Accepted' : 'ValueError', 761, 291, 31, ink, 'center');
  if (fixed)
    mono(
      c,
      'migrate + bias   =   [' + shifted.slice(4, 8).join(', ') + ']',
      480,
      390,
      20,
      teal,
      'center',
    );
  foot(
    c,
    fixed ? 'assert out.shape == x.shape' : 'Check rank, bias shape and required dtype at entry.',
  );
}

// Keep both sentence trays and their surviving coordinates fixed as each group is pressed.
function pool(c, k) {
  const byWord = beat(k) === 3;
  const firstColumn = cue(k, 1, 'Look at the first column', 0.4);
  const named = ['zero', 'four', 'eight'].map((n, i) =>
    cue(k, 1, n, 0.25, i === 0 ? 'Its three words contribute' : false),
  );
  const firstPress = cue(k, 1, 'Average down the token axis', 1.85);
  const sum = cue(k, 1, 'its sum', 0.32);
  const mean = cue(k, 1, 'its mean', 0.5);
  const sweep = cue(k, 2, 'The four in the first output slot', 2.5);
  const equal = cue(k, 2, 'equal migrate', 0.45);
  const contributors = cue(k, 2, 'which three numbers', 0.45);
  const across = cue(k, 3, 'across features', 1.4);
  const otherWords = cue(k, 3, 'each word gets one scalar', 1.35, 'Now each word gets one scalar');
  const keepRows = cue(k, 3, 'keeps batch and token positions', 0.4, 'The output keeps batch');
  const rowSum = cue(k, 3, 'The arithmetic follows', 0.6);
  const cellW = 70,
    cellH = 48,
    top = 163;

  batch.forEach((rows, sentence) => {
    const left = 147 + sentence * 458;
    const outputY = top + rows.length * cellH + 14;
    name(c, 'Sentence ' + sentence, left + cellW * 2, 109, 28, milk, 'center');
    const columns = tokenMean[sentence].map((_, d) =>
      d === 0 ? firstPress : clamp(sweep * 3 - (d - 1)),
    );
    rows[0].forEach((_, d) => {
      c.save();
      c.globalAlpha = byWord ? 1 - Math.min(across, otherWords) : 1;
      mono(c, 'd' + d, left + (d + 0.5) * cellW, 149, 17, dim, 'center');
      c.restore();
    });
    rows.forEach((row, t) => {
      const rowPress = t === 1 ? across : otherWords;
      const y = top + t * cellH;
      c.save();
      c.globalAlpha = byWord ? 1 : 1 - columns.at(-1);
      name(c, sentenceWords[sentence][t], left - 14, y + 25, 22, stock[sentence * 3 + t], 'right');
      c.restore();
      row.forEach((v, d) => {
        const amount = byWord ? rowPress : columns[d];
        // Stack three thin impressions vertically or four horizontally. Each impression
        // keeps its source color until the pool fills the same output position.
        const x = left + d * cellW;
        const endX = byWord ? left + 1.5 * cellW + d * 13 : x;
        const endY = byWord ? y : outputY + t * 10;
        const xx = x + (endX - x) * amount;
        const yy = y + (endY - y) * amount;
        const w = byWord ? cellW + (13 - cellW) * amount : cellW;
        const h = byWord ? cellH : cellH + (10 - cellH) * amount;
        sort(c, xx, yy, w, h, null, stock[sentence * 3 + t]);
        c.save();
        c.globalAlpha = clamp(1 - 1.8 * amount);
        mono(c, v, xx + w / 2, yy + h * 0.45, 32, ink, 'center');
        c.restore();
        if (!byWord && !sentence && !d && firstColumn && amount === 0) {
          c.save();
          c.globalAlpha = firstColumn * (0.45 + 0.55 * named[t]);
          frame(c, x, y, cellW - 2, cellH - 4, brass);
          c.restore();
        }
      });
      if (byWord && rowPress === 1) {
        const focus = sentence === 0 && t === 1;
        sort(c, left + 1.5 * cellW - 9, y, cellW, cellH, featureMean[sentence][t], teal, focus);
      }
    });
    if (!byWord)
      columns.forEach((press, d) => {
        const result = d === 0 ? mean : press === 1 ? 1 : 0;
        if (sentence === 0 && d === 0 && press === 1 && result < 1)
          frame(c, left, outputY, cellW, rows.length * 10, brass);
        if (!result) return;
        c.save();
        c.globalAlpha = result;
        sort(c, left + d * cellW, outputY, cellW, cellH, tokenMean[sentence][d], teal);
        c.restore();
      });
  });

  const operands = byWord ? batch[0][1] : batch[0].map((row) => row[0]);
  const total = operands.reduce((a, v) => a + v, 0);
  if (byWord && rowSum) {
    mono(
      c,
      'migrate    (' + operands.join(' + ') + ') / 4 = ' + featureMean[0][1],
      480,
      385,
      24,
      milk,
      'center',
    );
  } else if (!byWord && named[0]) {
    // This proof stays under sentence zero, so its four cannot be mistaken for sentence one's mean.
    const start = 104;
    operands.forEach((v, i) => {
      if (!named[i]) return;
      const x = start + 54 * i;
      if (i) mono(c, '+', x - 8, 402, 17, dim, 'center');
      sort(c, x, 383, 39, 39, v, stock[i]);
      if (equal && (i === 1 || contributors)) frame(c, x - 1, 381, 40, 40, brass);
    });
    if (sum) mono(c, '= ' + total, start + 161, 401, 23, milk);
    if (mean) {
      line(c, start + 232, 385, start + 232, 417, dim);
      mono(
        c,
        total + ' / ' + operands.length + ' = ' + tokenMean[0][0],
        start + 253,
        401,
        23,
        teal,
      );
    }
  }
  const settled = byWord ? keepRows : sweep === 1;
  if (settled) foot(c, byWord ? 'x.mean(axis=-1)   →   (2, 3)' : 'x.mean(axis=1)   →   (2, 4)');
  else if (byWord || firstPress) foot(c, byWord ? 'x.mean(axis=-1)' : 'x.mean(axis=1)');
  else foot(c, 'x.shape = (2, 3, 4)');
}

export function reductions(c, k) {
  const b = beat(k);
  if (b <= 3) return pool(c, k);
  if (b === 4) {
    const fixed = cue(k, 4, 'Its size is one', 0.6) === 1;
    alignment(c, fixed ? [2, 1, 4] : [2, 4], 'x', 'token mean');
    if (fixed) brace(c, 559, 346, 112, 'retained token slot', teal);
    foot(
      c,
      fixed
        ? 'x.mean(axis=1, keepdims=True)   →   (2, 1, 4)'
        : 'Without keepdims, 2 aligns with 3.',
    );
    return;
  }
  const input = batch[0];
  const results = [
    'Birds goes from zero to minus four',
    'Migrate goes from four to zero',
    'south from eight to four',
  ].map((phrase) => spokenClause(k, phrase));
  const averaging = cue(k, 5, 'Average those centered values', 0.4) > 0;
  const active = results.reduce((last, progress, t) => (progress > 0 ? t : last), -1);
  const focus = (t, d) => d === 0 && (active === -1 || averaging || t === active);
  name(c, 'Sentence 0', 254, 113, 25, milk, 'center');
  galley(c, input, sentenceWords[0], 138, 161, 60, 51, 0, focus);
  name(c, 'After subtracting the mean', 738, 113, 25, milk, 'center');
  const values = centered[0].map((row, t) =>
    results[t] === 1 ? row : row.map(() => null),
  );
  galley(c, values, sentenceWords[0], 622, 161, 58, 51, 0, (t, d) => results[t] > 0 && focus(t, d));
  mono(c, 'mean  [' + tokenMean[0].join(', ') + ']', 480, 374, 24, teal, 'center');
  foot(c, 'x - x.mean(axis=1, keepdims=True)');
}

export function rounding(c, k) {
  const b = beat(k),
    origin = precision.inputs[0];
  const start = 233,
    unit = 213,
    y = 215;
  mono(c, 'float32 inputs    [2²⁴, 1, −2²⁴]', 480, 112, 22, milk, 'center');
  const halfway = cue(k, 1, 'Find their exact sum', 1);
  const rounded = cue(k, 2, 'Follow the marker there', 1);
  const widen = cue(k, 3, 'Follow the lower marker', 1);
  const x = (n) => start + unit * n;
  const lane = (yy, wide) => {
    const col = wide ? teal : '#adcbd5';
    mono(c, wide ? 'float64' : 'float32', 181, yy, 20, col, 'right');
    const ruler = c.createLinearGradient(0, yy - 14, 0, yy + 14);
    ruler.addColorStop(0, '#89958a');
    ruler.addColorStop(0.14, '#566051');
    ruler.addColorStop(0.82, '#34483f');
    ruler.addColorStop(1, '#708072');
    rect(c, x(0) - 28, yy - 12, x(2) - x(0) + 56, 24, ruler);
    line(c, x(0) - 28, yy, x(2) + 28, yy, '#abb9a8', 1);
    for (const i of wide ? [0, 1, 2] : [0, 2]) {
      line(c, x(i), yy - 12, x(i), yy + 13, col, 3);
    }
    const offset = wide ? widen * (precision.wideFirst - origin) : precision.narrowFirst - origin;
    if (wide || halfway === 0 || rounded === 1) {
      disk(c, x(offset), yy, 10, col);
      disk(c, x(offset), yy, 5, well);
    }
    if (!wide && halfway > 0) {
      c.strokeStyle = brass;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x(halfway), yy, 15, 0, 2 * Math.PI);
      c.stroke();
      c.beginPath();
      c.moveTo(x(halfway) - 5, yy - 24);
      c.lineTo(x(halfway) + 5, yy - 24);
      c.lineTo(x(halfway), yy - 17);
      c.closePath();
      c.fillStyle = brass;
      c.fill();
      if (rounded > 0)
        line(c, x(1) - 17, yy - 4, x(1) - 17 - rounded * (unit - 32), yy - 4, brass, 2);
    }
  };
  [0, 1, 2].forEach((n) =>
    mono(c, (origin + n).toLocaleString('en-US'), x(n), 165, 20, milk, 'center'),
  );
  lane(y, false);
  if (b >= 2) {
    for (const i of [0, 2]) {
      const bits = new Uint32Array(Float32Array.of(origin + i).buffer)[0];
      mono(c, 'last bit ' + (bits & 1), x(i), 251, 15, dim, 'center');
    }
  }
  if (b >= 3) lane(297, true);
  if (b >= 2) {
    const sum = cue(k, 2, 'Divide by three', 0.5) > 0;
    const mean = beat(k) > 2 || k.elapsed >= k.speechDuration;
    if (sum) {
      text(c, 'After cancellation', 813, 165, 17, dim, 'center');
      mono(c, 'sum ' + precision.narrowSum, 813, 209, 19, milk, 'center');
    }
    if (mean) mono(c, 'mean ' + precision.narrowMean, 813, 241, 19, milk, 'center');
    if (beat(k) > 3 || (b === 3 && k.elapsed >= k.speechDuration))
      mono(c, 'sum ' + precision.wideSum, 813, 297, 19, teal, 'center');
  }
  if (b === 4 && cue(k, 4, 'The extra one was present', 0.5))
    mono(c, 'float64 mean   ' + precision.wideMean, 480, 380, 27, teal, 'center');
  else if (b === 1 || b === 2)
    text(
      c,
      b === 1
        ? 'Which marks can store the exact sum?'
        : 'Default rounding chooses the even significand at a tie.',
      480,
      361,
      23,
      milk,
      'center',
    );
  else text(c, 'Integer marks shown at this magnification', 480, 378, 18, dim, 'center');
  foot(c, b < 3 ? 'feature.mean()' : 'feature.mean(dtype=np.float64)');
}
