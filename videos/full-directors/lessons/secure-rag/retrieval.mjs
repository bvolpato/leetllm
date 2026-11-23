import assert from 'node:assert/strict';
import { CANDIDATES, PRINCIPAL, POLICY } from '../../../films/secure-rag/fixtures.mjs';
import { secureEligibility, sourceRecord } from '../../../films/secure-rag/arithmetic.mjs';
import { corpus } from './copies.mjs';
import {
  C,
  dyes,
  at,
  cue,
  heading,
  sub,
  text,
  line,
  rect,
  dot,
  curve,
  thread,
  result,
  seal,
  sheet,
  section,
  source,
  pair,
  rows,
  passColor,
  fade,
  short,
  lerp,
} from './atelier.mjs';

export function models(c, k) {
  if (k.beat.beatIndex === 0) {
    heading(c, 'Which documents may this analyst read?');
    const reader = 'Authenticated reader in tenant ' + PRINCIPAL.tenant;
    text(c, reader + '   /   ' + PRINCIPAL.groups.join(' + ') + ' group', 96, 207, 47);
    const showDecision = at(k, 0, 'The operations analyst may use');
    text(c, 'Document', 145, 322, 39, C.muted);
    text(c, 'Who may read it?', 833, 322, 39, C.muted);
    text(c, 'Read decision', 1501, 322, 39, C.muted);
    corpus.forEach((r, i) => {
      const y = 352 + i * 122;
      const readers = r.grant === 'tenant' ? 'Employees in tenant ' + r.tenant : r.grant + ' group';
      line(c, 95, y, 1820, y, C.rule, 2);
      rect(c, 101, y + 23, 12, 70, dyes[r.id]);
      text(c, r.title, 145, y + 78, 52, C.ink, { weight: 600, max: 660 });
      text(c, readers, 833, y + 78, 52, C.ink, { max: 637 });
      if (showDecision) {
        const allowed = secureEligibility(r, PRINCIPAL);
        text(c, allowed ? 'May read' : 'Held', 1501, y + 78, 50, passColor(allowed), { weight: 600 });
      }
    });
    return;
  }
  heading(c, 'Where does a read grant come from?');
  sub(c, 'Four sources in tenant A   /   operations analyst');
  corpus.forEach((r, i) => {
    const x = 95 + i * 440;
    source(c, r.id, 'Grant   /   ' + r.grant, x, 272, 407, 117);
    const allowed = secureEligibility(r, PRINCIPAL);
    seal(c, allowed ? 'May read' : 'Held', x + 12, 408, passColor(allowed));
  });
  if (k.beat.beatIndex === 1) {
    section(c, 'Relationship-based access', 95, 551, 1718);
    const labels = ['Analyst', 'Child team', 'Parent team', 'Document'];
    const q = cue(k, 1, 'Trace user to child team', 1.5);
    labels.forEach((s, i) => {
      const x = 169 + 435 * i;
      if (i < 3) {
        line(c, x + 22, 650, x + 411, 650, C.rule, 5);
        line(c, x + 22, 650, x + 22 + 389 * Math.min(1, Math.max(0, q * 3 - i)), 650, C.green, 6);
      }
      dot(c, x, 650, 23, i === 0 || q >= i / 3 ? C.green : C.rule);
      text(c, s, x, 734, 39, C.ink, { align: i === 0 ? 'left' : 'center' });
    });
    result(
      c,
      'Roles grant by job. Attributes test properties. Relationships connect the reader to the document.',
    );
  } else {
    section(c, 'Enforcement choices', 95, 553, 1718);
    ['User namespace', 'Metadata filter', 'Current ID join', 'Permission graph'].forEach((s, i) =>
      text(c, s, 96 + i * 437, 685, 38, C.blue, { weight: 600, max: 400 }),
    );
    result(
      c,
      'A content graph carries facts. Its reports and edges need read decisions of their own.',
    );
  }
}
const faq = corpus.find((r) => r.id === 'FAQ');
const checklist = corpus.find((r) => r.id === 'checklist');

function currentRead(record, reader = PRINCIPAL) {
  return Boolean(
    reader?.id && record?.policy === POLICY.revision && secureEligibility(record, reader),
  );
}

