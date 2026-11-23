import { A, common, contrast, dispatchWeights } from '../../../films/linear-algebra/fixtures.mjs';
import {
  C,
  colors,
  names,
  mix,
  dot,
  times,
  num,
  vec,
  cue,
  type,
  mono,
  title,
  rect,
  path,
  line,
  disk,
  arrow,
  base,
  note,
  ticket,
  point,
  plane,
  straightedge,
  gauge,
  instrument,
  dial,
} from './studio.mjs';

export const spectrum = [6, 3, 1];
export const energy = (values, k) => values.slice(0, k).reduce((sum, v) => sum + v * v, 0);
export function retainedState(k) {
  const rank = cue(k, 1, 'The first strength retains', 0) + cue(k, 1, 'The first two retain', 0);
  const kept = energy(spectrum, rank);
  const total = energy(spectrum, spectrum.length);
  return { rank, kept, total, fraction: kept / total };
}
export const factorCount = (input, output, r) => (input + output) * r;
export const code = (row) => dot(row, dispatchWeights);
const routes = ['Billing', 'Performance', 'Release repair', 'Both teams'];
export function contrastRoute(score, acceptsEmpty) {
  if (Math.abs(score) < 1e-10) return acceptsEmpty ? '?' : 'Both teams';
  return score < 0 ? 'Performance' : 'Release repair';
}
const bidx = (k) => k.beat.beatIndex;

function cutoff(c, k) {
  base(c, 'How many squares cross the cutoff?', 'Truncated SVD  /  a new spectrum');
  const b = bidx(k), { rank, kept, total, fraction } = retainedState(k);
  const showAreas = cue(k, 0, 'Thirty-six plus nine', 0);
  const showError = cue(k, 1, 'That last square', 0);
  const areaColors = [C.blue, C.pink, C.gold];
  const threshold = 0.95;
  const unit = 54,
    edge = 723,
    starts = [159, 609, 894];
  for (const [i, s] of spectrum.entries()) {
    const col = areaColors[i];
    title(c, 'σ = ' + s, starts[i], 334, 48, col);
    for (let j = 0; j < s; j++)
      for (let a = 0; a < s; a++) {
        const selected = i < rank;
        rect(
          c,
          starts[i] + j * unit,
          edge - (a + 1) * unit,
          unit - 4,
          unit - 4,
          selected ? col : '#e1ddc7',
          3,
          selected ? col : '#b8b39c',
        );
      }
    mono(c, showAreas ? `Area ${s * s}` : 'Area ?', starts[i], edge + 62, 36, col);
  }
  type(c, 'Energy retained', 1165, 351, 39);
  const x = 1171,
    y = 518,
    w = 548;
  rect(c, x, y, w, 65, '#d5d9c8', 6);
  for (let i = 0; i < rank; i++) {
    const left = x + w * energy(spectrum, i) / total;
    rect(c, left, y, w * spectrum[i] ** 2 / total, 65, areaColors[i]);
  }
  line(c, x + w * threshold, y - 24, x + w * threshold, y + 89, C.gold, 6);
  mono(c, '95%', x + w * threshold, y - 60, 38, C.gold, 'center');
  if (rank) {
    mono(c, kept + ' / ' + total + ' ≈ ' + num(fraction * 100, 1) + '%', x, y + 157, 48, C.green);
  }
  note(
    c,
    b === 3
      ? 'Test the surviving search results on judged queries before shrinking the index.'
      : showError
        ? 'Rank two keeps 45 / 46. Frobenius error = √1 = 1.'
        : 'Choose the smallest rank whose cumulative squared strengths reach 95%.',
    860,
  );
}

