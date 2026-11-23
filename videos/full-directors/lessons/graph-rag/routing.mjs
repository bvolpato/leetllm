import assert from 'node:assert/strict';
import { CONTEXT_CANDIDATES } from '../../../films/graph-rag/fixtures.mjs';
import { packContext, dynamicTree, workloadCost } from '../../../films/graph-rag/model.mjs';
import { dependsOn, usesPolicy, sourceSentence } from './incident-path.mjs';
import {
  C,
  txt,
  box,
  line,
  disc,
  arrow,
  paper,
  mark,
  cut,
  base,
  foot,
  slip,
  node,
} from './print.mjs';
const budget = 90;
const labels = { relation: 'Dependency', text: 'Policy note', report: 'Cache report' };
const pigments = { relation: C.blue, text: C.teal, report: '#9c5938' };
// Table 1 compares each dynamic run to static level one on the same questions.
const apNews = {
  levelOne: { questions: 50, level: 1, costChangePercent: -77 },
  deeper: { questions: 29, level: 3, costChangePercent: 34 },
};
function ranked(replay) {
  return CONTEXT_CANDIDATES.map((r) =>
    replay && r.id === 'report' ? { ...r, score: 0.99 } : r,
  ).sort((a, b) => b.score - a.score);
}
function ribbon(c, x, y, w, h, items, accepted) {
  box(c, x, y, w, h, '#e2ddcb', C.dim);
  let left = x;
  for (const r of items.filter((i) => accepted.includes(i.id))) {
    const span = (w * r.tokens) / budget;
    box(c, left, y, span, h, pigments[r.id]);
    txt(c, labels[r.id] + '  ' + r.tokens, left + span / 2, y + h * 0.65, Math.min(26, h * 0.58), {
      align: 'center',
      color: C.light,
      w: span - 10,
    });
    left += span;
  }
}
function incidentBridge(c, k, b) {
  const searching = b === 2 && cut(k, 2, 'both directions');
  const x = [160, 600, 1030],
    y = 250;
  const nodes = [dependsOn.from, dependsOn.to, usesPolicy.to];
  const widths = [214, 195, 254];
  for (const [i, name] of nodes.entries()) {
    const origin = i === (searching ? 1 : 0);
    node(c, x[i], y, name, { w: widths[i], fill: origin ? C.mint : C.light });
    if (origin)
      txt(c, searching ? 'SEARCH FROM HERE' : 'SEMANTIC SEED', x[i], y - 42, 17, {
        align: 'center',
        bold: true,
        color: C.teal,
      });
  }
  for (const [i, edge] of [dependsOn, usesPolicy].entries()) {
    const from = x[i] + widths[i] / 2 + 5,
      to = x[i + 1] - widths[i + 1] / 2 - 5;
    const color = i === 0 ? C.blue : C.teal;
    arrow(c, from, y, to, y, color);
    txt(c, edge.relation + ' · ' + edge.source, (from + to) / 2, y - 17, 22, {
      align: 'center',
      color,
      w: to - from + 22,
    });
    const words = sourceSentence(edge).split(/ (?=still uses)/);
    slip(
      c,
      i ? 592 : 51,
      392,
      i ? 559 : 510,
      141,
      'NOTE ' + edge.source + '   /   ' + edge.relation,
      words,
      { color, size: 27 },
    );
  }
  if (searching) {
    disc(c, x[1], 319, 6, C.ochre);
    arrow(c, x[1] - 8, 319, x[0], 319, C.ochre, mark(k, 2, 'An incoming edge', 0.65));
    arrow(c, x[1] + 8, 319, x[2], 319, C.ochre, mark(k, 2, 'An outgoing edge', 0.65));
    txt(c, 'Candidate search from redis-cache', x[1], 358, 22, { align: 'center' });
  }
  foot(
    c,
    b === 7
      ? 'The first pack contains the dependency from 1842 and the policy passage from 2031.'
      : searching
        ? 'Follow incoming and outgoing links to find candidates. Read each claim in its stored direction.'
        : 'Rank these linked entities, relationships and passages alongside reports for the available space.',
  );
}
export function local(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2 || b === 7) {
    const seed = cut(k, 1, 'semantically related entity') || b === 7;
    base(
      c,
      seed
        ? 'How does a service lead to a policy note?'
        : 'Where would you look for one API timeout?',
      'LOCAL SEARCH   /   CONTEXT BRIDGE',
    );
    if (seed) incidentBridge(c, k, b);
    else {
      slip(c, 50, 203, 306, 176, 'BASIC  /  EXAMPLE API GUIDE', [
        'Embeddings API',
        'Timeout: 30 seconds.',
      ]);
      foot(c, 'The retrieved guide gives the setting directly.');
    }
    return;
  }
  if (b === 8) {
    base(c, 'How many sources occupy three result slots?', 'LOCAL SEARCH   /   DEDUPLICATION');
    const dedup = cut(k, 8, 'Removing duplicates');
    const before = ['B3 · passage 1', 'B3 · passage 2', 'B3 · passage 3'];
    const after = ['B3 · passage 1', 'B1 · passage 1', 'B4 · passage 1'];
    for (let i = 0; i < 3; i++)
      slip(c, 65 + 371 * i, 227, 330, 153, 'RANK   ' + (i + 1), [(dedup ? after : before)[i]], {
        size: 31,
      });
    txt(
      c,
      new Set((dedup ? after : before).map((s) => s.split(' · ')[0])).size +
        (dedup ? ' distinct catalogue IDs' : ' distinct catalogue ID'),
      600,
      485,
      42,
      { align: 'center', family: 'Serif' },
    );
    foot(
      c,
      'Example refill from the next eligible hits. Measuring theme frequency needs a defined population.',
    );
    return;
  }
  const replay = cut(k, 5, 'point nine nine'),
    items = ranked(replay);
  const steps = replay
    ? cut(k, 6, 'Take the report first')
      ? 3
      : 0
    : cut(k, 4, 'Leave out the report')
      ? 3
      : cut(k, 3, 'Slide the policy note')
        ? 2
        : cut(k, 3, 'Place the dependency')
          ? 1
          : 0;
  const pack = packContext(items.slice(0, steps), budget);
  base(c, 'What fits in ninety tokens?', 'LOCAL SEARCH   /   GREEDY WHOLE-ITEM PACKING');
  if (replay) {
    txt(c, 'Previous pack', 59, 168, 18, { bold: true, color: C.dim });
    ribbon(c, 221, 146, 827, 34, ranked(false), packContext(ranked(false), budget).accepted);
  }
  txt(c, 'Ranked evidence', 58, 222, 26, { family: 'Serif' });
  txt(c, 'Score', 512, 222, 21);
  txt(c, 'Tokens', 678, 222, 21);
  txt(c, 'This pack', 890, 222, 21);
  items.forEach((r, i) => {
    const y = 237 + 64 * i,
      taken = pack.accepted.includes(r.id),
      rejected = pack.rejected.includes(r.id);
    box(c, 57, y, 1085, 55, taken ? C.mint : rejected ? '#e9d8c9' : C.light);
    box(c, 57, y, 7, 55, pigments[r.id]);
    txt(c, labels[r.id], 80, y + 37, 27, { family: 'Serif' });
    txt(c, r.score.toFixed(2), 512, y + 37, 25, { family: 'Mono' });
    txt(c, r.tokens, 677, y + 37, 25, { family: 'Mono' });
    txt(c, taken ? 'Packed' : rejected ? 'Too long' : 'Waiting', 890, y + 37, 24, {
      color: taken ? C.teal : rejected ? C.red : C.dim,
    });
  });
  ribbon(c, 59, 450, 1084, 52, items, pack.accepted);
  txt(c, pack.used + ' tokens packed', 58, 544, 23, { color: C.dim });
  txt(c, pack.remaining + ' of 90 free', 1143, 544, 25, {
    align: 'right',
    bold: true,
    color: C.blue,
  });
  foot(
    c,
    replay
      ? 'Only the report score changed. All three lengths and the budget are fixed.'
      : 'Take the next whole item if its length fits the remaining space.',
  );
}
function ratingProgress(k, beat, phrase) {
  const b = k.beat.beatIndex + 1;
  if (b !== beat) return Number(b > beat);
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: phrase });
}

