import assert from 'node:assert/strict';
import {
  checkExpression,
  combine,
  evaluateTree,
  valueLabel,
  searchValues,
  stateKey,
  voteFixture,
} from '../../../films/reasoning-search/arithmetic.mjs';
import {
  PRUNING_BRANCHES,
  DEAD_END_TRACE,
  FRESH_FRACTION_TREE,
  FRESH_WRONG_TREE,
} from '../../../films/reasoning-search/fixtures.mjs';
import { occurrenceExpressionCheck } from '../../../films/reasoning-search/construction.mjs';
import {
  field,
  heading,
  line,
  rect,
  txt,
  label,
  disk,
  badge,
  poly,
  arrow,
  mix,
  ease,
  cue,
  ink,
  cream,
  mint,
  copper,
  pink,
  pale,
  paper,
  red,
  teal,
} from './art.mjs';

const leaf = (n, id) => ({ leaf: n, ...(id ? { occurrence: id } : {}) });
const op = (l, o, r) => ({ left: l, op: o, right: r });
const [six, four, five, seven] = [6, 4, 5, 7].map((n) => leaf(n));
const deal = [six, four, five, seven];
const product = op(six, '×', four),
  sum = op(five, '+', seven),
  diff = op(six, '-', four),
  win = op(diff, '×', sum);
const A = [product, five, seven],
  B = [six, four, sum];
const leaves = (t) => (Object.hasOwn(t, 'leaf') ? [t] : [...leaves(t.left), ...leaves(t.right)]);
const val = (t) => valueLabel(evaluateTree(t).value);
const expr = (t) =>
  t.leaf !== undefined
    ? String(t.leaf)
    : val(t.left) + ' ' + t.op.replace('-', '−') + ' ' + val(t.right);
const ids = (t) => leaves(t).map((l) => l.occurrence ?? l.leaf);
const markings = ['#9d4742', '#347568', '#bd7c38', '#525c8b'];
const mark = (n) =>
  markings[{ '6': 0, '4': 1, '5': 2, '7': 3, '8a': 0, '3a': 1, '3b': 2, '8b': 3 }[n] ?? 0];
