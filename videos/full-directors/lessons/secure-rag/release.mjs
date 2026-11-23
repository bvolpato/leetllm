import assert from 'node:assert/strict';
import { localOutputCheck, secureEligibility } from '../../../films/secure-rag/arithmetic.mjs';
import { PRINCIPAL } from '../../../films/secure-rag/fixtures.mjs';
import { corpus, dual } from './copies.mjs';
import {
  C,
  at,
  cue,
  heading,
  sub,
  text,
  rect,
  line,
  dot,
  sheet,
  source,
  thread,
  section,
  rows,
  pair,
  result,
  seal,
  passColor,
} from './atelier.mjs';

const days = 3;
function answerCase(level, duration, citation) {
  const draft =
    '[' +
    level +
    '] Review takes ' +
    duration +
    ' days. Contact owner@example.com.' +
    (citation ? ' [source:' + citation + ']' : '');
  const check = localOutputCheck(draft, ['FAQ'], ['FAQ']);
  return { check, draft, supported: duration === days };
}
export function output(c, k) {
  const b = k.beat.beatIndex;
  heading(c, 'What does the output check catch?');
  sub(c, 'Authorized context    Operations FAQ    /    reader clearance 2');
  if (b === 0) {
    const redacted = at(k, 0, 'redacts the address'),
      restricted = at(k, 0, 'A restricted draft');
    const level = restricted ? 'restricted' : 'confidential',
      n = restricted ? 3 : 2,
      s = answerCase(level, 3, 'FAQ');
    sheet(c, 106, 303, 1000, 385);
    text(c, 'Buffered draft', 145, 391, 52, C.ink, { face: 'Serif' });
    text(c, s.draft.slice(0, s.draft.indexOf(' Contact')), 149, 479, 40, C.ink, { max: 915 });
    text(
      c,
      redacted ? 'Contact [REDACTED_EMAIL]' : 'Contact owner@example.com',
      149,
      579,
      44,
      redacted ? C.blue : C.red,
    );
    pair(c, 'Draft level', n, 1213, 389, 506);
    pair(c, 'Reader clearance', 2, 1213, 555, 506);
    if (at(k, 0, 'At clearance two'))
      seal(
        c,
        s.check.allow ? 'Fits clearance' : 'Hold at level 3',
        1211,
        701,
        passColor(s.check.allow),
      );
    result(
      c,
      'The read grant, privacy filter and clearance check each answer a different question.',
    );
  } else {
    const wrong = at(k, 1, 'An ID outside the context'),
      attached = at(k, 1, 'Now attach'),
      repaired = at(k, 2, 'Change ninety days to three');
    const id = attached ? 'FAQ' : wrong ? 'other' : '',
      duration = repaired ? days : 90;
    const s = answerCase('confidential', duration, id),
      judged = (b === 2 && at(k, 2, 'It passes')) || !attached;
    for (const [i, [name, n]] of [
      ['Operations FAQ', days],
      ['Buffered answer', duration],
    ].entries()) {
      const x = 104 + i * 874;
      sheet(c, x, 287, 813, 409);
      text(c, name, x + 40, 371, 53, C.ink, { face: 'Serif' });
      text(c, 'Review takes', x + 41, 468, 39, C.muted);
      text(c, n + ' days', x + 39, 597, 92, i === 0 || s.supported ? C.blue : C.red, {
        face: 'Serif',
      });
    }
    text(c, 'Citation   /   ' + (id || 'missing'), 1017, 661, 33, C.ink);
    result(
      c,
      attached && !judged
        ? 'Will an in-context citation pass this check?'
        : s.check.allow
          ? s.supported
            ? 'The corrected duration agrees with the FAQ.'
            : 'Citation passes. The source says three days. The draft says ninety.'
          : 'Citation membership fails. Hold the draft.',
    );
  }
}
const destinations = [
  ['Senior reader', 'read', true],
  ['Junior colleague', 'share', false],
  ['Outside judge', 'export', false],
  ['Production', 'deploy', false],
];
export function destinationsScene(c, k) {
  heading(
    c,
    k.beat.beatIndex === 1
      ? 'May the reader share the text or act on it?'
      : 'Who may receive the summary?',
  );
  sub(c, 'The senior reader has a document grant. The runbook has a verified signature.');
  source(c, 'key', 'A / key   ·   version 7', 95, 457, 495, 120);
  destinations.forEach(([target, op, ok], i) => {
    const y = 272 + i * 136,
      visible =
        i === 0 ||
        at(
          k,
          i === 3 ? 1 : 0,
          ['', 'junior colleague', 'external evaluation judges', 'Enforce requested operation'][i],
        );
    if (!visible) return;
    thread(c, 591, 515, 939, y + 47, ok ? C.green : C.red, 1);
    sheet(c, 946, y - 8, 846, 115, ok ? '#e0eadf' : '#eedace');
    rect(c, 946, y - 8, 13, 115, passColor(ok));
    pair(c, target, op, 986, y + 28, 441);
    seal(c, ok ? 'Read allowed' : 'Hold', 1511, y + 18, passColor(ok));
  });
  result(c, 'Apply policy at the actual recipient, export destination or protected action.');
}
export function action(c, k) {
  heading(c, 'Does this read authorize a deployment?');
  sub(c, 'One operations reader    /    one runbook    /    two decisions');
  const allowed = secureEligibility(corpus[1], PRINCIPAL),
    effect = at(k, 0, 'separate action grant');
  sheet(c, 104, 294, 761, 419);
  text(c, 'Retrieval service', 143, 373, 53, C.ink, { face: 'Serif' });
  rows(
    c,
    [
      ['Operation', 'read'],
      ['Target', 'operations guide'],
      ['Source grant', 'operations'],
    ],
    143,
    464,
    682,
    73,
  );
  if (allowed) seal(c, 'May read passage', 145, 640);
  sheet(c, 1014, 294, 779, 419);
  text(c, 'Tool executor', 1053, 373, 53, C.ink, { face: 'Serif' });
  rows(
    c,
    [
      ['Operation', 'deploy'],
      ['Target', 'production'],
      ['Action grant', 'absent'],
    ],
    1053,
    464,
    698,
    73,
  );
  if (effect) seal(c, 'Deployment held', 1053, 640, C.red);
  result(
    c,
    k.beat.beatIndex === 1
      ? 'Check actor, operation, target, arguments and required approval at the executor.'
      : 'A reference to an operation is evidence. Its execution requires a separate grant.',
  );
}
const auditEvents = [
  { id: 'req-123', source: corpus[1] },
  { id: 'req-124', source: corpus[2] },
].map(({ id, source }) => ({ id, source, allow: secureEligibility(source, PRINCIPAL) }));
export function audit(c, k) {
  heading(c, 'Can a reviewer find the blocked request?');
  sub(c, 'Restricted audit log    /    tenant A    /    analyst    /    policy 42');
  const count = at(k, 1, 'The second was blocked')
    ? 2
    : at(k, 1, 'The first request was allowed')
      ? 1
      : 0;
  sheet(c, 100, 278, 1080, 466);
  for (let i = 0; i < 15; i++) {
    dot(c, 118, 300 + i * 29, 4, C.paper);
    dot(c, 1162, 300 + i * 29, 4, C.paper);
  }
  section(c, 'Request     /     source version     /     outcome', 148, 361, 980);
  auditEvents.slice(0, count).forEach((r, i) => {
    const yy = 420 + i * 128;
    text(c, r.id, 155, yy + 42, 39, C.ink, { face: 'Mono' });
    text(c, r.source.id + ' v' + r.source.revision, 500, yy + 42, 41, C.ink);
    seal(c, r.allow ? 'Allow' : 'Block', 858, yy + 1, passColor(r.allow));
  });
  if (!count) text(c, 'Waiting for decision receipts', 156, 513, 43, C.muted, { face: 'Serif' });
  if (at(k, 1, 'simulated alert')) {
    section(c, 'Simulated alert', 1305, 359, 494);
    text(c, auditEvents.find((r) => !r.allow).id, 1303, 482, 56, C.red, { face: 'Mono' });
    text(c, 'Blocked read', 1305, 552, 36, C.ink);
  }
  result(
    c,
    k.beat.beatIndex === 2
      ? 'Restrict log readers, encrypt identifiers and set retention and delivery policy.'
      : 'Record the decision and the inputs needed to explain it. Keep passage bodies out.',
  );
}
function clockFace(c, x, y, h, color) {
  c.beginPath();
  c.arc(x, y, 115, 0, Math.PI * 2);
  c.fillStyle = C.sheet;
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = 7;
  c.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    line(
      c,
      x + 94 * Math.cos(a),
      y + 94 * Math.sin(a),
      x + 103 * Math.cos(a),
      y + 103 * Math.sin(a),
      C.muted,
      i % 3 === 0 ? 5 : 2,
    );
  }
  const a = ((h % 12) * Math.PI) / 6 - Math.PI / 2;
  line(c, x, y, x, y - 83, color, 5);
  line(c, x, y, x + 62 * Math.cos(a), y + 62 * Math.sin(a), color, 11);
  dot(c, x, y, 9, color);
}
const hours = { verified: 9, guide: 11 };
export function guide(c, k) {
  heading(c, 'What should the reviewer do with this guide?');
  sub(c, 'Compare the proposed desk schedule with the reviewed source.');
  for (const [i, [s, h]] of [
    ['Reviewed schedule', hours.verified],
    ['Proposed guide', hours.guide],
  ].entries()) {
    const x = 107 + i * 875;
    sheet(c, x, 292, 810, 415);
    text(c, s, x + 34, 368, 51, C.ink, { face: 'Serif' });
    clockFace(c, x + 171, 528, h, i ? C.red : C.blue);
    pair(
      c,
      'Desk opens',
      String(h).padStart(2, '0') + ':00',
      x + 365,
      491,
      391,
      i ? C.red : C.blue,
    );
  }
  if (at(k, 0, 'asks the assistant to change'))
    text(c, 'Also requests a calendar edit', 1339, 651, 31, C.red, { max: 422 });
  if (at(k, 2, 'A valid author signature')) seal(c, 'Author signature verified', 1024, 761, C.blue);
  if (at(k, 3, 'Quarantine this guide')) {
    rect(c, 984, 288, 810, 105, C.plum, null, 3);
    text(c, 'Quarantined   /   proposed guide', 1015, 360, 44, '#fff9ed', { weight: 600 });
  }
  result(
    c,
    at(k, 3, 'Quarantine this guide')
      ? 'Quarantine the proposed guide and verify the schedule with the source.'
      : at(k, 2, 'calendar service holds')
        ? 'Reader may open the guide. Calendar edit held. The reviewed schedule still says 09:00.'
        : k.beat.beatIndex === 1
          ? 'The false fact can poison evidence. A document-borne instruction can influence the assistant.'
          : 'Read the hours on the two clocks.',
  );
}
const publishedRecovery = 0.92;
export function vectors(c, k) {
  heading(c, 'What can a vector backup disclose?');
  const other = k.beat.beatIndex === 1;
  sub(
    c,
    other
      ? 'Separate clinical-note experiment   /   pseudonymous names'
      : 'Vec2Text study   /   GTR encoder   /   32-token Wikipedia passages',
  );
  section(c, 'Index backup', 100, 296, 600);
  for (let i = 0; i < 3; i++) {
    rect(c, 102, 350 + i * 96, 581, 70, '#d9ddd7', null, 8);
    text(
      c,
      ['[ 0.4, −0.1, … ]', '[ 0.7,  0.5, … ]', '[ 0.2, −0.8, … ]'][i],
      134,
      398 + i * 96,
      38,
      C.blue,
      { face: 'Mono' },
    );
  }
  section(c, other ? 'Published observation' : 'Word-for-word reconstruction', 853, 296, 953);
  if (other) {
    text(c, 'Made-up names in notes', 852, 419, 49, C.ink, { face: 'Serif' });
    if (at(k, 1, 'They recovered some')) {
      seal(c, 'Some names recovered', 857, 519, C.red);
    }
  } else {
    text(c, 'Exact matches ÷ passages tested', 854, 407, 38, C.ink);
    line(c, 867, 527, 1771, 527, C.rule, 24);
    const reported = at(k, 0, 'Ninety-two percent');
    if (reported) {
      line(c, 867, 527, 867 + 904 * publishedRecovery, 527, C.blue, 24);
      text(c, Math.round(publishedRecovery * 100) + '% exact', 854, 654, 73, C.blue, {
        face: 'Serif',
      });
    }
  }
  result(
    c,
    other
      ? 'Protect index reads, backups and vector exports. Evaluate exposure for your own encoder.'
      : at(k, 0, 'Longer passages matched')
        ? 'Longer passages matched less often in this study.'
        : 'The percentage applies to these passages and this encoder.',
  );
}
const surfaces = ['Result', 'Reranker', 'Judge', 'Prompt', 'Cache', 'Trace', 'Reply'];
function testCases() {
  const key = corpus[2];
  return [
    ['Missing tenant', key, { ...dual, tenant: null }],
    ['Other tenant', key, { ...dual, tenant: 'B' }],
    ['Expired grant', { ...key, end: 100 }, dual],
    ['Deleted source', { ...key, deleted: true }, dual],
    ['Group removed', key, PRINCIPAL],
    ['Policy unavailable', key, null],
  ].map(([label, row, reader]) => ({ label, allowed: secureEligibility(row, reader) }));
}
export function matrix(c, k) {
  heading(
    c,
    k.beat.beatIndex === 1
      ? 'What else must the test distinguish?'
      : 'Where could a copy of the key passage go?',
  );
  sub(
    c,
    k.beat.beatIndex === 1
      ? 'Two authorized source fixtures   /   different downstream decisions'
      : 'Regression expectations   /   same protected source ID on every route',
  );
  if (k.beat.beatIndex === 1) {
    const effect = at(k, 1, 'unauthorized upload');
    section(c, 'Test input', 102, 299, 741);
    section(c, 'Observe each independent decision', 965, 299, 824);
    source(c, 'checklist', 'Allowed, irrelevant to the signing-key query', 104, 370, 738);
    pair(c, 'Eligibility / usefulness', 'Pass read   ·   omit from answer', 968, 376, 821, C.blue);
    if (effect) {
      source(c, 'FAQ', 'Readable page requests an upload', 104, 599, 738);
      pair(c, 'Eligibility / action grant', 'Pass read   ·   hold upload', 968, 607, 821, C.red);
    }
    result(
      c,
      'Measure revocation delay separately from recall. Trace the same source ID into each test destination.',
    );
    return;
  }
  const show = at(k, 0, 'Inspect returned text');
  surfaces.forEach((s, i) =>
    text(c, s, 610 + i * 182, 310, 31, C.blue, { align: 'center', weight: 600 }),
  );
  testCases().forEach(({ label, allowed }, i) => {
    const yy = 353 + i * 69;
    text(c, label, 109, yy + 33, 35, C.ink);
    line(c, 108, yy + 51, 1815, yy + 51, C.rule, 1);
    if (show)
      surfaces.forEach((_, j) => {
        const x = 610 + j * 182;
        dot(c, x, yy + 19, 14, allowed ? C.red : C.green);
        if (!allowed) line(c, x - 6, yy + 19, x + 6, yy + 19, C.sheet, 3);
      });
  });
  text(
    c,
    show
      ? '−   Expect no copy of this protected passage'
      : 'Inspect each destination independently',
    107,
    829,
    34,
    C.green,
  );
  result(
    c,
    k.beat.beatIndex === 1
      ? 'Also test an irrelevant allowed result and a refused upload. Measure recall and revocation separately.'
      : 'A clean reply checks one destination out of seven.',
  );
}
export function transfer(c, k) {
  heading(c, 'Why was the runbook missing?');
  sub(c, 'Restricted decision receipts   /   A / key    ·    content v7    ·    read policy 42');
  const joined = at(k, 1, 'Replay the read'),
    deploy = at(k, 2, 'production deployment');
  const log = [['Read', 'operations', secureEligibility(corpus[2], PRINCIPAL), 'missing group']];
  if (joined)
    log.push([
      'Read',
      'operations + security',
      secureEligibility(corpus[2], dual),
      'matching group',
    ]);
  if (deploy) log.push(['Deploy', 'operations + security', false, 'approval missing']);
  ['Operation', 'Verified reader groups', 'Decision and reason'].forEach((s, i) =>
    section(c, s, [104, 489, 1122][i], 292, [330, 570, 687][i]),
  );
  log.forEach(([op, groups, pass, why], i) => {
    const y = 352 + i * 141;
    text(c, op, 106, y + 46, 44, C.ink, { face: 'Serif' });
    text(c, groups, 493, y + 46, 39, C.blue);
    seal(c, pass ? 'Allow' : 'Hold', 1120, y + 2, passColor(pass));
    text(c, why, 1324, y + 46, 36, C.ink);
    line(c, 103, y + 92, 1808, y + 92, C.rule, 2);
  });
  result(
    c,
    deploy
      ? 'A permitted read stays on the receipt. Deployment needs a separate approval.'
      : joined
        ? 'Missing grant points to policy. An eligible item beyond the scan limit points to search.'
        : 'The reviewer can explain the decision from the receipt without copying the runbook.',
  );
}
export function checkRelease() {
  const wrong = answerCase('confidential', 90, 'FAQ');
  assert(wrong.check.allow && !wrong.supported);
  assert(wrong.check.text.includes('[REDACTED_EMAIL]'));
  assert(!wrong.check.text.includes('owner@example.com'));
  assert(!answerCase('restricted', 3, 'FAQ').check.allow);
  assert(!answerCase('confidential', 90, 'other').check.allow);
  assert(!answerCase('confidential', 90, '').check.allow);
  assert(answerCase('confidential', 3, 'FAQ').supported);
  assert.deepEqual(
    auditEvents.map((r) => [r.id, r.allow]),
    [
      ['req-123', true],
      ['req-124', false],
    ],
  );
  assert(testCases().every((r) => !r.allowed));
  assert.equal(surfaces.length, 7);
  assert.equal(hours.verified, 9);
  assert.notEqual(hours.guide, hours.verified);
  assert.equal(Math.round(100 * publishedRecovery), 92);
}
