import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { lexicalTokens, timedWordTokens } from '../lib/captions.mjs';
import { sampleNarrationCues } from '../lib/narration-cues.mjs';
import * as model from '../animations/sql-databases-data-modeling-ai.mjs';
registerLessonFonts();
const paint = (id, beat, cues) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Stored evidence' },
    { beat, beatP: 0, opacity: 1, cues },
    model.draw,
  );
const cue = (progress) => ({
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  progress,
  strength: 0,
});
const reference = JSON.parse(
  readFileSync(new URL('./fixtures/sql-databases-reference.json', import.meta.url), 'utf8'),
);

test('restart removes only the memory copy while its narration focus stays on the persistent process area', () => {
  const before = paint('opening', 0, { 'restart-memory': cue(0) }),
    nearEnd = paint('opening', 0, { 'restart-memory': cue(0.98) }),
    after = paint('opening', 0, { 'restart-memory': cue(1) });
  const paragraph = 'Return items within fourteen days.';
  const original = before.labels.filter((row) => row.text === paragraph),
    retained = after.labels.filter((row) => row.text === paragraph);
  assert.equal(
    original.length,
    1,
    'the process paragraph is visible while durable-file contents stay unrevealed',
  );
  assert.equal(
    retained.length,
    1,
    'the committed paragraph survives after process memory disappears',
  );
  assert(retained[0].x > 960, 'the paragraph is revealed in the committed file after restart');
  assert(
    nearEnd.targets.some((target) => target.id === 'process-area'),
    'the active disappearance cue retains a visible semantic target after its paragraph fades',
  );
  assert.deepEqual(
    [
      ...before.issues,
      ...layoutIssues(before),
      ...nearEnd.issues,
      ...layoutIssues(nearEnd),
      ...after.issues,
      ...layoutIssues(after),
    ],
    [],
  );
});

test('narration targets remain visible when request, join and filtered-search cues begin', () => {
  const beginning = { phase: 'during', progress: 0, strength: 0 };
  const validity = paint('validity', 0, { 'move-request-time': beginning });
  const join = paint('join', 0, { 'compare-join-fields': beginning });
  const semantic = paint('semantic', 1, {
    'inspect-filtered-prefix': cue(1),
    'explain-other-store-failure': cue(1),
    'explain-retired-failure': cue(1),
    'explain-reader-failure': cue(1),
    'advance-ranked-search': cue(1),
    'continue-candidate-search': beginning,
  });
  assert(validity.targets.some((target) => target.id === 'request-time'));
  assert(
    validity.targets.find((target) => target.id === 'request-time').alpha >= 0.35,
    'the request marker is readable when its narration cue begins',
  );
  assert(join.targets.some((target) => target.id === 'join-fields'));
  assert(semantic.targets.some((target) => target.id === 'semantic-result'));
  assert(semantic.labels.some((label) => label.text === 'Both requested paragraphs passed'));
  for (const frame of [validity, join, semantic])
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
});

test('grouping and private publication paint the actual retained paragraph identities', () => {
  const grouped = paint('counts', 0, { 'form-source-groups': cue(1), 'count-groups': cue(1) });
  for (const child of model
    .joinedRows()
    .filter((row) => row.source.workspace === 'w01' && model.active(row.source)))
    assert(grouped.labels.some((label) => label.text === child.text));
  assert(grouped.labels.some((label) => label.text === 'Return Policy: 2'));
  assert(grouped.labels.some((label) => label.text === 'Staff Guide: 1'));
  const pending = paint('publication', 2, {
    'finish-publication': cue(1),
    'commit-publication': cue(0),
  });
  assert(pending.labels.some((label) => label.text === 'Writer connection · private transaction'));
  for (const child of model.replacement)
    assert(pending.labels.some((label) => label.text === child.id + ' · grant: Bob'));
  for (const id of ['c7a', 'c7b'])
    assert(pending.labels.some((label) => label.text === id + ' · July edition'));
  const committed = paint('publication', 2, {
    'finish-publication': cue(1),
    'commit-publication': cue(1),
  });
  assert(committed.labels.some((label) => label.text === 'Writer connection · committed edition'));
  assert(
    !committed.labels.some((label) => label.text === 'Writer connection · private transaction'),
  );
  for (const child of model.replacement)
    assert(committed.labels.some((label) => label.text === child.id + ' · new edition'));
  for (const frame of [grouped, pending, committed])
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
});