function treeView(c, x, tree, progress, blocked, title, count) {
  const y = 160,
    w = 540;
  paper(c, x, y, w, 340);
  txt(c, title, x + 20, y + 35, 23, { bold: true, color: C.dim });
  const pos = {
    Serving: [168, 102],
    Eval: [425, 102],
    Cache: [91, 237],
    Queue: [247, 237],
    Metric: [425, 237],
  };
  for (const [a, z] of [
    ['Serving', 'Cache'],
    ['Serving', 'Queue'],
    ['Eval', 'Metric'],
  ]) {
    const [ax, ay] = pos[a],
      [zx, zy] = pos[z];
    const start = [x + ax, y + ay + 31];
    const end = [x + zx, y + zy - 32];
    line(c, ...start, ...end, C.muted, 2);
    if (blocked.includes(a)) {
      const mx = start[0] + (end[0] - start[0]) * 0.38;
      const my = start[1] + (end[1] - start[1]) * 0.38;
      line(c, ...start, mx, my, C.red, 3);
      disc(c, mx, my, 11, C.light, C.red);
      line(c, mx - 4, my - 4, mx + 4, my + 4, C.red, 2);
      line(c, mx - 4, my + 4, mx + 4, my - 4, C.red, 2);
    } else {
      arrow(c, ...start, ...end, C.teal, progress[z] ?? 0, 4);
    }
  }
  for (const [id, [dx, dy]] of Object.entries(pos)) {
    const nx = x + dx,
      ny = y + dy;
    const parent = id === 'Metric' ? 'Eval' : 'Serving';
    const root = id === 'Serving' || id === 'Eval';
    const rated = progress[id] === 1;
    const skipped = !root && blocked.includes(parent);
    const color = rated ? (tree.scores[id] >= 0.5 ? C.teal : C.red) : C.dim;
    const width = 136;
    paper(c, nx - width / 2, ny - 30, width, 60, rated ? (color === C.teal ? C.mint : C.pink) : C.page, color);
    txt(c, id, nx, ny - 2, 25, { align: 'center', color, family: 'Serif' });
    const value = rated ? tree.scores[id].toFixed(1) : skipped ? 'Unrated' : '·';
    txt(c, value, nx, ny + 22, 20, { align: 'center', color, bold: rated });
  }
  if (count !== undefined) {
    const outcome = count === 1 ? '1 leaf selected' : count + ' leaves selected';
    txt(c, outcome, x + 20, y + 315, 24, { bold: true, color: count ? C.teal : C.red });
  }
}
export function selection(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2) {
    base(c, 'How many map calls cover this level?', 'GLOBAL SEARCH   /   REPORT BATCHES');
    const n = 12,
      perBatch = 6,
      open = cut(k, 1, 'six reports fit');
    for (let i = 0; i < n; i++) {
      const group = Math.floor(i / perBatch),
        j = i % perBatch,
        x = 73 + j * 100,
        y = 212 + 142 * group;
      paper(c, x, y, 83, 99, open ? (group ? C.mint : '#d6e1e9') : C.light);
      txt(c, 'R' + (i + 1), x + 42, y + 59, 28, { align: 'center', family: 'Serif' });
    }
    if (open)
      for (let g = 0; g < Math.ceil(n / perBatch); g++) {
        arrow(c, 676, 260 + 142 * g, 765, 260 + 142 * g, C.red);
        slip(c, 777, 199 + 142 * g, 341, 112, 'MAP CALL   ' + (g + 1), [
          '6 reports → rated points',
        ]);
      }
    foot(
      c,
      b === 2
        ? 'Longer reports can require more batches. Parallel calls still consume their input tokens.'
        : 'Map each batch, then reduce the retained points across batches.',
    );
    return;
  }
  if (b >= 8) {
    const subset = cut(k, 9, 'twenty-nine questions');
    const study = subset ? apNews.deeper : apNews.levelOne;
    const result = subset ? cut(k, 9, 'The comparison tells') : cut(k, 8, 'A smaller model');
    base(c, 'What did the AP News comparison measure?', 'GLOBAL SEARCH   /   NOVEMBER 2024');
    const bars = [
      ['Static level 1', 100],
      ['Dynamic level ' + study.level, 100 + study.costChangePercent],
    ];
    const scope =
      'Average token cost   /   ' +
      study.questions +
      (subset ? ' questions where level 3 selected more reports' : ' global questions');
    txt(c, scope, 59, 201, 28, { family: 'Serif' });
    bars.forEach(([label, v], i) => {
      const y = 264 + i * 130;
      txt(c, label, 62, y + 43, 26, { family: 'Serif' });
      if (i && !result) return;
      box(c, 340, y, v * 5, 62, i ? C.teal : C.blue);
      txt(c, v, 355 + v * 5, y + 44, 31, { family: 'Mono' });
    });
    foot(
      c,
      subset
        ? result
          ? 'On these 29 questions, level 3 cost 34% more on average than static level 1.'
          : 'Static level 1 sets the cost index to 100 on these same 29 questions.'
        : result
          ? 'Dynamic level 1 cost 77% less on average than static level 1. The model judges rated answer quality separately.'
          : 'Static level 1 sets the cost index to 100 on these 50 questions.',
    );
    return;
  }
  const first = dynamicTree();
  const changed = ratingProgress(k, 5, 'Change just the Serving score to point two') === 1;
  const second = dynamicTree(changed ? 0.2 : first.scores.Serving);
  const replay = ratingProgress(k, 5, 'Run the same selector again') === 1;
  const before = {
    Serving: ratingProgress(k, 3, 'Serving scores point nine'),
    Cache: ratingProgress(k, 3, 'Cache gets point eight'),
    Queue: ratingProgress(k, 3, 'Queue gets point seven'),
    Eval: ratingProgress(k, 4, 'Eval gets point one'),
  };
  const servingBlocked = ratingProgress(k, 6, 'It visits neither leaf under Serving') === 1;
  const allBlocked = ratingProgress(k, 6, 'Both roots failed, so it rates no children at all') === 1;
  const firstDone = before.Eval === 1;
  base(c, 'Which leaves get rated?', 'DYNAMIC SELECTION   /   THRESHOLD ≥ 0.5');
  treeView(c, 48, first, before, firstDone ? ['Eval'] : [], 'First pass', firstDone ? first.selected.length : undefined);
  treeView(
    c,
    612,
    second,
    replay ? { Serving: 1, Eval: 1 } : {},
    allBlocked ? ['Serving', 'Eval'] : servingBlocked ? ['Serving'] : [],
    replay ? 'Replay · same hierarchy' : 'Replay · waiting for input',
    allBlocked ? second.selected.length : undefined,
  );
  const note = allBlocked
    ? 'Same reports and threshold. Lowering Serving’s score stopped the search at the roots.'
    : changed
      ? 'Serving now scores 0.2. Which leaves receive a rating?'
      : 'The selector rates a child only after its parent reaches 0.5.';
  txt(c, note, 49, 540, 25, { w: 1095 });
}