export function identity(c, k) {
  const requested = at(k, 1, 'The analyst asks to read');
  const hasGrant = at(k, 1, 'Its current policy');
  const decided = at(k, 1, 'Other documents');
  const retry = at(k, 2, 'Try the same FAQ again');
  const unavailable = at(k, 2, 'policy lookup is unavailable');
  const held = at(k, 2, 'The service pauses');
  const current = unavailable ? null : faq;
  heading(c, 'Whose group does the service trust?');
  sub(c, 'A server authenticates the caller before protected search.');
  section(c, 'Request text', 100, 280, 661);
  section(c, 'Server directory', 989, 280, 800);
  sheet(c, 99, 322, 654, 240);
  text(c, '“Security”', 141, 450, 70, C.red, { face: 'Serif' });
  sheet(c, 987, 322, 803, 240);
  pair(
    c,
    'Authenticated analyst',
    PRINCIPAL.tenant + '   /   ' + PRINCIPAL.groups.join(', '),
    1028,
    401,
    715,
    C.blue,
  );
  if (requested) {
    section(c, 'Requested read', 100, 637, 580);
    source(c, faq.id, 'Tenant ' + faq.tenant, 100, 679, 580);
    section(c, 'FAQ group grant', 749, 637, 496);
    section(c, 'Read decision', 1317, 637, 485);
    if (hasGrant) {
      const lookupPending = retry && !unavailable;
      text(
        c,
        unavailable ? 'Unavailable' : lookupPending ? 'Checking policy…' : current.grant,
        750, 746, 43, unavailable ? C.red : C.ink, { weight: 600 },
      );
      if (!retry) text(c, 'Source policy v' + current.policy, 751, 799, 30, C.muted);
      if ((!retry && decided) || held) {
        const allowed = currentRead(current);
        seal(c, allowed ? 'Allow FAQ read' : 'Hold FAQ read', 1317, 704, passColor(allowed));
      }
    }
  }
  let footer = 'Who supplied each value?';
  if (k.beat.beatIndex > 0) footer = 'The directory supplies the authenticated reader’s group.';
  if (hasGrant) footer = 'Compare the verified group with the grant on this FAQ.';
  if (decided) footer = 'The verified operations group matches the FAQ’s current group grant.';
  if (retry) footer = 'The same reader requests the same FAQ. Check its current policy again.';
  if (held) footer = 'The service holds the FAQ until it can verify the current grant.';
  result(c, footer);
}
const candidates = [
  ['A', 'key'],
  ['A', 'FAQ'],
  ['B', 'FAQ'],
  ['A', 'missing'],
];
const grants = new Map([
  ['A/key', 'security'],
  ['A/FAQ', 'operations'],
  ['B/FAQ', 'operations'],
]);
function joinIDs(groups) {
  return candidates.filter(
    ([t, id]) => t === PRINCIPAL.tenant && groups.includes(grants.get(t + '/' + id)),
  );
}
export function join(c, k) {
  const noGroups = at(k, 1, 'Removing all user groups'),
    show = at(k, 1, 'The analyst’s operations membership');
  const group = noGroups ? [] : PRINCIPAL.groups,
    returned = joinIDs(group);
  heading(c, 'Which joined ID may carry text out?');
  sub(c, 'Reader     Tenant A   /   ' + (group.join(', ') || 'no groups'));
  ['Ranked ID', 'Look up both keys', 'Grant in policy', 'Text leaving service'].forEach((s, i) =>
    section(c, s, 96 + i * 440, 292, 404),
  );
  rect(c, 87, 321, 1278, 499, '#e1e3d7', null, 8);
  rect(c, 1392, 321, 432, 499, '#f9f5e9', '#b9b29f', 8);
  const joined = cue(k, 0, 'Match both parts of each key', 1.25);
  candidates.forEach(([t, id], i) => {
    const y = 351 + i * 115,
      g = grants.get(t + '/' + id),
      pass = returned.some(([a, b]) => a === t && b === id);
    text(c, t + ' / ' + id, 102, y + 43, 40, C.ink, { weight: 600 });
    if (joined) line(c, 370, y + 30, 370 + 134 * joined, y + 30, C.blue, 4);
    text(c, '(' + t + ', ' + id + ')', 536, y + 42, 36, C.blue, { face: 'Mono' });
    text(c, g ?? 'missing', 979, y + 43, 37, g ? C.ink : C.red);
    if (show) {
      if (pass) {
        source(c, 'FAQ', 'Permitted text for A / analyst', 1414, y - 15, 399, 102);
      } else {
        rect(c, 1418, y + 5, 9, 51, C.red);
        text(c, 'Held in store', 1450, y + 43, 35, C.red);
      }
    }
  });
  result(
    c,
    show
      ? returned.length
        ? 'Only the local FAQ travels to the application.'
        : 'The join returns no passages.'
      : 'Match the tenant and document before inspecting the group grant.',
  );
}

