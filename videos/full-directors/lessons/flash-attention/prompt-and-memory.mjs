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
  palette,
  words,
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
  full,
  probabilities,
  resultParts,
  blend,
  attention,
  first,
  tile,
  crossings,
  giB,
  kiB,
  tilePipelinePrefix,
} from './examples.mjs';

export function prompt(ctx, clock) {
  const extend = cue(clock, 1, 'Extend both strips', 0.65);
  const reserved = cue(clock, 2, 'Four copies fit');
  const causal = cue(clock, 2, 'Shade those crossings');
  const follow = cue(clock, 3, 'Follow the row for test');
  const across = cue(clock, 1, 'Fix this test', 1.15);
  const down = cue(clock, 1, 'Now read the same words', 1.6);
  const n = extend > 0 ? 6 : 3,
    x = 392,
    y = 352,
    cell = 85;
  page(
    ctx,
    follow ? 'One row, one blend' : 'How much space for the scores?',
    'PROMPT   /   CAUSAL PREFILL',
  );
  text(ctx, 'Keys', x, y - 110, 35, slate);
  text(ctx, 'Queries', x - 208, y - 30, 35, slate);
  for (let i = 0; i < n; i++)
    fade(ctx, i < 3 ? 1 : extend, () => {
      const active = i === 2 && follow;
      rect(ctx, x + i * cell, y - 73, cell - 2, 62, i < 3 ? ink : green);
      text(ctx, words[i], x + (i + 0.5) * cell, y - 30, 40, chalk, 'Serif', 'center');
      rect(ctx, x - 143, y + i * cell, 130, cell - 2, active ? orange : i < 3 ? ink : green);
      text(ctx, words[i], x - 78, y + (i + 0.63) * cell, 39, chalk, 'Serif', 'center');
    });
  if (clock.beat.beatIndex === 0 && !extend) {
    line(ctx, x, y - 12, x + cell * 3 * across, y - 12, orange, 6);
    line(ctx, x - 14, y, x - 14, y + cell * 3 * down, orange, 6);
  }
  grid(ctx, x, y, n, n, cell, (px, py, row, col) => {
    if (row >= 3 || col >= 3) {
      if (!reserved) return;
    }
    const valid = col <= row;
    const focus = follow && row === 2 && valid;
    const fill = focus
      ? orange
      : causal
        ? valid
          ? blue
          : faint
        : row < 3 && col < 3
          ? blue
          : lightBlue;
    rect(ctx, px, py, cell - 3, cell - 3, fill);
    if (causal && !valid) line(ctx, px + 18, py + cell - 18, px + cell - 18, py + 18, '#a9a48f', 2);
    if (focus) text(ctx, SCORES[col], px + cell / 2, py + cell * 0.68, 42, chalk, 'Mono', 'center');
  });
  if (extend && !reserved) {
    ctx.save();
    ctx.globalAlpha = extend;
    edge(ctx, x, y, 6 * cell - 2, 6 * cell - 2, green, 3, [12, 12]);
    ctx.restore();
  }
  if (reserved && !causal) {
    line(ctx, x + 3 * cell - 1, y, x + 3 * cell - 1, y + 6 * cell, ink, 6);
    line(ctx, x, y + 3 * cell - 1, x + 6 * cell, y + 3 * cell - 1, ink, 6);
  }
  const tx = 1065;
  if (follow) {
    text(ctx, 'Query', tx, 363, 44, slate);
    text(ctx, 'test', tx, 469, 98, orange, 'Serif');
    text(ctx, '3 permitted keys', tx, 569, 54);
    arrow(ctx, tx + 36, 595, tx + 36, 655, ink);
    text(ctx, '1 output vector', tx, 735, 62, ink, 'Serif');
    note(ctx, 'Can two score slots carry all three contributions?');
  } else {
    text(ctx, 'Original prompt', tx, 367, 42, slate);
    text(ctx, '3 × 3 = ' + crossings(3).space, tx, 454, 77, blue, 'Mono');
    if (extend)
      fade(ctx, extend, () => {
        text(ctx, 'Extended prompt', tx, 586, 42, slate);
        text(ctx, '6 × 6 = ' + (reserved ? crossings(6).space : '?'), tx, 682, 77, green, 'Mono');
      });
    if (causal) text(ctx, crossings(6).allowed + ' allowed pairs', tx, 792, 53, blue, 'Serif');
    note(
      ctx,
      causal
        ? 'Every position has a slot in this full allocation.'
        : extend
          ? 'How many copies of the original square would fit?'
          : 'One query and one key meet at each crossing.',
    );
  }
}

