import {
  bench,
  rect,
  chip,
  line,
  dot,
  txt,
  mono,
  pill,
  frame,
  foot,
  poly,
  opacity,
  cue,
  on,
  mix,
  smooth,
  paper,
  ink,
  muted,
  teal,
  gold,
  coral,
  lilac,
  blue,
} from './bench.mjs';
import {
  captureState,
  graphPrices,
  graphCost,
  firstWin,
  receipt,
  practiceMeans,
  updateState,
} from './fixtures.mjs';

export function capture(c, k) {
  if (k.beat.beatIndex === 0) {
    bench(
      c,
      'plot',
      'What does a graph launch submit?',
      'CUDA GRAPH   /   device-to-device pipeline',
    );
    const cap = cue(k, 0, 'Capture records'),
      inst = cue(k, 0, 'Instantiation prepares'),
      launch = cue(k, 0, 'One launch', 1.4);
    txt(c, inst === 1 ? 'Executable graph' : 'Stream operations', 110, 322, 47);
    const labels = ['Copy', '2x + 1', 'Square', 'Sum'];
    if (cap > 0)
      opacity(c, cap, () => {
        frame(c, 113, 409, 1680, 214);
      });
    for (let i = 0; i < 4; i++) {
      const x = 220 + i * 402;
      if (i < 3)
        line(
          c,
          [
            [x + 221, 510],
            [x + 389, 510],
          ],
          cap ? teal : muted,
          7,
        );
      chip(c, x, 460, 222, 100, labels[i], { selected: false });
    }
    if (launch > 0) {
      const xx = mix(171, 1743, launch);
      line(
        c,
        [
          [xx - 19, 671],
          [xx, 639],
          [xx + 19, 671],
        ],
        gold,
        4,
      );
      txt(c, 'Launch', xx, 709, 32, gold, 'center');
    }
    foot(
      c,
      inst > 0
        ? 'One prepared executable retains the four nodes and their dependency edges.'
        : 'Four submissions on the host feed a single dependent chain on the GPU.',
    );
    return;
  }
  const recorded = on(k, 1, 'Add four'),
    logged = on(k, 1, 'Record a GPU'),
    first = on(k, 2, 'becomes six'),
    twice = on(k, 2, 'becomes eighteen');
  const state = captureState(recorded, Number(first) + Number(twice));
  bench(
    c,
    'plot',
    'What runs again on replay?',
    'CAPTURE PROBE   /   ordinary host code and device work',
  );
  txt(c, 'Operand', 538, 264, 30, muted, 'center');
  txt(c, 'Operation', 946, 264, 30, muted, 'center');
  txt(c, 'Current value', 1478, 264, 30, muted, 'center');
  const rows = [
    ['Python counter', 7, '+ 4', state.counter, gold],
    ['GPU scalar', state.operand, '× 3', state.scalar, teal],
  ];
  rows.forEach(([name, initial, op, now, color], i) => {
    const y = 339 + i * 254;
    txt(c, name, 99, y + 44, 41);
    chip(c, 457, y - 4, 164, 95, initial);
    line(
      c,
      [
        [653, y + 43],
        [808, y + 43],
      ],
      color,
      6,
    );
    rect(c, 816, y - 4, 259, 95, '#2d434d', 14);
    mono(c, op, 946, y + 45, 48, color);
    line(
      c,
      [
        [1083, y + 43],
        [1333, y + 43],
      ],
      color,
      6,
    );
    chip(c, 1370, y - 4, 215, 95, now, { selected: i === 0 });
    txt(
      c,
      i === 0
        ? recorded
          ? 'Executed during capture'
          : 'Before capture'
        : logged
          ? 'Recorded GPU node'
          : 'Awaiting recording',
      813,
      y + 139,
      33,
      color,
    );
  });
  foot(
    c,
    'Completed replays    ' +
      state.replays +
      '       /       ' +
      (twice
        ? 'Python stays at 11 while the GPU repeats the multiply.'
        : 'Capture records device work for later execution.'),
  );
}
export function cost(c, k) {
  bench(
    c,
    'plot',
    'Which run first saves total time?',
    'CUMULATIVE COST   /   constant-cost worksheet',
  );
  const tieN = firstWin(graphPrices) - 1;
  const approach = cue(k, 0, 'Each compatible run', 1.7),
    tie = cue(k, 1, 'Two thousand runs', 0.75),
    next = on(k, 2, 'Run two thousand and one');
  const n = next ? tieN + 1 : Math.round(mix(Math.round(1200 * approach), tieN, smooth(tie)));
  const totals = graphCost(n),
    x0 = 223,
    x1 = 1120,
    y0 = 719,
    y1 = 303,
    x = (v) => mix(x0, x1, v / 2200),
    y = (v) => mix(y0, y1, v / 40);
  txt(c, 'Cumulative milliseconds', 101, 263, 31, muted);
  for (let j = 0; j <= 4; j++) {
    const yy = y(j * 10);
    line(
      c,
      [
        [x0, yy],
        [x1, yy],
      ],
      '#718a9c67',
      2,
    );
    mono(c, j * 10, x0 - 40, yy, 29, muted);
  }
  for (const v of [0, 500, 1000, 1500, 2000]) {
    line(
      c,
      [
        [x(v), y0],
        [x(v), y1],
      ],
      '#718a9c44',
      1.5,
    );
    mono(c, v, x(v), y0 + 36, 27, muted);
  }
  txt(c, 'Compatible runs', 688, 808, 32, muted, 'center');
  line(
    c,
    [
      [x(0), y(0)],
      [x(n), y(totals.eager)],
    ],
    blue,
    8,
  );
  line(
    c,
    [
      [x(0), y(graphPrices.setupUs / 1000)],
      [x(n), y(totals.graph)],
    ],
    gold,
    8,
  );
  dot(c, x(n), y(totals.eager), 12, blue);
  dot(c, x(n), y(totals.graph), 6, gold);
  frame(c, 1201, 286, 598, 516);
  txt(c, 'Run ' + n.toLocaleString('en-US'), 1247, 348, 48);
  for (const [i, [label, val, color]] of [
    ['Eager', totals.eager, blue],
    ['Replay', totals.graph, gold],
  ].entries()) {
    txt(c, label, 1248, 424 + i * 117, 30, color);
    mono(c, val.toFixed(next ? 3 : 2) + ' ms', 1574, 464 + i * 117, 46, color);
  }
  if (next) {
    txt(c, 'Above the 36 ms tie', 1248, 640, 30, muted);
    rect(c, 1248, 688, 18 * 16, 26, blue, 4);
    txt(c, '18 µs', 1555, 701, 28, blue);
    rect(c, 1248, 739, 12 * 16, 26, gold, 4);
    txt(c, '12 µs', 1460, 752, 28, gold);
  } else txt(c, 'Setup   12 ms', 1248, 710, 35, paper);
  foot(
    c,
    next
      ? 'First saving = 6 µs at run 2,001   ·   assumes 18 µs eager and 12 µs replay'
      : 'Eager   18 µs/run      ·      Replay   12 ms setup + 12 µs/run',
  );
}
const names = ['Host enqueue', 'Stream events', 'Completed wall'];
export function lab(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    const zero = on(k, 0, 'Fill the retained input with zeros'),
      one = on(k, 0, 'Fill it with ones'),
      restore = on(k, 0, 'Restore the original data');
    bench(
      c,
      'memory',
      'Will replay see fresh input?',
      'LAB PREFLIGHT   /   4,096 FP32 words in retained storage',
    );
    txt(c, 'Input at the captured address', 111, 301, 42);
    const values = restore || !zero ? ['0', '…', '…', '1'] : Array(4).fill(one ? 1 : 0);
    values.forEach((v, i) => chip(c, 132 + i * 225, 384, 172, 124, v));
    txt(
      c,
      restore || !zero ? 'linspace(0, 1, 4096)' : one ? 'A.fill_(1)' : 'A.zero_()',
      120,
      590,
      41,
      teal,
      'left',
      'Mono',
    );
    frame(c, 1142, 325, 642, 330);
    txt(c, 'Expected reduction', 1189, 386, 36, muted);
    const val = zero && !restore ? receipt.n * (2 * (one ? 1 : 0) + 1) ** 2 : null;
    mono(
      c,
      val === null ? 'FP64 ref.' : val.toLocaleString('en-US'),
      1466,
      501,
      76,
      val === null ? teal : gold,
    );
    if (zero)
      txt(
        c,
        'Zero fill  →  4,096' + (one ? '       /       One fill  →  36,864' : ''),
        123,
        770,
        44,
        gold,
      );
    else txt(c, 'Eager      /      explicit stream      /      graph replay', 123, 770, 45);
    foot(c, 'Same input, same device-to-device chain, three submission modes.');
    return;
  }
  if (b === 1) {
    bench(
      c,
      'scope',
      'What is the mean time per iteration?',
      'TIMING RECEIPT   /   assumed practice intervals',
    );
    txt(c, 'Total over 200 iterations', 475, 297, 35, muted);
    txt(c, 'Mean per iteration', 1321, 297, 35, muted);
    const shown = ['ten, fifteen and twenty', 'fifteen and twenty', 'twenty'].map((phrase) =>
      on(k, 1, phrase),
    );
    [2, 3, 4].forEach((v, i) => {
      const y = 391 + i * 135;
      txt(c, names[i], 115, y + 23, 39);
      rect(c, 478, y, v * 131, 47, [blue, lilac, teal][i], 5);
      mono(c, v + ' ms', 522 + v * 131, y + 22, 33, paper, 'left');
      mono(c, shown[i] ? practiceMeans[i] + ' µs' : '?', 1484, y + 24, 49, shown[i] ? gold : muted);
    });
    foot(c, 'Mean = total milliseconds × 1,000 ÷ 200 iterations');
    return;
  }
  const h = on(k, 2, 'Host enqueue fell'),
    wall = on(k, 3, 'Its mean fell'),
    event = on(k, 3, 'Stream events spanned'),
    setup = on(k, 3, 'Graph setup cost');
  bench(
    c,
    'scope',
    'Did completed work get faster?',
    'MEASURED   /   ' + receipt.gpu + '   /   course lab, 7 Nov 2026',
  );
  txt(c, 'Mean µs per iteration', 105, 278, 36);
  txt(c, 'Eager', 1382, 278, 35, blue, 'center');
  txt(c, 'Replay', 1641, 278, 35, gold, 'center');
  receipt.measured.forEach(([e, g], i) => {
    const y = 376 + i * 133,
      shown = [h, event, wall][i];
    txt(c, names[i], 109, y + 14, 38);
    if (shown) {
      rect(c, 500, y - 21, e * 60, 25, blue, 4);
      rect(c, 500, y + 15, g * 60, 25, gold, 4);
    } else
      line(
        c,
        [
          [500, y + 7],
          [1229, y + 7],
        ],
        '#617b775b',
        2,
      );
    mono(c, shown ? e.toFixed(2) : '·', 1382, y + 10, 45, shown ? blue : muted);
    mono(c, shown ? g.toFixed(2) : '·', 1641, y + 10, 45, shown ? gold : muted);
  });
  txt(
    c,
    setup
      ? 'Graph preparation   +' + receipt.setupMs + ' ms'
      : '20 warmups     /     1,000 iterations     /     same 4,096 inputs',
    108,
    797,
    37,
    setup ? gold : muted,
  );
  foot(c, receipt.environment + '     /     fresh-input and final reference checks passed');
}
export function update(c, k) {
  const accepted = on(k, 0, 'sets the bias to minus two'),
    oldDone = on(k, 1, 'It finishes with seven'),
    newDone = on(k, 1, 'the result is four'),
    rejected = on(k, 1, 'The update fails');
  const state = updateState(accepted, oldDone, newDone, rejected);
  bench(c, 'plot', 'What will each launch return?', 'EXECUTABLE NODE   /   x = 3');
  txt(c, 'Launch', 108, 297, 32, muted);
  txt(c, 'Argument snapshot', 595, 297, 32, muted);
  txt(c, 'Completed value', 1349, 297, 32, muted);
  [
    ['In flight', state.oldBias, state.old],
    ['Next launch', state.newBias, state.next],
  ].forEach(([name, bias, val], i) => {
    const y = 381 + i * 172;
    txt(c, i === 0 && oldDone ? 'Earlier launch' : name, 111, y + 46, 45);
    rect(c, 531, y - 8, 601, 106, i ? '#314b4f' : '#3c4650', 8);
    mono(c, '2 × 3 ' + (bias < 0 ? '− ' : '+ ') + Math.abs(bias), 834, y + 47, 54, i ? teal : blue);
    line(
      c,
      [
        [1154, y + 46],
        [1323, y + 46],
      ],
      muted,
      4,
    );
    chip(c, 1371, y - 3, 255, 100, val === null ? '?' : val, {
      empty: val === null,
      selected: i === 1,
    });
  });
  if (rejected) pill(c, 108, 767, 770, 'Owning context change     /     update rejected', coral);
  foot(
    c,
    rejected
      ? 'Candidate needs a valid replacement or a supported fallback.'
      : newDone
        ? 'The two launches used different bias values.'
        : accepted
          ? 'Update accepted. Use each argument snapshot to predict its output.'
          : 'Read the bias in each argument snapshot.',
  );
}