const profileSources = [
  { service: 'inference-api', source: '1842', excerpt: 'inference-api depends on redis-cache.' },
  { service: 'Search', source: 'S', excerpt: 'Search also depends on Redis.' },
];
function activeProfiles(added, withdrawn) {
  return profileSources.slice(0, added && !withdrawn ? 2 : 1);
}
export function indexing(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b < 5) {
    base(
      c,
      b < 3 ? 'When is the model work done?' : 'What did the low build cost buy?',
      'INDEX STRATEGIES   /   ONE REFRESH',
    );
    if (b < 3) {
      const methods = [
        ['Standard', 'Extract & merge descriptions', 'Write reports', 'Read reports'],
        ['Fast', 'Link co-occurring phrases', 'Write reports', 'Read reports'],
        ['Lazy', 'Index phrases & statistics', '', 'Test passages within budget'],
      ];
      txt(c, 'Before the question', 351, 200, 28, { family: 'Serif' });
      txt(c, 'After the question', 840, 200, 28, { family: 'Serif' });
      line(c, 793, 172, 793, 530, C.red, 2);
      methods.forEach(([name, step, report, result], i) => {
        if (i === 2 && b === 1) return;
        const y = 228 + 108 * i;
        txt(c, name, 58, y + 43, 31, { family: 'Serif', color: C.blue });
        box(c, 231, y, 523, 80, i === 2 ? C.mint : C.light);
        txt(c, step, 249, y + 35, 24);
        if (report) txt(c, report, 249, y + 64, 21, { color: C.teal });
        arrow(c, 753, y + 42, 819, y + 42, C.red);
        txt(c, result, 828, y + 51, 24, { w: 310 });
      });
      foot(
        c,
        b === 1
          ? 'Each report batch supplies a partial answer for the reducer.'
          : 'Standard and Fast precompute reports. Lazy spends its relevance-test budget after a question arrives.',
      );
    } else {
      slip(
        c,
        57,
        190,
        507,
        261,
        'NOVEMBER 2024   /   AP NEWS',
        ['5,590 articles', 'One index build'],
        { size: 40 },
      );
      paper(c, 610, 190, 531, 261);
      txt(c, 'LAZY BUILD COST   /   FULL INDEX = 1,000 CELLS', 631, 225, 18, {
        bold: true,
        color: C.teal,
        w: 492,
      });
      const reported = cut(k, 3, 'a tenth of one percent');
      for (let n = 0; n < 1000; n++)
        box(
          c,
          638 + (n % 50) * 9.4,
          251 + Math.floor(n / 50) * 6.3,
          8.2,
          5.2,
          n === 0 && reported ? C.red : '#c1c7b8',
        );
      if (reported) {
        line(c, 641, 253, 624, 253, C.red, 2);
        line(c, 624, 253, 624, 409, C.red, 2);
        line(c, 624, 409, 644, 409, C.red, 2);
        txt(c, '≈ 1 of 1,000  ·  about 0.1%', 653, 421, 30, { family: 'Serif', color: C.red });
      }
      if (b === 4)
        txt(c, '100 synthetic questions · model-judge comparison', 600, 519, 28, {
          align: 'center',
          family: 'Serif',
        });
      foot(
        c,
        'This measurement covers indexing on that collection. Count queries between refreshes for total cost.',
      );
    }
  } else {
    const added = cut(k, 6, 'merges it'),
      withdrawn = cut(k, 6, 'Withdraw the new note'),
      rows = activeProfiles(added, withdrawn);
    base(c, 'Which Redis link survives a withdrawal?', 'LIGHTRAG   /   SOURCE-LINKED PROFILES');
    const showNew = cut(k, 5, 'Now add one note');
    const visible = showNew ? profileSources : profileSources.slice(0, 1);
    visible.forEach((r, i) => {
      const y = 174 + i * 196,
        active = rows.includes(r),
        removed = i === 1 && withdrawn;
      slip(
        c,
        53,
        y,
        510,
        146,
        (removed ? 'WITHDRAWN   /   ' : 'SOURCE   /   ') + r.source,
        [r.excerpt],
        { size: 28, color: removed ? C.red : C.teal, fill: removed ? '#e8d6c8' : C.light },
      );
      if (active) {
        txt(c, 'depends on', 682, y + (i ? 91 : 52), 22, { color: C.blue, align: 'center' });
        arrow(c, 568, y + 77, 793, 327, C.teal);
      }
    });
    node(c, 959, 329, 'Redis Cache', { w: 302, fill: C.mint });
    txt(c, rows.length + ' supported ' + (rows.length === 1 ? 'link' : 'links'), 958, 406, 26, {
      align: 'center',
      color: C.teal,
    });
    foot(
      c,
      b === 5
        ? '“Redis” retrieves entity detail. “Service dependencies” retrieves relationship profiles and their sources.'
        : withdrawn
          ? 'Search lost its only source. Record 1842 still supports inference-api → Redis.'
          : 'Merge the new document’s graph into the existing cache identity.',
    );
  }
}