export function operator(ctx, clock) {
  const score = cue(clock, 1, 'Our example already');
  const exp = cue(clock, 2, 'Subtract it from each score');
  const share = cue(clock, 2, 'Divide by the total weight');
  const products = cue(clock, 3, 'Multiply each value by its share');
  const total = cue(clock, 3, 'They give about');
  page(ctx, 'What does test take from each key?', 'ONE ROW   /   ONE VALUE COORDINATE');
  const centers = [666, 1060, 1454];
  text(ctx, 'query  test', 131, 317, 54, orange, 'Serif');
  text(ctx, 'Scaled score', 131, 426, 43);
  text(ctx, 'Value', 131, 526, 43);
  if (exp) text(ctx, 'exp(score − 3)', 131, 634, 39, slate, 'Mono');
  if (share) text(ctx, 'Share of row', 131, 740, 43);
  for (let i = 0; i < 3; i++) {
    const x = centers[i],
      color = palette[i];
    rect(ctx, x - 152, 248, 304, 91, color);
    text(ctx, words[i], x, 313, 57, paper, 'Serif', 'center');
    text(ctx, score ? SCORES[i] : 'q · k / √d', x, 431, score ? 65 : 41, ink, 'Mono', 'center');
    text(ctx, score ? VALUES[i] : 'v', x, 532, 65, ink, 'Mono', 'center');
    if (exp) text(ctx, fmt(Math.exp(SCORES[i] - full.m)), x, 635, 49, color, 'Mono', 'center');
    if (share) {
      edge(ctx, x - 140, 686, 280, 17, faint, 2);
      rect(ctx, x - 140, 686, probabilities[i] * 280, 17, color);
      text(ctx, fmt(probabilities[i]), x, 755, 43, ink, 'Mono', 'center');
    }
    if (products) text(ctx, fmt(resultParts[i], 2), x, 865, 56, color, 'Mono', 'center');
  }
  if (products) text(ctx, 'Share × value', 131, 863, 43);
  line(ctx, 110, 562, 1779, 562, faint);
  note(
    ctx,
    total
      ? 'Weighted sum  ≈  ' + fmt(blend) + '      •      inside the interval [10, 40]'
      : share
        ? 'Which value has the strongest pull on the blend?'
        : exp
          ? 'The largest score has a unit weight.'
          : 'Each value stays with the key that earned its score.',
  );
}

