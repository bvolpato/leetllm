import {
  label,
  mid,
  num,
  title,
  rect,
  oval,
  polygon,
  line,
  arrow,
  sheet,
  rows,
  ground,
  tally,
  cue,
  beat,
  ease,
  mix,
  signed,
  ink,
  mute,
  teal,
  rust,
  paper,
  gray,
  ruler,
} from './drawing.mjs';
import { mouse, board, flag, orange, purple } from './apparatus.mjs';
import {
  opening,
  ledger,
  shaping,
  potential,
  qSlip,
  tapeState,
  RS_TAPES,
  controlState,
} from './study.mjs';

function lane(
  c,
  y,
  pos,
  arm,
  facing = 1,
  spin = 0,
  { x = 270, pitch = 221, scale = 1, goal = true } = {},
) {
  board(c, y, x, pitch, 6);
  if (goal) flag(c, x + 6 * pitch + 68, y, +(pos === 6), arm);
  mouse(c, x + pos * pitch, y, scale, facing, spin, 0, arm);
}
export function race(c, k) {
  ground(c);
  const m = opening(k);
  label(c, 'Seed 14   /   Trip 3', 104, 105, 54, ink, 'Serif');
  const counter = m.settled
    ? '12 of 12 moves'
    : m.finish > 0
      ? 'Final move'
      : m.arrival === 1
        ? '1 move left'
        : 'Move 11 of 12';
  num(c, counter, 1800, 105, 48, ink, 'right');
  [purple, orange].forEach((arm, i) => {
    const y = 425 + i * 350;
    label(c, i ? 'Distance feedback' : 'Goal reward only', 120, y - 210, 43, arm.ink, 'Sans', 600);
    lane(c, y, m.pos[i], arm, i === 0 && m.finish > 0 ? -1 : 1, m.pos[i] * 7, { scale: 1.12 });
    if (m.settled) num(c, i ? '1 goal' : '0 goals', 1780, y + 105, 39, arm.ink, 'right');
    if (i && cue(k, 2, 'distance to the goal')) {
      label(c, 'Distance on move 12', 126, y + 124, 38, mute);
      num(c, '1 square → 0', 539, y + 124, 44, arm.ink);
    }
  });
}