test('literal search and each request predicate match the executed SQLite corpus', () => {
  assert.deepEqual(model.authorizedMatches(), reference.authorized_initial);
  assert.deepEqual(
    model.authorizedMatches({ enforceWorkspace: false, enforceTime: false }),
    reference.filter_stages.reader,
  );
  assert.deepEqual(
    model.authorizedMatches({ enforceTime: false }),
    reference.filter_stages.reader_workspace,
  );
  assert.deepEqual(
    model.authorizedMatches({ query: "' OR 1=1 --" }),
    reference.suspicious_bound_input,
  );
  assert.deepEqual(
    model.authorizedMatches({ workspace: "w01' OR 1=1 --" }),
    reference.wrong_workspace_bound_input,
  );
  const row = model.joinedRows().find((row) => row.id === 'c7a');
  assert.deepEqual([row.id, row.document, row.source.title, row.text], reference.joined_citation);
  assert.equal(reference.literal_percent.length, 1);
  assert.equal(reference.unescaped_percent.length, 2);
  const staged = model.sampleModel('query', { beat: 0, cues: { 'bind-workspace': cue(0.9) } });
  const stagedFrame = paint('query', 0, { 'bind-workspace': cue(0.9) });
  assert(staged.bind < 1 && staged.bindTravel > 0.95);
  assert.equal(staged.selectedRows.length, 0);
  assert(stagedFrame.labels.some((label) => label.text === '?' && label.x > 900 && label.y > 700));
  assert(stagedFrame.labels.some((label) => label.text === 'value in transit'));
  assert(
    !stagedFrame.labels.some((label) => ['kept', 'excluded'].includes(label.text)),
    'rows stay unclassified while the parameter is in transit',
  );
  assert(
    paint('query', 0, { 'bind-workspace': cue(0.95) }).labels.some(
      (label) => label.text === 'ready to bind',
    ),
  );
  assert.deepEqual([...stagedFrame.issues, ...layoutIssues(stagedFrame)], []);
  const bound = model.sampleModel('query', {
    beat: 0,
    cues: { 'bind-workspace': cue(1), 'filter-bound-rows': cue(0) },
  });
  const boundFrame = paint('query', 0, { 'bind-workspace': cue(1), 'filter-bound-rows': cue(0) });
  assert.equal(bound.bind, 1);
  assert.equal(bound.filterProgress, 0);
  assert.equal(bound.processedCount, 0);
  assert.equal(bound.selectedRows.length, 0);
  assert.equal(bound.rejectedRows.length, 0);
  assert(boundFrame.labels.some((label) => label.text === 'Harbor Store'));
  assert(boundFrame.labels.some((label) => label.text === 'Waiting to test matching rows'));
  assert(
    !boundFrame.labels.some((label) => ['kept', 'excluded'].includes(label.text)),
    'binding completes before row evaluation starts',
  );
  const inTraversal = model.sampleModel('query', {
    beat: 0,
    cues: { 'bind-workspace': cue(1), 'filter-bound-rows': cue(0.4) },
  });
  assert.deepEqual(
    inTraversal.selectedRows.map((row) => row[0]),
    ['d7'],
  );
  assert.deepEqual(inTraversal.rejectedRows, []);
  const traversalFrame = paint('query', 0, {
    'bind-workspace': cue(1),
    'filter-bound-rows': cue(0.4),
  });
  assert(traversalFrame.labels.some((label) => label.text === 'kept'));
  assert(!traversalFrame.labels.some((label) => label.text === 'excluded'));
  const query = model.sampleModel('query', {
    beat: 0,
    cues: { 'bind-workspace': cue(1), 'filter-bound-rows': cue(1) },
  });
  assert.deepEqual(query.selectedRows, reference.workspace_projection);
  assert.deepEqual(
    query.rejectedRows.map((row) => row.id),
    ['d99'],
  );
  assert.equal(query.processedCount, query.values.length);
  const completedFrame = paint('query', 0, {
    'bind-workspace': cue(1),
    'filter-bound-rows': cue(1),
  });
  assert(completedFrame.labels.some((label) => label.text === 'excluded'));
  assert(completedFrame.labels.some((label) => label.text === 'd99 · Birch Store'));
  assert.deepEqual(
    [
      ...boundFrame.issues,
      ...layoutIssues(boundFrame),
      ...traversalFrame.issues,
      ...layoutIssues(traversalFrame),
      ...completedFrame.issues,
      ...layoutIssues(completedFrame),
    ],
    [],
  );
  const literal = paint('query', 1, {
    'bind-input': cue(1),
    'literal-percent': cue(1),
    'literal-underscore': cue(1),
  });
  assert(literal.labels.some((label) => label.text === 'Save 10% on this coat.'));
  assert(literal.labels.some((label) => label.text === '1 matching paragraph'));
  assert(literal.labels.some((label) => label.text === 'document_id'));
  assert.deepEqual([...literal.issues, ...layoutIssues(literal)], []);
});

