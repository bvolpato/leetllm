import assert from 'node:assert/strict';
import { PRINCIPAL, SECURE_SOURCES } from '../../../films/secure-rag/fixtures.mjs';
import {
  freshSecureState,
  reportAdmission,
  secureEligibility,
  sourceRecord,
  localOutputCheck,
} from '../../../films/secure-rag/arithmetic.mjs';
import {
  C,
  at,
  cue,
  heading,
  sub,
  text,
  rect,
  line,
  section,
  source,
  rows,
  pair,
  result,
  seal,
  sheet,
  short,
  dyes,
  thread,
  passColor,
  lerp,
} from './atelier.mjs';
import { cloth } from './weave.mjs';

export const corpus = SECURE_SOURCES.map(sourceRecord);
export const dual = { ...PRINCIPAL, groups: ['operations', 'security'] };
const refs = corpus.slice(0, 3).map(({ id, tenant, revision }) => ({ id, tenant, revision }));
const ops = refs.slice(0, 2);
const finalCase = freshSecureState();

function booklet(c, id, x, y, score, readers) {
  const color = dyes[id],
    w = 480,
    h = 283;
  rect(c, x + 9, y + 10, w, h, '#48383228', null, 9);
  rect(c, x, y + 9, w, h, '#cfbda0', '#847464', 8);
  for (let i = 2; i < 9; i += 2) line(c, x + 6, y + h + i, x + w - 5, y + h + i, '#f4ead7', 1);
  rect(c, x, y, w, h, color, null, 8);
  line(c, x + 32, y + 4, x + 32, y + h - 2, '#ffffff65', 3);
  text(
    c,
    id === 'key' ? 'Signing-key runbook' : 'Incident checklist',
    x + 52,
    y + 80,
    43,
    '#fff8eb',
    { face: 'Serif', max: w - 65 },
  );
  text(c, readers, x + 52, y + 146, 31, '#fff8eb');
  const bx = x + 55,
    by = y + 207;
  line(c, bx, by, bx + 230, by, '#ffffff66', 9);
  line(c, bx, by, bx + 230 * score, by, '#fff9eb', 10);
  text(c, score.toFixed(2), x + 320, y + 218, 40, '#fff8eb', { weight: 600 });
}
function slip(c, id, x, y, w = 355) {
  rect(c, x + 4, y + 6, w, 76, '#261b1928', null, 3);
  rect(c, x, y, w, 76, C.sheet, dyes[id], 3);
  rect(c, x, y, 13, 76, dyes[id]);
  text(c, id === 'key' ? 'Key runbook' : 'Incident checklist', x + 32, y + 50, 34, C.ink, {
    weight: 600,
    max: w - 47,
  });
}
export function opening(c, k) {
  heading(c, 'Which passage can enter this prompt?');
  const joined = at(k, 2, 'The directory now lists');
  const who = joined ? dual : PRINCIPAL;
  sub(c, 'Verified reader     Tenant A   /   ' + who.groups.join(' + '));
  booklet(c, 'key', 88, 315, 0.94, 'Readers   /   security');
  booklet(c, 'checklist', 1352, 315, 0.71, 'Readers   /   all staff in A');
  section(c, 'Closest match', 91, 265, 470);
  section(c, 'Tenant-wide source', 1354, 265, 470);
  // Two open tracks feed the mouth of the prompt. Only a permitted copy travels.
  const arrivals = [
    { id: 'checklist', p: cue(k, 1, 'Only the checklist', 0.85), start: 1415, y: 558 },
    { id: 'key', p: cue(k, 3, 'Now the runbook can enter too', 0.85), start: 145, y: 449 },
  ];
  sheet(c, 716, 338, 488, 395, '#e2d6bc');
  // Each side has a reading slot in the pocket. The paper enters on its own track.
  for (const [edge, cy] of [
    [716, 489],
    [1204, 596],
  ]) {
    rect(c, edge - 6, cy - 46, 12, 93, '#81745f', null, 5);
    line(c, edge - 25, cy, edge + 24, cy, '#d2c3a7', 3);
  }
  text(c, 'Model prompt', 960, 408, 49, C.ink, { face: 'Serif', align: 'center' });
  for (const { id, p, start, y } of arrivals) {
    const permitted = secureEligibility(
      corpus.find((r) => r.id === id),
      who,
    );
    line(c, 766, y + 78, 1154, y + 78, '#9e947e', 2);
    if (p && permitted) slip(c, id, lerp(start, 782, p), y);
  }
  if (at(k, 1, 'Only the checklist') && !joined) seal(c, 'Read held', 104, 655, C.red);
  if (joined && !at(k, 3, 'Now the runbook can enter too'))
    seal(c, 'New membership', 103, 655, C.blue);
  result(
    c,
    k.beat.beatIndex === 0
      ? 'Reader’s question     “How do I rotate the signing key?”'
      : joined
        ? arrivals[1].p >= 1
          ? 'Two permitted passages in the prompt'
          : 'The directory now includes security. Check the runbook again.'
        : arrivals[0].p >= 1
          ? 'One permitted passage in the prompt'
          : 'Checking the passage for this reader',
  );
}

