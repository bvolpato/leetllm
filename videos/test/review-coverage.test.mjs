import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import path from 'node:path';
import {
  assessRevisionPublicationReadiness,
  bindBaselineReviewImage,
  bindRevisionReviewImage,
  buildSceneCoverage,
  classifyArtifactReview,
  escapeHtml,
  hasOnlyUvReleaseAgeMetadataChanged,
  isPngSignature,
  mapStillRunsToBeats,
  normalizeReviewerPayload,
  paginateMotionScenes,
  rankSceneBeatsByMotion,
  reconcilePublicationSelection,
  reviewImageMetadataPath,
  selectReviewPlayer,
  summarizeRevisionReviewRows,
  summarizeReviewerRows,
} from '../lib/review-coverage.mjs';

test('review payloads accept array and lessons envelope without fabricating fields', () => {
  assert.deepEqual(
    normalizeReviewerPayload({ reviewer: 'reviewer-2', lessons: [{ id: 'a' }] }, 'fallback'),
    [{ id: 'a', reviewer: 'reviewer-2' }],
  );
  assert.deepEqual(normalizeReviewerPayload([{ id: 'b', reviewer: 'named' }], 'reviewer-1'), [
    { id: 'b', reviewer: 'named' },
  ]);
  assert.throws(
    () => normalizeReviewerPayload({ lessons: {} }, 'bad-review'),
    /lessons must be an array/,
  );
});

test('frame still runs become timed review cues, including early beat settling', () => {
  const timeline = {
    scenes: [
      {
        id: 'graph',
        start: 4,
        beats: [
          { start: 0.4, end: 10.4 },
          { start: 10.4, end: 20.4 },
        ],
      },
    ],
  };
  const { longStillCandidates, earlySettleCandidates } = mapStillRunsToBeats(
    [
      { scene: 'graph', firstFrame: 50, lastFrame: 129, duration: 8 },
      { scene: 'graph', firstFrame: 198, lastFrame: 247, duration: 5 },
      { scene: 'graph', firstFrame: 100, lastFrame: 119, duration: 2 },
    ],
    timeline,
    10,
  );
  assert.equal(longStillCandidates.length, 1);
  assert.equal(longStillCandidates[0].beat, 0);
  assert.equal(longStillCandidates[0].startTime, 5);
  assert.equal(earlySettleCandidates.length, 1);
  assert.equal(earlySettleCandidates[0].beat, 0);
  assert.ok(earlySettleCandidates[0].beatProgress < 0.5);
});

test('scene coverage ties native sample anchors to authored scene and beat labels', () => {
  const result = buildSceneCoverage({
    lesson: { scenes: [{ id: 'graph', title: 'The graph' }] },
    timeline: {
      scenes: [
        {
          id: 'graph',
          start: 4,
          duration: 6,
          beats: [
            { start: 0.4, end: 3.2, duration: 2.8, say: 'First idea' },
            { start: 3.2, end: 5.8, duration: 2.6, say: 'Second idea' },
          ],
        },
      ],
    },
    encodedReview: {
      samples: [
        {
          frame: 120,
          time: 4,
          image: 'frames/a.png',
          targets: [{ scene: 'graph', beat: 0, phase: 'early' }],
        },
        {
          frame: 121,
          time: 4.03,
          image: 'frames/b.png',
          targets: [{ scene: 'graph', beat: 0, phase: 'middle' }],
        },
        {
          frame: 170,
          time: 5.67,
          image: 'frames/c.png',
          targets: [{ scene: 'leetllm-intro', phase: 'end' }],
        },
      ],
      sceneSheets: [{ scene: 'graph', image: 'scenes/graph.png' }],
    },
    audit: { frames: 600, stillRuns: [], peakChanges: [] },
    fps: 30,
  });
  assert.equal(result.scenes[0].title, 'The graph');
  assert.equal(result.scenes[0].sheet, 'scenes/graph.png');
  assert.equal(result.scenes[0].beats[0].samples.length, 2);
  assert.deepEqual(result.scenes[0].beats[0].phases, ['early', 'middle']);
  assert.equal(result.scenes[0].beats[1].samples.length, 0);
  assert.equal(result.sampledFrames, 3);
  assert.equal(result.frameSampleCoverage, 3 / 600);
  assert.equal(result.beatSampleCoverage, 0.5);
});