test('half-open dates, source grouping and index pointers preserve the database results', () => {
  for (const id of ['d7-old', 'd7'])
    assert.equal(
      model.active(
        model.documents.find((d) => d.id === id),
        '2026-07-01T00:00:00Z',
      ),
      reference.july_boundary[id],
    );
  assert.equal(model.active({ ...model.documents[1], from: '2026-09-01T00:00:00Z' }), false);
  assert.deepEqual(
    model.sourceCounts().map((row) => [row.id, row.count]),
    reference.groups_initial.map((row) => row.slice(0, 2)),
  );
  assert.equal(
    model.sourceCounts(false, { includeEmpty: true }).find((row) => row.id === 'd-empty').count,
    reference.left_join_empty[1],
  );
  const index = model.sampleModel('indexes', { beat: 1 });
  assert.deepEqual(
    index.sorted.map((row) => [Number(row.id.slice(1)), row.chunkId, row.principal]),
    reference.sorted_permission_rows,
  );
  assert.deepEqual(
    index.bob.map((row) => row.chunkId),
    reference.bob_index_candidates,
  );
  assert.deepEqual(index.allowed, reference.indexed_authorized_result);
});

test('failed publication retains the old edition and the reader switches only at complete commit', () => {
  const staged = model.sampleModel('publication', {
    beat: 1,
    cues: { 'reject-broken-reference': cue(1), 'rollback-publication': cue(0) },
  });
  assert.equal(staged.writerHasDocument, true);
  assert.equal(staged.oldEnded, Boolean(reference.failed_statement.writer_old_end));
  assert.deepEqual(staged.readerIds, reference.failed_statement.reader_authorized);
  const rolled = model.sampleModel('publication', {
    beat: 1,
    cues: { 'reject-broken-reference': cue(1), 'rollback-publication': cue(1) },
  });
  assert.equal(rolled.writerHasDocument, false);
  assert.equal(rolled.oldEnded, false);
  assert.deepEqual(rolled.readerIds, reference.rolled_back.reader_authorized);
  for (const [finish, commit] of [
    [0.5, 1],
    [1, 0.99],
  ]) {
    const pending = model.sampleModel('publication', {
      beat: 2,
      cues: { 'finish-publication': cue(finish), 'commit-publication': cue(commit) },
    });
    assert.equal(pending.committed, false);
    assert.deepEqual(pending.readerIds, reference.corrected_private.reader_authorized);
  }
  const committed = model.sampleModel('publication', {
    beat: 2,
    cues: { 'finish-publication': cue(1), 'commit-publication': cue(1) },
  });
  assert.deepEqual(committed.readerIds, reference.committed.reader_authorized);
});

