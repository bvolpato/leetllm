import {
  C,
  base,
  scope,
  rect,
  line,
  num,
  text,
  note,
  cue,
  opacity,
  dot,
  arrow,
  short,
} from './bench.mjs';
import {
  experiment,
  orientationWorksheet,
  projection,
  blockContraction,
} from '../../../films/low-precision-kernels/model.mjs';
import { halfAdds, floatAdds } from '../../../films/low-precision-kernels/encoding.mjs';

export const orientation = orientationWorksheet();
const mixed = projection();
export const spikeSelector = projection(true);
const selected = 3;
const signed = (v) => (v > 0 ? '+' : '') + short(v);
function tape(g, x, y, entries, w, h, active, ready) {
  const step = w / entries.length;
  entries.forEach(({ code }, i) => {
    if (!ready) {
      rect(g, x + i * step, y, step - 2, h, i === active ? C.decoded : C.faint);
      num(g, '?', x + (i + 0.5) * step - 1, y + h / 2 + 11, 33, C.ink, 'center');
      return;
    }
    rect(g, x + i * step, y, step - 2, h, active === i ? C.oxide : C.scope);
    // Bits run top to bottom in each byte. The colored comb below marks the group extent.
    for (let j = 0; j < 8; j++)
      if (code & (1 << (7 - j)))
        rect(
          g,
          x + i * step + 3,
          y + 5 + (j * (h - 9)) / 8,
          step - 8,
          (h - 10) / 9,
          active === i ? C.decoded : C.ref,
        );
  });
  line(g, x, y + h + 12, x + w - 2, y + h + 12, C.teal, 4);
  line(g, x, y + h + 1, x, y + h + 13, C.teal, 4);
  line(g, x + w - 2, y + h + 1, x + w - 2, y + h + 13, C.teal, 4);
}

export function groups(g, k) {
  const b = k.beat.beatIndex;
  if (b >= 3) {
    const turned = cue(k, 4, 'Read the wider matrix again', 0) > 0;
    const cell = 14,
      xx = 141,
      yy = 296;
    base(
      g,
      'Which values set this cell’s scale?',
      'Fresh quantization  /  one fixed 32 × 32 source matrix',
    );
    rect(g, xx - 6, yy - 6, 32 * cell + 12, 32 * cell + 12, C.scope);
    for (let i = 0; i < 32; i++)
      for (let j = 0; j < 32; j++) {
        const active = turned ? j === 1 : i === 0;
        rect(g, xx + j * cell, yy + i * cell, cell - 1, cell - 1, active ? C.ref : C.grid);
      }
    rect(g, xx, yy, cell - 1, cell - 1, C.decoded);
    rect(g, xx + cell, yy, cell - 1, cell - 1, '#fff');
    const zoomX = 1360,
      zoomY = 387,
      z = 98;
    text(g, 'Source corner', zoomX, 344, 33, C.muted);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const v = orientation.matrix[i][j];
        rect(
          g,
          zoomX + j * z,
          zoomY + i * z,
          z - 3,
          z - 3,
          (turned ? j === 1 : i === 0) ? C.teal : C.scope,
        );
        num(
          g,
          short(v),
          zoomX + (j + 0.5) * z,
          zoomY + (i + 0.6) * z,
          24,
          v === 700 ? C.decoded : C.light,
          'center',
        );
      }
    text(g, 'Source at row 0, column 1', 676, 344, 38, C.muted);
    num(g, '0.001', 668, 461, 95);
    const scale = turned ? orientation.columnScales[1] : orientation.rowScales[0];
    const tiny = turned ? orientation.columnTiny : orientation.rowTiny;
    text(g, turned ? 'Column 1   ·   max 1' : 'Row 0   ·   max 700', 678, 554, 45, C.teal);
    num(g, 'S = ' + short(scale), 680, 640, 51);
    num(g, 'Decoded  ' + tiny.reconstructed, 680, 735, 45, C.oxide);
    note(
      g,
      turned
        ? 'Quantize each column from the wider source.'
        : 'Row 0 contains both the spike and the selected value.',
      turned
        ? 'The column excludes the 700. A rowwise zero would still be zero if you transposed its bytes.'
        : 'The orange cell is 700, the white cell is 0.001, and the remaining source cells are 1.',
    );
    return;
  }
  const block = cue(k, 1, 'Now give each row', 0) > 0;
  const entries = block ? experiment.block : experiment.tensor;
  const showSmall = block
    ? cue(k, 2, 'The tiny value comes back', 0) > 0
    : cue(k, 1, 'Zero', 0) > 0;
  const showLarge = !block || cue(k, 2, 'Its spike now comes back', 0) > 0;
  base(g, 'Which values share the spike’s scale?', 'Activation memory  /  two rows of 32 bytes');
  text(
    g,
    block ? 'Each 32-value block owns its scale' : 'One reconstruction scale for all 64 values',
    90,
    281,
    41,
    C.teal,
  );
  [0, 1].forEach((i) => {
    const j = i === 0 ? 0 : 3,
      y = 355 + i * 205,
      v = entries[i][j],
      s = block ? experiment.scales[i] : experiment.tensorScale;
    const result = i === 0 ? showSmall : showLarge;
    text(
      g,
      'Row ' + i + '   ·   S = ' + short(s) + (result ? '' : '   ·   Codes pending'),
      92,
      y,
      32,
      C.muted,
    );
    tape(g, 92, y + 20, entries[i], 980, 99, j, result);
    text(g, 'x[' + i + ', ' + j + ']', 1141, y + 20, 32, C.muted);
    num(
      g,
      short(v.original) + '  →  ' + (result ? v.reconstructed : '?'),
      1120,
      y + 113,
      46,
      i ? C.ink : C.oxide,
    );
  });
  note(
    g,
    block
      ? showSmall
        ? 'A finer grid recovers detail in the small row.'
        : 'Read both rows with their new scales.'
      : showSmall
        ? 'The shared scale rounds the first sample to zero.'
        : 'Does one thousandth clear half a subnormal step?',
    block
      ? 'One E8M0 byte per block stores the power-of-two reconstruction scale.'
      : 'Half of the smallest reconstructed step = (500 / 448) / 1024 ≈ 0.00109.',
  );
}

