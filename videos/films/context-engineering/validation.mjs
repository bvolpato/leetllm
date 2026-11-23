import {
  COMPRESSION_CUES,
  CONTEXT_REQUIRED,
  SELECTION_CUE,
  TRACE_EXCHANGE,
  ids,
  sources,
} from './fixtures.mjs';
import {
  contextPrefixExample,
  contextRelease,
  pruneContextResults,
  requiredPacking,
} from './arithmetic.mjs';
import { completeWorkerBoundary, verifyHandoff } from './handoff.mjs';
import {
  completeResume,
  contextResumeFixture,
  originalArtifact,
  originalInputs,
  verifyReceipt,
} from './recovery.mjs';
import { completeToolIntersection, findings, recoverySnapshot, sampleModel } from './model.mjs';
import { freshContextState } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateCompleteModel();
  assert.equal(TRACE_EXCHANGE.call.id, TRACE_EXCHANGE.result.call_id);
  assert.equal(TRACE_EXCHANGE.result.status, sources[TRACE_EXCHANGE.result.source].status);
  assert.deepEqual(
    sampleModel('select', {
      beat: 1,
      beatP: 0,
      cues: {
        'select-proposal': {
          phase: 'during',
          progress: 0.1,
        },
      },
    }).tools,
    ['runbook_search', 'rollback_advisor'],
  );
  assert.equal(recoverySnapshot(0.12).note.source, undefined);
  assert.equal(recoverySnapshot(0.5).stage, 2);
  assert.equal(recoverySnapshot(0.5).answered, false);
  assert.equal(recoverySnapshot(0.66).attempts, 1);
  assert.equal(recoverySnapshot(0.88).note.source, 'trace-17');
  assert.equal(recoverySnapshot(0.88).record.status, 403);
  assert.equal(recoverySnapshot(0.88).attempts, 2);
  assert.equal(findings().length, 2);
  assert.equal(
    findings({
      ...sources,
      'lock-check': {
        trace: 'other',
        at: 100,
        locked: false,
      },
    }).length,
    1,
  );
  assert.equal(
    findings({
      ...sources,
      'trace-17': {
        ...sources['trace-17'],
        status: 200,
      },
    }).length,
    1,
  );
  assert(
    !verifyHandoff(
      JSON.stringify({
        claim: 'auth error',
        source: 'missing',
      }),
    ).accepted,
  );
  assert(
    !verifyHandoff(
      JSON.stringify({
        claim: 'trace succeeded',
        source: 'trace-17',
      }),
    ).accepted,
  );
  assert(
    !verifyHandoff(
      JSON.stringify({
        claim: 'x'.repeat(201),
        source: 'trace-17',
      }),
    ).size,
  );
  assert(!verifyHandoff('{').schema);
  assert(
    !verifyReceipt(originalArtifact, {
      ...originalInputs,
      extra: 'unbound',
    }).passed,
  );
  for (const id of ids)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.25, 0.5, 0.75, 0.999999]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert.equal(s.step, beat);
        if (id === 'resume') assert.equal(s.passed, beat === 0);
        if (id === 'isolate') assert.equal(s.accepted, beat === 0);
        if (id === 'compress') {
          assert.equal(s.kept + s.removed, 12436);
          if (beat < 2) assert.equal(s.kept, [12436, 4236][beat]);
          if (beat === 2) assert.equal(s.kept, [4236, 3466, 3346][s.stage - 1]);
        }
        if (id === 'write') assert.deepEqual(s.verified, s.reloaded);
        if (id === 'evaluate') {
          assert.equal(s.baseline.score, 4);
          assert.equal(s.candidate.score, 5);
          assert.equal(s.approved, false);
        }
      }
  const beforeTools = sampleModel('compress', {
    beat: 2,
    beatP: (COMPRESSION_CUES.toolsRemoved - 0.001) / COMPRESSION_CUES.span,
  });
  const afterTools = sampleModel('compress', {
    beat: 2,
    beatP: (COMPRESSION_CUES.toolsRemoved + 0.001) / COMPRESSION_CUES.span,
  });
  const beforeClaim = sampleModel('compress', {
    beat: 2,
    beatP: (COMPRESSION_CUES.hypothesisRemoved - 0.001) / COMPRESSION_CUES.span,
  });
  const afterClaim = sampleModel('compress', {
    beat: 2,
    beatP: (COMPRESSION_CUES.hypothesisRemoved + 0.001) / COMPRESSION_CUES.span,
  });
  assert.equal(beforeTools.kept, 4236);
  assert(beforeTools.items.some((item) => item.id === 'Unused tools'));
  assert.equal(afterTools.kept, 3466);
  assert(!afterTools.items.some((item) => item.id === 'Unused tools'));
  assert(afterTools.items.some((item) => item.id === 'Old lock hypothesis'));
  assert.equal(beforeClaim.kept, 3466);
  assert.equal(afterClaim.kept, 3346);
  assert(!afterClaim.items.some((item) => item.id === 'Old lock hypothesis'));
  assert(afterClaim.items.some((item) => item.id === 'Reloaded findings' && item.units === 186));
  assert.equal(
    sampleModel('compress', {
      beat: 2,
      beatP: 0.88,
    }).kept,
    3346,
  );
  const beforeSelection = sampleModel('select', {
    beat: 1,
    beatP: SELECTION_CUE - 0.0001,
  });
  const afterSelection = sampleModel('select', {
    beat: 1,
    beatP: SELECTION_CUE + 0.0001,
  });
  assert.equal(beforeSelection.phase, 'investigate');
  assert.deepEqual(beforeSelection.tools, ['deploy_lookup', 'trace_lookup']);
  assert.equal(afterSelection.phase, 'propose');
  assert.deepEqual(afterSelection.tools, ['runbook_search', 'rollback_advisor']);
  assert.deepEqual(
    sampleModel('select', {
      beat: 2,
      beatP: 0,
    }).tools,
    [],
  );
  return true;
}
export function validateCompleteModel() {
  assert.deepEqual(completeToolIntersection('investigate'), [
    'deploy_lookup',
    'runbook_search',
    'trace_lookup',
  ]);
  assert.deepEqual(completeToolIntersection('other'), []);
  assert.equal(contextPrefixExample(false).common, 96);
  assert.equal(contextPrefixExample(true).common, 352);
  assert.equal(contextPrefixExample(true).length, 364);
  const packed = requiredPacking(CONTEXT_REQUIRED, 3000);
  assert.deepEqual(packed.selected, ['alert', 'trace', 'runbook']);
  assert.equal(packed.used, 2400);
  assert.equal(requiredPacking(CONTEXT_REQUIRED, 4096 - 420 - 180 - 1024).remaining, 72);
  assert.throws(
    () =>
      requiredPacking(
        [
          {
            id: 'required dump',
            units: 8200,
            priority: 10,
            required: true,
          },
        ],
        3000,
      ),
    /required item/,
  );
  const pruned = pruneContextResults(
    [true, false, true, true].map((recorded, i) => ({
      id: 'call' + i,
      source: 'S' + i,
      raw: 'raw' + i,
      finding: 'checked' + i,
      recorded,
    })),
    2,
  );
  assert.equal(pruned.cutoff, 2);
  assert.deepEqual(
    pruned.rows.filter((r) => r.replaced).map((r) => r.index),
    [0],
  );
  const wire = Buffer.from(
    JSON.stringify({
      claim: 'auth error observed; cause unresolved',
      source_ids: ['trace-17'],
      next_check: 'inspect dependency',
    }),
  );
  assert(completeWorkerBoundary(wire).accepted);
  assert(
    !completeWorkerBoundary(
      Buffer.from('{"claim":"a","claim":"b","source_ids":["trace-17"],"next_check":"inspect"}'),
    ).accepted,
  );
  assert(!completeWorkerBoundary(Buffer.alloc(1601, 32)).size);
  assert(!completeWorkerBoundary(Buffer.from([255])).accepted);
  const release = contextRelease();
  assert.equal(release.raw, 7);
  assert.equal(release.curated, 8);
  assert.equal(release.gains, 2);
  assert.equal(release.regressions, 1);
  assert.equal(release.approved, false);
  assert(Math.abs(release.percent - 73.09424252171116) < 1e-10);
  const fixture = contextResumeFixture();
  assert.equal(completeResume(fixture.tasks, fixture.files, fixture.receipts).next, 'verify cause');
  fixture.files['deploy.json'] = 'changed';
  assert.throws(
    () => completeResume(fixture.tasks, fixture.files, fixture.receipts),
    /input changed/,
  );
  const after = freshContextState({
    beat: 2,
    beatP: 1,
  });
  assert.equal(after.packing.used, 2200);
  assert.equal(after.packing.remaining, 400);
  assert.equal(after.next, 'verify cause');
  assert(after.packet.includes('authorization'));
  return true;
}