export function bus(ctx, clock) {
  const active = clock.beat.beatIndex;
  const allocation = cue(clock, 1, "that's thirty-two gibibytes");
  const passes = [
    ['Write scores out', 'S', 1, blue],
    ['Softmax reads scores back', 'S', -1, blue],
    ['writes probabilities out', 'P', 1, orange],
    ['reads probabilities back', 'P', -1, orange],
  ];
  const amount = attention.score / giB;
  page(ctx, 'Follow the square across the bus', 'HALF-PRECISION BASELINE   /   2 BYTES PER ENTRY');
  text(
    ctx,
    '8 prompts   ×   32 heads   ×   8,192 queries   ×   8,192 keys',
    113,
    265,
    41,
    ink,
    'Mono',
  );
  if (active === 0) {
    const x = 440,
      y = 352,
      side = 424;
    for (let i = 2; i >= 0; i--) {
      const off = i * 16;
      rect(ctx, x + off, y - off, side, side, i === 0 ? blue : lightBlue);
      edge(ctx, x + off, y - off, side, side, paper, 3);
    }
    for (let i = 1; i < 16; i++) {
      const off = (side * i) / 16;
      line(ctx, x + off, y, x + off, y + side, '#ffffff65', 2);
      line(ctx, x, y + off, x + side, y + off, '#ffffff65', 2);
    }
    brace(ctx, x, x + side, y + side + 22, '8,192 keys', blue);
    text(ctx, '8,192 queries', x - 26, y + side / 2, 40, blue, 'Sans', 'right');
    text(ctx, 'One square per head per prompt', 1015, 438, 48, ink, 'Serif');
    text(ctx, '8 × 32 squares', 1015, 550, 52, slate, 'Mono');
    if (allocation) text(ctx, amount + ' GiB', 1008, 709, 92, blue, 'Mono');
    note(ctx, 'Full allocation = batch × heads × query length × key length × bytes per score');
    return;
  }
  text(ctx, 'Arithmetic', 184, 400, 55, ink, 'Serif');
  text(ctx, 'HBM', 1582, 400, 55, ink, 'Serif');
  line(ctx, 385, 438, 385, 824, slate, 5);
  line(ctx, 1540, 438, 1540, 824, slate, 5);
  let complete = 0;
  passes.forEach(([phrase, sym, dir, col], i) => {
    const t = cue(clock, 2, phrase, 0.9),
      yy = 457 + i * 104;
    const a = dir > 0 ? 465 : 1460,
      b = dir > 0 ? 1460 : 465;
    line(ctx, 430, yy, 1495, yy, faint, 2, [9, 8]);
    if (t === 0) return;
    arrow(ctx, a, yy, b, yy, col, 4);
    const pos = a + (b - a) * t;
    rect(ctx, pos - 35, yy - 34, 70, 68, col);
    text(ctx, sym, pos, yy + 17, 43, chalk, 'Mono', 'center');
    text(
      ctx,
      ['write scores', 'read scores', 'write probabilities', 'read probabilities'][i],
      910,
      yy - 38,
      32,
      col,
      'Sans',
      'center',
    );
    if (t === 1) complete++;
  });
  if (allocation) {
    text(ctx, amount + ' GiB', 1580, 522, 47, blue, 'Mono');
    text(ctx, 'one array', 1582, 572, 32, slate);
  }
  const revealTotal = cue(clock, 3, 'Four crossings give');
  if (revealTotal) text(ctx, complete * amount + ' GiB', 152, 713, 54, green, 'Mono');
  if (revealTotal) text(ctx, 'logical transfers', 153, 761, 30, slate);
  note(
    ctx,
    active === 0
      ? 'Allocation  =  batch × heads × query length × key length × bytes per score'
      : revealTotal
        ? 'Four full-array transfers. A profiler measures the physical traffic.'
        : 'Count a transfer when its square reaches the other side.',
  );
}