// R6 is the tenant-wide checklist from the opening. Keep the supplied search ID and score.
const rankedRecords = CANDIDATES.map((candidate) =>
  sourceRecord({
    ...candidate,
    grant: candidate.id === 'R6' ? checklist.grant : candidate.grant,
    policy: candidate.policyRevision,
  }),
);
function searchWithin(budget, reader = PRINCIPAL) {
  return rankedRecords
    .slice(0, budget)
    .filter((r) => currentRead(r, reader))
    .sort((a, b) => b.score - a.score);
}
const ranked = searchWithin(rankedRecords.length);
function scoreRack(c, records, x, y, gap, w, seen = 0, showGrants = true) {
  records.forEach((r, i) => {
    const px = x + i * gap,
      evaluated = i < seen,
      ok = currentRead(r),
      col = evaluated ? passColor(ok) : C.muted;
    sheet(c, px, y, w, 182);
    text(c, r.id, px + w / 2, y + 43, 40, C.ink, { align: 'center', weight: 600 });
    text(c, r.score.toFixed(2), px + w / 2, y + 83, 36, C.blue, { align: 'center', face: 'Mono' });
    text(c, r.tenant + ' · ' + (r.grant === 'tenant' ? 'all staff' : r.grant),
      px + w / 2, y + 116, 26, C.ink, { align: 'center' });
    if (showGrants) {
      rect(c, px + 9, y + 129, w - 18, 39, col, null, 3);
      text(
        c,
        evaluated ? (ok ? 'eligible' : 'restricted') : 'unchecked',
        px + w / 2,
        y + 157,
        24,
        'white',
        { align: 'center', weight: 600 },
      );
    }
  });
}
export function filter(c, k) {
  const store = [...rankedRecords.slice(0, 5), rankedRecords[6], rankedRecords[5]];
  const n = Math.round(7 * cue(k, 0, 'The identity and ACL predicate', 1.4));
  const eligible = store.slice(0, n).filter((r) => currentRead(r));
  const sorted = at(k, 1, 'orders the incident checklist');
  const output = sorted ? [...eligible].sort((a, b) => b.score - a.score) : eligible;
  heading(c, 'Filter inside the store. Rank the eligible pair.');
  sub(c, 'Seven supplied scores   /   reader in tenant A   /   verified operations group');
  scoreRack(c, store, 100, 287, 248, 225, n);
  section(
    c,
    k.beat.beatIndex ? 'Queue sent to ranking' : 'Queue inside trusted store',
    98,
    567,
    1730,
  );
  output.forEach((r, i) => {
    sheet(c, 101 + i * 831, 617, 780, 126);
    text(c, r.id + '   ' + r.title, 134 + i * 831, 672, 43, C.ink, { weight: 600 });
    text(c, 'Match ' + r.score.toFixed(2), 136 + i * 831, 721, 32, C.green);
  });
  result(
    c,
    n +
      ' checked   /   ' +
      eligible.length +
      ' eligible' +
      (sorted ? '   /   both ranked by similarity' : ''),
  );
}
const rerankRuns = [
  { name: 'A', received: ['key', 'FAQ'] },
  { name: 'B', received: ['FAQ'] },
].map((run) => ({
  ...run,
  returned: run.received.filter((id) =>
    secureEligibility(
      corpus.find((r) => r.id === id),
      PRINCIPAL,
    ),
  ),
  forbidden: run.received.filter(
    (id) =>
      !secureEligibility(
        corpus.find((r) => r.id === id),
        PRINCIPAL,
      ),
  ),
}));
export function receipts(c, k) {
  heading(c, 'What did each reranker actually receive?');
  sub(c, 'Operations reader   /   same final answer in both test runs');
  rerankRuns.forEach((run, i) => {
    const x = 100 + i * 884;
    sheet(c, x, 270, 826, 482);
    text(c, 'Run ' + run.name, x + 39, 349, 60, C.ink, { face: 'Serif' });
    rows(c, [['Final result', run.returned.join(', ')]], x + 40, 416, 746);
    text(c, 'Reranker input receipt', x + 40, 502, 31, C.muted);
    const open = at(k, 2, i ? 'Open the second capture' : 'Open the first capture');
    if (open)
      run.received.forEach((id, j) =>
        source(
          c,
          id,
          id === 'key' ? 'security only' : 'operations',
          x + 39 + j * 371,
          530,
          351,
          106,
        ),
      );
    else {
      rect(c, x + 40, 532, 745, 99, '#e3dccb', null, 5);
      text(c, 'Capture closed', x + 64, 598, 40, C.muted, { face: 'Serif' });
    }
    if (at(k, 3, i ? 'zero in B' : 'One in A'))
      text(
        c,
        run.forbidden.length + ' forbidden at handoff',
        x + 40,
        703,
        41,
        passColor(!run.forbidden.length),
        { weight: 600 },
      );
  });
  result(
    c,
    k.beat.beatIndex >= 4
      ? 'Run A copied the key across the boundary. Check caches, traces and crash reports.'
      : k.beat.beatIndex < 2
        ? 'Can the final results tell you what crossed the boundary?'
        : 'Count forbidden inputs at the ordinary reranker.',
  );
}
export function predicate(c, k) {
  heading(c, 'Which gates must a row pass?');
  const expired = at(k, 1, 'At exactly one'),
    granted = k.beat.beatIndex === 2;
  sub(
    c,
    granted
      ? 'Source policy example   /   mandatory gates followed by alternative grants'
      : 'Local lexical search   /   authorization first',
  );
  if (granted) {
    section(c, 'All base gates pass in this example', 100, 295, 1720);
    ['Tenant A', 'Literal false', 'Valid, aware time'].forEach((s, i) =>
      seal(c, s, 105 + i * 520, 351, C.green),
    );
    section(c, 'Any one of these source grants may admit the row', 100, 502, 1720);
    ['Tenant-wide', 'Owner', 'Department', 'Explicit user', 'Group', 'Role'].forEach((s, i) => {
      const x = 110 + (i % 3) * 585,
        y = 570 + Math.floor(i / 3) * 95;
      text(c, s, x, y + 39, 41, i === 4 ? C.green : C.ink);
    });
    result(
      c,
      'This source accepts alternative grants. Preserve conjunctions, explicit denies and inheritance where required.',
    );
  } else {
    rows(
      c,
      [
        ['Tenant', 'A matches A'],
        ['is_deleted', 'literal False'],
        ['Bounded endpoints', 'aware UTC datetimes'],
      ],
      98,
      351,
      752,
      106,
    );
    section(c, 'Read window  /  UTC', 992, 288, 800);
    const a = 1036,
      b = 1745,
      yy = 487;
    line(c, a, yy, b, yy, C.green, 11);
    dot(c, a, yy, 17, C.green);
    dot(c, b, yy, 17, C.green);
    dot(c, b, yy, 10, C.paper);
    text(c, '12:00', a, yy + 75, 41, C.ink, { align: 'center' });
    text(c, '13:00', b, yy + 75, 41, C.ink, { align: 'center' });
    if (k.beat.beatIndex === 1) {
      const x = expired ? b : (a + b) / 2;
      line(c, x, yy - 68, x, yy - 24, expired ? C.red : C.blue, 8);
      text(c, expired ? 'Clock 13:00' : 'Clock 12:30', x, yy - 94, 34, expired ? C.red : C.blue, {
        align: 'center',
      });
    }
    result(
      c,
      expired
        ? 'At the end instant, the row is ineligible.'
        : k.beat.beatIndex
          ? 'Start is inclusive. End is exclusive. Explicit None opens an endpoint.'
          : 'A missing or malformed mandatory field holds the row.',
    );
  }
}
export function revoke(c, k) {
  const clearGroup = cue(k, 0, 'Clear the group grant', 0.85),
    clearDept = cue(k, 0, 'Clear the department grant', 0.85);
  const group = clearGroup === 1, dept = clearDept === 1;
  const row = {
      ...corpus[1],
      ...(group ? { grant: null } : {}),
      ...(dept ? { department: null } : {}),
    },
    who = { ...PRINCIPAL, departments: ['operations'] };
  const ok = secureEligibility(row, who);
  if (k.beat.beatIndex === 1) {
    heading(c, 'What else can deny a read?');
    sub(c, 'Each test changes one condition in an otherwise eligible FAQ.');
    const cases = [
      'Other tenant',
      'Deleted',
      'Deletion is a string',
      'Future start',
      'At expiry',
      'Undecoded time',
      'Naive time',
      'No matching grant',
    ];
    cases.forEach((label, i) => {
      const x = 100 + (i % 4) * 434,
        y = 323 + Math.floor(i / 4) * 194;
      sheet(c, x, y, 403, 160);
      text(c, label, x + 23, y + 59, 36, C.ink, { face: 'Serif', max: 354 });
      seal(c, 'Deny', x + 23, y + 88, C.red);
    });
    result(c, 'Missing tenant, deletion flag, start or end also denies the read.');
    return;
  }
  if (k.beat.beatIndex === 2) {
    const expired = at(k, 2, 'Expire that last allowed record');
    const checklist = { ...corpus[0], end: expired ? 100 : null };
    const pool = [checklist, row].filter((r) => secureEligibility(r, who));
    heading(c, 'What if the last readable record expires?');
    sub(c, 'The FAQ already lost both permission paths.');
    source(
      c,
      'checklist',
      expired ? 'End = now   /   expired' : 'Tenant grant   /   valid now',
      98,
      341,
      660,
      122,
    );
    source(c, 'FAQ', 'Group and department grants removed', 98, 553, 660, 122);
    section(c, 'Authorized pool', 983, 315, 808);
    if (pool.length) source(c, 'checklist', 'Tenant-wide source', 984, 372, 748);
    else {
      text(c, 'Empty', 983, 506, 82, C.red, { face: 'Serif' });
      seal(c, 'Request permitted evidence', 983, 585, C.red);
    }
    result(
      c,
      expired
        ? 'Keep the filter when the last eligible record expires.'
        : 'The tenant-wide checklist still needs valid base fields.',
    );
    return;
  }
  heading(c, 'Can the FAQ still reach this reader?');
  sub(c, 'Toy policy   /   a group or department grant can authorize the same row');
  section(c, 'Permission paths', 100, 299, 440);
  section(c, 'Fixed source', 820, 299, 400);
  section(c, 'Returned by this read', 1393, 299, 423);
  for (const [i, [name, removed]] of [['Group', clearGroup], ['Department', clearDept]].entries()) {
    const y = 371 + i * 180;
    curve(c, 542, y + 56, 820, 510, C.rule, 4, true);
    if (removed < 1) {
      c.save();
      c.beginPath();
      c.rect(537, 386, 288 * (1 - removed), 244);
      c.clip();
      curve(c, 542, y + 56, 820, 510, C.green, 9);
      c.restore();
    }
    source(c, name, removed === 1 ? 'grant removed' : 'operations grant', 100, y, 440);
  }
  source(c, 'FAQ', 'Tenant A   /   version 3', 820, 455, 400);
  line(c, 1220, 510, 1393, 510, C.rule, 4);
  rect(c, 1393, 455, 423, 110, C.sheet, C.rule, 4);
  if (ok) {
    fade(c, 1 - clearDept, () => {
      line(c, 1220, 510, 1393, 510, C.green, 8);
      source(c, 'FAQ', 'Authorized evidence', lerp(1393, 1357, clearDept), 455, 423);
    });
  } else {
    text(c, 'No FAQ returned', 1605, 515, 39, C.red, { face: 'Serif', align: 'center' });
  }
  seal(c, ok ? 'Read allowed' : 'Read held', 1393, 601, passColor(ok));
  text(
    c,
    ok ? 'At least one live permission path reaches the FAQ.' : 'Both paths have been withdrawn.',
    100, 772, 37, passColor(ok),
  );
}