function tile(g, t, x, y, scale = 1, tag = true) {
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  const leafTile = Object.hasOwn(t, 'leaf'),
    items = ids(t),
    w = 140,
    h = 157;
  const face = leafTile ? '#fff1cd' : '#f1b968';
  rect(g, -w / 2 + 3, -h / 2 + 10, w, h, '#251a2966', 14);
  rect(g, -w / 2, -h / 2 + 7, w, h, leafTile ? '#b5a68b' : '#a36d38', 13);
  rect(g, -w / 2, -h / 2, w, h, face, 13, '#c7aa84', 1.5);
  line(g, -54, -63, 52, -63, '#fff8e1', 2);
  if (leafTile && !t.occurrence) {
    const code = mark(t.leaf);
    for (let i = 0; i < t.leaf; i++) disk(g, -(t.leaf - 1) * 4 + i * 8, 49, 2.3, code);
  } else if (tag) {
    const step = items.length > 3 ? 27 : 34;
    items.forEach((v, i) => {
      const xx = (i - (items.length - 1) / 2) * step;
      disk(g, xx, 48, items.length === 1 ? 19 : 13, mark(v));
      txt(
        g,
        String(v).toUpperCase(),
        xx,
        48,
        items.length === 1 ? 15 : 12,
        cream,
        'center',
        'Mono',
        600,
      );
    });
  }
  txt(g, val(t), 0, -8, val(t).length > 2 ? 43 : 65, ink, 'center', 'Serif', 600);
  g.restore();
}
function hand(g, items, cx, y, scale = 1, gap = 170) {
  items.forEach((t, i) => tile(g, t, cx + (i - (items.length - 1) / 2) * gap * scale, y, scale));
}
function inlay(g, x, y, w, h) {
  rect(g, x, y, w, h, '#2a22324f', 18, '#bd9fa65a', 2);
  line(g, x + 29, y + h - 14, x + w - 29, y + h - 14, '#ceabb251', 2);
}
function mat(g, sub) {
  field(g, 'felt');
  txt(g, 'Make 24', 67, 79, 58, cream, 'left', 'Serif');
  label(g, sub, 1211, 78, '#ead0b1', 'right', 20);
}
// The two active occurrences converge and leave the surface. Loose tiles stay in place.
function consume(g, inputs, [i, j], result, spots, y, travel, settled, scale = 1, lift = 72) {
  const cx = (spots[i] + spots[j]) / 2;
  inputs.forEach((t, k) => {
    if (k !== i && k !== j) {
      tile(g, t, spots[k], y, scale);
      return;
    }
    if (settled) return;
    const p = ease(travel);
    g.save();
    g.globalAlpha = 1 - p;
    tile(g, t, mix(spots[k], cx + (k === i ? -15 : 15), p), y - p * lift, scale * (1 - 0.39 * p));
    g.restore();
  });
  if (settled) tile(g, result, cx, y, scale);
}
function centered(g, str, y, color = cream, size = 36) {
  txt(g, str, 640, y, size, color, 'center', 'Serif');
}
const spots = [303, 527, 751, 975];
export function firstDeal(g, c) {
  mat(g, 'Use each input once   /   +  −  ×  ÷');
  inlay(g, 130, 195, 1020, 331);
  consume(
    g,
    deal,
    [0, 1],
    product,
    spots,
    351,
    cue(c, 2, 'Multiply them', 0.7),
    cue(c, 2, 'Twenty-four takes'),
  );
  if (cue(c, 2, 'Twenty-four takes')) {
    label(g, '6 × 4', 415, 477, copper, 'center', 24);
    label(g, 'Still available', 862, 477, pale, 'center', 22);
  }
  centered(
    g,
    c.beat.beatIndex === 0
      ? 'Four inputs. One final value.'
      : c.beat.beatIndex === 1
        ? 'Have you used every input?'
        : '24 is one of three remaining values.',
    610,
  );
}
export function linear(g, c) {
  mat(g, 'One continuation at each step');
  const stage = cue(c, 3, 'final state contains')
    ? 3
    : cue(c, 2, 'into twelve')
      ? 2
      : cue(c, 1, 'which leaves')
        ? 1
        : 0;
  const states = [deal, [diff, five, seven], [diff, sum], [win]];
  inlay(g, 85, 195, 1110, 311);
  hand(g, states[stage], 640, 342, 1.13, 191);
  const formulas = [
    expr(diff) + ' = ' + val(diff),
    expr(sum) + ' = ' + val(sum),
    expr(win) + ' = ' + val(win),
  ];
  formulas.slice(0, stage).forEach((s, i) => {
    const x = 249 + i * 390;
    label(g, s, x, 599, copper, 'center', 28);
    if (i < stage - 1) arrow(g, x + 127, 599, x + 230, 599, '#bfa6a7');
  });
  label(
    g,
    stage === 0
      ? 'AVAILABLE INPUTS'
      : stage === 3
        ? 'ALL FOUR INPUTS USED'
        : 'AVAILABLE SUBTOTALS AND INPUTS',
    640,
    466,
    pale,
    'center',
  );
}
export function splitDeal(g, c) {
  mat(g, 'Two copies of the same hand');
  const left = cue(c, 2, 'gives twenty-four'),
    right = cue(c, 2, 'gives twelve');
  const gap = [143, 257, 371, 485];
  for (const i of [0, 1]) {
    const ox = i * 606 + 34;
    inlay(g, ox, 183, 592, 377);
    label(g, 'TRAY ' + (i ? 'B' : 'A'), ox + 35, 223, pale);
    const xx = gap.map((k) => k + ox - 16);
    consume(
      g,
      deal,
      i ? [2, 3] : [0, 1],
      i ? sum : product,
      xx,
      368,
      i ? cue(c, 2, 'On the right', 0.7) : cue(c, 2, 'On the left', 0.7),
      i ? right : left,
      0.73,
    );
    const selected = i ? right : left;
    if (selected) label(g, i ? '5 + 7 = 12' : '6 × 4 = 24', ox + 297, 502, copper, 'center', 27);
  }
  if (c.beat.beatIndex === 2) centered(g, 'Tray B   ·   12 carries inputs 5 and 7', 620);
}
const firstPlus = op(four, '+', five),
  secondPlus = op(six, '+', seven);
