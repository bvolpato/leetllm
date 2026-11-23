import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {
  exactMovieReview,
  inspectionFlags,
  pendingStatus,
  findFindings,
} from '../private-gallery/inspection-data.mjs';
import {
  inspectionProgressRows,
  collectInspectionRun,
} from '../private-gallery/inspection-run.mjs';

test('an earlier POST never approves different candidate bytes', () => {
  const records = [{ movieSha256: 'old', recommendation: 'POST', reviewedAt: '2026-11-07' }];
  assert.equal(exactMovieReview(records, 'new'), null);
  assert.equal(pendingStatus({ media: {} }, null, null), 'Exact movie available; review missing');
});

test('the exact replacement receives only its own recommendation', () => {
  const records = [
    { movieSha256: 'old', recommendation: 'POST', reviewedAt: '2026-11-07' },
    { movieSha256: 'new', recommendation: 'REWORK', reviewedAt: '2026-11-08' },
  ];
  assert.equal(exactMovieReview(records, 'new').recommendation, 'REWORK');
  assert.equal(
    pendingStatus({}, exactMovieReview(records, 'new'), null),
    'Exact movie reviewed: REWORK',
  );
});

test('mechanical organization and native parity do not create an encoded revisit', () => {
  const flags = inspectionFlags({
    originalFullPeer: null,
    allLocatedEncodedReviewRecords: [],
    acceptedScopedDefinitionRecords: [],
    mechanical: { records: [{ record: { path: 'parity.json' } }] },
  });
  assert.equal(flags.mechanicalMigrationRecorded, true);
  assert.equal(flags.scriptReviewRecorded, false);
  assert.equal(flags.encodedVisualReviewRecorded, false);
});

test('a source manuscript review remains distinct from encoded visual inspection', () => {
  const flags = inspectionFlags({
    originalFullPeer: { exactPreservedRecord: { path: 'full.json' }, declaredStatus: 'accepted' },
    allLocatedEncodedReviewRecords: [],
    acceptedScopedDefinitionRecords: [],
    mechanical: { records: [] },
  });
  assert.equal(flags.scriptReviewRecorded, true);
  assert.equal(flags.encodedVisualReviewRecorded, false);
});

test('resolved findings stay separate from unresolved movie findings', () => {
  assert.deepEqual(
    findFindings({
      findings: [
        { id: 'old', status: 'resolved', summary: 'Fixed' },
        { id: 'new', summary: 'Still early' },
      ],
    }),
    [{ id: 'new', severity: null, summary: 'Still early', remedy: null }],
  );
});

test('actual nested SGLang, Classifier and Safety findings retain their exact lesson scope', async () => {
  for (const id of ['deep-dive-sglang', 'capstone-fine-tuned-classifier', 'safety-guardrails']) {
    const review = JSON.parse(
      await fs.readFile(new URL(`../reviews/delivery-2026-11-06/${id}.json`, import.meta.url)),
    );
    const scoped = review.lessons.find((lesson) => lesson.id === id);
    const findings = findFindings(review, id);
    assert.equal(findings.length, scoped.findings.length);
    assert(findings.length > 0);
    assert.equal(findings[0].id, scoped.findings[0].id);
    assert.equal(findings[0].summary, scoped.findings[0].detail);
    assert.deepEqual(findFindings(review, 'another-lesson'), []);
  }
});

test('nested resolved findings and another lesson cannot borrow an unresolved verdict', () => {
  const review = {
    lessons: [
      { id: 'a', findings: [{ id: 'fixed', status: 'resolved', detail: 'Already repaired' }] },
      { id: 'b', findings: [{ id: 'open', detail: 'Still early' }] },
    ],
  };
  assert.deepEqual(findFindings(review, 'a'), []);
  assert.equal(findFindings(review, 'b')[0].summary, 'Still early');
  assert.deepEqual(findFindings(review), []);
});

test('a new inspection plan cannot inherit an older POST through identical movie bytes', () => {
  const reviews = [{ movieSha256: 'same-bytes', recommendation: 'POST' }];
  assert.equal(exactMovieReview(reviews, 'same-bytes', { inspectionPlanSha256: 'new-plan' }), null);
  reviews.push({
    movieSha256: 'same-bytes',
    recommendation: 'REWORK',
    inspectionPlanSha256: 'new-plan',
  });
  assert.equal(
    exactMovieReview(reviews, 'same-bytes', { inspectionPlanSha256: 'new-plan' }).recommendation,
    'REWORK',
  );
});

