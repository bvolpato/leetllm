import {
  C,
  base,
  card,
  rect,
  line,
  type,
  pen,
  mono,
  mid,
  stamp,
  circle,
  heading,
  phase,
  ease,
} from './atelier.mjs';
import { TRIALS, ECONOMIC_RUNS } from '../../../films/agent-evaluation/fixtures.mjs';
import { choose, repeatEstimates, wilson } from '../../../films/agent-evaluation/arithmetic.mjs';
export { TRIALS, ECONOMIC_RUNS, repeatEstimates, wilson };
export const runs = ECONOMIC_RUNS;
export const sorted = [...runs].sort((a, b) => a.seconds - b.seconds || a.id.localeCompare(b.id));
export const passed = runs.filter((r) => r.pass).length,
  allTasks = TRIALS.filter((t) => t.pass.every(Boolean)).length;
export const cents = (rs) => rs.reduce((s, r) => s + Math.round(r.cost * 1000), 0) / 10;
const asCents = (v) => String(Number(v.toFixed(3))) + '¢';
function mark(c, x, y, ok, id, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  circle(c, 0, 0, 40, ok ? C.green : C.red);
  if (ok) {
    line(c, -17, 1, -5, 14, C.sheet, 7);
    line(c, -5, 14, 17, -14, C.sheet, 7);
  } else {
    line(c, -14, -14, 14, 14, C.sheet, 7);
    line(c, -14, 14, 14, -14, C.sheet, 7);
  }
  if (id) mid(c, id, 0, 82, 25, C.ink);
  c.restore();
}
function runRows(c, visible, group, aggregate) {
  const X = [688, 860, 1032];
  X.forEach((x, i) => mono(c, 'TRY ' + (i + 1), x - 42, 318, 26));
  TRIALS.forEach((task, i) => {
    const Y = 450 + 158 * i;
    const allPassed = task.pass.every(Boolean);
    card(c, 111, Y - 80, 1110, 136, group && allPassed ? C.light : C.sheet);
    pen(c, task.task, 153, Y + 8, 48, C.ink, 405);
    task.pass.forEach((ok, j) => {
      if (i < visible) mark(c, X[j], Y - 21, ok, 'R' + (i * 3 + j + 1), 0.78);
      else line(c, X[j] - 21, Y, X[j] + 21, Y, C.rule);
    });
    if (group) {
      stamp(
        c,
        allPassed ? 'All three pass' : 'One fails',
        1311,
        Y - 49,
        allPassed ? C.green : C.red,
      );
    }
  });
  if (aggregate) mono(c, aggregate, 127, 947, 36, C.ink, 1660);
}
export function reliability(c, k) {
  base(c);
  const b = k.beat.beatIndex;
  heading(
    c,
    'NINE ILLUSTRATIVE RUNS',
    b === 0 ? 'Which task passed on every try?' : 'Count one result per task',
  );
  runRows(
    c,
    phase(k, 0, 'Each row follows one task') ? TRIALS.length : 0,
    !!phase(k, 1, 'Only the catalog search'),
    b === 2
      ? 'Fixed model, tools, environment, sampling   /   equal weight per task'
      : phase(k, 1, 'One task out of three')
        ? allTasks + ' / ' + TRIALS.length + ' tasks passed every repeat'
        : phase(k, 0, 'Seven of the nine')
          ? passed + ' / ' + runs.length + ' individual runs passed'
          : null,
  );
}
const practice = [0.02, 0.04, 0.05, 0.07].map((cost, i) => ({
  id: 'R' + (i + 1),
  cost,
  pass: i < 3,
}));
export const practiceSpend = cents(practice);
export const practicePasses = practice.filter((r) => r.pass).length;
function costChart(c, rs, checked) {
  const gap = rs.length > 4 ? 155 : 240,
    x0 = rs.length > 4 ? 185 : 215,
    Y = 783,
    scale = rs.length > 4 ? 78 : 54;
  line(c, x0 - 60, Y, x0 + gap * (rs.length - 1) + 69, Y, C.rule);
  rs.forEach((r, i) => {
    const x = x0 + gap * i,
      h = r.cost * 100 * scale;
    rect(c, x - 40, Y - h, 80, h, r.pass ? C.green : C.red, 3);
    mid(c, asCents(r.cost * 100), x, Y - h - 17, 32);
    mono(c, r.id, x - 23, Y + 47, 27);
    if (checked) mid(c, r.pass ? 'pass' : 'fail', x, Y + 90, 26, r.pass ? C.green : C.red);
  });
}
export function economics(c, k) {
  base(c);
  const b = k.beat.beatIndex;
  if (b >= 4) {
    heading(c, 'PRACTICE   /   FOUR NEW RUNS', 'What was the cost per successful run?');
    costChart(c, practice, true);
    if (b === 5) {
      pen(c, asCents(practiceSpend) + ' ÷ ' + practicePasses, 1160, 480, 74);
      if (phase(k, 5, 'six cents per success'))
        pen(
          c,
          '= ' + asCents(practiceSpend / practicePasses) + ' per success',
          1160,
          584,
          78,
          C.green,
          640,
        );
      if (phase(k, 5, 'safety gate'))
        stamp(c, 'Forbidden attempt  ·  Block', 1184, 706, C.red, 645);
    }
    return;
  }
  if (b === 3) {
    heading(c, 'PRODUCT COMPARISON', 'Keep the workload and budgets comparable');
    runRows(c, 3, false, '9 attempted runs   /   7 successes   /   3 distinct tasks');
    return;
  }
  if (b === 2) {
    const order = phase(k, 2, 'ascending order', 2.4),
      rank = phase(k, 2, 'ninth time'),
      deadline = phase(k, 2, 'within six seconds');
    heading(c, 'LATENCY   /   SAME RUN IDS', 'Order the observed durations');
    const xAt = (i) => 170 + 190 * i,
      Y = 814,
      unit = 45;
    runs.forEach((r, i) => {
      const rankIndex = sorted.indexOf(r);
      const placed = rankIndex < Math.floor(order * sorted.length);
      const sourceX = xAt(i);
      rect(c, sourceX - 83, 279, 166, 79, placed ? C.light : C.sheet, 4);
      mid(c, r.id + ' / ' + r.seconds + ' s', sourceX, 331, 31);
      if (!placed) return;
      const x = xAt(rankIndex),
        top = Y - r.seconds * unit;
      rect(c, x - 38, top, 76, Y - top, rank && rankIndex === 8 ? C.red : C.sea, 4);
      mid(c, r.seconds + ' s', x, top - 14, 33);
      mono(c, r.id, x - 23, Y + 48, 28);
    });
    if (deadline) {
      const y = Y - 6 * unit;
      line(c, 100, y, 1810, y, C.wood, 4);
      mono(c, '6 s deadline', 128, y - 16, 27, C.wood);
    }
    mono(
      c,
      rank
        ? 'ceil(0.95 × 9) = 9    /    p95 = ' + sorted.at(-1).seconds + ' seconds'
        : 'Nearest-rank p95    /    9 observations',
      106,
      949,
      36,
    );
    return;
  }
  heading(c, 'INCURRED COST   /   ALL ATTEMPTS', 'Keep the charges for failed runs');
  costChart(c, runs, !!phase(k, 0, 'Count the seven'));
  mono(
    c,
    asCents(cents(runs)) +
      ' total spend' +
      (phase(k, 0, 'Count the seven') ? '   /   ' + passed + ' successes' : ''),
    112,
    317,
    36,
  );
  if (b === 1 && phase(k, 1, 'two point nine'))
    stamp(
      c,
      asCents(cents(runs)) +
        ' ÷ ' +
        passed +
        ' = ' +
        asCents(cents(runs) / passed) +
        ' per success',
      1030,
      274,
      C.green,
      930,
    );
}
function combinations(items, k) {
  if (k === 0) return [[]];
  return items.flatMap((item, i) =>
    combinations(items.slice(i + 1), k - 1).map((t) => [item, ...t]),
  );
}
export function groups(flags, k) {
  return combinations(
    flags.map((_, i) => i),
    k,
  ).map((ids) => ({ ids, all: ids.every((i) => flags[i]), any: ids.some((i) => flags[i]) }));
}
const patch = [false, true, false, false, true],
  pair = [true, true, true, true, false, false];
