import {
  pointEstimate,
  rubricReadout,
  tokenClocks,
  binaryPowerTerms,
  telemetryReadouts,
} from '../../../films/ab-testing-online-evaluation-llms/model.mjs';
import {
  ink,
  mute,
  aInk,
  bInk,
  warn,
  gold,
  pale,
  aPale,
  bPale,
  redPale,
  text,
  rect,
  line,
  dot,
  arrow,
  label,
  note,
  sheet,
  browser,
  bubble,
  clockface,
  table,
  ruler,
  pct,
  nfmt,
} from './studio.mjs';

export const openingCase = { limit: 3, arrival: 3.2, window: 24 };
export function openingState(s) {
  const { limit, arrival } = openingCase;
  const start = s.b === 0 ? s.ramp('Start the clock', 3) : 1;
  const arrivalProgress = s.b === 1 ? s.ramp('Here comes the reply', 0.2) : s.b > 1 ? 1 : 0;
  const time = limit * start + (arrival - limit) * arrivalProgress;
  return {
    time,
    arrived: arrivalProgress === 1,
    confirmed: s.b > 1 || (s.b === 1 && s.ramp('developer confirms the fix', 0.6) === 1),
    resolved: s.b > 2 || (s.b === 2 && s.ramp('Count one more resolved', 0.12) === 1),
    verdict: s.on(3),
  };
}
function opening(c, s) {
  if (s.b >= 4) {
    const d = telemetryReadouts[0].correct;
    label(c, '4,000 assigned users   /   one mature question each', 112, 255);
    table(c, {
      y: 322,
      widths: [360, 420, 450, 440],
      heads: ['Prompt', 'Resolved', 'Assigned users', 'Resolution rate'],
      rows: d.arms.map((v, i) => [
        i ? 'B' : 'A',
        nfmt(v.success),
        nfmt(v.n),
        s.on(4) ? pct(v.success / v.n) : '…',
      ]),
      step: 108,
    });
    label(c, 'p95 full response time    /    allowed increase 300 ms', 114, 708);
    if (s.on(5))
      text(c, 'Request sent   →   last content received', 115, 805, 57, ink, { family: 'Serif' });
    note(
      c,
      s.b === 5 && s.ramp("Subtract A's ninety-fifth percentile", 0.45) === 1
        ? 'Timing passes if p95(B) − p95(A) ≤ 300 ms.'
        : s.on(5)
          ? 'A fix confirmation belongs to the outcome record. The two timestamps measure the wait.'
          : 'Which two timestamps would you collect for each request?',
    );
    return;
  }
  const d = openingState(s);
  browser(c, 100, 225, 1080, 565, 'Docs assistant   /   Batch export');
  bubble(c, 170, 335, 860, ['How many requests can I send each minute?'], aPale);
  if (!d.arrived) {
    const x = 210 + ((s.clock.elapsed * 65) % 200);
    label(c, 'Waiting for a reply', 180, 520);
    line(c, 180, 558, 455, 558, pale, 7);
    dot(c, x, 558, 9, aInk);
  } else {
    bubble(c, 170, 454, 865, ['100 requests per minute.', 'Batch export guide  ·  v2'], bPale);
    if (d.confirmed)
      text(c, 'Developer     “That fixed it.”', 182, 695, 39, bInk, { family: 'Serif' });
  }
  clockface(c, 1510, 459, 151, d.time, 3, 'Reply deadline  ·  3.00 s', d.arrived);
  if (d.resolved)
    text(c, '+1 resolved after 24 h', 1510, 758, 41, bInk, { weight: 700, align: 'center' });
  note(
    c,
    d.verdict
      ? 'Hold release. The same reply resolved the question and arrived 0.20 s late.'
      : d.resolved
        ? 'One resolved question. One missed deadline. Ready for everyone?'
        : d.confirmed
          ? 'Confirmation received. The 24-hour follow-up is still open.'
          : d.arrived
            ? 'The first word arrived after the deadline.'
            : 'Opening drill: any first token after 3.00 s pauses the wider release.',
    d.verdict ? warn : ink,
  );
}
export const point = pointEstimate(),
  harms = [
    { name: 'p95 full response', value: 410, limit: 300, unit: 'ms' },
    { name: 'Safety pass-rate loss', value: 0.1, limit: 0.05, unit: 'pp' },
    { name: 'Mean session cost rise', value: 1.8, limit: 1, unit: '¢' },
  ];
