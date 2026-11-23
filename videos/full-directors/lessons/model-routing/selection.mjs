import {
  C,
  arrow,
  base,
  box,
  cents,
  circle,
  cue,
  fmt,
  line,
  mark,
  paper,
  small,
  smooth,
  stamp,
  strip,
  txt,
} from './art.mjs';
import {
  byId,
  checksFor,
  contract,
  fields,
  larger,
  lanes,
  measured,
  policy,
  ranked,
  sampleD,
  sampleText,
  withHints,
} from './examples.mjs';

function form(g) {
  paper(g, 115, 136, 945, 767);
  box(g, 115, 136, 945, 78, C.ink);
  small(g, 'ACCESS DESK     /     PRIVATE', 176, 187, C.paper, 32);
  txt(g, 'Request for access', 177, 335, 84, C.ink, 'serif');
  small(g, 'R900', 182, 393);
  line(g, 177, 427, 999, 427, C.rule, 3);
  txt(g, 'Evidence ID', 185, 526, 46);
  box(g, 185, 555, 505, 108, '#f2ecd7', 6, C.muted, 3);
  txt(g, 'Review queue', 185, 766, 40);
  line(g, 185, 807, 867, 807, C.rule, 2);
  // The metal spring clip keeps the same private form on the board.
  box(g, 445, 102, 289, 58, '#b0b5a0', 12, C.ink, 3);
  box(g, 508, 75, 163, 58, null, 21, C.pale, 10);
  line(g, 468, 145, 711, 145, C.ink, 3);
}

export function opening(g, k) {
  base(g);
  const b = k.beat.beatIndex;
  if (b === 2) {
    paper(g, 102, 146, 1716, 728);
    small(g, 'R900     /     AN ELIGIBLE CALL', 166, 222);
    txt(g, 'One form at the desk', 166, 323, 74, C.ink, 'serif');
    const translated = cue(k, 2, "translates it into the model's format");
    const returned = cue(k, 2, 'translates the reply back');
    const lane = cue(k, 2, 'and the controls around them');
    const nodes = [
      ['Desk', 'Private form'],
      ['Gateway', 'Select D'],
      ['Adapter', 'Translate'],
      ['Model D', 'Generate'],
    ];
    const centers = [345, 751, 1173, 1560];
    if (lane) box(g, 1010, 425, 730, 295, '#e0e9d6', 12, C.ok, 3);
    for (const [i, [name, job]] of nodes.entries()) {
      const x = centers[i];
      circle(g, x, 530, 47, i >= 2 ? C.field : C.ink);
      txt(g, ['R', '?', '⇄', 'D'][i], x, 546, 42, C.paper, 'mono', 'center');
      txt(g, name, x, 643, 46, C.ink, 'serif', 'center');
      txt(g, job, x, 692, 29, C.muted, 'sans', 'center');
      if (i < 3) arrow(g, x + 62, 530, centers[i + 1] - 62, C.muted);
    }
    if (translated) small(g, 'Provider request', 1230, 463, C.blue, 26);
    if (returned) {
      arrow(g, 1559, 758, 1173, C.blue);
      arrow(g, 1137, 758, 345, C.ok);
      txt(g, 'Provider reply', 1375, 814, 31, C.blue, 'sans', 'center');
      txt(g, 'Normalized reply', 742, 814, 31, C.ok, 'sans', 'center');
    }
    if (lane) txt(g, 'D’s approved lane', 1373, 401, 32, C.ok, 'mono', 'center');
    return;
  }
  form(g);
  const d = cue(k, 1, "Look at D's sample");
  const reject = cue(k, 1, 'Its sample is a sentence');
  const slide = smooth(cue(k, 0, 'Slide its reply', 1.4));
  const fits = d && cue(k, 1, 'D still has to fit');
  const withdraw = smooth(cue(k, 0, 'F is healthy', 0.7));
  const x = d ? 901 : 1090 - 740 * slide + 365 * withdraw;
  const y = 530;
  g.save();
  g.translate(x, y);
  g.rotate((d ? 0 : 1 - slide) * -0.045);
  strip(g, 0, 0, 794, d ? 217 : 168, d ? '#d9ead3' : '#fae1a7');
  small(g, d ? 'D   /   STRUCTURED SAMPLE' : 'F   /   PLAIN-TEXT SAMPLE', 39, 48, C.muted, 28);
  if (d) {
    txt(g, 'Evidence ID', 41, 123, 40);
    txt(g, sampleD.citations[0], 464, 123, 49, C.ok, 'mono');
    small(g, 'Review queue     pending', 41, 183, C.ink, 28);
  } else txt(g, sampleText, 39, 121, 48, C.ink, 'serif');
  g.restore();
  if (fits) {
    txt(g, sampleD.citations[0], 220, 631, 58, C.ok, 'mono');
    txt(g, 'Pending review', 195, 801, 33, C.ok, 'mono');
  }
  const infoX = 1123;
  txt(g, 'Backup ' + (d ? 'D' : 'F'), infoX, 235, 76, C.paper, 'serif');
  small(g, 'REGISTRY SAMPLE', infoX, 292, C.mint);
  txt(
    g,
    d ? 'Private cited-review lane' : 'Healthy · private notes permitted',
    infoX,
    365,
    39,
    C.white,
  );
  txt(g, cents(d ? byId.D.cost : byId.F.cost) + ' estimated', infoX, 423, 38, C.gold, 'mono');
  if (reject && !d) stamp(g, 'SKIP F', 1150, 831, C.coral);
  if (fits) txt(g, 'Check remaining time and spend', 1054, 834, 40, C.gold);
  if (cue(k, 0, 'The primary timed out'))
    small(g, 'C timed out   /   0 words delivered', infoX, 476, C.light, 30);
}