export function workingSet(ctx, clock) {
  if (clock.beat.beatIndex === 2) {
    const shared = cue(clock, 3, 'Put the query'),
      regs = cue(clock, 3, 'Put the output');
    page(
      ctx,
      'Which local budget pays for each tile?',
      'ILLUSTRATIVE PLACEMENT   /   ONE THREAD BLOCK',
    );
    for (const [i, [label, parts, values, show, col]] of [
      ['Shared memory', ['Q', 'K', 'V'], [tile.q, tile.k, tile.v], shared, blue],
      ['Registers', ['O', 'score fragments'], [tile.o, tile.s], regs, green],
    ].entries()) {
      const y = 338 + i * 243;
      text(ctx, label, 128, y + 83, 54, col, 'Serif');
      edge(ctx, 579, y, 1024, 135, faint, 3);
      if (show) {
        let x = 579;
        for (const [j, value] of values.entries()) {
          const w = (value / kiB) * 32;
          rect(ctx, x, y, w - 3, 135, col);
          text(ctx, parts[j], x + w / 2, y + 85, 42, chalk, 'Sans', 'center');
          x += w;
        }
        text(ctx, values.reduce((a, b) => a + b) / kiB + ' KiB', 1633, y + 81, 40, col, 'Mono');
      }
    }
    note(ctx, 'Lengths show assigned bytes. Check each pool against its own launch limit.');
    return;
  }
  const sized = cue(clock, 2, 'At four bytes per score');
  const subtotal = cue(clock, 2, 'Add eight for output');
  page(ctx, 'Which two axes make a score tile?', 'LOCAL WORKSPACE   /   WIDTH 32');
  const parts = [
    ['Q', '64 × 32', tile.q, 96, 192, sky],
    ['K', '96 × 32', tile.k, 96, 288, blue],
    ['V', '96 × 32', tile.v, 96, 288, green],
    ['O', '64 × 32', tile.o, 192, 192, slate],
    ['S', '64 × 96', tile.s, 576, 192, orange],
  ];
  const xs = [151, 390, 628, 867, 1200],
    bottom = 650;
  for (const [i, [name, dims, bytes, w, h, col]] of parts.entries()) {
    const x = xs[i],
      mid = x + w / 2,
      pending = i === 4 && !sized;
    text(ctx, name, mid, 315, 60, col, 'Serif', 'center');
    if (pending) edge(ctx, x, bottom - h, w, h, col, 4, [12, 12]);
    else {
      rect(ctx, x, bottom - h, w, h, col);
      for (let py = bottom - h + 24; py < bottom; py += 24)
        line(ctx, x, py, x + w, py, '#ffffff52', 2);
      for (let px = x + 24; px < x + w; px += 24)
        line(ctx, px, bottom - h, px, bottom, '#ffffff52', 2);
    }
    text(ctx, pending ? '?' : dims, mid, 712, 37, ink, 'Mono', 'center');
    text(
      ctx,
      (i < 3 ? 'FP16' : 'FP32') + (sized ? '   ' + bytes / kiB + ' KiB' : ''),
      mid,
      764,
      31,
      col,
      'Sans',
      'center',
    );
  }
  if (subtotal) {
    brace(ctx, 143, 748, 804, '16 KiB', blue);
    text(ctx, '+', 806, 858, 44, slate);
    text(ctx, '8 KiB', 963, 858, 42, slate, 'Sans', 'center');
    text(ctx, '+', 1116, 858, 44, slate);
    text(ctx, '24 KiB   =   48 KiB', 1486, 858, 42, ink, 'Sans', 'center');
  }
  note(ctx, 'Rectangle area represents bytes. FP32 uses twice as many bytes per element as FP16.');
}

export function stream(ctx, clock) {
  const arrive = cue(clock, 1, 'Stream the first', 1),
    saved = cue(clock, 1, 'Save what those keys contributed');
  const clear = cue(clock, 1, 'clear both slots'),
    last = cue(clock, 2, 'Slide the last key', 0.85);
  const merged = cue(clock, 2, 'Both tiles have now contributed');
  const reverse = cue(clock, 3, 'The original FlashAttention loop');
  page(
    ctx,
    reverse ? 'Which tile stays for the next visit?' : 'Keep test in place',
    reverse ? 'LOOP ORDER   /   TWO SCHEDULES' : 'QUERY-RESIDENT SCHEDULE   /   TWO SCORE SLOTS',
  );
  if (reverse) {
    for (const [i, pinned, moving, color] of [
      [0, 'K/V block', 'query rows', green],
      [1, 'Query block', 'K/V tiles', blue],
    ]) {
      const y = 355 + i * 265;
      text(ctx, 'FA' + (i + 1), 122, y + 92, 57, color, 'Mono');
      rect(ctx, 357, y, 395, 142, color);
      text(ctx, pinned, 555, y + 86, 51, chalk, 'Serif', 'center');
      brace(ctx, 358, 751, y + 165, 'resident', color, 33);
      for (let t = 0; t < 3; t++) {
        const x = 905 + t * 220;
        edge(ctx, x, y + 12, 181, 95, color);
        text(ctx, (i ? 'KV' : 'Q') + ' ' + (t + 1), x + 90, y + 78, 41, color, 'Mono', 'center');
      }
      arrow(ctx, 900, y + 143, 1537, y + 143, color);
      text(ctx, moving, 1628, y + 74, 32, slate, 'Sans', 'center');
    }
    note(
      ctx,
      'FA1 revisits partial rows in HBM. FA2 can finish each resident row before writing it.',
    );
    return;
  }
  const laneX = 700,
    laneY = 444;
  text(ctx, 'Resident query', 163, 357, 42, slate);
  rect(ctx, 148, 407, 366, 185, ink);
  text(ctx, 'test', 331, 529, 83, chalk, 'Serif', 'center');
  text(ctx, 'On-chip score slots', laneX, 360, 50, ink, 'Serif');
  for (let i = 0; i < 2; i++) {
    const x = laneX + i * 328;
    edge(ctx, x, laneY, 310, 123, slate, 4, [10, 7]);
    if (!clear)
      fade(ctx, arrive, () => {
        rect(ctx, x - (1 - arrive) * 178, laneY, 310, 123, palette[i]);
        text(
          ctx,
          words[i] + '   ' + SCORES[i],
          x - (1 - arrive) * 178 + 155,
          laneY + 83,
          50,
          chalk,
          'Serif',
          'center',
        );
      });
  }
  if (last && !merged)
    fade(ctx, last, () => {
      const x = laneX + (1 - last) * 390;
      rect(ctx, x, laneY, 310, 123, orange);
      text(ctx, 'test   3', x + 155, laneY + 83, 50, chalk, 'Serif', 'center');
    });
  if (!merged)
    text(
      ctx,
      last
        ? 'value 40'
        : clear
          ? 'slots available'
          : arrive
            ? 'values 10, 20'
            : 'ready for the first tile',
      laneX,
      640,
      42,
      slate,
    );
  if (saved) {
    const a = merged ? full : first;
    line(ctx, 150, 704, 1770, 704, faint);
    text(ctx, 'Row state', 152, 799, 51, ink, 'Serif');
    text(
      ctx,
      'm   ' + a.m + '      weight   ' + fmt(a.l) + '      weighted sum   ' + fmt(a.u),
      465,
      802,
      44,
      blue,
      'Mono',
    );
  }
  note(
    ctx,
    merged
      ? 'Both tiles contributed. The query can now write its output.'
      : saved
        ? 'The update survives when the two score slots are cleared.'
        : 'The query stays here while the keys and values move.',
  );
}