export function paperStudy(c, k) {
  ground(c, 'desk');
  const b = beat(k),
    adapt = cue(k, 0, 'We borrowed'),
    pass2 = cue(k, 1, 'On the second'),
    pass3 = b >= 2;
  sheet(c, 115, 112, 849, 755);
  sheet(c, 976, 151, 826, 749, '#fff4d9');
  label(c, 'Policy invariance', 170, 226, 78, ink, 'Serif');
  label(c, 'Ng, Harada & Russell  ·  1999', 174, 310, 33, mute);
  line(c, 174, 365, 899, 365, mute, 2);
  label(c, 'Transition reward', 172, 438, 37, teal);
  num(c, 'F = γ Φ(next) − Φ(start)', 172, 534, 46, ink, 'left', 733);
  label(c, 'Preserves optimal policies', 172, 659, 42);
  label(c, 'under the theorem’s assumptions.', 172, 721, 35, mute);
  if (adapt) {
    label(c, 'Corridor study', 1035, 255, 70, ink, 'Serif');
    rows(
      c,
      1043,
      390,
      691,
      [
        ['Learner', 'Q table'],
        ['Environment', '7 squares'],
        ['Measure', 'early goals / 30'],
      ],
      pass2 ? 2 : b === 0 ? 1 : -1,
      94,
    );
  }
  if (b === 1) {
    label(
      c,
      pass2 ? 'Pass 2   Inspect assumptions and units' : 'Pass 1   Identify the claim',
      168,
      809,
      34,
      teal,
    );
  }
  if (pass3) {
    label(c, 'Pass 3   Reconstruct a move', 168, 809, 34, teal);
    num(c, '0 → 1     F ≈ +0.208', 1043, 735, 40);
  }
  if (b >= 3) label(c, 'Cause of a seed loss?  Open.', 1043, 822, 34, rust);
}
export function earlyPairs(c, k) {
  ground(c, 'work');
  title(c, 'Goals in the first 30 trips');
  for (const [i, seed] of [14, 6].entries()) {
    if (i && beat(k) < 1) continue;
    const x = 112 + i * 865,
      y = 240;
    sheet(c, x, y, 810, 580);
    label(c, 'Seed ' + seed, x + 43, y + 84, 62, ink, 'Serif');
    const row = ledger[seed];
    [row.sparse, row.shaped].forEach((v, a) => {
      const visible = i
        ? cue(k, 1, a ? 'shaped learner reached' : 'purple reached')
        : cue(k, 0, a ? 'With shaping' : 'Purple reached');
      const yy = y + 190 + 155 * a,
        col = a ? orange.ink : purple.ink;
      label(c, a ? 'Shaped' : 'Sparse', x + 46, yy, 39, col);
      if (visible) {
        num(c, v + ' / 30', x + 758, yy, 39, col, 'right');
        tally(c, x + 46, yy + 39, 713, v, 30, col);
      } else line(c, x + 46, yy + 90, x + 749, yy + 90, gray, 2);
    });
    if (cue(k, i, i ? 'Same corridor' : 'twenty extra goals'))
      num(c, signed(row.gain) + ' goals', x + 48, y + 511, 45, row.gain < 0 ? rust : teal);
  }
  if (beat(k) >= 2)
    label(c, 'Both pairs enter the mean with equal weight.', 129, 913, 46, ink, 'Serif');
}
export function predicates(c, k) {
  ground(c, 'plot');
  const b = beat(k);
  title(c, b === 0 ? 'One difference per seed' : 'The decision written into the plan');
  if (b === 0) {
    const row = ledger[14];
    num(c, 'Seed 14', 128, 333, 54);
    label(c, 'Shaped', 360, 502, 46, orange.ink);
    label(c, 'Sparse', 820, 502, 46, purple.ink);
    num(c, row.shaped + ' / 30   −   ' + row.sparse + ' / 30   =   +20 / 30', 351, 633, 60);
    label(c, 'Average all 24 differences.', 350, 820, 44, teal);
    return;
  }
  const nine = b === 2 && cue(k, 2, 'Try a mean') && !cue(k, 2, 'Now try'),
    thirteen = b === 2 && cue(k, 2, 'Now try');
  const current = nine
    ? { mean: 9, low: 2, high: 16 }
    : thirteen || b === 3
      ? { mean: 13, low: 4, high: 22 }
      : null;
  label(c, 'Early gain   /   mean ≥ +10 and lower limit > 0', 133, 285, 47);
  ruler(c, { y: 418, min: -5, max: 25, ticks: [-5, 0, 5, 10, 15, 20, 25], guide: 10, ...current });
  if (nine && cue(k, 2, 'Nine still falls short')) num(c, '9 < 10', 1450, 302, 40, rust);
  const fail = thirteen && cue(k, 2, 'extends three points');
  label(
    c,
    b === 3
      ? 'Claiming a gain above ten points'
      : 'Final similarity   /   mean and entire interval within ±2',
    133,
    668,
    47,
  );
  if (b === 3) {
    num(c, 'Lower 90% limit > +10 points', 165, 822, 59, teal);
    return;
  }
  ruler(c, {
    y: 802,
    min: -4,
    max: 4,
    ticks: [-4, -2, 0, 2, 4],
    band: [-2, 2],
    ...(fail ? { low: -3, mean: 0.5, high: 1.5 } : {}),
  });
}

