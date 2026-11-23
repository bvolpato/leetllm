import { firstFrameAt, fps } from '../../../director-cuts/lesson-runtime/timeline.mjs';
import { C, after, proofLine } from './printshop.mjs';
import {
  micro,
  avg,
  sum,
  distributed,
  probe,
  canRead,
  maskForJoin,
  ignored,
  sftExposure,
  rateAt,
  firstAdamStep,
} from './examples.mjs';

function matrix(p, x, y, rows, cols, step, color) {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) p.box(x + c * step, y + r * step, step - 5, step - 5, color, 3);
}
export function surface(p, k) {
  const b = k.beat.beatIndex;
  if (!b) {
    p.heading('Training evidence', 'What should the model learn?');
    p.rows(
      [
        ['Domain vocabulary is unfamiliar', 'Read domain text'],
        ['Known policy, wrong procedure', 'Imitate approved replies'],
        ['Several acceptable answers', 'Learn from rankings'],
      ],
      135,
      326,
      1640,
      153,
    );
    p.txt('T102   /   open a rotation ticket for security review.', 143, 931, 48, C.mint, 'Serif');
    return;
  }
  const adapter = after(k, 1, 'With LoRA'),
    quant = b < 4 && after(k, 2, 'With QLoRA');
  p.heading(
    'Same response targets   /   open · ticket · END',
    quant ? 'QLoRA' : adapter ? 'LoRA' : 'Full fine-tuning',
  );
  const step = quant ? 43 : 53;
  matrix(p, 165, 370, 6, 8, step, adapter ? C.blue : C.mint);
  p.txt(adapter ? 'Frozen base' : 'Trainable weights', 162, 786, 48, adapter ? C.blue : C.mint, 'Serif');
  if (quant) p.note('Stored in 4 bits', 163, 848);
  if (adapter) {
    p.number('+', 655, 583, 69, C.cream);
    matrix(p, 836, 370, 6, 2, 53, C.mint);
    p.number('×', 1032, 583, 69, C.cream);
    matrix(p, 1160, 370, 2, 8, 53, C.mint);
    p.txt('B', 841, 785, 54, C.mint, 'Serif');
    p.txt('A', 1160, 785, 54, C.mint, 'Serif');
    p.note('Low-rank update   /   rank 2 in this drawing', 835, 848);
  }
  if (b === 3)
    p.note(
      'NF4 base → dequantize for computation     •     adapter and compute precision are separate choices',
      133,
      977,
    );
  if (b === 4)
    p.note(
      'LoRA study   /   GPT-3 175B   /   up to 10,000× fewer trainable parameters, 3× lower GPU memory',
      133,
      977,
    );
}
export function join(p, k) {
  const b = k.beat.beatIndex;
  const packed = after(k, 0, 'Slide B', 1.45);
  const reading = after(k, 1, 'Trace its allowed reads');
  const shifted = after(k, 2, 'Follow its scores');
  const fixed = after(k, 3, 'Mask the label');
  const startX = 141,
    dx = 273,
    top = 355;
  p.heading(
    'Two independent incidents',
    b === 0
      ? 'Fit six tokens into one block'
      : b === 1
        ? 'What can B’s answer read?'
        : 'What does the end of A predict?',
  );
  const words = ['prompt', 'answer', 'END'];
  function token(x, y, v, n, fill) {
    p.box(x, y, dx - 7, 119, fill, 5);
    p.note(n, x + 15, y + 34, C.ink);
    p.txt(v, x + dx / 2, y + 88, 47, C.ink, 'Serif', 'center');
  }
  if (packed < 1) {
    for (let j = 3; j < 6; j++) {
      p.box(startX + j * dx, top, dx - 7, 119, C.slate, 5);
      if (packed === 0) p.note('empty', startX + j * dx + 73, top + 72);
      if (packed === 0) p.box(startX + j * dx, top + 248, dx - 7, 119, C.slate, 5);
    }
  }
  const across = Math.min(1, 2 * packed);
  const up = Math.max(0, 2 * packed - 1);
  words.forEach((v, j) => {
    token(startX + j * dx, top, v, 'A  /  ' + j, C.paper);
    token(startX + (j + 3 * across) * dx, top + 248 * (1 - up), v, 'B  /  ' + j, C.blue);
  });
  const center = (i) => startX + (i + 0.5) * dx;
  if (packed === 1) {
    p.line(startX + 3 * dx - 3, top - 60, startX + 3 * dx - 3, top + 146, C.gold, 4, [8, 8]);
    p.note('join', startX + 3 * dx + 17, top - 24, C.gold);
  }
  if (b === 0) {
    if (packed === 1) proofLine(p, 'Packed block', '6 real positions   /   0 padding positions', 824);
    return;
  }

  if (reading) {
    const y = 628;
    p.line(center(4), top + 120, center(4), y, C.mint, 5);
    for (let j = 0; j < 6; j++)
      if (canRead(4, j)) {
        p.line(center(4), y, center(j) - 26, y, C.mint, 5);
        p.arrow(center(j) - 26, y, center(j) - 26, top + 128, C.mint, 5);
      }
    p.note('B answer reads within B', center(3) + 52, 694, C.mint);
  }
  if (b >= 2) {
    const labels = maskForJoin(fixed),
      x1 = center(2),
      x2 = center(3);
    p.note('Shifted loss at the join', 143, 753);
    if (shifted) {
      p.rail(
        labels.map((v) => (v === ignored ? '−100' : v)),
        {
          x: startX,
          w: dx * 6,
          y: 797,
          h: 101,
          colors: labels.map((v, i) => (v === ignored ? '#a4b6ac' : i === 3 ? C.coral : C.mint)),
          fontsize: 39,
        },
      );
      if (!fixed) p.arrow(x1, top + 128, x2 - 6, 780, C.coral, 7);
      p.note(
        fixed ? 'Ignored target at B’s start' : 'Global shift crosses into B',
        x2 - 116,
        974,
        fixed ? C.mint : C.coral,
      );
    }
  }
}
function meanSpoken(k, beat, phrase, markCaption = false) {
  if (k.beat.beatIndex !== beat) return k.beat.beatIndex > beat;
  if (markCaption) k.reveal(phrase, 0, { captionStart: phrase });
  return k.elapsed >= firstFrameAt(k.wordCue(phrase).end) / fps;
}

