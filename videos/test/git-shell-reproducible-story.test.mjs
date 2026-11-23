import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as model from '../animations/git-shell-linux-reproducible-ai.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();
const cue = (p) => ({
  phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
  progress: p,
  strength: 0,
  targets: [],
});
const paint = (id, beat, cues = {}, beatP = 0.5) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'The reproducible evaluation' },
    { beat, beatP, t: 10, duration: 30, opacity: 1, cues },
    model.draw,
  );

test('working edits do not rewrite selected or recorded JSONL contents', () => {
  const staged = model.snapshotFrame({ beat: 0, cues: { 'stage-row': cue(1) } });
  assert.deepEqual(staged.index, model.rows[1]);
  assert.equal(staged.history, null);
  const edited = model.snapshotFrame({ beat: 1, cues: { 'edit-row': cue(1) } });
  assert.equal(edited.working.prediction, 'blocked');
  assert.equal(edited.index.prediction, 'escalated');
  const recorded = model.snapshotFrame({ beat: 2, cues: { 'commit-row': cue(1) } });
  assert.deepEqual(recorded.history, model.rows[1]);
  assert.equal(recorded.working.prediction, 'blocked');
});

test('the native snapshot comparison paints the actual staged miss beside the unstaged repair', () => {
  const current = paint('git-states', 1, { 'stage-row': cue(1), 'edit-row': cue(1) }, 0.9);
  const predictions = current.labels
    .filter((l) => l.y < 735 && l.text.includes('"prediction":'))
    .map((l) => ({
      text: l.text.trim(),
      side: l.x < 700 ? 'working' : l.x < 1250 ? 'index' : 'history',
    }));
  assert.deepEqual(predictions, [
    { text: '"prediction": "blocked"', side: 'working' },
    { text: '"prediction": "escalated"', side: 'index' },
  ]);
  assert.deepEqual([...current.issues, ...layoutIssues(current)], []);
  const committed = paint('git-states', 2, { 'commit-row': cue(1) }, 0.95);
  assert(committed.labels.some((l) => l.x > 1250 && l.text.trim() === '"prediction": "escalated"'));
});

test('row comparisons count only completed evidence and the fourth miss changes the exact integer gate', () => {
  const states = [0, 1, 2, 3].map((n) =>
    model.scoreFrame({
      beat: 0,
      cues: Object.fromEntries(
        ['compare-first', 'compare-second', 'compare-third'].map((id, i) => [
          id,
          cue(i < n ? 1 : 0),
        ]),
      ),
    }),
  );
  assert.deepEqual(
    states.map((s) => [s.result.correct, s.result.total]),
    [
      [0, 0],
      [1, 1],
      [1, 2],
      [2, 3],
    ],
  );
  const prediction = model.scoreFrame({ beat: 1, beatP: 1 });
  assert.equal(prediction.result.total, 3);
  assert.equal(prediction.fourth, 0);
  const failed = model.scoreFrame({
    beat: 2,
    cues: { 'append-wrong': cue(1), 'failed-gate': cue(1) },
  });
  assert.equal(failed.result.correct * 3, 6);
  assert.equal(failed.result.total * 2, 8);
  assert(!failed.result.passes);
  assert(model.score(model.rows).passes);
  assert(model.score(model.rows.map((row) => ({ ...row, prediction: row.expected }))).passes);
});

test('a green working-tree hook can accompany a failing selected and committed snapshot', () => {
  const s = model.commitBoundaryFrame({ beat: 1, cues: { 'committed-check': cue(1) } });
  assert(s.working.passes);
  assert.equal(s.working.total, 3);
  assert.equal(s.index.total, 4);
  assert(!s.index.passes);
  assert(!s.committed.passes);
  assert.deepEqual(s.indexRows, s.committedRows);
  assert.notDeepEqual(s.workingRows, s.committedRows);
});

test('bisect receipts come from the same fixture scorer and isolate the actual added wrong row', () => {
  const trace = model.bisectTrace();
  assert.deepEqual(
    trace.checks.map((c) => [c.mid, c.result.correct, c.result.total, c.good]),
    [
      [3, 2, 3, true],
      [5, 2, 4, false],
      [4, 2, 3, true],
    ],
  );
  assert.equal(trace.firstBad, 5);
  assert.deepEqual(model.commitFixtures[5].slice(0, 3), model.commitFixtures[4]);
  assert.deepEqual(model.commitFixtures[5].at(-1), model.wrongRow);
});