export function metadata(c, k) {
  heading(c, 'What travels with each chunk?');
  sub(c, 'Signing-key runbook   /   source identity and policy survive splitting');
  sheet(c, 96, 285, 526, 465);
  text(c, 'Source record', 132, 360, 52, C.ink, { face: 'Serif' });
  rows(
    c,
    [
      ['Source', 'A / key'],
      ['Content', 'v7'],
      ['Policy', 'v42'],
      ['Groups', 'security, platform'],
    ],
    132,
    440,
    456,
    83,
  );
  const q = cue(k, 0, 'Each child needs', 1.1);
  for (let i = 0; i < 2; i++) {
    const y = 316 + i * 233;
    thread(c, 622, 515, 978, y + 75, C.blue, q);
    sheet(c, 979, y, 789, 160);
    text(c, 'A / key / chunk ' + (i + 1), 1008, y + 57, 43, C.blue, { weight: 600 });
    text(c, 'Content 7    Policy 42    security, platform', 1008, y + 114, 32, C.ink);
  }
  if (at(k, 1, 'emits an ISO timestamp')) {
    rect(c, 103, 785, 1669, 66, '#e1e6df', null, 4);
    const converted = at(k, 2, 'Validate at ingestion');
    text(
      c,
      converted
        ? 'Adapter input decoded    /    aware UTC datetime    /    2026-01-01 00:00 UTC'
        : 'Encoded field    /    valid_from = "2026-01-01T00:00:00+00:00"',
      125,
      830,
      35,
      C.blue,
      { face: 'Mono' },
    );
  }
  result(
    c,
    k.beat.beatIndex === 2
      ? 'Validate field types and the real backend filter syntax at the adapter.'
      : k.beat.beatIndex === 1
        ? 'Decode the ISO timestamp into an aware datetime before evaluating it.'
        : 'Keep identity, deletion, validity and grants with every child.',
  );
}
// The trusted paths visit the same two sources. Compare the passage IDs that leave each one.
const pathSources = [faq, corpus.find((r) => r.id === 'key')];
const pathSourceById = new Map(pathSources.map(r => [r.id, r]));
const exactIds = ['FAQ', 'key'];
const annVisits = ['key', 'FAQ'];
const savedCopies = pathSources.map(({ tenant, id, revision }) => ({ tenant, id, revision }));
const citationIds = ['key', 'FAQ'];

