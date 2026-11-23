import {
  ink,
  dim,
  red,
  teal,
  blue,
  gold,
  paper,
  pale,
  colors,
  fmt,
  pct,
  mix,
  type,
  line,
  dot,
  box,
  arrow,
  bench,
  foot,
  slug,
  typeLine,
  row,
  strip,
  grid,
  shutters,
  cue,
  label,
} from './press.mjs';
import {
  MODEL as m,
  FEEDBACK as next,
  WORDS,
  VOCAB,
  CACHE_RUNS,
  articleRuns,
  temperature,
  twoWordTemperature,
  allLogits,
  llama,
  oss,
  distance,
} from './specimens.mjs';

function cache(c, k) {
  const b = k.beat.beatIndex,
    n = 4,
    keys = VOCAB.slice(0, n),
    run = CACHE_RUNS[1];
  bench(
    c,
    b < 3
      ? 'Split the projection and check the read'
      : b < 6
        ? 'Which Boolean value opens the shutter?'
        : 'One query still belongs to position 3',
    'CACHED ATTENTION  /  FOUR SAVED KEYS',
  );
  if (b < 3) {
    const p = cue(k, 0, 'Split its eight features', 1.0);
    for (let i = 0; i < 4; i++) {
      type(c, keys[i], 55, 203 + 55 * i, 22, ink, 'Serif');
      for (let j = 0; j < 8; j++) {
        const x = 225 + j * 75 + (j >= 4 ? p * 49 : 0);
        box(c, x, 182 + 55 * i, 68, 44, p ? (j < 4 ? blue : teal) : dim, 2);
        type(c, j + 1, x + 34, 204 + 55 * i, 19, paper, 'Mono', 'center');
      }
    }
    label(c, 'Projected feature index', 225, 157);
    foot(
      c,
      b === 0
        ? p >= 1
          ? 'Every head keeps four tokens. The split turns [1, 4, 8] into [1, 2, 4, 4].'
          : 'Each token has eight projected features.'
        : b === 1
          ? 'The mask stays on the input device. Each real query has a legal key.'
          : 'The article checks finite input gradients on its four-token example.',
    );
  } else if (b < 6) {
    const mask = Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => j > i));
    const dx = 76,
      ch = 45;
    type(c, 'masked_fill', 103, 168, 24, red, 'Mono');
    type(c, 'SDPA', 548, 168, 24, teal, 'Mono');
    const args = { cw: dx, ch, size: 16, fg: () => paper, format: (v) => (v ? 'True' : 'False') };
    grid(c, 87, 205, mask, { ...args, paint: (v) => (v ? red : dim) });
    grid(
      c,
      525,
      205,
      mask.map((r) => r.map((v) => !v)),
      { ...args, paint: (v) => (v ? teal : red) },
    );
    arrow(c, 409, 293, 501, 293, gold);
    foot(
      c,
      b === 3
        ? 'Upper-right future key: True blocks it in masked_fill. False blocks it in SDPA.'
        : b === 4
          ? 'Pass dropout_p = 0 for this comparison. A fused backend may avoid storing the score grid.'
          : 'SDPA returns mixed values. To inspect the weights, compute them separately.',
    );
  } else {
    const aligned = cue(k, 9, 'absolute row three', 0);
    const read = aligned ? run.aligned : run.upperLeft;
    const x = 210,
      w = 690,
      pitch = w / n;
    label(c, 'Saved keys and values', x, 156);
    const center = typeLine(c, keys, { x, y: 180, w, h: 45, selected: 3 });
    const ask = b < 8;
    if (ask) {
      grid(
        c,
        center(0) - pitch / 2 + 1,
        267,
        Array.from({ length: 4 }, (_, i) =>
          Array.from({ length: 4 }, (_, j) => (j <= i ? '●' : '×')),
        ),
        {
          cw: pitch,
          ch: 36,
          size: 17,
          paint: (v, i) => (i === 0 ? '#ead3be' : paper),
          fg: (v) => (v === '●' ? teal : red),
        },
      );
      label(c, 'local row 0 →', 51, 285);
      label(c, 'absolute row 3', 51, 393);
    } else {
      shutters(c, n, aligned ? n : 1, {
        x: center(0) - pitch / 2,
        w,
        y: 259,
        h: 66,
        words: keys,
        weights: read.weights,
        opening: 1,
      });
      label(c, aligned ? 'absolute row 3' : 'local row 0 →', 51, 291);
      const diff = distance(read.read, next.A[3]);
      type(c, 'Read difference   ' + fmt(diff, 3), 62, 389, 23, aligned ? teal : red, 'Mono');
      type(c, 'Greedy word   ' + VOCAB[read.choice], 557, 389, 23, ink, 'Mono');
    }
    foot(
      c,
      ask
        ? 'A [1, 4] upper-left causal mask takes row 0. Which key does that row admit?'
        : aligned
          ? 'Position-aligned read and full-prefix read agree at all four coordinates.'
          : 'The wrong mask can still print “value.” Compare the read with the full-prefix read.',
    );
  }
}
function contracts(c, k) {
  const b = k.beat.beatIndex;
  bench(
    c,
    b < 2 ? 'Can another block take this output?' : 'Same word. What happened one step earlier?',
    'DECODER SPECIMENS  /  ARTICLE AND FILM',
  );
  if (b < 2) {
    const widths = [8, 24, 8],
      ys = [203, 282, 361];
    widths.forEach((w, i) => {
      type(c, ['input row', 'FFN inner', 'residual width'][i], 55, ys[i] + 20, 21, dim);
      for (let j = 0; j < w; j++) box(c, 264 + j * 26, ys[i], 23, 42, colors[i], 2);
      type(c, w, 264 + w * 26 + 12, ys[i] + 20, 18, ink, 'Mono');
    });
    foot(
      c,
      'PyTorch example   ·   2 sequences × 4 tokens × 8 features. The inner width can change.',
    );
  } else {
    const compareArticles = b >= 4;
    const records = compareArticles ? [articleRuns[0], articleRuns[1]] : [m, articleRuns[0]];
    const names = compareArticles
      ? ['PyTorch · seeded', 'Python · two blocks']
      : ['Film · one head', 'PyTorch · two heads'];
    const show = b === 3 || b >= 5;
    const reveal = compareArticles && cue(k, 5, 'Compare the first features', 1) > 0;
    label(c, 'Decoder', 53, 172);
    label(c, 'Result logit', 390, 172);
    label(c, 'Probability', 588, 172);
    label(c, 'First feature', 752, 172);
    records.forEach((r, i) => {
      const y = 237 + i * 101,
        color = i ? teal : blue;
      type(c, names[i], 54, y, 28, color, 'Serif', 'left', 312);
      line(c, 51, y + 38, 910, y + 38, pale, 1);
      type(c, show ? fmt(r.logits[3], 3) : '?', 396, y, 24, ink, 'Mono');
      type(c, show ? pct(r.probs[3]) : '?', 592, y, 24, ink, 'Mono');
      type(
        c,
        reveal ? fmt(r.row[0], 3) : '?',
        761,
        y,
        24,
        reveal && r.row[0] < 0 ? red : ink,
        'Mono',
      );
    });
    foot(
      c,
      compareArticles
        ? reveal
          ? 'The first features have opposite signs immediately before final normalization.'
          : 'Can matching rounded probabilities tell you whether the two hidden rows agree?'
        : 'ReLU and GELU decoders use their own weights. Compare the score each gives “result.”',
    );
  }
}
function output(c, k) {
  const b = k.beat.beatIndex;
  const probabilities = b === 2 && cue(k, 2, 'A softmax', 0);
  bench(
    c,
    probabilities
      ? 'Softmax turns each row of scores into word probabilities'
      : b < 3
        ? 'Turn each feature row into six scores'
        : b < 5
          ? 'What does tying the tables save?'
          : 'How does temperature redistribute the ink?',
    'OUTPUT HEAD  /  VOCABULARY AXIS',
  );
  if (probabilities) {
    const cw = 57,
      ch = 55,
      left = 108,
      right = 561;
    label(c, 'Vocabulary scores', left, 165);
    label(c, 'Word probabilities', right, 165);
    for (const origin of [left, right])
      VOCAB.forEach((word, i) =>
        type(c, word, origin + (i + 0.5) * cw - 1, 215, 16, ink, 'Serif', 'center', cw - 3),
      );
    allLogits.forEach((scores, i) => {
      const y = 239 + i * ch;
      const opts = {
        cw,
        ch,
        size: 16,
        paint: () => (i === 2 ? teal : paper),
        fg: () => (i === 2 ? paper : ink),
      };
      type(c, WORDS[i], 42, y + 26, 16, dim, 'Serif', 'left', 60);
      grid(c, left, y, [scores], { ...opts, format: (v) => fmt(v, 2) });
      type(c, 'softmax', 504, y + 13, 15, dim, 'Mono', 'center');
      arrow(c, 461, y + 33, 545, y + 33, dim, 2);
      grid(c, right, y, [temperature(scores, 1)], { ...opts, format: pct });
    });
    foot(
      c,
      'Each token has its own denominator. Its six word probabilities sum to one before rounding.',
    );
  } else if (b < 3) {
    label(c, 'Final features', 100, 167);
    label(c, 'Six vocabulary logits', 388, 167);
    VOCAB.forEach((w, i) => type(c, w, 422 + i * 87, 219, 18, ink, 'Serif', 'center', 82));
    for (let i = 0; i < 3; i++) {
      const y = 243 + i * 57;
      type(c, WORDS[i], 42, y + 20, 17, i === 2 ? teal : dim, 'Serif');
      grid(c, 109, y, [m.final[i]], { cw: 54, ch: 46, format: (v) => fmt(v, 2), size: 14 });
      arrow(c, 330, y + 21, 364, y + 21, dim, 1.5);
      grid(c, 378, y, [allLogits[i]], {
        cw: 87,
        ch: 46,
        paint: () => (i === 2 ? teal : paper),
        fg: () => (i === 2 ? paper : ink),
        format: (v) => fmt(v, 2),
        size: 17,
      });
    }
    foot(
      c,
      '[1, 3, 4] × [4, 6] → [1, 3, 6]. Taking the final row before or after projection gives the same scores.',
    );
  } else if (b < 5) {
    const p = cue(k, 3, 'Tie the weights', 1.1);
    const x = 210;
    const table = (xx, col) =>
      grid(
        c,
        xx,
        199,
        Array.from({ length: 6 }, () => Array(4).fill('')),
        { cw: 38, ch: 31, paint: () => col },
      );
    table(mix(610, x, p), blue);
    table(x, teal);
    label(c, 'Embedding rows', x, 164);
    if (p < 1) label(c, 'Output rows', mix(610, x, p), 406);
    if (p === 1) {
      arrow(c, 475, 282, 386, 282, blue);
      type(c, 'Score every vocabulary entry', 495, 281, 22, blue, 'Serif');
      type(c, '6 × 4 = 24 stored weights', 492, 345, 23, ink, 'Mono');
    }
    foot(
      c,
      p === 1
        ? 'Two operations share a 6 × 4 table. Every vocabulary score still takes a dot product.'
        : 'Two separate tables store 48 weights. Tying requires a compatible vocabulary and feature width.',
    );
  } else if (b < 7) {
    const hot = cue(k, 5, 'At two', 1),
      normal = cue(k, 5, 'At one we recover', 1);
    const t = b === 6 ? 2 : Math.round(100 * mix(mix(0.5, 1, normal), 2, hot)) / 100,
      shares = temperature(m.logits, t);
    type(c, 'Temperature   ' + fmt(t), 58, 169, 24, ink, 'Mono');
    const step = 139;
    shares.forEach((v, i) => {
      const x = 67 + i * step,
        h = v * 253;
      box(c, x + 24, 357 - h, step - 46, h, i === 3 ? teal : blue, 3);
      type(c, pct(v), x + step / 2, 339 - h, 18, ink, 'Mono', 'center');
      type(c, VOCAB[i], x + step / 2, 389, 22, ink, 'Serif', 'center');
    });
    line(c, 63, 357, 907, 357, dim, 1);
    foot(
      c,
      'Subtract the largest logit, divide by positive T, exponentiate, then normalize across words.',
    );
  } else {
    const p = cue(k, 7, 'halving that second logit', 1);
    const t = 1 + Math.round(100 * p) / 100;
    const { scaled, masses, shares } = twoWordTemperature(t);
    label(c, 'Logits  [0, ln 9]', 52, 160);
    type(c, 'T = ' + fmt(t), 694, 160, 23, teal, 'Mono');
    row(c, 'logits / T', scaled, 196, blue, { d: 3 });
    row(c, 'exponential mass', masses, 267, gold, { d: 3 });
    strip(c, 60, 345, 835, 60, shares, shares.map(pct));
    foot(
      c,
      t === 2
        ? 'At T = 2 the masses are 1 and 3. Sampling draws from their 25% / 75% split.'
        : t === 1
          ? 'At T = 1 the masses are 1 and 9. The second word receives nine tenths of the total.'
          : 'Divide each logit by the displayed T, then normalize its exponential mass.',
    );
  }
}
function architectures(c, k) {
  const b = k.beat.beatIndex;
  const continuation = b === 0 && cue(k, 0, 'Generate a continuation', 0);
  bench(
    c,
    continuation
      ? 'Which keys can the decoder read at position 2?'
      : b === 0
        ? 'Which context does classification need?'
        : b === 2
          ? 'Which words did the encoder lose?'
          : b === 3
            ? 'Which positions get next-token targets?'
            : b < 4
              ? 'What can the target query read?'
              : 'Which cache grows with the translation?',
    'VISIBILITY  /  SOURCE AND TARGET',
  );
  if (b === 0) {
    const snippet = ['x', '=', '1', '+', '2'];
    typeLine(c, snippet, { y: 177, h: 58, selected: 2 });
    shutters(c, 5, continuation ? 3 : 5, { x: 51, w: 845, y: 292, h: 82, words: snippet });
    foot(
      c,
      continuation
        ? 'Decoder self-attention at position 2 has three legal keys.'
        : 'An encoder can classify a complete snippet using both left and right context.',
    );
  } else if (b === 2 || b === 3) {
    const span = b === 2;
    type(c, span ? 'T5 encoder input' : 'Decoder input', 48, 169, 21, dim);
    const centers = typeLine(c, span ? ['function', '<span>', 'result'] : VOCAB.slice(0, 4), {
      y: 193,
      h: 50,
    });
    type(
      c,
      span ? 'Missing text' : 'Shifted targets',
      48,
      span ? 306 : 426,
      21,
      dim,
      'Sans',
      'left',
    );
    typeLine(c, span ? ['returns', 'the'] : VOCAB.slice(1, 4), {
      y: 336,
      h: 55,
      columns: span ? 2 : 4,
    });
    if (!span) {
      for (let i = 0; i < 3; i++) arrow(c, centers(i), 266, centers(i), 325, gold, 2);
      type(c, 'No following token', centers(3), 286, 18, dim, 'Sans', 'center');
      type(c, 'Unscored here', centers(3), 363, 20, dim, 'Sans', 'center');
    }
    foot(
      c,
      span
        ? 'Schematic span corruption. The decoder learns to generate the text hidden from the encoder.'
        : 'An instruction and its response can share a causal stream. Shifted text supplies next-token targets.',
    );
  } else {
    const n = b < 4 ? 2 : b === 4 ? 1 + Math.round(2 * cue(k, 4, 'append a token', 1.6)) : 3;
    const source = ['le', 'chat', 'dort'],
      target = ['the', 'cat', 'sleeps'];
    label(c, 'Encoded source', 51, 159);
    source.forEach((s, i) => slug(c, 207 + i * 197, 169, 143, 49, s, true));
    label(c, 'Target prefix', 51, 342);
    target.slice(0, n).forEach((s, i) => slug(c, 207 + i * 197, 355, 143, 49, s));
    const cx = 278 + (n - 1) * 197;
    source.forEach((_, i) => arrow(c, cx, 343, 278 + i * 197, 230, teal, 2.4));
    for (let i = 0; i < n - 1; i++) {
      line(c, cx, 416 - i * 4, 278 + i * 197, 416 - i * 4, blue, 2);
      line(c, 278 + i * 197, 416 - i * 4, 278 + i * 197, 409, blue, 2);
    }
    foot(
      c,
      b === 6
        ? 'Measure performance for the intended task. A fixed source and a growing target have different costs.'
        : 'Target queries read the fixed encoded source. Target self-attention can read the generated prefix.',
    );
  }
}
function realScale(c, k) {
  const b = k.beat.beatIndex;
  bench(
    c,
    b < 2
      ? 'How much of 405B is the type case?'
      : b < 4
        ? 'How wide are the projected query heads?'
        : 'Which earlier positions stay in reach?',
    'CHECKPOINT DIMENSIONS  /  PUBLISHED CONFIGURATIONS',
  );
  if (b < 2) {
    const embedding = llama.vocab * llama.width,
      portion = embedding / llama.total;
    type(c, 'Llama 3 405B', 52, 165, 29, ink, 'Serif');
    type(c, '128,256 rows × 16,384 features', 53, 221, 24, ink, 'Mono');
    box(c, 55, 269, 850, 54, '#acaa99');
    box(c, 55, 269, 850 * portion, 54, blue);
    line(c, 58, 325, 82, 360, blue);
    type(c, 'embedding   ' + (embedding / 1e9).toFixed(2) + 'B', 86, 369, 23, blue, 'Mono');
    type(c, 'of 405B     ' + pct(portion), 520, 369, 22, dim, 'Mono');
    foot(
      c,
      b
        ? '126 layers. 16,384 features ÷ 128 query heads = 128 features per head.'
        : 'The narrow blue strip measures the input embedding count against the full parameter count.',
    );
  } else if (b < 4) {
    const vals = [oss.width, oss.heads * oss.headWidth, oss.width];
    ['Residual input', '64 heads × 64', 'Output map'].forEach((s, i) => {
      const y = 181 + i * 85;
      type(c, s, 50, y + 20, 22, ink, 'Serif');
      if (i < 2 || b === 3) {
        box(c, 287, y, vals[i] / 8, 38, colors[i]);
        type(c, vals[i].toLocaleString('en-US'), 303 + vals[i] / 8, y + 19, 20, ink, 'Mono');
      }
    });
    foot(
      c,
      'gpt-oss-120b declares 64 features per head. Its projected query width can exceed residual width.',
    );
  } else {
    const len = 256,
      unit = 3,
      start = 131;
    ['Sliding layer', 'Full layer'].forEach((s, i) => {
      const y = 203 + 97 * i;
      type(c, s, 52, y - 21, 21, ink, 'Serif');
      box(c, start, y, len * unit, 34, pale);
      const visible = i ? len : oss.window;
      box(c, start + (len - visible) * unit, y, visible * unit, 34, i ? blue : teal);
      type(
        c,
        visible + ' visible',
        start + (len - visible / 2) * unit,
        y + 17,
        18,
        paper,
        'Mono',
        'center',
      );
    });
    type(c, '0', start, 381, 19, dim, 'Mono');
    type(c, 'position 255', 898, 381, 19, dim, 'Mono', 'right');
    foot(
      c,
      'At position 255 in this example, both masks stop at the query. The model alternates 18 layers of each kind.',
    );
  }
}
export const inspection = [cache, contracts, output, architectures, realScale];
