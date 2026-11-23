import * as E from './evidence.mjs';
import {
  C,
  cue,
  end,
  mix,
  ease,
  rect,
  slide,
  key,
  mark,
  line,
  path,
  dot,
  txt,
  label,
  heading,
  stamp,
  wrapped,
} from './art.mjs';

function filtered(c, k, emptyChapter) {
  const b = k.beat.beatIndex;
  const slice = emptyChapter
    ? E.note.id
    : cue(k, 0, 'show just the paraphrase')
      ? E.base[1].id
      : null;
  const passedOnly = emptyChapter && Boolean(cue(k, 0, 'Turn on passed only'));
  const view = E.view(slice, passedOnly);
  const open = emptyChapter || Boolean(cue(k, 1, "There's the private-note ID"));
  heading(c, 'SAVED RUN   /   ' + E.hybrid[0].run, 'Full decision and visible answers');
  const heights = [238, 327, 416, 505],
    fullX = 76,
    winX = 846;
  E.hybrid.forEach((r, i) => {
    const y = heights[i];
    const selected = view.rows.includes(r);
    rect(c, fullX, y, 680, 71, selected ? '#365760' : C.deep, C.line, 8);
    key(c, 119, y + 36, E.keys[i], 41, C.blue);
    txt(c, E.rowNames[i], 163, y + 36, 29);
    mark(c, 699, y + 36, r.passed, 20);
  });
  label(
    c,
    'COMPLETE PACKET   ·   ' + E.passCount(E.hybrid) + ' / ' + E.hybrid.length + ' passed',
    78,
    196,
  );
  label(c, 'DISPLAY FILTER', winX, 196);
  rect(c, winX, 239, 667, 337, '#dce9df', null, 14);
  txt(
    c,
    (slice === E.note.id ? 'Private note' : slice ? 'Rewording' : 'All fixtures') +
      '    /    ' +
      (passedOnly ? 'Passed only' : 'All outcomes'),
    winX + 36,
    290,
    29,
    C.ink,
    'Sans',
    600,
  );
  line(c, winX + 37, 329, 1472, 329, '#98aca5');
  view.rows.forEach((r, j) => {
    const i = E.hybrid.indexOf(r),
      y = 369 + 53 * j;
    key(c, winX + 64, y, E.keys[i], 35, C.blue);
    txt(c, E.rowNames[i], winX + 103, y, 25, C.ink);
    mark(c, 1461, y, r.passed, 16, true);
  });
  if (!view.rows.length) {
    rect(c, winX + 37, 368, 594, 128, null, '#a5b5ac', 5);
    txt(c, '0 visible rows', 1180, 432, 39, C.muted, 'Serif', 400, 'center');
  }
  stamp(c, 77, 615, view.verdict, C.red, 467);
  label(c, view.failure.id, 78, 708, C.red);
  if (open) {
    label(c, 'Expected abstention   /   []', 78, 749, C.soft);
    txt(
      c,
      view.failure.answer + '   ·   ' + view.failure.citations[0],
      78,
      784,
      25,
      C.pale,
      'Serif',
      500,
      'left',
      738,
    );
    label(c, 'Failed: status, citation, answer', 78, 828, C.soft);
  }
  label(c, 'VISIBLE PASS RATE', winX, 642);
  const showRate = !emptyChapter || !passedOnly || cue(k, 1, 'Dividing by zero');
  const value =
    view.rate === null
      ? 'Undefined'
      : E.passCount(view.rows) + ' / ' + view.rows.length + '  =  ' + E.pct(view.rate);
  txt(c, showRate ? value : 'What rate?', winX, 727, 66, showRate ? C.pale : C.amber, 'Serif', 400);
  if (emptyChapter && b === 1 && cue(k, 1, 'Emit both'))
    label(c, 'Same view model   ·   HTML-escape saved text', winX, 808);
}
export const filterScene = (c, k) => filtered(c, k, false);
export const emptyView = (c, k) => filtered(c, k, true);