test('the complete publication fingerprint recognizes the same retry and rejects changed input without writes', () => {
  const ledger = model.createPublicationLedger(),
    first = model.publishOnce(ledger, 'publish-1');
  assert.equal(first.fingerprint, reference.retry.stored_fingerprint);
  const saved = structuredClone(ledger.data);
  assert.equal(
    model.publishOnce(ledger, 'publish-1', structuredClone(model.publicationInput)).status,
    'reused',
  );
  assert.deepEqual(ledger.data, saved);
  const changed = structuredClone(model.publicationInput);
  changed.chunks[2].text = 'Return clothing with the labels attached.';
  assert.equal(model.payloadFingerprint(changed), reference.retry.changed_fingerprint);
  assert.equal(model.publishOnce(ledger, 'publish-1', changed).status, 'changed input rejected');
  assert.deepEqual(ledger.data, saved);
  for (const change of [
    (p) => (p.workspace = 'w02'),
    (p) => (p.previous = 'other'),
    (p) => (p.document = 'new'),
    (p) => (p.source = 'other'),
    (p) => (p.title = 'Other policy'),
    (p) => (p.effective = '2026-08-13T12:00:00Z'),
    (p) => (p.chunks[0].document = 'missing'),
    (p) => (p.chunks[0].id = 'another'),
    (p) => (p.grants[0][1] = 'Alice'),
  ]) {
    const input = structuredClone(model.publicationInput);
    change(input);
    assert.notEqual(model.payloadFingerprint(input), first.fingerprint);
  }
  const bad = structuredClone(model.publicationInput);
  bad.chunks[0].document = 'missing';
  const pristine = model.createPublicationLedger(),
    old = structuredClone(pristine.data);
  assert.equal(
    model.publishOnce(pristine, 'broken', bad).status,
    'foreign key or identity rejected',
  );
  assert.deepEqual(pristine.data, old);
  assert.equal(pristine.requests.size, 0);
  assert.equal(reference.retry.retry_worker_row_writes, 0);
});

test('fresh and pinned snapshot statements select the actual before and after row populations', () => {
  const first = model.sampleModel('snapshots', {
    beat: 0,
    cues: { 'capture-first-count': cue(1) },
  });
  assert.equal(
    first.readCommitted.count,
    reference.groups_initial.reduce((n, row) => n + row[1], 0),
  );
  assert.equal(first.readCommitted.details, null);
  const fresh = model.sampleModel('snapshots', {
    beat: 1,
    cues: { 'snapshot-commit': cue(1), 'read-new-snapshot': cue(1) },
  });
  assert.equal(fresh.readCommitted.count, 3);
  assert.equal(
    fresh.readCommitted.details.length,
    reference.committed.groups.reduce((n, row) => n + row[1], 0),
  );
  const pinned = model.sampleModel('snapshots', {
    beat: 2,
    cues: { 'retain-read-snapshot': cue(1) },
  });
  assert.deepEqual(pinned.repeatableRead.details, first.before);
  assert.equal(pinned.repeatableRead.details.length, pinned.repeatableRead.count);
});