const proposalLists = [[product], A];
function sameState(items, proposal) {
  return (
    stateKey(items.map((t) => ({ value: evaluateTree(t).value }))) ===
    stateKey(proposal.map((t) => ({ value: evaluateTree(t).value })))
  );
}
export function replay(g, c) {
  const q = (n, p, t = 0) => cue(c, n, p, t),
    b = c.beat.beatIndex;
  mat(g, b < 3 ? 'Replay a proposed move' : 'One expansion per distinct state');
  if (b < 3) {
    label(g, 'HOST’S TRAY', 75, 169, pale);
    inlay(g, 58, 194, 1164, 266);
    consume(
      g,
      deal,
      [0, 1],
      product,
      spots,
      319,
      q(1, 'Lift the six', 0.9),
      q(1, 'Put their product back'),
      1.04,
    );
    const admit = q(2, 'Admit the second list');
    for (const [i, list] of proposalLists.entries()) {
      const x = 88 + 595 * i,
        good = sameState(A, list);
      const stroke = admit ? (good ? mint : pink) : '#a38e9c';
      rect(g, x, 504, 510, 110, '#332a39', 11, stroke, 2);
      label(g, 'PROPOSAL ' + (i + 1), x + 23, 530, pale, 'left', 17);
      txt(g, list.map(val).join(' · '), x + 23, 577, 35, cream, 'left', 'Mono');
      if (admit) txt(g, good ? 'Admit' : 'Reject', x + 479, 559, 26, stroke, 'right');
    }
  } else {
    const first = q(4, 'add four and five'),
      second = q(4, 'then add six and seven'),
      other = q(4, 'Reverse the order'),
      merged = q(5, 'Keep one history');
    const top = second ? [firstPlus, secondPlus] : first ? [firstPlus, six, seven] : deal;
    const bottom = q(4, 'Both leave nine and thirteen')
      ? [secondPlus, firstPlus]
      : other
        ? [secondPlus, four, five]
        : deal;
    for (const [i, items] of [top, bottom].entries()) {
      const yy = 276 + i * 218;
      label(g, i ? 'PATH B' : 'PATH A', 72, yy, pale);
      hand(g, items, 412, yy, 0.7, 158);
      const show = i ? q(4, 'Both leave nine and thirteen') : second;
      if (show) label(g, i ? '6 + 7 first' : '4 + 5 first', 407, yy + 85, copper, 'center');
      if (q(4, 'Both leave nine and thirteen')) arrow(g, 657, yy, 849, 385, pale);
    }
    if (q(4, 'Both leave nine and thirteen')) {
      rect(g, 864, 307, 312, 150, '#35273b', 12, copper, 2);
      txt(g, '[9, 13]', 1020, 366, 46, cream, 'center', 'Mono');
      label(g, merged ? 'Expand once' : 'Same values', 1020, 425, merged ? mint : pale, 'center');
    }
    centered(
      g,
      b === 5
        ? 'Budget distinct states, proposals, memory and time.'
        : 'The remaining values determine legal continuations.',
      630,
      cream,
      31,
    );
  }
}
function ticketFace(g, name, x, y, w) {
  rect(g, x, y, w, 116, '#f1ddbf', 10, '#402f48', 2);
  txt(g, name, x + 40, y + 58, 39, ink, 'center', 'Serif', 600);
}
function branchTicket(g, name, items, x, y, w, scale = 0.47) {
  ticketFace(g, name, x, y, w);
  hand(g, items, x + w * 0.6, y + 54, scale, 160);
}
function phraseProgress(c, phrase, captionStart) {
  const { start, end } = c.wordCue(phrase);
  return c.reveal(phrase, end - start, { captionStart });
}
function afterPhrase(c, beat, phrase, captionStart = phrase) {
  const current = c.beat.beatIndex + 1;
  return current === beat ? phraseProgress(c, phrase, captionStart) === 1 : current > beat;
}
export function frontier(g, c) {
  const b = c.beat.beatIndex;
  field(g, 'panel');
  if (b === 3) {
    heading(g, 'Select by score', 'Keep a fixed number at a selection step', 'panel');
    branchTicket(g, 'A', A, 83, 217, 449);
    branchTicket(g, 'B', B, 83, 402, 449);
    arrow(g, 556, 285, 717, 338, pale);
    arrow(g, 556, 450, 717, 393, pale);
    rect(g, 754, 285, 439, 146, null, 13, mint, 3);
    txt(g, '?', 973, 357, 55, cream, 'center', 'Serif');
    label(g, '1 RETAINED SLOT', 973, 479, pale, 'center');
    return;
  }

  const queue = b === 0;
  const arrivalBeat = queue ? 1 : 2;
  const expansionBeat = queue ? 0 : 2;
  const expansionPhrase = queue ? 'A goes next' : 'B comes off first';
  const searchType = queue ? 'breadth-first search' : 'depth-first search';
  let travel = 0;
  let named = false;
  if (b === expansionBeat) {
    // Keep the chosen tray in the frontier until the full answer has been spoken.
    if (afterPhrase(c, expansionBeat + 1, expansionPhrase)) {
      const { end } = c.wordCue(expansionPhrase);
      travel = ease(Math.min(1, Math.max(0, (c.elapsed - end) / 0.85)));
    }
    named = afterPhrase(c, expansionBeat + 1, searchType, false);
  }

  heading(g, queue ? 'Queue' : 'Stack', queue ? null : 'Replay the same arrivals', 'panel');
  label(g, 'FRONTIER', 65, 200, pale, 'left', 24);
  label(g, 'NEXT TO EXPAND', 800, 200, mint, 'left', 24);
  rect(g, 51, 226, 519, 351, '#10282d', 14, '#6a8784', 2);
  const waitingX = 150;
  const expansionX = 800;
  const expansionY = 344;
  const ticketWidth = 400;
  rect(g, expansionX - 12, expansionY - 12, ticketWidth + 24, 140, null, 12, '#85a29b', 2);
  label(g, queue ? 'BACK' : 'TOP', 64, 302, pale, 'left', 21);
  label(g, queue ? 'FRONT' : 'BASE', 64, 488, pale, 'left', 21);

  const arrivals = [
    cue(c, arrivalBeat, queue ? 'A arrives first' : 'A first', 0.55),
    cue(c, arrivalBeat, queue ? 'B arrives second' : 'then B', 0.55),
  ];
  const trays = [
    { name: 'A', items: A, y: 430 },
    { name: 'B', items: B, y: 244 },
  ];
  const next = queue ? 0 : 1;
  for (const [i, { name, items, y }] of trays.entries()) {
    const arrival = ease(arrivals[i]);
    if (!arrival) continue;
    const departure = i === next ? travel : 0;
    const x = mix(mix(135, waitingX, arrival), expansionX, departure);
    // Move clear of the waiting tray before turning toward the expansion slot.
    const turn = ease(
      Math.max(0, (x - waitingX - ticketWidth) / (expansionX - waitingX - ticketWidth)),
    );
    g.save();
    g.globalAlpha = arrival;
    branchTicket(g, name, items, x, mix(y, expansionY, turn), ticketWidth);
    g.restore();
  }
  if (b === 1 && arrivals[1] === 1)
    txt(g, 'Which tray comes off the top?', expansionX, 516, 31, cream, 'left', 'Serif');
  if (travel === 1) {
    txt(
      g,
      queue ? 'First in, first out' : 'Last in, first out',
      expansionX,
      516,
      35,
      cream,
      'left',
      'Serif',
    );
  }
  if (named) label(g, searchType.toUpperCase(), expansionX, 567, mint, 'left', 23);
}
const dead = DEAD_END_TRACE;
function progressTrace(n) {
  return n === 0 ? { checked: 0, queued: 1 } : dead[n - 1];
}
function faceDown(g, x, y, w) {
  rect(g, x, y, w, 116, '#874c54', 10, '#d4b39c', 2);
  for (let i = 13; i < w - 19; i += 24) {
    line(g, x + i, y + 17, x + i + 10, y + 31, '#c59988', 2);
    line(g, x + i, y + 99, x + i + 10, y + 85, '#c59988', 2);
  }
  txt(g, 'B   /   Pruned', x + w / 2, y + 59, 29, cream, 'center', 'Serif');
}
function expandBeamTray(g, c, x, y, width) {
  const scale = 0.47;
  const gap = 160 * scale;
  const center = x + width * 0.6;
  const positions = [center - gap, center, center + gap];
  const subtract = phraseProgress(c, 'Six minus four leaves two', 'leaves two');
  const multiply = phraseProgress(c, 'Two times twelve makes twenty-four', 'makes twenty-four');
  ticketFace(g, 'B', x, y, width);
  if (subtract < 1) {
    consume(g, B, [0, 1], diff, positions, y + 54, subtract, false, scale, 10);
  } else {
    const remaining = [(positions[0] + positions[1]) / 2, positions[2]];
    const finished = multiply === 1;
    consume(g, [diff, sum], [0, 1], win, remaining, y + 54, multiply, finished, scale, 10);
    const result = finished ? win : diff;
    const formula = expr(result) + ' = ' + val(result);
    label(
      g,
      finished ? formula + '   ·   ' + ids(result).length + ' inputs used' : formula,
      x,
      590,
      mint,
      'left',
      21,
    );
  }
}
export function beam(g, c) {
  const selected = afterPhrase(c, 2, 'A gets the slot');
  const pruned = afterPhrase(c, 2, 'Turn B face down');
  const again = cue(c, 3, 'Start again');
  const wide = afterPhrase(c, 3, 'give the beam two places');
  mat(g, 'One fork   /   illustrative heuristic');
  const width = wide ? 2 : 1;
  label(g, 'PROPOSED HANDS', 75, 175, pale);
  label(g, 'BEAM WIDTH  ' + width, 759, 176, copper);
  for (const [i, [name, items, proposal]] of [
    ['A', A, PRUNING_BRANCHES.branchA],
    ['B', B, PRUNING_BRANCHES.branchB],
  ].entries()) {
    const yy = 230 + i * 198;
    if (i && pruned && !again) faceDown(g, 75, yy, 472);
    else {
      branchTicket(g, name, items, 75, yy, 472);
      if (afterPhrase(c, 1, i ? 'B forty hundredths' : 'A ninety-five hundredths'))
        label(g, 'Score  ' + proposal.heuristic.toFixed(2), 83, yy + 145, copper, 'left', 23);
    }
  }
  rect(g, 746, 220, 468, wide ? 343 : 153, null, 14, mint, 3);
  if ((selected && !again) || wide) {
    branchTicket(g, 'A', A, 764, 235, 432);
    if (c.beat.beatIndex === 3) expandBeamTray(g, c, 764, 430, 432);
    else if (wide) branchTicket(g, 'B', B, 764, 430, 432);
  }
  if (selected && !again) {
    let n = dead.length;
    if (c.beat.beatIndex === 1) {
      const operation = 'Try every legal continuation';
      const { start } = c.wordCue(operation);
      const { end } = c.wordCue('The waiting count falls to zero after eighty-five distinct states');
      const progress = c.reveal(operation, end - start, { captionStart: 'The waiting count' });
      n = Math.floor(dead.length * progress);
    }
    const tr = progressTrace(n);
    label(g, 'A examined   ' + tr.checked, 764, 432, pale, 'left', 24);
    label(g, 'A waiting    ' + tr.queued, 764, 483, pale, 'left', 24);
    if (n === dead.length && afterPhrase(c, 2, 'No solution from A'))
      txt(g, 'No solution from A', 764, 558, 31, pink, 'left', 'Serif');
  }
}
const votes = voteFixture();
export function agreements(g, c) {
  const b = c.beat.beatIndex,
    q = (n, p) => cue(c, n, p);
  mat(g, 'Vote on the answer   /   check the expression');
  for (let i = 0; i < 3; i++) {
    const x = 190 + 450 * i;
    inlay(g, x - 153, 201, 306, 226);
    label(g, 'SAMPLE ' + (i + 1), x, 239, pale, 'center');
    txt(g, votes.samples[i].answer, x, 309, 66, cream, 'center', 'Serif');
    if (q(2, 'each only multiplies')) label(g, '6 × 4', x, 382, copper, 'center', 24);
  }
  if (b === 0) centered(g, 'What can agreement tell us?', 571);
  else {
    label(g, votes.votes + ' of 3 agree', 87, 545, mint, 'left', 25);
    if (b === 2) txt(g, '0 of 3 valid', 85, 612, 34, pink, 'left', 'Serif');
    hand(g, [five, seven], 932, 564, 0.64);
    label(g, 'Unused inputs', 932, 649, pale, 'center');
  }
}
const capRoot = searchValues([4, 5, 6, 7], 1),
  capA = searchValues([24, 5, 7], 1);
