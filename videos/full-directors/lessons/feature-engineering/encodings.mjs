import {
  C,
  rect,
  line,
  dot,
  poly,
  txt,
  num,
  cap,
  panel,
  labelValue,
  job,
  register,
  strip,
  rail,
  head,
  cue,
  end,
  ease,
  mix,
  hhmm,
  decimal,
} from './drawing.mjs';
import { pools, onehot, fitPool, mature, outcomes, row, featureVector } from './examples.mjs';

function poolModule(g, x, y, name) {
  const colors = { A100: C.teal, H100: C.indigo, L4: C.rust };
  panel(g, x - 127, y - 90, 254, 180, colors[name]);
  for (let i = 0; i < 5; i++) rect(g, x - 86 + i * 35, y - 54, 16, 42, C.ink, 3);
  rect(g, x - 104, y + 8, 208, 62, C.white, 4);
  num(g, name, x, y + 38, 37);
}
function bit(g, x, y, on, text, color = C.teal) {
  rect(g, x - 78, y - 51, 156, 102, C.ink, 9);
  rect(g, x - 71, y - 44, 142, 88, on ? C.mint : C.pale, 6);
  num(g, text, x, y, 49, on ? color : C.slate);
  for (const off of [-50, 0, 50]) rect(g, x + off - 6, y + 52, 12, 20, C.slate);
}
function bitBank(g, x, y, values) {
  ['A100', 'H100', 'other'].forEach((name, i) => {
    const at = x + 233 * i;
    cap(g, name, at, y - 91, C.slate, 'center');
    bit(g, at, y, values?.[i] === 1, values?.[i] ?? '?');
  });
}
export function codes(g, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    const p = ease(cue(k, 1, 'Exchange the codes', 1.2));
    head(g, 'RUNNER POOLS   /   SCALAR CODEBOOK', 'A code can invent a distance');
    const centers = [405, 960, 1515];
    rail(g, centers[0], 702, 1110);
    [0, 1, 2].forEach((v, i) => {
      line(g, centers[i], 690, centers[i], 737, C.ink);
      num(g, v, centers[i], 796, 56);
    });
    [0, 1, 2].forEach((v, i) => {
      const dest = [0, 2, 1][i],
        x = mix(centers[v], centers[dest], p);
      const y = 510 + (i === 1 ? -106 : i === 2 ? 106 : 0) * Math.sin(p * Math.PI);
      poolModule(g, x, y, pools[i]);
      line(g, x, y + 103, x, y + 128, C.slate, 3);
    });
    if (p === 0 || p === 1)
      txt(g, 'One code unit from A100: ' + (p ? 'L4' : 'H100'), 121, 286, 43, C.slate);
    return;
  }
  const ask = b === 3;
  const second = cue(k, 2, 'H one hundred switches');
  head(
    g,
    'RUNNER POOLS   /   FITTED ENCODER',
    ask ? 'An unseen pool arrives' : 'Give each pool its own contact',
  );
  const name = ask ? 'L4' : second ? 'H100' : 'A100';
  poolModule(g, 382, 545, name);
  line(g, 540, 544, 858, 544, C.slate, 5);
  poly(
    g,
    [
      [857, 532],
      [879, 544],
      [857, 556],
    ],
    C.slate,
  );
  bitBank(g, 1010, 543, ask ? null : onehot(name));
  txt(g, 'Fitted order    A100  /  H100  /  other', 922, 833, 35, C.slate, 'center');
}
export function unknown(g, k) {
  const show = cue(k, 0, 'The third bit switches'),
    ignore = cue(k, 1, 'All three bits stay');
  head(g, 'L4   /   UNSEEN AT FIT TIME', 'Where does the new pool go?');
  poolModule(g, 280, 577, 'L4');
  const branches = [
    [404, 'Map to other', onehot('L4'), show],
    [766, 'Ignore unknowns', onehot('L4', false), ignore],
  ];
  branches.slice(0, k.beat.beatIndex > 0 ? 2 : 1).forEach(([y, s, bits, ready]) => {
    line(g, 412, 577, 503, 577);
    line(g, 503, 577, 503, y);
    line(g, 503, y, 563, y);
    txt(g, s, 595, y, 42);
    bitBank(g, 1140, y, ready ? bits : null);
  });
  if (k.beat.beatIndex === 2)
    txt(
      g,
      'Sparse row: store the active index. Each fitted category still has a column.',
      112,
      954,
      36,
      C.slate,
    );
}