export function pipeline(ctx, clock) {
  const stage = cue(clock, 2, 'the producer can fill A')
    ? 8
    : cue(clock, 2, 'the consumer takes B')
      ? 7
      : cue(clock, 2, 'a release')
        ? 6
        : cue(clock, 2, 'Copy complete')
          ? 5
          : cue(clock, 2, 'Fill B')
            ? 4
            : 3;
  const { slots } = tilePipelinePrefix(stage);
  page(ctx, 'Who owns each slot?', 'FLASHATTENTION-3   /   CONCEPTUAL DOUBLE BUFFER');
  for (const [i, key] of ['A', 'B'].entries()) {
    const s = slots[key],
      x = 177 + i * 845;
    const col = { free: slate, copying: orange, ready: green, reading: blue }[s.status];
    text(ctx, 'Slot ' + key, x, 342, 56, ink, 'Serif');
    edge(ctx, x, 385, 675, 303, col, 5);
    if (s.tile !== null) {
      rect(ctx, x + 26, 412, 623, 200, s.status === 'copying' ? lightOrange : lightBlue);
      for (let n = 1; n < 8; n++) line(ctx, x + 26 + n * 78, 412, x + 26 + n * 78, 612, paper, 4);
      text(ctx, 'K/V tile ' + s.tile, x + 338, 534, 68, ink, 'Serif', 'center');
    }
    text(
      ctx,
      {
        free: 'Free',
        copying: 'Copy in flight',
        ready: 'Copy complete',
        reading: 'Consumer reading',
      }[s.status],
      x + 337,
      665,
      42,
      col,
      'Sans',
      'center',
    );
    if (s.status === 'reading') {
      line(ctx, x + 75, 735, x + 598, 735, col, 10);
      text(ctx, 'Held until release', x + 337, 811, 46, col, 'Sans', 'center');
    } else if (s.status === 'free')
      text(ctx, 'No tile loaded', x + 338, 810, 46, col, 'Sans', 'center');
    else
      text(
        ctx,
        s.status === 'copying' ? 'Wait before reading' : 'Safe to read',
        x + 338,
        810,
        46,
        col,
        'Sans',
        'center',
      );
  }
  note(
    ctx,
    clock.beat.beatIndex === 0
      ? 'A new tile is waiting. Which slot can its producer use?'
      : clock.beat.beatIndex === 2
        ? 'Dependent softmax waits for its matrix result. Independent work can overlap.'
        : 'Copy completion permits a read. Consumer release permits an overwrite.',
  );
}
