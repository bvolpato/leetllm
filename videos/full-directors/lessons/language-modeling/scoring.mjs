import {
  C,
  rect,
  line,
  type,
  tag,
  big,
  token,
  row,
  rail,
  ticks,
  bracket,
  heading,
  cue,
  hatching,
  arrow,
  animal,
  dot,
  sum,
  product,
  pct,
  fixed,
} from './drawing.mjs';
import {
  rows,
  compiler,
  logits,
  softmax,
  shifted,
  TARGET_PROBS,
  SPLIT_CAT,
  ppl,
  catBytes,
  batches,
  pooled,
  bits,
  selectSample,
} from './examples.mjs';

export function normalize(c, k) {
  const b = k.beat.beatIndex,
    peak = Math.max(...logits),
    exps = logits.map((z) => Math.exp(z - peak));
  const omit = b === 2 && cue(k, 2, 'Normalize just the top two') > 0.5;
  const denominator = sum(omit ? exps.slice(0, 2) : exps);
  const shifted = cue(k, 0, 'Subtract the largest'),
    mass = cue(k, 0, 'exponentiate each'),
    div = cue(k, 0, 'divide each');
  heading(c, 'Where does the denominator come from?', '“The compiler reported …”');
  const xs = [50, 231, 366, 505, 724];
  ['Token', 'Logit', 'Minus max', 'Rounded exponential', 'Share (rounded)'].forEach((s, i) =>
    tag(c, s, xs[i], 164),
  );
  compiler.forEach((word, i) => {
    const y = 207 + 43 * i,
      muted = omit && i >= 2,
      col = muted ? C.muted : C.ink;
    type(c, word, xs[0], y, 25, col, { face: 'Serif' });
    type(c, String(logits[i]), xs[1], y, 21, col);
    if (shifted) type(c, fixed(logits[i] - peak, 1), xs[2], y, 20, col);
    if (mass) type(c, fixed(exps[i], 4), xs[3], y, 20, col);
    if (div && !muted) {
      const p = exps[i] / denominator;
      rect(c, xs[4], y - 10, 98 * p, 20, C.teal);
      type(c, fixed(p, 3), 837, y, 19, col, { face: 'Mono' });
    }
    line(c, 50, y + 24, 912, y + 24);
  });
  if (mass)
    type(
      c,
      (omit ? 'Sum of the top two unrounded weights' : 'Sum of all five unrounded weights') +
        '  ≈  ' +
        fixed(denominator, 5),
      51,
      418,
      23,
      omit ? C.red : C.teal,
    );
}
export function selection(c, k) {
  const b = k.beat.beatIndex;
  heading(c, 'Which row will the sampler use?',
    b === 5 ? 'Fresh draw  ·  temperature 1  ·  filtering off' : 'Temperature and filtering');
  if (b < 2) {
    const t = 1 - 0.5 * cue(k, 0, 'temperature one half') + 1.5 * cue(k, 0, 'Temperature two');
    big(c, 'The compiler reported …', 54, 178, 34);
    const reading = Number(t.toFixed(1)) === t ? fixed(t, 1) : '≈ ' + fixed(t, 4);
    type(c, 'Temperature  ' + reading, 604, 179, 22, C.blue, { face: 'Mono' });
    tag(c, 'Rounded share', 762, 211);
    const p = softmax(logits, t);
    p.forEach((v, i) => {
      const y = 243 + i * 41;
      type(c, compiler[i], 57, y, 21);
      rect(c, 198, y - 9, 540, 18, C.faint);
      rect(c, 198, y - 9, 540 * v, 18, C.teal);
      type(c, v < 0.0005 ? '< 0.001' : fixed(v, 3), 762, y, 20, C.teal, { face: 'Mono' });
    });
    if (b === 1)
      type(c, 'T → 0⁺ concentrates mass at the maximum. T = 0 needs a decoding rule.', 53, 466, 20);
  } else if (b < 5) {
    const t = b === 4 ? 2 : 1,
      base = rows['The cat'],
      p = softmax(
        base.map(([, p]) => Math.log(p)),
        t,
      );
    const kept = p[0] + p[1],
      filter =
        b === 2
          ? cue(k, 2, 'Renormalize')
          : b === 3
            ? cue(k, 3, 'Divide each surviving')
            : cue(k, 4, 'Divide the first square root');
    tag(c, 'Before filtering  ·  temperature ' + t, 56, 169);
    rail(
      c,
      56,
      194,
      848,
      54,
      base.map(([w], i) => [w + '  ' + pct(p[i]), p[i]]),
    );
    const w = 848 * kept;
    bracket(c, 56, 258, w, 'top two retain ' + pct(kept));
    if (filter > 0) {
      tag(c, 'Selection distribution', 56, 349);
      rail(
        c,
        56,
        373,
        848,
        54,
        base.slice(0, 2).map(([w], i) => [w + '  ' + pct(p[i] / kept), p[i] / kept]),
      );
      if (b === 4)
        type(c, '√0.6 / (√0.6 + √0.3)  ≈  ' + fixed(p[0] / kept, 4), 57, 468, 22, C.teal, {
          face: 'Mono',
        });
    }
  } else {
    const first = selectSample('The cat', 0.75);
    const put = cue(k, b, 'Append slept', 0);
    const next = cue(k, b, 'Compute the next row', 0);
    const prefix = 'The cat ' + first;
    big(c, put ? prefix : 'The cat', 54, 193, 42);
    animal(c, 773, 148, 0.85, 'cat', put ? 'slept' : 'stand');
    const selected = cue(k, b, 'this draw lands on', 0);
    drawSampleRow(c, next ? prefix : 'The cat', selected && !next ? 0.75 : null);
    if (cue(k, b, 'Report which event', 0))
      type(c, 'Report the event that ended generation.', 54, 465, 23);
  }
}
export function objectives(c, k) {
  const b = k.beat.beatIndex;
  heading(c, b < 2 ? 'Can we read “sat” to predict “cat”?' : 'What happens to the selected positions?',
    b < 2 ? 'The information boundary' : 'Masked language modeling');
  if (b <= 1) {
    for (const [i, label] of ['Causal prediction', 'Masked reconstruction'].entries()) {
      const y = 192 + i * 142;
      tag(c, label, 55, y + 23);
      row(c, ['The', i ? '[mask]' : '?', 'sat'], 285, y, 160, 22, [
        { fill: C.mint },
        { fill: C.sand },
        i ? { fill: C.mint } : { fill: C.faint },
      ]);
      if (!i) {
        hatching(c, 649, y, 160, 57, C.line);
        line(c, 644, y - 10, 644, y + 68, C.red, 3);
      }
      type(
        c,
        i ? 'Right context is visible.' : 'Only earlier positions are visible.',
        287,
        y + 87,
        21,
        i ? C.teal : C.muted,
      );
    }
  } else {
    const selected = 150,
      quota = [120, 15, 15],
      cols = [C.blue, C.red, C.teal];
    tag(c, 'Illustration  ·  1,000 training positions', 51, 164);
    for (let j = 0; j < 1000; j++)
      rect(
        c,
        52 + (j % 50) * 9,
        197 + Math.floor(j / 50) * 10,
        7,
        7,
        j >= selected ? C.faint : cols[j < 120 ? 0 : j < 135 ? 1 : 2],
      );
    ['mask', 'random token', 'unchanged'].forEach((w, i) => {
      const y = 218 + i * 74;
      dot(c, 582, y, 9, cols[i]);
      type(c, w, 605, y, 22);
      type(c, b === 2 ? pct(quota[i] / selected) : String(quota[i]), 819, y, 24, cols[i]);
    });
    type(c, 'All 150 selected positions predict their original token.', 52, 414, 23);
  }
}
export function sequence(c, k) {
  heading(c, 'How much probability reaches the end?', 'Chain rule from the start token');
  const words = ['The', 'cat', 'sat', 'end'];
  const x = 230,
    width = 650,
    axis = 188,
    height = 32;
  const marks = [
    cue(k, 0, 'Score The', 0.85),
    cue(k, 0, 'then cat', 0.85),
    cue(k, 0, 'then sat', 0.85),
    cue(k, 2, 'stops here', 0),
  ];
  let stopCut = 0;
  if (k.beat.beatIndex === 2) {
    const answer = 'twenty-three percent for the finished sentence';
    const { start, end } = k.wordCue(answer);
    stopCut = k.reveal(answer, end - start, { captionStart: answer });
  }

  type(c, 'Share of the original probability', x, 146, 20, C.muted, { weight: 600 });
  type(c, 'Token', 56, axis - 14, 18, C.muted, { weight: 600 });
  type(c, 'Factor', x - 32, axis - 14, 18, C.muted, { align: 'right', weight: 600 });
  ticks(c, x, axis, width, 4);
  for (let i = 0; i <= 4; i++)
    type(c, pct(i / 4), x + (i * width) / 4, axis - 14, 18, C.muted, { align: 'center' });

  let mass = 1;
  const firstRow = 218,
    step = 57;
  if (marks[0] === 0) {
    rect(c, x, firstRow, width, height, C.faint);
    type(c, 'All probability starts here', x + width / 2, firstRow + height / 2, 22, C.muted, {
      align: 'center',
    });
  }
  for (const [i, word] of words.entries()) {
    if (marks[i] === 0) break;
    const progress = i === words.length - 1 ? stopCut : marks[i];
    const y = firstRow + i * step;
    const factor = TARGET_PROBS[i];
    const next = mass * factor;
    const incoming = width * mass;
    const kept = incoming + (width * next - incoming) * progress;

    type(c, word, 56, y + height / 2, 28, C.ink, { face: 'Serif' });
    type(c, '× ' + pct(factor), x - 32, y + height / 2, 22, C.blue, { align: 'right' });
    line(c, x + incoming, i === 0 ? axis + 10 : y - step + height, x + incoming, y, C.muted, 2);
    rect(c, x, y, incoming, height, C.faint);
    if (progress > 0) rect(c, x, y, kept, height, C.blue);
    if (progress > 0 && progress < 1) {
      line(c, x + kept, y - 4, x + kept, y + height + 4, C.red, 3);
    } else if (progress === 1) {
      type(c, Number((100 * next).toFixed(2)) + '%', x + kept - 12, y + height / 2, 22, C.cream, {
        align: 'right',
        weight: 600,
      });
    }
    mass = next;
  }
  if (k.beat.beatIndex === 1 || (k.beat.beatIndex === 2 && marks[3] === 0)) {
    type(c, 'Does reaching “sat” also mean stopping there?', 56, 452, 26, C.blue);
  } else if (stopCut === 1) {
    const factors = TARGET_PROBS.map((p) => fixed(p)).join(' × ');
    type(c, 'Finished sentence', 56, 452, 24, C.teal);
    type(c, factors + '  =  ' + fixed(mass, 4), 280, 452, 25, C.teal, { face: 'Mono' });
  }
}
export function teacher(c, k) {
  const b = k.beat.beatIndex,
    mask = cue(k, 2, 'Ignore the first two');
  const inputs = ['start', 'The', 'cat', 'sat'],
    targets = ['The', 'cat', 'sat', 'end'];
  const visible = ['Start predicts', 'The predicts', 'Cat predicts', 'Sat predicts'].map((t) =>
    cue(k, 0, t),
  );
  heading(c, 'The recorded sentence supplies four targets', 'Teacher forcing');
  tag(c, 'Input', 43, 215);
  tag(c, 'Target', 43, 379);
  inputs.forEach((w, i) => {
    const x = 161 + i * 180;
    token(c, w, x, 188, 151, { fill: b > 0 && i > 2 ? C.faint : C.cream });
    if (b > 0 && i === 3) hatching(c, x, 235, 151, 10);
    if (visible[i]) {
      arrow(c, x + 75, 259, x + 75, 328, i === 2 ? C.teal : C.muted);
      token(c, targets[i], x, 350, 151, { fill: mask && i < 2 ? C.faint : C.mint });
      if (mask && i < 2) type(c, 'ignore loss', x + 75, 434, 17, C.red, { align: 'center' });
    }
  });
  if (b >= 1) bracket(c, 161, 139, 511, 'readable for the cat position', C.blue);
  if (b >= 1) type(c, 'The input words remain in the prefix.', 163, 475, 22, C.blue);
}
export function shift(c, k) {
  const b = k.beat.beatIndex,
    x = 103,
    step = 151,
    w = 139;
  heading(
    c,
    b < 2 ? 'What sits directly under start?' : 'Which occurrence teaches the stop?',
    'Aligning inputs and labels',
  );
  if (b < 2) {
    const words = ['start', 'function', 'returns', 'value', 'end'];
    const one = cue(k, 0, 'Slide the copy one place left', 0.9);
    const two = cue(k, 1, 'Slide it once more', 0.9);
    const repair = cue(k, 1, 'Give this loss the original IDs', 0.85);
    const offset = one + two - repair;
    tag(c, 'Input positions', x, 160);
    row(c, words, x, 183, w, step - w);
    rect(c, x - 4, 259, w + 8, 79, C.sand);
    arrow(c, x + w / 2, 255, x + w / 2, 334, C.blue);
    c.save();
    c.beginPath();
    c.rect(x - 2, 340, step * 5, 85);
    c.clip();
    row(
      c,
      words,
      x - step * offset,
      344,
      w,
      step - w,
      words.map(() => ({ fill: two > repair ? C.rose : C.mint })),
    );
    c.restore();
    if (Number.isInteger(offset) && offset > 0) {
      const target = shifted(words, offset)[0];
      type(c, 'start → ' + target, x, 466, 27, offset === 2 ? C.red : C.teal, { face: 'Mono' });
      type(
        c,
        offset === 2 ? 'Two shifts skip function.' : 'One shift selects the next token.',
        431,
        468,
        22,
      );
    } else tag(c, 'Copied labels', x, 455);
  } else {
    const names = ['start', 'function', 'returns', 'end', 'pad'],
      ids = [0, 1, 2, 4, 4];
    const masked = cue(k, 2, 'both fours disappear'),
      repair = cue(k, 3, 'Keep the real end');
    const mask = ids.map((id, i) => !masked || id !== 4 || (repair && i === 3));
    tag(c, 'Input occurrence', x, 157);
    row(c, names, x, 181, w, step - w);
    ids.forEach((v, i) => {
      const xx = x + i * step;
      type(c, 'ID ' + v, xx + w / 2, 266, 19, C.muted, { align: 'center', face: 'Mono' });
      token(c, mask[i] ? String(v) : 'ignore', xx, 340, w, {
        fill: mask[i] ? C.mint : C.rose,
        h: 53,
      });
    });
    tag(c, 'Labels supplied to internally shifting loss', x, 309);
    if (repair)
      type(
        c,
        'At returns, the shifted target is ' + shifted(ids, 1, mask)[2] + ' (end).',
        x,
        416,
        24,
        C.teal,
      );
    else if (masked) type(c, 'Masking by ID removes both occurrences.', x, 416, 24, C.red);
  }
}
export function loss(c, k) {
  const b = k.beat.beatIndex;
  heading(c, 'What changes when “cat” becomes two tokens?', 'Measuring the same recorded text');
  const p1 = TARGET_PROBS,
    p2 = [p1[0], ...SPLIT_CAT, ...p1.slice(2)],
    total = -Math.log(product(p1));
  const draw = (p, labels, y, colors, show) => {
    rail(
      c,
      57,
      y,
      842,
      65,
      p.map((v, i) => [labels[i] + '  ' + fixed(-Math.log(v), 3), -Math.log(v) / total]),
      colors,
      18,
    );
    type(c, fixed(total, 3) + ' nats', 58, y + 91, 21);
    if (show)
      type(
        c,
        'mean ' +
          fixed(total / p.length, 3) +
          ' nats / target     PPL = exp(mean) ≈ ' +
          fixed(ppl(p), 3),
        295,
        y + 91,
        21,
        C.teal,
      );
  };
  if (b === 0 && cue(k, 0, 'Take the negative natural log') < 1) {
    tag(c, 'Recorded target probabilities', 57, 159);
    p1.forEach((p, i) => {
      const x = 57 + 216 * i;
      token(c, ['The', 'cat', 'sat', 'end'][i], x, 216, 183, { h: 64 });
      type(c, pct(p), x + 91, 330, 30, C.blue, { align: 'center' });
    });
    return;
  }
  tag(c, 'Surprise length  =  −ln(target probability)   ·   Values rounded', 57, 159);
  draw(p1, ['The', 'cat', 'sat', 'end'], 189, [C.blue, C.teal, C.plum, C.red], b >= 2);
  if (b >= 3) {
    tag(c, 'Same stop, different tokenizer', 56, 331);
    draw(
      p2,
      ['The', 'c', 'at', 'sat', 'end'],
      356,
      [C.blue, C.teal, '#3a716b', C.plum, C.red],
      cue(k, 5, 'perplexity falls') === 1,
    );
  } else {
    type(c, 'Target probabilities', 57, 369, 22, C.muted);
    type(c, '0.80      0.60      0.60      0.80', 307, 369, 24, C.ink, { face: 'Mono' });
    if (b === 2) big(c, 'Perplexity = exp(mean loss)', 57, 448, 28, C.teal);
  }
}
export function pooling(c, k) {
  const b = k.beat.beatIndex;
  heading(c, b < 6 ? 'Which targets enter the denominator?' : 'How many text bytes share this loss?',
    'Evaluating held-out text');
  if (b < 4) {
    batches.forEach((r, i) => {
      const y = 199 + i * 97;
      tag(c, 'Batch ' + ['A', 'B'][i], 54, y + 22);
      r.forEach((v, j) => {
        const x = 201 + j * 201;
        const loaded = cue(k, 0, i ? 'Fill the second with' : 'Fill the first batch', 0.65) > 0.3;
        token(c, !loaded ? '' : v === null ? 'pad' : String(v), x, y, 164, {
          h: 45,
          fill: v === null ? C.faint : C.cream,
        });
        if (loaded && v !== null && cue(k, 0, 'Each block is one bit') > 0)
          for (let z = 0; z < bits(v); z++) rect(c, x + z * 34, y + 54, 28, 13, C.teal);
      });
    });
    if (b > 1)
      type(
        c,
        '10 bits / ' +
          pooled.length +
          ' targets   →   perplexity ' +
          fixed(2 ** (sum(pooled.map(bits)) / pooled.length), 3),
        55,
        399,
        26,
        C.teal,
      );
    if (b === 3)
      type(
        c,
        'Equal batch weights would count the single target three times as heavily.',
        55,
        427,
        19,
      );
  } else if (b < 6) {
    const seen = new Set(),
      view = b === 4 ? 1 + Number(cue(k, 4, 'Slide the window') > 0) : 3;
    tag(c, 'Target position in the document', 54, 167);
    for (let i = 0; i < view; i++) {
      for (let j = 0; j < 5; j++) {
        const pos = i * 3 + j,
          xx = 54 + pos * 78,
          yy = 208 + i * 72,
          repeat = seen.has(pos);
        token(c, String(pos), xx, yy, 64, { h: 39, fill: repeat ? C.faint : C.mint, size: 22 });
        if (repeat) hatching(c, xx, yy + 41, 64, 9);
        seen.add(pos);
      }
    }
    type(c, 'Green contributes one loss. Overlap stays visible as context.', 54, 466, 23, C.teal);
  } else {
    tag(c, 'UTF-8 bytes  ·  same text and stop', 55, 173);
    catBytes.forEach((byte, i) => {
      token(c, byte === 32 ? 'space' : String.fromCharCode(byte), 54 + i * 78, 235, 68, {
        fill: byte === 32 ? C.sand : C.cream,
      });
      type(c, byte.toString(16).padStart(2, '0'), 88 + i * 78, 327, 18, C.muted, {
        face: 'Mono',
        align: 'center',
      });
    });
    const nats = -Math.log(product(TARGET_PROBS));
    type(c, 'End contributes loss and adds zero text bytes.', 54, 385, 23);
    if (cue(k, 7, 'Both scores give', 0))
      big(
        c,
        fixed(nats, 3) +
          ' / ln 2 / ' +
          catBytes.length +
          '  ≈  ' +
          fixed(nats / Math.LN2 / catBytes.length, 3) +
          ' bits per byte',
        54,
        454,
        28,
        C.teal,
      );
  }
}
function drawSampleRow(c, prefix, draw) {
  type(c, 'Selection probabilities after “' + prefix + '”', 55, 254, 20, C.muted);
  rail(c, 55, 291, 850, 58, rows[prefix].map(([w, p]) => [w + '  ' + pct(p), p]));
  if (draw === null) return;
  const x = 55 + 850 * draw;
  arrow(c, x, 394, x, 355, C.red);
  type(c, 'draw ' + draw, Math.min(x, 854), 423, 20, C.red, { align: 'center' });
}
export function generate(c, k) {
  const put = cue(k, 0, 'Append slept') === 1,
    next = cue(k, 0, 'calculate the distribution') === 1;
  const first = selectSample('The cat', 0.75),
    second = selectSample('The cat ' + first, 0.95);
  const end = cue(k, 1, 'Stop here') === 1;
  heading(c, 'What did this sample put on the page?', 'Sampling by interval  ·  temperature 1  ·  filtering off');
  big(c, put ? 'The cat ' + first : 'The cat', 55, 198, 44);
  animal(c, 735, 153, 1, 'cat', put ? first : 'stand');
  const show = next ? cue(k, 1, 'second sample') : cue(k, 0, 'lands in slept');
  const draw = next ? 0.95 : 0.75;
  drawSampleRow(c, next ? 'The cat ' + first : 'The cat', show ? draw : null);
  if (end)
    type(
      c,
      'Selected ' + second + '   ·   the record supplied sat during training.',
      55,
      477,
      22,
      C.teal,
    );
}
export function greedy(c, k) {
  heading(c, 'Which two-token path is widest?', 'Local choice and path probability');
  const w = 822,
    x = 62,
    yp = 211,
    scale = 0.6;
  const splitA = cue(k, 0, 'cut A into ten', 0.8),
    splitB = cue(k, 0, 'After B', 0.6);
  tag(c, 'First token', x, 174);
  rail(c, x, yp, w, 54, [
    ['A   60%', scale],
    ['B   40%', 1 - scale],
  ]);
  const y = 324;
  if (splitA) {
    rect(c, x, y, w * scale, 46, C.blue);
    for (let j = 1; j < 10; j++)
      line(c, x + (w * scale * j) / 10, y, x + (w * scale * j) / 10, y + 46 * splitA, C.cream, 2);
  }
  if (splitB) {
    rect(c, x + w * scale, y, w * (1 - scale), 46, C.teal);
    line(
      c,
      x + w * (scale + (1 - scale) * 0.9),
      y,
      x + w * (scale + (1 - scale) * 0.9),
      y + 46 * splitB,
      C.cream,
      3,
    );
  }
  if (cue(k, 2, 'six percent', 0))
    bracket(c, x, y + 51, w * scale * 0.1, pct(scale * 0.1), C.blue);
  if (cue(k, 2, 'thirty-six percent', 0)) {
    bracket(c, x + w * scale, y + 51, w * (1 - scale) * 0.9, pct((1 - scale) * 0.9), C.teal);
    type(c, 'Greedy chose A before it saw these continuations.', x, 294, 23);
  } else if (k.beat.beatIndex === 1)
    type(c, 'Point to a single child branch.', x, 294, 24, C.muted);
}