export const taskProbabilities = [0.8, 0.4];
const pooledRate = taskProbabilities.reduce((a, p) => a + p, 0) / taskProbabilities.length;
export const allTwo = taskProbabilities.reduce((a, p) => a + p * p, 0) / taskProbabilities.length;
function groupSheet(c, flags, k, scored, showAll = false) {
  const list = groups(flags, k),
    cols = 5;
  flags.forEach((v, i) => {
    const x = 174 + i * 173;
    mid(c, String(i + 1), x, 356, 34);
    mark(c, x, 414, v, null, 0.61);
  });
  list.forEach((g, i) => {
    const x = 106 + (i % cols) * 340,
      y = 510 + Math.floor(i / cols) * 96;
    card(
      c,
      x,
      y,
      302,
      78,
      scored ? (g.any ? (showAll && g.all ? C.green : C.light) : C.rose) : C.sheet,
    );
    mid(
      c,
      g.ids.map((n) => n + 1).join('   '),
      x + 151,
      y + 51,
      36,
      scored && showAll && g.all ? C.sheet : C.ink,
    );
  });
  if (scored)
    mono(
      c,
      list.filter((g) => g.any).length +
        ' / ' +
        list.length +
        ' contain a pass' +
        (showAll
          ? '      ' +
            list.filter((g) => g.all).length +
            ' / ' +
            list.length +
            ' contain only passes'
          : ''),
      110,
      914,
      37,
    );
}
export function estimators(c, k) {
  base(c);
  const b = k.beat.beatIndex;
  if (b < 2) {
    heading(c, 'ALL-k   /   ONE TASK AT A TIME', 'Choose three from each row');
    TRIALS.forEach((t, i) => {
      const y = 390 + i * 169;
      pen(c, t.task, 112, y + 26, 48, C.ink, 400);
      t.pass.forEach((ok, j) => mark(c, 607 + j * 133, y, ok, null, 0.84));
      if (b > 0) {
        const n = t.pass.length,
          v = t.pass.filter(Boolean).length,
          est = repeatEstimates(n, v, 3);
        mono(
          c,
          'C(' + v + ',3) / C(' + n + ',3) = ' + est.all,
          1112,
          y + 12,
          35,
          est.all ? C.green : C.red,
        );
      }
    });
    mono(
      c,
      b ? 'Equal-task mean   =   (1 + 0 + 0) / 3' : 'C(n, k) counts the groups of k reruns from n',
      109,
      935,
      35,
    );
    return;
  }
  if (b === 2 || b === 3) {
    heading(c, 'PATCH SEARCH   /   AT LEAST ONE PASS', 'Choose three of the five patches');
    groupSheet(c, patch, 3, !!phase(k, 3, 'only miss'));
    return;
  }
  if (b === 4) {
    heading(c, 'SAMPLING PROTOCOL', 'The second patch sees the first result');
    const labels = ['Patch 1', 'Test feedback', 'Revised patch'];
    labels.forEach((v, i) => {
      const x = 123 + i * 594;
      card(c, x, 419, 445, 189, i === 1 ? C.lavender : C.sheet);
      mid(c, v, x + 223, 530, 49);
      if (i < 2) {
        line(c, x + 445, 512, x + 577, 512, C.ink, 5);
      }
    });
    mono(c, 'Record the dependency before estimating pass@k.', 126, 800, 37);
    return;
  }
  if (b === 5 || b === 6) {
    heading(c, 'FIXED TASK   /   INDEPENDENT TRIALS', 'How often do all three succeed?');
    [1, 2, 3].forEach((n, i) => {
      const y = 376 + i * 165,
        w = 1020;
      pen(c, n + ' required', 116, y + 47, 44);
      rect(c, 562, y, w, 64, C.rule, 5);
      const ready =
        i === 0 ||
        (i === 1 && phase(k, 5, 'forty-nine percent')) ||
        (i === 2 && phase(k, 6, 'point three four three'));
      if (ready) {
        const p = 0.7 ** n;
        rect(c, 562, y, w * p, 64, C.green, 5);
        mid(c, Number((p * 100).toFixed(1)) + '%', 1690, y + 47, 42, C.green);
      }
    });
    if (phase(k, 6, 'point six five seven'))
      mono(c, 'At least one failure   =   1 − 0.343   =   0.657', 120, 930, 36);
    return;
  }
  if (b === 7 || b === 8) {
    if (phase(k, 8, 'simulated user')) {
      heading(c, 'REPRODUCING A TRIAL', 'Record the simulator with the task');
      card(c, 276, 338, 1365, 484);
      [
        ['Task', 'hold / B7'],
        ['Simulator', 'reader simulator v1'],
        ['Trial seed', '205'],
        ['Initial state', 'snapshot v2'],
      ].forEach(([l, v], i) => {
        mono(c, l, 335, 428 + 95 * i, 36);
        pen(c, v, 837, 434 + 95 * i, 49);
      });
      return;
    }
    heading(c, 'EQUAL TASK WEIGHTS   /   INDEPENDENT REPEATS', 'Preserve the task being repeated');
    [1, 0].forEach((p, i) => {
      const x = 128 + i * 865;
      card(c, x, 362, 802, 284);
      pen(c, 'Task ' + (i ? 'B' : 'A'), x + 35, 436, 53);
      mono(c, 'p = ' + p + '     all three = ' + p + '³', x + 36, 535, 36);
    });
    if (phase(k, 7, 'Half the tasks'))
      mono(c, 'Mean of task powers   =   (1³ + 0³) / 2   =   0.5', 130, 760, 39, C.green);
    if (phase(k, 7, 'one eighth'))
      mono(c, 'Power of pooled rate  =   ((1 + 0) / 2)³  =   0.125', 130, 856, 36, C.red);
    return;
  }
  if (b === 11) {
    heading(c, 'INDEPENDENT REPEATS WITHIN EACH TASK', 'Average the task-specific probabilities');
    const squared = phase(k, 11, 'Square each probability');
    taskProbabilities.forEach((p, i) => {
      const y = 398 + i * 170;
      pen(c, 'Task ' + (i ? 'B' : 'A'), 123, y + 47, 48);
      rect(c, 485, y, 900, 66, C.rule, 3);
      rect(c, 485, y, 900 * p, 66, C.sea, 3);
      if (squared) rect(c, 485, y, 900 * p * p, 66, C.green, 3);
      mono(c, squared ? p + '² = ' + (p * p).toFixed(2) : 'p = ' + p, 1441, y + 48, 36);
    });
    if (phase(k, 11, 'average to point four'))
      stamp(c, 'Equal-task all-two   ' + allTwo.toFixed(2), 126, 751, C.green);
    if (phase(k, 11, 'point three six'))
      mono(
        c,
        'Pooled shortcut   ' + pooledRate.toFixed(1) + '² = ' + (pooledRate ** 2).toFixed(2),
        1002,
        806,
        35,
        C.red,
      );
    return;
  }
  heading(c, 'TRANSFER   /   SIX FIXED-PROTOCOL TRIALS', 'Which pairs belong in each numerator?');
  groupSheet(c, pair, 2, b === 10, true);
}
export const samples = [
    [2, 3],
    [27, 30],
    [21, 21],
    [22, 22],
  ],
  floor = 0.85;