test('empty search and missing input retain different streams and pipeline status rules', () => {
  const zero = model.searchResult(),
    missing = model.searchResult({ exists: false });
  assert.deepEqual([zero.stdout, zero.stderr, zero.status], ['0', '', 1]);
  assert.equal(missing.stdout, '');
  assert.equal(missing.status, 2);
  assert(missing.stderr.includes('eval/missing.jsonl'));
  assert.deepEqual(model.pipelineResult(false).downstream, { stdout: '0', status: 0 });
  assert.equal(model.pipelineResult(false).status, 0);
  assert.equal(model.pipelineResult(true).status, 2);
});

test('TERM request, log flush and collected exit are distinct states and reused PID cannot authorize escalation', () => {
  const partial = model.shutdownFrame({
    beat: 1,
    cues: { 'send-term': cue(1), 'flush-log': cue(0.5), 'collect-exit': cue(0) },
  });
  assert(partial.alive);
  assert.equal(partial.waitStatus, null);
  assert(!partial.log.includes('flushed'));
  const done = model.shutdownFrame({
    beat: 1,
    cues: { 'send-term': cue(1), 'flush-log': cue(1), 'collect-exit': cue(1) },
  });
  assert(!done.alive);
  assert.equal(done.waitStatus, 0);
  assert(done.log.includes('flushed'));
  assert.equal(model.job.pid, model.replacement.pid);
  assert(!model.sameProcess(model.job, model.replacement));
  const rechecked = model.shutdownFrame({ beat: 2, cues: { 'identity-recheck': cue(1) } });
  assert.equal(rechecked.escalationAuthorized, false);
});

test('the native fourth-row prediction and final clone hold their receipts until their construction cues finish', () => {
  const prediction = paint('score', 1, { 'integer-gate': cue(1) }, 0.95);
  assert(
    !prediction.labels.some(
      (l) => l.text.includes('104') || l.text.includes('6 < 8') || l.text.includes('Gate failed'),
    ),
  );
  for (const p of [0, 0.5, 0.98])
    assert.equal(model.cloneFrame({ beat: 1, cues: { 'final-receipt': cue(p) } }).result, null);
  const held = model.cloneFrame({ beat: 1, cues: { 'final-receipt': cue(1) } });
  assert.equal(held.result.correct, 2);
  assert.equal(held.result.total, 3);
  assert(held.clean);
});

test('a changed search path invalidates the previous zero-match receipt while the new read is pending', () => {
  const frame = paint('shell-inspection', 1, { 'grep-empty': cue(1), 'grep-missing': cue(0.5) });
  const labels = frame.labels.map((l) => l.text);
  assert(labels.some((t) => t.includes('eval/missing.jsonl')));
  assert(!labels.includes('stdout: 0'));
  assert(!labels.includes('exit status: 1'));
});

test('a new pipefail run holds its pipeline receipt pending instead of reusing the default success', () => {
  const frame = paint('pipeline', 1, { 'pipefail-result': cue(0.5) });
  const labels = frame.labels.map((l) => l.text);
  assert(labels.includes('$ set -o pipefail'));
  assert(!labels.some((t) => t.startsWith('Pipeline status: 0')));
});

test('the process remains running before TERM is requested and the collected receipt stays hidden', () => {
  const frame = paint('shutdown', 1, {
    'send-term': cue(0),
    'flush-log': cue(0),
    'collect-exit': cue(0),
  });
  const labels = frame.labels.map((l) => l.text);
  assert(!labels.includes('evaluation process still shutting down'));
  assert(!labels.includes('evaluation process exited'));
  assert(!labels.some((t) => t.includes('wait "$job_pid" → exit 0')));
});

test('a partially compared fourth row invalidates the previous three-row pass receipt', () => {
  const frame = paint('score', 2, { 'append-wrong': cue(0.5), 'failed-gate': cue(0) });
  const labels = frame.labels.map((l) => l.text);
  assert(!labels.some((t) => t.includes('exit 0')));
  assert(labels.some((t) => t.includes('pending')));
});

test('the removal diff waits for the working-tree removal it describes', () => {
  for (const p of [0, 0.5]) {
    const frame = paint('commit-boundary', 0, { 'unstaged-repair': cue(p), 'local-pass': cue(0) });
    assert(!frame.labels.some((l) => l.text.startsWith('- {') && l.text.includes('104')));
  }
  const held = paint('commit-boundary', 0, { 'unstaged-repair': cue(1) });
  assert(held.labels.some((l) => l.text.startsWith('- {') && l.text.includes('104')));
});

