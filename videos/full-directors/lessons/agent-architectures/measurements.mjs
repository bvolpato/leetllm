import assert from 'node:assert/strict';
import { C, fmt } from './studio.mjs';
import { contextLedger, uctRows } from '../../../films/agent-architectures/arithmetic.mjs';

function percentBar(g, x, y, width, height, value, color, visible) {
  g.rect(x, y, width, height, C.sand);
  const fill = (width * value) / 100;
  if (visible) g.rect(x, y, fill, height, color);
  return x + fill;
}
function strip(g, x, y, w, label, value, color, visible) {
  g.text(label, x, y, 19, C.ink, 'Sans', 221);
  const start = x + 230,
    size = w - 300;
  percentBar(g, start, y - 16, size, 16, value, color, visible);
  if (visible) g.text(value + '%', start + size + 12, y, 18, color, 'Mono', 74);
}
const alf = [
  ['ReAct • best of 6', 71],
  ['ReAct • mean of 6', 57],
  ['Act • best', 45],
  ['BUTLER', 37],
];
const shop = [
  ['ReAct', 40],
  ['Imitation', 29.1],
  ['Imitation + RL', 28.7],
];
function research(g, b, q) {
  if (b === 1) {
    g.heading('ReAct   /   recorded trajectory', 'Which parts can the host verify?');
    g.plate(46, 166, 250, 150, 'THOUGHT', 'Try History', 'Optional planning note', C.muted);
    g.arrow(300, 237, 348, 237);
    g.plate(355, 166, 245, 150, 'ACTION', 'Read hours', 'Host validated • hours-24', C.blue);
    g.arrow(605, 237, 661, 237);
    g.plate(666, 166, 247, 150, 'OBSERVATION', 'Open 1 to 6', 'Hours service • today', C.teal);
    g.note('Trace the sent request to its recorded observation.');
    return;
  }
  const web = b === 3;
  g.heading(
    web ? 'WebShop   /   reported task success' : 'ALFWorld   /   reported task success',
    web ? 'How did ReAct compare on WebShop?' : 'What did the Act control keep?',
  );
  const visible = web
    ? [q(3, 'forty percent'), q(3, 'twenty-nine point one'), q(3, 'twenty-eight point seven')]
    : [q(2, 'seventy-one'), q(2, 'fifty-seven'), q(2, 'forty-five'), q(2, 'thirty-seven')];
  (web ? shop : alf).forEach(([label, value], i) =>
    strip(g, 58, 190 + i * 63, 832, label, value, i === 0 ? C.teal : C.blue, visible[i]),
  );
  g.note(
    web
      ? 'All three bars measure successful shopping tasks.'
      : 'Act saw the observations and omitted the written reasoning.',
  );
}
function tokens(g, b, q, cache) {
  const restore = cache ? q(1, 'restore the full history') : 0;
  const cap = cache && !restore ? 2 : Infinity,
    ledger = contextLedger(2000, 1500, 10, cap);
  const base = 2000,
    delta = 1500,
    floor = 367,
    unit = 0.0132;
  g.heading(
    'Model requests   /   submitted input',
    cache
      ? restore
        ? 'Which prefix is already cached?'
        : 'What fits in a two-block window?'
      : 'How often does an observation return?',
  );
  g.label(
    restore
      ? 'BLUE = READ FROM CACHE     GOLD = WRITE'
      : 'BLUE BASE = 2,000 TOKENS     EACH NUMBERED BLOCK = 1,500',
    49,
    148,
    862,
  );
  const count = cache
    ? 10
    : q(1, 'The tenth column')
      ? 10
      : Math.min(10, 1 + Math.floor(9 * q(1, 'After each reply', 3)));
  for (let i = 0; i < 10; i++) {
    const x = 57 + i * 86,
      w = 62;
    g.text(i + 1, x + w / 2, 395, 17, C.ink, 'Mono', 55, 'center');
    if (i >= count) continue;
    g.rect(x, floor - base * unit, w, base * unit, restore ? (i === 0 ? C.gold : C.blue) : C.blue);
    const lo = Math.max(0, i - cap);
    for (let j = lo; j < i; j++) {
      const y = floor - (base + (j - lo + 1) * delta) * unit;
      const color = restore
        ? j === i - 1
          ? C.gold
          : C.blue
        : j === 0 && b >= 3 && !cache
          ? C.gold
          : C.teal;
      g.rect(x, y, w, delta * unit - 1, color);
      g.text(
        j + 1,
        x + w / 2,
        y + 15,
        14,
        color === C.gold ? C.ink : C.white,
        'Mono',
        52,
        'center',
      );
    }
  }
  if (cache && restore && b === 3) {
    const next = q(3, 'next call'),
      x = 57 + (next ? 86 : 0);
    g.ctx.strokeStyle = C.ink;
    g.ctx.lineWidth = 3;
    g.ctx.strokeRect(x - 3, floor - base * unit - 3, 68, base * unit + 6);
  }
  let result = 'Each column is one request. The number below it is the call number.';
  if (!cache) {
    if (q(1, 'fifteen thousand five hundred'))
      result =
        'Call 10 contains ' + fmt(ledger.calls.at(-1)) + ' tokens, including nine previous blocks.';
    if (q(2, 'eighty-seven thousand five hundred'))
      result = '10 × 2,000 + 45 × 1,500 = ' + fmt(ledger.total) + ' submitted tokens.';
    if (b === 3) result = 'Block 1 appears in nine later calls. Block 10 has no later call here.';
    if (b >= 4) result = 'Fixed increments, full replay: K × base + K(K − 1)/2 × increment.';
  } else {
    result = restore
      ? 'Full history restored. Every matching prefix stays cached.'
      : 'Keep at most two prior blocks in each call.';
    if (!restore && q(1, 'forty-five thousand five hundred'))
      result = fmt(ledger.total) + ' submitted tokens with a two-block history.';
    if (restore && q(2, 'seventy-two thousand'))
      result =
        fmt(ledger.read) +
        ' cached reads + ' +
        fmt(ledger.written) +
        ' new writes = ' +
        fmt(ledger.total) +
        ' submitted tokens.';
    if (b === 3)
      result = q(3, 'next call')
        ? 'Call 2 reads the same 2,000-token base from the matching prefix.'
        : 'Call 1 writes the 2,000-token base once.';
    if (b >= 4) result = 'Price reads, writes and output separately. Add tools and retries.';
  }
  g.note(result);
}
const benchmarks = [
  ['HumanEval', 80.1, 91, 1.4],
  ['MBPP', 80.1, 77.1, 16.3],
];
function refinement(g, b, q) {
  const errors = b === 3;
  const start = 258, width = 574;
  g.heading(
    'Reflexion   /   Python benchmarks',
    errors
      ? 'How often was a self-test pass misleading?'
      : 'Which final answers passed the benchmark?',
  );
  if (errors) {
    g.text('Among solutions that passed their own tests', 52, 184, 26, C.ink, 'Serif');
    g.label('0%', start, 231);
    g.text('100%', start + width, 231, 15, C.muted, 'Mono', 70, 'right');
    benchmarks.forEach(([label, , , value], i) => {
      const y = 270 + i * 86;
      const visible = q(3, i ? 'Sixteen point three' : 'one point four');
      g.text(label, 52, y, 27, C.ink, 'Serif');
      const end = percentBar(g, start, y - 18, width, 19, value, C.red, visible);
      if (visible) g.text(value + '%', end + 8, y - 2, 16, C.ink, 'Mono', 83);
    });
    g.note('A passing self-test can stop revision before a held-out check catches the error.');
  } else {
    g.label('ONE GENERATION', 53, 163, 450, C.blue);
    g.label('FINAL SUBMISSION AFTER REFINEMENT', 474, 163, 430, C.teal);
    benchmarks.forEach(([name, base, refined], i) => {
      if (i && !q(2, 'MBPP')) return;
      const y = 221 + i * 113;
      g.text(name, 52, y, 27, C.ink, 'Serif');
      const ys = [y + 9, y + 37];
      for (const [j, v] of [base, refined].entries()) {
        const show = i
          ? j
            ? q(2, 'seventy-seven')
            : q(2, 'eighty point one')
          : j
            ? q(1, 'ninety-one')
            : q(1, 'eighty point one');
        const end = percentBar(g, start, ys[j], width, 19, v, j ? C.teal : C.blue, show);
        if (show) g.text(v + '%', end + 8, ys[j] + 16, 16, C.ink, 'Mono', 83);
      }
    });
    g.note('Each score counts one submitted answer per problem. Refinement used extra attempts.');
  }
}

