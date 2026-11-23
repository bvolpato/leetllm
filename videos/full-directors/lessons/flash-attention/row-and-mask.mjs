import {
  paper,
  ink,
  blue,
  sky,
  orange,
  green,
  faint,
  slate,
  chalk,
  lightBlue,
  lightOrange,
  fmt,
  text,
  rect,
  edge,
  line,
  arrow,
  dot,
  fade,
  page,
  brace,
  note,
  cue,
  grid,
} from './studio.mjs';
import {
  SCORES,
  VALUES,
  first,
  oldHeight,
  referencePair,
  overflow,
  causalTileClass,
  classifyAligned,
  inputValues,
  cacheMasks,
  signedTiles,
  signedMerge,
  oldSignedAt,
  empty as emptyRow,
  single,
} from './examples.mjs';

export function signed(ctx, clock) {
  const converted = cue(clock, 5, 'Multiply both old sums', 1.2);
  const addition = cue(clock, 5, 'Add the new tile');
  cue(clock, 5, 'Divide them');
  const through = (first, last = first) => {
    if (clock.beat.beatIndex !== 4) return Number(clock.beat.beatIndex > 4);
    const start = clock.wordCue(first).start;
    const end = clock.wordCue(last).end;
    return clock.reveal(first, end - start, { captionStart: false });
  };
  const takeAway = through('The weight is about', 'about point six seven nine');
  const weightReady = through('The weight is about one point seven three six') === 1;
  const divide = through('Divide them', 'about point three nine one') === 1;
  const old = oldSignedAt(4 + converted);
  const incoming = signedTiles[1];
  page(ctx, 'Will the combined numerator stay positive?', 'TWO SUMMARIES   /   SIGNED VALUES');
  text(ctx, 'Tile', 117, 305, 36, slate);
  text(ctx, 'Reference', 400, 305, 36, slate);
  text(ctx, 'Weight', 715, 305, 36, slate);
  text(ctx, 'Weighted sum', 1257, 305, 38, slate);
  const zero = 1343;
  const x = value => zero + value * 39;
  line(ctx, zero, 330, zero, 745, slate, 2, [7, 8]);
  text(ctx, '0', zero, 782, 37, slate, 'Mono', 'center');
  const rows = [
    ['Old', old, blue],
    ['Incoming', incoming, orange],
    ...(addition ? [['Combined', signedMerge, green]] : []),
  ];
  for (const [i, [name, r, col]] of rows.entries()) {
    const y = 383 + i * 160;
    text(ctx, name, 116, y + 20, 47, col, 'Serif');
    text(ctx, fmt(r.m, 2), 445, y + 20, 49, ink, 'Mono');
    if (i < 2 || weightReady) text(ctx, fmt(r.l), 718, y + 20, 49, ink, 'Mono');
    if (i === 2 && takeAway < 1) {
      const start = x(old.u);
      const end = x(old.u + incoming.u * takeAway);
      line(ctx, zero, y, start, faint, 6);
      dot(ctx, start, y, 9, blue);
      if (takeAway > 0) line(ctx, start, y, end, y, orange, 9);
      dot(ctx, end, y, 10, takeAway ? orange : blue);
      continue;
    }
    const end = x(r.u);
    if (i === 2) {
      line(ctx, end, y, x(old.u), y, orange, 5, [9, 8]);
      dot(ctx, x(old.u), y, 7, blue);
    }
    rect(ctx, Math.min(zero, end), y - 18, Math.abs(r.u) * 39, 34, col);
    text(ctx, fmt(r.u), end + (r.u < 0 ? -16 : 16), y + (i === 2 ? -32 : 18),
      41, col, 'Mono', r.u < 0 ? 'right' : 'left');
  }
  text(ctx,
    divide
      ? 'Blend   ' + fmt(signedMerge.u) + ' / ' + fmt(signedMerge.l) + ' ≈ ' + fmt(signedMerge.u / signedMerge.l)
      : takeAway === 1
        ? 'Negative value subtracts from the numerator. Its weight still adds.'
        : addition
          ? 'Start at the rescaled old sum and subtract the incoming amount.'
          : 'Put both tiles on reference 5. Which side of zero will the sum land?',
    110, 823, 39, slate);
}