test('semantic ranking keeps the request conditions and saved paragraph identity through the closing citation', () => {
  assert.equal(model.cosine([3, 4], [0, 1]), 0.8);
  assert.equal(model.cosine([1, 0], [0, 1]), 0);
  const normalized = model.sampleModel('semantic', {
    beat: 0,
    cues: { 'normalize-candidate-vectors': cue(1) },
  });
  const projected = model.sampleModel('semantic', {
    beat: 0,
    cues: {
      'normalize-candidate-vectors': cue(1),
      'project-cosine-score': cue(1),
      'rank-by-cosine': cue(1),
    },
  });
  assert.equal(normalized.geometryIndex, 0);
  assert.equal(normalized.geometryProgress, 1);
  assert.equal(projected.geometryIndex, 0);
  assert.equal(projected.projectionIndex, 0);
  assert.equal(projected.projectionProgress, 1);
  assert.equal(projected.rows[0].chunk, 'c99');
  assert.deepEqual(
    projected.overviewRows.map((row) => row.chunk),
    projected.rows.slice(1).map((row) => row.chunk),
  );
  assert.deepEqual(
    projected.rows.map((row) => Number(row.score.toFixed(3))),
    [0.949, 0.707, 0.447, 0.316, 0, -0.316],
  );
  assert.deepEqual(
    projected.rows.map((row) => Number((row.vector[0] / Math.hypot(...row.vector)).toFixed(3))),
    projected.rows.map((row) => Number(row.score.toFixed(3))),
  );
  const geometry = paint('semantic', 0, {
    'normalize-candidate-vectors': cue(1),
    'project-cosine-score': cue(1),
    'rank-by-cosine': cue(1),
  });
  const rawVector = paint('semantic', 0, { 'normalize-candidate-vectors': cue(0) }),
    shrinkingVector = paint('semantic', 0, { 'normalize-candidate-vectors': cue(0.5) }),
    unitVector = paint('semantic', 0, { 'normalize-candidate-vectors': cue(1) });
  assert(rawVector.labels.some((label) => label.text === 'Raw vector'));
  assert.equal(
    rawVector.connectors.filter((connector) => connector.head).length,
    2,
    'the raw candidate vector is visible beside the query before normalization begins',
  );
  const rawArrow = rawVector.connectors.filter((connector) => connector.kind === 'arrow')[1];
  const shrinkingArrow = shrinkingVector.connectors.filter(
    (connector) => connector.kind === 'arrow',
  )[1];
  const unitArrow = unitVector.connectors.filter((connector) => connector.kind === 'arrow')[1];
  const arrowLength = (arrow) => Math.hypot(arrow.to.x - arrow.from.x, arrow.to.y - arrow.from.y);
  assert(
    Math.abs(arrowLength(rawArrow) - Math.sqrt(10) * 120) < 1,
    'raw (3, 1) uses the same coordinate scale as the 120px unit circle',
  );
  assert(
    arrowLength(shrinkingArrow) < arrowLength(rawArrow),
    'normalization shrinks the same vector toward the unit circle',
  );
  assert(
    Math.abs(arrowLength(unitArrow) + 16 - 120) < 1,
    'the first candidate arrow stops16px before its unit-circle endpoint marker',
  );
  assert(unitVector.labels.some((label) => label.text === 'Unit length · same direction'));
  const projectedFrame = paint('semantic', 0, {
    'normalize-candidate-vectors': cue(1),
    'project-cosine-score': cue(0.5),
    'rank-by-cosine': cue(0),
  });
  const overviewFrame = paint('semantic', 0, {
    'normalize-candidate-vectors': cue(1),
    'project-cosine-score': cue(1),
    'rank-by-cosine': cue(1),
  });
  const completedProjection = paint('semantic', 0, {
    'normalize-candidate-vectors': cue(1),
    'project-cosine-score': cue(1),
    'rank-by-cosine': cue(0),
  });
  const candidateText = 'Return items within seven days.';
  for (const frame of [rawVector, shrinkingVector, unitVector, projectedFrame, overviewFrame])
    assert(
      frame.labels.some((label) => label.text === candidateText),
      'the same paragraph remains selected from raw vector through projection and overview',
    );
  assert(projectedFrame.labels.some((label) => label.text === 'Cosine projection · c99'));
  const queryArrow = completedProjection.connectors.filter(
    (connector) => connector.kind === 'arrow',
  )[0];
  const projectionPointX = 620 + projected.rows[0].score * 120;
  assert.equal(queryArrow.to.x, 740);
  assert(
    !completedProjection.shapes.some(
      (shape) =>
        shape.fillAlpha > 0 &&
        shape.center &&
        Math.abs(shape.center.x - projectionPointX) < 0.01 &&
        Math.abs(shape.center.y - 700) < 0.01,
    ),
    'the cosine projection stays clear of the query arrowhead',
  );
  assert(!unitVector.labels.some((label) => label.text === 'Other candidates · unit length'));
  assert(overviewFrame.labels.some((label) => label.text === 'Other candidates · unit length'));
  for (const id of projected.rows.map((row) => row.chunk))
    assert(
      overviewFrame.labels.some((label) => label.text === id),
      `the ordered rail retains ${id}`,
    );
  for (const text of [
    'Bring the receipt when you return an item.',
    'Returns above $200 need a manager.',
    'Return items within fourteen days.',
  ])
    assert(
      !overviewFrame.labels.some((label) => label.text === text),
      `no rotating candidate card replaces c99 with ${text}`,
    );
  assert.deepEqual(
    [
      ...rawVector.issues,
      ...layoutIssues(rawVector),
      ...shrinkingVector.issues,
      ...layoutIssues(shrinkingVector),
      ...unitVector.issues,
      ...layoutIssues(unitVector),
      ...projectedFrame.issues,
      ...layoutIssues(projectedFrame),
      ...overviewFrame.issues,
      ...layoutIssues(overviewFrame),
    ],
    [],
  );
  for (const id of ['similarity-geometry', 'similarity-projection', 'cosine-ranking'])
    assert(geometry.targets.some((target) => target.id === id));
  assert(geometry.labels.some((label) => label.text === 'score 0.949'));
  assert.deepEqual([...geometry.issues, ...layoutIssues(geometry)], []);
  for (const progress of [0.05, 0.1, 0.2, 0.3, 0.5, 0.61, 0.62, 0.625, 0.63, 0.64, 0.7, 0.9, 1]) {
    const projection = paint('semantic', 0, {
      'normalize-candidate-vectors': cue(1),
      'project-cosine-score': cue(progress),
      'rank-by-cosine': cue(1),
    });
    assert.deepEqual(
      [...projection.issues, ...layoutIssues(projection)],
      [],
      `cosine projection at ${progress} keeps its vector arrow and moving score marker distinct`,
    );
  }
  const prefix = model.sampleModel('semantic', {
    beat: 1,
    cues: { 'inspect-filtered-prefix': cue(1) },
  });
  assert.equal(prefix.visited, 1);
  assert.equal(prefix.activeIndex, 0);
  assert.equal(prefix.activeProgress, 1);
  assert.deepEqual(prefix.allowed, []);
  assert.equal(prefix.rows[prefix.activeIndex].reason, 'workspace');
  for (const [id, index, reason] of [
    ['explain-other-store-failure', 0, 'workspace'],
    ['explain-retired-failure', 1, 'retired'],
    ['explain-reader-failure', 2, 'reader'],
  ]) {
    const state = { beat: 1, cues: { 'inspect-filtered-prefix': cue(1), [id]: cue(0.5) } };
    const failure = model.sampleModel('semantic', state),
      frame = drawFrame(
        createCanvas(1920, 1080).getContext('2d'),
        {},
        { id: 'semantic', title: 'Stored evidence' },
        { beat: 1, beatP: 0, opacity: 1, cues: state.cues },
        model.draw,
      );
    assert.equal(failure.activeIndex, index);
    assert.equal(failure.activeProgress, 1);
    assert.equal(failure.rows[index].reason, reason);
    assert.deepEqual(failure.allowed, []);
    assert(frame.labels.some((label) => label.text === failure.rows[index].chunk));
    assert.deepEqual(
      frame.labels
        .filter((label) => ['PASS', 'STOP', 'waiting', 'checking'].includes(label.text))
        .map((label) => label.text),
      index === 0
        ? ['STOP', 'waiting', 'waiting']
        : index === 1
          ? ['PASS', 'STOP', 'waiting']
          : ['PASS', 'PASS', 'STOP'],
    );
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  }
  const longer = model.sampleModel('semantic', {
    beat: 1,
    cues: {
      'inspect-filtered-prefix': cue(1),
      'explain-other-store-failure': cue(1),
      'explain-retired-failure': cue(1),
      'explain-reader-failure': cue(1),
      'advance-ranked-search': cue(1),
      'continue-candidate-search': cue(1),
    },
  });
  assert.equal(longer.visited, 5);
  assert.equal(longer.activeIndex, 4);
  assert.equal(longer.activeProgress, 1);
  assert.deepEqual(
    longer.allowed.map((row) => row.chunk),
    ['c7c', 'c7d'],
  );
  assert.deepEqual(longer.lexical, reference.semantic_exact_phrase_matches);
  const finalGate = paint('semantic', 1, {
    'inspect-filtered-prefix': cue(1),
    'continue-candidate-search': cue(1),
  });
  assert.deepEqual(
    [...finalGate.issues, ...layoutIssues(finalGate)],
    [],
    'the final candidate reaches the requested-results panel without a connector crossing its label',
  );
  const answer = model.sampleModel('closing', {
    beat: 1,
    cues: { 'reveal-final-citation': cue(1) },
  });
  assert.deepEqual(answer.answer, reference.final_reopen.answer_ids);
  assert.equal(
    model.joinedRows(true).find((row) => row.id === answer.answer[0]).text,
    reference.final_reopen.answer[0],
  );
});