const durations = { Plan: 120, CI: 200, Diff: 350, Health: 150, Join: 50 };
export function schedule(serial, withHealth) {
  let next = durations.Plan;
  const bars = [{ id: 'Plan', start: 0, end: next }];
  for (const id of withHealth ? ['CI', 'Diff', 'Health'] : ['CI', 'Diff']) {
    const start = serial ? next : durations.Plan,
      end = start + durations[id];
    bars.push({ id, start, end });
    next = Math.max(next, end);
  }
  return [...bars, { id: 'Join', start: next, end: next + durations.Join }];
}
function race(g, b, q) {
  const omit = q(4, 'Drop the health read'),
    parallelAgain = q(4, 'Spread the two remaining'),
    serial = q(3, 'just one worker') && !parallelAgain;
  const bars = schedule(serial, !omit),
    join = bars.at(-1);
  let now = join.end;
  let showJoin = true;
  let showFinish = true;
  if (b <= 2) {
    now =
      durations.Plan * q(1, 'Planning takes', 0.9) +
      durations.Diff * q(1, 'start their reads together', 3);
    showJoin = Boolean(q(2, 'The join starts'));
    if (showJoin) now = join.start + durations.Join * q(2, 'The join starts', 0.65);
    showFinish = Boolean(q(2, 'five hundred and twenty'));
  } else if (b === 3 && serial) {
    now = join.start;
    showJoin = Boolean(q(3, 'Add the same join'));
    if (showJoin) now = join.start + durations.Join * q(3, 'Add the same join', 0.65);
    showFinish = Boolean(q(3, 'eight hundred and seventy'));
  } else if (b === 4 && parallelAgain) {
    now = join.start;
    showJoin = false;
    showFinish = false;
  }
  g.heading(
    'Release investigation   /   ideal schedule',
    serial
      ? 'What changes with one worker?'
      : omit
        ? 'Does removing health move the finish?'
        : 'Which read holds up the join?',
  );
  g.label(
    (serial ? '1 WORKER' : '3 WORKERS') + '   /   ' + (omit ? 'CI + DIFF' : 'CI + DIFF + HEALTH'),
    45,
    147,
    872,
  );
  const x = (t) => 148 + t * 0.816;
  for (let t = 0; t <= 900; t += 100) {
    g.line(x(t), 170, x(t), 385, C.sand);
    g.text(t, x(t), 405, 14, C.muted, 'Mono', 49, 'center');
  }
  g.label('ms', 897, 405);
  for (const [i, id] of Object.keys(durations).entries()) {
    const bar = bars.find((v) => v.id === id),
      y = 175 + i * 43;
    g.text(id, 50, y + 21, 18, bar ? C.ink : C.muted);
    if (!bar) {
      g.text('omitted', x(120) + 5, y + 21, 17, C.muted);
      continue;
    }
    if (id === 'Join' && !showJoin) {
      g.text(
        now >= join.start ? 'Start at ?' : 'Waiting for last read',
        x(120) + 5,
        y + 21,
        16,
        C.muted,
      );
      continue;
    }
    const col = id === 'Diff' ? C.teal : id === 'Join' ? C.gold : id === 'Plan' ? C.muted : C.blue;
    g.rect(x(bar.start), y + 3, x(bar.end) - x(bar.start), 21, C.sand);
    const elapsed = Math.max(0, Math.min(now, bar.end) - bar.start);
    g.rect(x(bar.start), y + 3, elapsed * 0.816, 21, col);
    g.text(durations[id] + ' ms', x(bar.end) + 6, y + 20, 15, C.ink, 'Mono', 68);
  }
  if (showFinish) {
    const xx = x(join.end);
    g.line(xx, 382, xx, 390, C.goldInk, 2);
    g.text(
      'Finish ' + join.end + ' ms',
      xx,
      427,
      17,
      C.ink,
      'Mono',
      160,
      serial ? 'right' : 'center',
    );
  }
  if (!serial && now >= join.start) {
    const xx = x(join.start);
    g.path(
      [
        [xx, 278],
        [xx, 356],
      ],
      C.teal,
      2,
    );
    g.socket(xx, 278, C.teal, 4);
  }
  g.note(
    showFinish
      ? (serial
          ? bars.map((v) => durations[v.id]).join(' + ')
          : '120 + max(' +
            bars
              .filter((v) => !['Plan', 'Join'].includes(v.id))
              .map((v) => durations[v.id])
              .join(', ') +
            ') + 50') +
          ' = ' +
          join.end +
          ' ms'
      : b === 4
        ? 'Two remaining reads start at 120 ms. Where will the join finish?'
        : showJoin
          ? 'Add the 50 ms join after the final read.'
          : serial
            ? 'The three reads occupy one worker in sequence.'
            : 'Planning ends at 120 ms. Follow the last read to return.',
  );
}
const branches = uctRows();
const updated = uctRows(
  11,
  branches.map((r) => ({
    id: r.id,
    N: r.N + (r.id === 'retry'),
    W: r.W + Number(r.id === 'retry'),
  })),
);
function searchStats(g, b, q, backup) {
  if (backup) {
    const update = q(2, 'Count both visits'),
      root = q(2, 'Carry that visit'),
      rows = update ? updated : branches;
    g.heading('Sandbox   /   backup along the retry path', 'Where does the return of one go?');
    g.text('Root', 455, 161, 24, C.ink, 'Serif');
    g.text(
      root ? '11 visits  /  sum 6.8' : '10 visits  /  sum 5.8',
      480,
      191,
      20,
      C.ink,
      'Mono',
      350,
      'center',
    );
    for (const [i, r] of rows.entries()) {
      const x = 185 + 295 * i;
      g.line(480, 214, x, 279, r.id === 'retry' ? C.teal : C.rule, r.id === 'retry' ? 4 : 2);
      g.socket(x, 280, r.id === 'retry' ? C.teal : C.muted);
      g.text(r.id, x, 315, 25, C.ink, 'Serif', 180, 'center');
      g.text(r.N + ' visits   /   ' + r.W.toFixed(1), x, 349, 21, C.ink, 'Mono', 262, 'center');
      g.text(
        'mean ' + r.mean.toFixed(2),
        x,
        380,
        20,
        r.id === 'retry' ? C.teal : C.muted,
        'Mono',
        262,
        'center',
      );
    }
    g.note(
      update
        ? 'Retry has two visits. Its mean is 1.1 ÷ 2 = 0.55.'
        : 'Retry has one visit and return sum 0.1. Predict its mean after a return of one.',
    );
    return;
  }
  const bonus = q(4, 'Add that bonus'),
    choice = q(5, 'Simulate retry');
  g.heading('UCT selection   /   parent visits = 10', 'Which branch earns the next simulation?');
  g.label('CHILD', 50, 162);
  g.label('VISITS', 206, 162);
  g.label('SUM', 310, 162);
  g.label('MEAN RETURN', 411, 162, 160, C.blue);
  if (b >= 2) g.label('+ EXPLORATION BONUS', 586, 162, 318, C.goldInk);
  branches.forEach((r, i) => {
    const y = 217 + i * 75,
      start = 413,
      scale = 173;
    if (choice && r.id === 'retry') g.rect(39, y - 36, 872, 59, '#e0e8ce');
    g.text(r.id, 50, y, 24, C.ink, 'Serif');
    g.text(r.N, 216, y, 23, C.ink, 'Mono');
    g.text(r.W.toFixed(1), 310, y, 23, C.ink, 'Mono');
    g.rect(start, y - 20, scale * r.mean, 21, C.blue);
    if (bonus) g.rect(start + scale * r.mean, y - 20, scale * r.bonus, 21, C.gold);
    const value = bonus ? r.score : r.mean;
    g.text(value.toFixed(2), start + scale * value + 7, y, 18, C.ink, 'Mono');
  });
  g.note(
    b >= 6
      ? 'Unvisited eligible child: priority first. A finite budget still limits expansion.'
      : choice
        ? 'Retry has the largest score. Its single visit gives it the largest bonus.'
        : b >= 2
          ? 'For N > 0: score = W/N + √2 × √(ln 10 / N). Compare on one scale.'
          : 'Mean return = total return ÷ visits. Which mean is largest?',
  );
}
function reservation(g, b, q) {
  const read = q(1, 'Reserve a read'),
    write = q(1, 'and a write'),
    deny = q(1, 'blocks a second write');
  g.heading(
    'Host budget   /   reserve before dispatch',
    b < 3 ? 'Which pool can admit one more attempt?' : 'Can the host reserve the whole call?',
  );
  if (b < 3) {
    for (const [i, [name, total, used]] of [
      ['Read', 2, read],
      ['Write', 1, write],
    ].entries()) {
      const y = 217 + i * 108;
      g.text(name, 55, y, 32, C.ink, 'Serif');
      for (let j = 0; j < total; j++) {
        g.circle(310 + j * 84, y - 10, 28, j < used ? C.sand : C.teal);
        g.text(
          j < used ? '−' : '+',
          310 + j * 84,
          y,
          26,
          j < used ? C.muted : C.white,
          'Mono',
          48,
          'center',
        );
      }
      g.text(total - used + ' remaining', 560, y, 28, C.ink, 'Mono');
    }
    g.note(
      deny
        ? 'Write blocked. A timeout still spends the reserved attempt.'
        : 'The tool registry assigns each attempt to its pool.',
    );
  } else {
    const input = 120,
      output = 80,
      left = 150,
      x = 88,
      unit = 3.8;
    const showInput = q(3, 'a hundred and twenty for input'),
      showOutput = q(3, 'up to eighty'),
      verdict = q(3, "that's two hundred");
    g.rect(x, 213, unit * (input + output), 76, C.sand);
    g.label('TOKEN ALLOWANCE', x, 174);
    if (showInput) g.rect(x, 213, unit * input, 76, C.blue);
    if (showOutput) g.rect(x + input * unit, 213, unit * output, 76, C.teal);
    if (showInput) g.text('120 input', 180, 259, 27, C.white);
    if (showOutput) g.text('80 output cap', 678, 259, 20, C.white);
    const cut = x + left * unit;
    g.line(cut, 191, cut, 317, C.gold, 5);
    g.text('150 left', cut, 347, 22, C.goldInk, 'Mono', 170, 'center');
    g.note(
      !verdict
        ? 'Reserve enough capacity for the input and the maximum output.'
        : input + output > left
          ? '200 tokens required. The host blocks dispatch before spending the 150 left.'
          : 'Dispatch admitted.',
    );
  }
}
export function measurement(g, k, q, n) {
  const b = k.beat.beatIndex + 1;
  switch (n) {
    case 5:
      return research(g, b, q);
    case 9:
    case 10:
      return tokens(g, b, q, n === 10);
    case 14:
      return refinement(g, b, q);
    case 17:
      return race(g, b, q);
    case 23:
    case 24:
      return searchStats(g, b, q, n === 24);
    case 28:
      return reservation(g, b, q);
  }
}
export function checkMeasurements() {
  assert.deepEqual(
    [
      schedule(false, true),
      schedule(true, true),
      schedule(true, false),
      schedule(false, false),
    ].map((a) => a.at(-1).end),
    [520, 870, 720, 520],
  );
  assert.equal(schedule(false, false).at(-1).start, 470);
  assert.deepEqual(
    [
      contextLedger().total,
      contextLedger().read,
      contextLedger().written,
      contextLedger(2000, 1500, 10, 2).total,
    ],
    [87500, 72000, 15500, 45500],
  );
  assert.equal(branches.reduce((a, b) => (a.score > b.score ? a : b)).id, 'retry');
  assert.equal(updated.find((r) => r.id === 'retry').mean, 0.55);
  assert.equal(
    updated.reduce((n, r) => n + r.N, 0),
    11,
  );
  assert.equal(+updated.reduce((n, r) => n + r.W, 0).toFixed(1), 6.8);
  assert(benchmarks[0][2] > benchmarks[0][1] && benchmarks[1][2] < benchmarks[1][1]);
  assert(alf[0][1] > alf[1][1] && alf[1][1] > alf[2][1]);
  assert(shop[0][1] > shop[1][1]);
}