const routes = [
  { kind: 'Fact', name: 'Basic', accuracy: 0.96, p95: 95, limit: 200 },
  { kind: 'Fact', name: 'Local', accuracy: 0.96, p95: 240, limit: 200 },
  { kind: 'Trend', name: 'Basic', accuracy: 0.61, p95: 92, limit: 700 },
  { kind: 'Trend', name: 'Global', accuracy: 0.91, p95: 580, limit: 700 },
];
const eligible = (r) => r.accuracy >= 0.9 && r.p95 <= r.limit;
function billChart(c, q, shown, cross) {
  const left = 94,
    bottom = 495,
    right = 660,
    top = 207;
  const X = (n) => left + ((right - left) * n) / 500,
    Y = (n) => bottom - ((bottom - top) * n) / 900;
  for (const n of [0, 300, 600, 900]) {
    const y = Y(n);
    line(c, left, y, right, y, '#c7c4b5', 1);
    txt(c, n, left - 12, y + 6, 17, { align: 'right', color: C.dim });
  }
  txt(c, 'Total cost (units)', left, top - 16, 19, { color: C.dim });
  line(c, left, top, left, bottom, C.dim);
  line(c, left, bottom, right, bottom, C.dim);
  for (const n of [0, 250, 500])
    txt(c, n, X(n), bottom + 28, 19, { align: 'center', color: C.dim });
  for (const [key, col] of [
    ['deferred', C.ochre],
    ['precomputed', C.blue],
  ]) {
    line(c, left, Y(workloadCost(0)[key]), right, Y(workloadCost(500)[key]), col, 4);
    if (shown[key]) disc(c, X(q), Y(workloadCost(q)[key]), 6, col, C.light);
  }
  if (q !== null) {
    c.save();
    c.setLineDash([4, 5]);
    line(c, X(q), top, X(q), bottom, C.dim, 1.5);
    c.restore();
    txt(c, 'Q = ' + q, Math.min(595, X(q) + 12), 159, 20, { color: C.ink });
  }
  if (cross) {
    const n = workloadCost(0).crossover;
    disc(c, X(n), Y(workloadCost(n).precomputed), 8, C.red, C.light);
    line(
      c,
      X(n),
      Y(workloadCost(n).precomputed) - 10,
      X(n),
      Y(workloadCost(n).precomputed) - 47,
      C.red,
      2,
    );
    txt(c, '≈ ' + n.toFixed(1), X(n), Y(workloadCost(n).precomputed) - 54, 20, {
      color: C.red,
      align: 'center',
    });
  }
  txt(c, 'Queries per refresh', 397, 551, 19, { align: 'center', color: C.dim });
  const result = q === null ? null : workloadCost(q);
  for (const [i, [title, formula, key, col]] of [
    ['Deferred', '1 + 1.7Q', 'deferred', C.ochre],
    ['Precomputed', '200 + 0.8Q', 'precomputed', C.blue],
  ].entries()) {
    const y = 204 + 146 * i;
    slip(c, 718, y, 433, 123, title.toUpperCase(), [formula], { size: 32, color: col });
    if (shown[key])
      txt(c, '= ' + result[key], 1126, y + 75, 32, { align: 'right', color: col, bold: true });
  }
}
export function workload(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 5) {
    const q = cut(k, 3, 'move to five hundred') ? 500 : cut(k, 2, 'ten queries') ? 10 : null;
    const shown = {
      deferred: q === 500 ? cut(k, 4, 'You pay') : q === 10 && cut(k, 3, 'Precomputing costs'),
      precomputed:
        q === 500
          ? cut(k, 4, 'Deferred work costs')
          : q === 10 && cut(k, 3, 'Deferred work is cheaper'),
    };
    const cross = cut(k, 4, 'At two hundred twenty-two');
    base(
      c,
      'Which bill is smaller before the next refresh?',
      'WORKLOAD COST   /   BOTH STRATEGIES MEET 90% SUPPORTED ACCURACY',
    );
    billChart(c, q, shown, cross);
    if (q === 500) txt(c, 'Earlier: Q = 10   •   18 vs. 208', 733, 509, 21, { color: C.dim });
    foot(
      c,
      b === 5
        ? 'More frequent rebuilds reduce the number of queries that repay each build.'
        : cut(k, 4, 'Each refresh starts')
          ? '199 extra build units ÷ 0.9 saved per query. Precompute from 222 whole queries.'
          : 'Compute one index build plus the cost of its queries. The axes use supplied example units.',
    );
  } else if (b <= 7) {
    base(
      c,
      'Which routes meet both release gates?',
      'ROUTING   /   SUPPORTED ACCURACY AND P95 LATENCY',
    );
    const columns = [64, 236, 427, 670, 866];
    ['Class', 'Route', 'Accuracy ≥ 90%', 'p95 / limit', 'Decision'].forEach((t, i) =>
      txt(c, t, columns[i], 210, 22, { bold: true, color: C.dim }),
    );
    routes.forEach((r, i) => {
      const y = 229 + i * 79,
        show =
          r.kind === 'Fact'
            ? cut(k, 7, 'Release Basic for facts')
            : cut(k, 7, 'Release Global for trends');
      const ok = eligible(r);
      box(c, 48, y, 1104, 68, show ? (ok ? C.mint : C.pink) : C.light);
      const row = [
        r.kind,
        r.name,
        Math.round(r.accuracy * 100) + '%',
        r.p95 + ' / ' + r.limit + ' ms',
        show ? (ok ? 'Release' : r.p95 > r.limit ? 'Over latency' : 'Below accuracy') : '?',
      ];
      row.forEach((v, j) =>
        txt(c, v, columns[j], y + 45, j === 4 ? 23 : 27, {
          color: j === 4 && show ? (ok ? C.teal : C.red) : C.ink,
        }),
      );
    });
    foot(
      c,
      'Apply both limits to each route in its question class. Hold the class if none qualify.',
    );
  } else {
    const withdrawn = cut(k, 8, 'deleted source');
    base(c, 'What must be rebuilt after the evidence changes?', 'MAINTENANCE   /   REFRESH COST');
    const chain = [
      ['Source note', withdrawn ? 'Deleted' : 'Current'],
      ['Only support', withdrawn ? 'Withdraw edge' : 'Cited edge'],
      ['Derived report', withdrawn ? 'Block report' : 'Current'],
    ];
    chain.forEach(([name, value], i) => {
      const x = 56 + 373 * i;
      slip(c, x, 223, 324, 152, name.toUpperCase(), [value], {
        color: withdrawn ? C.red : C.teal,
        size: 33,
        fill: withdrawn ? C.pink : C.light,
      });
      if (i < 2) arrow(c, x + 325, 302, x + 366, 302, C.red);
    });
    txt(
      c,
      b === 9
        ? 'Repair locally where possible. Rebuild broader dependencies when necessary.'
        : 'Entity matching, community boundaries and report text can all change.',
      600,
      471,
      30,
      { family: 'Serif', align: 'center', w: 1090 },
    );
    foot(
      c,
      'Compare supported answers, access failures, p95 latency and refresh-plus-query spend with Basic.',
    );
  }
}