export function perturb(p, k) {
  const b = k.beat.beatIndex;
  const addition = 100;
  const animate = after(k, 3, 'Make the change', 0.65);
  const proposing = after(k, 2, 'Suppose we add one hundred');
  const before = probe(0);
  const current = animate === 1 ? probe(addition) : before;
  const query = 4;
  const x = 404,
    w = 1044,
    joinX = x + w / 2;
  p.heading('Packed attention   /   zero queries and keys', 'Change A and read B again');
  p.note('A   /   synthetic T102', x, 261);
  p.note('B   /   synthetic R550', joinX + 15, 261, C.blue);
  const xs = p.rail(current.values, {
    x,
    w,
    y: 337,
    h: 90,
    colors: [C.paper, C.paper, C.paper, C.blue, C.blue, C.blue],
    indices: current.values.map((_, i) => i),
    fontsize: 56,
  });
  p.line(joinX, 278, joinX, 804, C.gold, 3, [8, 8]);
  p.poly(
    [
      [xs[query] - 10, 456],
      [xs[query] + 10, 456],
      [xs[query], 441],
    ],
    C.gold,
  );
  p.txt('query ' + query, xs[query], 491, 32, C.gold, 'Sans', 'center');
  if (proposing && animate < 1) {
    p.ctx.save();
    p.ctx.globalAlpha = 1 - animate;
    for (const center of xs.slice(0, 3))
      p.number('+' + addition, center, 490 - 34 * animate, 37, C.gold, 'center');
    p.ctx.restore();
  }

  function meanLane(y, name, isolated, count, previous, result, baselineSpoken, changedSpoken) {
    p.txt(name, 131, y + 34, 37);
    p.note(count + ' reads', 131, y + 80);
    xs.forEach((center, i) => {
      const reads = canRead(query, i, isolated);
      p.box(center - 67, y, 134, 83, reads ? (i < 3 ? C.paper : C.blue) : C.slate, 5);
      p.number(reads ? current.values[i] : '·', center, y + 56, 43, reads ? C.ink : C.faint, 'center');
    });
    const showMean = proposing ? animate === 1 && changedSpoken : baselineSpoken;
    p.number(
      showMean ? result.toFixed(1) : '?',
      1664,
      y + 60,
      61,
      showMean ? C.mint : C.faint,
      'center',
    );
    if (proposing)
      p.txt('Before  ' + previous.toFixed(1), 1664, y + 109, 30, C.faint, 'Sans', 'center');
  }

  if (after(k, 1, 'The isolated path')) {
    p.txt(proposing ? 'Mean after +100' : 'Mean of reads', 1664, 490, 34, C.cream, 'Sans', 'center');
    meanLane(
      530,
      'Block-causal',
      true,
      current.isolated.length,
      before.localMean,
      current.localMean,
      meanSpoken(k, 1, 'giving fifteen'),
      meanSpoken(k, 3, 'fifteen', true),
    );
  }
  if (after(k, 1, 'The global path')) {
    meanLane(
      693,
      'Global causal',
      false,
      current.global.length,
      before.globalMean,
      current.globalMean,
      meanSpoken(k, 1, 'giving seven point two'),
      meanSpoken(k, 3, 'sixty-seven point two', true),
    );
  }
  if (b === 3 && after(k, 3, 'Run this perturbation')) {
    const increase = sum(current.global) - sum(before.global);
    p.note('Global mean change', 131, 893);
    p.number(
      '+' + increase + ' / ' + current.global.length + ' = +' + (increase / current.global.length),
      x,
      896,
      47,
      C.gold,
    );
  }
  if (b === 4)
    p.note(
      'Reset positions + supported eager/SDPA path, no supplied mask, cache off. Check segment starts too.',
      131,
      893,
    );
  if (b === 5)
    p.note(
      'Inspect overflow   /   truncation, split prompt and reply, or lost segment boundaries',
      131,
      893,
    );
}
function votes(p, x, portionA) {
  const width = 710;
  const boundary = width * portionA;
  p.box(x, 769, width, 23, C.mint, 4);
  p.box(x, 769, boundary, 23, C.gold, 4);
  p.note('A ' + Math.round(100 * portionA) + '%', x, 834, C.gold);
  p.txt('B ' + Math.round(100 * (1 - portionA)) + '%', x + width, 834, 32, C.mint, 'Sans', 'right');
}