export function history(c, k) {
  ground(c, 'desk');
  const b = beat(k);
  title(c, 'When did the plan close?');
  const labels =
    b === 0
      ? ['Inspect pilots', 'Lock plan', 'Collect untouched seeds']
      : ['Original plan', 'Observed output', 'Bug found', 'Corrected run'];
  const xs = labels.map((_, i) => 200 + (i * 1450) / (labels.length - 1));
  line(c, xs[0], 386, xs.at(-1), 386, ink, 5);
  labels.forEach((t, i) => {
    oval(c, xs[i], 386, 18, 18, i === 1 ? rust : teal);
    mid(c, t, xs[i], 460, 38, ink, 395);
  });
  sheet(c, 148, 540, 1620, 348);
  if (b === 0) {
    const pilot = cue(k, 0, 'Suppose we saw');
    rows(
      c,
      205,
      638,
      1485,
      pilot
        ? [
            ['Already seen', '80, 81'],
            ['Proposed sample', '80, 81, 82, 83'],
          ]
        : [
            ['Worked evidence', 'seeds 0 through 23'],
            ['New confirmation', 'reserve unseen seeds before collection'],
          ],
      pilot ? 0 : -1,
      120,
    );
  } else {
    rows(
      c,
      205,
      620,
      1485,
      [
        ['Before collection', 'timestamped read-only plan'],
        ['After a discovered bug', 'preserve invalid rows and amendment'],
        [
          'Corrected comparison',
          b === 2 ? 'amended evidence · reserve fresh seeds' : 'rerun every pair',
        ],
      ],
      Math.min(b, 2),
      97,
    );
  }
}
export function boundary(c, k) {
  ground(c, 'blue');
  if (beat(k) === 1 && !cue(k, 1, 'Synthetic inputs')) {
    const reviewed = cue(k, 1, 'machine paths');
    const localRoot = '/Users/learner/study/';
    const packagePath = 'rows/seed-06.csv';
    title(c, 'Which part of this path belongs to one machine?');
    sheet(c, 114, 225, 1692, 592);
    label(c, 'Local output in the study folder', 206, 339, 48, ink);
    num(c, localRoot, 206, 445, 64, reviewed ? rust : ink);
    const fileX = 206 + c.measureText(localRoot).width;
    num(c, packagePath, fileX, 445, 64);
    if (reviewed) {
      line(c, 206, 496, fileX, 496, rust, 6);
      label(c, 'From the package root', fileX, 612, 48, ink);
      num(c, packagePath, fileX, 714, 64, teal);
    }
    return;
  }
  title(c, 'A local corridor simulator');
  rect(c, 114, 225, 1100, 540, '#354f52');
  rect(c, 145, 257, 1038, 472, '#eff0df');
  label(c, 'CPU   /   NumPy', 187, 329, 46, teal, 'Mono');
  board(c, 541, 280, 128, 6);
  const step = cue(k, 0, 'left and right', 1);
  mouse(c, 280 + 128 * step, 541, 0.8, 1, 8 * step, 0, orange);
  label(c, 'Generated states     Left or right', 207, 656, 41);
  polygon(
    c,
    [
      [520, 765],
      [790, 765],
      [830, 831],
      [478, 831],
    ],
    '#354f52',
  );
  line(c, 438, 832, 870, 832, ink, 15);
  label(c, 'Run inputs', 1283, 322, 59, ink, 'Serif');
  const items = ['Configuration', 'Random tapes', '7 states', '0 live accounts'];
  items.forEach((v, i) => {
    label(c, v, 1285, 445 + 86 * i, 38, i === 3 ? teal : ink, 'Sans', 500, 'left', 530);
  });
}
export function environment(c, k) {
  ground(c);
  const b = beat(k);
  title(c, ['Intended move and landing', 'Two ways to end collection', 'The training budget'][b]);
  if (b === 2) {
    const x = 155,
      y = 330;
    for (let j = 0; j < 80; j++)
      rect(c, x + (j % 40) * 40, y + Math.floor(j / 40) * 122, 28, 85, j < 30 ? teal : '#b9baaa');
    label(c, 'First 30 trips   /   early success', x, 621, 48, teal);
    label(c, 'All 80 trips   /   learned table', x, 713, 48);
    num(c, 'γ = 0.95       α = 0.35       ε = 0.20', x, 863, 51);
    return;
  }
  const slip = cue(k, 0, 'A slip', 0.85),
    cap = cue(k, 1, 'also stops'),
    reset = b === 0 && !cue(k, 0, 'Action zero');
  const pos = b === 0 ? (reset ? 0 : 1 - ease(slip)) : cap ? 3 : 6;
  lane(c, 525, pos, orange, b === 0 && slip > 0 ? -1 : 1, 8 * pos);
  rows(
    c,
    154,
    724,
    1570,
    b === 0
      ? [
          ['Starting square', reset ? '0 · reset' : '1 · intended right'],
          [
            'Observed landing',
            reset
              ? 'ready'
              : slip === 1
                ? '0 · slip reversed direction'
                : slip > 0
                  ? 'in transit'
                  : 'right choice pending',
          ],
        ]
      : [
          ['Last move', cap ? '2 → 3   /   move 12' : '5 → 6   /   arrival'],
          ['Environment reward', cap ? '0   ·   truncated' : '1   ·   terminated'],
        ],
    1,
    99,
  );
}
export function bonus(c, k) {
  ground(c, 'plot');
  const back = cue(k, 1, 'Reverse that step', 0.85),
    forward = cue(k, 1, 'Try the first step right', 0.85),
    stay = cue(k, 1, 'push left against');
  title(c, 'Distance to the flag');
  const x = 260,
    pitch = 219;
  for (let i = 0; i <= 6; i++) {
    const yy = 590 - i * 32;
    rect(c, x + i * pitch - 62, yy, 124, 688 - yy, '#c9d8c9');
    num(c, i, x + i * pitch, 726, 34, ink, 'center');
  }
  const pos = mix(forward, 0, back);
  mouse(
    c,
    x + pos * pitch,
    590 - pos * 32,
    1.06,
    back > 0 || stay ? -1 : 1,
    9 * pos + 2 * stay,
    0,
    orange,
  );
  flag(c, x + 6 * pitch + 61, 590 - 6 * 32, 0, orange);
  num(c, 'Φ(s) = −(6 − s) / 6', 117, 230, 43);
  num(c, 'F = 0.95 Φ(next) − Φ(start)', 1780, 186, 43, teal, 'right');
  if (beat(k) === 1) {
    const from = back > 0 && !stay ? 1 : 0,
      to = stay || back > 0 ? 0 : 1,
      settled = stay || back === 1 || (!back && forward === 1);
    label(c, stay ? 'At the wall' : back ? 'Return' : 'Forward', 142, 809, 52, ink, 'Serif');
    if (settled) {
      num(c, from + ' → ' + to + '     F = ' + signed(shaping(from, to), 3), 671, 809, 54, teal);
      num(c, 'Goal reward = 0', 141, 899, 42, mute);
    }
  }
}
export function telescoping(c, k) {
  ground(c, 'plot');
  const b = beat(k);
  title(c, 'What survives along a path?');
  if (b < 2) {
    const canceled = cue(k, 1, 'cancel');
    const parts = [
      ['−Φ₀', '+ γΦ₁'],
      ['− γΦ₁', '+ γ²Φ₂'],
      ['− γ²Φ₂', '+ γ³Φ₃'],
    ];
    parts.forEach((pair, i) => {
      const x = 180 + i * 530;
      label(c, 'Step ' + (i + 1), x, 340, 40, mute);
      num(c, pair[0], x, 471, 63);
      num(c, pair[1], x, 589, 63, teal);
      if (canceled && i < 2) {
        line(c, x - 7, 589, x + 218, 589, rust, 5);
        line(c, x + 523, 471, x + 754, 471, rust, 5);
      }
    });
    num(c, canceled ? 'Sum = −Φ₀ + γ³Φ₃' : 'Each step contributes γ^t × F', 179, 826, 62);
    return;
  }
  if (b === 2) {
    for (const [i, path] of [
      [0, [0, 1, 2, 3, 4, 5, 6]],
      [1, [0, 1, 0, 1, 2, 3, 4, 5, 6]],
    ]) {
      const y = 365 + 270 * i;
      label(c, i ? 'Detour' : 'Direct', 129, y, 48, ink, 'Serif');
      path.forEach((s, j) => {
        const xx = 428 + j * 116;
        oval(c, xx, y, 38, 38, paper);
        num(c, s, xx, y, 37, ink, 'center');
        if (j < path.length - 1) arrow(c, xx + 40, y, xx + 75, y, gray, 3);
      });
      num(c, '+1', 1630, y, 67, teal);
    }
    mid(c, 'Both start at Φ = −1 and finish at Φ = 0.', 960, 886, 46);
    return;
  }
  const capped = cue(k, 3, 'Stop instead');
  num(c, 'Total = −Φ(start) + γ^T Φ(end)', 148, 326, 61);
  rows(
    c,
    167,
    495,
    1550,
    [
      ['Starting potential', '−0.75'],
      ['Three steps', 'γ = 0.8'],
      ['End potential', capped ? '−0.25   ·   collection cap' : '0   ·   terminal goal'],
      ['Discounted addition', capped ? '0.75 − 0.128 = 0.622' : '0.75 + 0 = 0.750'],
    ],
    3,
    101,
  );
}
export function limits(c, k) {
  ground(c);
  title(c, 'What survives the last collected step?');
  label(c, 'Sparse update   /   R is the original goal reward', 133, 215, 36, mute);
  const task = beat(k) === 1 && cue(k, 1, 'If a deadline');
  const vals = task
    ? [['Timed task', 'State includes moves remaining', 'Deadline expires', 'Target = reward']]
    : [
        [
          'Collection cap',
          'Move 12 lands on square 3',
          'Future value remains',
          'Target = R + γ max Q(3, ·)',
        ],
        ['True goal', 'Arrival on square 6', 'Task terminates', 'Target = R'],
      ];
  vals.forEach(([name, condition, why, formula], i) => {
    const x = 135 + 830 * i;
    sheet(c, x, 276, 780, 561);
    label(c, name, x + 49, 371, 65, ink, 'Serif');
    label(c, condition, x + 48, 480, 41, mute);
    line(c, x + 50, 550, x + 711, 550, gray, 2);
    label(c, why, x + 48, 630, 43, teal);
    num(c, formula, x + 48, 746, 45, ink, 'left', 690);
  });
  if (task) {
    board(c, 600, 1040, 116, 6);
    flag(c, 1780, 600, 0, orange);
    label(c, 'Score within 12 moves', 1000, 760, 41);
  }
}
export function qtable(c, k, actual) {
  ground(c, 'blue');
  const b = beat(k),
    next = actual
      ? cue(k, 2, 'next-state maximum point four')
        ? 0.4
        : 0
      : cue(k, 1, 'Supply a next value')
        ? 0.4
        : 0;
  const alpha = actual ? 0.35 : 0.2,
    calc = qSlip(alpha, next);
  title(c, actual ? 'Write the study update' : 'Which action owns this update?');
  const slip = actual ? 1 : cue(k, 0, 'An action can slip', 0.85);
  const earned = actual
    ? next
      ? cue(k, 2, 'would rise to')
      : cue(k, 1, 'updated entry becomes')
    : !!cue(k, 1, 'With a next value');
  const targetKnown = actual
    ? next
      ? cue(k, 2, 'The target becomes')
      : cue(k, 1, 'The target is that term')
    : earned;
  board(c, 502, 227, 152, 2);
  mouse(c, 227 + (1 - slip) * 152, 502, 0.88, slip > 0 ? -1 : 1, slip * 5, 0, orange);
  label(c, 'Start 1   /   chose right', 150, 622, 40);
  label(
    c,
    slip === 1 ? 'Landed on 0' : slip ? 'Slip in progress' : 'Waiting for move',
    150,
    699,
    36,
    teal,
  );
  sheet(c, 840, 242, 928, 535);
  label(c, 'Q at square 1', 901, 335, 60, ink, 'Serif');
  rows(
    c,
    900,
    466,
    798,
    [
      ['Left', '0.00000'],
      ['Right', earned ? signed(calc.updated, 5) : '0.00000'],
    ],
    1,
    105,
  );
  num(c, 'α = ' + alpha.toFixed(2) + '     max Q(0, ·) = ' + next.toFixed(1), 900, 690, 33, mute);
  if (targetKnown) {
    num(
      c,
      'Target ≈ −0.11667 + 0.95 × ' + next.toFixed(1) + ' ≈ ' + signed(calc.target, 5),
      130,
      840,
      43,
      ink,
    );
    if (earned)
      num(
        c,
        'New Q = old Q + α × (target − old Q) ≈ ' + signed(calc.updated, 5),
        130,
        921,
        43,
        teal,
      );
  }
}
export function tapes(c, k) {
  ground(c, 'work');
  const b = beat(k),
    m = tapeState(k),
    x = 350,
    w = 119,
    gap = 80;
  title(c, b === 0 ? 'Two copies of one continuous tape' : 'One row for each trip');
  num(
    c,
    b === 0 ? 'Hypothetical trip lengths' : 'Seed 0   /   slip tape',
    1795,
    220,
    36,
    mute,
    'right',
  );
  for (const [i, arm] of [purple, orange].entries()) {
    const y = 300 + i * 273,
      n = m.used[i],
      joined = b === 0;
    label(c, i ? 'Shaped' : 'Sparse', 100, joined ? y + 46 : y - 33, 47, arm.ink, 'Serif');
    if (joined) {
      for (let j = 0; j < 13; j++) {
        const xx = 312 + j * 111;
        rect(c, xx, y + 4, 107, 100, j < n ? arm.ink : paper, '#a9a08c');
        num(c, j + 1, xx + 53, y + 53, 39, j < n ? paper : ink, 'center');
      }
      if (m.continuous) {
        const xx = 312 + n * 111 + 53;
        polygon(
          c,
          [
            [xx, y + 104],
            [xx - 13, y + 123],
            [xx + 13, y + 123],
          ],
          arm.ink,
        );
        mid(c, 'Next draw ' + (n + 1), Math.min(xx, 1680), y + 157, 36, arm.ink);
      }
      continue;
    }
    for (let row = 0; row < 2; row++) {
      const yy = y + row * gap;
      num(c, 'Trip ' + (row + 1), x - 32, yy + 34, 30, mute, 'right');
      for (let j = 0; j < 12; j++) {
        const xx = x + j * w,
          spent = row === 0 && j < n;
        rect(
          c,
          xx,
          yy,
          w - 2,
          66,
          spent ? arm.ink : row === 0 ? '#fff8e4' : '#f1d69c',
          '#afa997',
          1,
        );
        oval(c, xx + 9, yy + 8, 2.8, 2.8, spent ? '#d3c2b1' : '#b7a98c');
        num(
          c,
          RS_TAPES.slip[row][j].toFixed(2),
          xx + w / 2,
          yy + 35,
          32,
          spent ? paper : ink,
          'center',
        );
      }
    }
    const [readerRow, readerColumn] = m.pointers[i];
    const px = x + (readerColumn + 0.5) * w;
    const py = y + readerRow * gap;
    rect(c, px - w / 2 + 2, py + 1, w - 6, 63, null, arm.ink, 5);
    polygon(
      c,
      [
        [px, py + 66],
        [px - 14, py + 86],
        [px + 14, py + 86],
      ],
      arm.ink,
    );
    if (!i && m.jump === 1) {
      label(c, '6 unused', x + 9 * w, y - 28, 32, arm.ink, 'Sans', 600, 'center');
    }
  }
  if (b === 0) label(c, 'One draw per move taken', 127, 910, 44, mute);
  else if (b === 1)
    label(c, '80 trips × 12 moves     /     explore, action, tie-break, slip', 127, 910, 42);
  else if (m.fourth === 1) {
    num(c, '0.058 < 0.15', 119, 896, 50, teal);
    if (cue(k, 2, 'That draw reverses')) {
      label(c, 'Choose left  →  move right', 641, 894, 39);
      label(c, 'Choose right  →  move left', 1240, 894, 39);
    }
  }
}
export function control(c, k) {
  ground(c, 'blue');
  const b = beat(k),
    m = controlState(k);
  if (b === 5) {
    title(c, 'Freeze both tables');
    for (const [i, arm] of [purple, orange].entries()) {
      const y = 330 + i * 268;
      label(c, i ? 'Shaped' : 'Sparse', 155, y, 51, arm.ink);
      board(c, y + 92, 650, 159, 6);
      flag(c, 1659, y + 90, 0, arm);
    }
    label(c, 'Greedy actions   ·   same evaluation slips   ·   goal reward only', 152, 894, 45);
    return;
  }
  title(c, 'Zero-potential control');
  label(c, 'Constructed transition   /   starting square 1, choose right', 116, 239, 38, mute);
  const hasMove = m.slipped || b === 1;
  board(c, 505, 184, 183, 2);
  mouse(c, 184 + (hasMove ? m.successor : 1) * 183, 505, 0.93, m.slipped ? -1 : 1, 3, 0, orange);
  label(
    c,
    hasMove ? (m.slipped ? 'Slip sends the mouse left' : 'Mouse goes right') : 'Ready to move',
    124,
    632,
    39,
  );
  num(c, 'α = 0.35    γ = 0.95', 124, 738, 37);
  num(c, 'R = 0    max Q′ = 0.4', 124, 808, 37);
  sheet(c, 803, 295, 984, 515);
  label(c, 'Q at square 1', 856, 373, 57, ink, 'Serif');
  mid(c, 'Left', 1321, 467, 37, mute);
  mid(c, 'Right', 1612, 467, 37, mute);
  for (const [i, vs] of m.rows.entries()) {
    const yy = 556 + 122 * i;
    label(c, i ? 'Zero Φ' : 'Sparse', 852, yy, 41, i ? orange.ink : purple.ink);
    vs.forEach((v, j) => {
      const xx = 1196 + j * 291;
      rect(c, xx, yy - 39, 250, 78, v ? '#f5dda0' : '#e8e6d9');
      num(c, v.toFixed(3), xx + 125, yy, 46, ink, 'center');
    });
  }
  const outcome = m.settled
    ? m.match
      ? 'Entries match'
      : 'Different action credited'
    : b === 2
      ? 'Which entry gets the update?'
      : b === 3
        ? 'Sparse update recorded'
        : 'Tables reset';
  label(c, outcome, 838, 897, 51, m.settled && !m.match ? rust : teal, 'Serif');
}