export function traceState(k) {
  const original = Math.round(32 * cue(k, 0, 'Trace the signed products', 4.6));
  const trace =
    Math.round(4 * cue(k, 1, 'Replay the same weights', 1.6)) +
    Math.round(4 * cue(k, 1, 'Later in the pattern', 1.4)) +
    Math.round(23 * cue(k, 1, 'The last negative operand', 2.1));
  const decoded = cue(k, 2, 'At the same endpoint', 0) ? 32 : trace;
  const select = cue(k, 3, 'Sweep a single weight', 0) > 0;
  const pos = cue(k, 3, 'Stop on the spike', 0)
    ? selected
    : Math.min(2, Math.floor(cue(k, 3, 'Sweep a single weight', 3.7) * 3));
  return { original, decoded, select, pos };
}
function chart(g, x, y, w, h, nRef, nDec, showDec) {
  const yVal = (v) => y + h - ((v + 32) / 54) * h,
    xVal = (i) => x + (i * w) / 32;
  for (const v of [-30, -20, -10, 0, 10, 20]) {
    line(g, x, yVal(v), x + w, yVal(v), v === 0 ? C.pale : C.grid, v === 0 ? 2.5 : 1.5);
    num(g, v, x - 13, yVal(v) + 9, 24, C.pale, 'right');
  }
  for (const i of [0, 8, 16, 24, 32]) {
    line(g, xVal(i), y, xVal(i), y + h, C.grid, 1);
    num(g, i, xVal(i), y + h + 37, 26, C.pale, 'center');
  }
  function plot(data, count, color, width, dashed) {
    g.beginPath();
    g.setLineDash(dashed);
    g.moveTo(xVal(0), yVal(data[0]));
    for (let i = 1; i <= count; i++) g.lineTo(xVal(i), yVal(data[i]));
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
    g.setLineDash([]);
    dot(g, xVal(count), yVal(data[count]), width + 3, color);
  }
  plot(mixed.original, nRef, C.ref, 9, []);
  if (showDec) plot(mixed.reconstructed, nDec, C.decoded, 4, [11, 5]);
}
export function projections(g, k) {
  const s = traceState(k),
    b = k.beat.beatIndex;
  if (s.select) {
    base(
      g,
      'What does one weight of one read?',
      'Spike selector  /  same reconstructed activations',
    );
    const start = 104,
      step = 212;
    text(g, 'First eight positions of the 32-value row', 96, 290, 38, C.muted);
    for (let j = 0; j < 8; j++) {
      const x = start + j * step,
        hit = j === s.pos;
      rect(g, x, 351, step - 7, 128, hit ? C.teal : C.scope);
      num(g, experiment.rows[1][j], x + step / 2, 431, 49, hit ? C.light : C.ref, 'center');
      num(
        g,
        short(experiment.block[1][j].reconstructed),
        x + step / 2,
        564,
        47,
        hit ? C.oxide : C.muted,
        'center',
      );
      num(g, hit ? 1 : 0, x + step / 2, 687, 47, hit ? C.oxide : C.muted, 'center');
      if (hit) {
        arrow(g, x + step / 2, 634, x + step / 2, 590, C.oxide);
        line(g, x, 578, x + step - 7, 578, C.oxide, 4);
      }
    }
    text(g, 'Original', 100, 337, 29, C.teal);
    text(g, 'Decoded', 98, 512, 28, C.muted);
    text(g, 'Weight', 98, 625, 28, C.muted);
    const x = experiment.rows[1][s.pos],
      d = experiment.block[1][s.pos].reconstructed;
    note(
      g,
      'Selector at k = ' +
        s.pos +
        '     ·     original ' +
        x +
        '     /     decoded ' +
        d +
        '     /     difference ' +
        signed(d - x),
      'All other weights are zero. The earlier mixed-weight outputs both remain 7.75.',
    );
    return;
  }
  base(g, 'Where do the signed sums finish?', 'Projection  /  32 terms from the spike row');
  scope(g, 85, 248, 1128, 513);
  text(g, 'Prefix sum', 132, 313, 32, C.pale);
  chart(g, 186, 354, 966, 321, s.original, s.decoded, b >= 1);
  text(g, 'Terms consumed', 748, 741, 26, C.pale);
  text(g, 'Original  ·  ' + s.original + ' terms', 1262, 329, 34, C.muted);
  num(g, short(mixed.original[s.original]), 1257, 450, 92, C.teal);
  if (b >= 1) {
    text(g, 'Decoded  ·  ' + s.decoded + ' terms', 1262, 529, 34, C.muted);
    num(g, short(mixed.reconstructed[s.decoded]), 1257, 645, 92, C.oxide);
  }
  if (b === 2)
    note(
      g,
      'Each group of eight cancels two opposite product errors.',
      'k = 3:   500 × (−1/16) → 512 × (−1/16)     Δ = −0.75      |      k = 7:   −250 × (−1/8) → −256 × (−1/8)     Δ = +0.75',
    );
  else if (b === 1 && s.decoded === 31)
    note(
      g,
      'One term left   ·   −256 × (−0.125) = +32',
      'Add this final term to the decoded prefix above. Compare the result with the original endpoint.',
    );
  else if (b === 1 && s.decoded === 4)
    note(
      g,
      'The fourth product changes   ·   −31.25 → −32',
      'Original 500 and decoded 512 both meet a weight of −1/16. This product changes by −0.75.',
    );
  else if (b === 1 && s.decoded === 8)
    note(
      g,
      'The eighth product changes   ·   +31.25 → +32',
      'Original −250 and decoded −256 both meet a weight of −1/8. This product changes by +0.75.',
    );
  else {
    const count = b === 0 ? s.original : s.decoded;
    const idx = Math.max(0, count - 1);
    const v = b === 0 ? experiment.rows[1][idx] : experiment.block[1][idx].reconstructed;
    const w = b === 0 ? experiment.weights[idx] : experiment.blockWeights[idx];
    note(
      g,
      count
        ? 'Term ' + count + '     ·     ' + short(v) + ' × ' + short(w) + ' = ' + short(v * w)
        : 'Start the sum at zero.',
      'The four repeats use the same signed weight pattern. Each dot shows the last completed prefix.',
    );
  }
}
export const contraction = blockContraction();
export function factors(g, k) {
  base(
    g,
    'Which scale belongs to each partial?',
    'Two contraction blocks  /  exact arithmetic on decoded operands',
  );
  const through = (beat, first, last = first) => {
    if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
    const start = k.wordCue(first).start;
    const end = k.wordCue(last).end;
    return k.reveal(first, end - start, { captionStart: false });
  };
  cue(k, 1, 'That block contributes ten', 0);
  cue(k, 2, 'Twenty-four', 0);
  cue(k, 2, 'That gives twenty-five', 0);
  const firstReady = through(1, 'That block contributes ten') === 1;
  const secondReady = through(2, 'The two scaled contributions') > 0;
  const sumReady = through(2, 'add to thirty-four') === 1;
  const carry = through(2, 'Try taking five outside both blocks');
  const shrink = through(2, 'That gives twenty-five');
  const pullBack = through(2, 'from twenty-four to fifteen') === 1;
  contraction.blocks.forEach(({ x, w, sx, sw }, i) => {
    const xx = 90 + 890 * i;
    const y = 250;
    scope(g, xx, y, 845, 383);
    text(g, 'Block ' + (i + 1), xx + 45, y + 61, 36, C.pale);
    text(g, 'Local scale product', xx + 445, y + 61, 31, C.pale);
    num(g, sx + ' × ' + sw + ' = ' + contraction.products[i],
      xx + 445, y + 138, 47, C.decoded);
    x.forEach((v, j) => {
      rect(g, xx + 45 + j * 168, y + 102, 156, 67, C.teal);
      num(g, v + ' × ' + w[j], xx + 123 + j * 168, y + 148, 43, C.light, 'center');
    });
    const partial = cue(k, 1, i ? 'In the second block' : 'The coded products add', 0) > 0;
    text(g, 'Coded dot', xx + 46, y + 225, 32, C.pale);
    num(g, partial ? contraction.partials[i] : '?', xx + 247, y + 234, 51, C.ref);
    line(g, xx + 45, y + 261, xx + 795, y + 261, C.grid);
    text(g, 'Scaled partial', xx + 46, y + 326, 32, C.pale);
    const local = contraction.products[i];
    const reused = contraction.products[0];
    const terms = contraction.partials[i];
    const ready = i ? secondReady : firstReady;
    let equation = ready ? terms + ' × ' + local + ' = ' + terms * local : '?';
    if (i && carry === 1)
      equation = terms + ' × ' + reused + ' = ' + (pullBack ? terms * reused : '?');
    num(g, equation, xx + 348, y + 338, 53, C.decoded);
  });
  if (carry > 0) {
    const from = 837;
    const to = 1727;
    const x = from + (to - from) * carry;
    const y = 389 - 127 * Math.sin(Math.PI * carry);
    rect(g, x - 29, y - 32, 58, 47, C.decoded);
    num(g, contraction.products[0], x, y + 3, 34, C.ink, 'center');
    if (carry === 1) text(g, 'Copied factor', 1752, 437, 27, C.decoded, { align: 'right' });
  }
  if (!sumReady) {
    text(g, k.beat.beatIndex === 0
      ? 'Can one factor leave the whole sum?'
      : 'What does the second block contribute?', 88, 758, 42, C.ink);
    return;
  }
  const left = 92;
  const unit = 29;
  const first = contraction.partials[0] * contraction.products[0];
  const current = contraction.correct + (contraction.wrong - contraction.correct) * shrink;
  rect(g, left, 715, first * unit, 38, C.teal);
  rect(g, left + first * unit, 715, (current - first) * unit, 38, C.oxide);
  num(g, first, left + first * unit / 2, 743, 26, C.light, 'center');
  if (shrink === 0 || pullBack)
    num(g, (pullBack ? contraction.wrong : contraction.correct) - first,
      left + (first + current) * unit / 2, 743, 26, C.light, 'center');
  if (shrink > 0) line(g, left + contraction.correct * unit, 695,
    left + contraction.correct * unit, 770, C.muted, 3, [7, 6]);
  if (shrink === 0 || shrink === 1)
    num(g, shrink ? contraction.wrong : contraction.correct, left + current * unit + 22, 745, 42, C.ink);
  text(g, carry === 0 ? 'Scale each partial, then add.'
    : shrink === 1 ? 'Only the second block changed.' : 'Try reusing the first factor.',
    88, 808, 33, C.muted);

}

