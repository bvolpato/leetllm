import {
  P,
  rect,
  plate,
  line,
  dot,
  txt,
  mono,
  strip,
  screen,
  ledger,
  heading,
  readout,
  beat,
  cue,
  ease,
  clamp,
  mix,
} from './studio.mjs';
import { admission, histories, lookupCalls, sum, trial, repeatCount } from './examples.mjs';

function markers(g, items, x, y, w, slots = items.length) {
  const step = w / slots;
  const run = repeatCount(items),
    start = items.length - run;
  items.forEach((m, i) =>
    strip(g, x + i * step, y, step - 20, 90, String(m), i >= start ? P.sky : P.white, P.ink, 44),
  );
  if (run) {
    const xx = x + start * step,
      end = x + items.length * step - 20;
    line(g, xx, y + 111, end, y + 111, P.blue, 4);
    line(g, xx, y + 96, xx, y + 111, P.blue, 4);
    line(g, end, y + 96, end, y + 111, P.blue, 4);
  }
}
export function poller(g, c) {
  const changed = cue(c, 1, 'Replay just the third', 1) === 1,
    late = cue(c, 3, 'at five seconds', 0.5) > 0;
  const count = Math.max(1, Math.ceil(cue(c, 1, 'Watch the progress marker', 1.5) * 3));
  const elapsed = late ? 5 : count;
  const items = [17, 17, changed ? 18 : 17].slice(0, count),
    s = admission(items, elapsed, 5, 6, 3, 10);
  heading(g, 'May the poller call again?', 'lookup   /   deployment 42   /   repeat cap 3');
  markers(g, items, 75, 240, 1050, 3);
  screen(g, 1176, 207, 353, 250, 'Consecutive run');
  txt(g, String(s.repeats), 1352, 390, 93, P.mint, 'Mono', 'center');
  readout(g, 78, 533, 'Elapsed / deadline', elapsed + ' / 5 s', { w: 405 });
  readout(g, 570, 533, 'Spend + next / limit (USD)', '0.006 + 0.003 / 0.010', { w: 460 });
  readout(
    g,
    1080,
    533,
    'Next call',
    s.allowed ? 'May dispatch' : !s.timeOK ? 'Stop · time' : 'Stop · repeat',
    { w: 442, col: s.allowed ? P.teal : P.red },
  );
  mono(g, 'Guard runs before the next tool call', 80, 800, 31, P.dim);
}
export function growth(g, c) {
  const b = beat(c),
    capped = cue(c, 6, 'Cap each history', 0.6) > 0;
  const n = cue(c, 4, 'Eight calls', 0.4) > 0 ? 8 : 4;
  const vals = histories(n, capped ? 120 : Infinity);
  heading(
    g,
    'How much history did the model receive?',
    (capped ? 'Cap 120 tokens per call' : 'Full history resent') +
      '    /    initial 100 tokens    /    +20 per call',
  );
  const x = 125,
    step = 168,
    base = 631,
    scale = 1.35;
  for (const [i, v] of vals.entries()) {
    const xx = x + i * step;
    rect(g, xx, base - 100 * scale, 120, 100 * scale, P.blue, 4);
    for (let k = 100; k < v; k += 20)
      rect(g, xx, base - (k + 20) * scale, 120, 20 * scale - 2, P.teal, 3);
    mono(g, v, xx + 60, base - v * scale - 18, 31, P.ink, 'center');
    mono(g, i + 1, xx + 60, base + 42, 25, P.dim, 'center');
  }
  mono(g, 'Call', 65, base + 41, 20, P.dim);
  line(g, 95, base + 2, 1490, base + 2, P.dim, 2);
  if (b >= 3 && !capped) mono(g, 'Full history:  N·L₀ + g·N(N−1)/2', 78, 773, 35, P.blue);
  if (b >= 4)
    mono(
      g,
      (capped ? '4 calls: ' + sum(histories(4, 120)) + '    ' : '') + n + ' calls: ' + sum(vals),
      1513,
      773,
      35,
      P.ink,
      'right',
    );
  if (b === 7) mono(g, 'Tool-only poll  →  no new model input', 77, 839, 25, P.teal);
}
export function tool(g, c) {
  const b = beat(c);
  if (b <= 2) {
    heading(g, 'One turn through the poll loop', 'No hidden reasoning text is needed', true);
    const phases = ['Select action', 'Execute tool', 'Observe result', 'Check completion'];
    const p = cue(c, 1, 'select an action', 2.2);
    phases.forEach((name, i) => {
      const x = 68 + i * 384,
        active = p * 4 >= i;
      if (i < 3) line(g, x + 310, 394, x + 380, 394, P.mint, 4);
      strip(g, x, 345, 311, 98, name, active ? P.mint : P.paper, P.ink, 27);
    });
    line(g, 1380, 452, 1380, 548, P.sky, 3);
    line(g, 223, 548, 1380, 548, P.sky, 3);
    line(g, 223, 448, 223, 548, P.sky, 3);
    readout(
      g,
      75,
      671,
      b === 1 ? 'Tool span name' : 'Span ID per invocation',
      b === 1
        ? 'execute_tool ' + lookupCalls[0].tool
        : lookupCalls.map((call) => call.tool + ' → span ' + call.spanId).join('      '),
      { w: 1230, dark: true, col: P.paper },
    );
    if (cue(c, 2, 'a provider omits', 0) > 0)
      mono(g, 'Each call keeps its own span ID when the provider omits the tool-call ID.', 75, 835, 27, P.mint);
  } else if (b === 3) {
    heading(
      g,
      'Two operations need two identities',
      'Trusted registry keys    /    synthetic calls',
      true,
    );
    ledger(
      g,
      ['Operation', 'Tool', 'Progress', 'Redacted arguments'],
      [
        ['X7', 'lookup', '17', '[redacted]'],
        ['X8', 'lookup', '17', '[redacted]'],
      ],
      { y: 278, step: 112, widths: [290, 300, 300, 570] },
    );
    mono(g, 'Approved opaque keys keep the operations distinct.', 77, 775, 33, P.mint);
  } else {
    const changed = cue(c, 4, 'Change the last marker', 0.5) > 0;
    const obs = [17, 17, changed ? 18 : 17];
    heading(
      g,
      'Latest consecutive observations',
      'lookup   /   operation X7    •    3 of 5 s elapsed    •    $0.006 spent + $0.003 next ≤ $0.010',
      true,
    );
    markers(g, obs, 81, 319, 1060);
    const s = admission(obs, 3, 5, 6, 3, 10);
    readout(g, 82, 585, 'Run length', s.repeats + ' / 3', { w: 460, dark: true, col: P.paper });
    readout(
      g,
      648,
      585,
      'Runtime admission',
      s.allowed ? 'Time and spend permit' : 'Stop for repeat cap',
      { w: 795, dark: true, col: s.allowed ? P.mint : P.pink },
    );
    if (b === 5)
      mono(g, 'Enforce before dispatch    •    back off between polls', 83, 798, 28, P.sky);
  }
}
export function practice(g, c) {
  const b = beat(c);
  const deadline = cue(c, 3, 'to sixteen seconds', 0.5) > 0 ? 16 : 12;
  const reserve = cue(c, 3, 'to three cents', 0.5) > 0 ? 3 : 5;
  const obs = ['L', 'L', 'M', 'M'],
    elapsed = 12,
    spent = 6,
    cap = 10,
    s = admission(obs, elapsed, deadline, spent, reserve, cap);
  heading(g, 'One poll at the dispatch gate', 'Same operation    /    change one budget at a time');
  if (b === 1) obs.forEach((v, j) => strip(g, 75 + j * 182, 246, 160, 85, v, P.white));
  else markers(g, obs, 74, 244, 734);
  screen(g, 911, 190, 616, 262, 'Dispatch guard');
  const answered = cue(c, 2, 'A new progress marker', 0) > 0;
  txt(
    g,
    answered ? (s.allowed ? 'Admit one call' : 'Hold call') : 'May it run?',
    1219,
    362,
    62,
    answered ? (s.allowed ? P.mint : P.pink) : P.paper,
    'Serif',
    'center',
  );
  [
    ['Repeat cap', s.repeats + ' of 3', s.repeats < 3],
    ['Clock', elapsed + ' / ' + deadline + ' s', s.timeOK],
    ['Spent + next', spent + ' + ' + reserve + ' / ' + cap + ' ¢', s.spendOK],
  ].forEach(([name, value, ok], j) => {
    const x = 75 + j * 495;
    readout(g, x, 542, name, b === 1 && j === 0 ? 'Cap 3' : value, { w: 442 });
    if (answered)
      mono(
        g,
        ok ? 'Within limit' : j === 1 ? 'At deadline' : 'Over limit',
        x,
        730,
        31,
        ok ? P.teal : P.red,
      );
  });
  if (b === 4)
    mono(g, 'Next poll  →  check marker, time and reservation again', 78, 831, 27, P.dim);
}
export function incident(g, c) {
  const b = beat(c);
  if (b <= 3) {
    heading(
      g,
      'The page links to its evidence',
      'deploy-grounding   /   exemplar #205   /   policy v17',
      true,
    );
    const compare = cue(c, 2, 'Compare this template', 0.5) > 0;
    ledger(
      g,
      ['Requests', 'Prompt version', 'First observed defect', 'Reviewed outcome'],
      [
        ['#205, #206', 'v1.1 regression', 'Chat draft', ['Unsupported approval', P.red]],
        ...(compare ? [['#202, #203', 'v1 strict', 'Chat draft', ['Withheld', P.teal]]] : []),
      ],
      { y: 275, step: 122, widths: [288, 327, 422, 423] },
    );
    mono(
      g,
      compare ? 'Inspect prompt and gate configuration' : 'On #205 the serving gate delivered the unsupported draft',
      77,
      742,
      35,
      P.mint,
    );
  } else if (b === 5) {
    heading(g, 'Did the rollback reach the worker?', 'Contain the unsafe delivery path', true);
    strip(g, 86, 331, 574, 125, 'Requested  v1', P.sky);
    line(g, 665, 394, 892, 394, P.sky, 4);
    screen(g, 900, 230, 622, 347, 'Worker reports');
    const loaded = cue(c, 5, 'worker still reports', 0.7) > 0;
    txt(
      g,
      loaded ? 'v1.1 loaded' : 'Awaiting report',
      1207,
      434,
      66,
      loaded ? P.pink : P.paper,
      'Serif',
      'center',
    );
    mono(g, 'Verify loaded version and inspect new deliveries', 86, 765, 34, P.paper);
  } else {
    heading(
      g,
      'Isolate one artifact',
      'Authorized replay   /   hold the rest of the experiment fixed',
      true,
    );
    ledger(
      g,
      ['Artifact', 'Trial A', 'Trial B'],
      [
        ['Input + evidence', '#205 / policy v17', '#205 / policy v17'],
        ['Model, gate, evaluator', 'Frozen versions', 'Same versions'],
        ['Prompt', 'Strict v1', ['v1.1 regression', P.red]],
        ['Delivered outcome', 'Awaiting replay', 'Awaiting replay'],
      ],
      { step: 87, widths: [515, 478, 467] },
    );
    mono(g, 'Retain authorized inputs, release, exemplar and evaluator', 80, 793, 29, P.sky);
  }
}
export function candidate(g, c) {
  const b = beat(c),
    second = b >= 5,
    s = trial(second ? 2 : 1),
    operation = second
      ? cue(c, 5, 'This time the supported answer', 1.25)
      : cue(c, 3, 'withholds both drafts', 1.1);
  const checked = second
    ? cue(c, 5, 'Both replay outcomes', 0.35) > 0
    : cue(c, 3, 'reviewer checks both', 0.35) > 0;
  const resolved = second
    ? cue(c, 6, 'Zero unsafe deliveries', 0) > 0
    : cue(c, 4, 'Look at request', 0) > 0;
  heading(
    g,
    b <= 2 ? 'Two fixed replay cases' : 'Replay bench   /   candidate ' + (second ? '2' : '1'),
    'Frozen inputs, policy v17 and evaluator    /    review both cases',
  );
  const x1 = 70,
    x2 = 819;
  s.cases.forEach((r, j) => {
    const x = j ? x2 : x1;
    plate(g, x, 187, 705, 425, P.white, 9);
    mono(g, '#' + r.id + '  /  policy v17', x + 27, 235, 25, P.dim);
    txt(
      g,
      r.answerable ? 'Policy supports an answer' : 'No deploy sign-off',
      x + 27,
      292,
      39,
      P.ink,
      'Serif',
    );
    const progress = second && !r.answerable ? 1 : operation;
    const canPass = second && r.served;
    const gateGap = canPass ? 218 * clamp(progress * 3) : 0;
    rect(g, x + 34, 409, 315 - gateGap, 9, P.blue, 4);
    rect(g, x + 350 + gateGap, 409, 320 - gateGap, 9, P.blue, 4);
    mono(g, 'gate', x + 37, 394, 20, P.dim);
    rect(g, x + 32, 435, 642, 114, P.night, 8);
    mono(g, 'REPLY', x + 47, 463, 18, P.mint);
    const draft = r.answerable ? 'Policy answer' : 'Approved.';
    const y = canPass ? mix(313, 466, ease(progress)) : mix(313, 340, ease(progress));
    strip(g, x + 164, y, 383, 61, draft, canPass && progress === 1 ? P.mint : P.paper, P.ink, 28);
    if (progress === 1 && !r.served)
      txt(g, 'Withheld', x + 351, 517, 47, P.paper, 'Serif', 'center');
    if (checked) mono(g, 'Reviewed', x + 34, 589, 22, P.teal);
  });
  if (b === 2) {
    mono(g, 'Replay gate     Reviews 2/2     Unsafe 0     Clean case answered 1/1', 80, 752, 30);
    return;
  }
  if (checked) {
    readout(g, 76, 658, 'Unsafe / reviewed', s.unsafe + ' / ' + s.reviewed, { w: 355 });
    readout(g, 488, 658, 'Useful / answerable', s.useful + ' / 1', {
      w: 341,
      col: s.useful ? P.teal : P.red,
    });
  }
  if (resolved)
    readout(
      g,
      880,
      658,
      second ? 'Untouched holdout' : 'Candidate decision',
      second ? 'Awaiting its own reviews' : 'Hold · clean case failed',
      { w: 635, col: second ? P.blue : P.red },
    );
}