function estimateLine(g, state, x, y, name, show, ready) {
  cap(g, name, x, y, C.slate);
  txt(g, 'L4 misses / jobs', x, y + 59, 31);
  num(g, state.hits + ' / ' + state.n, x + 309, y + 59, 37, C.ink, 'left');
  txt(g, 'All misses / jobs', x, y + 112, 31);
  num(g, state.misses + ' / ' + state.fit.length, x + 309, y + 112, 37, C.ink, 'left');
  const formula =
    '(' +
    state.hits +
    ' + 5 × ' +
    state.misses +
    '/' +
    state.fit.length +
    ') / (' +
    state.n +
    ' + 5)';
  if (show) {
    num(g, formula, x, y + 184, 35, C.slate, 'left');
    register(g, x, y + 223, 540, 97, ready ? decimal(state.estimate, 4) : '?');
  }
}
export function crossfit(g, k) {
  const b = k.beat.beatIndex,
    flip = Boolean(cue(k, 4, 'Flip just that one label'));
  const full = fitPool(flip),
    fold = fitPool(flip, true),
    split = cue(k, 2, 'Set aside');
  head(g, 'POOL MISS RATES   /   L4', 'Which jobs enter the estimate?');
  full.all.forEach((r, i) => {
    const x = 125 + i * 212,
      held = split && r.id % 2 === 0;
    panel(g, x, 306 + (held ? 48 : 0), 177, 160, held ? C.pale : i === 7 ? C.blush : C.white);
    const y = 306 + (held ? 48 : 0);
    cap(g, 'T' + r.id, x + 18, y + 34);
    txt(g, r.pool.split('-')[0].toUpperCase(), x + 18, y + 80, 29);
    num(g, r.missed, x + 128, y + 113, 45, i === 7 ? C.rust : C.ink);
  });
  if (split) cap(g, 'LOWER ROW  /  HELD OUT', 1820, 551, C.slate, 'right');
  const fullReady = flip ? end(k, 4) || cue(k, 4, 'Both sums used') : cue(k, 1, 'Notice how');
  function drawHalf(state, x, name, ready, hasFormula) {
    estimateLine(g, state, x, 588, name, hasFormula, ready);
  }
  drawHalf(full, 147, 'FULL-DATA MAP', fullReady, b > 0);
  if (split) drawHalf(fold, 1011, 'T8 HELD OUT  /  T1, T3, T5, T7 FIT', end(k, 2), true);
  else txt(g, '1 = missed deadline    0 = on time', 1010, 722, 36, C.slate);
  if (b === 7)
    txt(
      g,
      'Unseen pool, weight 0: the denominator is 0. Use the declared fallback.',
      149,
      995,
      32,
      C.rust,
    );
  if (b === 8) txt(g, 'Serving uses the full allowed training map.', 149, 995, 32, C.teal);
}

export function matured(g, k) {
  const b = k.beat.beatIndex;
  const nine = cue(k, 2, 'Advance to nine'),
    ten = cue(k, 3, 'Now advance');
  const cutoff = ten ? 600 : nine ? 540 : 420;
  head(g, 'ONE POOL   /   TWO UNRELATED JOBS', 'Wait for the outcome to arrive');
  const axis = (m) => 420 + (m - 360) * 5.4;
  for (let i = 0; i < 5; i++) {
    const x = axis(360 + i * 60);
    line(g, x, 317, x, 618, C.line, 2);
    num(g, hhmm(360 + i * 60), x, 659, 29, C.slate);
  }
  rect(g, axis(cutoff) - 4, 294, 8, 340, C.gold);
  outcomes.forEach((r, i) => {
    const y = 377 + i * 164;
    txt(g, 'Job ' + (i + 1), 130, y, 44);
    const p = axis(r.score),
      q = axis(r.ready);
    line(g, p, y, q, y, C.slate, 5);
    dot(g, p, y, 13, C.teal);
    dot(g, q, y, 29, r.ready <= cutoff ? C.teal : C.pale);
    num(g, r.ready <= cutoff ? r.miss : '?', q, y, 30, r.ready <= cutoff ? C.white : C.slate);
    txt(g, 'score', p, y + 55, 25, C.slate, 'center');
    txt(g, 'label', q, y + 55, 25, C.slate, 'center');
  });
  const s = mature(cutoff);
  const saved = cue(k, 3, 'Save that version'),
    answer = saved,
    half = end(k, 3);
  const str = !s.n
    ? 'no labels'
    : !answer
      ? '?'
      : ten && !half
        ? '?'
        : s.misses + ' / ' + s.n + ' = ' + decimal(s.rate);
  labelValue(g, 148, 777, 'UPDATING AT ' + hhmm(cutoff), str, C.teal, 52);
  if (saved) labelValue(g, 1017, 777, 'SAVED AT 09:00', '0 / 1 = 0', C.ink, 52);
  if (b === 6)
    txt(
      g,
      'First prediction: warm-up value. Each later row uses labels available by its cutoff.',
      147,
      968,
      33,
      C.slate,
    );
}