export function partial(ctx, clock) {
  const shown = cue(clock, 1, 'Measure each width', 0.8);
  const weighed = cue(clock, 2, 'The total is');
  const level = cue(clock, 2, 'Level those shapes', 2.6);
  const erased = cue(clock, 3, 'Erase the two scores');
  const third = cue(clock, 3, 'The last key scores three');
  rect(ctx, 0, 0, 1920, 1080, paper);
  text(
    ctx,
    third ? 'What will a higher score change?' : 'What can survive the first tile?',
    112,
    145,
    85,
    ink,
    'Serif',
  );
  const left = 188,
    bottom = 815,
    unit = 900,
    vScale = 14.3;
  const weights = SCORES.slice(0, 2).map((s) => Math.exp(s - first.m));
  let x = left;
  for (let i = 0; i < 2; i++) {
    const width = weights[i] * unit;
    const height = VALUES[i] + (oldHeight - VALUES[i]) * level;
    if (!erased) {
      text(ctx, 'score', left + 68 + i * 305, 274, 35, slate, 'Sans', 'center');
      rect(ctx, left + i * 305, 308, 235, 76, i ? blue : sky);
      text(ctx, ['fix   1', 'this   2'][i], left + 117 + i * 305, 361, 42, chalk, 'Mono', 'center');
    }
    fade(ctx, shown, () => {
      rect(
        ctx,
        x,
        bottom - vScale * height,
        width,
        vScale * height,
        level === 1 ? blue : i ? blue : sky,
      );
      if (level === 0)
        text(ctx, VALUES[i], x + width / 2, bottom - 37, 53, chalk, 'Mono', 'center');
      if (level === 0) brace(ctx, x, x + width, bottom + 38, fmt(weights[i]), blue);
    });
    x += width;
  }
  if (erased) {
    text(ctx, 'Saved reference', left, 305, 47);
    text(ctx, first.m, left, 398, 76, ink, 'Mono');
    if (third) {
      text(ctx, 'Incoming key', 985, 304, 41, orange);
      rect(ctx, 980, 326, 337, 77, orange);
      text(ctx, 'test   3', 1148, 382, 48, paper, 'Mono', 'center');
    }
  } else {
    text(ctx, 'Reference score', 930, 275, 39, slate);
    text(ctx, first.m, 932, 377, 75, ink, 'Mono');
  }
  line(ctx, left - 12, bottom + 2, 1549, bottom + 2, slate, 4);
  if (weighed) {
    if (level === 1) {
      const y = bottom - oldHeight * vScale;
      line(ctx, left - 65, y, left + 2, y, blue, 6);
      dot(ctx, left - 65, y, 9, blue);
      text(ctx, fmt(oldHeight, 2), left - 15, y - 25, 43, blue, 'Mono', 'right');
      text(
        ctx,
        'area ' + fmt(first.u),
        left + (first.l * unit) / 2,
        bottom - (oldHeight * vScale) / 2 + 17,
        53,
        paper,
        'Mono',
        'center',
      );
      brace(ctx, left, x, bottom + 38, 'width ' + fmt(first.l), blue, 47);
    } else text(ctx, 'Total area   ' + fmt(first.u), 1470, 508, 41, ink, 'Sans', 'right');
  }
  if (!erased)
    text(
      ctx,
      level === 1 ? 'Blend  =  area ÷ width' : 'Width is weight. Height is value.',
      110,
      1009,
      42,
      ink,
    );
}

function referencePlot(ctx, ref, offset, active, settled) {
  const a = referencePair(ref),
    start = offset + 28,
    base = 735,
    unit = 260,
    scale = 13;
  text(ctx, 'Reference ' + ref, offset + 28, 348, 55, ink, 'Serif');
  if (!active) {
    text(ctx, 'score   1        1.3', offset + 30, 482, 41, ink, 'Mono');
    text(ctx, 'value  10         20', offset + 30, 564, 41, ink, 'Mono');
    text(ctx, 'new width  ?', offset + 30, 679, 48, orange, 'Mono');
    return;
  }
  let x = start;
  for (const [i, w] of a.w.entries()) {
    const h = (i ? 20 : 10) * scale;
    rect(ctx, x, base - h, w * unit, h, i ? orange : blue);
    text(ctx, fmt(w), x + (w * unit) / 2, base + 67, 39, i ? orange : blue, 'Mono', 'center');
    x += w * unit;
  }
  line(ctx, start - 8, base + 3, x + 10, base + 3, slate, 3);
  if (settled) {
    const py = base - a.mean * scale;
    line(ctx, start - 10, py, x + 22, py, paper, 10);
    line(ctx, start - 10, py, x + 22, py, ink, 4);
    dot(ctx, x + 23, py, 7, ink);
    text(ctx, 'mean ' + fmt(a.mean), start, 449, 45, green, 'Mono');
  }
}

