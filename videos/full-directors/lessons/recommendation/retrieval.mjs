import { documents } from '../../../films/recommendation/fixtures.mjs';
import {
  eligible,
  ranked,
  retrievalOrder,
  candidateRecall,
} from '../../../films/recommendation/construction.mjs';
import { rankScore, reciprocalPrecision } from '../../../films/recommendation/arithmetic.mjs';
import { judgedListState } from '../../../films/recommendation/model.mjs';
import {
  C,
  B,
  cue,
  base,
  heading,
  text,
  tag,
  formula,
  rect,
  line,
  circle,
  arrow,
  shelf,
  book,
  spine,
  glyph,
  ids,
  doc,
  name,
  hue,
  frac,
} from './art.mjs';

const [guide, run, sdk, blog, log, draft, stale] = ids;
const retrievalIds = retrievalOrder.map((d) => d.id);
const grade = (id) => doc(id).relevance;
const ranks = ranked.map((d) => d.id);
const trim = (v) => Number(v.toFixed(3)).toString();

export function openingState(k) {
  return { open: cue(k, 3, 'Open the runbook'), ask: B(k) === 2 };
}
export function opening(c, k) {
  const { open, ask } = openingState(k);
  const turn = cue(k, 3, 'Open the runbook', 0.75);
  base(c);
  text(c, 'Developer search', 126, 116, 37, C.quiet, 'mono');
  const query = 'Payment retry instructions',
    typing = cue(k, 1, 'A developer searches', 1.4);
  circle(c, 147, 195, 32, null, C.quiet);
  line(
    c,
    [
      [169, 218],
      [194, 241],
    ],
    C.quiet,
    8,
  );
  const typed = query.slice(0, Math.ceil(typing * query.length));
  text(c, typed + (typing < 1 ? '│' : ''), 224, 234, 88, C.ink, 'serif');
  line(
    c,
    [
      [120, 267],
      [1795, 267],
    ],
    C.rule,
    2,
  );
  if (open) {
    c.save();
    c.beginPath();
    c.rect(96 + (1 - turn) * 144, 325, 912 - (1 - turn) * 382, 506);
    c.clip();
    rect(c, 111, 361, 909, 466, '#b4a990');
    rect(c, 96, 348, 912, 468, hue(run));
    rect(c, 112, 358, 428, 439, C.pale);
    rect(c, 548, 358, 445, 439, '#f3e7cb');
    line(
      c,
      [
        [543, 362],
        [543, 799],
      ],
      '#6b6653',
      5,
    );
    text(c, 'Checkout runbook', 152, 470, 52, C.ink, 'serif', 'left', 356);
    glyph(c, run, 200, 500, 192, hue(run));
    text(c, 'Retry the same payment', 581, 469, 39, C.ink, 'serif', 'left', 371);
    text(c, 'Reuse the original', 581, 558, 38);
    text(c, 'idempotency key.', 581, 615, 38);
    line(
      c,
      [
        [583, 660],
        [918, 660],
      ],
      C.rule,
    );
    tag(c, 'Match  0.84', 582, 725);
    c.restore();
    if (turn < 1) {
      c.save();
      c.translate(240 - 144 * turn, 339);
      c.scale(1 - turn, 1);
      book(c, run, 0, 0, 530, 480, { label: 'Retry runbook', sub: 'MATCH   0.84' });
      c.restore();
    }
  } else {
    book(c, run, 240, 339, 530, 480, { label: 'Retry runbook', sub: 'MATCH   0.84' });
  }
  book(c, draft, 1135, 339, 530, 480, { label: 'Incident draft', sub: 'MATCH   0.99' });
  shelf(c, 80, 832, 1720);
  text(
    c,
    turn === 1 ? 'Permitted  /  opened' : 'Permitted to this developer',
    518,
    929,
    37,
    C.teal,
    'mono',
    'center',
    820,
  );
  text(c, 'Private  /  access denied', 1397, 929, 37, C.red, 'mono', 'center', 800);
  if (ask) text(c, 'Which page may enter ranking?', 960, 1016, 43, C.ink, 'serif', 'center');
}
export function eligibility(c, k) {
  base(c);
  heading(c, 'Which records can this developer receive?', 'Payment documentation   /   catalog');
  const travel = cue(k, 1, 'Set both aside', 0.8),
    excluded = travel === 1,
    allow = documents.filter((d) => d.current && d.permitted);
  const rows = travel > 0 ? allow : documents;
  text(c, excluded ? 'Eligible for this request' : 'Catalog records', 112, 299, 37);
  rows.forEach((d, i) => spine(c, d.id, 105, 326 + i * 81, 840, 64, frac(d.retrieval, 2)));
  const out = documents.filter((d) => !d.current || !d.permitted);
  if (travel > 0 && travel < 1) {
    out.forEach((d, i) =>
      spine(
        c,
        d.id,
        105 + 965 * travel,
        326 + (5 + i) * 81 + (i * 142 - (5 + i) * 81) * travel,
        840 - 120 * travel,
        64,
        frac(d.retrieval, 2),
      ),
    );
  }
  if (excluded) {
    text(c, 'Set aside', 1077, 299, 37, C.red);
    out.forEach((d, i) => {
      spine(c, d.id, 1070, 326 + i * 142, 720, 66, frac(d.retrieval, 2), true);
      tag(c, d.permitted ? 'Out of date' : 'No access', 1098, 439 + i * 142, C.red);
    });
    text(c, String(allow.length), 1073, 826, 152, C.teal, 'serif');
    text(c, 'eligible pages', 1200, 803, 45);
  }
  if (B(k) >= 2)
    text(
      c,
      B(k) === 2
        ? 'Permission  ·  tenant  ·  deletion  ·  freshness'
        : 'Check current access again at display.',
      110,
      993,
      34,
      C.quiet,
      'mono',
    );
}
export const poolStages = [
  { label: 'Eligible', count: 1000000, color: C.blue },
  { label: 'Retrieved', count: 1000, color: C.teal },
  { label: 'Scored shortlist', count: 100, color: '#8c6438' },
  { label: 'Displayed', count: 10, color: C.ink },
];
export const poolHeight = (count) => 78 * Math.log10(count);
function poolSizeDiagram(c, k) {
  heading(c, 'A smaller pool at each stage', 'One portal request   /   example counts');
  text(c, 'Pages on a logarithmic scale', 106, 294, 37, C.quiet);
  const baseline = 844;
  for (let exponent = 0; exponent <= 6; exponent++) {
    const count = 10 ** exponent;
    const y = baseline - poolHeight(count);
    text(c, count.toLocaleString('en-US'), 255, y + 10, 30, C.quiet, 'mono', 'right');
    line(c, [[277, y], [1790, y]], C.rule, exponent === 0 ? 3 : 1);
  }
  const visible = [
    true,
    cue(k, 3, 'Only one in a thousand'),
    cue(k, 3, 'Ten reach the screen'),
    cue(k, 3, 'That last cut'),
  ];
  poolStages.forEach(({ label, count, color }, i) => {
    const x = 310 + i * 378;
    text(c, label, x, 914, 36);
    if (!visible[i]) return;
    const height = poolHeight(count);
    rect(c, x, baseline - height, 285, height, color);
    text(c, count.toLocaleString('en-US'), x + 14, baseline - 22, 45, C.pale, 'mono', 'left', 257);
  });
  if (visible[1]) {
    const top = baseline - poolHeight(poolStages[0].count);
    const bottom = baseline - poolHeight(poolStages[1].count);
    const x = 640;
    line(c, [[602, top], [x, top]], C.teal, 4);
    arrow(c, x, top, x, bottom, C.teal);
    line(c, [[x, bottom], [680, bottom]], C.teal, 4);
    const perCandidate = poolStages[0].count / poolStages[1].count;
    text(c, '1 in ' + perCandidate.toLocaleString('en-US') + ' reaches scoring',
      x + 30, (top + bottom) / 2 + 10, 35, C.teal);
  }
}
export function judgments(c, k) {
  base(c);
  const b = B(k);
  if (b === 3) {
    poolSizeDiagram(c, k);
    return;
  }
  heading(c, 'One search, five independent judgments', 'Held-out retry search');
  const titles = ['Page', 'Query fit', 'Reliability', 'Judge’s grade'];
  const xs = [110, 820, 1120, 1510];
  titles.forEach((s, i) => text(c, s, xs[i], 315, 34, i === 3 ? C.teal : C.quiet));
  line(
    c,
    [
      [1462, 278],
      [1462, 877],
    ],
    C.teal,
    4,
  );
  retrievalOrder.forEach((d, i) => {
    const y = 360 + i * 100;
    spine(c, d.id, 108, y, 650, 72);
    formula(c, frac(d.queryFit, 2), 829, y + 52, 220, 45);
    formula(c, frac(d.reliability, 2), 1130, y + 52, 220, 45);
    circle(c, 1605, y + 36, 38, hue(d.id));
    text(c, d.relevance, 1605, y + 51, 42, C.pale, 'mono', 'center');
  });
  text(
    c,
    b === 1
      ? '3 direct     2 useful     1 marginal     0 no answer'
      : 'Serving inputs on the left. Held-out targets on the right.',
    110,
    964,
    36,
    C.quiet,
    'mono',
  );
}
export function shortlist(c, k) {
  base(c);
  heading(c, 'Retrieval opens a shelf for the ranker', 'Search   /   candidate budget');
  const b = B(k),
    lift = cue(k, 3, 'Widen the shelf to five', 0.75),
    cut = lift === 1 ? 5 : 3;
  const selected = retrievalIds.slice(0, cut);
  retrievalIds.forEach((id, i) =>
    book(c, id, 99 + i * 348, 365 - (i < 3 ? 30 : 30 * lift), 275, 323, {
      sub: frac(doc(id).retrieval, 2),
    }),
  );
  shelf(c, 72, 707, 1775);
  const bound = 83 + cut * 348 - 40;
  line(
    c,
    [
      [86, 327],
      [86, 304],
      [bound, 304],
      [bound, 327],
    ],
    C.teal,
    6,
  );
  tag(c, cut + ' retrieved', 114, 281);
  if (b >= 2) {
    text(c, 'Judged useful', 102, 826, 38, C.ink, 'serif');
    [guide, run, sdk].forEach((id, i) => {
      const yes = selected.includes(id);
      text(
        c,
        (yes ? '✓  ' : '×  ') + name(id),
        468 + i * 333,
        825,
        34,
        yes ? C.teal : C.red,
        'sans',
      );
    });
    if (cue(k, 2, 'candidate recall is'))
      formula(
        c,
        'Recall   ' + Math.round(candidateRecall(cut) * 3) + ' / 3',
        111,
        969,
        980,
        62,
        C.teal,
      );
  }
}
export function scoring(c, k) {
  base(c);
  heading(c, 'Two features set the score', 'Hand-written reranker   /   eligible pages');
  const show = cue(k, 2, 'Read the totals'),
    order = show ? ranked : retrievalOrder;
  text(c, 'Page', 105, 331, 34);
  rect(c, 705, 307, 23, 23, C.teal);
  text(c, '2 × query fit', 745, 331, 34, C.teal);
  rect(c, 1112, 307, 23, 23, C.blue);
  text(c, '0.6 × reliability', 1153, 331, 34, C.blue);
  text(c, 'Sum', 1655, 331, 34);
  order.forEach((d, i) => {
    const y = 375 + i * 107,
      a = 2 * d.queryFit,
      z = 0.6 * d.reliability,
      scale = 324;
    spine(c, d.id, 106, y, 555, 69);
    rect(c, 705, y + 13, a * scale, 45, C.teal);
    rect(c, 705 + a * scale, y + 13, z * scale, 45, C.blue);
    if (B(k) >= 2) {
      text(c, frac(a, 2), 712, y + 47, 28, C.pale, 'mono', 'left', Math.max(75, a * scale - 12));
      text(c, frac(z, 3), 714 + a * scale, y + 47, 27, C.pale, 'mono');
    }
    if (show) formula(c, frac(rankScore(d)), 1620, y + 55, 210, 45);
  });
  if (B(k) === 3)
    text(c, 'Compare the resulting order with held-out judgments.', 109, 990, 38, C.ink, 'serif');
}
function gradeLine(c, label, grades, x, y, scale = 1) {
  text(c, label, x, y, 35 * scale);
  grades.forEach((g, i) => {
    const xx = x + i * 132 * scale;
    rect(c, xx, y + 29 * scale, 112 * scale, 97 * scale, g ? C.teal : '#c9c6b5');
    text(c, g, xx + 56 * scale, y + 102 * scale, 55 * scale, g ? C.pale : C.ink, 'mono', 'center');
    text(c, '#' + (i + 1), xx + 56 * scale, y + 169 * scale, 25 * scale, C.quiet, 'mono', 'center');
  });
}
export function discountedSlot(grade, rank) {
  const gain = 2 ** grade - 1;
  return { rank, gain, contribution: gain / Math.log2(rank + 1) };
}
export const slotFraction = ({ gain, rank }) => gain + ' / log₂(' + (rank + 1) + ')';