export function budget(g, c) {
  const q = (n, p, t = 0) => cue(c, n, p, t),
    b = c.beat.beatIndex;
  const a = q(1, 'Now start from A'),
    uncap = q(3, 'lift the cap');
  const peak = dead.reduce((best, t) => (t.queued > best.queued ? t : best), dead[0]).checked;
  const finish = b === 3
    ? phraseProgress(c, "Eventually we've examined eighty-five distinct states and the queue is empty", "Eventually we've examined")
    : Number(b > 3);
  const sampled = uncap
    ? Math.round(peak * q(3, 'Each point shows', 4)) + Math.floor((dead.length - peak) * finish)
    : 0;
  const result = uncap
    ? progressTrace(sampled)
    : a
      ? q(1, 'It leaves eighteen waiting')
        ? capA
        : null
      : q(1, 'Examining the starting tray')
        ? capRoot
        : null;
  const n = uncap ? result.checked : (result?.visited ?? 0),
    waiting = uncap ? result.queued : (result?.frontier.length ?? 1);
  field(g, 'paper');
  heading(
    g,
    'Work left in the queue',
    a ? 'TRAY A   /   24, 5, 7' : 'STARTING TRAY   /   4, 5, 6, 7',
  );
  const x = (i) => 110 + i * 7.7,
    y = (v) => 520 - v * 4.35;
  for (let i = 0; i <= 60; i += 20) {
    line(g, x(0), y(i), x(85), y(i), '#aebaaa');
    label(g, i, 93, y(i), '#4d6161', 'right', 16);
  }
  label(g, 'WAITING', 85, 190);
  const points = uncap
    ? [0, ...dead.slice(0, sampled).map((t) => t.checked)].map((i) => [
        x(i),
        y(progressTrace(i).queued),
      ])
    : [
        [x(0), y(1)],
        [x(n), y(waiting)],
      ];
  poly(g, points, teal, 3);
  for (const pt of points) disk(g, ...pt, 2, teal);
  disk(g, x(n), y(waiting), 8, red);
  for (let i of [0, 20, 40, 60, 85]) label(g, i, x(i), 550, '#4d6161', 'center', 16);
  label(g, 'DISTINCT STATES EXAMINED', 432, 586, '#4d6161', 'center');
  label(g, uncap ? 'STATE CAP LIFTED' : 'CAP   /   1 STATE', 825, 196);
  txt(g, n, 832, 283, 66, ink, 'left', 'Serif');
  label(g, 'examined', 956, 285);
  txt(g, waiting, 832, 391, 66, teal, 'left', 'Serif');
  label(g, 'waiting', 956, 393);
  const status = uncap
    ? q(5, 'No solution')
      ? 'No solution from A'
      : null
    : q(2, 'Budget exhausted')
      ? 'Budget exhausted'
      : null;
  if (status) badge(g, status, 823, 479, 367, status.startsWith('No') ? '#e7b9a8' : '#edcc90');
  if (b === 0 || b === 3)
    txt(g, 'What status can this run report?', 823, 525, 26, ink, 'left', 'Serif');
}
const [eightA, threeA] = [FRESH_WRONG_TREE.left.left, FRESH_WRONG_TREE.left.right];
const [eightB, threeB] = [FRESH_WRONG_TREE.right.left, FRESH_WRONG_TREE.right.right];
const ratio = FRESH_FRACTION_TREE.right.right,
  divisor = FRESH_FRACTION_TREE.right;