function tag(c, manifest, x, y, w) {
  sheet(c, x, y, w, 78);
  text(
    c,
    manifest.map((r) => short[r.id] + ' v' + r.revision).join('  ·  '),
    x + w / 2,
    y + 48,
    30,
    C.ink,
    { align: 'center', weight: 600, max: w - 20 },
  );
}
function loomState(joined, revoked) {
  const reader = joined ? dual : PRINCIPAL;
  const live = corpus.map((r) => (revoked && r.id === 'key' ? { ...r, grant: null } : r));
  return {
    reader,
    live,
    opsPass: reportAdmission(ops, live, reader),
    mixedPass: reportAdmission(refs, live, reader),
  };
}
function bobbin(c, x, y, color, active) {
  if (!active) {
    c.save();
    c.setLineDash([6, 8]);
    rect(c, x, y + 9, 102, 47, null, '#a59685', 20);
    c.restore();
    return;
  }
  rect(c, x + 6, y + 2, 90, 56, '#be9a6b', null, 8);
  rect(c, x + 14, y + 6, 74, 48, color, null, 6);
  for (let i = 16; i < 87; i += 5) line(c, x + i, y + 9, x + i - 4, y + 51, '#ffffff46', 2);
}
export function loom(c, k) {
  const joined = at(k, 2, 'Add a verified security membership'),
    revoked = at(k, 2, 'The owner withdraws');
  const fresh = cue(k, 5, 'Weave a fresh report', 1.1),
    s = loomState(joined, revoked);
  heading(
    c,
    k.beat.beatIndex === 6
      ? 'May this relationship enter the graph?'
      : 'Which report may enter the model?',
  );
  sub(c, 'Verified reader     Tenant A   /   ' + s.reader.groups.join(' + '));
  const xs = [675, 1275],
    w = 500;
  if (k.beat.beatIndex === 6) {
    section(c, 'Graph evidence', 94, 271, 1650);
    for (const [x, name] of [
      [120, 'Security desk'],
      [1310, 'Rotation reviews'],
    ]) {
      sheet(c, x, 395, 480, 169);
      text(c, name, x + 26, 465, 44, C.ink, { face: 'Serif' });
      text(c, 'Readable name', x + 28, 526, 32, C.green);
    }
    line(c, 601, 476, 1307, 476, C.red, 7);
    rect(c, 696, 430, 515, 92, C.paper, C.red, 7);
    text(c, 'Relationship from key v7', 950, 488, 35, C.red, { align: 'center', weight: 600 });
    seal(c, 'Hold edge', 837, 607, C.red);
    result(c, 'Both names are readable. The restricted source established their relationship.');
    return;
  }
  section(c, 'Source spool  /  current read', 94, 271, 497);
  section(c, fresh ? 'Fresh two-source report' : 'Operations report', xs[0], 271, w);
  section(c, 'Mixed report', xs[1], 271, w);
  const trace = cue(k, 0, 'Trace the red stripe', 1.25);
  for (let i = 0; i < 3; i++) {
    const r = s.live[i],
      yy = 351 + i * 140,
      ok = secureEligibility(r, s.reader);
    if (i === 2) {
      c.beginPath();
      c.moveTo(511, yy + 48);
      c.bezierCurveTo(578, yy + 48, 599, 685, 653, 685);
      c.lineTo(1190, 685);
      c.bezierCurveTo(1248, 685, 1241, 600, 1278, 600);
      c.strokeStyle = dyes.key;
      c.lineWidth = 6;
      c.stroke();
    } else {
      thread(c, 504, yy + 48, xs[0] + 28, 365 + i * 82, dyes[r.id], 0);
    }
    sheet(c, 90, yy - 8, 438, 105);
    bobbin(c, 418, yy + 14, dyes[r.id], r.grant !== null);
    text(c, short[r.id] + ' v' + r.revision, 115, yy + 35, 35, C.ink, { weight: 600 });
    text(
      c,
      ok ? 'Can read' : revoked && r.id === 'key' ? 'Grant withdrawn' : 'Requires security',
      115,
      yy + 77,
      30,
      passColor(ok),
    );
  }
  for (const [i, list] of [ops, refs].entries()) {
    const x = xs[i];
    cloth(c, list, x, 333, w, 325);
    if (i === 1 && trace) {
      // A single red pick can be followed from the bobbin across the entire swatch.
      line(c, x, 600, x + w * trace, 600, '#a53940', 7);
    }
    tag(c, list, x + 10, 501, w - 20);
    const hasInitial = at(k, 1, 'Only the operations report');
    const lifted = at(k, 2, 'Both reports can now enter');
    const decided = revoked
      ? at(k, 3, 'Only the operations report can enter')
      : joined
        ? lifted
        : hasInitial;
    const pass = i ? s.mixedPass : s.opsPass;
    const weaving = i === 0 && fresh > 0 && !at(k, 5, 'Admit the new report');
    if (weaving) {
      rect(c, x, 333, w * (1 - fresh), 325, '#efe5d5');
      seal(c, 'Checking new manifest', x + 13, 703, C.blue);
    } else if (decided)
      seal(c, pass ? 'Enter map' : 'Hold whole report', x + 13, 703, passColor(pass));
    else seal(c, 'Awaiting read check', x + 13, 703, C.muted);
  }
  result(
    c,
    fresh
      ? 'The new weave contains the two readable sources. The mixed cloth keeps its red stripe.'
      : revoked
        ? 'Key v7 remains woven into the saved text.'
        : 'The sewn label records every source version used to make this copy.',
  );
}