const measuredSemanticTimeline = process.env.SQL_SEMANTIC_MEASURED_TIMELINE;
test(
  'semantic rejection cues match measured provider-word intervals and hold the corresponding STOP state',
  { skip: !measuredSemanticTimeline },
  () => {
    const timeline = JSON.parse(readFileSync(measuredSemanticTimeline, 'utf8'));
    const semantic = timeline.scenes.find((scene) => scene.id === 'semantic'),
      beat = semantic.beats[1],
      sound = semantic.sounds.find((item) => item.beatIndex === 1);
    assert(semantic && beat && sound, 'measured semantic beat and its provider timing must exist');
    const cases = [
      {
        cue: 'explain-other-store-failure',
        candidate: 'c99',
        reason: 'workspace',
        statuses: ['STOP', 'waiting', 'waiting'],
        before: 'c99',
      },
      {
        cue: 'explain-retired-failure',
        candidate: 'c7-old',
        reason: 'retired',
        statuses: ['PASS', 'STOP', 'waiting'],
        before: 'c99',
      },
      {
        cue: 'explain-reader-failure',
        candidate: 'c9a',
        reason: 'reader',
        statuses: ['PASS', 'PASS', 'STOP'],
        before: 'c7-old',
      },
    ];
    const tokens = timedWordTokens(sound.words, beat.say);
    for (const item of cases) {
      const cue = semantic.visualCues.find((entry) => entry.id === item.cue);
      assert(cue, `missing measured visual cue ${item.cue}`);
      const phrase = lexicalTokens(cue.phrase),
        first = tokens.findIndex((token, index) =>
          phrase.every((word, offset) => tokens[index + offset]?.value === word),
        );
      assert(first >= 0, `${item.cue} phrase must match provider words`);
      const last = first + phrase.length - 1,
        expectedStart = beat.start + sound.words[tokens[first].wordIndex].start,
        expectedEnd = beat.start + sound.words[tokens[last].wordIndex].end;
      assert.equal(cue.start, expectedStart, `${item.cue} start must use its first provider word`);
      assert.equal(cue.end, expectedEnd, `${item.cue} end must use its last provider word`);
    }
    const frameAt = (time) => {
      const state = {
        beat: 1,
        beatP: (time - beat.start) / beat.duration,
        opacity: 1,
        cues: sampleNarrationCues(semantic.visualCues, time),
      };
      const sampled = model.sampleModel('semantic', state),
        frame = drawFrame(
          createCanvas(1920, 1080).getContext('2d'),
          {},
          { id: 'semantic', title: 'Stored evidence' },
          state,
          model.draw,
        );
      return { state, sampled, frame };
    };
    const cueRows = cases.map((item) => semantic.visualCues.find((cue) => cue.id === item.cue));
    for (let index = 0; index < cases.length; index++) {
      const item = cases[index],
        cue = cueRows[index],
        next = cueRows[index + 1];
      const beforeTime = cue.start - 1 / timeline.fps,
        duringTime = cue.start + 1 / timeline.fps,
        midTime = (cue.start + cue.end) / 2,
        afterTime = cue.end + Math.min(0.1, (next ? next.start - cue.end : 0.3) / 2);
      const before = frameAt(beforeTime),
        during = frameAt(duringTime),
        middle = frameAt(midTime),
        after = frameAt(afterTime);
      assert.equal(
        before.sampled.rows[before.sampled.activeIndex].chunk,
        item.before,
        `${item.cue} keeps the previous visible candidate until its spoken reason starts`,
      );
      for (const sample of [during, middle, after]) {
        assert.equal(
          sample.sampled.rows[sample.sampled.activeIndex].chunk,
          item.candidate,
          `${item.cue} selects its matching paragraph through the reason`,
        );
        assert.equal(sample.sampled.rows[sample.sampled.activeIndex].reason, item.reason);
        assert.equal(
          sample.sampled.activeProgress,
          1,
          'the candidate remains stopped at its failing gate',
        );
        assert.deepEqual(
          sample.frame.labels
            .filter((label) => ['PASS', 'STOP', 'waiting', 'checking'].includes(label.text))
            .map((label) => label.text),
          item.statuses,
        );
        assert(sample.frame.labels.some((label) => label.text.includes(item.candidate)));
        assert.deepEqual([...sample.frame.issues, ...layoutIssues(sample.frame)], []);
      }
    }
    const advanceCue = semantic.visualCues.find((cue) => cue.id === 'advance-ranked-search');
    const start = frameAt(advanceCue.start + 1 / timeline.fps),
      middle = frameAt((advanceCue.start + advanceCue.end) / 2),
      end = frameAt(advanceCue.end - 1 / timeline.fps);
    assert.equal(start.sampled.rows[start.sampled.activeIndex].chunk, 'c7c');
    assert.deepEqual(
      middle.sampled.allowed.map((row) => row.chunk),
      ['c7c'],
    );
    assert.equal(end.sampled.rows[end.sampled.activeIndex].chunk, 'c7d');
    assert.deepEqual(
      end.sampled.allowed.map((row) => row.chunk),
      ['c7c', 'c7d'],
    );
    const resultCue = semantic.visualCues.find((cue) => cue.id === 'continue-candidate-search');
    const result = frameAt(resultCue.start + 1 / timeline.fps);
    assert.deepEqual(
      result.sampled.allowed.map((row) => row.chunk),
      ['c7c', 'c7d'],
    );
    assert(result.frame.labels.some((label) => label.text === 'Both requested paragraphs passed'));
    assert.deepEqual([...result.frame.issues, ...layoutIssues(result.frame)], []);
  },
);

