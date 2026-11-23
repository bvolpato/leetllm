import {
  assertEqual,
  beside,
  boxOf,
  column,
  dot,
  dynamic,
  group,
  indicate,
  place,
  rect,
  row,
  to,
} from 'vizmatic/stage';
import { chip, label, mono, note, tint } from '../../kit-narrated.mjs';
import { cleanedRows, draftRows, testRows } from '../../../films/active-labeling/fixtures.mjs';
import { auditRelease } from '../../../films/active-labeling/model.mjs';
import { admissionGate, footer, open, picture } from '../parts.mjs';
export default function datasetRelease(s, c) {
  open(s, c);
  const draft = auditRelease(draftRows),
    pending = auditRelease(cleanedRows, false),
    clean = auditRelease(cleanedRows);
  assertEqual(
    draftRows.length - cleanedRows.length,
    2,
    'reserved source and derivative are removed',
  );
  assertEqual(draft.open, false, 'overlap blocks the draft');
  assertEqual(pending.open, false, 'pending audit stays closed');
  assertEqual(clean.open, true, 'completed clean fixture opens');
  assertEqual(clean.digest === draft.digest, false, 'row removal changes the digest');
  const [manifestArea, body] = picture.rows([1, 7], 'normal');
  const [rowsArea, checksArea, gateArea] = body.columns([4, 3, 3], 'wide');
  const manifest = place(
    note(
      [
        draft.manifest.sourceWindow,
        draft.manifest.selector,
        draft.manifest.redactor,
        draft.manifest.rubric,
        draft.manifest.evaluation,
      ].join(' · '),
    ),
    manifestArea,
  );
  const [rowHead, rowBody, digestArea] = rowsArea.rows([1, 5, 1], 'normal');
  const rowSlots = rowBody.rows(draftRows.length, 'normal');
  const rowFrames = rowSlots.map((r) =>
    place(rect(r.width - 8, r.height - 8, { stroke: 'dim', width: 3, radius: 12 }), r).zIndex(-1),
  );
  const rows = draftRows.map((r, i) =>
    place(chip(r.id, { color: cleanedRows.includes(r) ? 'cyan' : 'pink' }), rowSlots[i]),
  );
  const reservedId = testRows[0].id;
  const sourceRow = rows[draftRows.findIndex((r) => r.id === reservedId)];
  const copyRow = rows[draftRows.findIndex((r) => r.parents.includes(reservedId))];
  const phase = { manifest: 0, overlap: 1, draftChecks: 2, rebuilt: 3, bound: 4, missing: 5 };
  const state = s.value(phase.manifest);
  const current = () => {
    if (state.value <= phase.draftChecks) return draft;
    return state.value === phase.bound ? clean : pending;
  };
  const countAnchor = place(mono('feedback-v12 · 4 rows', { size: 31 }), rowHead);
  const count = dynamic(() =>
    mono(current().manifest.dataset + ' · ' + current().manifest.rowCount + ' rows', {
      size: 31,
      color: 'cyan',
    }).moveTo(boxOf(countAnchor).point('center')),
  );
  const digestAnchor = place(
    row(
      [
        note('SHA-256 prefix'),
        mono(draft.digest.slice(0, 12) + '…', { size: 31, color: 'yellow' }),
      ],
      { gap: 'normal' },
    ),
    digestArea,
  );
  const digest = dynamic(() => {
    const block = place(
      row(
        [
          note('SHA-256 prefix'),
          mono(current().digest.slice(0, 12) + '…', { size: 31, color: 'yellow' }),
        ],
        { gap: 'normal' },
      ),
      boxOf(digestAnchor),
    );
    return group(...block.nodes);
  });
  const names = Object.keys(draft.checks);
  const checkNames = {
    safeTargets: 'safe targets',
    snapshot: 'snapshot binding',
    leakage: 'overlap audit',
  };
  const checkSlots = checksArea.rows(names.length, 'normal');
  function checkLabel(name) {
    const title = checkNames[name] ?? name;
    if (state.value === phase.manifest || (state.value === phase.overlap && name !== 'leakage'))
      return note(title);
    const audit = current();
    if (!audit.completed && (name === 'leakage' || name === 'snapshot')) {
      if (state.value === phase.missing)
        return note(title + (name === 'leakage' ? ': missing' : ': unbound'), { color: 'red' });
      return note(title + ': pending', { color: 'yellow' });
    }
    const passed = audit.checks[name];
    return note(title + (passed ? ': PASS' : ': FAIL'), { color: passed ? 'green' : 'red' });
  }
  const checks = dynamic(() =>
    group(...names.map((name, i) => place(checkLabel(name), checkSlots[i]))),
  );
  const gate = admissionGate(gateArea);
  const failedDraft = beside(note('Draft failed', { color: 'red' }), gate.title, 'under', 'tight');
  const token = dot(15, 'cyan').moveTo(gate.waiting.point('center'));
  const nextToken = dot(15, 'cyan').moveTo(gate.waiting.point('center'));
  const target = gate.admitted.point('center');
  const opened = place(label('Open', { color: 'yellow' }), gate.foot);
  const premise = place(note('Audit inputs  ·  completion flag and row digest from the report'), footer);
  const metadata = place(
    note('Check the report issuer, completion flag and row digest for this batch.'),
    footer,
  );
  const missing = place(
    note('New release check  ·  audit missing  ·  waiting', { color: 'red' }),
    footer,
  );
  const priorRelease = place(
    column([note('Earlier run', { color: 'green' }), note('admitted', { color: 'green' })], {
      gap: 'tight',
    }),
    gate.admitted,
  );
  const afterTraining = place(
    note('Exposed checkpoint  ·  retrain cleanly or use a fresh test.', {
      color: 'red',
    }),
    footer,
  );
  s.add(manifest, rowFrames, rows, count, checks, gate.nodes, token, premise);
  c.on('release-manifest', () => s.play(indicate(manifest, { color: 'yellow', scale: 1 })));
  c.show('exact-dataset', digest);
  c.after('draft-fails', () => s.add(failedDraft));
  c.on('reserved-overlap', () => s.play(tint(sourceRow, 'yellow')));
  c.on('derived-copy', () => s.play(tint(copyRow, 'yellow')));
  c.after('reserved-overlap', () => {
    state.set(phase.overlap);
    s.play(tint(sourceRow, 'red'), tint(copyRow, 'red'), { duration: 0 });
  });
  c.after('clean-agreement-score', () => state.set(phase.draftChecks));
  c.after('remove-related', () => {
    s.remove(sourceRow, copyRow, failedDraft);
    state.set(phase.rebuilt);
  });
  c.on('audit-gate', () => s.play(indicate(gate.status, { color: 'red', scale: 1 })));
  c.after('complete-audit', () => state.set(phase.bound));
  c.after('release-open', () => {
    s.play(
      to(gate.latch, (n) => n.opacity(0), { duration: 0.35 }),
      to(token, (n) => n.moveTo(target), { duration: 1.2 }),
    );
  });
  c.swap('release-open', gate.status, opened, { after: true });
  c.swap('manifest-evidence', premise, metadata);
  c.after('closed-gate', () => {
    state.set(phase.missing);
    s.remove(opened, token, metadata);
    gate.latch.opacity(1);
    s.add(gate.status, nextToken, priorRelease, missing);
  });
  c.swap('post-training', missing, afterTraining);
}
