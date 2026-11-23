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
  jobs,
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
  screw,
} from './drawing.mjs';
import {
  names,
  row,
  plugState,
  logistic,
  snapshot,
  captures,
  differences,
  freshFeatureEvents,
  pingAt,
  transfer,
  lagRoute,
} from './examples.mjs';
import { ledger } from './measurements.mjs';
import { namedRow } from './encodings.mjs';

export function patchbay(g, k) {
  const b = k.beat.beatIndex;
  if (!cue(k, 0, 'Put this row into')) {
    const source = cue(k, 0, 'Return to the nine');
    namedRow(g, source ? row : { ...row, backlog: 0 }, source ? 'source' : 'test');
    return;
  }
  const out = ease(cue(k, 2, 'Follow the two plugs', 1.45)),
    back = ease(cue(k, 3, 'Put the plugs back', 1.45));
  const travel = out * (1 - back),
    moving = travel > 0 && travel < 1;
  const original = plugState(),
    state = plugState(row, travel === 1);
  head(g, 'J-204   /   POSITIONAL LINEAR MODEL', 'The weights stay in their sockets');
  const pos = (i) => 230 + 208 * i;
  if (b === 0) {
    cap(g, '09:00 BACKLOG SENSOR', pos(5), 264, C.teal, 'center');
    line(g, pos(5), 289, pos(5), 330, C.teal, 3);
  }
  rect(g, 106, 594, 1708, 176, C.slate, 17);
  rect(g, 116, 604, 1688, 154, C.ink, 13);
  for (const x of [130, 1788]) {
    screw(g, x, 625);
    screw(g, x, 739);
  }
  original.slots.forEach((s, i) => {
    let x = pos(i),
      y = 398;
    if (i === 3 || i === 4) {
      const across = Math.min(1, Math.max(0, (travel - 0.22) / 0.56));
      const lift = Math.min(1, travel / 0.22, (1 - travel) / 0.22);
      x = mix(pos(i), pos(7 - i), across);
      y += (i === 3 ? -88 : 88) * lift;
    }
    const color =
      s.source === 3 ? C.rust : s.source === 4 ? C.indigo : s.source === 5 ? C.teal : C.slate;
    rect(g, x - 65, y + 32, 130, 28, C.slate, 3);
    for (const off of [-42, -14, 14, 42]) rect(g, x + off - 5, y + 57, 10, 33, C.gold, 2);
    rect(g, x - 94, y - 67, 188, 114, color, 12);
    txt(g, s.name, x, y - 38, 26, C.white, 'center');
    num(g, s.value, x, y + 10, 43, C.white);
  });
  state.slots.forEach((s, i) => {
    const x = pos(i);
    rect(g, x - 70, 593, 140, 14, C.line, 2);
    if (!moving || (i !== 3 && i !== 4)) line(g, x, 488, x, 592, C.line, 3);
    txt(g, names[i], x, 647, 24, C.white, 'center');
    num(g, '×' + s.weight, x, 715, 38, C.aqua);
    if (b >= 1 && (!moving || (i !== 3 && i !== 4)))
      num(
        g,
        decimal(s.product),
        x,
        838,
        41,
        s.source === 3 ? C.rust : s.source === 4 ? C.indigo : C.ink,
      );
  });
  if (moving) return;
  const correct = cue(k, 1, 'Suppose the writer');
  const broken = cue(k, 3, 'Forty-two now supplies');
  const restored = cue(k, 3, 'Both vectors held');
  const scored = travel === 1 ? broken : back === 1 ? restored : correct;
  if (scored) {
    txt(g, 'Linear score', 111, 941, 45);
    num(g, decimal(state.total), 670, 941, 73, travel ? C.rust : C.teal);
  } else if (b > 0) txt(g, 'Linear score    ?', 111, 941, 45, C.slate);
}

export function caps(g, k) {
  const b = k.beat.beatIndex,
    edited = cue(k, 0, 'The age delivered'),
    small = cue(k, 2, 'Now try a heartbeat');
  const raw = small ? 0.5 : 200,
    models = [logistic(raw, 18, 180), logistic(raw, 18, edited ? 360 : 180)];
  head(g, 'J-188   /   BACKLOG 18   /   FIXED MODEL', 'Compare training and serving caps');
  const gx = (h) => 256 + h * 3.78;
  cap(g, 'HEARTBEAT AGE IN HOURS', 115, 279);
  models.forEach((s, i) => {
    const y = 438 + i * 246;
    txt(g, i ? 'Serving' : 'Training', 114, y - 88, 37);
    line(g, gx(0), y, gx(360), y, C.line, 9);
    rect(g, gx(0), y - 10, gx(s.age) - gx(0), 20, C.teal, 5);
    line(g, gx(s.cap), y - 46, gx(s.cap), y + 44, C.rust, 6);
    num(g, 'cap ' + s.cap, gx(s.cap), y + 77, 29, C.rust);
    dot(g, gx(s.age), y, 16, C.ink);
    num(g, 'input ' + decimal(s.age), Math.max(390, gx(s.age)), y - 57, 34, C.teal);
  });
  const reveal = b >= 1 && (cue(k, 1, 'crossing the selected') || b >= 2);
  if (reveal) {
    const a = models[0],
      z = models[1];
    txt(g, 'σ(0.02 × age + 0.01 × 18 − 4)', 122, 876, 35, C.slate, 'left', 'Mono');
    num(g, a.score.toFixed(3) + '  →  ' + z.score.toFixed(3), 1230, 870, 56, C.ink);
    txt(g, 'Action threshold  0.5', 1230, 958, 34, C.slate, 'center');
  } else txt(g, 'Raw age  ' + raw + ' h', 121, 897, 44);
}