export function requirements(g, k) {
  base(g, true);
  const b = k.beat.beatIndex;
  const hinted = cue(k, 3, 'labels the request public');
  const req = hinted ? withHints : contract;
  const earlyExit =
    b === 2 && cue(k, 2, 'returned a private lane') && !cue(k, 2, 'Keep the risk requirement');
  const rows = [
    ['Private notes', req.data === 'private' ? 'Tenant-private handling' : 'Public handling', true],
    ['Access decision', 'Cited form  ·  v3', cue(k, 0, 'An access decision')],
    ['$900 risk', '$500+  →  human review', cue(k, 0, 'Nine hundred dollars')],
    ['Input length', fmt(req.context) + ' tokens', cue(k, 1, 'twenty-four thousand tokens')],
    ['Lane estimate', 'At most ' + cents(req.ceiling, 2), cue(k, 1, 'against half a cent')],
  ];
  strip(g, 102, 100, 674, 845);
  small(g, 'SERVER RECORD   /   R900', 155, 183);
  txt(g, 'Access decision', 154, 287, 64, C.ink, 'serif');
  line(g, 154, 330, 722, 330, C.rule);
  rows.forEach(([s, , on], i) => {
    if (on) {
      txt(g, s, 158, 420 + i * 91, 39, C.ink);
      circle(g, 704, 406 + i * 91, 8, C.field);
    }
  });
  if (hinted) {
    box(g, 135, 829, 606, 87, '#f6d9bf', 6);
    small(g, 'Client hint: public, cites off', 155, 884, C.rust, 28);
  }
  paper(g, 886, 115, 920, 820, C.paper);
  small(
    g,
    earlyExit ? 'EARLY RETURN AT FIRST MATCH' : 'REQUIREMENTS TO CARRY TOGETHER',
    939,
    195,
    earlyExit ? C.rust : C.muted,
  );
  txt(g, 'R900 route contract', 939, 295, 69, C.ink, 'serif');
  rows.forEach(([, v, on], i) => {
    if (!on) return;
    const y = 410 + i * 91;
    const missing = earlyExit && i > 0;
    line(g, 776, y - 5, 885, y - 5, missing ? C.rule : C.muted, 3, missing ? [8, 10] : []);
    if (missing) {
      line(g, 942, y + 7, 1708, y + 7, C.rule, 2, [10, 8]);
    } else {
      mark(g, 958, y - 10, true, 17);
      txt(g, v, 1000, y + 4, 41);
    }
  });
  if (earlyExit) small(g, 'Review requirement missing', 941, 875, C.rust, 30);
  if (hinted && cue(k, 3, 'The trusted record'))
    small(g, 'Source of policy: authorized task', 941, 875, C.ok, 29);
}