function pathReceipts(reader) {
  const passages = (ids) => ids.map(id => pathSourceById.get(id))
    .filter(row => currentRead(row, reader)).map(row => row.id);
  const cache = savedCopies.filter(ref => {
    const live = pathSourceById.get(ref.id);
    return live?.tenant === ref.tenant && live.revision === ref.revision && currentRead(live, reader);
  });
  return [
    ['Exact lookup', 'Exact lookup returns', passages(exactIds)],
    ['ANN search', 'and returns the FAQ', passages(annVisits)],
    ['Cache hit', 'releases the FAQ alone', cache.map(ref => ref.id)],
    ['Citation preview', 'shows only the FAQ text', passages(citationIds)],
  ];
}

function readPaths(c, k) {
  const expected = at(k, 3, 'Only the FAQ');
  const receipts = pathReceipts(PRINCIPAL);
  heading(c, 'Which passage reaches the operations reader?');
  sub(c, 'Local test   /   ordinary application role   /   reader ' + PRINCIPAL.tenant + ' / ' + PRINCIPAL.id +
    '   /   group: ' + PRINCIPAL.groups.join(', '));
  source(c, 'FAQ', 'Read grant   /   ' + faq.grant, 100, 229, 811);
  source(c, 'key', 'Read grant   /   ' + pathSources[1].grant, 994, 229, 811);
  section(c, 'Retrieval path', 105, 416, 507);
  section(c, 'Expected passage', 697, 416, 464);
  section(c, 'Observed passage', 1288, 416, 505);
  let observedCount = 0;
  receipts.forEach(([label, phrase, ids], i) => {
    const y = 499 + i * 96;
    const seen = at(k, 3, phrase);
    if (seen) observedCount++;
    text(c, label, 108, y, 43);
    text(c, expected ? 'FAQ only' : '?', 700, y, 43, expected ? C.blue : C.muted);
    const observed = ids.length === 1 ? short[ids[0]] + ' only' : ids.map(id => short[id]).join(' + ') || 'None';
    text(c, seen ? observed : 'Awaiting read', 1290, y, 43, seen ? C.ink : C.muted, { weight: seen ? 600 : 400 });
    line(c, 102, y + 25, 1802, y + 25, C.rule, 1);
  });
  const matches = receipts.every(([, , ids]) => ids.length === 1 && ids[0] === 'FAQ');
  result(c, observedCount === receipts.length
    ? (matches ? 'All four receipts match. Only FAQ text reached this reader.' : 'Check the receipt that differs.')
    : expected ? 'Compare each observed passage with the expected passage for this reader.'
      : 'Use the two grants to predict what each path may return.');
}