test('a final-newline deletion changes byte and newline counts without losing the last validated record', () => {
  const before = model.jsonl(model.rows),
    changed = before.slice(0, -1);
  assert.equal(new TextEncoder().encode(before).at(-1), 10);
  assert.equal(
    new TextEncoder().encode(before).length - new TextEncoder().encode(changed).length,
    1,
  );
  assert.deepEqual([model.newlineCount(before), model.newlineCount(changed)], [3, 2]);
  assert.deepEqual(model.recordContract(changed).result, model.recordContract(before).result);
  for (const input of [
    '[]\n',
    '{"prompt":"x"}\n',
    '{"prompt":',
    '',
    '{"prompt":" ","expected":"a","prediction":"a"}',
  ])
    assert.equal(model.recordContract(input).valid, false);
  assert.equal(
    model.recordContract('{"prompt":"x","expected":"blocked","prediction":"  BLOCKED  "}').result
      .correct,
    1,
  );
});

test('the byte scan and all three count verdicts are independently gated after the changed input', () => {
  const cues = {
    'remove-final-newline': cue(1),
    'byte-verdict': cue(0),
    'newline-count-reveal': cue(0),
    'record-count-reveal': cue(0),
    'match-count-reveal': cue(0),
  };
  const pending = model.inputContractFrame({ beat: 2, cues });
  assert.equal(pending.scan, 1);
  assert.equal(pending.verdict, false);
  assert.deepEqual([pending.newlines, pending.records, pending.matches], [null, null, null]);
  const first = model.inputContractFrame({
    beat: 2,
    cues: { ...cues, 'newline-count-reveal': cue(1) },
  });
  assert.deepEqual([first.newlines, first.records, first.matches], [2, null, null]);
  const frame = paint('input-contract', 2, cues);
  assert(frame.labels.some((l) => l.text.includes('Verdict held')));
  assert(!frame.labels.some((l) => l.text.includes('Bytes differ') || l.text === 'Matches: 2'));
});

test('rightmost nonzero pipeline status and supplied GPU order survive changed inputs', () => {
  assert.equal(model.pipelineStatus([3, 0, 5, 0], true), 5);
  assert.equal(model.pipelineStatus([3, 0, 5, 0], false), 0);
  assert.equal(model.pipelineStatus([0, 0], true), 0);
  assert.deepEqual(model.deviceEnumeration([0, 1, 2, 3], '3,1'), [
    { logical: 0, physical: 3 },
    { logical: 1, physical: 1 },
  ]);
  assert.deepEqual(model.deviceEnumeration([0, 1, 2], ''), []);
  assert.deepEqual(
    model.deviceEnumeration([0, 1, 2], null).map((v) => v.physical),
    [0, 1, 2],
  );
  assert.throws(() => model.deviceEnumeration([0, 1, 2], '2,2'));
});

test('the new seven-row working pass cannot replace the eight-row selected input or reveal the clone decision', () => {
  const cues = {
    'fresh-append-eight': cue(1),
    'fresh-stage-eight': cue(1),
    'fresh-working-repair': cue(1),
    'fresh-working-pass': cue(1),
    'fresh-clone-input': cue(1),
    'fresh-clone-fails': cue(0),
  };
  const pending = model.freshHandoffFrame({ beat: 1, cues });
  assert.deepEqual(
    [pending.working.length, pending.index.length, pending.cloneRows.length],
    [7, 8, 8],
  );
  assert(pending.localReceipt.passes);
  assert.equal(pending.cloneReceipt, null);
  const frame = paint('fresh-handoff', 1, cues);
  assert(
    !frame.labels.some(
      (l) => l.text.includes('5/8') || l.text.includes('0.625') || l.text.includes('FAIL'),
    ),
  );
  const revealed = model.freshHandoffFrame({
    beat: 1,
    cues: { ...cues, 'fresh-clone-fails': cue(1) },
  });
  assert.equal(revealed.cloneReceipt.fraction, 5 / 8);
  assert(!revealed.cloneReceipt.passes);
  const repaired = model.freshHandoffFrame({
    beat: 2,
    cues: { 'fresh-repair': cue(1), 'fresh-final-receipt': cue(0) },
  });
  assert.equal(repaired.index.length, 7);
  assert.equal(repaired.cloneReceipt, null);
});