const increment = floatAdds[1] - floatAdds[0];
export const halfProposals = halfAdds.slice(0, -1).map((stored) => stored + increment);
const writeCount = halfProposals.length;

export function additionState(k) {
  const b = k.beat.beatIndex;
  if (b === 0) return { completed16: 0, proposed16: 0, rounding16: 0, completed32: 0 };
  if (b === 1) {
    const roundPhrase = 'Each write returns to the start';
    k.reveal(roundPhrase, 0, { captionStart: roundPhrase });
    const proposeAt = k.wordCue('Each proposed sum').start;
    const roundAt = k.wordCue(roundPhrase).end;
    const replayAt = k.wordCue('Replay those same additions while keeping the sum in FP thirty-two').end;
    const secondsPerWrite = (replayAt - roundAt) / writeCount;
    const holdFraction = 0.6;
    // Hold the first proposal while the voice compares it with both neighbors.
    const cycle = Math.max(0, holdFraction + (k.elapsed - roundAt) / secondsPerWrite);
    const completed16 = Math.min(writeCount, Math.floor(cycle));
    return {
      completed16,
      proposed16: k.elapsed < proposeAt ? 0 : Math.min(writeCount, completed16 + 1),
      rounding16:
        completed16 < writeCount ? Math.max(0, (cycle % 1 - holdFraction) / (1 - holdFraction)) : 0,
      completed32: 0,
    };
  }
  const resultPhrase = 'Four writes reach one thousand twenty-five';
  k.reveal(resultPhrase, 0, { captionStart: resultPhrase });
  const replayAt = k.wordCue('Now each quarter survives').start;
  const resultAt = k.wordCue(resultPhrase).end;
  const progress = Math.max(0, (k.elapsed - replayAt) / (resultAt - replayAt));
  return {
    completed16: writeCount,
    proposed16: writeCount,
    rounding16: 0,
    completed32:
      k.elapsed >= resultAt ? writeCount : Math.min(writeCount - 1, Math.floor(writeCount * progress)),
  };
}