export function rls(c, k) {
  if (k.beat.beatIndex >= 2) return readPaths(c, k);
  const force = at(k, 1, 'Force row-level security'),
    exceptions = at(k, 1, 'Superusers'),
    denied = at(k, 0, 'The query returns zero rows');
  heading(c, 'Which database role runs the search?');
  sub(c, 'PostgreSQL   /   RLS enabled   /   no applicable policy   /   SELECT privilege assumed');
  const facts = [
    ['Application role', 'default deny', C.green],
    ['Table owner', force ? 'default deny' : 'bypasses RLS', force ? C.green : C.red],
    ['Superuser', 'bypasses RLS', C.red],
    ['BYPASSRLS role', 'bypasses RLS', C.red],
  ];
  sheet(c, 105, 282, 1145, 482);
  rows(c, denied ? facts.slice(0, exceptions ? 4 : k.beat.beatIndex ? 2 : 1) : [['Application role', 'Awaiting query', C.muted]], 151, 386, 1055, 104);
  pair(c, 'Owner policy setting', force ? 'FORCE enabled' : 'Default', 1335, 379, 455);
  result(c, exceptions ? 'Use the ordinary application role for retrieval.' : 'Read the same table under each connection identity.');
}
function scanReveal(k, beat, phrase, travel = 0) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  const { start, end } = k.wordCue(phrase);
  const progress = k.reveal(phrase, end - start + travel, { captionStart: phrase });
  if (progress === 1) return 1;
  return travel ? Math.max(0, (k.elapsed - end) / travel) : 0;
}