test('motion atlas selects each scene beat with the largest decoded change sum', () => {
  const ranking = rankSceneBeatsByMotion(
    {
      scenes: [
        {
          id: 'shape',
          start: 0,
          duration: 4,
          beats: [
            { start: 0, end: 2 },
            { start: 2, end: 4 },
          ],
        },
      ],
    },
    [
      [0, 0, 0, 0],
      [1, 0.2, 0, 0],
      [2, 0.1, 0, 0],
      [3, 0.6, 0, 0],
    ],
    1,
  );
  assert.deepEqual(ranking.get('shape'), {
    scene: 'shape',
    beat: 1,
    start: 2,
    end: 4,
    motionSum: 0.7,
    measuredFrames: 2,
  });
});

test('motion atlas pages preserve order and bound each image to four scenes', () => {
  const scenes = Array.from({ length: 9 }, (_, index) => ({ scene: `scene-${index + 1}` }));
  const pages = paginateMotionScenes(scenes);
  assert.deepEqual(
    pages.map((page) => page.scenes.length),
    [4, 4, 1],
  );
  assert.deepEqual(
    pages.map((page) => page.page),
    [1, 2, 3],
  );
  assert.deepEqual(
    pages.flatMap((page) => page.scenes),
    scenes,
  );
  assert.throws(() => paginateMotionScenes(scenes, 0), /positive integer/);
});

test('review rows are marked stale when render or source hashes differ', () => {
  const lessons = new Map([['graph', { sha256: 'video-current', fingerprint: 'source-current' }]]);
  const byLesson = summarizeReviewerRows(
    [
      {
        lessons: [
          {
            reviewer: 'r1',
            id: 'graph',
            movieSha256: 'video-current',
            sourceFingerprint: 'source-current',
            findings: [],
            blockers: [],
          },
          {
            reviewer: 'r2',
            id: 'graph',
            movieSha256: 'video-old',
            sourceFingerprint: 'source-current',
            findings: [{ issue: 'old frame' }],
            blockers: [],
          },
        ],
      },
    ],
    lessons,
  );
  assert.equal(byLesson.get('graph')[0].stale, false);
  assert.equal(byLesson.get('graph')[1].stale, true);
  assert.equal(byLesson.get('graph')[1].movieCurrent, false);
  assert.equal(
    summarizeReviewerRows([{ lessons: [{ id: 'graph' }] }], lessons).get('graph')[0].stale,
    true,
  );
});

test('review freshness stays bound to the reviewed export when the checkout evolves', () => {
  const reviewedExport = { sha256: 'movie-hash', fingerprint: 'receipt-source-hash' };
  const review = {
    movieSha256: 'movie-hash',
    sourceFingerprint: 'receipt-source-hash',
  };
  const binding = classifyArtifactReview(review, reviewedExport, {
    matchesCurrentCheckout: false,
    evidencePassed: true,
  });
  assert.equal(binding.movieCurrent, true);
  assert.equal(binding.sourceCurrent, true);
  assert.equal(binding.matchesCurrentCheckout, false);
  assert.equal(binding.stale, false);

  const changedMovie = classifyArtifactReview(
    { ...review, movieSha256: 'different-movie' },
    reviewedExport,
    {
      matchesCurrentCheckout: false,
      evidencePassed: true,
    },
  );
  assert.equal(changedMovie.stale, true);

  const selection = reconcilePublicationSelection(
    {
      decision: 'keep',
      movieSha256: 'movie-hash',
      sourceFingerprint: 'receipt-source-hash',
    },
    reviewedExport,
  );
  const currentCheckoutFingerprint = 'current-checkout-source-hash';
  selection.matchesCurrentCheckout = selection.sourceFingerprint === currentCheckoutFingerprint;
  assert.equal(selection.stale, false);
  assert.equal(selection.matchesCurrentCheckout, false);
});

