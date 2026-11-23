import assert from 'node:assert/strict';
import {
  P,
  axis,
  background,
  beat,
  clamp,
  cue,
  dot,
  end,
  heading,
  label,
  line,
  mark,
  percent,
  pin,
  plate,
  points,
  rect,
  sum,
  ticket,
} from './drawing.mjs';
import { bounds, gate, ruler } from './routing.mjs';

const planned = (m, epsilon) => Math.ceil(Math.log((2 * m) / 0.05) / (2 * epsilon * epsilon));
const plans = [
  { m: 1, e: 0.05, goal: 'One frozen router' },
  { m: 1000, e: 0.1, goal: 'A fixed pool' },
  { m: 1000, e: 0.05, goal: 'A fixed pool' },
  { m: 1000, e: 0.025, goal: 'Excess error ≤ 5 points' },
];
const users = [[1], Array(9).fill(0)];
const userMeans = users.map((v) => sum(v) / v.length);
function rolls(c, y, count, max) {
  const x = 654,
    w = 1035;
  rect(c, x, y - 19, w, 38, P.metal, 9);
  const size = (w * count) / max;
  rect(c, x, y - 19, size, 38, P.paper, 6);
  for (let pos = 14; pos < size - 3; pos += 22) dot(c, x + pos, y + 9, 3, P.metal);
  pin(c, x + size, y, P.gold, 9);
}
export function planning(c, k) {
  background(c);
  const b = beat(k);
  if (b <= 5) {
    heading(
      c,
      'Order the evaluation batch',
      'Two-sided 95% precision    ·    round the sufficient sample count up',
    );
    label(c, 'n  ≥  ln(2M / δ) / (2ε²)', 960, 239, 46, P.cream, 'center', 'Mono');
    const n = b < 3 ? 1 : b - 1;
    const cues = [
      cue(k, 1, 'That gives', 1.2),
      cue(k, 3, 'same formula gives', 1.2),
      cue(k, 4, 'At five points', 1.2),
      cue(k, 5, 'count goes up', 1.4),
    ];
    for (let i = 0; i < n; i++) {
      const s = plans[i],
        y = 330 + i * 147,
        count = planned(s.m, s.e);
      label(c, s.goal, 130, y - 14, 39, P.cream, 'left', 'Serif');
      label(
        c,
        'M = ' + s.m.toLocaleString('en-US') + '    ε = ' + points(s.e, 1),
        130,
        y + 41,
        31,
        P.dim,
      );
      rolls(c, y, Math.round(count * cues[i]), planned(1000, 0.025));
      if (cues[i] === 1)
        label(c, count.toLocaleString('en-US'), 1764, y + 55, 35, P.gold, 'right', 'Mono');
    }
  } else {
    heading(c, 'Who gets equal weight?', 'One user has a single turn. The other has nine.');
    users.forEach((losses, i) => {
      const y = 388 + i * 200;
      label(c, 'User ' + (i + 1), 143, y, 44, P.cream, 'left', 'Serif');
      losses.forEach((v, j) => {
        rect(c, 425 + j * 111, y - 52, 89, 104, P.paper, 8);
        mark(c, 469 + j * 111, y, v, 23, true);
      });
      label(c, sum(losses) + ' / ' + losses.length, 1690, y, 47, P.gold, 'right', 'Mono');
    });
    const user = cue(k, 6, 'and you get fifty percent', 1),
      turn = cue(k, 6, 'and you get ten percent', 1);
    if (user === 1)
      label(
        c,
        'Equal users     (100% + 0%) / 2 = ' + percent(sum(userMeans) / 2),
        132,
        782,
        40,
        P.good,
      );
    if (turn === 1)
      label(
        c,
        'Equal turns     1 / 10 = ' + percent(sum(users.flat()) / users.flat().length),
        995,
        782,
        40,
        P.blue,
      );
  }
}

const stackSize = 41,
  stacks = 18,
  batchN = stackSize * stacks,
  batchMisses = 89;