export function scan(c, k) {
  const known = scanReveal(k, 0, 'Exact search finds both eligible records, R six and R seven');
  const five = scanReveal(k, 0, 'First, stop after the five highest scores', 0.85);
  const six = scanReveal(k, 1, 'Move the stop one place to the right', 0.85);
  const seven = scanReveal(k, 3, 'Let the search visit the seventh record', 0.85);
  const empty = scanReveal(k, 0, 'Both result slots are empty');
  const firstCopy = scanReveal(k, 2, 'Only R six makes it', 0.85);
  const singleRecall = scanReveal(k, 2, 'We recovered one of the two passages in the exact result');
  const secondCopy = scanReveal(k, 3, 'Both passages now fit', 0.85);
  const budget = seven > 0 ? 7 : six > 0 ? 6 : 5;
  const hits = searchWithin(budget);
  const copies = [firstCopy, secondCopy];
  const settled = budget === 5 ? empty === 1 : hits.every((_, i) => copies[i] === 1);
  const showRecall = settled && (budget !== 6 || singleRecall);

  const rackX = 100;
  const rackY = 285;
  const cardSpacing = 249;
  const cardWidth = 223;
  const cardRight = (count) => rackX + (count - 1) * cardSpacing + cardWidth;
  const stopX = lerp(rackX, cardRight(5), five) + cardSpacing * (six + seven);
  heading(c, 'Where does the search stop?');
  sub(c, 'Request   /   two passages for tenant A, operations');
  scoreRack(c, rankedRecords, rackX, rackY, cardSpacing, cardWidth, rankedRecords.length);
  line(c, rackX, 506, cardRight(rankedRecords.length), 506, C.rule, 3);
  if (five > 0) {
    line(c, rackX, 506, stopX, 506, C.blue, 7);
    line(c, stopX, 484, stopX, 533, C.blue, 7);
    const atStop = (budget === 7 ? seven : budget === 6 ? six : five) === 1;
    text(c, atStop ? 'Scan stops at ' + budget : 'Moving the scan stop', rackX, 568, 34, C.blue);
  }
  pair(
    c,
    'Exact authorized pair',
    known ? ranked.map((r) => r.id).join(' + ') : 'Checking…',
    rackX,
    675,
    380,
  );
  pair(
    c,
    'Authorized recall',
    showRecall ? hits.length + ' / ' + ranked.length : '?',
    535,
    675,
    350,
    showRecall ? C.blue : C.muted,
  );

  const slotY = 650;
  const slotWidth = 345;
  const slotHeight = 100;
  const slotXs = [1000, 1450];
  slotXs.forEach((x, i) => {
    const p = hits[i] ? copies[i] : 0;
    rect(c, x, slotY, slotWidth, slotHeight, C.sheet, C.rule, 6);
    if (p === 0) {
      text(c, settled ? 'Empty' : 'Waiting', x + slotWidth / 2, slotY + 63, 40, C.muted, {
        align: 'center',
      });
    }
  });
  text(c, 'Requested result slots', 1397, 802, 34, C.muted, { align: 'center' });
  hits.forEach((hit, i) => {
    const p = copies[i];
    if (!p) return;
    const rank = rankedRecords.indexOf(hit);
    const width = lerp(120, slotWidth, p);
    const height = lerp(60, slotHeight, p);
    const x = lerp(rackX + rank * cardSpacing + cardWidth / 2, slotXs[i] + slotWidth / 2, p);
    const y = lerp(542, slotY, p);
    rect(c, x - width / 2, y, width, height, C.green, null, 6);
    text(c, hit.id, x, y + height / 2 + 15, 42, C.sheet, { align: 'center', weight: 600 });
  });
  result(
    c,
    k.beat.beatIndex === 4
      ? 'Measure recall and latency against exact authorized search on the real index.'
      : budget === 6 && !firstCopy
        ? 'Look at the stop and the grant on each side of it.'
        : budget === 6 && settled
          ? 'R7 has a grant and lies beyond the scan stop.'
          : 'The score order and permissions stay fixed as the search budget changes.',
  );
}
const sampleA = [3, 27, 46],
  sampleB = [4, 8, 19, 22, 29, 37];
