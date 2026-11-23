import assert from 'node:assert/strict';
import {
  PAIR_FIXTURE,
  REPEATED_CURSOR_PAGES,
  TALK_BUDGET,
} from '../../../films/ai-lab-technical-presentation/fixtures.mjs';
import {
  incidentsPerMillion,
  interruptedBudget,
  pairedEvidence,
  sourceWaitBudget,
} from '../../../films/ai-lab-technical-presentation/arithmetic.mjs';
import {
  freshEvidence,
  inspectPageTrace,
  SERVICE_CHECK,
} from '../../../films/ai-lab-technical-presentation/model.mjs';
import { seminarRoom, presenter, audience } from './room.mjs';

const ink = '#262b41',
  muted = '#566273',
  paper = '#faf6e9',
  rule = '#cfcbbb';
const rust = '#a84424',
  teal = '#176864',
  blue = '#355c88',
  brass = '#c7924a';
const dark = '#152735',
  pale = '#f4f0df',
  mint = '#7fd0b8',
  peach = '#ffb087';
const mix = (a, b, p) => a + (b - a) * p;
const smooth = (p) => p * p * (3 - 2 * p);
const sum = (numbers) => numbers.reduce((a, b) => a + b, 0);
const pct = (value) => Number((100 * value).toFixed(1)) + '%';
const oldHits = Object.fromEntries(PAIR_FIXTURE.map((q) => [q.id, q.baseline]));
const newHits = Object.fromEntries(PAIR_FIXTURE.map((q) => [q.id, q.candidate]));
const pairs = pairedEvidence(oldHits, newHits);
const buckets = [[], [], [], []];
for (const q of [...PAIR_FIXTURE].sort((a, b) => a.id.localeCompare(b.id))) {
  buckets[q.baseline ? (q.candidate ? 0 : 1) : q.candidate ? 2 : 3].push(q);
}
const sample = buckets[1][0];
const ranks = {
  target: 'DNS',
  before: ['TLS', 'Queue', 'Cache', 'Disk', 'DNS', 'Health'],
  after: ['TLS', 'Queue', 'Cache', 'Disk', 'Health', 'DNS'],
};
const rank = (list) => list.indexOf(ranks.target) + 1;
const relevantGuides = ['Restore', 'Verify', 'Reopen'];
const retrievedGuides = ['Queue', 'Disk', 'Restore', 'Setup', 'Cache'];
const foundGuides = relevantGuides.filter((guide) => retrievedGuides.includes(guide));
const records = [
  { start: 2, end: 22 },
  { start: 9, end: 15 },
];
const days = records.map((record) => record.end - record.start);
const ms = [720, 680],
  latencyLimit = 800;
const study = { baseline: 30, candidate: 28, n: 50 };
const recallResult = ((study.candidate - study.baseline) * 100) / study.n;
const wait = sourceWaitBudget(),
  budget = interruptedBudget();
const periods = [
  { incidents: 5, millions: 5 },
  { incidents: 1, millions: 0.5 },
];
const incidence = periods.map((q) => incidentsPerMillion(q.incidents, q.millions * 1e6));
const fresh = [freshEvidence(false), freshEvidence(true)];
const restoredIds = fresh[0].rows
  .filter((row, i) => row.baseline && !row.candidate && fresh[1].rows[i].candidate)
  .map((row) => row.id);
const practiceGroups = [
  { label: 'Both hit', key: 'both', color: teal, matches: (q) => q.baseline && q.candidate },
  { label: 'Lost hit', key: 'baselineOnly', color: rust, matches: (q) => q.baseline && !q.candidate },
  { label: 'New hit', key: 'candidateOnly', color: blue, matches: (q) => !q.baseline && q.candidate },
  {
    label: 'Both miss',
    key: 'neither',
    color: '#88918a',
    matches: (q) => !q.baseline && !q.candidate,
  },
].map(({ matches, ...group }) => ({ ...group, rows: fresh[0].rows.filter(matches) }));
const requiredSuccesses = (g) => Math.ceil(g.attempts * g.minimumSuccess);
const trace = (n) => inspectPageTrace(REPEATED_CURSOR_PAGES.slice(0, n));
const baselinePair = { A: true, B: false };
const pairInputs = [
  { B: false, A: true },
  { B: false, A: 1 },
  { B: false, C: true },
];
function classify(input) {
  try {
    return { valid: true, data: pairedEvidence(baselinePair, input) };
  } catch (e) {
    return { valid: false, why: e.message };
  }
}
const audit = { copied: 1000, entries: 3, candidateServed: 0 };
const slots = (cap, jobsB) => [...Array(cap).fill('A'), ...Array(jobsB).fill('B')];
const revisedSlots = slots(3, 1);