export function rankOne(theta) {
  const input = [Math.cos(theta), Math.sin(theta)],
    scalar = dot(input, [0.8, 0.6]);
  return { input, scalar, output: times([0.6, 0.8], scalar) };
}
function mesh(c, x, y, w, h, col) {
  rect(c, x, y, w, h, col, 3);
  for (let i = 1; i < 9; i++) {
    line(c, x + (i * w) / 9, y, x + (i * w) / 9, y + h, '#f4efda88', 1.5);
    line(c, x, y + (i * h) / 9, x + w, y + (i * h) / 9, '#f4efda88', 1.5);
  }
}
function lowRank(c, k) {
  base(c, 'What fits through a narrow update?', 'Low-rank adaptation  /  one layer');
  const b = bidx(k),
    n = 4096,
    r = 8;
  if (b < 2) {
    const turn = cue(k, 0, 'Turn the input arrow', 3.8);
    const { input, scalar, output } = rankOne(2 * Math.PI * turn);
    const centers = [
        [380, 598],
        [1485, 598],
      ],
      rad = 178;
    disk(c, ...centers[0], rad, null, C.rule, 4);
    const pt = (o, v) => [o[0] + rad * v[0], o[1] - rad * v[1]];
    arrow(c, centers[0], pt(centers[0], input), C.blue, 10);
    path(c, [pt(centers[1], [-0.6, -0.8]), pt(centers[1], [0.6, 0.8])], C.rule, 5);
    arrow(c, centers[1], pt(centers[1], output), C.pink, 10);
    disk(c, ...pt(centers[1], output), 11, C.pink);
    for (const [i, label] of ['Input', 'Output'].entries()) title(c, label, centers[i][0] - 78, 319, 51);
    instrument(c, 744, 444, 386, 268);
    type(c, 'One coordinate', 937, 496, 31, C.ink, { align: 'center' });
    rect(c, 799, 547, 277, 93, C.glass, 10);
    mono(c, num(scalar, 2), 937, 594, 52, C.mint, 'center');
    arrow(c, [585, 596], [710, 596], C.gold);
    arrow(c, [1160, 596], [1267, 596], C.gold);
    type(c, 'The first factor reads a scalar. The second scales one fixed output direction.',
      96, 851, 37, C.ink);
  } else if (b < 4) {
    title(c, 'Full update', 132, 329, 49);
    title(c, 'Width-eight factors', 905, 329, 49);
    mesh(c, 195, 395, 327, 327, C.muted);
    mesh(c, 976, 397, 44, 323, C.blue);
    mesh(c, 1142, 532, 327, 44, C.pink);
    mono(c, '×', 1076, 554, 48, C.ink, 'center');
    mono(c, '4096 × 4096', 119, 794, 36);
    mono(c, '4096 × 8', 877, 794, 35, C.blue);
    mono(c, '8 × 4096', 1185, 794, 35, C.pink);
    const sum = cue(k, 2, 'in total', 0.35);
    if (b === 3 || sum) {
      type(
        c,
        b === 3
          ? `Full update: ${(n * n).toLocaleString('en-US')} weights. Thin factors: ${factorCount(n, n, r).toLocaleString('en-US')}.`
          : `Two sets of ${(n * r).toLocaleString('en-US')} weights give ${factorCount(n, n, r).toLocaleString('en-US')} trainable update weights.`,
        96, 840, 37,
      );
    } else {
      type(c, `Update rank ≤ ${r} (bottleneck width)`, 877, 847, 36, C.ink);
    }
  } else {
    const sq = cue(k, 4, 'squared gradient', 0.8),
      both = cue(k, 5, 'Each weight', 0.8);
    title(c, 'One trainable weight', 125, 325, 51);
    mesh(c, 313, 413, 100, 359, C.blue);
    rect(c, 313 + 33, 413 + 120, 11, 40, '#f5cc74');
    type(c, '4096 × 8 factor', 205, 818, 35, C.blue);
    arrow(c, [441, 555], [797, 555], C.gold, 6);
    type(c, 'Adam state for this weight', 868, 339, 39);
    for (const [i, label] of ['Moving mean of gradient', 'Moving mean of squared gradient'].entries()) {
      const y = 464 + 160 * i;
      rect(c, 859, y - 47, 862, 103, i && !sq ? '#e4e2d3' : i ? C.pink : C.blue, 9);
      if (!i || sq) type(c, label, 900, y + 4, 41, C.light);
    }
    type(
      c,
      both
        ? `Adam stores two moments per update weight: ${(factorCount(n, n, r) * 2).toLocaleString('en-US')} moment values for these factors.`
        : 'Recent gradients receive more weight in both exponential moving averages.',
      96, 863, 35,
    );
  }
}
function practice(c, k) {
  base(c, 'One field for two different jobs', 'Practice  /  mention counts');
  const b = bidx(k),
    which = b >= 2,
    examples = which
      ? [
          [0, 0],
          [4, 4],
        ]
      : [
          [4, 0],
          [0, 4],
        ];
  const turn =
    cue(k, 1, 'Turn it through a right angle', 1.7) - cue(k, 3, 'Turn back to the common direction', 1.7);
  const a = Math.PI * (0.25 + 0.5 * turn);
  const d = turn === 1 ? contrast : turn === 0 ? common : [Math.cos(a), Math.sin(a)];
  const scores = examples.map((row) => dot(row, d));
  const p = plane(c, 452, 642, 70, [-3.5, 5.4, -2.9, 5.1], ['Slow', 'Rollback']);
  straightedge(c, p, d, -3.1, 5.7);
  examples.forEach((row, i) => {
    const foot = times(d, scores[i]);
    path(c, [p(row), p(foot)], colors[i], 3);
    point(c, ...p(row), i);
    disk(c, ...p(foot), 13 - i * 4, colors[i]);
  });
  title(c, which ? 'Count mentions' : 'Route the two calls', 997, 333, 55);
  for (const [i, row] of examples.entries()) {
    const y = 481 + i * 171;
    mono(c, vec(row), 1010, y, 48, colors[i]);
    arrow(c, [1268, y], [1379, y], C.muted, 4);
    mono(c, num(scores[i], 3), 1463, y, 51, colors[i]);
  }
  type(
    c,
    which && turn === 0
      ? 'Common scores × √2 → totals 0 and 8'
      : which
        ? 'Can the counter recover both totals from the two readings?'
        : 'Compare the scores before routing.',
    997, 793, 32, C.ink, { width: 820 },
  );
}
function dispatchInvoice(c, k) {
  const b = bidx(k);
  const equal = cue(k, 3, 'Both read zero', 0.6);
  const weighSlow = cue(k, 3, 'Give the slow flag one point', 0.65);
  const weighRollback = cue(k, 3, 'and the rollback flag two points', 0.65);
  const add = cue(k, 3, 'Add the points for each ticket', 0.8);
  const namedCode = (phrase) =>
    cue(k, 3, phrase, 0) && (b > 3 || k.elapsed >= k.wordCue(phrase).end);
  const billing = namedCode('Billing gets zero');
  const joint = namedCode('and both teams get three');
  const bits = cue(k, 4, 'Four codes take two bits', 0.65);
  const readBits = cue(k, 4, 'and the right bit for slow pages', 0);
  const test = cue(k, 4, 'Pass them through the encoder', 0);
  base(
    c,
    joint ? 'Four codes for four destinations'
      : weighSlow ? 'Give each flag its own weight'
      : 'Can the reader dispatch an invoice?',
    'Support exchange  /  binary flags',
  );
  const rowY = (i) => 352 + i * 132;
  const ticketX = 108, ticketWidth = 586, ticketHeight = 104;
  type(c, 'Incoming ticket', ticketX, 282, 35, C.muted);
  ['Slow', 'Rollback'].forEach((label, j) => {
    const flagX = ticketX + ticketWidth - 192 + j * 113;
    type(c, label, flagX, 282, 27, C.muted, { align: 'center' });
    if (j ? weighRollback === 1 : weighSlow === 1)
      mono(c, '×' + dispatchWeights[j], flagX, 321, 34, C.gold, 'center');
  });
  const scoreX = 831, codeX = 1229, bitsX = 1400, destX = 1535;
  type(c, 'Contrast score', scoreX, 282, 34, C.muted, { align: 'center' });
  if (add) type(c, 'Weighted code', codeX, 282, 34, C.muted, { align: 'center' });
  if (bits) type(c, 'Bits', bitsX, 282, 34, C.muted, { align: 'center' });
  type(c, 'Destination', destX, 282, 34, C.muted);

  if (equal) {
    const upper = rowY(2) + ticketHeight / 2, lower = rowY(3) + ticketHeight / 2;
    const bracketX = mix(895, 943, equal);
    line(c, 895, upper, bracketX, upper, C.gold, 5);
    line(c, 895, lower, bracketX, lower, C.gold, 5);
    line(c, bracketX, upper, bracketX, mix(upper, lower, equal), C.gold, 5);
    if (equal === 1) type(c, 'Same score', 969, (upper + lower) / 2, 35, C.gold);
  }
  [...A, [0, 0]].forEach((row, i) => {
    const y = rowY(i) + ticketHeight / 2;
    ticket(c, i, row, ticketX, rowY(i), ticketWidth, ticketHeight);
    const score = dot(row, contrast);
    const value = code(row);
    const coded = i < 2 ? add > i / 2 : value === 0 ? billing : joint;
    mono(c, num(score, 3), scoreX, y, 49, colors[i], 'center');
    if (coded) {
      mono(c, value, codeX, y, 54, C.green, 'center');
      if (bits) mono(c, value.toString(2).padStart(2, '0'), bitsX, y, 43, C.gold, 'center');
    }
    type(c, coded ? routes[value] : contrastRoute(score, true), destX, y, 37);
  });
  if (test) {
    type(c, 'Encode two cases with different actions.', 1125, 135, 39, C.ink, { width: 700 });
    type(c, 'Check that their codes differ.', 1125, 177, 39, C.ink, { width: 700 });
    return;
  }
  note(
    c,
    readBits ? 'The left bit records rollback. The right bit records slow pages.'
      : bits ? 'Four distinct codes take two bits.'
      : joint ? 'The weighted code sends the joint ticket to both teams and the invoice to billing.'
      : weighSlow ? 'Multiply each flag by its weight, then add.'
      : equal ? 'Both tickets leave the router with the same contrast score.'
      : 'Can the saved score separate billing from a joint ticket?',
    906,
  );
}
function dispatch(c, k) {
  if (cue(k, 2, 'A customer asks for an invoice', 0)) {
    dispatchInvoice(c, k);
    return;
  }
  const b = bidx(k);
  const filed = cue(k, 0, 'file the notes', 0);
  base(
    c,
    filed ? 'Which team gets a zero?' : 'Choose a direction for the ticket reader',
    'Support exchange  /  binary flags',
  );
  const routed = [
    'Negative goes to performance',
    'Positive goes to release repair',
    'Zero goes to both teams',
  ].map((phrase) => cue(k, 1, phrase, 0) && (b > 1 || k.elapsed >= k.wordCue(phrase).end));
  const turn = cue(k, 0, 'turning the measuring direction', 1.4),
    a = Math.PI * (0.25 + turn * 0.5);
  const d = turn === 1 ? contrast : [Math.cos(a), Math.sin(a)];
  if (filed) {
    title(c, 'Router input', 116, 343, 50);
    type(c, 'Each flag is either 0 or 1.', 116, 447, 37);
    type(c, 'At least one flag is set.', 116, 515, 37);
    type(c, 'Saved contrast', 116, 659, 32, C.muted);
    mono(c, '(rollback − slow) / √2', 116, 724, 40);
    if (b === 0) {
      instrument(c, 951, 342, 791, 368);
      rect(c, 999, 387, 695, 279, C.glass, 16);
      type(c, 'Saved score', 1347, 448, 38, C.light, { align: 'center' });
      mono(c, num(dot(A[2], d)), 1347, 555, 104, C.mint, 'center');
      note(c, 'Which ticket can give this reading?', 906);
      return;
    }
  } else type(c, 'Incoming ticket', 112, 288, 35, C.muted);
  type(c, 'Saved score', 891, 288, 35, C.muted);
  type(c, 'Destination', 1380, 288, 35, C.muted);
  A.forEach((row, i) => {
    const y = 329 + i * 134;
    if (!filed) ticket(c, i, row, 108, y, 586, 105);
    const score = dot(row, d),
      dest = routed[i] ? contrastRoute(score, false) : '?';
    mono(c, num(score, 3), 1051, y + 53, 50, filed ? C.ink : colors[i], 'center');
    type(c, dest, 1380, y + 53, 39, C.ink);
  });
  note(
    c,
    filed ? 'Use the saved contrast to choose a destination.' : 'In this queue, every ticket has at least one of the two flags.',
    906,
  );
}
export const ending = [cutoff, lowRank, practice, dispatch];