function grid(c, x, y, ids, n, capacity = 40) {
  for (let i = 0; i < capacity; i++) {
    const col = i % 10,
      row = Math.floor(i / 10),
      seen = i < n,
      hit = seen && ids.includes(i + 1);
    rect(
      c,
      x + col * 66,
      y + row * 62,
      55,
      48,
      hit ? C.green : seen ? '#d6d3c8' : C.sheet,
      '#aaa695',
      4,
    );
    if (hit)
      text(c, i + 1, x + col * 66 + 27, y + row * 62 + 34, 25, 'white', {
        align: 'center',
        weight: 600,
      });
  }
}
export function expected(c, k) {
  const b = k.beat.beatIndex,
    calc = at(k, 1, 'Four on average'),
    more = cue(k, 3, 'examine ten more candidates', 1.15);
  const n = 40 + Math.round(10 * more);
  heading(c, 'How many permitted rows will the search find?');
  if (b < 5) {
    sub(
      c,
      b < 3
        ? 'Worksheet   /   40 candidates   /   independent match probability 0.10   /   10 requested'
        : 'Same scan A   /   40 examined initially   /   cap 50   /   10 requested',
    );
    section(c, 'Scan A', 107, 290, 674);
    section(c, b < 3 ? 'Scan B' : 'Iterative scan of A   /   ' + n + ' examined', 1006, 290, 795);
    grid(c, 111, 337, at(k, 1, 'one possible scan') ? sampleA : [], 40);
    if (b < 3) grid(c, 1011, 337, at(k, 1, 'another with six') ? sampleB : [], 40);
    else grid(c, 1011, 337, sampleA, n, 50);
    if (calc) {
      text(c, '40 × 0.10 = ' + 40 * 0.1 + ' expected', 110, 721, 47, C.blue, { face: 'Serif' });
    }
    if (b >= 3)
      text(
        c,
        sampleA.filter((id) => id <= n).length + ' / 10 slots filled',
        1011,
        736,
        44,
        C.green,
        { weight: 600 },
      );
    result(
      c,
      b >= 3
        ? 'An iterative scan stops when the request fills or a scan limit is reached.'
        : calc
          ? 'An expected count describes many scans. Green squares count matches on one path.'
          : 'Predict the expected count before inspecting either scan.',
    );
  } else {
    sub(c, 'Weaviate example   /   same forty candidates   /   allow-list {3, 27}');
    grid(c, 111, 349, sampleA, 40);
    section(c, 'One graph path', 1005, 298, 777);
    const traced = cue(k, 5, 'one path visits', 1.0);
    [2, 3, 8].forEach((id, i) => {
      const x = 1063 + i * 265;
      dot(c, x, 472, 47, id === 3 ? C.green : C.muted);
      text(c, id, x, 487, 41, 'white', { align: 'center', weight: 600 });
      if (i < 2) line(c, x + 49, 472, x + 213, 472, traced * 2 > i ? C.blue : C.rule, 5);
    });
    if (at(k, 5, 'Only three can enter')) seal(c, 'Returned   /   ID 3', 1018, 612);
    result(
      c,
      'Compare authorized recall, request fill and latency for the chosen filter and index.',
    );
  }
}
export function checkRetrieval() {
  const ungrouped = { ...PRINCIPAL, groups: [] };
  for (const [reader, expectedIds] of [[PRINCIPAL, ['FAQ']], [ungrouped, []], [{ ...PRINCIPAL, groups: ['security'] }, ['key']]]) {
    for (const [, , ids] of pathReceipts(reader)) assert.deepEqual(ids, expectedIds);
  }
  assert(currentRead(faq));
  assert(!currentRead(faq, ungrouped));
  assert(!currentRead(faq, { ...PRINCIPAL, groups: ['security'] }));
  assert(!currentRead(null));
  assert(!currentRead(faq, null));
  assert(currentRead(checklist, ungrouped));
  assert.deepEqual(searchWithin(7, ungrouped).map((r) => r.id), ['R6']);
  assert(!currentRead(rankedRecords[5], { ...ungrouped, tenant: 'B' }));
  assert(!currentRead({ ...rankedRecords[5], end: 100 }, ungrouped));
  assert.deepEqual(joinIDs(['operations']), [['A', 'FAQ']]);
  assert.deepEqual(joinIDs([]), []);
  assert.deepEqual(
    rerankRuns.map((r) => [r.returned, r.forbidden]),
    [
      [['FAQ'], ['key']],
      [['FAQ'], []],
    ],
  );
  assert.deepEqual(
    [5, 6, 7].map((b) => searchWithin(b).map((r) => r.id)),
    [[], ['R6'], ['R6', 'R7']],
  );
  const who = { ...PRINCIPAL, departments: ['operations'] };
  assert(secureEligibility({ ...corpus[1], grant: null }, who));
  assert(!secureEligibility({ ...corpus[1], grant: null, department: null }, who));
  assert.deepEqual(
    [40 * 0.1, sampleA.filter((n) => n <= 40).length, sampleB.length, sampleA.length],
    [4, 2, 6, 3],
  );
}