test('TTS provenance identifies only the added uv release-age metadata', () => {
  const baseline =
    '# /// script\n# requires-python = ">=3.12"\n# dependencies = [\n#     "edge-tts==7.3.1",\n# ]\n# ///\nprint("speech")\n';
  const current = baseline.replace('# ///\n', '# [tool.uv]\n# exclude-newer = "P7D"\n# ///\n');
  const baselineSha256 = createHash('sha256').update(baseline).digest('hex');
  assert.equal(hasOnlyUvReleaseAgeMetadataChanged(Buffer.from(current), baselineSha256), true);
  assert.equal(
    hasOnlyUvReleaseAgeMetadataChanged(
      Buffer.from(current.replace('print("speech")', 'print("changed")')),
      baselineSha256,
    ),
    false,
  );
});

test('replacement reviews are current only when movie, source, and image evidence match', () => {
  const binding = {
    movieSha256: 'movie-current',
    sourceFingerprint: 'source-current',
    matchesCurrentCheckout: true,
  };
  const current = summarizeRevisionReviewRows(
    [
      {
        reviewer: 'r1',
        movieSha256: 'movie-current',
        sourceFingerprint: 'source-current',
        evidencePassed: true,
      },
    ],
    binding,
  );
  assert.equal(current.status, 'current');
  assert.equal(current.current, 1);
  assert.equal(current.rows[0].current, true);

  const stale = summarizeRevisionReviewRows(
    [
      {
        reviewer: 'r1',
        movieSha256: 'movie-old',
        sourceFingerprint: 'source-current',
        evidencePassed: true,
      },
    ],
    binding,
  );
  assert.equal(stale.status, 'stale');
  assert.equal(stale.stale, 1);
  assert.equal(stale.rows[0].current, false);

  assert.equal(summarizeRevisionReviewRows([], binding).status, 'pending');
  assert.equal(
    summarizeRevisionReviewRows(
      [
        {
          movieSha256: 'movie-current',
          sourceFingerprint: 'source-current',
          evidencePassed: true,
        },
      ],
      { ...binding, matchesCurrentCheckout: false },
    ).rows[0].current,
    true,
    'a review bound to the exact movie and receipt remains current when the checkout changes',
  );
  assert.equal(
    summarizeRevisionReviewRows(
      [
        {
          movieSha256: 'movie-current',
          sourceFingerprint: 'source-current',
          evidencePassed: false,
        },
      ],
      binding,
    ).status,
    'stale',
  );
});

test('replacement review image evidence must bind to a declared file inside that revision', () => {
  const repoRoot = '/repo';
  const encodedDirectory = '/repo/build/revisions/lesson/encoded-review';
  const sha256 = 'a'.repeat(64);
  const image = { path: 'build/revisions/lesson/encoded-review/frames/sample.png', sha256 };
  const artifacts = { 'frames/sample.png': sha256 };
  assert.deepEqual(bindRevisionReviewImage(repoRoot, encodedDirectory, image, artifacts), {
    path: path.join(encodedDirectory, 'frames/sample.png'),
    sha256,
    kind: 'encoded-review',
  });
  assert.equal(
    bindRevisionReviewImage(
      repoRoot,
      encodedDirectory,
      {
        ...image,
        path: 'build/video-complete-curriculum/lesson/encoded-review/frames/sample.png',
      },
      artifacts,
    ),
    null,
  );
  assert.equal(
    bindRevisionReviewImage(
      repoRoot,
      encodedDirectory,
      { ...image, sha256: 'b'.repeat(64) },
      artifacts,
    ),
    null,
  );
  assert.equal(
    bindRevisionReviewImage(repoRoot, encodedDirectory, { path: image.path }, artifacts),
    null,
  );
  assert.equal(
    bindRevisionReviewImage(
      repoRoot,
      encodedDirectory,
      {
        path: 'build/revisions/lesson/encoded-review/notes.txt',
        sha256,
      },
      { 'notes.txt': sha256 },
    ),
    null,
  );
});

