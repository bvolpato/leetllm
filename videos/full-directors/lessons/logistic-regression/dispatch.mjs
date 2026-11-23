import assert from 'node:assert/strict';
import { openingRequest, validationScores } from '../../../films/logistic-regression/fixtures.mjs';
import {
  probabilityCost,
  expectedPolicy,
  policyAt,
  harmonicFixture,
} from '../../../films/logistic-regression/model.mjs';
import {
  ink,
  muted,
  teal,
  rust,
  gold,
  blue,
  light,
  white,
  sea,
  rose,
  yellow,
  board,
  text,
  label,
  rect,
  dot,
  line,
  path,
  ticket,
  plate,
  readout,
  gridTable,
  plot,
  curve,
  cue,
  clamp,
  lerp,
  f,
  cash,
  sum,
} from './paint.mjs';

export const sorted = [...validationScores].sort((a, b) => b.p - a.p);
const xScore = (p) => 185 + 1550 * p;
export function gate(k) {
  return 0.8 - 0.15 * cue(k, 1, 'Bring the gate', 1.4) - 0.15 * cue(k, 2, 'Slide past', 1.2);
}
export function opening(c, k) {
  const p = openingRequest.p,
    cut = gate(k),
    x = xScore(p),
    g = xScore(cut),
    selected = p >= cut;
  const panel = c.createLinearGradient(0, 0, 1920, 1080);
  panel.addColorStop(0, '#35555a');
  panel.addColorStop(0.55, '#193940');
  panel.addColorStop(1, '#0c282e');
  rect(c, 0, 0, 1920, 1080, panel);
  label(c, 'P-7    /    ACCESS ROUTING', 133, 117, '#b4cebf', 'left', 33);
  text(c, 'Change team access', 126, 231, 70, white, 'left', 'Serif');
  label(c, 'Review if score ≥ cut', 133, 316, yellow, 'left', 29);
  const L = x - 242,
    T = 143 - 120 * (1 - cue(k, 0, 'Take this access request', 1.1)),
    W = 484,
    H = 353;
  path(
    c,
    [
      [L, T + 33],
      [L + 33, T],
      [L + W - 33, T],
      [L + W, T + 33],
      [L + W, T + H],
      [L, T + H],
    ],
    '#526a63',
    4,
    '#f2eed9',
  );
  dot(c, x, T + 32, 13, '#29434a', '#a2a78e');
  label(c, openingRequest.id, L + 34, T + 88, teal, 'left', 31);
  // The shackle and keyhole identify this as the access request while the score stays pinned.
  c.strokeStyle = blue;
  c.lineWidth = 8;
  c.beginPath();
  c.arc(L + 82, T + 183, 24, Math.PI, 0);
  c.lineTo(L + 106, T + 205);
  c.stroke();
  line(c, L + 58, T + 183, L + 58, T + 206, blue, 8);
  rect(c, L + 42, T + 201, 80, 68, blue, 9);
  dot(c, L + 82, T + 223, 8, white);
  rect(c, L + 79, T + 227, 6, 17, white);
  text(c, f(p), L + 308, T + 207, 77, ink, 'center', 'Mono', 600);
  line(c, L + 30, T + 290, L + W - 30, T + 290, '#b0baa8', 2);
  label(c, 'REVIEW SCORE', L + W / 2, T + 323, muted, 'center');
  line(c, x, T + H, x, 610, '#a4e0dd', 6);
  rect(c, 175, 617, 1570, 50, '#082329', 12);
  rect(c, 185, 626, 1550, 26, '#9cae9f', 6);
  rect(c, g, 626, 1735 - g, 26, yellow, 4);
  for (let i = 0; i <= 40; i++) {
    const X = xScore(i / 40),
      major = i % 10 === 0;
    line(c, X, 665, X, major ? 697 : i % 2 ? 675 : 683, '#d1dcca', major ? 3 : 2);
    if (major) label(c, f(i / 40, 2), X, 731, white, 'center', 30);
  }
  dot(c, x, 620, 15, '#a6eced', ink);
  path(
    c,
    [
      [g - 19, 598],
      [g, 631],
      [g + 19, 598],
    ],
    gold,
    3,
    yellow,
  );
  rect(c, g - 72, 526, 144, 60, yellow, 8);
  line(c, g, 587, g, 600, yellow, 7);
  label(c, f(cut, 3), g, 558, ink, 'center', 33);
  text(c, 'Automatic handling', 185, 808, 44, white);
  text(c, 'Human review', 1735, 808, 44, yellow, 'right');
  const asking = k.beat.beatIndex === 1;
  const initialAnswer = cue(k, 0, 'This request goes through automatically', 0);
  let route = selected ? 'To human review' : 'To automatic handling';
  if (asking) route = 'At 0.50, which route?';
  else if (!initialAnswer) route = 'At 0.80, which route?';
  text(
    c,
    route,
    133,
    444,
    44,
    asking || !initialAnswer ? yellow : '#b5dcd7',
    'left',
    'Serif',
  );
}