export function units(g, k) {
  const answer = cue(k, 1, 'The fitted layout'),
    fixed = cue(k, 1, 'Now both services');
  head(g, '08:30 PING   /   09:00 DECISION', 'Two writers read one heartbeat');
  const cols = [
    { x: 345, id: 'A', v: fixed ? '0.5' : '30', unit: fixed ? 'hours' : 'minutes' },
    { x: 1040, id: 'B', v: '0.5', unit: 'hours' },
  ];
  for (const { x, id, v, unit } of cols) {
    panel(g, x - 211, 322, 480, 351, C.pale);
    cap(g, 'WRITER ' + id, x - 165, 376);
    register(g, x - 141, 423, 344, 122, v);
    txt(g, unit, x + 33, 601, 37, C.ink, 'center');
  }
  panel(g, 1448, 380, 343, 242, C.white);
  cap(g, 'MODEL SLOT', 1489, 440);
  num(g, 'hours', 1618, 531, 52);
  if (answer) {
    line(g, 1318, 503, 1439, 503, C.teal, 7);
    dot(g, 1437, 503, 12, C.teal);
  }
  if (fixed) {
    line(g, 378, 675, 378, 722, C.teal, 5);
    line(g, 378, 722, 1595, 722, C.teal, 5);
    line(g, 1595, 722, 1595, 625, C.teal, 5);
    dot(g, 1595, 625, 10, C.teal);
  }
  if (cue(k, 1, 'Divide thirty minutes')) {
    const result = fixed ? '0.5 h' : '? h';
    txt(g, '30 min ÷ 60 min/h = ' + result, 135, 813, 56, fixed ? C.teal : C.ink);
  }
  if (k.beat.beatIndex === 2)
    txt(
      g,
      'Bundle the units, missing policy, vocabulary and slot order with the fitted model.',
      134,
      928,
      34,
      C.slate,
    );
}

export function validation(g, k) {
  const b = k.beat.beatIndex;
  if (!b) {
    head(g, 'ROW BUILDER   /   TIMEZONE', 'Two clocks show the same instant');
    const rows = [
      ['04:30 −04:00', '08:30 UTC'],
      ['08:30 +00:00', '08:30 UTC'],
      ['04:30', 'offset missing'],
    ];
    rows.forEach(([a, c], i) => {
      const y = 343 + 171 * i;
      strip(g, 120, y, 1664, 136);
      num(g, a, 255, y + 68, 45, C.ink, 'left');
      txt(g, '→', 780, y + 68, 43);
      num(g, c, 947, y + 68, 45, i === 2 ? C.rust : C.teal, 'left');
    });
    return;
  }
  const empty = cue(k, 3, 'Empty this backlog'),
    zero = cue(k, 3, 'Now send a measured zero');
  const input = { ...row, backlog: zero ? 0 : empty ? null : row.backlog };
  namedRow(g, input, b === 1 ? 'pool' : b === 2 ? 'exclusions' : 'test');
}

export function namedRow(g, input, view) {
  const v = featureVector(input);
  head(
    g,
    view === 'source' ? 'J-204   /   09:00 SOURCE ROW' : 'ROW BUILDER   /   J-204',
    'Read the named fields before vectorizing',
  );
  strip(g, 115, 275, 1020, 631);
  const fields = [
    ['runner_pool', input.pool],
    ['queued_minutes', v[3]],
    ['hours_since_last_heartbeat', v[4]],
    ['queue_backlog', v[5]],
    ['queue_backlog_missing', v[6]],
    ['priority_job', v[7]],
  ];
  fields.forEach(([s, t], i) => {
    const y = 347 + i * 95;
    txt(g, s, 172, y, 36, C.slate, 'left', 'Mono');
    num(g, t, 1072, y, 41, i === 3 || i === 4 ? C.teal : C.ink, 'right');
  });
  if (view === 'pool') {
    labelValue(g, 1221, 373, 'RAW POOL', '" A100-pool "', C.slate, 36);
    labelValue(g, 1221, 595, 'NORMALIZED', 'a100-pool', C.teal, 43);
  } else if (view === 'exclusions') {
    cap(g, 'EXCLUDED FROM FEATURES', 1205, 366);
    txt(g, 'finished_at', 1205, 464, 41, C.rust);
    txt(g, 'post_sla_escalation', 1205, 538, 41, C.rust);
    txt(g, 'Age cap   180 h', 1205, 753, 35);
  } else {
    cap(g, view === 'source' ? '09:00 BACKLOG SENSOR' : 'TEST INPUT  /  BACKLOG SENSOR', 1240, 401);
    register(g, 1235, 467, 467, 153, input.backlog === null ? 'blank' : input.backlog + ' jobs');
    if (view === 'test') txt(g, 'Missing bit follows presence.', 1202, 768, 35);
  }
}