export function reference(ctx, clock) {
  if (clock.beat.beatIndex === 2) {
    const valid = cue(clock, 3, 'another tile has a valid key'),
      empty = cue(clock, 3, 'the whole row stays empty');
    const range = cue(clock, 3, 'A separate range check'),
      reject = cue(clock, 3, 'The sketch rejects');
    page(
      ctx,
      range ? 'Can finite inputs overflow?' : 'What does an empty tile carry?',
      'NUMERICAL LIMITS   /   CPU SKETCH',
    );
    if (!range) {
      const colors = [faint, faint, faint];
      for (let i = 0; i < 3; i++) {
        const x = 167 + i * 224;
        rect(ctx, x, 431, 188, 172, colors[i]);
        line(ctx, x + 30, 565, x + 158, 467, slate, 6);
      }
      text(ctx, 'All keys masked', 165, 347, 53, ink, 'Serif');
      text(ctx, 'mass  ' + emptyRow.l + '       area  ' + emptyRow.u, 164, 698, 47, slate, 'Mono');
      if (valid) {
        line(ctx, 925, 300, 925, 780, faint);
        text(ctx, 'If a visible key follows', 1004, 351, 48, ink, 'Serif');
        rect(ctx, 1011, 433, 545, 169, blue);
        text(ctx, 'score 3    value 40', 1284, 531, 45, paper, 'Mono', 'center');
        text(ctx, 'mass  ' + single.l + '      area  ' + single.u, 1007, 695, 45, blue, 'Mono');
      }
      note(
        ctx,
        empty
          ? 'An entirely empty row returns 0 by convention. It has no probability distribution.'
          : 'An empty tile adds nothing to the running sum.',
      );
    } else {
      text(ctx, 'Two equal, visible scores', 163, 321, 56, ink, 'Serif');
      for (let i = 0; i < 2; i++) {
        const y = 411 + 175 * i;
        rect(ctx, 171, y, 623, 125, i ? blue : sky);
        text(ctx, '1 × 9 × 10³⁰⁷', 481, y + 83, 58, paper, 'Mono', 'center');
      }
      arrow(ctx, 845, 562, 997, 562, ink, 5);
      text(ctx, 'FP64 numerator', 1060, 441, 46, slate);
      text(
        ctx,
        reject && !overflow.accepted ? 'Overflow' : '9 × 10³⁰⁷ + 9 × 10³⁰⁷',
        1054,
        552,
        reject ? 83 : 41,
        orange,
        reject ? 'Serif' : 'Mono',
      );
      text(ctx, 'Representable mean   9 × 10³⁰⁷', 1058, 654, 40, ink);
      note(
        ctx,
        reject
          ? 'Reject the overflowing accumulator before returning an output.'
          : 'The true mean fits even when the unnormalized sum exceeds the range.',
      );
    }
    return;
  }
  const kept = cue(clock, 2, 'Keep one and'),
    moved = cue(clock, 2, 'move the ruler to one point three');
  const equal = cue(clock, 2, 'Compare the heights');
  page(
    ctx,
    'Choose one reference for every weight',
    'FLASHATTENTION-4   /   CONDITIONAL RESCALING',
  );
  referencePlot(ctx, 1, 110, kept, equal);
  line(ctx, 951, 292, 951, 848, faint, 3);
  if (moved) referencePlot(ctx, 1.3, 1030, true, equal);
  else {
    text(ctx, 'Incoming key', 1036, 351, 53, ink, 'Serif');
    text(ctx, 'score   1.3', 1034, 490, 66, orange, 'Mono');
    text(ctx, 'value    20', 1034, 587, 66, orange, 'Mono');
  }
  note(
    ctx,
    equal
      ? 'Both numerator and denominator use the reference printed above their widths.'
      : 'Each width is exp(score − reference). The policy can retain a safe earlier reference.',
  );
}