const heldOut = bounds(batchMisses, batchN, 1);
const losses = Array.from(
  { length: batchN },
  (_, i) => Math.floor(((i + 1) * batchMisses) / batchN) - Math.floor((i * batchMisses) / batchN),
);
function scored(n) {
  const count = Math.max(0, Math.min(batchN, Math.floor(n)));
  return { count, wrong: sum(losses.slice(0, count)) };
}
function bundles(c, n, y0) {
  const { count, wrong } = scored(n);
  for (let j = 0; j < stacks; j++) {
    const x = 133 + j * 94;
    rect(c, x, y0, 81, 212, P.metal, 8);
    for (let i = 0; i < 41; i++) {
      const id = j * 41 + i,
        xp = x + 12 + (i % 5) * 14,
        yp = y0 + 23 + Math.floor(i / 5) * 20;
      if (id < count) mark(c, xp, yp, losses[id], 6.1);
      else dot(c, xp, yp, 2, P.seam);
    }
    label(c, j + 1, x + 41, y0 + 240, 24, P.dim, 'center', 'Mono');
  }
  label(
    c,
    count === 0
      ? '18 sealed stacks    ·    41 tickets per stack'
      : wrong + ' misses   /   ' + count + ' scored',
    960,
    y0 + 305,
    43,
    P.gold,
    'center',
    'Serif',
  );
}
export function holdout(c, k) {
  background(c);
  const b = beat(k);
  heading(
    c,
    'P7’s independent release check',
    'Development chose P7    /    the target queue supplies the final tickets',
  );
  if (b <= 2) {
    const frozen = cue(k, 1, 'freeze P seven', 0.65) === 1;
    plate(c, 127, 268, 1665, 146);
    label(c, frozen ? 'P7 frozen' : 'P7 from development', 196, 340, 46, P.cream, 'left', 'Serif');
    if (frozen)
      label(
        c,
        'Release only if upper bound < ' + percent(gate),
        1721,
        340,
        39,
        P.pink,
        'right',
        'Mono',
      );
    bundles(c, b === 1 ? 0 : batchN * cue(k, 2, 'Open the stacks', 6.6), 487);
  } else {
    const revised = b === 5 && cue(k, 5, 'fix P seven', 0.5) === 1;
    label(
      c,
      revised ? 'P7’s original evaluation' : 'P7 frozen',
      120,
      292,
      47,
      P.cream,
      'left',
      'Serif',
    );
    label(c, '89 / 738 misses    ·    95% two-sided', 1755, 295, 38, P.dim, 'right');
    const clears = cue(k, 4, 'P seven clears', 0.8) === 1;
    let extend = Number(b > 4);
    if (b === 4) {
      const start = k.wordCue('extend the bound').start;
      const end = k.wordCue('Its upper end is about seventeen point zero six percent').end;
      extend = clamp((k.elapsed - start) / (end - start));
    }
    ruler(c, {
      s: heldOut,
      extend,
      completed: extend === 1,
      min: 0.1,
      max: 0.24,
      ticks: [0.1, 0.12, 0.14, 0.16, 0.18, 0.2, 0.22, 0.24],
      y: 602,
    });
    if (b === 3)
      label(
        c,
        'Allowance ≈ 5 percentage points. Does the upper end clear the gate?',
        960,
        371,
        39,
        P.gold,
        'center',
        'Serif',
      );
    if (b === 4 && cue(k, 4, 'Those earlier', 0.1) && clears)
      label(
        c,
        'Fresh evidence clears the gate for frozen P7.',
        960,
        371,
        44,
        P.good,
        'center',
        'Serif',
      );
    if (b === 5)
      label(
        c,
        revised
          ? 'Revised prompt   →   freeze again   →   new independent tickets'
          : 'This decision belongs to the frozen version.',
        960,
        371,
        41,
        P.gold,
        'center',
        'Serif',
      );
  }
}

const routine = 0.1,
  launch = 0.3;