function compareRows(g, capture, withVerdict) {
  const diff = differences(snapshot, capture);
  const xs = [175, 960, 1540];
  ['FIELD', 'SOURCE REPLAY', 'CAPTURE'].forEach((s, i) =>
    cap(g, s, xs[i], 321, C.slate, i ? 'center' : 'left'),
  );
  for (const [i, key] of Object.keys(snapshot).entries()) {
    const y = 413 + 146 * i,
      hit = diff.includes(key);
    rect(g, 111, y - 53, 1688, 108, withVerdict && hit ? C.blush : i % 2 ? C.pale : C.white, 5);
    txt(g, key, xs[0], y, 42);
    num(g, snapshot[key], xs[1], y, 48);
    num(
      g,
      Object.hasOwn(capture, key) ? capture[key] : 'absent',
      xs[2],
      y,
      45,
      withVerdict && hit ? C.rust : C.ink,
    );
  }
  if (withVerdict)
    txt(
      g,
      diff.length ? 'Mismatch in ' + diff.join(', ') : 'All three fields match in this sample.',
      128,
      903,
      48,
      diff.length ? C.rust : C.teal,
    );
}
export function parity(g, k) {
  const b = k.beat.beatIndex;
  const which = b === 2 ? 2 : b === 1 ? 1 : 0;
  head(g, 'J-204   /   SAME CUTOFF AND VERSION', 'Compare the captured fields');
  const verdict = [
    cue(k, 0, 'The comparison finds'),
    cue(k, 1, 'the parity check fails'),
    cue(k, 2, 'Compare the union'),
  ][b];
  compareRows(g, captures[which], verdict);
}