function draftInputs(c, manifest, live, reader, cited, x, y, w, show) {
  manifest.forEach((r, i) => {
    const check = reportAdmission([r], live, reader);
    const yy = y + i * 89;
    rect(c, x, yy, w, 72, '#f3ecda', null, 5);
    rect(c, x, yy, 11, 72, dyes[r.id]);
    text(c, short[r.id] + ' v' + r.revision, x + 27, yy + 44, 31, C.ink, { weight: 600 });
    text(c, r.id === cited ? 'cited' : 'uncited', x + w * 0.46, yy + 44, 28, C.muted);
    if (show)
      text(c, check ? 'pass' : 'held', x + w - 20, yy + 44, 29, passColor(check), {
        align: 'right',
        weight: 600,
      });
  });
}
export function buffered(c, k) {
  const gone = at(k, 1, 'Revoke the key grant');
  const live = corpus.map((r) => (gone && r.id === 'key' ? { ...r, grant: null } : r));
  const manifest = [refs[1], refs[2]],
    allowed = live.filter((r) => secureEligibility(r, dual)).map((r) => r.id);
  const decision = localOutputCheck(
    'Review queue [source:FAQ]',
    manifest.map((r) => r.id),
    allowed,
  );
  heading(c, 'What went into the buffered answer?');
  sub(c, 'Reader in tenant A   /   operations + security');
  for (let i = 0; i < 2; i++) {
    const r = manifest[i],
      y = 350 + i * 220;
    source(
      c,
      r.id,
      'Version ' +
        r.revision +
        '   /   ' +
        (r.id === 'key' && gone ? 'grant withdrawn' : 'read granted'),
      108,
      y,
      496,
    );
    thread(c, 604, y + 53, 978, 435 + i * 89, dyes[r.id], cue(k, 0, 'Follow both sources', 1.4));
  }
  sheet(c, 962, 282, 804, 450);
  text(c, 'Buffered draft', 1006, 358, 55, C.ink, { face: 'Serif' });
  draftInputs(c, manifest, live, dual, 'FAQ', 1006, 398, 715, gone);
  if (gone)
    seal(
      c,
      decision.allow ? 'May continue' : 'Discard whole draft',
      1006,
      630,
      passColor(decision.allow),
    );
  result(
    c,
    k.beat.beatIndex === 2
      ? 'Buffer through the final check. A streamed token cannot be recalled.'
      : gone
        ? 'The uncited key source still affects the send decision.'
        : 'The context manifest follows both sources into generation.',
  );
}