function box(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function line(c, x, y, X, Y, color, w = 3, dash = []) {
  c.save();
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
  c.restore();
}
function dot(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
function type(c, txt, x, y, size, color = ink, face = 'Sans', align = 'left', weight = 500) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(String(txt), x, y);
}
function mono(c, txt, x, y, size = 29, color = muted, align = 'left') {
  type(c, txt, x, y, size, color, 'Mono', align);
}
function withAlpha(c, a, fn) {
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= a;
  fn();
  c.restore();
}
function arrow(c, x, y, X, Y, color, w = 4) {
  line(c, x, y, X, Y, color, w);
  const a = Math.atan2(Y - y, X - x);
  for (const d of [-0.53, 0.53])
    line(c, X, Y, X - 18 * Math.cos(a + d), Y - 18 * Math.sin(a + d), color, w);
}
function brace(c, x, X, y, label, color = rust) {
  line(c, x, y, X, y, color, 3);
  line(c, x, y - 10, x, y + 9, color, 3);
  line(c, X, y - 10, X, y + 9, color, 3);
  type(c, label, (x + X) / 2, y + 47, 38, color, 'Serif', 'center');
}
function title(c, head, sub = '', night = false) {
  type(c, head, 64, 97, 62, night ? pale : ink, 'Serif');
  if (sub) mono(c, sub, 68, 151, 26, night ? '#b4c6c9' : muted);
}
function foot(c, main, small = '', night = false) {
  const color = night ? pale : ink;
  line(c, 66, 681, 1534, 681, night ? '#527071' : rule, 2);
  type(c, main, 68, 749, 43, color, 'Serif');
  if (small) type(c, small, 70, 803, 31, night ? '#bdd1ce' : muted);
}
function cue(clock, beat, phrase, span = 0.55) {
  const index = clock.beat.beatIndex;
  return index < beat ? 0 : index > beat ? 1 : smooth(clock.reveal(phrase, span));
}
function afterCue(clock, beat, phrase, captionStart = false) {
  const index = clock.beat.beatIndex;
  if (index !== beat) return Number(index > beat);
  clock.reveal(phrase, 0, { captionStart: captionStart ? phrase : false });
  return Number(clock.elapsed + 1e-9 >= clock.wordCue(phrase).end);
}
function sheet(c, night = false) {
  const g = c.createLinearGradient(0, 0, 1600, 850);
  g.addColorStop(0, night ? '#142634' : '#fffbee');
  g.addColorStop(1, night ? '#203741' : '#f1eddf');
  box(c, 0, 0, 1600, 850, g);
}

function onboarding(c, t) {
  const b = t.beat.beatIndex;
  if (b === 2) {
    title(c, 'How fast were the lookups?', 'Lookup traces  /  p95 in milliseconds');
    const x = 355,
      px = 1.14,
      end = x + latencyLimit * px;
    line(c, end, 220, end, 548, rust, 4, [12, 8]);
    mono(c, '800 ms target', end, 200, 30, rust, 'center');
    ms.forEach((value, i) => {
      const y = 322 + i * 143,
        width = px * value;
      type(c, i ? 'Later' : 'Earlier', 75, y + 14, 43);
      box(c, x, y - 29, width, 48, i ? teal : blue);
      dot(c, x + width, y - 5, 11, i ? teal : blue);
      mono(c, value + ' ms', x + width - 20, y + 6, 32, paper, 'right');
    });
    const result = cue(t, 2, 'That forty millisecond difference');
    withAlpha(c, result, () =>
      foot(
        c,
        ms[0] - ms[1] + ' ms lower in these windows',
        'A capacity claim needs a load test with traffic mix, timeouts and sample sizes.',
      ),
    );
    return;
  }
  const align = cue(t, 0, 'Slide the starts together', 1.6);
  const chosen = cue(t, 1, 'The later source took', 0.45);
  title(
    c,
    'What do the two records establish?',
    'Partner runbooks  /  synthetic onboarding records',
  );
  const scale = 49,
    x0 = 300;
  const setDown = cue(t, 0, 'You have fifteen minutes', 0.9);
  const starts = records.map(
    (r, i) =>
      x0 + (r.start - records[0].start) * (1 - align) * scale + (1 - setDown) * (i ? 94 : 40),
  );
  records.forEach((r, i) => {
    const x = starts[i],
      y = 282 + i * 160,
      w = days[i] * scale,
      col = i ? teal : blue;
    type(c, i ? 'Later source' : 'Earlier source', 68, y + 16, 33);
    box(c, x - 7, y - 43, w + 14, 89, '#ddd7c7');
    box(c, x - 7, y - 48, w + 14, 88, '#fffdf5');
    for (let d = 0; d < days[i]; d++) {
      box(c, x + d * scale, y - 20, scale - 3, 36, col);
      dot(c, x + d * scale + scale / 2, y - 34, 3.5, rule);
    }
    line(c, x, y - 54, x, y + 50, col, 4);
    line(c, x + w, y - 54, x + w, y + 50, col, 4);
    mono(c, days[i] + ' days', x + w, y + 83, 34, col, 'right');
    mono(c, 'Handoff', x, y - 62, 28, col, 'center');
    mono(c, 'Searchable', x + w, y - 62, 28, col, 'center');
  });
  withAlpha(c, align, () => {
    line(c, x0, 240, x0, 324, muted, 2, [8, 7]);
    line(c, x0, 422, x0, 511, muted, 2, [8, 7]);
  });
  if (chosen > 0) {
    withAlpha(c, chosen, () =>
      brace(c, x0 + days[1] * scale, x0 + days[0] * scale, 563, days[0] - days[1] + ' days'),
    );
    foot(
      c,
      'The later source took fourteen fewer days.',
      'To attribute the difference, compare source complexity, staff time and process changes.',
    );
  } else
    foot(
      c,
      'Which belongs in your opening sentence?',
      'The time between handoff and search, or the cause of that difference?',
    );
}

const argumentRows = [
  ['Problem', 'Eight integrations repeat credential and paging code.'],
  ['Constraint', 'Keep tenants separate. Keep lookup p95 below 800 ms.'],
  ['Decision', 'Put adapters behind one in-process contract.'],
  ['Alternative', 'Split services for independent deployment. Add a remote call.'],
  ['Evidence', 'Open a trace, the two records and my repeated-cursor test.'],
  ['Limit', 'Source difficulty and staffing could also have changed.'],
];
function argument(c, t) {
  const b = t.beat.beatIndex;
  if (b < 2) {
    title(
      c,
      'What will the audience be able to challenge?',
      'Speaker’s working outline  /  connector migration',
    );
    const phases = [
      cue(t, 0, 'The problem'),
      cue(t, 0, 'The constraint'),
      cue(t, 0, 'My decision'),
      cue(t, 1, 'A separate service'),
      cue(t, 1, 'For evidence'),
      cue(t, 1, 'For the limit'),
    ];
    argumentRows.forEach(([name, what], i) => {
      const y = 220 + i * 80;
      line(c, 70, y + 19, 1520, y + 19, rule, 2);
      type(c, name, 73, y, 34, muted, 'Serif');
      withAlpha(c, phases[i], () => {
        box(c, 298, y - 29, 7, 30, [blue, blue, teal, rust, teal, brass][i]);
        type(c, what, 326, y, 36);
      });
    });
    withAlpha(c, phases[4], () => {
      box(c, 65, 670, 1470, 119, '#e3e9dd');
      mono(c, 'Sanitized trace', 88, 717, 30, teal);
      mono(c, 'req-42     source B     support UI → gateway → adapter', 88, 767, 34, ink);
    });
    return;
  }
  title(
    c,
    'What claim fits this research prompt?',
    'Public matched study  /  research-method prompt',
  );
  [study.baseline, study.candidate].forEach((n, i) => {
    const y = 324 + i * 177;
    type(c, i ? 'Quantizer' : 'Baseline', 74, y, 48, ink, 'Serif');
    const x = 355, width = 850;
    box(c, x, y - 40, width, 50, '#dedcd0');
    box(c, x, y - 40, width * n / study.n, 50, i ? teal : blue);
    mono(c, n + ' / ' + study.n + ' solved', 1507, y + 2, 32, i ? teal : blue, 'right');
  });
  if (b === 2)
    foot(c, 'What did the experiment test?', 'Both methods ran on the same fifty cases.');
  else {
    const p = cue(t, 3, 'a drop of four percentage points');
    withAlpha(c, p, () =>
      foot(
        c,
        recallResult + ' percentage points on this study',
        'Explain the hypothesis and the failed comparison. Deployment is untested.',
      ),
    );
  }
}

function connection(c, t) {
  const b = t.beat.beatIndex,
    nodes = [175, 495, 885, 1370],
    y = 294;
  const steps = [
    cue(t, 0, 'Request forty-two', 0.5),
    cue(t, 0, 'enters the gateway', 0.8),
    cue(t, 0, 'checks tenant B', 0.9),
    cue(t, 0, 'crosses into their store', 1.15),
  ];
  const first = cue(t, 1, 'returns cursor C seventeen', 0.5),
    next = cue(t, 1, 'requests the next page', 0.65);
  const second = cue(t, 2, 'The second response returns', 0.48),
    stop = cue(t, 2, 'Stop here', 0);
  const outward = mix(
    mix(mix(nodes[0], nodes[1], steps[1]), nodes[2], steps[2]),
    nodes[3],
    steps[3],
  );
  const traceX = mix(mix(mix(outward, nodes[2], first), nodes[3], next), nodes[2], second);
  title(c, 'Follow one runbook lookup', 'Captured request  /  source B  /  tenant B', true);
  line(c, 307, 202, 1104, 202, '#68888c', 3);
  mono(c, 'GATEWAY SERVICE  ·  MY CONTRACT AND ADAPTER', 325, 190, 24, '#b4d0c7');
  line(c, 1158, 177, 1158, 366, brass, 3, [8, 9]);
  mono(c, 'PLATFORM TEAM', 1370, 194, 24, peach, 'center');
  for (let i = 0; i < 3; i++) arrow(c, nodes[i] + 32, y, nodes[i + 1] - 36, y, '#6b8990');
  ['Support UI', 'Tenant check', 'Adapter', 'Tenant store'].forEach((name, i) => {
    dot(c, nodes[i], y, 24, '#314957');
    dot(c, nodes[i], y, 12, i === 3 ? brass : mint);
    type(c, name, nodes[i], y + 76, 36, pale, 'Sans', 'center');
  });
  withAlpha(c, steps[0], () => {
    box(c, traceX - 75, y - 66, 150, 39, pale);
    mono(c, 'req-42', traceX, y - 37, 28, dark, 'center');
  });
  if (b === 0) {
    withAlpha(c, steps[2], () =>
      foot(
        c,
        'Tenant B authorized',
        'The gateway checks the tenant before the adapter accesses credentials.',
        true,
      ),
    );
    return;
  }
  const pages = trace(second === 1 ? 2 : first === 1 ? 1 : 0);
  line(c, 75, 407, 1510, 407, '#53717b', 2);
  mono(c, 'PAGE', 90, 454, 25, '#b3c7c9');
  mono(c, 'REQUEST CURSOR', 280, 454, 25, '#b3c7c9');
  mono(c, 'RETURNED CURSOR', 673, 454, 25, '#b3c7c9');
  const pageRow = (page, i, request, reply) => {
    const yy = 531 + i * 92;
    withAlpha(c, request, () => {
      mono(c, String(page.page).padStart(2, '0'), 98, yy, 36, pale);
      mono(c, page.requestedCursor ?? 'START', 280, yy, 40, pale);
    });
    withAlpha(c, reply, () => {
      arrow(c, 505, yy - 15, 605, yy - 15, '#93a9ad');
      mono(c, page.nextCursor, 680, yy, 45, i ? peach : mint);
    });
  };
  pageRow(REPEATED_CURSOR_PAGES[0], 0, 1, first);
  pageRow(REPEATED_CURSOR_PAGES[1], 1, next, second);
  box(c, 1040, 473, 465, 159, '#284551');
  mono(c, 'ADAPTER HISTORY', 1076, 521, 26, '#bad1cd');
  mono(c, '{ ' + pages.cursors.join(', ') + ' }', 1076, 597, 47, mint);
  const tested = cue(t, 3, 'My assertion checks', 0);
  if (stop > 0 && pages.duplicate)
    foot(
      c,
      'Incomplete result  ·  ' + pages.pages + ' requests',
      tested
        ? 'Regression test  ✓  status is incomplete  ✓  request count is 2'
        : 'The adapter stops at the repeated cursor. No third request leaves the gateway.',
      true,
    );
  else if (pages.duplicate)
    foot(
      c,
      'C-17 is already in the history.',
      'A terminal cursor would mark a complete result.',
      true,
    );
  else
    foot(
      c,
      'What happens if the bookmark comes back again?',
      'Only a terminal cursor marks the last page.',
      true,
    );
}

function choice(c, t) {
  const b = t.beat.beatIndex;
  if (b < 2) {
    title(
      c,
      'Where is the lookup waiting?',
      'Controlled serial request  /  unchanged source quota',
    );
    const split = cue(t, 1, 'The split adds twenty milliseconds', 0),
      x = 200,
      scale = 0.93;
    for (const [i, name] of ['In process', 'Separate service'].entries()) {
      const y = 283 + i * 192;
      if (i && cue(t, 0, 'Suppose we split') === 0) continue;
      type(c, name, 72, y - 13, 36, ink, 'Serif');
      box(c, x, y + 16, wait.wait * scale, 68, '#62748a');
      for (let q = 10; q < wait.wait * scale; q += 23)
        line(c, x + q, y + 20, x + q, y + 30, '#b9c8d2', 2);
      mono(c, 'Source wait   1,000 ms', x + 35, y + 64, 31, paper);
      box(c, x + wait.wait * scale, y + 16, wait.other * scale, 68, teal);
      mono(c, '200 ms', x + (wait.wait + wait.other * 0.5) * scale, y + 64, 31, paper, 'center');
      const edge = x + wait.before * scale;
      if (i) withAlpha(c, split, () => box(c, edge, y + 16, wait.hop * scale, 68, rust));
      if (!i || split > 0)
        mono(c, (i ? wait.after : wait.before) + ' ms', edge + 48, y + 64, 32, i ? rust : ink);
      else mono(c, '+ hop?', edge + 38, y + 64, 30, rust);
    }
    if (b === 0) foot(c, 'With a 20 ms remote hop, what is the new total?');
    else
      foot(
        c,
        'The quota still accounts for 1,000 ms.',
        'A new service boundary leaves the upstream limit in place.',
      );
  } else {
    const dispatchPhrase = 'B gets the fourth worker';
    cue(t, 3, dispatchPhrase, 0.8);
    let dispatch = 0;
    if (b === 3) {
      const { start, end } = t.wordCue(dispatchPhrase);
      dispatch = smooth(t.reveal(dispatchPhrase, end - start, { captionStart: false }));
    }
    const queued = afterCue(t, 2, 'B has work ready');
    const capPlanned = afterCue(t, 2, 'we limit A to three');
    const reverse = afterCue(t, 3, "If a per-adapter budget still can't protect its neighbor");
    const begin = dispatch > 0;
    const assigned = dispatch === 1;
    title(c, 'Who gets a worker?', begin
      ? 'Next scheduling window  /  four workers'
      : 'Current scheduling window  /  four workers');
    if (capPlanned)
      mono(c, begin ? 'A budget now applies: 3 workers' : 'Next window: A budget = 3',
        103, 218, 30, teal);
    const prior = slots(4, 0);
    const y = 273;
    const xAt = i => 99 + i * 351;
    prior.forEach((owner, i) => {
      const x = xAt(i);
      box(c, x + 6, y + 7, 300, 182, '#c9c6b9');
      box(c, x, y, 300, 182, ink);
      mono(c, 'WORKER 0' + (i + 1), x + 20, y + 42, 26, '#dde0e0');
      for (let j = 0; j < 4; j++)
        line(c, x + 236 + j * 12, y + 18, x + 236 + j * 12, y + 34, '#9dabbb', 3);
      if (i < prior.length - 1 || !begin) {
        box(c, x + 18, y + 66, 264, 95, blue);
        type(c, 'Adapter ' + owner, x + 150, y + 130, 44, paper, 'Serif', 'center');
      } else {
        box(c, x + 18, y + 66, 264, 95, '#3d4957');
        if (dispatch < 0.72) type(c, 'Available', x + 150, y + 130, 40, '#dde0e0', 'Serif', 'center');
      }
    });
    mono(c, assigned ? 'Dispatch complete' : 'Ready queue', 103, 554, 31, muted);
    if (queued) {
      const from = { x: 430, y: 502 };
      const to = { x: xAt(prior.length - 1) + 18, y: y + 66 };
      const x = mix(from.x, to.x, Math.min(1, dispatch / 0.72));
      const top = mix(from.y, to.y, Math.max(0, (dispatch - 0.72) / 0.28));
      if (begin && !assigned) {
        line(c, from.x + 132, from.y + 47, x + 132, from.y + 47, teal, 5);
        if (top < from.y) line(c, x + 132, from.y + 47, x + 132, top + 47, teal, 5);
      }
      box(c, x, top, 264, 95, teal);
      type(c, 'Adapter ' + revisedSlots.at(-1), x + 132, top + 64, 44, paper, 'Serif', 'center');
    }
    line(c, 68, 621, 1532, 621);
    type(c, assigned ? 'B runs on worker 04.' : 'Where can B run in the next window?',
      69, 670, 41, ink, 'Serif');
    if (reverse)
      type(c, 'Reconsider isolation if B still waits with A capped.', 70, 704, 28, muted);

  }
}

const strandColors = ['#94a29c', rust, teal, '#acafa7'];
function strand(c, x0, x1, y0, y1, p, color, w) {
  if (p <= 0) return;
  const dx = x1 - x0,
    dy = y1 - y0;
  c.beginPath();
  c.moveTo(x0, y0);
  c.bezierCurveTo(
    x0 + (p * dx) / 3,
    y0,
    x0 + (2 * p * dx) / 3,
    y0 + dy * p * p,
    x0 + p * dx,
    y0 + dy * smooth(p),
  );
  c.lineWidth = w;
  c.strokeStyle = color;
  c.stroke();
}
function comparison(c, t) {
  const b = t.beat.beatIndex;
  if (b < 2) {
    title(
      c,
      'Did any searches get worse?',
      '200 frozen query IDs  /  one labeled runbook per query',
    );
    const x0 = 321,
      x1 = 1279;
    const old = cue(t, 0, 'the baseline found'),
      current = cue(t, 0, 'The candidate found');
    for (const [x, name, n, p] of [
      [x0, 'Baseline', pairs.baselineHits, old],
      [x1, 'Candidate', pairs.candidateHits, current],
    ]) {
      type(c, name, x, 228, 39, ink, 'Sans', 'center');
      withAlpha(c, p, () => {
        type(c, pct(n / pairs.n), x, 325, 96, ink, 'Serif', 'center');
        mono(c, n + ' / ' + pairs.n, x, 370, 31, muted, 'center');
      });
    }
    if (!b) {
      arrow(c, 574, 281, 1028, 281, '#94a29c', 4);
      type(c, 'Relevant guide in the first five results', 800, 526, 50, ink, 'Serif', 'center');
      foot(c, 'Can the two scores answer that question?');
      return;
    }
    const kept = cue(t, 1, 'Join the results', 1.3),
      gain = cue(t, 1, 'The twenty-two rising threads', 1.05),
      loss = cue(t, 1, 'Eight fall', 0.95);
    const pitch = 0.88,
      top = 398,
      missEnd = 636,
      n = buckets.map((g) => g.length);
    const at = [
      [top, top],
      [top + n[0] * pitch, missEnd - (n[3] + n[1]) * pitch],
      [missEnd - (n[3] + n[2]) * pitch, top + n[0] * pitch],
      [missEnd - n[3] * pitch, missEnd - n[3] * pitch],
    ];
    for (const i of [0, 3, 2, 1])
      buckets[i].forEach((q, j) => {
        const [a, z] = at[i],
          p = [kept, loss, gain, kept][i];
        strand(
          c,
          x0,
          x1,
          a + (j + 0.5) * pitch,
          z + (j + 0.5) * pitch,
          p,
          strandColors[i],
          q.id === sample.id ? 2.8 : 0.86,
        );
      });
    for (const [x, hit, align, dx] of [
      [x0, pairs.baselineHits, 'right', -22],
      [x1, pairs.candidateHits, 'left', 22],
    ]) {
      box(c, x - 4, top, 8, hit * pitch, ink);
      box(c, x - 4, missEnd - (pairs.n - hit) * pitch, 8, (pairs.n - hit) * pitch, ink);
      type(c, hit + ' hits', x + dx, top + 70, 32, ink, 'Sans', align);
      type(c, pairs.n - hit + ' misses', x + dx, missEnd, 32, ink, 'Sans', align);
    }
    withAlpha(c, gain, () => type(c, n[2] + ' gained', 800, 266, 39, teal, 'Sans', 'center'));
    withAlpha(c, loss, () => type(c, n[1] + ' lost', 800, 326, 39, rust, 'Sans', 'center'));
    const math = cue(t, 1, 'Fourteen extra hits');
    if (math > 0)
      foot(
        c,
        n[2] -
          n[1] +
          ' extra hits / 200 queries = +' +
          pairs.percentagePointChange +
          ' percentage points',
        'About +9.5% relative to the baseline’s 148 hits.',
      );
    else if (kept > 0)
      foot(
        c,
        'Follow the same query from left to right.',
        '140 queries hit on both paths. 30 missed on both.',
      );
  } else if (b === 2) {
    title(
      c,
      'Which result pair should we open?',
      '8 baseline-only hits  /  selected from the 200 matched searches',
    );
    const x0 = 331,
      x1 = 1232;
    type(c, 'Baseline hit', x0, 232, 42, ink, 'Serif', 'center');
    type(c, 'Candidate miss', x1, 232, 42, ink, 'Serif', 'center');
    const progress = cue(t, 2, 'Follow that same ID', 1.8);
    buckets[1].forEach((q, i) => {
      const a = 321 + i * 18,
        z = 460 + i * 18;
      const selected = q.id === sample.id;
      strand(c, x0, x1, a, z, 1, selected ? rust : '#b19c8c', selected ? 4 : 2);
      dot(c, x0, a, 4, rust);
      dot(c, x1, z, 4, rust);
      if (selected) {
        const x = mix(x0, x1, progress),
          y = mix(a, z, smooth(progress));
        dot(c, x, y, 11, rust);
        mono(c, q.id, x, y - 29, 36, rust, 'center');
      }
    });
    foot(
      c,
      'One thread, one query, two ranked lists.',
      'Open the results at both ends of the selected thread.',
    );
  } else if (b === 4 && cue(t, 4, 'If there were three relevant guides', 0) > 0) {
    title(c, 'How much did one hit retrieve?', 'Separate query  /  three labeled guides');
    const strip = (items, y) => items.forEach((name, i) => {
      const x = 420 + i * 228;
      const found = foundGuides.includes(name);
      box(c, x, y - 54, 192, 82, found ? teal : '#e0ddcf');
      type(c, name, x + 96, y, 38, found ? paper : ink, 'Serif', 'center');
    });
    type(c, 'Relevant guides', 70, 318, 42, ink, 'Serif');
    strip(relevantGuides, 318);
    type(c, 'Retrieved top five', 70, 519, 42, ink, 'Serif');
    strip(retrievedGuides, 519);
    if (cue(t, 4, 'recall would be one third') > 0)
      foot(c, 'Hit@5 = 1     ·     Recall@5 = ' + foundGuides.length + ' / ' + relevantGuides.length,
        'Restore is in the results. Verify and Reopen are still missing.');
    else foot(c, 'Which relevant guides did this search find?');
  } else if (b < 5) {
    const swap = cue(t, 4, 'Watch the last two guides switch places', 1.4);
    title(
      c,
      'Where did the DNS guide go?',
      sample.id + '  /  one relevant guide: DNS',
    );
    const x = 337,
      dx = 204,
      split = x + 4.5 * dx;
    line(c, split, 218, split, 630, rust, 4, [10, 7]);
    mono(c, 'Top-five cutoff', split, 198, 27, rust, 'center');
    ranks.before.forEach((name, i) => mono(c, '#' + (i + 1), x + i * dx, 273, 36, muted, 'center'));
    const strips = (row, progress, y) => {
      row.forEach((name, i) => {
        const oldIndex = row === ranks.after ? ranks.before.indexOf(name) : i;
        const cx = x + dx * mix(oldIndex, i, progress);
        const laneOffset =
          (name === 'DNS' ? -64 : name === 'Health' ? 64 : 0) * Math.sin(Math.PI * progress);
        const cy = y + laneOffset;
        box(c, cx - 85, cy - 35, 170, 73, name === ranks.target ? '#a64528' : '#e4dfcf');
        type(c, name, cx, cy + 14, 38, name === ranks.target ? paper : ink, 'Serif', 'center');
      });
    };
    type(c, 'Baseline', 70, 355, 36);
    strips(ranks.before, 1, 344);
    type(c, 'Candidate', 70, 539, 36);
    if (swap > 0) strips(ranks.after, swap, 527);
    else {
      const unchanged = ranks.before.slice(0, 4);
      strips(unchanged, 1, 527);
      for (let i = unchanged.length; i < ranks.after.length; i++)
        line(c, x + i * dx - 60, 543, x + i * dx + 60, 543, rule, 3);
    }
    const hit = rank(ranks.before) <= 5,
      miss = rank(ranks.after) > 5;
    if (swap === 1 && hit && miss && cue(t, 4, 'Health makes the cutoff', 0) > 0)
      foot(
        c,
        'DNS fell from fifth to sixth. The candidate lost this hit.',
        'Inspect all eight regressions and the tenant coverage of a held-out sample.',
      );
    else
      foot(c, 'Which guide takes the fifth slot?', 'The relevance label stays on DNS.');
  } else {
    const reject = cue(t, 5, 'replaces true with the number one', 0);
    const wrongId = cue(t, 5, 'A missing ID', 0);
    const input = pairInputs[wrongId > 0 ? 2 : reject > 0 ? 1 : 0];
    const verdict = classify(input);
    title(c, 'Can these reports be paired?', 'Two result files  /  join by query ID');
    const left = Object.entries(baselinePair),
      right = Object.entries(input);
    type(c, 'Baseline', 210, 253, 43, ink, 'Serif');
    type(c, 'Candidate', 1120, 253, 43, ink, 'Serif');
    const y = (i) => 376 + i * 152;
    left.forEach(([k, v], i) => {
      const j = right.findIndex(([id]) => id === k);
      if (j >= 0)
        strand(
          c,
          558,
          1060,
          y(i),
          y(j),
          cue(t, 5, 'Match the IDs', 0.9),
          typeof right[j][1] !== 'boolean' ? rust : teal,
          5,
        );
      mono(c, k + '    ' + String(v), 217, y(i) + 12, 42, ink);
    });
    right.forEach(([k, v], i) =>
      mono(
        c,
        k + '    ' + String(v),
        1110,
        y(i) + 12,
        42,
        typeof v !== 'boolean' || !Object.hasOwn(baselinePair, k) ? rust : ink,
      ),
    );
    const answer = cue(t, 5, "That's zero change");
    if (wrongId > 0)
      foot(
        c,
        'Reject the pair. The candidate lacks query A.',
        'An equal row count can hide a different set of IDs.',
      );
    else if (reject > 0)
      foot(
        c,
        'Reject the pair. Numeric 1 is an invalid hit.',
        'Each hit must be a literal Boolean.',
      );
    else if (answer > 0)
      foot(
        c,
        'Both pairs agree  ·  ' + verdict.data.percentagePointChange + ' percentage points',
        'File order can change while the identities and outcomes stay fixed.',
      );
  }
}

const blockColors = ['#667988', '#506686', '#486e68', '#ad654c', '#78627a', '#8b794e'];
const plan = TALK_BUDGET.map((row) => row.value);
const planLabels = ['Context', 'Path', 'Decision', 'Evidence', 'Limit', 'Q&A'];
function timeStrip(c, x, y, w, values, labels, colors, unit, progress = values.map(() => 1)) {
  let left = x;
  values.forEach((v, i) => {
    const span = v * unit;
    withAlpha(c, progress[i], () => {
      box(c, left + 1, y, span - 3, w, colors[i]);
      mono(c, v + 'm', left + span / 2, y + w / 2 + 13, 34, paper, 'center');
      type(c, labels[i], left + span / 2, y + w + 42, 30, ink, 'Sans', 'center');
    });
    left += span;
  });
}
function rehearsal(c, t) {
  const b = t.beat.beatIndex,
    x = 85,
    unit = 88;
  if (b === 3) {
    title(
      c,
      'What survives a ninety-second rehearsal?',
      'Listen for your decision, contribution, result and limit',
    );
    const cues = [
      'A partner waited',
      'I put the adapters',
      'The later source',
      'Source difficulty',
    ];
    const quotes = [
      'A partner waited 20 days.',
      'I wrote the contract and the cursor test.',
      'The later source took 6 days.',
      'The two sources might differ in difficulty.',
    ];
    quotes.forEach((txt, i) => {
      const a = cue(t, 3, cues[i]);
      line(c, 242, 262 + i * 96, 1470, 262 + i * 96, rule, 2);
      withAlpha(c, a, () => {
        dot(c, 172, 243 + i * 96, 12, i === 2 ? teal : blue);
        type(c, txt, 252, 249 + i * 96, 45, ink, 'Serif');
      });
    });
    foot(c, 'Ask a listener what you owned and how they know.');
    return;
  }
  const cut = cue(t, 2, 'Trim a minute', 0.1);
  const questions = cue(t, 1, 'A question takes three more', 0.2);
  title(
    c,
    b === 0 ? 'What fits in fifteen minutes?' : 'Where do you resume after the question?',
    'Interview rehearsal  /  example allocation',
  );
  const ticks = (y) => {
    for (let i = 0; i <= 15; i++) {
      line(c, x + i * unit, y, x + i * unit, y + (i % 3 === 0 ? 21 : 10), muted, 2);
      if (i % 3 === 0) mono(c, i, x + i * unit, y - 14, 27, muted, 'center');
    }
  };
  ticks(239);
  const phaseWords = [
    'two minutes for context',
    'four for the request path',
    'three for a decision',
    'three for evidence',
    'one for limits',
    'two for questions',
  ];
  timeStrip(
    c,
    x,
    271,
    110,
    plan,
    planLabels,
    blockColors,
    unit,
    phaseWords.map((word) => cue(t, 0, word, 0.32)),
  );
  if (!b) {
    foot(c, 'Keep time for an interruption.', 'Ask whether Q&A is included in the slot.');
    return;
  }
  const spent = [budget.context, budget.path, ...(questions > 0 ? [budget.questions] : [])];
  const from = sum(spent),
    rest = budget.total - from;
  timeStrip(
    c,
    x,
    505,
    79,
    spent,
    ['Context', 'Path', 'Q&A'],
    [blockColors[0], blockColors[1], blockColors[5]],
    unit,
  );
  if (cut > 0)
    timeStrip(
      c,
      x + from * unit,
      505,
      79,
      budget.replacement,
      planLabels.slice(2, 5),
      blockColors.slice(2, 5),
      unit,
    );
  else {
    const ex = x + from * unit;
    box(c, ex + 2, 505, rest * unit - 3, 79, '#e1ddce');
    mono(c, rest + ' minutes left', ex + (rest * unit) / 2, 556, 32, ink, 'center');
  }
  if (b === 1)
    foot(
      c,
      'Can the remaining blocks fit?',
      'Decision, evidence and limits were scheduled for 3 + 3 + 1 minutes.',
    );
  else if (!cut)
    foot(
      c,
      budget.remaining + ' minutes available  ·  ' + budget.oldContinuation + ' minutes planned',
    );
  else
    foot(
      c,
      '2 + 3 + 1 = ' + budget.newContinuation + ' minutes',
      'The decision and your contribution share two minutes. Keep the evidence and its limit.',
    );
}

function rates(c, t) {
  const earlier = cue(t, 1, 'The earlier rate is one per million', 0.35);
  const later = cue(t, 1, 'The later rate is two per million', 0.35);
  title(
    c,
    'Which quarter had the higher incident rate?',
    'Exposure in millions of requests  /  one dot per incident',
  );
  withAlpha(c, earlier, () => mono(c, 'PER 1M REQUESTS', 1174, 215, 29, muted));
  for (const [i, row] of periods.entries()) {
    const y = 308 + 183 * i,
      x = 382,
      scale = 139;
    type(c, i ? 'Later quarter' : 'Earlier quarter', 67, y + 19, 40, ink, 'Serif');
    for (let j = 0; j < row.millions; j++) {
      const w = Math.min(1, row.millions - j) * scale;
      box(c, x + j * scale, y - 40, w - 2, 80, i ? '#dfb599' : '#becdcb');
    }
    for (let j = 0; j < row.incidents; j++)
      dot(c, x + (scale * row.millions * (j + 0.5)) / row.incidents, y, 14, i ? rust : teal);
    mono(
      c,
      row.incidents +
        ' incident' +
        (row.incidents === 1 ? '' : 's') +
        ' / ' +
        row.millions +
        'M requests',
      x,
      y + 91,
      28,
      ink,
    );
    withAlpha(c, i ? later : earlier, () => {
      box(c, 1177, y - 40, scale - 2, 80, i ? '#dfb599' : '#becdcb');
      for (let j = 0; j < incidence[i]; j++)
        dot(c, 1177 + (scale * (j + 0.5)) / incidence[i], y, 14, i ? rust : teal);
      mono(c, incidence[i] + ' / 1M', 1343, y + 12, 32, i ? rust : teal);
    });
  }
  if (later === 1)
    foot(
      c,
      'The count fell. The observed rate doubled.',
      'Compare severity, definitions and observation windows before attributing a change.',
    );
  else foot(c, 'Compare the incidents per million requests.');
}

function gate(c, t, g, { final = false, note = '' } = {}) {
  const inputBeat = final ? 5 : 2;
  const answerBeat = inputBeat + 1;
  const latency = afterCue(
    t,
    inputBeat,
    final ? 'seven hundred eighty milliseconds' : 'six hundred eighty milliseconds',
  );
  const attempts = afterCue(
    t,
    inputBeat,
    final ? 'One of forty attempts times out' : 'Twenty of two hundred attempts time out',
  );
  const completions = afterCue(t, inputBeat, 'The rest succeed');
  const latencyLimit = final || afterCue(t, inputBeat, 'below eight hundred milliseconds');
  const minimumSuccess = final || afterCue(t, inputBeat, 'ninety-nine percent of attempts');
  const result = afterCue(
    t,
    answerBeat,
    final ? "That's ninety-seven and a half percent" : 'is ninety percent',
    true,
  );
  const latencyJudgment = final
    ? afterCue(t, answerBeat, 'below ninety-nine')
    : afterCue(t, answerBeat, 'The latency passes');
  const successJudgment = final
    ? latencyJudgment
    : afterCue(t, answerBeat, 'Availability fails');
  const verdict = afterCue(t, answerBeat, 'Hold promotion', true);

  title(
    c,
    final ? 'Would you move more traffic?' : 'Can we promote this rollout?',
    'Separate service sample  /  ' + g.attempts + ' attempts',
    true,
  );
  const success = g.attempts - g.timeouts;
  const x = 130,
    span = 1100,
    y = 294;
  const timeX = (ms) => x + (span * ms) / 900;
  mono(c, 'SUCCESSFUL-REQUEST P95', x, 230, 28, '#bbcecd');
  box(c, x, y, span, 24, '#304754');
  if (latency) {
    box(c, x, y, timeX(g.successfulP95Ms) - x, 24, mint);
    mono(c, g.successfulP95Ms + ' ms', timeX(g.successfulP95Ms), y + 79, 35, pale, 'center');
  }
  if (latencyLimit) {
    const limit = timeX(g.latencyLimitMs);
    line(c, limit, y - 43, limit, y + 45, peach, 4, [8, 6]);
    mono(c, '< ' + g.latencyLimitMs + ' ms', limit, y - 55, 28, peach, 'center');
  }
  if (latencyJudgment)
    mono(
      c, g.latencyPasses ? 'PASS' : 'FAIL', 1480, y + 26, 40,
      g.latencyPasses ? mint : peach, 'right',
    );

  const attemptsY = 493;
  mono(c, 'ALL ATTEMPTS', x, 442, 28, '#bbcecd');
  box(c, x, attemptsY, span, 61, '#304754');
  if (attempts) {
    const w = span / g.attempts;
    for (let i = completions ? 0 : success; i < g.attempts; i++)
      box(c, x + i * w, attemptsY, w - 0.9, 61, i < success ? mint : peach);
    mono(c, g.timeouts + ' timed out / ' + g.attempts + ' attempts', x, 611, 32, pale);
  }
  if (minimumSuccess) {
    const limit = x + span * g.minimumSuccess;
    line(c, limit, attemptsY - 30, limit, attemptsY + 81, pale, 4, [8, 6]);
    mono(c, '≥ ' + pct(g.minimumSuccess), limit, attemptsY - 43, 30, pale, 'center');
    mono(
      c,
      'Need ' + requiredSuccesses(g) + ' / ' + g.attempts + ' successes',
      x + span, 611, 32, pale, 'right',
    );
  }
  if (successJudgment)
    mono(
      c, g.successPasses ? 'PASS' : 'FAIL', 1480, attemptsY + 44, 40,
      g.successPasses ? mint : peach, 'right',
    );

  const fraction = success + ' / ' + g.attempts + ' = ' + pct(g.successFraction);
  const decision = g.passes ? 'Promote' : 'Hold promotion';
  foot(
    c,
    result ? fraction + (verdict ? '   ·   ' + decision : '') : 'Both conditions must pass.',
    result ? note : 'Use all attempts in the success fraction.',
    true,
  );
}

function routeState(stage) {
  const bothFixture = stage === 'Offline replay';
  const copies = stage === 'Read-only shadow';
  const newServes = stage === 'Canary serving a small share';
  return { bothFixture, copies, newServes, oldServes: !bothFixture && !newServes };
}

function routing(c, t) {
  const b = t.beat.beatIndex;
  const shadow = cue(t, 4, 'Then shadow', 0.8),
    copied = cue(t, 4, 'copies a thousand reads', 0.4),
    logged = cue(t, 4, 'Three audit entries are written', 0.4);
  const stopped = cue(t, 5, 'Three audit entries remain', 0.2),
    canary = cue(t, 6, 'route a small real share', 0.5),
    rollback = cue(t, 6, 'switch the next request back', 0.5);
  const stage =
    b === 6
      ? rollback > 0
        ? 'Returned to old path'
        : canary > 0
          ? 'Canary serving a small share'
          : 'Canary prechecks'
      : !shadow
        ? 'Offline replay'
        : stopped > 0
          ? 'Shadow stopped'
          : 'Read-only shadow';
  title(
    c,
    stage,
    b === 6
      ? 'Separate canary example  /  route for the selected request'
      : 'Connector migration  /  response owner and completed effects',
    true,
  );
  const x0 = 352,
    x1 = 904,
    x2 = 1252,
    y0 = 284,
    y1 = 488;
  const { oldServes, newServes, bothFixture, copies } = routeState(stage);
  const left = bothFixture ? 'Fixture' : 'Lookup',
    right = bothFixture ? 'Compare' : 'User';
  function path(y, live, out) {
    const color = live ? mint : '#527078';
    line(c, x0, 383, x0 + 112, y, color, 5);
    arrow(c, x0 + 112, y, x1 - 120, y, color, 5);
    if (out) {
      line(c, x1 + 116, y, x2 - 57, 383, mint, 5);
      arrow(c, x2 - 57, 383, x2 + 8, 383, mint, 5);
    }
  }
  path(y0, bothFixture || oldServes, bothFixture || oldServes);
  path(y1, bothFixture || copies || newServes, bothFixture || newServes);
  type(c, left, 78, 402, 54, pale, 'Serif');
  type(c, right, x2 + 26, 402, 50, pale, 'Serif');
  type(c, 'Old path', x1, y0 + 15, 42, pale, 'Sans', 'center');
  type(c, 'Candidate', x1, y1 + 15, 40, pale, 'Sans', 'center');
  if (b < 6 && logged > 0) {
    mono(c, 'Audit log', 89, 604, 29, '#c5d3d1');
    for (let i = 0; i < audit.entries; i++) {
      box(c, 340 + i * 87, 564, 65, 55, '#ddac85');
      mono(c, '0' + (i + 1), 372 + i * 87, 603, 27, dark, 'center');
    }
  } else if (b < 6 && bothFixture)
    mono(c, 'Known labels  ·  sanitized requests', 86, 604, 32, mint);
  if (b === 6) {
    foot(
      c,
      newServes
        ? 'This user receives the candidate response.'
        : rollback > 0
          ? 'The next user receives the old response.'
          : 'Check gates and test the route back.',
      rollback > 0
        ? 'Earlier writes require separate recovery.'
        : 'Define the observation window and the quality, latency and error gates.',
      true,
    );
  } else if (stopped > 0)
    foot(
      c,
      audit.candidateServed +
        ' candidate-served responses  ·  ' +
        audit.entries +
        ' audit entries remain',
      'Stopping future copies preserves completed audit records.',
      true,
    );
  else if (copied > 0)
    foot(
      c,
      audit.copied.toLocaleString('en-US') + ' copied reads  ·  old path serves all user responses',
      logged > 0
        ? 'If the shadow stops now, what remains?'
        : 'A shadow can use quota and write audit records.',
      true,
    );
  else if (shadow > 0)
    foot(c, 'The candidate executes a copy.', 'The old path still serves the user.', true);
  else
    foot(
      c,
      'Replay both paths against the labeled fixture.',
      'Observe authorization, paging, errors and ranked results.',
      true,
    );
}
function operations(c, t) {
  const b = t.beat.beatIndex;
  if (b < 2) rates(c, t);
  else if (b < 4) gate(c, t, SERVICE_CHECK);
  else routing(c, t);
}

const fixedContext = [
  'query-141',
  'DNS label',
  'corpus r12',
  'tenant B',
  'index k2',
  'retriever v3',
];
function replay(c, t) {
  const b = t.beat.beatIndex;
  title(
    c,
    b ? 'How would you isolate the connector path?' : 'Did the connector cause this loss?',
    sample.id + '  /  DNS guide',
  );
  if (!b) {
    const x0 = 303,
      x1 = 1222,
      y0 = 318,
      y1 = 525;
    mono(c, 'Original baseline', x0, 248, 30, muted, 'center');
    mono(c, 'Original candidate', x1, 248, 30, muted, 'center');
    line(c, 236, 427, 1345, 427, rule, 4, [11, 9]);
    mono(c, 'Top-five cutoff', 844, 411, 28, rust);
    const p = cue(t, 0, 'fall from fifth to sixth', 1);
    strand(c, x0, x1, y0, y1, 1, '#bcb6aa', 4);
    strand(c, x0, x1, y0, y1, p, rust, 8);
    dot(c, x0, y0, 16, teal);
    type(c, '#' + rank(ranks.before) + '   Hit', x0 - 28, y0 + 10, 38, teal, 'Sans', 'right');
    dot(c, x1, y1, 16, rust);
    type(c, '#' + rank(ranks.after) + '   Miss', x1 + 28, y1 + 11, 38, rust);
    foot(
      c,
      'The original comparison leaves the cause open.',
      'Could a different index build also explain the loss of DNS?',
    );
    return;
  }
  const fork = cue(t, 1, 'Fork the same query', 0.7);
  mono(c, 'OBSERVED', 72, 231, 26, muted);
  type(c, 'DNS   #5 → #6', 291, 234, 44, rust, 'Serif');
  line(c, 69, 266, 1534, 266, rule, 3);
  mono(c, 'HELD FIXED IN BOTH REPLAYS', 82, 328, 26, muted);
  fixedContext.forEach((name, i) => {
    const x = 86 + (i % 3) * 238,
      y = 406 + Math.floor(i / 3) * 107;
    dot(c, x + 8, y - 11, 7, teal);
    type(c, name, x + 27, y, 32);
  });
  mono(c, 'same query text, code and settings', 85, 611, 27, muted);
  withAlpha(c, fork, () => {
    const x = 832;
    line(c, 787, 467, x, 467, blue, 4);
    line(c, x, 373, x, 557, blue, 4);
    for (const [i, name] of ['Old path', 'New path'].entries()) {
      const y = 373 + i * 184;
      arrow(c, x, y, 945, y, blue, 4);
      type(c, name, 966, y + 12, 37, ink, 'Serif');
      arrow(c, 1127, y, 1191, y, blue);
      box(c, 1211, y - 43, 299, 87, '#e1e1d2');
      mono(c, 'DNS rank  ?', 1234, y + 12, 31, ink);
    }
  });
  foot(
    c,
    'Change the path alone. Both replay ranks are pending.',
    'Recompute the paired counts and open each regression when the replay finishes.',
  );
}

function edgeOfKnowledge(c, t) {
  const model = cue(t, 2, 'For model-selected calls', 0.25);
  if (model > 0) {
    title(c, 'Who checks a model-selected call?', 'Live tool request  /  tenant B');
    const nodes = [189, 772, 1366];
    ['Model', 'Tenant check', 'Adapter'].forEach((word, i) => {
      const x = nodes[i];
      if (i === 1) {
        box(c, x - 120, 262, 240, 193, teal);
        box(c, x - 52, 307, 104, 89, paper);
        dot(c, x, 333, 16, teal);
        box(c, x - 7, 342, 14, 30, teal);
      } else {
        dot(c, x, 360, 72, i === 0 ? blue : ink);
        type(c, i === 0 ? 'M' : 'A', x, 384, 71, paper, 'Serif', 'center');
      }
      type(c, word, x, 539, 47, ink, 'Serif', 'center');
    });
    arrow(c, 279, 358, 628, 358, blue);
    arrow(c, 912, 358, 1277, 358, teal);
    foot(
      c,
      'Authorize each live call in the service.',
      'Four passing evaluation cases cover four examples.',
    );
    return;
  }
  title(c, 'What can my trace establish?', 'Instrumented store call  /  sanitized request');
  const x = 215,
    w = 1105;
  line(c, x, 412, x + w, 412, blue, 10);
  dot(c, x, 412, 17, blue);
  dot(c, x + w, 412, 17, blue);
  type(c, 'Call store', x, 350, 43, ink, 'Serif', 'center');
  type(c, 'Return', x + w, 350, 43, ink, 'Serif', 'center');
  brace(c, x, x + w, 456, '320 ms inside this call', teal);
  foot(
    c,
    'My adapter trace locates the wait.',
    'Ask the store owners to compare query plans for a slow call and a similar fast call.',
  );
}

function practice(c, t) {
  const predicting = t.beat.beatIndex === 3;
  const selected = afterCue(t, 3, 'restores two of the lost hits');
  const move = 'Move those two queries';
  const elapsed = predicting ? 0 : t.elapsed - t.wordCue(move).start;
  if (!predicting) t.reveal(move, 0, { captionStart: move });
  const progress = (seconds) => smooth(Math.max(0, Math.min(1, seconds)));
  const counts = afterCue(t, 4, 'Twenty now hit on both paths and one still regresses', true);
  const candidate = afterCue(t, 4, 'The candidate has twenty-six', true);
  const gain = afterCue(
    t,
    4,
    'Five extra hits over forty queries gives twelve and a half percentage points',
    true,
  );

  title(
    c,
    'What changes when two lost hits return?',
    'Fresh query set  /  one dot per query  /  hit = labeled guide in the top five',
  );
  const x = (column) => 425 + column * 48;
  const y = (row) => 258 + row * 109;
  const corridor = (y(0) + y(1)) / 2;
  practiceGroups.forEach(({ label, key, color, rows }, row) => {
    type(c, label, 82, y(row) + 12, 38, ink, 'Serif');
    if (elapsed <= 0 || counts || row >= 2)
      mono(c, fresh[counts].counts[key], 348, y(row) + 11, 37, color, 'right');
    rows.forEach((q, column) => {
      if (!restoredIds.includes(q.id)) dot(c, x(column), y(row), 15, color);
    });
  });
  const lift = 0.25,
    travel = 0.8;
  restoredIds.forEach((id, i) => {
    const seconds = elapsed - i * 0.65;
    const start = x(practiceGroups[1].rows.findIndex((q) => q.id === id));
    const end = x(practiceGroups[0].rows.length + i);
    const landed = progress((seconds - lift - travel) / lift);
    const cx = mix(start, end, progress((seconds - lift) / travel));
    const cy = mix(y(1), corridor, progress(seconds / lift)) + (y(0) - corridor) * landed;
    dot(c, cx, cy, 15, landed === 1 ? teal : rust);
    if (selected) {
      c.strokeStyle = ink;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(cx, cy, 21, 0, Math.PI * 2);
      c.stroke();
    }
  });

  const { baselineHits, n } = fresh[0];
  const candidateHits = elapsed <= 0 ? fresh[0].candidateHits : candidate ? fresh[1].candidateHits : '?';
  let caption = '';
  if (predicting && selected) caption = 'Predict the new candidate count and gain.';
  if (gain) {
    const delta = fresh[1].candidateHits - baselineHits;
    caption =
      delta + ' extra hits / ' + n + ' queries = +' + fresh[1].percentagePointChange + ' percentage points';
  }
  foot(c, 'Baseline ' + baselineHits + ' / ' + n + '   ·   Candidate ' + candidateHits + ' / ' + n, caption);
}
function finale(c, t) {
  const b = t.beat.beatIndex;
  if (b < 2) replay(c, t);
  else if (b === 2) edgeOfKnowledge(c, t);
  else if (b < 5) practice(c, t);
  else {
    const recovered = afterCue(t, 6, 'two queries regained a top-five hit on the retrieval fixture');
    const next = afterCue(t, 6, 'trace the timeout');
    const recovery = restoredIds.length + ' hits restored in the retrieval test.';
    const note = recovered ? recovery + (next ? ' Inspect the last loss and trace the timeout.' : '') : '';
    gate(c, t, fresh[1].service, { final: true, note });
  }
}

function draw(c, clock) {
  const ch = clock.beat.chapterIndex,
    b = clock.beat.beatIndex;
  const room = (ch === 0 && b < 2) || (ch === 4 && b === 0) || (ch === 5 && b === 3);
  const night = ch === 2 || (ch === 6 && b >= 2) || (ch === 7 && b >= 5);
  if (room) {
    seminarRoom(c);
    c.save();
    c.translate(263, 96);
    c.scale(0.854, 0.818);
  } else {
    box(c, 0, 0, 1920, 1080, night ? dark : '#e6dfcf');
    box(c, 0, 0, 1920, 10, night ? mint : rust);
    c.save();
    c.translate(28, 29);
    c.scale(1.165, 1.14);
  }
  sheet(c, night);
  [onboarding, argument, connection, choice, comparison, rehearsal, operations, finale][ch](
    c,
    clock,
  );
  c.restore();
  if (room) {
    presenter(c);
    const hand =
      ch === 4
        ? cue(clock, 0, 'Did any queries get worse', 0.9) *
          (1 - cue(clock, 1, 'Join the results', 1))
        : 0;
    audience(c, hand);
  }
}

function check() {
  assert.deepEqual(days, [20, 6]);
  assert.equal(days[0] - days[1], 14);
  assert.equal(ms[0] - ms[1], 40);
  assert(ms.every((n) => n < latencyLimit));
  assert.equal(recallResult, -4);
  assert.deepEqual(trace(1).cursors, ['C-17']);
  assert(trace(1).canRequest);
  assert.equal(trace(2).pages, 2);
  assert(trace(2).duplicate && !trace(2).canRequest && !trace(2).complete);
  const sequence = ['C9', 'C10', 'C9'].map((nextCursor, i, all) => ({
    page: i + 1,
    requestedCursor: i ? all[i - 1] : null,
    nextCursor,
  }));
  assert(inspectPageTrace(sequence).duplicate);
  assert(inspectPageTrace([{ page: 1, requestedCursor: null, nextCursor: null }]).complete);
  assert.equal(wait.before, wait.wait + wait.other);
  assert.equal(wait.after, wait.before + wait.hop);
  assert.deepEqual(revisedSlots, ['A', 'A', 'A', 'B']);
  assert.deepEqual(
    buckets.map((g) => g.length),
    [140, 8, 22, 30],
  );
  assert.equal(buckets.flat().length, pairs.n);
  assert.deepEqual(
    [pairs.baselineHits, pairs.candidateHits, pairs.percentagePointChange],
    [148, 162, 7],
  );
  assert.equal(sample.id, 'query-141');
  assert.equal(rank(ranks.before), 5);
  assert.equal(rank(ranks.after), 6);
  assert.equal(sample.baseline, rank(ranks.before) <= 5);
  assert.equal(sample.candidate, rank(ranks.after) <= 5);
  assert.deepEqual(ranks.after.slice(0, 4), ranks.before.slice(0, 4));
  assert.deepEqual(foundGuides, ['Restore']);
  assert.equal(foundGuides.length / relevantGuides.length, 1 / 3);
  assert.deepEqual(
    pairInputs.map((x) => classify(x).valid),
    [true, false, false],
  );
  assert.equal(classify(pairInputs[0]).data.percentagePointChange, 0);
  assert.throws(() => pairedEvidence({}, {}));
  assert.deepEqual(plan, [2, 4, 3, 3, 1, 2]);
  assert.equal(sum(plan), budget.total);
  assert.equal(budget.remaining, budget.newContinuation);
  assert.equal(budget.oldContinuation - budget.remaining, 1);
  assert.deepEqual(incidence, [1, 2]);
  assert.equal(1 - periods[1].incidents / periods[0].incidents, 0.8);
  assert(routeState('Offline replay').bothFixture);
  assert(routeState('Read-only shadow').oldServes && routeState('Read-only shadow').copies);
  assert(routeState('Shadow stopped').oldServes && !routeState('Shadow stopped').copies);
  assert(routeState('Canary serving a small share').newServes);
  assert(
    routeState('Returned to old path').oldServes && !routeState('Returned to old path').newServes,
  );
  assert.equal(audit.candidateServed, 0);
  assert.equal(audit.entries, 3);
  for (const { key, rows } of practiceGroups) assert.equal(rows.length, fresh[0].counts[key]);
  assert.deepEqual(
    fresh.map((stats) => [
      stats.counts.both,
      stats.counts.baselineOnly,
      stats.baselineHits,
      stats.candidateHits,
      stats.percentagePointChange,
    ]),
    [
      [18, 3, 21, 24, 7.5],
      [20, 1, 21, 26, 12.5],
    ],
  );
  assert.deepEqual(restoredIds, ['new-18', 'new-19']);
  assert.deepEqual(
    fresh[1].rows,
    fresh[0].rows.map((q) => ({ ...q, candidate: q.candidate || restoredIds.includes(q.id) })),
  );
  for (const [sample, fraction, required] of [
    [SERVICE_CHECK, 0.9, 198],
    [fresh[1].service, 0.975, 40],
  ]) {
    assert.equal(sample.successFraction, fraction);
    assert.equal(requiredSuccesses(sample), required);
    assert.equal(sample.successPasses, sample.attempts - sample.timeouts >= required);
    assert(sample.latencyPasses && !sample.successPasses && !sample.passes);
  }
}
export default { title: 'Make One Engineering Claim Defensible', draw, check };