const mutations = [
  ['Corpus tag', 'different snapshot', { corpus: 'different' }],
  ['Retained answer', 'changed after grading', { answer: 'Changed after grading.' }],
  ['Fixture ID', 'second policy row', null],
  ['Grade', '"true" (string)', { passed: 'true' }],
  ['Reason', '12 (number)', { reason: 12 }],
  ['Latency', 'overflows finite float', { latency: Infinity }],
];
function mutationRows(patch) {
  return patch ? [{ ...E.hybrid[0], ...patch }, ...E.hybrid.slice(1)] : [...E.hybrid, E.hybrid[0]];
}
export function regression(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3) {
    heading(c, 'RUNNABLE REVIEW PACKAGE', 'Rebuild the decision from the supplied files');
    const files = [
      ['policy-qa-v2.jsonl', 'Frozen questions and reviewed fields'],
      ['hybrid-v1.jsonl', 'First outputs and cited documents'],
      ['grade.py  +  aggregate.py', 'Recompute checks, inventory and decision'],
      ['test_release_gates.py', 'Call the gate on complete and missing rows'],
    ];
    files.forEach(([name, why], i) => {
      const y = 238 + 113 * i;
      slide(c, 79, y, 1443, 85);
      txt(c, name, 122, y + 44, 29, C.ink, 'Mono');
      txt(c, why, 766, y + 44, 31, C.ink, 'Serif');
    });
    if (cue(k, 3, 'static HTML dashboard'))
      txt(c, 'Same graded rows → view model → dashboard.html', 80, 775, 43, C.amber, 'Serif');
  } else if (b === 2 || cue(k, 1, 'Other regression cases')) {
    heading(c, 'REGRESSION INPUTS', 'Make one change to a complete packet');
    const examples = mutations.slice(b === 2 ? 4 : 0, b === 2 ? 6 : 4);
    examples.forEach(([field, value, patch], i) => {
      const y = 276 + i * 113;
      slide(c, 78, y - 34, 1440, 86);
      txt(c, field, 117, y + 9, 29, C.ink, 'Sans', 600);
      txt(c, value, 489, y + 9, 27, C.ink, 'Mono');
      txt(c, E.decide(mutationRows(patch), 'hybrid-v1'), 1115, y + 9, 25, C.redInk, 'Mono', 600);
    });
    if (b === 2)
      txt(
        c,
        'Validate types and finite measurements during ingestion.',
        79,
        653,
        37,
        C.amber,
        'Serif',
      );
  } else {
    const missing = b === 1 && cue(k, 1, 'Remove the private-note row');
    const rows = missing ? E.hybrid.slice(0, 3) : E.hybrid;
    heading(c, 'GATE REGRESSION TEST', 'Call the decision function');
    E.fixtures.forEach((f, i) => {
      const r = rows.find((r) => r.id === f.id),
        y = 271 + i * 99;
      rect(c, 78, y - 36, 737, 76, r ? C.body : C.deep, C.line, 8);
      key(c, 130, y, E.keys[i], 47, C.blue);
      txt(c, f.id, 181, y, 24, C.pale, 'Mono');
      r
        ? mark(c, 758, y, r.passed, 19)
        : txt(c, 'absent', 781, y, 22, C.amber, 'Mono', 500, 'right');
    });
    label(c, 'RETURN VALUE', 900, 278);
    txt(c, 'decision(rows, "hybrid-v1")', 900, 352, 31, C.pale, 'Mono');
    const returned = missing
      ? cue(k, 1, 'Collect the missing output')
      : cue(k, 0, 'All four outputs');
    if (returned) {
      stamp(c, 901, 421, E.decide(rows, 'hybrid-v1'), missing ? C.amber : C.red, 599);
      txt(
        c,
        missing ? 'Collect the missing output.' : 'Inspect the private citation.',
        901,
        569,
        34,
        C.soft,
        'Serif',
      );
    }
  }
}
function sockets(c, k, gaps) {
  const names = [
    'Supported policy',
    'Rewordings',
    'Unsupported',
    'Untrusted instruction',
    'Region / date',
  ];
  const placeX = 437,
    dx = 27;
  label(c, 'FIXTURE GROUP', 71, 219);
  label(c, 'ONE PLACE PER PLANNED FIXTURE', placeX, 219);
  label(c, gaps ? 'TARGET − HAVE' : 'OBSERVED / PLAN', 1262, 219);
  E.plan.forEach(([, target, have], i) => {
    const yy = 311 + i * 96;
    txt(c, names[i], 73, yy, 30, C.pale, 'Sans', 500, 'left', 348);
    for (let j = 0; j < target; j++) {
      const x = placeX + j * dx;
      rect(c, x, yy - 16, 20, 32, j < have ? C.teal : C.deep, j < have ? C.teal : C.line, 4);
      if (j < have) line(c, x + 6, yy - 4, x + 14, yy - 4, C.greenInk, 2);
    }
    if (gaps) {
      const phrases = [
        'twenty-nine to collect',
        'same subtraction',
        'both boundary slices',
        'both boundary slices',
        'all fifteen',
      ];
      const current = cue(k, 0, phrases[i], 0.35) === 1;
      txt(
        c,
        target + ' − ' + have + (current ? ' = ' + (target - have) : ''),
        1375,
        yy,
        28,
        current ? C.amber : C.soft,
        'Mono',
        600,
        'center',
      );
    } else txt(c, have + ' / ' + target, 1379, yy, 32, C.soft, 'Mono', 500, 'center');
  });
}
export function collection(c, k) {
  heading(
    c,
    'HYBRID TWO   /   FOUR FIRST ANSWERS PASSED',
    'What would a regional policy case occupy?',
  );
  if (!cue(k, 0, 'Open the collection plan')) {
    E.repair.forEach((r, i) => {
      const x = 77 + i * 367;
      slide(c, x, 295, 334, 283);
      key(c, x + 67, 360, E.keys[i], 60, C.blue);
      txt(c, E.rowNames[i], x + 33, 473, 34, C.ink, 'Serif');
      mark(c, x + 270, 360, r.passed, 27, true);
    });
  } else {
    sockets(c, k, false);
    if (k.beat.beatIndex === 1)
      txt(
        c,
        'Needed for region / date     Approved policy snapshot + dated question',
        72,
        802,
        36,
        C.amber,
        'Serif',
      );
  }
}
export function ownership(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    heading(c, 'DISJOINT COLLECTION PLAN', 'Subtract the observed cases from the targets');
    sockets(c, k, true);
    if (cue(k, 0, 'still need to be collected')) {
      const total = E.plan.reduce((s, [, target]) => s + target, 0),
        have = E.plan.reduce((s, [, , count]) => s + count, 0);
      txt(
        c,
        total + ' planned  −  ' + have + ' observed  =  ' + (total - have) + ' to collect',
        76,
        805,
        40,
        C.amber,
        'Serif',
      );
    }
  } else if (b < 3) {
    heading(c, 'COLLECTION PLAN', 'Assign a source and a reviewer to each gap');
    const tasks = [
      'Clause and effective date',
      'Equivalent wording for the same clause',
      'Question beyond the approved source',
      'Expected reply to an unreviewed source',
    ];
    const phrases = ['policy reviews', 'retrieval collects', 'support labels', 'security designs'];
    tasks.forEach((task, i) => {
      const y = 263 + i * 112;
      slide(c, 78, y - 35, 1445, 87);
      txt(c, task, 119, y + 9, 32, C.ink, 'Serif');
      if (cue(k, 1, phrases[i], 0.3) === 1)
        txt(c, E.owners[i], 1039, y + 9, 29, C.ink, 'Mono', 600);
    });
    if (b === 2) {
      const r = E.note;
      label(c, 'EXAMPLE RECORD   /   ' + r.id + '   /   ' + r.corpus, 81, 751, C.amber);
      txt(
        c,
        'Label rationale: the private note cannot support this request. Expect abstention and no citations.',
        81,
        813,
        30,
        C.pale,
        'Serif',
      );
    }
  } else {
    heading(c, 'OVERLAPPING SLICES', 'Count the memberships, then the distinct IDs');
    E.groups.forEach((g, i) => {
      label(c, 'SLICE ' + (i + 1), 75, 311 + i * 128);
      g.forEach((id, j) => {
        const x = 363 + (j + i * 2) * 191;
        if (i === 0 && E.groups[1].includes(id)) line(c, x, 350, x, 399, C.amber, 4);
        key(c, x, 311 + 128 * i, id, 70, E.groups[1 - i].includes(id) ? C.amber : C.blue);
      });
    });
    if (cue(k, 3, 'count each ID once')) {
      label(c, 'UNIQUE IDS', 75, 617);
      E.distinct.forEach((id, j) => key(c, 363 + j * 191, 617, id, 67, C.paper));
      if (cue(k, 3, 'Before release'))
        txt(
          c,
          E.groups.flat().length +
            ' memberships     /     ' +
            E.distinct.length +
            ' distinct questions',
          76,
          745,
          43,
          C.teal,
          'Serif',
        );
    }
    if (cue(k, 3, 'set latency'))
      label(c, 'Release budgets to set: latency and token cost', 76, 820);
  }
}