const mixed = (share) => (1 - share) * routine + share * launch;
export function audit(c, k) {
  background(c);
  const b = beat(k);
  if (b <= 2) {
    heading(c, 'How many draws are in this report?', 'Each entry has a prediction and a label.');
    ticket(c, 118, 422, 485, 225, 'Ticket 38', 'Source request', '38');
    const n = 1 + Math.floor(39 * cue(k, 1, 'copies ticket thirty eight', 3));
    for (let i = 0; i < n; i++) {
      const x = 773 + (i % 10) * 100,
        y = 321 + Math.floor(i / 10) * 105;
      rect(c, x, y, 78, 85, P.paper, 4);
      label(c, '38', x + 39, y + 44, 36, P.ink, 'center', 'Mono');
    }
    label(
      c,
      n + (n === 1 ? ' scored row' : ' scored rows'),
      1280,
      823,
      49,
      P.cream,
      'center',
      'Serif',
    );
    if (b === 2 && cue(k, 2, 'Its thirty nine copies', 0.3))
      label(c, '1 independent draw', 360, 750, 45, P.pink, 'center', 'Serif');
  } else if (b <= 4) {
    heading(
      c,
      'The queue changed underneath the router',
      'Conditional error stays fixed    ·    routine 10%    ·    launch 30%',
    );
    [0.25, 0.75].forEach((s, i) => {
      if (i === 1 && !cue(k, 3, 'This week', 0.3)) return;
      const x = 438,
        y = 408 + i * 244,
        w = 1092;
      label(c, i ? 'This week' : 'Last year', 115, y + 43, 38, P.cream);
      rect(c, x, y, w * (1 - s), 86, P.blue);
      rect(c, x + w * (1 - s), y, w * s, 86, P.gold);
      label(c, percent(1 - s) + ' routine', x + (w * (1 - s)) / 2, y + 44, 34, P.ink, 'center');
      label(c, percent(s) + ' launch', x + w * (1 - s / 2), y + 44, 34, P.ink, 'center');
      if (b === 4 && cue(k, 4, 'with the same router', 0.15))
        label(c, percent(mixed(s)) + ' error', 1655, y + 44, 35, P.cream, 'center');
    });
    if (b === 4)
      label(
        c,
        'Population risk = routine share × 10% + launch share × 30%',
        960,
        803,
        41,
        P.dim,
        'center',
      );
  } else {
    if (b === 5 && !cue(k, 5, 'replay a failing', 0.1)) {
      heading(
        c,
        'Which comparison went wrong?',
        'Different discrepancies call for different checks.',
      );
      const showTest = cue(k, 5, 'If the validation winner', 0.2) === 1;
      const rows = [
        ['Training', 'Low error'],
        ['Validation', showTest ? 'Low error after search' : 'High error'],
        ['Test', showTest ? 'High error' : 'Unopened'],
      ];
      rows.forEach(([name, v], i) => {
        const xx = 140 + i * 585;
        plate(c, xx, 365, 472, 226);
        label(c, name, xx + 236, 431, 45, P.paper, 'center', 'Serif');
        label(c, v, xx + 236, 527, 34, P.gold, 'center');
      });
      label(
        c,
        showTest
          ? 'Inspect validation reuse and compare case difficulty.'
          : 'Inspect fit, cohorts, labels and preprocessing.',
        960,
        756,
        43,
        P.cream,
        'center',
      );
    } else {
      heading(
        c,
        'Replay one request along both paths',
        'Keep the incoming ticket fixed. Compare the destinations each path chooses.',
      );
      ticket(c, 119, 455, 460, 187, 'Charged twice', 'Same request', '03');
      const paths = [
        ['Offline', 'Billing', P.blue],
        ['Production', 'Account Access', P.pink],
      ];
      paths.forEach(([name, dest, col], i) => {
        const y = 350 + i * 292;
        line(c, 580, 550, 843, y + 65, P.seam, 7);
        plate(c, 847, y - 14, 897, 152);
        label(c, name, 903, y + 62, 41, P.cream, 'left', 'Serif');
        if (b === 6 && cue(k, 6, i ? 'to Account Access' : 'to Billing', 0.45))
          label(c, dest, 1669, y + 62, 44, col, 'right');
      });
      if (b === 6)
        label(
          c,
          'Compare prompt revision and input text, then traffic mix and monitoring labels.',
          960,
          815,
          37,
          P.dim,
          'center',
        );
    }
  }
}

const frozen = bounds(130, 1000, 1),
  searched = bounds(130, 1000, 1000);
const releaseRows = [
  {
    bound: frozen,
    name: 'P8 frozen first',
    selection: 'One prompt fixed before the draw',
    question: 'Does this fresh batch',
    resultBeat: 3,
    operation: 'Add that allowance',
    answer: 'The upper end is about seventeen point two nine percent',
    verdict: 'Yes this batch clears the gate for the frozen router',
  },
  {
    bound: searched,
    name: 'P8 won the search',
    selection: searched.m.toLocaleString('en-US') + ' prompts compared here',
    question: 'Does this batch still',
    resultBeat: 5,
    operation: 'add the search allowance',
    answer: 'The upper end reaches twenty point two eight percent',
    verdict: 'That crosses the release gate',
  },
];

function releaseProgress(k, row) {
  const b = beat(k);
  if (b < row.resultBeat) return { fraction: 0, settled: false, decided: false };
  if (b > row.resultBeat) return { fraction: 1, settled: true, decided: true };
  const draw = k.reveal(row.operation, 1.1, { captionStart: row.answer });
  const { start, end } = k.wordCue(row.verdict);
  const verdict = k.reveal(row.verdict, end - start, { captionStart: row.verdict });
  const finish = clamp((k.elapsed - k.wordCue(row.answer).end) / 0.48);
  // Keep the moving bar short of the gate until the narrator finishes reading the endpoint.
  return {
    fraction: 0.7 * draw + 0.3 * finish,
    settled: finish === 1,
    decided: finish === 1 && verdict === 1,
  };
}