export function forensic(g, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    const redo = cue(k, 2, 'The repaired run'),
      scores = cue(k, 1, 'The source score');
    head(g, 'J-204   /   LOGISTIC WORKSHEET', 'Keep the captured request sealed');
    const rows = [
      ['Captured request', logistic(0.5, 0)],
      ['Historical source', logistic(0.5, 18)],
    ];
    if (b === 2) rows.push(['Serving replay', logistic(0.5, redo ? 18 : 0)]);
    ['ROW', 'AGE (h)', 'BACKLOG', 'LOGIT', 'SCORE'].forEach((s, i) =>
      cap(g, s, [152, 683, 955, 1260, 1555][i], 310),
    );
    rows.forEach(([name, s], i) => {
      const y = 394 + i * 160;
      strip(g, 109, y - 47, 1700, 132);
      txt(g, name, 150, y + 18, 38);
      [s.age, s.backlog, s.logit.toFixed(2), scores ? s.score.toFixed(5) : '?'].forEach((v, j) =>
        num(g, v, [751, 1015, 1310, 1640][j], y + 18, 40, i === 2 ? C.teal : C.ink),
      );
    });
    txt(g, 'logit = 0.02 × age + 0.01 × backlog − 4', 142, 949, 39, C.slate, 'left', 'Mono');
    return;
  }
  if (b === 3) {
    head(g, 'PARITY CHECK   /   PRIORITY SOURCE', 'Equal values can have different types');
    [
      ['Historical source', 'False', 'bool'],
      ['Captured value', '0', 'int'],
    ].forEach(([s, v, t], i) => {
      const x = 140 + i * 850;
      panel(g, x, 358, 763, 326, C.white);
      cap(g, s.toUpperCase(), x + 44, 415);
      num(g, v, x + 153, 553, 79);
      txt(g, t, x + 514, 548, 47, C.slate);
    });
    txt(g, 'Python equality    True', 155, 824, 49, C.teal);
    txt(g, 'Requires bool    fails', 1017, 824, 49, C.rust);
    return;
  }
  head(g, 'SCHEDULER FEEDBACK', 'Follow a requeued job');
  const added = cue(k, 4, 'could change tomorrow');
  panel(g, 124, 335, 690, 423, C.pale);
  cap(g, 'ILLUSTRATIVE QUEUE', 176, 405);
  jobs(g, 3, 200, 493, 4, 143, 77, 18);
  txt(g, '3 waiting', 193, 683, 40);
  panel(g, 1046, 335, 732, 423, C.pale);
  cap(g, 'NEXT PREDICTION', 1090, 405);
  jobs(g, 3 + added, 1091, 493, 4, 143, 77, 18);
  txt(g, 3 + added + ' waiting', 1095, 683, 40);
  txt(g, '→', 927, 541, 90, C.slate, 'center');
  if (added) txt(g, 'One controller action changes the next input.', 143, 829, 44, C.teal);
}
export function storehouse(g, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    const updated = cue(k, 0, 'Asking for J two');
    head(g, 'J-204   /   BACKLOG', 'History and the latest value');
    strip(g, 122, 333, 837, 453);
    cap(g, 'HISTORICAL PATH', 168, 395);
    labelValue(g, 171, 475, '09:00', '18 jobs');
    if (updated) labelValue(g, 552, 475, 'LATER', '30 jobs');
    panel(g, 1104, 333, 662, 453, C.pale);
    cap(g, 'ONLINE STORE  /  LATEST ONLY', 1147, 395);
    register(g, 1191, 472, 483, 149, updated ? '30' : '18');
    txt(g, 'jobs', 1432, 698, 34, C.slate, 'center');
    txt(
      g,
      b === 2
        ? 'Check the backend’s join and sync behavior.'
        : 'Registry definition    cluster queue backlog',
      141,
      842,
      40,
    );
    return;
  }
  if (b < 5) {
    head(g, 'ANOTHER JOB   /   10:00', 'Compare heartbeat age and feed lag');
    const p = ease(cue(k, 3, 'Follow the feed watermark', 1.3));
    const heartbeat = 480;
    const cutoff = 600;
    const watermark = Math.round(mix(heartbeat, cutoff, p));
    const x0 = 335,
      x1 = 1630;
    rail(g, x0, 512, x1 - x0);
    dot(g, x0, 516, 26, C.teal);
    dot(g, x1, 516, 23, C.gold);
    labelValue(g, 151, 285, 'LAST HEARTBEAT', hhmm(heartbeat));
    labelValue(g, 1471, 285, 'CUTOFF', hhmm(cutoff));
    rect(g, x0, 658, x1 - x0, 34, C.pale, 8);
    const filled = (watermark - heartbeat) / (cutoff - heartbeat);
    rect(g, x0, 658, (x1 - x0) * filled, 34, C.teal, 8);
    txt(g, 'Feed watermark   ' + hhmm(watermark), 150, 776, 43);
    txt(g, 'Heartbeat age   ' + (cutoff - heartbeat) / 60 + ' h', 153, 908, 42, C.slate);
    txt(g, 'Feed lag   ' + (cutoff - watermark) + ' min', 1103, 908, 42, C.teal);
    return;
  }
  head(g, 'FEED LAG   /   THIS DEPLOYMENT’S POLICY', 'Route the lag reading');
  const val = cue(k, 5, 'Boolean false')
    ? false
    : cue(k, 5, 'forty-five point one')
      ? 45.1
      : cue(k, 5, 'At exactly forty-five')
        ? 45
        : 15;
  const result = lagRoute(val);
  panel(g, 145, 334, 570, 380, C.pale);
  cap(g, 'INCOMING LAG', 194, 403);
  register(g, 205, 490, 453, 125, val === false ? 'False' : val + ' min');
  const routes = [
    ['normal', '0 to 15 min'],
    ['fallback', 'over 15 through 45'],
    ['abstain', 'over 45 or invalid'],
  ];
  routes.forEach(([id, range], i) => {
    const y = 296 + i * 189,
      sel = id === result;
    rect(g, 947, y, 816, 147, sel ? (id === 'abstain' ? C.blush : C.mint) : C.white, 9);
    txt(
      g,
      id === 'abstain' ? 'Abstain and alert' : id === 'normal' ? 'Score normally' : 'Use fallback',
      998,
      y + 51,
      43,
    );
    cap(g, range, 998, y + 108);
    if (sel) {
      line(g, 728, 528, 816, 528, C.slate, 5);
      line(g, 816, 528, 816, y + 74, C.slate, 5);
      line(g, 816, y + 74, 945, y + 74, C.slate, 5);
      dot(g, 942, y + 74, 10, C.teal);
    }
  });
  if (b === 6) txt(g, 'Fallback inputs need an independent, trustworthy source.', 147, 930, 40);
}