function chargeFor(review, required) {
  return review ? (required ? 0 : 18) : required ? 120 : 0;
}
export function routeRows(cut) {
  return sorted.map((row, i) => {
    const inQueue = row.p >= cut;
    const charge = chargeFor(inQueue, row.label);
    return { ...row, inQueue, charge, slot: inQueue ? i + 1 : null };
  });
}
function rackState(k) {
  const b = k.beat.beatIndex;
  const configurations = [
    [0.8, 0.8, 4, 'At point eight'],
    [0.8, 0.5, 4, 'Follow V three'],
    [0.5, 0.2, 4, 'Lower the cut', 'Keep going'],
    [0.2, 0.5, 4, 'Choose one half'],
    [0.5, 0.5, 5, 'Give the desk'],
    [0.5, 0.2, 5, 'Lower the cut again', 'Keep lowering'],
    [0.2, 0.5, 5, 'keep one half'],
    [0.5, 0.2, 6, 'Lower the cut', 'Continue to point two'],
  ];
  const [startCut, endCut, capacity, phrase, secondPhrase] = configurations[b];
  const stop = secondPhrase ? 0.30 : endCut;
  const first = cue(k, b, phrase, 3.2);
  const second = secondPhrase ? cue(k, b, secondPhrase, 2) : 0;
  const cut = lerp(startCut, stop, first) + (endCut - stop) * second;
  const openDesk = cue(k, 0, 'Open the first two files', 0.3) === 1;
  const openRail = cue(k, 0, 'Open the other four', 0.3) === 1;
  const openPair = cue(k, 1, 'Now open their outcomes', 0.3) === 1 && (b > 1 || first === 1);
  const rows = sorted.map((r) => {
    const fromReview = r.p >= startCut, toReview = r.p >= endCut;
    const landingCut = secondPhrase && r.p >= stop ? stop : endCut;
    const span = Math.min(0.07, Math.abs(landingCut - r.p));
    const travel = fromReview === toReview ? 1 : clamp((cut - r.p) * Math.sign(endCut - startCut) / span);
    const q = lerp(Number(fromReview), Number(toReview), travel);
    // Keep the previous route's bill on the file until it reaches its destination.
    const inQueue = travel === 1 ? toReview : fromReview;
    const exposed = r.id === 'V3' || r.id === 'V4' ? openPair : r.p >= 0.8 ? openDesk : openRail;
    return { ...r, q, inQueue, charge: chargeFor(inQueue, r.label), exposed };
  });
  return { rows, cut, capacity, complete: rows.every((r) => r.exposed) };
}
function rack(
  c,
  state,
  { closing = false, billVisible = true, markV4 = false, markV8 = false } = {},
) {
  const { rows, cut, capacity, complete } = state;
  const col = (i) => 124 + i * 211,
    w = 181,
    yAuto = closing ? 329 : 344,
    yReview = closing ? 561 : 602;
  label(c, 'AUTOMATIC HANDLING', 100, 285, muted);
  label(c, 'REVIEW DESK   /   ' + capacity + ' SLOTS', 100, 549, teal);
  label(c, 'CUT   ' + f(cut, 2), 1822, 285, ink, 'right', 31);
  rect(c, 93, yAuto - 11, 1732, 175, '#d9dccc', 8);
  plate(c, 92, yReview - 14, 1735, 206);
  rows.forEach((r, i) => {
    const x = col(i);
    if (i < capacity) {
      rect(c, x - 2, yReview + 9, w + 4, 148, '#40565b', 6);
      label(c, 'SLOT ' + (i + 1), x + w / 2, yReview + 174, white, 'center', 24);
    } else if (r.q === 1) {
      label(c, 'WAITING', x + w / 2, yReview + 174, yellow, 'center', 22);
    }
    const y = lerp(yAuto, yReview, r.q);
    ticket(
      c,
      x,
      y,
      w,
      146,
      r.id,
      f(r.p),
      r.exposed ? (r.label ? 'Required' : 'Routine') : 'Sealed',
      r.exposed && r.label ? rust : teal,
    );
    const show =
      r.exposed && r.charge && (!closing || (r.id === 'V4' && markV4) || (r.id === 'V8' && markV8));
    if (show) {
      const X = x + w / 2;
      const top = y - 31;
      rect(c, X - 47, top, 94, 36, yellow, 7);
      text(c, cash(r.charge), X, top + 18, 26, ink, 'center', 'Mono', 600);
    }
  });
  const queue = rows.filter((r) => r.inQueue).length;
  const seated = rows.filter((r) => r.q === 1).length;
  const waiting = Math.max(0, seated - capacity);
  text(
    c,
    Math.min(seated, capacity) +
      ' / ' +
      capacity +
      ' slots filled' +
      (waiting ? '   ·   ' + waiting + ' waiting' : ''),
    100,
    closing ? 788 : 852,
    34,
    muted,
  );
  if (complete && billVisible && !closing) {
    const charges = rows.filter((r) => r.charge).map((r) => cash(r.charge));
    text(
      c,
      (queue > capacity ? 'If staffed   ' : '') +
        charges.join(' + ') +
        '  =  ' +
        cash(sum(rows.map((r) => r.charge))),
      1820,
      856,
      43,
      ink,
      'right',
      'Mono',
      600,
    );
  } else if (!closing && queue > capacity && seated === queue)
    text(c, queue - capacity + ' waiting', 1816, 854, 40, rust, 'right');
}
export function capacity(c, k) {
  const state = rackState(k),
    b = k.beat.beatIndex;
  board(c, 'Validation   /   staffed review desk', b === 4 || b === 5
    ? 'Which file takes slot five, and which file waits?'
    : 'Which cut fits the desk at the lowest cost?');
  const opened = [
    cue(k, 0, 'Use that bill', 0),
    cue(k, 1, 'Record that bill', 0),
    cue(k, 2, 'Which of the three', 0),
  ];
  c.save();
  c.translate(0, -94);
  rack(c, state, { billVisible: opened[1] === 1 });
  c.restore();
  const highCutRoutes = state.rows.every((r) => r.q === Number(r.p >= 0.8));
  if (b <= 1 && highCutRoutes && opened[0] === 1) {
    const q = policyAt(0.8);
    text(
      c,
      'Batch total   ' + q.counts.fn + ' misses × $120 = ' + cash(q.cost),
      1820,
      762,
      39,
      ink,
      'right',
      'Mono',
    );
  }
  const history = [0.8, 0.5, 0.2].filter((cut, i) => opened[i] === 1);
  for (const [i, cut] of history.entries()) {
    const q = policyAt(cut);
    label(
      c,
      f(cut, 2) + '    ' + q.queue + ' reviews    ' + cash(q.cost),
      104 + i * 594,
      810,
      q.queue > state.capacity ? rust : teal,
      'left',
      27,
    );
  }
}
export function close(c, k) {
  const b = k.beat.beatIndex,
    v4 = cue(k, 0, 'Open V four', 0.4) === 1,
    v8 = cue(k, 1, 'Open V eight', 0.4) === 1;
  const rows = routeRows(0.5).map((r) => ({
    ...r,
    q: Number(r.inQueue),
    exposed: r.inQueue ? v4 : v8,
  }));
  const complete = v4 && v8;
  board(
    c,
    'Case ledger   /   frozen cut 0.50',
    b === 2 ? 'The next batch gets the same cut' : 'Which two files carry the bill?',
  );
  const markV4 = cue(k, 0, 'to this unnecessary review', 0) === 1,
    markV8 = cue(k, 1, 'Add the two charges', 0) === 1;
  rack(c, { rows, cut: 0.5, capacity: 4, complete }, { closing: true, markV4, markV8 });
  label(c, 'CLOSED-CASE CHARGES', 1019, 590, '#c2d7c8');
  const mistakes = rows.filter(
    (r) => r.charge && ((r.id === 'V4' && markV4) || (r.id === 'V8' && markV8)),
  );
  mistakes.forEach((r, i) => {
    const y = 647 + 60 * i;
    text(
      c,
      r.id + '   ' + (r.inQueue ? 'Unnecessary review' : 'Missed review'),
      1020,
      y,
      33,
      white,
    );
    text(c, cash(r.charge), 1785, y, 36, yellow, 'right', 'Mono');
  });
  if (cue(k, 1, 'The four review slots', 0) === 1)
    text(
      c,
      'Total   ' + cash(sum(mistakes.map((r) => r.charge))),
      1819,
      790,
      59,
      ink,
      'right',
      'Mono',
      600,
    );
}
export function confusion(c, k) {
  board(c, 'Validation   /   eight closed requests', 'Where does each closed file belong?');
  const b = k.beat.beatIndex,
    entry = 8 * cue(k, 0, 'Route each request', 5.4);
  const sweep = cue(k, 1, 'Watch the crossed', 3.8),
    cut = 0.8 - 0.6 * sweep;
  const rows = validationScores.map((r, i) => {
    const col = validationScores.filter((v) => v.label === r.label).findIndex((v) => v.id === r.id);
    const targetX = (r.label ? 99 : 975) + col * 202 + 21;
    const routed = Math.max(0, Math.min(1, entry - i));
    const before = r.p >= 0.8,
      after = r.p >= 0.2;
    const crossing = (0.8 - r.p) / 0.6;
    const q =
      before === after ? Number(before) : Math.max(0, Math.min(1, (sweep - crossing) / 0.055));
    const review = q === 1;
    return {
      ...r,
      x: lerp(105 + i * 216, targetX, routed),
      y: lerp(262, lerp(742, 489, q), routed),
      seated: routed === 1 && (q === 0 || q === 1),
      key: review ? (r.label ? 'tp' : 'fp') : r.label ? 'fn' : 'tn',
    };
  });
  const cells = [
    ['Required · review', 'tp'],
    ['Routine · review', 'fp'],
    ['Required · automatic', 'fn'],
    ['Routine · automatic', 'tn'],
  ];
  for (const [i, [title, key]] of cells.entries()) {
    const x = 95 + (i % 2) * 876,
      y = 397 + Math.floor(i / 2) * 253;
    rect(c, x, y, 851, 212, key === 'fp' || key === 'fn' ? '#f1d9c8' : '#d6e3d4', 10);
    text(c, title, x + 24, y + 44, 37);
    label(
      c,
      key.toUpperCase() + '  ' + rows.filter((r) => r.seated && r.key === key).length,
      x + 824,
      y + 44,
      ink,
      'right',
      30,
    );
  }
  for (const r of rows) ticket(c, r.x, r.y, 164, 94, r.id, f(r.p), '', r.label ? rust : teal);
  if (b >= 1 || entry === 8) label(c, 'CUT  ' + f(cut, 3), 99, 306, ink, 'left', 37);
  if (b === 2) {
    const known = cue(k, 2, 'Multiply each kind', 0.7) === 1;
    const { counts, cost } = policyAt(cut);
    text(
      c,
      counts.fn +
        ' × $120    +    ' +
        counts.fp +
        ' × $18' +
        (known ? '    =    ' + cash(cost) : ''),
      1805,
      307,
      39,
      rust,
      'right',
      'Mono',
    );
  }
}