function endingState(checkChanged, faqGone) {
  const live = corpus.map((r) =>
    r.id === 'checklist' && checkChanged
      ? { ...r, revision: 2 }
      : r.id === 'FAQ' && faqGone
        ? { ...r, grant: null, department: null }
        : r,
  );
  const allowed = live.filter((r) => secureEligibility(r, dual)).map((r) => r.id);
  const draft = localOutputCheck(
    finalCase.proposed,
    finalCase.oldDraft.map((r) => r.id),
    allowed,
  );
  return { live, report: reportAdmission(finalCase.oldReport, live, dual), draft: draft.allow };
}
export function closing(c, k) {
  const cc = at(k, 1, 'The checklist moves'),
    fg = at(k, 1, 'The FAQ loses');
  const s = endingState(cc, fg);
  const rebuilt = at(k, 4, 'Copy checklist version two');
  const regenerated = at(k, 4, 'Use those same two sources');
  const quotes = at(k, 5, 'The example runbook says');
  if (quotes) {
    const repaired = at(k, 6, 'Change that one word'),
      sent = at(k, 6, 'Send this reply');
    const word = repaired ? finalCase.draft : finalCase.proposed;
    heading(c, 'Would you send this sentence?');
    sub(c, 'Exact quotation   /   Key runbook v7   /   requesting reader');
    for (const [i, [label, sentence]] of [
      ['Source passage', finalCase.excerpt.sentence],
      ['Buffered reply', word.split(' [source:')[0]],
    ].entries()) {
      const y = 270 + i * 253;
      section(c, label, 129, y, 1625);
      const verb = sentence.split(' ')[3];
      text(c, 'The security desk', 130, y + 121, 61, C.ink, { face: 'Serif' });
      rect(
        c,
        647,
        y + 46,
        310,
        105,
        i === 0
          ? '#e7ddc6'
          : repaired
            ? '#d5e7db'
            : at(k, 6, 'Hold this draft')
              ? '#f0d9c9'
              : '#e7ddc6',
        null,
        9,
      );
      text(
        c,
        verb,
        802,
        y + 120,
        63,
        i === 0 ? C.ink : repaired ? C.green : at(k, 6, 'Hold this draft') ? C.red : C.ink,
        { face: 'Serif', align: 'center' },
      );
      text(c, 'rotation requests.', 1007, y + 121, 61, C.ink, { face: 'Serif' });
    }
    text(c, 'Citation    [source:key]   /   A / key v7', 131, 766, 32, C.blue, { weight: 600 });
    result(
      c,
      sent && finalCase.release
        ? 'Send the corrected reply to this reader.'
        : at(k, 6, 'Hold this draft')
          ? repaired
            ? 'Exact quotation matches.'
            : 'Hold the reply. Approval and review promise different things.'
          : 'Context, privacy, clearance and citation membership pass.',
    );
    return;
  }
  const report = rebuilt ? finalCase.replacement : finalCase.oldReport;
  const draft = regenerated ? finalCase.replacement : finalCase.oldDraft;
  heading(c, 'Which copy can leave?');
  sub(c, 'Live policy for tenant A   /   operations + security');
  section(c, 'Current sources', 91, 265, 428);
  section(c, rebuilt ? 'Rebuilt report' : 'Saved report', 656, 265, 490);
  section(c, regenerated ? 'Regenerated draft' : 'Buffered draft', 1260, 265, 566);
  const faqTrace = cue(k, 0, 'Trace the gold FAQ thread', 1.3);
  const ys = [350, 493, 636];
  for (let i = 0; i < 3; i++) {
    const r = s.live[i];
    for (const [col, list] of [
      [0, report],
      [1, draft],
    ]) {
      const index = list.findIndex((ref) => ref.id === r.id);
      if (index < 0) continue;
      const ty = 410 + index * 90;
      // Pass below the report so the second leg of the FAQ trace remains visible.
      if (col === 1) {
        curveUnder(c, 519, ys[i] + 52, 1260, ty, dyes[r.id], i);
      } else thread(c, 519, ys[i] + 52, 656, ty, dyes[r.id], r.id === 'FAQ' ? faqTrace : 0);
    }
  }
  for (let i = 0; i < 3; i++) {
    const r = s.live[i];
    source(
      c,
      r.id,
      'v' +
        r.revision +
        '   /   ' +
        (secureEligibility(r, dual) ? 'read granted' : 'grant withdrawn'),
      91,
      ys[i],
      428,
    );
  }
  const judged = at(k, 2, 'Hold both copies'),
    newOK = at(k, 4, 'Admit the new report');
  for (const [i, list] of [report, draft].entries()) {
    const x = i ? 1260 : 656,
      w = i ? 566 : 490;
    sheet(c, x, 325, w, 335);
    text(c, i ? 'Generation inputs' : 'Source manifest', x + 24, 373, 38, C.ink, { face: 'Serif' });
    if (i) draftInputs(c, list, s.live, dual, 'key', x + 15, 386, w - 30, judged);
    else
      list.forEach((r, j) => {
        const ok = reportAdmission([r], s.live, dual);
        rect(c, x + 19, 390 + j * 89, 10, 62, dyes[r.id]);
        text(c, short[r.id] + ' v' + r.revision, x + 45, 433 + j * 89, 34, C.ink, { weight: 600 });
        if (judged && (!rebuilt || newOK))
          text(
            c,
            ok ? 'pass' : r.id === 'FAQ' ? 'grant lost' : 'stale',
            x + w - 25,
            433 + j * 89,
            30,
            passColor(ok),
            { align: 'right' },
          );
      });
    if (i ? regenerated : rebuilt)
      seal(
        c,
        newOK ? (i ? 'Await support check' : 'Admit report') : 'Checking new sources',
        x + 23,
        588,
        newOK && !i ? C.green : C.blue,
      );
    else if (judged) {
      const ok = i ? s.draft : s.report;
      seal(
        c,
        ok ? 'Sources pass' : i ? 'Discard whole draft' : 'Hold report',
        x + 23,
        588,
        passColor(ok),
      );
    } else seal(c, cc ? 'Recheck pending' : 'Saved copy', x + 23, 588, C.muted);
  }
  result(
    c,
    rebuilt
      ? 'Rebuild from checklist v2 and key v7. Verify the new reply before sending.'
      : judged
        ? 'The key citation passes. The uncited FAQ still holds the entire draft.'
        : at(k, 1, 'The task token')
          ? 'Task token and policy snapshot pass. Check the evidence inside each copy.'
          : 'One FAQ contribution reaches both saved copies.',
  );
}
function curveUnder(c, x, y, u, v, color, i) {
  c.beginPath();
  c.moveTo(x, y);
  const low = 714 + i * 24;
  c.bezierCurveTo(x + 76, y, x + 65, low, x + 130, low);
  c.lineTo(u - 100, low);
  c.bezierCurveTo(u - 27, low, u - 78, v, u, v);
  c.lineWidth = 5;
  c.strokeStyle = color;
  c.stroke();
}