export function batch(p, k) {
  const dividing = after(k, 1, 'Divide by ten');
  const compare = after(k, 1, 'Averaging the two batch means');
  const partial = after(k, 2, 'If the window ends') && meanSpoken(k, 2, 'first microbatch');
  const empty = after(k, 2, 'If the window has zero') && meanSpoken(k, 2, 'zero targets');
  const lossA = meanSpoken(k, 0, 'loss four');
  const lossB = meanSpoken(k, 0, 'loss one each');
  const denominator = meanSpoken(k, 1, 'Divide by ten');
  const lossSums = meanSpoken(k, 1, 'four and nine');
  const tokenMean = meanSpoken(k, 1, 'one point three');
  const batchMean = meanSpoken(k, 1, 'two point five');
  const partialMean = meanSpoken(k, 2, 'one actual target');
  const skip = meanSpoken(k, 2, 'skip or reject the update');
  const equalVotes = meanSpoken(k, 1, 'as much weight as the other nine');
  const all = empty ? [] : partial ? micro[0] : micro.flat();

  p.heading('One optimizer update', 'Who gets a vote in the mean?');
  micro.forEach((group, row) => {
    const y = 313 + row * 149;
    const shown = row ? lossB : lossA;
    const active = !empty && (!row || !partial);
    const color = row ? C.mint : C.gold;
    p.note('Microbatch ' + (row ? 'B' : 'A'), 128, y + 9, color);
    if (shown) p.note(group.length + (group.length === 1 ? ' target' : ' targets'), 128, y + 52);
    group.forEach((loss, j) => {
      if (!shown) return;
      const x = 440 + 137 * j;
      p.dot(x, y, 49, active ? color : C.slate);
      p.number(loss, x, y + 15, 44, active ? C.ink : C.faint, 'center');
    });
    if (lossSums && active) p.number('sum ' + sum(group), 1830, y + 10, 40, color, 'right');
  });

  const left = 128;
  const right = 1012;
  p.line(128, 551, 1830, 551);
  p.note('Every target counts equally', left, 606, C.mint);
  if (!dividing) {
    p.number('Combined loss / ?', left, 716, 60);
    return;
  }
  if (empty) {
    p.number('0 active targets', left, 712, 58);
    if (skip) p.note('Skip or reject before dividing.', left, 820, C.coral);
    return;
  }
  const numerator = lossSums ? sum(all) : '?';
  const count = denominator ? all.length : '?';
  const current = partial ? partialMean : tokenMean;
  p.number(numerator + ' / ' + count + (current ? ' = ' + avg(all) : ''), left, 713, 61);
  if (current) votes(p, left, micro[0].length / all.length);
  if (!partial && compare) {
    p.note('Every microbatch counts equally', right, 606, C.gold);
    const means = micro.map(avg);
    p.number(
      '(' + means.join(' + ') + ') / ' + means.length + (batchMean ? ' = ' + avg(means) : ''),
      right,
      713,
      61,
    );
    if (equalVotes) votes(p, right, 1 / micro.length);
  }
}
export function budget(p, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    const next = after(k, 1, 'Now halve'),
      batch = next ? 2 : 4,
      acc = next ? 16 : 8,
      workers = next ? 8 : 4;
    const exp = sftExposure(batch, acc, workers, 1560);
    p.heading('Loader items in a full update', 'How much work reaches the optimizer?');
    p.note('Each vertical strip is one worker', 142, 321);
    for (let i = 0; i < workers; i++) {
      const x = 147 + i * 206;
      for (let j = 0; j < acc; j++) p.box(x, 389 + j * (294 / acc), 156, 294 / acc - 5, C.blue, 2);
      p.number('W' + (i + 1), x + 78, 739, 34, C.faint, 'center');
    }
    p.number(
      batch + ' items × ' + acc + ' microbatches × ' + workers + ' workers = ' + exp.items,
      142,
      870,
      53,
      C.mint,
    );
    p.note(
      next
        ? 'Previously 128 items per update. Count original examples inside packed items.'
        : 'At 1,560 scored targets per worker, four workers contribute 6,240 targets.',
      143,
      958,
    );
    return;
  }
  p.heading('Distributed gradient averaging', 'Where does the extra divisor enter?');
  const grads = [2, 4],
    count = 4,
    s = distributed(grads, count);
  grads.forEach((g, i) => {
    const x = 149 + 838 * i;
    p.sheet(x, 318, 739, 254, i ? C.blue : C.paper);
    p.note('WORKER ' + (i + 1) + '   /   GLOBAL COUNT ' + count, x + 39, 389, C.ink);
    p.number(g + ' / ' + count + ' = ' + s.shares[i], x + 39, 501, 67, C.ink);
  });
  p.arrow(520, 596, 805, 690);
  p.arrow(1355, 596, 1115, 690);
  p.number('DDP mean   (0.5 + 1) / 2 = ' + s.reduced, 960, 783, 55, C.cream, 'center');
  if (after(k, 3, 'Multiply by the worker count'))
    p.number('Compensate once   ' + s.reduced + ' × 2 = ' + s.corrected, 960, 926, 55, C.mint, 'center');
}
export function recipe(p, k) {
  const b = k.beat.beatIndex;
  if (!b) {
    p.heading('Matched target exposure', 'What changes between these runs?');
    p.rows(
      [
        ['Data, template and trainable modules', 'fixed'],
        ['Grader and scored target budget', 'fixed'],
        ['Candidate adapter learning rate', '0.0001'],
      ],
      130,
      321,
      1660,
      134,
    );
    p.note('Record the schedule, clipping, weight decay, precision and updates.', 137, 876);
    return;
  }
  if (b === 3) {
    p.heading('AdamW   /   first scalar step', 'What does clipping actually limit?');
    const clipped = after(k, 3, 'Clip the gradient');
    const stepped = after(k, 3, 'The bias-corrected moments');
    const step = firstAdamStep(2, clipped ? 1 : Infinity, 0.1);
    p.note('Learning rate 0.1   /   zero weight decay   /   moments start at zero', 140, 315);
    p.note('Gradient norm', 146, 463);
    p.box(583, 407, 422 * step.g, 69, C.blue);
    p.number(step.g, 616 + 422 * step.g, 464, 55, C.blue);
    if (stepped) {
      proofLine(p, 'Corrected moments', 'first = ' + step.g + '     second = ' + step.square, 680);
      proofLine(p, 'Update magnitude', '0.1 × 1 / (√1 + ε) ≈ ' + step.change.toFixed(1), 849);
    }
    return;
  }
  p.heading('InstructGPT supervised baseline', 'Follow the rate across 16 epochs');
  const left = 232,
    right = 1696,
    base = 779,
    amp = 407;
  const X = (i) => left + ((right - left) * i) / 16,
    Y = (v) => base - v * amp;
  for (const v of [0, 0.1, 0.5, 1]) {
    p.line(left, Y(v), right, Y(v), C.line, 2, [6, 9]);
    p.number(Math.round(v * 100) + '%', left - 24, Y(v) + 10, 28, C.faint, 'right');
  }
  const position = 16 * after(k, 1, 'This run used sixteen epochs', 1.55);
  function plot(end, floor, color) {
    let previous = [X(0), Y(rateAt(0, floor))];
    for (let j = 1; j <= 80; j++) {
      const e = (end * j) / 80,
        point = [X(e), Y(rateAt(e, floor))];
      p.line(...previous, ...point, color, 6);
      previous = point;
    }
    p.dot(...previous, 10, color);
  }
  plot(position, 0.1, C.gold);
  if (after(k, 1, 'A standard cosine schedule')) plot(16, 0, C.blue);
  p.note('Initial rate', left, 306);
  p.note('0', left - 10, 835);
  p.note('16 epochs', right - 98, 835);
  p.note('Baseline   /   no warmup, 10% floor', 238, 908, C.gold);
  if (after(k, 1, 'A standard cosine schedule'))
    p.note('Comparison   /   zero floor', 1094, 908, C.blue);
  if (b === 2)
    p.note('Warmup adjusts step size. Adam corrects its moment estimates separately.', 236, 992);
}
