import { C } from './art.mjs';
import { ARTICLE_RECORD, callRoutes, generationCalls, cohort, replay, prelookup } from './cases.mjs';
import { windowTen } from './economics.mjs';

export function traces(f) {
  const { b, on, cue, base, title, tag, text, mono, line, rect, mark } = f;
  base('Protected decision traces');
  if (b === 0) {
    title('Which fields did the request reach?');
    tag('Authorized request', 112, 305);
    tag('rq-a6  ·  policy read', 745, 305);
    tag('rq-b2  ·  live read', 1340, 305);
    const rows = [
      ['Release / corpus', 'R7 / C7', 'R7 / C7'],
      ['Tenant / access', 'docs-public / policy', 'docs-public / policy'],
      ['Retrieval policy', 'E1 / I1 / ≥ 0.995', 'E1 / I1 / ≥ 0.995'],
      ['Decision', 'Semantic hit', 'Bypass at route'],
      ['Candidate score', '0.9992', '—'],
      ['Answer / approval', 'retention / eval-v4', '—'],
    ];
    rows.forEach(([l, a, v], i) => {
      if (i > 2 && !on(0, 'semantic hit records')) return;
      let y = 397 + i * 83;
      text(l, 115, y, 37);
      mono(a, 745, y, 32);
      mono(v, 1340, y, 32, i > 3 ? C.muted : C.ink, 472);
      line(115, y + 21, 1790, y + 21);
    });
    if (on(0, 'fields stay empty'))
      text('The dash means the lookup never ran.', 115, 949, 40, C.navy);
  } else {
    title('Disable reuse while keeping the fresh release');
    const off = on(1, 'disable the answer-cache route');
    tag('Authorized policy read', 123, 468);
    f.key(185, 569, 0.95, C.navy);
    const y = off ? 709 : 422;
    f.arrow(490, 566, 934, y, off ? C.green : C.navy, 6);
    tag('Answer cache', 980, 349);
    rect(976, 381, 718, 104, off ? C.blush : C.pale, 9);
    text(off ? 'Disabled' : 'Read approved answer', 1004, 446, 46, off ? C.rust : C.navy);
    tag('Fresh release', 980, 636);
    rect(976, 667, 718, 105, C.mint, 9);
    text('Read policy and generate', 1004, 734, 46, C.green);
    if (on(1, 'Record the decision for the next request')) {
      mono('rq-c3   R7 / C7   bypass: reuse disabled   score: —', 120, 926, 39);
    } else text('Trace IDs, release, bypasses, retries, realized savings and p95.', 120, 926, 38);
  }
}
function prefix(f, y, hit, processed = true) {
  const x0 = 145;
  for (let i = 0; i < 3; i++) {
    const x = x0 + i * 468;
    f.rect(x, y, 433, 120, i < 2 && hit ? C.pale : C.yellow, 8);
    f.tag(
      i < 2 ? (hit ? 'Reuse KV' : 'Process input') : 'New evidence',
      x + 21,
      y + 45,
      i < 2 && hit ? C.navy : C.ink,
    );
    f.text(i < 2 ? 'Prefix block ' + (i + 1) : 'Current record', x + 21, y + 95, 37);
  }
  if (processed) {
    f.arrow(1548, y + 58, 1624, y + 58, C.green);
    f.text('Reply', 1655, y + 70, 45, C.green);
  }
}
function compareCallRoutes(f) {
  const semanticFocus = f.on(3, 'A semantic answer hit needs');
  const liveFocus = f.on(3, 'Our live handler generates');
  f.title('How many generation calls does each route make?');
  f.tag('Generation calls', 1510, 295);

  const count = (route, y, revealed, active) => {
    if (active) f.rect(1505, y - 88, 248, 126, C.mint, 9);
    f.middle(revealed ? generationCalls(route) : '?', 1629, y + 9, 84, active ? C.green : C.muted);
  };
  f.tag('Semantic answer hit', 140, 329, C.navy);
  f.rect(140, 367, 1215, 146, C.pale, 8);
  f.tag(callRoutes.semantic[0], 164, 419, C.navy);
  f.text(ARTICLE_RECORD.response, 164, 474, 38, C.navy, { max: 1158 });
  count(callRoutes.semantic, 448, f.on(3, 'The cache sends'), semanticFocus && !liveFocus);

  f.line(140, 565, 1773, 565);
  f.tag('Live incident read with a matching prefix', 140, 646);
  const labels = ['Prefix block 1', 'Prefix block 2', 'Current record', 'Output'];
  callRoutes.live.forEach((step, i) => {
    const x = 140 + 316 * i;
    const color = i < 2 ? C.pale : i === 2 ? C.yellow : C.mint;
    f.rect(x, 687, 292, 135, color, 8);
    f.tag(labels[i], x + 15, 737);
    f.text(step, x + 15, 788, 37, C.ink, { max: 262 });
  });
  count(callRoutes.live, 762, f.on(3, 'It reuses the two prefix blocks'), liveFocus);
}