export function gainState(k) {
  const cut = cue(k, 3, 'Now cut retrieval') ? 3 : 5;
  const report = judgedListState(retrievalIds.slice(0, cut), { cutoff: cut });
  const local = cut === 3 && B(k) === 3;
  const idealGrades = local ? report.localIdeal : report.ideal;
  const returnedSlots = report.grades.map((g, i) => discountedSlot(g, i + 1));
  const runIndex = report.rows.findIndex((row) => row.id === run);
  const example = cue(k, 2, 'Look at slot four') ? returnedSlots[runIndex] : undefined;
  const speechEnded = k.elapsed >= k.speechDuration;
  const idealTotalKnown = B(k) > 2 || (B(k) === 2 && speechEnded);
  const ratioKnown = cut === 5
    ? cue(k, 3, 'Position accounts for the gap')
    : local ? speechEnded : cue(k, 4, 'The missing runbook');
  return {
    cut, report, local, idealGrades, returnedSlots,
    idealSlots: idealGrades.map((g, i) => discountedSlot(g, i + 1)),
    example, idealTotalKnown, ratioKnown,
    idealTotal: local ? report.localIdcg : report.idcg,
    ratio: local ? report.local : report.system,
  };
}

export function gain(c, k) {
  base(c);
  heading(c, 'How much does each slot contribute?', 'Discounted cumulative gain');
  formula(c, 'Slot contribution = (2^grade − 1) / log₂(rank + 1)', 116, 299, 1678, 42);
  const s = gainState(k);
  const left = 116, right = 1033, stripY = 394;
  gradeLine(c, 'Returned grades', s.report.grades, left, stripY);
  gradeLine(c, s.local ? 'Best among survivors' : 'Best among eligible pages',
    s.idealGrades, right, stripY);

  const addSlots = cue(k, 2, 'Add the five slot contributions');
  const compare = cue(k, 2, 'In the ideal order');
  function terms(slots, x) {
    for (const { rank, contribution } of slots) {
      text(c, trim(contribution), x + 56 + (rank - 1) * 132, 627, 31, C.ink, 'mono', 'center');
    }
  }
  if (addSlots) terms(s.returnedSlots, left);
  if (compare) terms(s.idealSlots, right);

  if (s.example) {
    const { rank, contribution } = s.example;
    const tile = left + (rank - 1) * 132;
    rect(c, tile - 5, stripY + 22, 122, 110, null, C.blue, 4);
    line(c, [[tile + 118, stripY + 78], [tile + 122, stripY + 78], [tile + 122, 680], [tile + 160, 680]], C.blue, 3);
    let detail = name(run) + ' in slot ' + rank;
    if (cue(k, 2, 'That gives about')) detail += '    ' + slotFraction(s.example);
    if (addSlots) detail += ' ≈ ' + trim(contribution);
    text(c, detail, tile + 176, 692, 36, C.blue, 'mono');
  }
  const total = (number) => (Number.isInteger(number) ? ' = ' : ' ≈ ') + trim(number);
  if (compare) formula(c, 'DCG@' + s.cut + total(s.report.dcg), left, 809, 795, 56);
  if (s.idealTotalKnown)
    formula(c, 'Ideal DCG@' + s.cut + total(s.idealTotal), right, 809, 780, 56);
  if (B(k) >= 3) {
    const calculation = 'NDCG@' + s.cut + ' = DCG / ideal DCG';
    const result = s.local ? ' = ' + frac(s.ratio) : ' ≈ ' + frac(s.ratio);
    formula(c, calculation + (s.ratioKnown ? result : ''), left, 951, 1685, 55, C.teal);
  }
}
function rerankedCandidates(cut) {
  const pool = retrievalIds.slice(0, cut);
  const order = ranks.filter((id) => pool.includes(id));
  return { pool, order, report: judgedListState(order) };
}

