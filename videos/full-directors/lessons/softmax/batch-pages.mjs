import { LOGITS, PROBS, FRESH_LOGITS } from '../../../films/softmax/fixtures.mjs';
import {
  lossTrace,
  positionReduction,
  crossEntropy,
} from '../../../films/softmax/arithmetic.mjs';
import { illustration } from './dog-art.mjs';
import { completeModel } from '../../../films/softmax/model.mjs';
import {
  ink,
  muted,
  paper,
  rule,
  fill,
  dye,
  gold,
  words,
  mono,
  serif,
  sans,
  fmt,
  pct,
  mix,
  cue,
  spoken,
  box,
  line,
  dot,
  txt,
  label,
  number,
  heading,
  strip,
  wordsKey,
  lanes,
  table,
  arrow,
  fraction,
} from './print.mjs';

const model = completeModel();
const tokens = ['bug', 'docs', 'today'];
const scoreRows = [LOGITS, FRESH_LOGITS];
export function alignedLosses(shifted) {
  return scoreRows.map((z, i) => lossTrace(z, shifted ? i : i + 1));
}
export function trainingTape(c, k) {
  heading(c, 'Which word did each row score?');
  const shift = cue(k, 4, 'Slide the targets back', 1.45) - cue(k, 5, 'Put the targets back', 1.45);
  const current = shift === 1,
    losses = alignedLosses(current).map((v) => v.loss);
  const sum = losses[0] + losses[1],
    x = 291,
    spacing = 363;
  label(c, 'Printed text', 99, 209);
  tokens.forEach((w, i) => {
    const xx = x + spacing * i;
    box(c, xx, 167, 256, 90, fill[i]);
    txt(c, w, xx + 128, 210, 47, ink, serif, 'center');
  });
  const b = k.beat.beatIndex;
  if (b === 6) {
    const masks = cue(k, 6, 'A causal mask', 0.65) > 0.5;
    ['after bug', 'after bug docs'].forEach((s, i) => {
      const yy = 349 + i * 153;
      txt(c, s, 88, yy + 42, 31, ink, serif);
      tokens.forEach((w, j) => {
        const xx = x + spacing * j,
          visible = j <= i,
          destination = j === i + 2;
        box(
          c,
          xx,
          yy,
          256,
          84,
          masks ? (visible ? fill[j] : '#e6e4db') : destination ? fill[j] : '#e6e4db',
        );
        txt(
          c,
          masks ? (visible ? 'can read' : 'future') : destination ? 'target' : '·',
          xx + 128,
          yy + 42,
          31,
          ink,
          serif,
          'center',
        );
      });
    });
    txt(
      c,
      masks
        ? 'A causal mask hides the future. A loss mask selects the scored positions.'
        : 'A second shift sends the first row to today. The second row runs out of text.',
      105,
      704,
      36,
      ink,
      serif,
      'left',
      1378,
    );
    return;
  }
  if (b >= 2) {
    const comparingRows = current && !spoken(k, 5, 'two point three zero six');
    const showRowAnswer = comparingRows && spoken(k, 5, 'second row', { captionStart: false });
    scoreRows.forEach((row, i) => {
      const yy = 319 + i * 160,
        target = i + Number(!current);
      txt(c, i ? 'after bug docs' : 'after bug', 88, yy + 50, 32, ink, serif);
      row.forEach((z, j) => {
        const xx = x + spacing * j;
        box(c, xx, yy, 256, 107, '#eae9df');
        number(c, fmt(z, z % 1 ? 1 : 0), xx + 21, yy + 30, 33);
        const p = lossTrace(row, j).probabilities[j];
        box(c, xx + 18, yy + 65, p * 119, 20, fill[j]);
        number(c, pct(p), xx + 149, yy + 76, 24, dye[j]);
      });
      const at = x + spacing * (i + 1 - shift);
      c.strokeStyle = shift > 0 && shift < 1 ? gold : dye[target];
      c.lineWidth = showRowAnswer && i === 1 ? 10 : 4;
      c.strokeRect(at, yy, 256, 107);
      const settled = shift === 0 || current;
      const firstPair = spoken(k, 2, i === 0 ? 'two point one seven' : 'point three zero six');
      const shiftedCost = spoken(k, 5, i === 0 ? 'point one seven' : 'two point three zero six');
      const showCost = settled && (current ? shiftedCost : firstPair);
      number(c, showCost ? fmt(losses[i]) : '?', 1311, yy + 45, 37);
      label(c, 'nats', 1312, yy + 86);
    });
    if (b === 2)
      label(
        c,
        'Each cell shows its score and probability. The outline selects the observed word.',
        104,
        705,
      );
    else if (comparingRows) {
      const prompt = showRowAnswer
        ? 'The second row carries the larger loss.'
        : 'Which row carries the larger loss?';
      txt(c, prompt, 105, 699, 41, ink, serif);
    } else if (shift === 0 || current) {
      if (current ? spoken(k, 5, 'two point three zero six') : spoken(k, 3, 'Nearly eighty-eight')) {
        label(c, 'Share of total loss', 103, 654);
        strip(c, 102, 692, 705, 44, losses.map((v) => v / sum),
          current ? [fill[0], fill[1]] : [fill[1], fill[2]]);
      }
      if (current ? spoken(k, 5, 'one point two three eight') : spoken(k, 3, 'one point two four'))
        number(c, 'mean  ' + fmt(sum / 2), 1000, 708, 43);
    }
    return;
  }
  // Each target locator follows its word on the same strip as the observed history.
  for (let i = 0; i < 2; i++) {
    const y = 371 + i * 151,
      xx = x + spacing * (i + 1 - shift) + 128;
    const target = i + Number(!current);
    line(c, xx, 266, xx, y - 39, dye[target], 3, [6, 5]);
    box(c, xx - 86, y - 40, 172, 70, paper);
    c.strokeStyle = dye[target];
    c.lineWidth = 3;
    c.strokeRect(xx - 86, y - 40, 172, 70);
    txt(c, tokens[target], xx, y - 4, 37, dye[target], serif, 'center');
    txt(c, i ? 'after bug docs' : 'after bug', 99, y - 6, 34, ink, serif);
  }
  txt(
    c,
    b
      ? 'Teacher forcing uses the observed history.'
      : 'At each position, use the words already on the page.',
    103,
    698,
    38,
    ink,
    serif,
  );
}
function notch(c, x, y, w, h, color) {
  box(c, x, y, w, h, color);
  for (let j = 15; j < w - 8; j += 28) {
    dot(c, x + j, y, 4, paper);
    dot(c, x + j, y + h, 4, paper);
  }
}
export function ignored(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0 || b === 3) {
    heading(c, b ? 'What if every position is ignored?' : 'Count the words that were scored');
    const blank = b === 3;
    const change = cue(k, 0, 'Change the ignored', 1);
    const z = [mix(100, -50, change), mix(-100, 80, change), mix(0, 20, change)];
    const r = positionReduction([...scoreRows, z], blank ? [-100, -100, -100] : [1, 2, -100]);
    const values = r.losses;
    for (let i = 0; i < 3; i++) {
      const x = 105 + 468 * i,
        skip = blank || i === 2;
      notch(c, x, 218, 420, 254, skip ? '#e3dfd4' : fill[i]);
      label(c, 'Position ' + (i + 1), x + 23, 260);
      txt(c, skip ? 'ignore_index' : tokens[i + 1], x + 22, 339, 44, ink, serif);
      number(c, skip ? 'target −100' : fmt(values[i]) + ' nats', x + 24, 414, 31);
    }
    if (blank || spoken(k, 0, 'two point four seven six'))
      number(c, 'sum   ' + fmt(r.numerator), 114, 565, 40);
    if (blank || spoken(k, 0, 'Two words were scored'))
      number(c, 'count   ' + r.count, 641, 565, 40);
    if (blank ? spoken(k, 3, 'returns NaN') : spoken(k, 0, 'divide by two'))
      number(c, blank ? 'mean   NaN' : 'mean   ' + fmt(r.mean), 1080, 565, 40);
    if (blank)
      txt(
        c,
        cue(k, 3, 'skip an empty update', 0.55) > 0.5
          ? 'Skip the optimizer update.'
          : 'No supervised targets.',
        106,
        711,
        48,
        gold,
        serif,
      );
    else number(c, 'ignored scores   [' + z.map((v) => fmt(v, 0)).join(', ') + ']', 105, 711, 35);
    return;
  }
  heading(c, b === 1 ? 'Pool the four scored words' : 'Give the two sequences equal weight');
  const groups = [[2], [0, 0, 0]],
    pooled = groups.flat(),
    total = pooled.reduce((a, b) => a + b);
  groups.forEach((g, i) => {
    const y = 248 + i * 174;
    txt(c, i ? 'Sequence B' : 'Sequence A', 102, y + 53, 40, ink, serif);
    g.forEach((v, j) => {
      notch(c, 440 + j * 201, y, 167, 106, fill[i]);
      number(c, v, 522 + j * 201, y + 56, 50, ink, 'center');
    });
    if (spoken(k, 2, 'means are two and zero'))
      number(c, 'mean ' + fmt(g.reduce((a, b) => a + b) / g.length, 0), 1122, y + 54, 39);
  });
  if (b === 1 && spoken(k, 1, 'one half'))
    number(
      c,
      'Pooled mean   ' + total + ' / ' + pooled.length + ' = ' + fmt(total / pooled.length, 1),
      106,
      684,
      44,
    );
  else if (spoken(k, 2, 'gives one')) number(c, 'Mean of sequences   (2 + 0) / 2 = 1', 106, 684, 44);
}
export function candidate(c, k) {
  const b = k.beat.beatIndex;
  heading(c, 'Can the model still predict padding?');
  const excluded = cue(k, 2, 'Set its score', 0.45) > 0.5,
    v = excluded ? model.excluded : model.pad;
  label(c, 'Observed word   docs', 110, 184);
  label(c, 'ignore_index = 2', 1070, 184);
  const names = ['bug', 'docs', 'padding'];
  lanes(c, v.probabilities, { x: 287, y: 265, w: 655, step: 109, names, n: 2 });
  label(c, 'Padding score', 1130, 261);
  number(c, excluded ? '−∞' : '10', 1130, 321, 51);
  label(c, b === 3 ? 'Loss with smoothing' : 'Hard-target loss', 1130, 436);
  const lossKnown = b === 3 ? spoken(k, 3, 'loss is infinite') :
    excluded ? spoken(k, 2, 'point three one three') : spoken(k, 1, 'about nine');
  number(c, lossKnown ? (b === 3 ? '∞' : fmt(v.loss)) : '?', 1130, 502, 51);
  if (b === 3) {
    if (spoken(k, 3, 'padding gets some target weight'))
      label(c, 'target weight > 0', 287, 559);
    const types = ['Attention mask', 'Target mask', 'Candidate mask'],
      effects = ['Words a position reads', 'Positions in the loss', 'Words it can predict'],
      phrases = ['An attention mask', 'A target mask', 'A candidate mask'];
    types.forEach((name, i) => {
      if (!spoken(k, 3, phrases[i])) return;
      const x = 105 + 482 * i;
      label(c, name, x, 661);
      txt(c, effects[i], x, 720, 34, ink, serif);
    });
  } else if (b === 1 && spoken(k, 1, 'almost one'))
    number(c, 'Gradient on padding   +' + fmt(v.probabilities[2], 6), 105, 698, 39);
  else
    txt(
      c,
      excluded
        ? 'The vocabulary mask removes one candidate.'
        : 'This position counts because its target is class 1.',
      105,
      698,
      40,
      ink,
      serif,
    );
}
export const weighted = (weights, losses) => {
  const numerator = losses.reduce((s, v, i) => s + v * weights[i], 0);
  const weightSum = weights.reduce((s, v) => s + v, 0);
  return {
    numerator,
    weightSum,
    count: weights.length,
    integer: numerator / weightSum,
    float: numerator / weights.length,
  };
};
export function weighting(c, k) {
  const b = k.beat.beatIndex;
  heading(c, 'What goes below the fraction bar?');
  const weights = [2, 4],
    losses = [Math.log(2), Math.log(2)],
    v = weighted(weights, losses);
  label(c, 'Two uniform predictions', 106, 198);
  weights.forEach((wt, i) => {
    const x = 116 + 731 * i;
    txt(c, 'Position ' + (i + 1), x, 267, 40, ink, serif);
    strip(c, x, 325, 545, 55, [0.5, 0.5]);
    line(c, x + (0.25 + 0.5 * i) * 545, 385, x + (0.25 + 0.5 * i) * 545, 412, dye[i], 3);
    number(c, 'class ' + i + '   weight ' + wt, x, 453, 30);
  });
  line(c, 104, 515, 1480, 515);
  if (b === 1) {
    txt(c, 'Same labels. Write them as float one-hot rows.', 112, 608, 42, ink, serif);
    number(c, '[1, 0]              [0, 1]', 114, 712, 39);
    return;
  }
  const pooling = b === 4;
  const labelY = pooling ? 542 : 572;
  const fractionY = pooling ? 633 : 676;
  label(c, 'Integer target', 112, labelY);
  label(c, 'Float one-hot', 848, labelY);
  fraction(
    c,
    325,
    fractionY,
    spoken(k, 2, 'six times natural log two') ? '6 × ln(2)' : 'weighted sum',
    b >= 2 ? String(v.weightSum) : 'sum of weights',
    344,
  );
  fraction(
    c,
    1051,
    fractionY,
    spoken(k, 2, 'six times natural log two') ? '6 × ln(2)' : 'weighted sum',
    b >= 2 ? String(v.count) : 'positions',
    344,
  );
  if (spoken(k, 3, 'natural log two'))
    number(c, '≈ ' + fmt(v.integer), 534, fractionY + 1, 36);
  if (spoken(k, 3, 'three times natural log two'))
    number(c, '≈ ' + fmt(v.float), 1262, fractionY + 1, 36);
  if (pooling) {
    txt(c, 'Pool integer labels across shards', 110, 718, 27, muted, serif);
    number(c, '(2 × ln 2 + 4 × ln 2) / (2 + 4)', 700, 718, 31);
  }
}
export function tiles(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    heading(c, 'How much memory do the logits occupy?');
    const x = 152,
      y = 276,
      w = 809,
      h = 300;
    for (let s = 4; s >= 0; s--) {
      box(c, x + s * 15, y - s * 15, w, h, s ? '#9caeae' : '#bcd1c8');
      c.strokeStyle = muted;
      c.lineWidth = 2;
      c.strokeRect(x + s * 15, y - s * 15, w, h);
    }
    for (let i = 1; i < 20; i++)
      line(c, x + (w * i) / 20, y, x + (w * i) / 20, y + h, '#92a79d', 1);
    for (let i = 1; i < 8; i++) line(c, x, y + (h * i) / 8, x + w, y + (h * i) / 8, '#92a79d', 1);
    label(c, '128,256 vocabulary entries', x, 631);
    label(c, '4,096 positions per sequence', 1038, 312);
    label(c, '16 sequences', 1038, 370);
    label(c, '4 bytes per logit', 1038, 432);
    if (spoken(k, 1, 'thirty-one point three one')) {
      number(c, fmt(model.bytes / 2 ** 30, 2) + ' GiB', 1030, 550, 58);
      label(c, 'For the logits alone', 1038, 620);
    }
    return;
  }
  if (b >= 5) {
    heading(
      c,
      b === 5 ? 'Project one vocabulary tile at a time' : 'Check the complete training step',
    );
    const states = model.tiles;
    const second = cue(k, 5, 'without storing', 1) > 0.5;
    const tile = states[Number(second)],
      x = 117;
    label(c, 'One hidden state', x, 250);
    for (let j = 0; j < 6; j++) box(c, x + j * 28, 302, 22, 115, '#a7c3bd');
    arrow(c, 315, 356, 500, 356);
    label(c, 'Output projection', 555, 250);
    notch(c, 549, 302, 367, 115, second ? '#ddd2ad' : '#bcd6cf');
    number(c, '[' + tile.values.join(', ') + ']', 733, 362, 45, ink, 'center');
    arrow(c, 958, 356, 1096, 356);
    label(c, 'Retained for the row', 1140, 252);
    number(c, 'max   ' + tile.maximum, 1140, 330, 32);
    number(c, 'sum   ' + fmt(tile.total), 1140, 396, 32);
    line(c, 105, 493, 1490, 493);
    if (b === 5) {
      txt(c, 'Save the observed score', 114, 572, 38, ink, serif);
      number(c, states[0].values[0], 593, 572, 45);
      txt(c, 'Reuse the tile memory for the next vocabulary block.', 114, 687, 39, ink, serif);
    } else {
      txt(c, 'Compare with the full projection', 110, 575, 48, ink, serif);
      label(c, 'Reference loss', 113, 672);
      number(c, fmt(states[1].logSumExp - states[0].values[0]) + ' nats', 346, 671, 36);
      label(c, 'Also compare', 838, 672);
      txt(c, 'gradients and step time', 1036, 672, 33, ink, serif);
    }
    return;
  }
  heading(c, 'Carry the old weights into the new tile');
  const [first, second] = model.tiles;
  label(c, 'One position, four vocabulary entries', 111, 181);
  const rescaled = spoken(k, 3, 'shrink the first');
  const added = spoken(k, 3, 'Add the incoming');
  const baseline = rescaled ? second.maximum : first.maximum;
  const retained = rescaled ? second.retained : first.total;
  model.tiles.forEach((tile, i) => {
    const x = 114 + i * 713;
    label(c, 'Tile ' + (i + 1), x, 251);
    tile.values.forEach((z, j) => {
      notch(c, x + j * 262, 299, 246, 111, i ? '#ddd2ad' : '#bcd6cf');
      number(c, z, x + 123 + j * 262, 354, 52, ink, 'center');
    });
    label(c, 'Tile maximum   ' + tile.peak, x, 467);
  });
  label(c, 'Retained sum at baseline ' + baseline, 113, 525);
  box(c, 114, 555, 583, 48, '#e8e3d6');
  box(c, 114, 555, 550 * retained, 48, fill[1]);
  const initialTerms = '1 + exp(' + fmt(first.values[1] - first.maximum, 0) + ')';
  const scaleFactor = 'exp(' + first.maximum + ' − ' + second.maximum + ')';
  const retainedTerms = rescaled ? '(' + initialTerms + ') × ' + scaleFactor : initialTerms;
  number(c, retainedTerms + ' ≈ ' + fmt(retained), 113, 638, 29);
  label(c, rescaled ? 'Incoming sum at baseline ' + baseline : 'Incoming sum', 832, 525);
  if (added) {
    box(c, 832, 555, 583, 48, '#e8e3d6');
    box(c, 832, 555, 550 * second.incoming, 48, fill[0]);
    const incomingTerms = '1 + exp(' + fmt(second.values[1] - baseline, 0) + ')';
    number(c, incomingTerms + ' ≈ ' + fmt(second.incoming), 832, 638, 29);
    number(c, 'Row sum ≈ ' + fmt(second.total), 113, 697, 30);
  } else {
    txt(c, 'Pending', 832, 579, 35, muted, serif);
  }
  if (spoken(k, 4, 'Save that two')) {
    const target = first.values[0];
    const result = spoken(k, 4, 'two point one five') ? ' ≈ ' + fmt(second.logSumExp - target) + ' nats' : '';
    number(c, 'Loss ≈ ' + fmt(second.logSumExp) + ' − ' + target + result, 663, 697, 30);
  } else if (spoken(k, 3, 'Four plus the log')) {
    number(c, 'log-sum-exp = ' + baseline + ' + ln(row sum) ≈ ' + fmt(second.logSumExp), 663, 697, 30);
  }
}
export function report(firstProbability, count) {
  const p = [firstProbability, 0.5],
    losses = p.map((v) => -Math.log(v)),
    total = losses[0] + losses[1];
  return { p, count, total, mean: total / count };
}
export function twoReports(c, k) {
  const b = k.beat.beatIndex;
  const start = report(0.25, 2);
  const end = report(0.5, 2);
  const advance = cue(k, 1, 'reports advance together', 1.1);
  const rewind = cue(k, 2, 'Rewind both', 1.15);
  const replay = cue(k, 2, 'Play that step again', 1.35);
  const restore = spoken(k, 3, 'divisor to two');
  const details = rewind === 1 && spoken(k, 2, 'At the start');
  const verdict = spoken(k, 3, 'report B');
  heading(
    c,
    b === 0
      ? 'Two reports on the same batch'
      : !details
        ? 'What can the means alone tell us?'
        : b < 4
          ? 'Compare the first word and the divisor'
          : 'Which report earned its lower loss?',
  );
  const step = details ? replay : advance * (1 - rewind);
  const changed = step === 1;
  const A = report(0.25, changed && !restore ? 3 : 2),
    B = changed ? end : start;
  if (b === 4 || b === 5) {
    illustration(c, 104, 246, 0.86, true);
    txt(c, 'The dog slept.', 115, 585, 64, ink, serif);
    label(c, 'Observed words in report B', 858, 236);
    ['First word', 'Second word'].forEach((s, i) => {
      const y = 325 + i * 141;
      txt(c, s, 864, y, 36, ink, serif);
      number(c, pct(start.p[i], 0) + ' → ' + pct(B.p[i], 0), 1150, y, 37, dye[i]);
      box(c, 866, y + 46, 572, 29, '#e2ded0');
      box(c, 866, y + 46, 572 * B.p[i], 29, fill[i]);
      line(c, 866 + 572 * start.p[i], y + 33, 866 + 572 * start.p[i], y + 88, ink, 3, [5, 5]);
    });
    txt(c, 'The same two targets', 859, 651, 41, ink, serif);
    number(c, 'mean   ' + fmt(start.mean) + ' → ' + fmt(B.mean), 861, 718, 35);
    return;
  }
  const shown = details || !spoken(k, 1, 'Watch the reports');
  const hasMean = spoken(k, 1, 'one point zero four');
  [A, B].forEach((v, i) => {
    const x = 103 + 746 * i,
      w = 659;
    box(c, x + 5, 200, w, 482, '#ded8c8');
    box(c, x, 194, w, 482, i ? '#e8f2e8' : '#ebedf3');
    txt(c, 'Report ' + (i ? 'B' : 'A'), x + 24, 241, 45, ink, serif);
    label(c, 'Mean loss', x + 30, 330);
    number(c, hasMean ? fmt(v.mean) : '?', x + 255, 332, 67, ink);
    if (shown) {
      const names = ['First word', 'Second word', 'Ignored position'];
      names.forEach((s, j) => {
        const y = 434 + j * 77;
        txt(c, s, x + 25, y, 27, j === 2 ? muted : ink);
        if (j < 2) {
          box(c, x + 249, y - 13, 235, 28, '#d7d8cd');
          box(c, x + 249, y - 13, 235 * v.p[j], 28, fill[j]);
          number(c, pct(v.p[j], 0), x + 503, y, 29);
        } else {
          label(c, v.count === 3 ? 'counted in divisor' : 'left out', x + 248, y);
        }
      });
      if (spoken(k, 1, 'two point zero eight')) {
        number(c, fmt(v.total) + ' ÷ ' + v.count, x + 25, 636, 33);
        label(c, 'loss sum ÷ divisor', x + 316, 638);
      }
    } else {
      line(c, x + 55, 517, x + 570, 517, rule, 3);
      const xx = x + 77 + 396 * step;
      const yy = 426 + (start.mean - v.mean) * 300;
      line(c, x + 77, 426, xx, 426, dye[i], 5);
      if (changed) line(c, xx, 426, xx, yy, dye[i], 5);
      dot(c, xx, yy, 10, dye[i]);
      label(c, 'Starting mean   ' + fmt(start.mean), x + 52, 610);
    }
  });
  if (b === 0)
    txt(
      c,
      'Score the two observed words. Leave the ignored position out of the count.',
      106,
      711,
      36,
      ink,
      serif,
    );
  else if (!verdict) {
    label(c, 'Batch replay', 108, 711);
    line(c, 355, 711, 1477, 711, rule, 4);
    dot(c, 360 + 1112 * step, 711, 14, gold);
  } else
    txt(
      c,
      !restore
        ? 'Keep B. The first word gained probability on the same two targets.'
        : 'Restoring the count returns A to its starting mean.',
      107,
      711,
      37,
      ink,
      serif,
    );
}