export function tiers(f) {
  const { b, on, base, title, tag, text, mono, line, mark, calendar } = f;
  base('Answer reuse & prefix reuse');
  if (b === 3 && on(3, 'Now count the generation calls')) {
    compareCallRoutes(f);
    return;
  }
  title(
    b === 0
      ? 'A whole response can skip generation'
      : b === 4
        ? 'Permission stops the request'
        : 'What work remains inside a fresh call?',
  );
  if (b === 0) {
    calendar(123, 348, 0.88);
    [
      ['Exact text & scope', 'Read approved answer'],
      ['Eligible exact miss', 'Search scoped candidates'],
    ].forEach(([a, v], i) => {
      const y = 394 + i * 201;
      tag(a, 762, y);
      f.arrow(764, y + 65, 888, y + 65, C.blue);
      text(v, 930, y + 80, 45);
    });
    if (on(0, 'Either answer hit saves'))
      mono('Generation calls on an answer hit   0', 118, 936, 41);
  } else if (b === 4) {
    f.key(223, 500, 1.4, C.rust);
    tag('Current access', 125, 351);
    text('Revoked', 122, 673, 80, C.rust, { face: 'Serif' });
    f.arrow(619, 546, 1068, 546, C.rust);
    mark(1135, 550, false, prelookup(false, 'public policy'), 479);
    mono('Generation calls   0', 1134, 724, 39);
  } else {
    const hit = b === 1 || b === 2;
    tag(
      hit
        ? 'Matching rendered prefix · compatible model and settings'
        : 'Prefix miss · same inference call',
      140,
      376,
    );
    prefix(f, 477, hit, true);
    mono('Fresh generation calls     1', 143, 764, 55);
    if (b === 2)
      text(
        'A trust-group salt limits prefix sharing. Current access is checked separately.',
        145,
        910,
        36,
      );
    if (b === 3)
      text('Chunked prefill schedules new input in pieces alongside decoding.', 145, 910, 39);
  }
}
export function diagnosis(f) {
  const { b, on, base, title, tag, text, mono, line, calendar, book } = f;
  base('Cache decision review');
  if (b === 0) {
    title('What fact did the customer ask for?');
    calendar(122, 320, 0.96);
    tag('Shadow proposal · approved R7 answer', 712, 359);
    text('“Can I restore a revoked key?”', 710, 495, 63, C.ink, { face: 'Serif', max: 1060 });
    line(811, 530, 1046, 530, C.rust, 7);
    if (on(0, 'asks about restoration'))
      text('Missing from this answer   ·   restoration rule', 713, 725, 42, C.rust);
  } else if (b === 1) {
    title('Follow the symptom back to the trace');
    [
      ['Bypasses rise', 'Check route and release changes'],
      ['Savings fall', 'Price lookups and misses in this traffic'],
      ['Tail latency rises', 'Sort the complete request window'],
    ].forEach(([a, r], i) => {
      const y = 382 + i * 177;
      tag(a, 115, y);
      f.arrow(516, y - 11, 696, y - 11, C.muted);
      text(r, 741, y, 44);
      line(115, y + 53, 1760, y + 53);
    });
  } else if (b === 2) {
    title('Replay the failed pair on the narrower route');
    const narrow = on(2, 'route evaluated for retention'),
      r = replay(0.995, 1, narrow);
    f.tag('Held-out questions', 120, 305);
    r.rows.slice(0, 5).forEach((a, i) => {
      const y = 397 + i * 98;
      text(a.name, 118, y, 40, a.correct ? C.navy : C.rust);
      f.arrow(481, y - 12, 749, y - 12, C.muted);
      text(
        a.eligible
          ? narrow
            ? 'Retention candidate'
            : 'Search public policy'
          : 'Read current restoration policy',
        801,
        y,
        40,
        a.eligible ? C.navy : C.green,
      );
    });
    text('Keep the restoration pair in the evaluation set.', 115, 945, 41);
  } else {
    title('Withdraw a known-bad answer');
    calendar(115, 321, 0.97);
    const revoked = on(3, 'Withdraw its approval');
    tag('Duration question · matching R7 scope', 745, 355);
    text('How long is the key logged?', 745, 455, 62, C.ink, { face: 'Serif' });
    f.mark(745, 593, !revoked, revoked ? 'Approval withdrawn' : 'Current approval', 533);
    if (on(3, 'gets a fresh policy answer')) {
      f.arrow(1010, 629, 1010, 714, C.green);
      book(862, 747, 0.84, 'Current policy');
    }
  }
}
export function cohortPractice(f) {
  const { b, on, base, title, tag, text, mono, line, dot, mark } = f;
  base('Practice · nine authorized or denied requests');
  title('Count calls and semantic scores');
  const revealed = [
    on(1, 'skip embedding search and generation'),
    on(1, 'get no answer at all'),
    on(2, 'Three generation calls in all') && f.done(2),
  ];
  const groups = ['Exact repeat', 'Access revoked', 'Live incident'];
  tag('Request class', 110, 314);
  tag('Request IDs', 648, 314);
  tag('Route', 1135, 314);
  tag('Calls', 1660, 314);
  groups.forEach((name, j) => {
    const subset = cohort.filter((r) => r.group === name),
      y = 435 + j * 159;
    text(name, 112, y, 45);
    subset.forEach((r, i) => {
      dot(670 + i * 85, y - 13, 31, [C.navy, C.rust, C.green][j]);
      f.middle(cohort.indexOf(r) + 1, 670 + i * 85, y - 3, 26, C.white);
    });
    if (revealed[j]) {
      text(['Return answer', 'Deny access', 'Generate fresh'][j], 1135, y, 40);
      mono(
        subset.reduce((s, r) => s + r.calls, 0),
        1686,
        y,
        48,
      );
    } else {
      text('?', 1137, y, 50, C.muted);
      mono('?', 1686, y, 47, C.muted);
    }
    line(115, y + 52, 1785, y + 52);
  });
  if (b >= 3 && f.done(3)) {
    mono('Semantic scores   ' + cohort.reduce((s, r) => s + r.scores, 0), 115, 939, 49);
    mono('Generation calls   ' + cohort.reduce((s, r) => s + r.calls, 0), 1135, 939, 45);
  } else
    text(
      b === 0
        ? 'Each live read fetches the incident record and calls the model once.'
        : 'Prefix reuse applies inside a fresh call.',
      115,
      932,
      40,
    );
  if (b === 0) text('Each live call has a matching prompt prefix.', 115, 991, 36, C.navy);
  if (b === 4) {
    const miss = on(4, 'prefix misses');
    for (const [i, name] of ['Prefix block 1', 'Prefix block 2'].entries()) {
      const x = 650 + i * 305;
      f.rect(x, 818, 282, 61, miss ? C.yellow : C.pale, 6);
      text(name, x + 17, 860, 31);
    }
    text(miss ? 'Process again' : 'Reuse KV', 1300, 860, 34, miss ? C.gold : C.navy);
  }
}
export function finalPractice(f) {
  if (f.b < 5) return windowTen(f, true);
  const { b, on, base, title, tag, text, calendar, book, line, mono } = f;
  base('Final request · approved release');
  const two = on(5, 'and can it be restored');
  title(two ? 'Can one reply cover both questions?' : 'Read the whole request');
  calendar(114, 342, 0.99);
  tag('Customer asks', 735, 311);
  text('How long is a revoked key logged,', 733, 417, 60, C.ink, { face: 'Serif', max: 1100 });
  if (two) text('and can it be restored?', 733, 508, 60, C.ink, { face: 'Serif' });
  line(735, 565, 1760, 565);
  tag('Audit duration', 735, 657);
  if (two) tag('Restoration rule', 1300, 657);
  const filled = on(6, 'The restoration rule is still missing');
  mono(filled ? '30 days' : '?', 735, 748, 63, filled ? C.navy : C.muted);
  const uncovered = on(6, 'That second question');
  if (two) mono(uncovered ? 'Missing' : '?', 1300, 748, 56, uncovered ? C.rust : C.muted);
  if (on(6, 'Keep this two-part question')) {
    f.arrow(1505, 772, 1505, 815, C.rust);
    book(1387, 837, 0.66, 'Current policy');
  }
}