export function release(c, k) {
  background(c);
  heading(
    c,
    'Does P8 clear the gate?',
    'Two-sided 95% upper bound    ·    independent draws from the target queue',
  );
  plate(c, 115, 222, 1690, 98);
  const reuse = cue(k, 4, 'Keep the same tickets', 0) === 1;
  const seen = cue(k, 1, 'The yellow dot', 0) === 1;
  label(
    c,
    reuse ? 'Same evaluation batch' : 'Evaluation batch',
    167,
    271,
    42,
    P.paper,
    'left',
    'Serif',
  );
  if (seen)
    label(
      c,
      frozen.errors + ' misses  /  ' + frozen.n.toLocaleString('en-US') + ' tickets',
      1746,
      271,
      43,
      P.gold,
      'right',
      'Mono',
    );

  const axisY = 767;
  const ticks = [0.12, 0.14, 0.16, 0.18, gate, 0.22];
  const x = axis(c, 640, 1790, axisY, ticks[0], ticks.at(-1), ticks, (v) => percent(v));
  const observedX = x(frozen.observed);
  const gateX = x(gate);
  line(c, gateX, 389, gateX, axisY - 4, P.pink, 4);
  label(c, percent(gate) + ' gate', gateX, 360, 40, P.pink, 'center');
  if (seen) line(c, observedX, 389, observedX, axisY - 4, P.brass, 4);
  if (cue(k, 1, 'Keep the two sided', 0) === 1)
    label(c, percent(frozen.observed) + ' observed', observedX, 360, 40, P.gold, 'center');

  for (const [i, row] of releaseRows.entries()) {
    if (i === 1 && cue(k, 4, 'P eight had the fewest misses', 0) !== 1) continue;
    const y = 463 + i * 212;
    const { bound } = row;
    label(c, row.name, 134, y - 29, 46, P.paper, 'left', 'Serif');
    label(c, row.selection, 134, y + 21, 34, P.dim);
    if (cue(k, row.resultBeat - 1, row.question, 0) === 1)
      label(c, 'Allowance  ' + points(bound.radius), 134, y + 70, 37, P.gold, 'left', 'Mono');
    if (!seen) continue;

    const { fraction, settled, decided } = releaseProgress(k, row);
    const endpoint = x(bound.upper);
    rect(c, observedX, y - 7, (endpoint - observedX) * fraction, 14, P.blue);
    pin(c, observedX, y, P.gold, 16);
    if (!settled) continue;

    const verdictColor = bound.passes ? P.good : P.pink;
    if (decided && !bound.passes) rect(c, gateX, y - 7, endpoint - gateX, 14, P.pink);
    line(c, endpoint, y - 24, endpoint, y + 24, decided ? verdictColor : P.blue, 7);
    label(
      c,
      percent(bound.upper, 2),
      bound.passes ? endpoint : endpoint + 18,
      y - 48,
      51,
      P.cream,
      bound.passes ? 'center' : 'left',
      'Mono',
      600,
    );
    if (decided)
      label(
        c,
        bound.passes ? 'Clears gate' : 'Release unproven',
        (bound.passes ? endpoint : gateX) - 22,
        y + 53,
        38,
        verdictColor,
        'right',
        'Serif',
      );
  }

  if (cue(k, 6, 'Freeze P eight', 0) === 1)
    label(c, 'Freeze P8 and draw fresh tickets', 945, 359, 35, P.cream, 'left', 'Serif');
}

export function checkEvaluation() {
  assert.deepEqual(
    plans.map((s) => planned(s.m, s.e)),
    [738, 530, 2120, 8478],
  );
  assert.deepEqual(userMeans, [1, 0]);
  assert.equal(sum(users.flat()) / users.flat().length, 0.1);
  for (let n = 0; n <= batchN; n++)
    assert.equal(scored(n).wrong, Math.floor((n * batchMisses) / batchN));
  assert.equal(batchN, 738);
  assert.equal(percent(heldOut.upper, 2), '17.06%');
  assert.equal(percent(mixed(0.25)), '15%');
  assert.equal(percent(mixed(0.75)), '25%');
  assert.equal(frozen.observed, searched.observed);
  assert.equal(frozen.errors, searched.errors);
  assert.equal(frozen.n, searched.n);
  assert.equal(points(frozen.radius), '4.29 pp');
  assert.equal(points(searched.radius), '7.28 pp');
  assert.equal(percent(frozen.upper, 2), '17.29%');
  assert.equal(percent(searched.upper, 2), '20.28%');
  assert.ok(frozen.passes && !searched.passes);
}