export function checkRouting() {
  assert.deepEqual(
    Object.values(apNews).map(({ questions, costChangePercent }) => [
      questions,
      100 + costChangePercent,
    ]),
    [
      [50, 23],
      [29, 134],
    ],
  );
  assert.deepEqual(
    ranked(false).map((r) => [r.id, r.score, r.tokens]),
    [
      ['relation', 0.98, 30],
      ['text', 0.91, 55],
      ['report', 0.62, 80],
    ],
  );
  assert.deepEqual(packContext(ranked(false), budget), {
    accepted: ['relation', 'text'],
    rejected: ['report'],
    used: 85,
    remaining: 5,
  });
  assert.deepEqual(packContext(ranked(true), budget), {
    accepted: ['report'],
    rejected: ['relation', 'text'],
    used: 80,
    remaining: 10,
  });
  assert.deepEqual(dynamicTree().selected, ['Cache', 'Queue']);
  assert.deepEqual(dynamicTree(0.2).visited, ['Serving', 'Eval']);
  assert.deepEqual(dynamicTree(0.2).selected, []);
  assert.deepEqual(
    activeProfiles(true, false).map((p) => p.source),
    ['1842', 'S'],
  );
  assert.deepEqual(
    activeProfiles(true, true).map((p) => p.source),
    ['1842'],
  );
  const low = workloadCost(10),
    high = workloadCost(500);
  assert.deepEqual(
    [low.deferred, low.precomputed, high.deferred, high.precomputed],
    [18, 208, 851, 600],
  );
  assert(workloadCost(221).precomputed > workloadCost(221).deferred);
  assert(workloadCost(222).precomputed < workloadCost(222).deferred);
  assert.deepEqual(
    routes.filter(eligible).map((r) => r.kind + ' ' + r.name),
    ['Fact Basic', 'Trend Global'],
  );
}