test('baseline review images require lesson-bound PNG evidence or current material metadata', () => {
  const repoRoot = '/repo',
    lessonId = 'lesson',
    movieSha256 = 'c'.repeat(64),
    sourceFingerprint = 'd'.repeat(64);
  const encodedDirectory = '/repo/build/videos/lesson/encoded-review';
  const encodedSha256 = 'a'.repeat(64),
    sceneSha256 = 'b'.repeat(64),
    motionSha256 = 'e'.repeat(64),
    atlasSha256 = 'f'.repeat(64);
  const materialDirectory = 'build/youtube-review/materials/lesson';
  const atlasDirectory = 'build/video-review/materials/lesson';
  const materialMetadata = {
    id: lessonId,
    movieSha256,
    sourceFingerprint,
    sceneOverview: { path: `${materialDirectory}/scenes.png`, sha256: sceneSha256 },
    motionOverview: { path: `${materialDirectory}/motion.png`, sha256: motionSha256 },
  };
  const atlasMetadata = {
    schemaVersion: 1,
    id: lessonId,
    movieSha256,
    sourceFingerprint,
    image: `${atlasDirectory}/motion-all-scenes.png`,
    imageSha256: atlasSha256,
  };
  const expected = {
    movieSha256,
    sourceFingerprint,
    encodedDirectory,
    encodedArtifactHashes: { 'frames/sample.png': encodedSha256 },
    materialDirectories: [path.join(repoRoot, materialDirectory)],
    atlasDirectories: [path.join(repoRoot, atlasDirectory)],
    materialMetadata,
    atlasMetadata,
  };

  assert.deepEqual(
    bindBaselineReviewImage(
      repoRoot,
      lessonId,
      {
        path: 'build/videos/lesson/encoded-review/frames/sample.png',
        sha256: encodedSha256,
      },
      expected,
    ),
    {
      path: path.join(encodedDirectory, 'frames/sample.png'),
      sha256: encodedSha256,
      kind: 'encoded-review',
    },
  );
  assert.equal(
    bindBaselineReviewImage(
      repoRoot,
      lessonId,
      {
        path: `${materialDirectory}/scenes.png`,
        sha256: sceneSha256,
      },
      expected,
    ).kind,
    'scene-overview',
  );
  assert.equal(
    bindBaselineReviewImage(
      repoRoot,
      lessonId,
      {
        path: `${materialDirectory}/motion.png`,
        sha256: motionSha256,
      },
      expected,
    ).kind,
    'motion-overview',
  );
  assert.equal(
    bindBaselineReviewImage(
      repoRoot,
      lessonId,
      {
        path: `${atlasDirectory}/motion-all-scenes.png`,
        sha256: atlasSha256,
      },
      expected,
    ).kind,
    'motion-atlas',
  );
  assert.equal(
    reviewImageMetadataPath(
      repoRoot,
      lessonId,
      {
        path: `${materialDirectory}/scenes.png`,
        sha256: sceneSha256,
      },
      {
        materialDirectories: expected.materialDirectories,
        atlasDirectories: expected.atlasDirectories,
      },
    ),
    path.join(repoRoot, materialDirectory, 'material.json'),
  );
  assert.equal(
    reviewImageMetadataPath(repoRoot, lessonId, {
      path: `${materialDirectory}/scenes.png`,
      sha256: sceneSha256,
    }),
    null,
    'material paths must be under the configured lesson material directory',
  );
  assert.equal(
    bindBaselineReviewImage(
      repoRoot,
      lessonId,
      {
        path: 'build/other/materials/lesson/scenes.png',
        sha256: sceneSha256,
      },
      expected,
    ),
    null,
    'same bytes from an unrelated directory do not become lesson evidence',
  );
  assert.equal(
    bindBaselineReviewImage(
      repoRoot,
      lessonId,
      {
        path: `${materialDirectory}/notes.txt`,
        sha256: sceneSha256,
      },
      expected,
    ),
    null,
    'text files cannot be viewed-image evidence',
  );
  assert.equal(
    bindBaselineReviewImage(
      repoRoot,
      lessonId,
      {
        path: 'build/youtube-review/materials/other-lesson/scenes.png',
        sha256: sceneSha256,
      },
      { ...expected, materialMetadata: { ...materialMetadata, id: 'other-lesson' } },
    ),
    null,
  );
  assert.equal(
    bindBaselineReviewImage(
      repoRoot,
      lessonId,
      {
        path: `${atlasDirectory}/motion-all-scenes.png`,
        sha256: atlasSha256,
      },
      { ...expected, atlasMetadata: { ...atlasMetadata, sourceFingerprint: '0'.repeat(64) } },
    ),
    null,
  );
  assert.equal(
    bindBaselineReviewImage(repoRoot, lessonId, null, expected),
    null,
    'empty image evidence is rejected',
  );
});