function policy(c, s) {
  const { a, b, percentagePoints, relativePercent } = point;
  label(c, 'Resolution in the illustrative worksheet', 116, 240);
  const at = ruler(c, 190, 420, 1450, 58, 65, [58, 59, 60, 61, 62, 63, 64, 65], (v) => v + '%');
  for (const [value, name, col, dy] of [
    [a, 'A', aInk, 0],
    [b, 'B', bInk, 0],
  ]) {
    const x = at(100 * value);
    line(c, x, 345, x, 415, col, 5);
    dot(c, x, 345, 12, col);
    text(c, name + '   ' + pct(value, 1), x, 313 + dy, 40, col, { align: 'center', weight: 700 });
  }
  if (s.on(0)) line(c, at(a * 100), 377, at(b * 100), 377, ink, 4);
  if (s.b < 2) {
    text(
      c,
      s.on(0) ? percentagePoints.toFixed(1) + ' percentage points' : 'B − A',
      140,
      650,
      78,
      ink,
      { family: 'Serif' },
    );
    if (s.on(1))
      text(c, '3.2 ÷ 60 = ' + relativePercent.toFixed(2) + '% relative', 145, 758, 49, bInk);
  } else {
    const count = s.on(3) ? 3 : 1;
    harms.slice(0, count).forEach((h, i) => {
      const y = 558 + i * 113,
        x = 640,
        unit = 470 / h.limit;
      text(c, h.name, 115, y + 9, 35);
      line(c, x, y, x + h.value * unit, y, warn, 18);
      line(c, x + 470, y - 27, x + 470, y + 24, ink, 5);
      text(c, h.limit + ' ' + h.unit + ' limit', x + 470, y + 57, 26, mute, { align: 'center' });
      text(c, h.value + ' ' + h.unit, x + h.value * unit + 18, y + 10, 32, warn);
    });
  }
  note(
    c,
    s.on(4)
      ? 'Hold. All three changes exceed their own limits.'
      : s.on(3)
        ? '410 − 300 = 110 ms beyond the time allowance.'
        : s.b >= 2
          ? 'How much time falls beyond the mark?'
          : 'The relative gain uses A as its denominator.',
  );
}
function support(c, s) {
  const open = s.b === 0 ? 0 : s.b === 1 ? s.ramp('Open the cited guide', 0.48) : 1;
  c.save();
  c.translate(455 * (1 - open), 0);
  browser(c, 110, 249, 790, 480, 'Assistant reply  /  JSON');
  text(c, '{', 165, 413, 56, aInk, { family: 'Mono' });
  text(c, '"limit": 200,', 215, 480, 44, ink, { family: 'Mono' });
  text(c, '"source": "batch-v2"', 215, 553, 44, ink, { family: 'Mono' });
  text(c, '}', 165, 625, 56, aInk, { family: 'Mono' });
  label(c, 'Valid number and string fields', 150, 692, aInk);
  c.restore();
  if (open === 1) {
    sheet(c, 1020, 249, 780, 480, 'Approved guide   /   batch-v2', bInk);
    text(c, 'Export rate limit', 1070, 398, 54, ink, { family: 'Serif' });
    if (s.on(1)) {
      text(c, '100 requests per minute', 1070, 485, 46, bInk);
      line(c, 1070, 506, 1570, 506, bInk, 4);
      text(c, 'Reply   200       Guide   100', 1070, 644, 37, warn);
    }
  }
  if (s.on(2)) label(c, 'Similar wording       •       different numeric claim', 105, 826);
  note(
    c,
    s.on(1)
      ? 'Check the factual claim against the passage that supplies the limit.'
      : open === 1
        ? 'Find the rate limit in the cited passage.'
        : 'Which evidence would check the number?',
  );
}
function bundle(c, s) {
  const locked = s.b >= 1;
  const left = ['M0', 'P0', 'Index 7', 'Engine 4'],
    right = [locked ? 'M0' : 'M1', 'P1', 'Index 7', 'Engine 4'];
  table(c, {
    x: 135,
    y: 252,
    widths: [525, 530, 530],
    heads: ['Serving configuration', 'Assigned A', 'Assigned B'],
    rows: ['Model weights', 'System prompt', 'Retrieval snapshot', 'Serving engine'].map((v, i) => [
      v,
      left[i],
      right[i],
    ]),
    colors: [ink, aInk, bInk],
    highlights: [locked ? '' : redPale, bPale],
    step: 96,
  });
  if (s.on(2))
    text(c, 'Confirmed fix  +  24 h without escalation   →   resolved', 150, 805, 48, bInk, {
      family: 'Serif',
    });
  note(
    c,
    s.on(2)
      ? 'Compare resolution probabilities for the eligible users in each arm.'
      : locked
        ? 'One changed component can answer a prompt-specific question.'
        : 'Two changed components identify a bundle effect.',
  );
}
export const cases = [
  'Canary deploy',
  'Batch export limit',
  'Key rotation',
  'Gateway errors',
  'Auth migration',
];
export const prefs = [1, 1, 1, 1, 0.5],
  preference = prefs.reduce((a, b) => a + b, 0) / prefs.length;