test('the citation-title transfer starts at the matched document row', () => {
  const frame = paint('join', 1, {
    'attach-source-title': cue(1),
    'join-second-paragraph': cue(0),
  });
  const matched = frame.labels.find((label) => label.text === 'd7' && label.x > 1000),
    other = frame.labels.find((label) => label.text === 'd9');
  assert(matched && other);
  const source = frame.paths.find(
    (path) =>
      path.points.length > 1 &&
      path.points[0].x > 1800 &&
      path.points[0].y >= matched.y &&
      path.points[0].y <= matched.y + matched.height,
  );
  assert(
    source,
    'the title transfer must originate beside the matched d7 row, above the unrelated d9 row',
  );
  assert(source.points[0].y < other.y);
  const destination = frame.connectors.find(
    (arrow) => arrow.head && arrow.from.x > 1800 && arrow.to.y > 700,
  );
  assert(destination, 'the routed title reaches the first joined result row');
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
});

test('the painted constraint failures match isolated real database operations', () => {
  const duplicate = paint('relations', 1, { 'duplicate-row': cue(1), 'missing-parent': cue(0) });
  assert(duplicate.labels.some((label) => label.text === reference.duplicate_attempt[2]));
  assert(duplicate.labels.some((label) => label.text === reference.constraints.duplicate));
  const missing = paint('relations', 1, { 'duplicate-row': cue(1), 'missing-parent': cue(1) });
  assert(missing.labels.some((label) => label.text === reference.constraints.foreign_key));
  assert.deepEqual(
    [...duplicate.issues, ...layoutIssues(duplicate), ...missing.issues, ...layoutIssues(missing)],
    [],
  );
});