export function causal(ctx, clock) {
  const unequal = clock.beat.beatIndex === 2;
  if (unequal) {
    const first = cue(clock, 3, 'Query twenty-four can use'),
      last = cue(clock, 3, 'Query forty-seven can use');
    page(ctx, 'Does this whole tile pass?', 'UNEQUAL RANGES   /   QUERY 24…47   ×   KEY 24…31');
    const x = 514,
      step = 137;
    text(ctx, 'Absolute key', 126, 349, 41, slate);
    for (let c = 0; c < 8; c++)
      text(ctx, 24 + c, x + (c + 0.48) * step, 349, 47, slate, 'Mono', 'center');
    for (const [i, q] of [24, 47].entries()) {
      const yy = 427 + i * 224,
        shown = i ? last : first;
      text(ctx, 'Query ' + q, 120, yy + 82, 54, ink, 'Serif');
      for (let c = 0; c < 8; c++) {
        const px = x + c * step,
          pass = 24 + c <= q;
        rect(ctx, px, yy, step - 6, 126, shown ? (pass ? blue : faint) : lightBlue);
        if (shown)
          text(
            ctx,
            pass ? '✓' : '×',
            px + (step - 6) / 2,
            yy + 88,
            64,
            pass ? chalk : slate,
            'Sans',
            'center',
          );
      }
    }
    note(
      ctx,
      last
        ? 'Boundary tile. Some pairs pass and some need masking.'
        : 'A key contributes when its absolute position is at or before this query.',
    );
    return;
  }
  const skip = cue(clock, 2, 'Skip the six'),
    past = cue(clock, 2, 'Six past tiles'),
    diagonal = cue(clock, 2, 'The four diagonal');
  const counts = classifyAligned(4),
    x = 253,
    y = 330,
    cell = 130;
  page(
    ctx,
    'Which tiles can you skip whole?',
    'CAUSAL PREFILL   /   FOUR EQUAL, ALIGNED TILES PER AXIS',
  );
  text(ctx, 'Key tile', x, 278, 38, slate);
  grid(ctx, x, y, 4, 4, cell, (a, b, r, c) => {
    const type = causalTileClass(2 * r, 2 * r + 1, 2 * c, 2 * c + 1);
    if (c === 0) text(ctx, 'Q' + r, a - 19, b + 79, 39, slate, 'Mono', 'right');
    if (r === 0) text(ctx, 'K' + c, a + cell / 2, b - 12, 35, slate, 'Mono', 'center');
    const state =
      type === 'past' && past
        ? 'all'
        : type === 'future' && skip
          ? 'skip'
          : type === 'boundary' && diagonal
            ? 'mask'
            : 'unknown';
    const fill = { all: blue, skip: faint, mask: orange, unknown: lightBlue }[state];
    rect(ctx, a, b, cell - 5, cell - 5, fill);
    if (state === 'skip') line(ctx, a + 18, b + cell - 21, a + cell - 22, b + 18, slate, 3);
    if (state === 'mask') {
      ctx.fillStyle = lightOrange;
      ctx.beginPath();
      ctx.moveTo(a, b);
      ctx.lineTo(a + cell - 5, b);
      ctx.lineTo(a + cell - 5, b + cell - 5);
      ctx.fill();
    }
    if (state === 'all') text(ctx, '✓', a + cell / 2, b + 85, 61, chalk, 'Sans', 'center');
  });
  if (diagonal) {
    text(ctx, 'Inside one diagonal tile', 947, 349, 54, ink, 'Serif');
    const z = 92;
    grid(ctx, 960, 407, 2, 2, z, (px, py, r, c) => {
      const pass = c <= r;
      rect(ctx, px, py, z - 4, z - 4, pass ? blue : faint);
      text(ctx, pass ? '✓' : '×', px + 44, py + 63, 48, pass ? chalk : slate, 'Sans', 'center');
    });
    text(ctx, 'Future key', 1209, 465, 40, slate);
    text(ctx, 'score → −∞', 1209, 538, 48, orange, 'Mono');
    text(
      ctx,
      counts.past + counts.boundary + ' computed    ' + counts.future + ' skipped',
      948,
      735,
      48,
      ink,
      'Sans',
    );
  } else if (skip) {
    text(ctx, counts.future + ' future tiles', 957, 485, 72, slate, 'Serif');
    if (past) text(ctx, counts.past + ' past tiles', 957, 627, 72, blue, 'Serif');
  } else {
    text(ctx, 'Each tile contains', 956, 450, 62, ink, 'Serif');
    text(ctx, '2 queries × 2 keys', 956, 544, 55, blue, 'Mono');
    text(ctx, 'Key position ≤ query position', 955, 673, 45, ink);
  }
  note(
    ctx,
    diagonal
      ? 'For T tiles on each axis, compute T(T + 1)/2. Count the diagonal once.'
      : 'Tiles group positions. The causal rule applies to each query and key.',
  );
}