test('review image content must carry the PNG file signature', () => {
  assert.equal(
    isPngSignature(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])),
    true,
  );
  assert.equal(isPngSignature(Buffer.from('plain text saved with a png suffix')), false);
});

test('automated verification stays distinct from human publication readiness', () => {
  const automated = assessRevisionPublicationReadiness({
    automatedVerificationPassed: true,
    captionsCurrent: true,
    auditBindings: { render: true, encoded: true, structural: true, textInk: true, motion: true },
    review: { status: 'pending', rows: [] },
  });
  assert.equal(automated.automatedVerificationPassed, true);
  assert.equal(automated.publicationReady, false);
  assert.equal(automated.status, 'automated checks passed · human review pending');

  const reviewed = assessRevisionPublicationReadiness({
    automatedVerificationPassed: true,
    captionsCurrent: true,
    auditBindings: { render: true, encoded: true, structural: true, textInk: true, motion: true },
    review: {
      status: 'current',
      rows: [
        {
          current: true,
          evidenceCurrent: true,
          readyForYoutube: true,
          blockers: [],
          matchesCurrentCheckout: false,
        },
      ],
    },
  });
  assert.equal(reviewed.publicationReady, true);
  assert.equal(reviewed.status, 'publication ready');
  assert.equal(
    assessRevisionPublicationReadiness({
      automatedVerificationPassed: true,
      captionsCurrent: true,
      auditBindings: { render: true, encoded: true, structural: true, textInk: true, motion: true },
      review: {
        status: 'current',
        rows: [
          {
            current: true,
            evidenceCurrent: true,
            readyForYoutube: true,
            blockers: ['fix required'],
          },
        ],
      },
    }).publicationReady,
    false,
  );
});

test('review player selects the staged replacement only after current-source render, decode and caption checks', () => {
  const baseline = {
    moviePath: 'canonical/lesson.mp4',
    posterPath: 'canonical/contact-sheet.png',
    captionsPath: 'canonical/lesson.vtt',
  };
  const revision = {
    matchesCurrentCheckout: true,
    renderPassed: true,
    encodedReview: { passed: true, contactSheet: 'staged/contact-sheet.png' },
    captions: { current: true },
    moviePath: 'staged/lesson.mp4',
    captionsPath: 'staged/lesson.vtt',
    publicationReady: false,
  };
  assert.deepEqual(selectReviewPlayer({ baseline, revision }), {
    useRevision: true,
    videoPath: 'staged/lesson.mp4',
    posterPath: 'staged/contact-sheet.png',
    captionsPath: 'staged/lesson.vtt',
    label: 'Latest render; review pending',
  });
  assert.deepEqual(
    selectReviewPlayer({ baseline, revision: { ...revision, matchesCurrentCheckout: false } }),
    {
      useRevision: false,
      videoPath: baseline.moviePath,
      posterPath: baseline.posterPath,
      captionsPath: baseline.captionsPath,
      label: 'Baseline render',
    },
  );
  assert.equal(
    selectReviewPlayer({ baseline, revision: { ...revision, captions: { current: false } } })
      .useRevision,
    false,
  );
});

test('prior keep and skip curation decisions are retained and hash-labeled', () => {
  const current = { sha256: 'video-now', fingerprint: 'source-now' };
  assert.deepEqual(
    reconcilePublicationSelection(
      {
        decision: 'keep',
        movieSha256: 'video-now',
        sourceFingerprint: 'source-now',
      },
      current,
    ),
    {
      decision: 'keep',
      reason: '',
      revisitCondition: '',
      scores: {},
      blockers: [],
      reviewedScenes: [],
      selectionScore: null,
      qualityScore: null,
      movieSha256: 'video-now',
      sourceFingerprint: 'source-now',
      movieCurrent: true,
      sourceCurrent: true,
      stale: false,
    },
  );
  const stale = reconcilePublicationSelection(
    { decision: 'skip', movieSha256: 'older', sourceFingerprint: 'source-now' },
    current,
  );
  assert.equal(stale.decision, 'skip');
  assert.equal(stale.stale, true);
  assert.equal(stale.movieCurrent, false);
});

test('HTML escaping covers values copied into reviewer-facing markup', () => {
  assert.equal(escapeHtml(`<svg a="x">'&`), '&lt;svg a=&quot;x&quot;&gt;&#39;&amp;');
});