export function accumulators(g, k) {
  const b = k.beat.beatIndex;
  if (b >= 3) {
    base(
      g,
      'Which comparison locates the error?',
      'Spike selector  /  matched reference operation',
    );
    const refs = [
      spikeSelector.original.at(-1),
      spikeSelector.reconstructed.at(-1),
      spikeSelector.reconstructed.at(-1),
    ];
    const names = ['Wide inputs', 'Decoded inputs', 'Example kernel'];
    const show = [1, cue(k, 3, 'Feeding the reconstructed', 0), cue(k, 3, 'Suppose the kernel', 0)];
    refs.forEach((v, i) => {
      const x = 90 + i * 594;
      scope(g, x, 294, 549, 391);
      text(g, names[i], x + 42, 368, 40, C.light);
      if (show[i]) {
        num(g, v, x + 39, 516, 100, i === 0 ? C.ref : C.decoded);
        rect(g, x + 44, 589, v * 0.83, 33, i === 0 ? C.ref : C.decoded);
      }
    });
    note(
      g,
      b === 3
        ? 'Which pair first disagrees?'
        : 'The first difference is already in the decoded operands.',
      b === 3
        ? 'The third value is a hypothetical kernel result for this one fixture.'
        : 'Compare the kernel to the decoded-input reference to look for additional arithmetic or output loss.',
    );
    return;
  }
  base(
    g,
    'Can four quarter-steps move this sum?',
    'Accumulation  /  round to nearest after every add',
  );
  const { completed16, proposed16, rounding16, completed32 } = additionState(k);
  const start = halfAdds[0],
    fp16Spacing = 2 ** (Math.floor(Math.log2(start)) - 10),
    upper = start + fp16Spacing,
    halfway = (start + upper) / 2;
  const x = (i) => 225 + 236 * i,
    y = (v) => 676 - ((v - start) / (upper - start)) * 317;
  scope(g, 85, 255, 1215, 507);
  const replay = b === 2;
  text(g, replay ? 'FP32 replay on the same scale' : 'Adjacent FP16 values', 222, 317, 31, C.light);
  for (const v of replay ? floatAdds : [start, halfway, upper]) {
    const endpoint = v === start || v === upper;
    line(
      g,
      222,
      y(v),
      1200,
      y(v),
      endpoint || v === halfway ? C.pale : C.grid,
      endpoint ? 3 : 2,
      endpoint ? [] : [10, 8],
    );
    num(g, short(v), 210, y(v) + 9, 26, C.pale, 'right');
  }
  text(g, 'FP16 halfway', 1200, y(halfway) - 15, 30, C.pale, { align: 'right' });
  for (let j = 0; j <= writeCount; j++) {
    num(g, j, x(j), 717, 28, C.pale, 'center');
  }
  text(g, 'Write number', 697, 748, 27, C.pale, { align: 'center' });
  for (let j = 1; j <= proposed16; j++) {
    const proposal = halfProposals[j - 1];
    const active = j > completed16;
    opacity(g, active ? 1 : replay ? 0.35 : 0.65, () => {
      const xx = x(j),
        exact = y(proposal),
        stored = y(halfAdds[j]),
        marker = exact + (stored - exact) * rounding16;
      if (!active || marker > exact + 12)
        line(g, xx, exact + 12, xx, active ? marker : stored, C.decoded, 3, [7, 6]);
      g.beginPath();
      g.arc(xx, exact, 11, 0, 2 * Math.PI);
      g.strokeStyle = C.decoded;
      g.lineWidth = 4;
      g.stroke();
      if (active && rounding16 > 0) dot(g, xx, marker, 8, C.decoded);
    });
  }
  for (const [values, count, col] of [
    [halfAdds, completed16, C.decoded],
    [floatAdds, completed32, C.ref],
  ]) {
    if (values === floatAdds && b < 2) continue;
    for (let j = 0; j <= count; j++) {
      if (j) line(g, x(j - 1), y(values[j - 1]), x(j), y(values[j]), col, 6);
      dot(g, x(j), y(values[j]), 10, col);
    }
  }
  text(g, 'FP16  ·  writes completed   ' + completed16, 1344, 339, 33, C.muted);
  num(g, halfAdds[completed16], 1340, 442, 79, C.oxide);
  if (b === 2) {
    text(g, 'FP32  ·  writes completed   ' + completed32, 1344, 543, 33, C.muted);
    num(g, short(floatAdds[completed32]), 1340, 635, 66, C.teal);
  } else if (proposed16) {
    const previous = halfAdds[proposed16 - 1];
    text(g, 'Before rounding', 1344, 534, 33, C.muted);
    num(g, short(previous) + ' + ' + short(increment), 1340, 592, 44, C.oxide);
    num(g, '= ' + short(halfProposals[proposed16 - 1]), 1340, 659, 55, C.oxide);
  }
  note(
    g,
    b === 2
      ? completed32 === writeCount
        ? 'The finer accumulator retains all four quarters.'
        : 'Replay the same four additions in FP32.'
      : proposed16
        ? completed16
          ? 'Each addition starts again from the stored sum.'
          : 'The proposed sum is below the halfway line.'
        : 'At ' + short(start) + ', the next larger FP16 value is ' + short(upper) + '.',
    proposed16 && !replay
      ? 'Hollow circles show sums before rounding. Filled dots show stored values.'
      : 'Each write adds ' + short(increment) + ' to the previous stored sum.',
  );
}