export function cache(ctx, clock) {
  const beat = clock.beat.beatIndex,
    upper = cue(clock, 2, 'An upper-left'),
    all = cue(clock, 2, 'An open mask');
  const repaired = cue(clock, 3, 'Keep slots zero through two');
  const reveal = cue(clock, 3, 'Their sum is twenty-seven');
  const mode = repaired ? 'absolute' : all ? 'all' : upper ? 'upper-left' : null;
  page(
    ctx,
    beat === 0 ? 'Follow logical positions through the cache' : 'Which slots belong to query 2?',
    'DECODE   /   ONE QUERY   /   FIVE LOGICAL SLOTS',
  );
  const left = 319,
    w = 261,
    y = 451;
  const seq = [7, 7, 3, 3, 9];
  for (const [i, v] of inputValues.entries()) {
    const px = left + i * w,
      col = i < 3 ? blue : slate;
    text(ctx, i, px + w * 0.47, y - 37, 45, col, 'Mono', 'center');
    rect(ctx, px, y, w - 9, 135, i < 3 ? blue : faint);
    text(ctx, v, px + w * 0.47, y + 91, 68, i < 3 ? chalk : slate, 'Mono', 'center');
    if (beat === 0) {
      text(ctx, 'block ' + seq[i], px + w * 0.47, y + 218, 37, col, 'Mono', 'center');
      line(ctx, px + w * 0.47, y + 142, px + w * 0.47, y + 173, col);
    } else if (mode) {
      const row = cacheMasks[mode];
      if (row.allowed[i]) rect(ctx, px, y + 152, w - 9, 18, repaired ? green : orange);
    }
  }
  text(ctx, 'Position', 107, y - 37, 38, slate);
  text(ctx, 'Value', 107, y + 87, 43, ink);
  brace(ctx, left, left + 3 * w - 9, y - 116, '', blue);
  text(ctx, '3 valid slots', left + 1.5 * w, y - 150, 39, blue, 'Sans', 'center');
  brace(ctx, left + 3 * w, left + 5 * w - 9, y - 116, '', slate);
  text(ctx, 'Unused capacity', left + 4 * w, y - 150, 39, slate, 'Sans', 'center');
  if (beat === 0) {
    text(ctx, 'Physical', 102, y + 219, 38, slate);
    text(ctx, 'One logical read spans scattered blocks.', left, 823, 53, ink, 'Serif');
    note(ctx, 'The allocator locates pages. The attention kernel still applies a position mask.');
  } else {
    const caption = {
      all: 'Open mask admits every slot',
      absolute: 'Valid slot and key position ≤ 2',
      'upper-left': 'Upper-left mask admits only the first column',
    };
    if (mode) text(ctx, caption[mode], left, 727, 52, repaired ? green : orange, 'Serif');
    if (reveal)
      text(
        ctx,
        '(' + inputValues.slice(0, 3).join(' + ') + ') / 3  =  ' + cacheMasks.absolute.output,
        left,
        833,
        62,
        ink,
        'Mono',
      );
    if (cue(clock, 3, 'The upper-left mask would return'))
      text(ctx, 'Upper-left  ' + cacheMasks['upper-left'].output, 1217, 770, 37, orange, 'Mono');
    if (cue(clock, 3, 'Opening every slot would return'))
      text(ctx, 'All slots   ' + cacheMasks.all.output, 1217, 833, 37, orange, 'Mono');
    note(
      ctx,
      reveal
        ? 'With dropout_p = 0, only the admitted values determine this equal-score average.'
        : 'All scores are zero. Each admitted value receives the same weight.',
    );
  }
}