test('shared progress requires every exact ID and a delivery before technical completion', () => {
  const plan = { kind: 'leetllm.inspection-collection', lessons: [{ id: 'a' }, { id: 'b' }] };
  const progress = {
    kind: 'leetllm.inspection-progress',
    lessons: [
      { id: 'a', status: 'audio-ready' },
      { id: 'b', status: 'pending' },
    ],
  };
  assert.equal(inspectionProgressRows(plan, progress).length, 2);
  progress.lessons[1] = { id: 'a', status: 'pending' };
  assert.throws(() => inspectionProgressRows(plan, progress), /Duplicate progress/);
  progress.lessons[1] = { id: 'b', status: 'complete' };
  assert.throws(() => inspectionProgressRows(plan, progress), /no delivery/);
});

test('all-199 technical progress stays manually unrevisited and checks the actual Stage YAML', async () => {
  const lessons = Array.from({ length: 199 }, (_, index) => ({
    id: `lesson-${index}`,
    sourceManifest: {
      lessonFile: `videos/stage-lessons/lesson-${index}.lesson.yaml`,
      moduleFile: `videos/films/lesson-${index}/index.mjs`,
      fingerprint: 'source',
      closure: {
        files: [{ path: `videos/stage-lessons/lesson-${index}.lesson.yaml`, sha256: 'before' }],
      },
    },
  }));
  const plan = {
    kind: 'leetllm.inspection-collection',
    lessons,
    runtime: { version: '0.8.1' },
    sourceFreeze: {},
    createdAt: '2026-11-08',
  };
  const progress = {
    kind: 'leetllm.inspection-progress',
    lessons: lessons.map((entry) => ({
      id: entry.id,
      status: 'pending',
      directionReview: 'unrevisited',
    })),
  };
  const read = async (file) => ({
    value: file.endsWith('inspection.json') ? plan : progress,
    binding: { path: file, sha256: 'metadata' },
  });
  const result = await collectInspectionRun({
    directory: '/fixture/run',
    read,
    bind: async (file) => ({ path: file, sha256: 'after' }),
  });
  assert.equal(result.jobs.length, 199);
  assert(result.jobs.every((job) => job.media === null && job.directionReview === 'unrevisited'));
  assert.equal(
    result.jobs[0].changedSinceFreeze[0].path,
    'videos/stage-lessons/lesson-0.lesson.yaml',
  );
  assert(
    result.jobs.every((job) => !('recommendation' in job)),
    'Technical status must not manufacture encoded acceptance',
  );
});

test('a completed shared export binds its receipt, movie and actual PNG before becoming playable', async () => {
  const hash = 'a'.repeat(64);
  const lessons = Array.from({ length: 199 }, (_, index) => ({
    id: `topic-${index}`,
    sourceManifest: {
      lessonFile: `videos/lessons/topic-${index}.lesson.yaml`,
      moduleFile: `videos/films/topic-${index}/index.mjs`,
      fingerprint: 'new-source',
      closure: { files: [] },
    },
  }));
  const delivery = {
    receipt: { path: '/fixture/verification.json', sha256: hash },
    movie: { path: '/fixture/topic-0.mp4', sha256: hash, bytes: 10 },
    sourceFingerprint: 'new-source',
    fullDecode: 'passed',
  };
  const plan = {
    kind: 'leetllm.inspection-collection',
    lessons,
    runtime: { version: '0.8.1' },
    sourceFreeze: {},
  };
  const progress = {
    kind: 'leetllm.inspection-progress',
    lessons: lessons.map((entry, index) => ({
      id: entry.id,
      status: index === 0 ? 'complete' : 'pending',
      directionReview: 'unrevisited',
      delivery: index === 0 ? delivery : undefined,
    })),
  };
  const receipt = {
    sha256: hash,
    fingerprint: 'new-source',
    fullDecode: 'passed',
    artifactSha256: {
      '01-intro.png': hash,
      'topic-0.vtt': hash,
      'topic-0.srt': hash,
      'topic-0.chapters.txt': hash,
    },
  };
  const read = async (file) => ({
    value: file.endsWith('inspection.json')
      ? plan
      : file.endsWith('progress.json')
        ? progress
        : receipt,
    binding: { path: file, sha256: hash },
  });
  const bind = async (file) => ({ path: file, sha256: hash, bytes: 10 });
  const result = await collectInspectionRun({ directory: '/fixture/run', read, bind });
  assert.equal(result.jobs[0].media.poster.source, '/fixture/01-intro.png');
  assert.equal(result.jobs[0].directionReview, 'unrevisited');
  assert.equal(result.jobs[1].media, null);
  delivery.sourceFingerprint = 'wrong-source';
  await assert.rejects(
    collectInspectionRun({ directory: '/fixture/run', read, bind }),
    /wrong-source/,
  );
});