const repeated = { ...FRESH_FRACTION_TREE, left: eightA };
export function fresh(g, c) {
  const q = (n, p) => cue(c, n, p);
  const b = c.beat.beatIndex;
  mat(g, 'Duplicate values   /   distinct input occurrences');
  let items = [eightA, threeA, threeB, eightB],
    formula = '8A   3A   3B   8B',
    verdict = '';
  if (b === 0) {
    if (q(1, 'Both differences')) {
      items = [FRESH_WRONG_TREE.left, FRESH_WRONG_TREE.right];
      formula = '8A − 3A = 5       8B − 3B = 5';
    }
    if (q(1, 'you get twenty-five')) {
      items = [FRESH_WRONG_TREE];
      formula = '5 × 5 = ' + val(FRESH_WRONG_TREE);
      verdict = 'Four inputs used · target missed';
    }
  } else {
    if (q(2, 'Keep eight thirds')) {
      items = [ratio, threeB, eightB];
      formula = '8A ÷ 3A = 8/3';
    }
    if (q(2, 'the difference is one third')) {
      items = [divisor, eightB];
      formula = '3B − 8/3 = 9/3 − 8/3 = 1/3';
    }
    if (b === 2) {
      items = [eightB, divisor];
      formula = '8B    ?    1/3    =    24';
    }
    if (q(4, 'Divide')) {
      items = [eightB, divisor];
      formula = '8B ÷ 1/3 = ?';
    }
    if (afterPhrase(c, 4, 'Eight divided by one third is twenty-four')) {
      items = [FRESH_FRACTION_TREE];
      formula = '8B ÷ (3B − 8A / 3A) = ' + val(FRESH_FRACTION_TREE);
      verdict = 'Four inputs used once';
    }
    if (q(5, 'names eight A again')) {
      const fixed = q(6, 'Replace the repeated eight A with eight B'),
        t = fixed ? FRESH_FRACTION_TREE : repeated;
      items = fixed ? [t] : [t, eightB];
      formula = (fixed ? '8B' : '8A') + ' ÷ (3B − 8A / 3A) = ' + val(t);
      verdict = fixed
        ? 'Accepted · four distinct inputs'
        : b === 5
          ? 'Rejected · 8B still available'
          : 'Would you accept this trace?';
    }
  }
  inlay(g, 89, 166, 1102, 318);
  hand(g, items, 640, 320, 1.22, 174);
  label(g, formula, 640, 537, copper, 'center', 31);
  if (verdict) centered(g, verdict, 577);
}
export function checkTable() {
  assert.deepEqual(A.map(val), ['24', '5', '7']);
  assert.deepEqual(B.map(val), ['6', '4', '12']);
  assert.deepEqual(
    proposalLists.map((p) => sameState(A, p)),
    [false, true],
  );
  assert.deepEqual([val(diff), val(sum), val(win), ids(win)], ['2', '12', '24', [6, 4, 5, 7]]);
  assert(checkExpression(win).valid);
  assert(!checkExpression(product).valid);
  assert.equal(combine({ n: 1, d: 1 }, { n: 0, d: 1 }, '÷'), null);
  assert(sameState([firstPlus, secondPlus], [secondPlus, firstPlus]));
  assert.deepEqual([val(firstPlus), val(secondPlus)], ['9', '13']);
  assert.deepEqual(
    [capRoot.visited, capRoot.frontier.length, capA.visited, capA.frontier.length],
    [1, 36, 1, 18],
  );
  assert.deepEqual([dead.length, dead.at(-1).queued, progressTrace(0).queued], [85, 0, 1]);
  assert.deepEqual(
    [PRUNING_BRANCHES.branchA.completion, PRUNING_BRANCHES.branchB.completion],
    ['no-solution', 'solved'],
  );
  assert.equal(votes.checked.filter((v) => v.valid).length, 0);
  assert.deepEqual(
    [val(FRESH_WRONG_TREE), val(ratio), val(divisor), val(FRESH_FRACTION_TREE), val(repeated)],
    ['25', '8/3', '1/3', '24', '24'],
  );
  assert.deepEqual(
    [
      occurrenceExpressionCheck(repeated).valid,
      occurrenceExpressionCheck(FRESH_FRACTION_TREE).valid,
    ],
    [false, true],
  );
}