export function checkCopies() {
  assert.deepEqual(
    [PRINCIPAL, dual].map((p) =>
      corpus
        .slice(0, 3)
        .filter((r) => secureEligibility(r, p))
        .map((r) => r.id),
    ),
    [
      ['checklist', 'FAQ'],
      ['checklist', 'FAQ', 'key'],
    ],
  );
  const phases = [
    [false, false],
    [true, false],
    [true, true],
  ].map((args) => loomState(...args));
  assert.deepEqual(
    phases.map((s) => [s.opsPass, s.mixedPass]),
    [
      [true, false],
      [true, true],
      [true, false],
    ],
  );
  assert.equal(phases[2].live[2].revision, 7);
  assert.deepEqual(
    [endingState(false, false), endingState(true, false), endingState(true, true)].map((s) => [
      s.report,
      s.draft,
    ]),
    [
      [true, true],
      [false, true],
      [false, false],
    ],
  );
  assert.equal(finalCase.oldOutput.reason, 'revoked context');
  assert.deepEqual(
    finalCase.replacement.map((r) => [r.id, r.revision]),
    [
      ['checklist', 2],
      ['key', 7],
    ],
  );
  assert(
    finalCase.replacementAllowed &&
      finalCase.proposedOutput.allow &&
      !finalCase.proposedQuoteMatches &&
      finalCase.release,
  );
}