export function receipt(g, k) {
  head(g, 'J-204   /   09:00 UTC   /   LAYOUT V1', 'Archive the request and the replay');
  const capRow = plugState({ ...row, backlog: 0 }),
    ref = plugState(),
    answer = cue(k, 1, 'The captured request');
  const sx = (i) => 431 + i * 181;
  ['Capture', 'Replay'].forEach((id, i) => {
    const y = 430 + i * 256,
      s = i ? ref : capRow;
    strip(g, 111, y - 104, 1696, 180);
    txt(g, id, 144, y, 36);
    s.slots.forEach((v, j) => {
      const x = sx(j);
      if (j === 5 && answer) rect(g, x - 79, y - 75, 158, 133, C.blush, 7);
      txt(g, names[j], x, y - 44, 24, C.slate, 'center');
      num(g, v.value, x, y + 14, 42);
    });
  });
  if (answer) txt(g, 'Same slot and cutoff. Two different backlog readings.', 139, 909, 44, C.rust);
}

function gauge(g, x, label, state, showScore, threshold, verdict, growth = 1) {
  panel(g, x, 303, 799, 602, label === 'Captured request' ? C.white : C.pale);
  txt(g, label, x + 38, 354, 45, C.ink, 'left', 'Serif');
  const cx = x + 510,
    y0 = 824,
    scale = 1220;
  state.slots.forEach((s, i) => {
    const y = 425 + i * 53;
    if (s.source === 5) rect(g, x + 25, y - 23, 339, 47, C.blush, 5);
    txt(g, s.name, x + 44, y, 29, C.slate);
    num(g, s.source === 4 ? '5/6' : s.value, x + 323, y, 31, C.ink, 'right');
  });
  rect(g, cx - 53, y0 - 409, 106, 409, C.white);
  line(g, cx - 59, y0, cx + 70, y0, C.slate, 4);
  if (showScore) {
    const contribution = state.slots[5].product;
    const pending = contribution > 0 && growth < 1;
    const base = state.total - contribution;
    const added = contribution * growth;
    rect(g, cx - 42, y0 - (base + added) * scale, 84, (base + added) * scale, C.teal);
    if (added > 0) rect(g, cx - 42, y0 - (base + added) * scale, 84, added * scale, C.rust);
    const score = pending ? base : state.total;
    const y = y0 - score * scale + (score >= 0.25 ? -24 : 37);
    num(g, score.toFixed(4), cx + 73, y, 33, C.ink, 'left');
    if (pending) cap(g, 'base', cx + 74, y + 44);
  }
  if (threshold) {
    const y = y0 - 0.25 * scale;
    line(g, cx - 77, y, cx + 212, y, C.rust, 4);
    cap(g, '0.25', cx + 109, y - 24, C.rust);
  }
  if (verdict)
    cap(g, state.alert ? 'ALERT' : 'QUIET', cx, 861, state.alert ? C.rust : C.teal, 'center');
}

export function practice(g, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    const later = b === 2 && cue(k, 2, 'A new decision') && !cue(k, 2, 'Replay ten'),
      cutoff = later ? 605 : 600;
    const selected = cue(k, 1, 'At ten it was'),
      age = cue(k, 1, 'The new pool');
    ledger(
      g,
      freshFeatureEvents,
      cutoff,
      'J-new',
      selected,
      age,
      'Build the ' + hhmm(cutoff) + ' row',
      'NEW JOB   /   L4 POOL',
    );
    if (b >= 1 && age)
      txt(g, 'Queue 20 min     Backlog 7 jobs     Pool → other', 151, 715, 35, C.slate);
    return;
  }
  const threshold = cue(k, 3, 'Mark the alert line'),
    base = cue(k, 3, 'Both scores start'),
    apply = cue(k, 5, 'Restore the seven');
  const crossed = cue(k, 5, 'Only the replay crosses');
  const verdict = cue(k, 5, 'The captured request stays') && crossed;
  const capture = transfer(0),
    replay = transfer(apply ? 7 : 0);
  let growth = 1;
  if (apply && b === 5) {
    const start = k.wordCue('They add seven hundredths').start;
    const finish = k.wordCue('The score reaches about point two eight six seven').end;
    growth = ease(Math.max(0, Math.min(1, (k.elapsed - start) / (finish - start))));
  }
  head(g, 'NEW JOB   /   10:00   /   FIXED LINEAR WEIGHTS', 'Replay one changed slot');
  gauge(g, 110, 'Captured request', capture, base, threshold, verdict);
  gauge(g, 1006, 'Replay', replay, base, threshold, verdict, growth);
  const note =
    b === 4
      ? 'Eligible backlog: 7 jobs at 0.01 each. Which row will cross?'
      : apply
        ? 'Replay adds 7 × 0.01. All seven other slots keep their captured values.'
        : 'Common contribution    20 × 0.01 + (5/6) × 0.02';
  txt(g, note, 136, 257, 35, C.ink);
}