const z = 1.96;
export function bounds(i) {
  const [a, n] = samples[i];
  return { ...wilson(a, n, z), a, n, rate: a / n };
}
function allPassComparison(c, k) {
  const left = 662;
  const right = 1522;
  const halfRange = 0.01;
  const xAt = (p) => left + ((p - floor + halfRange) / (2 * halfRange)) * (right - left);
  const floorX = xAt(floor);
  const axisY = 779;
  heading(
    c,
    'WILSON INTERVAL   /   INDEPENDENT WORKLOAD CASES',
    'Does the lower endpoint reach the floor?',
  );
  mono(c, '95% interval   /   z = ' + z, 128, 328, 34);
  mono(c, 'All pass   L = n / (n + z²)', 987, 328, 38, C.ink);
  mid(c, 'Floor  ' + floor.toFixed(3), floorX, 402, 38, C.ink);
  line(c, floorX, 426, floorX, axisY, '#ab781c', 6);
  line(c, left, axisY, right, axisY, C.ink, 3);
  for (const tick of [floor - halfRange, floor, floor + halfRange]) {
    const x = xAt(tick);
    line(c, x, axisY - 10, x, axisY + 10, C.ink, 3);
    mid(c, tick.toFixed(3), x, axisY + 48, 36);
  }
  mono(c, 'Lower endpoint scale, enlarged near the floor', left, 871, 30, C.muted, 935);

  const planned = phase(k, 5, 'If all twenty-two pass');
  const substitute = phase(k, 4, 'Put twenty-one');
  const resultPhrases = [
    'The lower endpoint is about point eight four five',
    'the lower endpoint rises to point eight five one',
  ];
  const verdictPhrase = 'That clears the same floor';
  const clearsFloor =
    k.beat.beatIndex === 5 &&
    k.reveal(verdictPhrase, 0, { captionStart: verdictPhrase }) &&
    k.elapsed >= k.wordCue(verdictPhrase).end;
  resultPhrases.forEach((phrase, i) => {
    const { a, n, lower, rate } = bounds(2 + i);
    const y = 500 + i * 168;
    const speaking = k.beat.beatIndex === 5 && k.reveal(phrase, 0, { captionStart: phrase });
    if (i === 1 && !planned) return;
    pen(c, (i === 1 ? 'If ' : '') + a + ' of ' + n + ' pass', 128, y, 52, C.ink, 500);
    mono(c, 'Pass rate  ' + (rate * 100).toFixed(0) + '%', 128, y + 45, 32);
    if (i === 1 || substitute)
      mono(c, 'L = ' + n + ' / (' + n + ' + ' + z + '²)', 128, y + 92, 34);
    line(c, left, y, right, y, C.rule, 3);
    if (!speaking) return;
    const sinceResult = k.elapsed - k.wordCue(phrase).end;
    if (sinceResult < 0) return;
    const pass = lower >= floor;
    const verdictVisible = !pass || clearsFloor;
    const color = pass ? (verdictVisible ? C.green : C.ink) : C.red;
    const x = xAt(lower);
    const gap = ease(Math.min(1, sinceResult / 0.55));
    line(c, x, y, x + (floorX - x) * gap, y, color, 8);
    circle(c, x, y, 13, color);
    type(
      c,
      lower.toFixed(3),
      x + (pass ? 22 : -22),
      y - 25,
      43,
      color,
      'Mono',
      pass ? 'left' : 'right',
    );
    if (verdictVisible)
      stamp(c, pass ? 'PASS · L ≥ floor' : 'FAIL · L < floor', 1552, y - 37, color, 276);
  });
}
export function uncertainty(c, k) {
  base(c);
  const b = k.beat.beatIndex;
  if (b >= 6) {
    heading(
      c,
      'WORKLOAD SAMPLING',
      b === 6 ? 'Twelve reruns share three tasks' : 'Keep each attempted run in the record',
    );
    for (let i = 0; i < 3; i++) {
      const x = 119 + i * 588;
      card(c, x, 362, 507, 360);
      pen(c, 'Task ' + (i + 1), x + 28, 440, 52);
      for (let j = 0; j < 4; j++) {
        const X = x + 66 + j * 120;
        circle(c, X, 552, 42, b === 7 && i === 2 && j === 3 ? C.red : C.sea);
        mid(c, String(j + 1), X, 565, 32, C.sheet);
      }
      mono(c, '1 task cluster', x + 28, 667, 29);
    }
    if (b === 7) stamp(c, 'Crashes and exhausted attempts count', 112, 806, C.ink, 1100);
    return;
  }
  if (b >= 4) {
    allPassComparison(c, k);
    return;
  }
  const sel = phase(k, 2, 'new sample') ? 1 : 0;
  const sample = bounds(sel),
    showCenter = sel !== 0 || phase(k, 1, 'center lands'),
    display =
      sel === 0
        ? phase(k, 1, 'Extend that distance')
        : phase(k, 3, 'Their interval runs');
  const xAt = (p) => 158 + p * 1585,
    y = 661;
  heading(
    c,
    'WILSON INTERVAL   /   INDEPENDENT WORKLOAD CASES',
    'Does the lower endpoint reach the floor?',
  );
  pen(c, sample.a + ' of ' + sample.n + ' pass', 132, 370, 72);
  mono(c, '95% interval    z = ' + z, 133, 432, 32);
  if (sel === 0 && showCenter) {
    mono(c, 'c = (p̂ + z²/(2n)) / (1 + z²/n)', 845, 332, 33, C.green, 970);
    if (phase(k, 1, 'radius sets'))
      mono(c, 'r = z √[p̂(1−p̂)/n + z²/(4n²)] / (1 + z²/n)', 845, 396, 30, C.green, 965);
    mono(
      c,
      'center ' +
        sample.center.toFixed(3) +
        (phase(k, 1, 'radius sets') ? '   radius ' + sample.radius.toFixed(3) : ''),
      845,
      450,
      31,
    );
  }
  const floorOn = !!phase(k, 2, 'yellow line');
  if (floorOn) {
    const X = xAt(floor);
    line(c, X, 479, X, 797, '#ab781c', 7);
    mono(c, 'floor 0.85', X - 92, 466, 28, '#835500');
  }
  line(c, xAt(0), y + 114, xAt(1), y + 114, C.ink, 3);
  for (let i = 0; i <= 10; i++) {
    const X = xAt(i / 10);
    line(c, X, y + 105, X, y + 128, C.ink, 3);
    mid(c, (i / 10).toFixed(1), X, y + 169, 27);
  }
  if (showCenter && sel === 0) circle(c, xAt(sample.center), y, 12, C.green);
  circle(c, xAt(sample.rate), y + 66, 12, C.ink);
  mono(c, 'p̂ ' + sample.rate.toFixed(2), xAt(sample.rate) + 24, y + 77, 28);
  if (display) {
    const L = xAt(sample.lower),
      R = xAt(sample.upper);
    line(c, L, y, R, y, C.green, 13);
    for (const [X, v] of [
      [L, sample.lower],
      [R, sample.upper],
    ]) {
      line(c, X, y - 26, X, y + 26, C.green, 7);
      const nearFloor = floorOn && Math.abs(X - xAt(floor)) < 65;
      const labelX = nearFloor ? X + (v < floor ? -64 : 64) : X;
      mid(c, v.toFixed(3), labelX, y - 47, 34, C.green);
    }
    if (sel === 1 && phase(k, 3, 'falls short')) {
      const pass = sample.lower >= floor;
      stamp(
        c,
        pass ? 'Uncertainty gate passes' : 'Lower endpoint below floor',
        126,
        879,
        pass ? C.green : C.red,
        1020,
      );
    }
  }
}