const narrow = rerankedCandidates(3);
const wide = rerankedCandidates(4);
const displayedAt = (slot) => 755 + slot * 353;

export function universeState(k) {
  const expanded = Boolean(cue(k, 4, 'Give retrieval one more candidate'));
  const reorder = cue(k, 5, 'The ranker moves the runbook', 1.4);
  const { order, report } = reorder === 1 ? wide : narrow;
  return {
    pool: expanded ? wide.pool : narrow.pool,
    expanded,
    reorder,
    order,
    report,
  };
}

export function universe(c, k) {
  base(c);
  heading(c, 'Three display slots. Two possible ideals.', 'Candidate recall   /   NDCG@3');
  const s = universeState(k),
    b = B(k),
    moving = s.reorder > 0 && s.reorder < 1,
    r = s.report,
    spoken = k.elapsed >= k.speechDuration;
  text(c, 'Retrieval order', 109, 309, 34);
  retrievalIds.forEach((id, i) =>
    spine(c, id, 108, 345 + i * 86, 524, 62, frac(doc(id).retrieval, 2), !s.pool.includes(id)),
  );
  if (cue(k, 5, 'The SDK example stays outside')) {
    const sdkY = 345 + retrievalIds.indexOf(sdk) * 86;
    rect(c, 102, sdkY - 6, 540, 79, null, hue(sdk), 4);
  }
  line(
    c,
    [
      [92, 337],
      [71, 337],
      [71, 345 + (s.pool.length - 1) * 86 + 68],
      [92, 345 + (s.pool.length - 1) * 86 + 68],
    ],
    C.teal,
    5,
  );
  text(c, s.pool.length + ' of ' + eligible.length + ' retrieved', 108, 795, 34, C.quiet, 'mono');
  const recallKnown = cue(k, 5, 'Two of the three useful pages');
  if (!s.expanded || recallKnown) {
    const useful = r.universe.filter((item) => item.relevance > 0).length;
    const found = Math.round(candidateRecall(s.pool.length) * useful);
    formula(c, 'Recall  ' + found + ' / ' + useful, 108, 853, 525, 45, C.teal);
  } else if (cue(k, 4, 'The fourth page is the runbook')) {
    const added = s.pool.at(-1);
    text(c, name(added) + ' joins at grade ' + grade(added), 108, 853, 37, hue(added));
  }
  if (b >= 7)
    text(
      c,
      b === 7 ? 'Keep eligibility and judgment versions.' : 'Recall grade > 0    AP grade ≥ 2',
      108, 907, 33, C.quiet, 'sans', 'left', 590,
    );

  const displayLabel = moving
    ? 'Reranking'
    : s.expanded && s.reorder === 0 ? 'Previous order' : 'Reranked order';
  text(c, displayLabel, 755, 309, 38);
  const slots = r.grades.map((g, i) => discountedSlot(g, i + 1));
  slots.forEach(({ rank }, i) => {
    const x = displayedAt(i);
    text(c, 'Slot ' + rank, x + 151, 370, 32, C.quiet, 'mono', 'center');
    rect(c, x, 391, 302, 95, C.field, C.rule);
  });
  const card = (id, slot, { offset = 0, opacity = 1 } = {}) => {
    if (opacity === 0) return;
    c.save();
    c.globalAlpha = opacity;
    spine(c, id, displayedAt(slot) + 8, 400 + offset, 280, 72);
    c.restore();
  };
  if (moving) {
    const phase = (start, end) => Math.max(0, Math.min(1, (s.reorder - start) / (end - start)));
    const exit = phase(0, 0.24),
      slide = phase(0.24, 0.69),
      enter = phase(0.69, 1);
    card(narrow.order[0], 0);
    card(narrow.order[2], 2, { opacity: 1 - exit });
    card(narrow.order[1], 1 + slide);
    card(wide.order[1], 1, { offset: -8 * (1 - enter), opacity: enter });
  } else {
    s.order.slice(0, slots.length).forEach((id, i) => card(id, i));
  }
  if (cue(k, 1, 'then add the three slots')) {
    slots.forEach(({ contribution }, i) => {
      if (moving && i > 0) return;
      const center = displayedAt(i) + 151;
      text(c, 'Grade ' + r.grades[i], center, 529, 35, C.quiet, 'mono', 'center');
      text(c, 'DCG term ' + trim(contribution), center, 573, 33, C.ink, 'mono', 'center');
    });
  }

  if (cue(k, 2, 'Build that ideal')) {
    text(c, 'Ideal from all eligible pages', 755, 611, 37);
    text(c, 'Ideal DCG ≈ ' + trim(r.idcg), 1763, 611, 35, C.quiet, 'mono', 'right');
    r.ideal.forEach((g, i) => {
      const x = displayedAt(i),
        term = discountedSlot(g, i + 1);
      rect(c, x, 638, 302, 110, C.field, C.rule);
      text(c, 'Grade ' + g, x + 151, 683, 35, C.quiet, 'mono', 'center');
      text(c, 'DCG term ' + trim(term.contribution), x + 151, 729, 33, C.ink, 'mono', 'center');
    });
  }
  if (cue(k, 6, 'Against all eligible pages')) {
    const x = displayedAt(slots.length - 1);
    rect(c, x, 498, 302, 87, null, hue(sdk), 4);
    rect(c, x, 638, 302, 110, null, hue(sdk), 4);
  }

  if (moving) return;
  const reranked = s.reorder === 1;
  if (reranked ? b > 5 || spoken : cue(k, 2, 'The best possible sum is seven')) {
    text(c, 'Reranker NDCG@3', 755, 820, 38, C.blue);
    const calculation = trim(r.dcg) + ' / ' + trim(r.localIdcg) + ' = ' + frac(r.local);
    formula(c, calculation, 1234, 820, 570, 39, C.blue);
  }
  if (cue(k, 3, 'Now the same seven')) {
    const announced = cue(k, 6, 'System NDCG rises');
    const known = reranked ? b > 6 || (announced && spoken) : b > 3 || spoken;
    text(c, 'System NDCG@3', 755, 895, 38, C.teal);
    const calculation = trim(r.dcg) + ' / ' + trim(r.idcg);
    formula(c, calculation + (known ? ' ≈ ' + frac(r.system) : ''), 1234, 895, 570, 39, C.teal);
  }
}
export const prefixCases = [
  [0, 3, 0, 2],
  [2, 0, 0, 3],
];
export function precision(c, k) {
  base(c);
  const b = B(k);
  if (b >= 7) {
    heading(c, 'Where did the direct answer land?', 'Two searches   /   evaluate three slots');
    prefixCases.forEach((g, i) => {
      const x = 118 + i * 900;
      gradeLine(c, 'Search ' + (i + 1) + '   ·   grades', g, x, 362);
      line(
        c,
        [
          [x + 383, 368],
          [x + 383, 531],
        ],
        C.red,
        5,
      );
      const m = reciprocalPrecision(g, { cutoff: 3, totalRelevant: 2 });
      if (cue(k, 8, i ? 'The second has reciprocal' : 'the first search has reciprocal'))
        formula(c, 'RR ' + trim(m.rr) + '     AP ' + trim(m.ap), x, 698, 800, 45);
    });
    if (cue(k, 8, 'Mean reciprocal rank'))
      formula(c, 'MRR  0.250        MAP  0.375', 117, 886, 1710, 60, C.teal);
    return;
  }
  heading(
    c,
    b >= 5 ? 'Which denominator did we declare?' : 'First target or every useful prefix?',
    'Reciprocal rank   /   average precision',
  );
  if (b >= 5) {
    gradeLine(c, 'Eligible grades', [2, 2], 118, 358);
    gradeLine(c, 'Returned at cutoff 1', [2], 1000, 358);
    formula(c, 'AP with min(R, k)   1 / 1 = 1', 117, 689, 1670, 47);
    formula(c, 'AP with full R      1 / 2 = 0.5', 117, 814, 1670, 47, C.teal);
    return;
  }
  const grades = retrievalIds.map(grade),
    m = reciprocalPrecision(grades);
  retrievalIds.forEach((id, i) => {
    const x = 106 + i * 347;
    book(c, id, x, 338, 263, 247, { sub: 'GRADE  ' + grade(id) });
    text(c, 'Slot ' + (i + 1), x, 662, 30, C.quiet, 'mono');
    const t = m.terms.find((t) => t.rank === i + 1);
    if (b >= 3 && t) formula(c, t.relevantSeen + ' / ' + t.rank, x, 761, 260, 48, C.teal);
  });
  shelf(c, 79, 601, 1749);
  formula(
    c,
    b === 4
      ? 'AP = (1 + 2/4 + 3/5) / 3 = ' + trim(m.ap)
      : b <= 2
        ? 'RR = 1 / first target rank'
        : 'Precision at each relevant position',
    108,
    916,
    1720,
    49,
  );
}