export function denominators(c, k) {
  const recall = cue(k, 1, 'Recall starts', 0.65) === 1;
  const rows = routeRows(0.2).filter((r) => (recall ? r.label : r.inQueue));
  board(
    c,
    'Queue metrics   /   cut 0.20',
    recall ? 'Which required cases did the desk catch?' : 'Who actually needed their review slot?',
  );
  rows.forEach((r, i) =>
    ticket(
      c,
      125 + 280 * i,
      369,
      228,
      237,
      r.id,
      f(r.p),
      r.label ? 'Required' : 'Routine',
      r.label ? rust : teal,
    ),
  );
  const hit = rows.filter((r) => r.label && r.inQueue).length;
  const show = recall ? cue(k, 1, 'Here all four', 0.5) : cue(k, 0, 'Four of six', 0.5);
  if (show === 1)
    readout(
      c,
      recall ? 'RECALL   /   ALL REQUIRED' : 'PRECISION   /   ALL REVIEWED',
      hit + ' / ' + rows.length + '   =   ' + f(hit / rows.length, 3),
      125,
      728,
    );
  if (cue(k, 1, 'Their harmonic mean', 0.6) === 1)
    readout(c, 'F1', f(harmonicFixture(4, 2, 0).f1, 2), 1360, 728);
}
export function costLines(c, k) {
  const cut = probabilityCost(0.2).cut;
  const probe =
    0.2 - 0.15 * cue(k, 3, 'Slide the probe', 1) + (cut - 0.05) * cue(k, 4, 'Bring the probe', 1.2);
  const b = k.beat.beatIndex,
    v = probabilityCost(probe);
  board(
    c,
    'Policy design   /   calibrated probability',
    'What does each route cost before the file closes?',
  );
  if (b === 7) {
    const rows = routeRows(cut);
    label(c, 'QUALIFYING REQUESTS AT ' + f(cut), 100, 315);
    rows
      .filter((r) => r.inQueue)
      .forEach((r, i) =>
        ticket(
          c,
          100 + i * 245,
          404,
          217,
          194,
          r.id,
          f(r.p),
          i < 4 ? 'Slot ' + (i + 1) : 'Waiting',
          i < 4 ? teal : rust,
        ),
      );
    readout(c, 'DESK CAPACITY', '4 slots', 100, 757);
    readout(
      c,
      'QUEUE AT BREAK-EVEN CUT',
      rows.filter((r) => r.inQueue).length + ' requests',
      935,
      757,
      rust,
    );
    return;
  }
  if (b === 0) {
    label(c, '20% CALIBRATED PROBABILITY', 105, 311, ink, 'left', 35);
    for (let i = 0; i < 5; i++) {
      const x = 117 + i * 338;
      rect(c, x, 426, 320, 165, i === 0 ? rose : sea, 8);
      text(
        c,
        i === 0 ? 'Required' : 'Routine',
        x + 160,
        509,
        47,
        i === 0 ? rust : teal,
        'center',
        'Serif',
      );
    }
    text(c, 'Expected mix over many similar requests', 960, 768, 52, muted, 'center', 'Serif');
    return;
  }
  const g = plot(c, {
    h: 421,
    xrange: [0, 0.31],
    yrange: [0, 40],
    xticks: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3],
    yticks: [0, 10, 20, 30, 40],
    xlabel: 'Chance review is required',
    ylabel: 'Expected charge ($)',
  });
  if (b >= 1) curve(c, g, (p) => probabilityCost(p).automatic, 0, 0.31, rust);
  if (b >= 2) curve(c, g, (p) => probabilityCost(p).review, 0, 0.31, teal);
  line(c, g.X(probe), g.Y(40), g.X(probe), g.Y(0), gold, 3);
  if (b >= 1) dot(c, ...g.xy(probe, v.automatic), 12, rust);
  if (b >= 2) dot(c, ...g.xy(probe, v.review), 12, teal);
  readout(c, 'P(REVIEW REQUIRED)', f(probe), 1280, 313);
  if (b >= 1) readout(c, 'AUTOMATIC   /   $120 × p', cash(v.automatic, 2), 1280, 478, rust);
  if (b >= 2) readout(c, 'REVIEW   /   $18 × (1 − p)', cash(v.review, 2), 1280, 602);
  if (b >= 5) label(c, 'Break-even  =  18 / 138', 1280, 779, ink, 'left', 29);
}
export const freshProb = [0.05, 0.18, 0.45, 0.75];
export function worksheet(c, k) {
  const b = k.beat.beatIndex;
  let cut = 0.3;
  if (cue(k, 4, 'Only N two', 0) === 1) cut = 0.1;
  if (cue(k, 5, 'Now raise the cut', 0) === 1) cut = 0.3;
  if (cue(k, 5, 'N three goes through', 0) === 1) cut = 0.6;
  if (cue(k, 6, 'The last two requests', 0) === 1) cut = 0.3;
  const policy = expectedPolicy(freshProb, cut, 12, 108, 2);
  const autosShown = cue(k, 3, 'The last two go', 0) === 1;
  const routed = cue(k, 3, 'For the first two', 0) === 1;
  board(c, 'Practice   /   two review slots', 'Price the four routes before the outcomes arrive');
  const cols = [245, 365, 365, 355, 335];
  gridTable(c, {
    x: 109,
    y: 265,
    columns: cols,
    headers: ['Request', 'Chance required', 'Automatic', 'Review', 'Chosen charge'],
    rowH: 89,
    rows: policy.rows.map((r) => {
      const v = probabilityCost(r.p, 12, 108);
      return [
        r.id,
        f(r.p, 2),
        cash(v.automatic, 2),
        b >= 1 ? cash(v.review, 2) : '·',
        routed || (!r.review && autosShown) ? (r.review ? 'R  ' : 'A  ') + cash(r.cost, 2) : '?',
      ];
    }),
    colors: [ink, blue, rust, teal, ink],
  });
  label(c, 'CUT  ' + f(cut, 2), 112, 766, ink, 'left', 37);
  if (routed) {
    text(
      c,
      policy.queue + (policy.queue === 1 ? ' review' : ' reviews') + ' / 2 slots',
      570,
      766,
      43,
      policy.feasible ? teal : rust,
    );
    const totaled = cue(k, 3, 'Keep this bill', 0) === 1;
    if (totaled)
      text(c, cash(policy.cost, 2) + ' expected', 1770, 766, 45, ink, 'right', 'Mono', 600);
    else if (cue(k, 3, 'For the two reviews', 0) === 1) {
      const subtotals = [false, true].map((review) =>
        sum(policy.rows.filter((r) => r.review === review).map((r) => r.cost)),
      );
      const reviewSubtotal = cue(k, 3, 'Together those four choices', 0) === 1 ? cash(subtotals[1], 2) : '?';
      text(c, cash(subtotals[0], 2) + ' + ' + reviewSubtotal, 1770, 766, 45, ink, 'right', 'Mono');
    }
  } else {
    text(c, 'Which charges will go on the bill?', 1800, 766, 42, ink, 'right', 'Serif');
  }
  for (const [i, test] of [0.3, 0.1, 0.6].entries()) {
    const seen = [
      cue(k, 3, 'Keep this bill', 0),
      cue(k, 4, 'That brings the bill down', 0.4),
      cue(k, 5, 'That leaves one review', 0.4),
    ][i];
    if (seen === 1) {
      const q = expectedPolicy(freshProb, test, 12, 108, 2);
      label(
        c,
        f(test, 2) + '   ' + q.queue + (q.queue === 1 ? ' slot   ' : ' slots   ') + cash(q.cost, 2),
        110 + 589 * i,
        807,
        q.feasible ? teal : rust,
        'left',
        29,
      );
    }
  }
}
export function checkDispatch() {
  const clock = (beatIndex, active = {}) => ({
    beat: { beatIndex },
    reveal: (phrase) => active[phrase] ?? 0,
  });
  assert(Math.abs(gate(clock(1, { 'Bring the gate': 1 })) - 0.65) < 1e-12);
  assert(
    gate(clock(2)) > openingRequest.p && gate(clock(2, { 'Slide past': 1 })) < openingRequest.p,
  );
  const initial = rackState(clock(0, { 'At point eight': 1, 'Open the first two files': 1 }));
  assert(initial.rows.filter((r) => r.id === 'V3' || r.id === 'V4').every((r) => !r.exposed));
  const hidden = rackState(clock(1, { 'Follow V three': 1 })).rows;
  const opened = rackState(clock(1, { 'Follow V three': 1, 'Now open their outcomes': 1 })).rows;
  for (const id of ['V4', 'V3']) {
    assert(hidden.find((r) => r.id === id).q === 1 && !hidden.find((r) => r.id === id).exposed);
    assert(opened.find((r) => r.id === id).exposed);
  }
  // The comparison reuses closed outcomes. Each arrival changes only that file's charge.
  const bill = (state) => sum(state.rows.map((r) => r.charge));
  for (const [b, first, second, capacity] of [
    [2, 'Lower the cut', 'Keep going', 4],
    [5, 'Lower the cut again', 'Keep lowering', 5],
    [7, 'Lower the cut', 'Continue to point two', 6],
  ]) {
    const before = rackState(clock(b));
    const fifth = rackState(clock(b, { [first]: 1 }));
    const sixth = rackState(clock(b, { [first]: 1, [second]: 1 }));
    assert.equal(before.capacity, capacity);
    assert.deepEqual([before, fifth, sixth].map(bill), [138, 156, 36]);
    for (const s of [before, fifth, sixth]) assert(s.rows.every((r) => r.exposed));
    assert.deepEqual(fifth.rows.filter((r) => r.id === 'V6' || r.id === 'V8')
      .map((r) => [r.id, r.q, r.charge]), [['V6', 1, 18], ['V8', 0, 120]]);
    assert.deepEqual(sixth.rows.filter((r) => r.inQueue).slice(4).map((r) => r.id), ['V6', 'V8']);
  }
  for (const [b, phrase] of [[3, 'Choose one half'], [6, 'keep one half']]) {
    assert.equal(bill(rackState(clock(b))), 36);
    assert.equal(bill(rackState(clock(b, { [phrase]: 1 }))), 138);
  }
  assert.equal(f(openingRequest.p), '0.624');
  for (const [cut, ids, charged] of [
    [
      0.8,
      ['V7', 'V5'],
      [
        ['V3', 120],
        ['V8', 120],
      ],
    ],
    [
      0.5,
      ['V7', 'V5', 'V4', 'V3'],
      [
        ['V4', 18],
        ['V8', 120],
      ],
    ],
    [
      0.2,
      ['V7', 'V5', 'V4', 'V3', 'V6', 'V8'],
      [
        ['V4', 18],
        ['V6', 18],
      ],
    ],
  ]) {
    const rows = routeRows(cut);
    assert.deepEqual(
      rows.filter((r) => r.inQueue).map((r) => r.id),
      ids,
    );
    assert.deepEqual(
      rows.filter((r) => r.charge).map((r) => [r.id, r.charge]),
      charged,
    );
    assert.equal(sum(rows.map((r) => r.charge)), policyAt(cut).cost);
  }
  for (const [cut, total, queue] of [
    [0.1, 24.84, 3],
    [0.3, 34.44, 2],
    [0.6, 76.44, 1],
  ]) {
    const pol = expectedPolicy(freshProb, cut, 12, 108, 2);
    assert.equal(f(pol.cost, 2), f(total, 2));
    assert.equal(pol.queue, queue);
  }
}