export function filter(g, k) {
  base(g);
  const b = k.beat.beatIndex;
  const big = cue(k, 3, 'Compare that figure');
  const req = big ? larger : contract;
  const inspectedRows =
    b !== 0
      ? 6
      : cue(k, 0, 'Read across each row')
        ? 6
        : cue(k, 0, 'B can fill')
          ? 2
          : cue(k, 0, 'A misses')
            ? 1
            : 0;
  const inspected = cue(k, 2, 'Inspect the cheap text lane') && b === 2;
  const verdict = big
    ? cue(k, 3, 'Escalate with the input intact')
    : cue(k, 1, 'These are the lanes');
  paper(g, 84, 92, 1752, 869);
  small(g, 'R900    /    LANE REGISTRY', 142, 164);
  txt(g, fmt(req.context) + ' private input tokens', 140, 262, 68, C.ink, 'serif');
  const xs = [563, 773, 1014, 1216, 1401, 1639];
  const titles = [
    'Private',
    'Capacity',
    'Schema',
    'Cites',
    'Review',
    '≤ ' + cents(policy.ceiling, 2),
  ];
  for (const [i, t] of titles.entries()) txt(g, t, xs[i], 351, 31, C.muted, 'sans', 'center', 600);
  line(g, 135, 377, 1778, 377, C.rule);
  for (const [i, lane] of lanes.entries()) {
    const y = 431 + i * 76;
    const checks = checksFor(lane, req);
    if (inspected && lane.id === 'F') box(g, 125, y - 44, 1670, 70, '#f4e1c0', 5, C.rust, 2);
    if (verdict && checks.every(Boolean)) box(g, 126, y - 44, 1669, 69, '#e0ecd6', 5);
    txt(g, lane.id, 145, y + 2, 40, C.ink, 'mono');
    txt(g, lane.name, 208, y, 32);
    for (const [j, pass] of checks.entries()) {
      if (i >= inspectedRows) {
        txt(g, '·', xs[j], y, 35, C.rule, 'mono', 'center');
        continue;
      }
      if (fields[j] === 'context' || fields[j] === 'cost') {
        const value = j === 1 ? fmt(lane.capacity) : cents(lane.cost);
        txt(g, value, xs[j], y, 32, pass ? C.ink : C.rust, 'mono', 'center');
        if (!pass) line(g, xs[j] - 60, y + 9, xs[j] + 60, y + 9, C.rust, 3);
      } else mark(g, xs[j], y - 11, pass, 21);
    }
  }
  line(g, 140, 858, 1778, 858, C.rule, 2);
  const feasible = rankedFor(req);
  txt(
    g,
    verdict
      ? feasible.length
        ? 'Eligible for ranking     ' + feasible.join('  /  ')
        : 'Escalate     ·     0 calls'
      : 'Which rows satisfy all six requirements?',
    144,
    926,
    43,
    verdict && !feasible.length ? C.rust : C.ink,
    'serif',
  );
}
function rankedFor(req) {
  return lanes.filter((l) => checksFor(l, req).every(Boolean)).map((l) => l.id);
}

export function ranking(g, k) {
  base(g, true);
  const b = k.beat.beatIndex;
  const revised = cue(k, 1, 'Its price stays');
  const speed = cue(k, 1, 'Now the desk cares');
  const isChosen = speed ? cue(k, 2, 'Its time is shorter') : cue(k, 0, 'It gets the first call');
  const reg = revised ? measured : lanes;
  const winner = ranked(!!speed)[0];
  if (b === 3) {
    paper(g, 135, 122, 1650, 793);
    small(g, 'D   /   RETAINED ADMISSION TEST', 203, 213);
    txt(g, 'One private test case', 205, 326, 78, C.ink, 'serif');
    const steps = [
      ['Schema', 'cited-support-answer-v3'],
      ['Evidence field', 'E1'],
      ['Review', 'Delivered to queue'],
    ];
    steps.forEach(([name, val], i) => {
      const y = 432 + i * 126;
      line(g, 199, y + 58, 1690, y + 58, C.rule, 2);
      txt(g, name, 220, y + 22, 42);
      const on = cue(k, 3, ['required schema', 'with an evidence ID', 'Keep those results'][i]);
      if (on) {
        txt(g, val, 767, y + 20, 42, C.ok, 'mono');
        mark(g, 1638, y + 4, true, 23);
      }
    });
    if (cue(k, 3, 'Keep those results'))
      small(g, 'Bind to model, adapter and policy revisions', 214, 856, C.muted, 30);
    return;
  }
  small(g, 'APPROVED LANES   /   R900', 126, 150);
  txt(
    g,
    speed ? 'Time to a complete reply' : 'Cost of one generation',
    120,
    265,
    83,
    C.ink,
    'serif',
  );
  const x0 = 766,
    scale = 0.6;
  const axisY = 363;
  small(g, 'ESTIMATE', 355, axisY);
  small(g, 'EXPECTED REPLY TIME', x0, axisY);
  for (const [i, id] of ['C', 'D', 'E'].entries()) {
    const lane = reg.find((l) => l.id === id),
      y = 478 + i * 151,
      selected = isChosen && winner.id === id;
    strip(g, 114, y - 73, 1674, 120, selected ? '#d5e8c7' : C.paper);
    txt(g, id, 178, y + 6, 63, C.ink, 'serif');
    txt(g, cents(lane.cost), 349, y + 2, 43, C.ink, 'mono');
    line(g, x0, y - 16, x0 + scale * lane.latency, y - 16, selected ? C.ok : C.blue, 10);
    circle(g, x0 + scale * lane.latency, y - 16, 12, selected ? C.ok : C.blue);
    txt(g, fmt(lane.latency) + ' ms', x0 + scale * lane.latency + 24, y - 3, 32, C.ink, 'mono');
  }
  if (isChosen) stamp(g, 'FIRST CALL   ' + winner.id, 121, 929, C.ok, 39);
  else
    txt(
      g,
      speed ? 'Which lane goes first for speed?' : 'Which estimate is lowest?',
      124,
      928,
      45,
      C.ink,
      'serif',
    );
}