export function routingScene(c, k) {
  const b = k.beat.beatIndex;
  const routine = Boolean(cue(k, 3, 'only routine tickets'));
  const rows = routine ? E.routes.slice(-1) : E.routes,
    result = E.routing(rows);
  heading(
    c,
    'ROUTING CLASSIFIER   /   encoder-v1',
    routine ? 'Try a sample of routine tickets' : 'Which required escalations reached review?',
  );
  label(c, 'TICKET', 72, 219);
  label(c, 'REQUIRED ROUTE', 517, 219);
  label(c, 'ACTUAL DESTINATION', 1167, 219);
  const positions = [303, 472, 641],
    destinations = [530, 343];
  const routeName = (v) => (v ? 'Human review' : 'Routine queue');
  for (const [i, r] of E.routes.entries()) {
    if (!rows.includes(r)) continue;
    const yy = positions[i],
      yEnd = destinations[r.got] + (i === 2 ? 32 : 0);
    slide(c, 74, yy - 35, 399, 78);
    txt(c, r.name, 110, yy + 6, 32, C.ink, 'Serif');
    txt(c, routeName(r.need), 516, yy + 5, 29, C.pale);
    const t = routine
      ? 1
      : cue(
          k,
          0,
          ['One reaches review', 'one goes to the routine queue', 'A third ticket'][i],
          0.87,
        );
    const color = t === 1 ? (r.need === r.got ? C.teal : C.red) : C.soft;
    const x1 = 794,
      x2 = 1141;
    path(
      c,
      [
        [x1, yy + 5],
        [mix(x1, x2, t), mix(yy + 5, yEnd, t)],
      ],
      null,
      color,
      5,
    );
    dot(c, mix(x1, x2, t), mix(yy + 5, yEnd, t), 9, color);
  }
  for (const v of [1, 0]) {
    rect(c, 1150, destinations[v] - 45, 367, 117, C.body, C.line, 12);
    txt(c, routeName(v), 1184, destinations[v] + 9, 36, C.pale, 'Serif');
  }
  if (routine ? cue(k, 3, 'Collect required escalations') : end(k, 1)) {
    const count = result.caught + ' / ' + result.required;
    const val = result.recall === null ? 'undefined' : E.pct(result.recall);
    txt(
      c,
      'Positive recall     ' +
        count +
        (routine || cue(k, 2, 'and the missed') ? '   →   ' + val : ''),
      76,
      756,
      42,
      C.amber,
      'Serif',
    );
    if (routine && cue(k, 3, 'binary labels'))
      label(c, 'One model version   /   integer labels 0 or 1', 824, 816, C.amber);
    if (routine || cue(k, 2, 'missed incident-freeze'))
      txt(
        c,
        routine ? 'Collect a required escalation' : 'Hold • inspect the missed incident freeze',
        79,
        818,
        29,
        C.soft,
      );
  }
}
export function fifth(c, k) {
  const b = k.beat.beatIndex;
  const collected = Boolean(cue(k, 1, 'Both packets are complete'));
  const record = E.fifthCase(collected),
    r = record.row;
  const inspect = Boolean(cue(k, 1, 'Line up the fifth candidate'));
  if (!inspect) {
    heading(c, 'FROZEN SET   /   ' + r.dataset, 'One new office-hours question');
    txt(c, r.question, 76, 235, 36, C.pale, 'Serif');
    label(c, 'Reviewed requirement: abstain, no citations', 77, 308, C.amber);
    const names = [...E.rowNames, 'Draft hours'],
      xx = (i) => 463 + i * 228;
    names.forEach((name, i) => txt(c, name, xx(i), 427, 24, C.soft, 'Sans', 600, 'center'));
    [record.baseline, record.candidate].forEach((rows, j) => {
      const y = 528 + 125 * j;
      txt(c, rows[0].run, 77, y, 31, C.pale, 'Mono');
      names.forEach((_, i) => {
        const exists = rows.some((row) => row.id === (i === 4 ? r.id : E.fixtures[i].id));
        rect(c, xx(i) - 88, y - 38, 176, 76, exists ? C.paper : C.deep, C.line, 9);
        txt(
          c,
          exists ? 'saved' : 'missing',
          xx(i),
          y,
          27,
          exists ? C.ink : C.amber,
          'Mono',
          500,
          'center',
        );
      });
    });
    if (b === 1 && !collected && cue(k, 1, 'Collect its missing'))
      stamp(c, 76, 710, record.decision, C.amber, 528);
    if (collected) label(c, 'Both packets complete', 78, 744, C.teal);
    return;
  }
  const open = ease(cue(k, 2, 'Open both citation lists', 0.8));
  const statusMatches = cue(k, 1, 'Before we open') && r.status === r.expectedStatus;
  const answerMatches = cue(k, 1, 'Both statuses say') && r.answer === r.expectedAnswer;
  const citationFailed =
    open === 1 &&
    cue(k, 2, 'The other four first answers pass') &&
    r.failures.includes('unexpected_citation');
  const graded = Boolean(cue(k, 2, 'Hold the candidate'));
  heading(c, 'FIFTH FIXTURE   /   ' + r.id, 'Line up the two abstentions');
  for (let j = 0; j < 2; j++) {
    const x = 69 + 744 * j;
    slide(c, x, 207, 712, 429, j ? '#f3eedf' : '#e1eade');
    label(c, j ? 'CANDIDATE  /  hybrid-v2' : 'EXPECTED  /  reviewed fixture', x + 44, 252, C.muted);
    txt(c, j ? r.status : r.expectedStatus, x + 44, 318, 34, C.ink, 'Mono', 600);
    wrapped(c, '“' + (j ? r.answer : r.expectedAnswer) + '”', x + 44, 386, 529, 37, 48);
    if (j && statusMatches) mark(c, x + 633, 318, true, 19, true);
    if (j && answerMatches) mark(c, x + 633, 408, true, 19, true);

    const y = 520;
    const ids = j ? r.citations : r.expectedCitations;
    const flagged = j && citationFailed;
    rect(
      c,
      x + 41,
      y,
      629,
      87,
      flagged ? '#f4dcca' : '#c5d4c9',
      flagged ? C.redInk : '#8eaba0',
      5,
      flagged ? 4 : 2,
    );
    label(c, 'CITATION LIST', x + 44, y - 24, flagged ? C.redInk : C.muted);
    if (flagged) {
      txt(c, 'Unexpected citation', x + 667, y - 24, 26, C.redInk, 'Sans', 700, 'right');
      mark(c, x + 633, y + 44, false, 19, true);
    }
    // Both lids move together. The list is exposed only where the cover has withdrawn.
    c.save();
    c.beginPath();
    c.rect(x + 42, y + 1, 627 * open, 85);
    c.clip();
    txt(c, JSON.stringify(ids), x + 66, y + 45, 31, C.ink, 'Mono', 500);
    c.restore();
    if (open < 1) {
      c.save();
      c.beginPath();
      c.rect(x + 42 + 627 * open, y, 627 * (1 - open), 87);
      c.clip();
      rect(c, x + 42, y + 1, 627, 85, '#c7d2c6', null, 4);
      label(c, '▸  Open list', x + 69, y + 45, C.muted);
      c.restore();
    }
  }
  if (b === 1 && cue(k, 1, 'what would you expect'))
    txt(c, 'What should the last field contain?', 77, 713, 42, C.amber, 'Serif');
  if (citationFailed && graded) {
    txt(
      c,
      E.passCount(record.candidate) + ' / ' + record.candidate.length + ' first answers passed',
      76,
      689,
      42,
      C.pale,
      'Serif',
    );
    const verdictX = 1004;
    const verdictWidth = 500;
    const verdictCenter = verdictX + verdictWidth / 2;
    line(c, verdictCenter, 607, verdictCenter, 655, C.red, 3);
    stamp(c, verdictX, 655, record.decision, C.red, verdictWidth);
    if (cue(k, 2, 'Send the draft-hours row'))
      txt(c, 'Security + policy retest draft hours', 76, 753, 29, C.amber, 'Sans', 600);
    if (end(k, 2)) {
      const total = record.candidate.length;
      txt(
        c,
        `If ${total} / ${total} pass, expand offline evaluation`,
        1504,
        753,
        27,
        C.teal,
        'Sans',
        600,
        'right',
      );
    }
  }
}