function screen(c, s) {
  sheet(c, 108, 235, 830, 575, 'Five questions for each prompt');
  cases.forEach((v, i) => {
    text(c, String(i + 1).padStart(2, '0'), 151, 375 + i * 88, 32, mute, { family: 'Mono' });
    text(c, v, 235, 375 + i * 88, 39);
  });
  sheet(
    c,
    1007,
    235,
    794,
    575,
    s.b === 0 ? 'One question, paired replies' : 'Blind pairwise preferences',
    bInk,
  );
  if (s.b === 0) {
    text(c, 'Batch export limit', 1060, 390, 48, ink, { family: 'Serif' });
    bubble(c, 1060, 455, 660, ['A   /   “Up to 200 per minute.”'], aPale);
    bubble(c, 1060, 575, 660, ['B   /   “100 per minute. See v2.”']);
  } else {
    prefs.forEach((v, i) => {
      let y = 370 + i * 88;
      label(c, cases[i], 1058, y);
      if (s.on(1))
        text(c, v === 1 ? 'B wins' : 'Tie', 1665, y, 37, v === 1 ? bInk : mute, { align: 'right' });
    });
  }
  note(
    c,
    s.on(2)
      ? 'Next screen: add routine and unseen cases. Live resolution needs exposure.'
      : 'The paired answers share their question, model, tools and source.',
  );
}
function scores(c, s) {
  const rows = rubricReadout();
  const axisNames = ['Clarity', 'Accuracy', 'Citation'];
  table(c, {
    x: 100,
    y: 230,
    widths: [470, 365, 365, 365],
    heads: ['Five paired questions', ...axisNames],
    rows: rows.rows.map((r, i) => [cases[i], ...r.a.map((v, j) => v + '  /  ' + r.b[j])]),
    step: 72,
  });
  label(c, 'Each cell shows A / B on the same 1–5 scale', 110, 717);
  if (s.b < 2) {
    const av = axisNames.map((_, i) =>
      (i === 0 && s.on(0)) || s.on(1) ? rows.a[i].toFixed(1) + '  /  ' + rows.b[i].toFixed(1) : '',
    );
    text(c, 'Mean', 122, 813, 40);
    av.forEach((v, i) => text(c, v, 590 + i * 365, 813, 39, bInk));
  } else {
    prefs.forEach((v, i) => {
      rect(c, 108 + i * 188, 759, 161, 66, v === 1 ? bPale : pale, 6);
      text(c, v === 1 ? 'Win' : 'Tie', 187 + i * 188, 804, 33, ink, { align: 'center' });
    });
    if (s.on(3)) text(c, '(4 + ½) / 5 = ' + pct(preference, 0), 1090, 810, 46, bInk);
  }
  note(
    c,
    s.b >= 2
      ? s.on(3)
        ? 'B earned half a point for the tie.'
        : 'Win = 1 point. Tie = ½ point. What share of the five points did B earn?'
      : 'Keep every mean on its actual five-case denominator.',
  );
}
const stream = tokenClocks();
export const streamEvents = {
  server: stream.arrivals.map((v, i) => [v, 't' + (i + 1)]),
  client: [
    [stream.arrivals[0], 'Empty'],
    [stream.arrivals[1], 't₁ + t₂'],
    [stream.arrivals[3], 't₃ + t₄'],
    [stream.closure, 'Close'],
  ],
};
function tokenStream(c, s) {
  const at = ruler(c, 220, 549, 1450, 0, 600, [0, 100, 200, 300, 400, 500, 600], (v) => v + ' ms');
  const client = s.b === 2;
  label(c, client ? 'Client-observed events' : 'Server-observed output tokens', 120, 256);
  const events = client ? streamEvents.client : streamEvents.server;
  const span = s.b === 0 ? s.ramp('The first output token', 3.6) : 1;
  const end = span * events.at(-1)[0];
  line(c, at(0), 488, at(end), 488, client ? aInk : bInk, 7);
  for (const [i, [v, txt]] of events.entries()) {
    if (v > end + 0.001) continue;
    const y = i % 2 ? 322 : 398;
    line(c, at(v), y + 65, at(v), 486, mute, 3);
    dot(c, at(v), 488, 10, client ? aInk : bInk);
    text(c, txt, at(v), y, 34, ink, { align: 'center' });
    text(c, String(v), at(v), y + 55, 29, mute, { align: 'center' });
  }
  if (s.b === 1 || s.b >= 3) {
    text(c, 'Token gaps', 135, 718, 36);
    stream.gaps.forEach((g, i) => {
      rect(c, 410 + i * 260, 680, 2 * g, 23, i === 2 ? gold : aInk);
      text(c, g + ' ms', 410 + i * 260, 762, 32);
    });
    if (s.on(1))
      text(c, stream.firstToLast + ' / ' + stream.gaps.length + ' = ' + stream.tpot.toFixed(2) + ' ms', 1270, 730, 38, bInk);
  }
  note(
    c,
    client
      ? 'An empty event carries no token. The last content precedes closure.'
      : s.b >= 3
        ? 'A 66.67 ms mean conceals a 120 ms stall.'
        : 'A token clock needs a declared start, observation surface and end.',
  );
}
function feedback(c, s) {
  label(c, 'Conversation 7   /   assigned B   /   model M1', 115, 240, bInk);
  line(c, 215, 414, 1620, 414, mute, 5);
  ['Request 1', 'Request 2', 'Request 3'].forEach((v, i) => {
    const x = 230 + i * 615;
    dot(c, x, 414, 14, bInk);
    text(c, v, x, 342, 38, ink, { align: 'center' });
    text(c, ['Copied citation', 'Follow-up', 'Downvote'][i], x, 490, 33, mute, { align: 'center' });
  });
  if (s.b >= 1) {
    sheet(c, 100, 560, 1710, 262, 'Resolution event   /   conversation 7', bInk);
    text(c, 'e9   confirmed fix', 154, 715, 39);
    text(c, 'e9   retry', 705, 715, 39);
    if (s.on(2)) {
      arrow(c, 985, 702, 1200, 702, bInk);
      text(c, '1 confirmation', 1240, 717, 40, bInk);
      label(c, '24 h elapsed  •  no escalation', 1200, 784);
    }
  }
  note(
    c,
    s.on(2)
      ? 'A known timeout can be a failure. An open follow-up stays pending.'
      : 'A turn-level event and a conversation outcome have different owners.',
  );
}
export const budgets = [0.05, 0.03, 0.02].map((d) => binaryPowerTerms(0.6, d));
function power(c, s) {
  label(c, 'Total independent users    /    60% baseline    /    equal arms', 112, 254);
  budgets.forEach((t, i) => {
    const y = 367 + i * 156;
    label(c, '+' + (100 * t.delta).toFixed(0) + ' points', 120, y + 40);
    rect(c, 420, y, 1200, 51, pale, 4);
    const vis = i === 0 ? s.b >= 1 : s.on(1);
    if (vis) {
      rect(c, 420, y, (t.total / 19000) * 1200, 51, i === 0 ? aInk : bInk, 4);
      text(c, nfmt(t.total), 430 + (t.total / 19000) * 1200, y + 40, 35, ink);
    }
  });
  note(c, 'Binary outcome   ·   two-sided α = .05   ·   power = .80   ·   fixed horizon');
}
export const smaller = binaryPowerTerms(0.6, 0.025);
function square(c, s) {
  const base = budgets[0],
    d = s.on(3) ? smaller : base;
  const side = d.ratio * 5.8,
    x = 1275,
    y = 798;
  const changed = s.on(3);
  label(
    c,
    'Independent binary users  ·  equal groups  ·  fixed horizon  ·  two-sided α .05  ·  power .80',
    110,
    238,
  );
  label(c, 'Baseline and target', 110, 339);
  text(c, pct(d.a) + '     →     ' + pct(d.b), 110, 410, 62, ink, { family: 'Serif' });
  text(c, 'Pooled rate   ' + d.p.toFixed(4), 113, 496, 36);
  text(c, 'Null term   1.96 × √[2p̄(1 − p̄)]', 110, 572, 36, aInk);
  if (s.b >= 1) text(c, 'Effect term   0.84 × √[pA(1 − pA) + pB(1 − pB)]', 110, 642, 34, bInk);
  if (s.on(1))
    text(
      c,
      'Side = (' + d.nullTerm.toFixed(3) + ' + ' + d.alternativeTerm.toFixed(3) + ') / ' + d.delta,
      110,
      750,
      38,
    );
  if (s.b >= 1) {
    rect(c, x, y - side, side, side, s.b === 3 ? pale : bPale);
    line(c, x, y, x + side, y, ink, 6);
    if (changed) {
      rect(c, x, y - base.ratio * 5.8, base.ratio * 5.8, base.ratio * 5.8, aPale);
      label(c, '5 pp', x + 16, y - 35, aInk);
    }
    label(c, 'side ≈ ' + d.ratio.toFixed(1), x, y - side - 30, bInk);
    if ((!changed && s.on(2)) || s.on(4))
      text(c, nfmt(d.perArm) + ' / arm', x + side / 2, y - side * 0.54, 35, bInk, {
        align: 'center',
        width: side - 12,
      });
  }
  note(
    c,
    changed
      ? s.on(4)
        ? 'Round up, then double: ' + nfmt(d.total) + ' users in total.'
        : 'The target lift halves. How does the area change?'
      : 'Square the side before rounding up to whole users.',
  );
}
export const measuring = [
  opening,
  policy,
  support,
  bundle,
  screen,
  scores,
  tokenStream,
  feedback,
  power,
  square,
];
