import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createCanvas } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import {
  buildCuration,
  publicationGate,
  reviewDigest,
  validateCompleteAssignment,
} from '../lib/curation.mjs';
import { currentSourceFingerprint } from '../lib/source-fingerprint.mjs';
import {
  parseAuditOptions,
  selectDensityLessons,
  textDensity,
  rectangleUnionArea,
} from '../audit-text-density.mjs';

const rubric = JSON.parse(fs.readFileSync(new URL('../curation-rubric.json', import.meta.url)));
const viewedPath = (id) => `build/fixture/encoded-review/scenes/${id}.png`;
const review = () => ({
  reviewer: 'independent',
  rubric: 'videos/curation-rubric.json',
  reason: 'The construction explains the mechanism.',
  recommendation: 'POST',
  overallScore: 92,
  dimensionScores: {
    visualExplanation: 33,
    construction: 18,
    density: 14,
    teachingArc: 14,
    narrationDirection: 8,
    finish: 5,
  },
  blockers: [],
  viewedImages: ['mechanism', 'payoff'].map((id) => ({ path: viewedPath(id) })),
  reviewedScenes: ['opening', 'mechanism', 'payoff'].map((id) => ({
    id,
    mechanism: 'Actual state changes.',
    visualGrade: 'strong',
    density: 'clear',
    deficiencyRemedy: 'No material deficiency.',
  })),
  inspectedTransformations: [
    { sceneId: 'mechanism', mechanism: 'Inputs accumulate into the result.' },
    { sceneId: 'payoff', mechanism: 'Perturbation changes the predicted outcome.' },
  ],
});
const evidence = {
  sceneIds: ['opening', 'mechanism', 'payoff'],
  imageEvidence: true,
  movieBound: true,
  sourceCurrent: true,
  registeredViewedImages: ['mechanism', 'payoff'].map((id) => ({
    path: viewedPath(id),
    relative: `scenes/${id}.png`,
  })),
};

test('publication requires positive judgment and complete exact evidence', () => {
  assert.equal(publicationGate(review(), rubric, evidence).decision, 'POST');
  for (const key of ['imageEvidence', 'movieBound', 'sourceCurrent'])
    assert.equal(
      publicationGate(review(), rubric, { ...evidence, [key]: false }).decision,
      'QUARANTINE',
    );
  const row = review();
  row.recommendation = 'REWORK';
  assert.equal(publicationGate(row, rubric, evidence).decision, 'QUARANTINE');
});
test('historical curation and current regenerated delivery have distinct render gates', () => {
  assert.equal(
    publicationGate(review(), rubric, { ...evidence, renderCurrent: false }).decision,
    'POST',
  );
  assert.equal(
    publicationGate(review(), rubric, {
      ...evidence,
      renderCurrent: false,
      requireCurrentRender: true,
    }).decision,
    'QUARANTINE',
  );
  assert.equal(
    publicationGate(review(), rubric, {
      ...evidence,
      renderCurrent: true,
      requireCurrentRender: true,
    }).decision,
    'POST',
  );
});
test('a high total cannot hide a weak main scene or a failed density floor', () => {
  const weak = review();
  weak.reviewedScenes[1].visualGrade = 'weak';
  assert.equal(publicationGate(weak, rubric, evidence).decision, 'QUARANTINE');
  const dense = review();
  Object.assign(dense.dimensionScores, { visualExplanation: 35, density: 12 });
  assert.equal(publicationGate(dense, rubric, evidence).decision, 'QUARANTINE');
  const paragraph = review();
  paragraph.reviewedScenes[1].density = 'text-dominant';
  assert.equal(publicationGate(paragraph, rubric, evidence).decision, 'QUARANTINE');
  const intro = review();
  intro.reviewedScenes.push({
    id: 'leetllm-intro',
    visualGrade: 'weak',
    mechanism: 'Short brand animation.',
    density: 'clear',
    deficiencyRemedy: 'Brand opening only.',
  });
  assert.equal(publicationGate(intro, rubric, evidence).decision, 'POST');
});
test('missing scene and unsupported causal claims cannot qualify', () => {
  const missing = review();
  missing.reviewedScenes.pop();
  assert.equal(publicationGate(missing, rubric, evidence).decision, 'QUARANTINE');
  const staticRow = review();
  staticRow.inspectedTransformations[1].sceneId = 'nonexistent';
  assert.equal(publicationGate(staticRow, rubric, evidence).decision, 'QUARANTINE');
});
test('review schema rejects invalid enums, rubric identity, and malformed evidence arrays', () => {
  const invalidGrade = review();
  invalidGrade.reviewedScenes[1].visualGrade = 'excellent';
  assert.equal(publicationGate(invalidGrade, rubric, evidence).decision, 'QUARANTINE');
  const invalidDensity = review();
  invalidDensity.reviewedScenes[1].density = 'adequate';
  assert.equal(publicationGate(invalidDensity, rubric, evidence).decision, 'QUARANTINE');
  const missingRubric = review();
  delete missingRubric.rubric;
  assert.equal(publicationGate(missingRubric, rubric, evidence).decision, 'QUARANTINE');
  const wrongRubric = review();
  wrongRubric.rubric = 'other-rubric.json';
  assert.equal(publicationGate(wrongRubric, rubric, evidence).decision, 'QUARANTINE');
  const malformedRubric = {
    ...rubric,
    sceneJudgmentEnums: { visualGrade: ['strong'], density: [] },
  };
  assert.equal(publicationGate(review(), malformedRubric, evidence).decision, 'QUARANTINE');
  for (const [key, malformed] of [
    ['blockers', 'none'],
    ['reviewedScenes', {}],
    ['inspectedTransformations', {}],
  ]) {
    const row = review();
    row[key] = malformed;
    assert.equal(
      publicationGate(row, rubric, evidence).decision,
      'QUARANTINE',
      `${key} must be an array`,
    );
  }
  const structuredBlocker = review();
  structuredBlocker.blockers = [
    {
      reason: 'weak-story-or-payoff',
      detail: 'A concrete ending is still missing.',
      remedy: 'Replay the same candidate through the final test.',
    },
  ];
  const structuredGate = publicationGate(structuredBlocker, rubric, evidence);
  assert.equal(structuredGate.reviewStatus, 'reviewed');
  assert.ok(structuredGate.issues.includes('Material blockers remain'));
});
test('review aliases bind to personally viewed scene sheets without inventing evidence', () => {
  const row = review();
  const scene = row.reviewedScenes.find((item) => item.id === 'mechanism');
  scene.visualMechanism = scene.mechanism;
  delete scene.mechanism;
  row.inspectedTransformations[0] = {
    scene: 'mechanism/detail',
    visualMechanism: 'The source value changes the visible result.',
  };
  const gate = publicationGate(row, rubric, evidence);
  assert.equal(gate.decision, 'POST');
  assert.equal(gate.inspectedTransformations[0].sceneId, 'mechanism');
  assert.equal(
    gate.inspectedTransformations[0].mechanism,
    'The source value changes the visible result.',
  );
  assert.equal(
    gate.inspectedTransformations[0].evidenceBinding,
    'inferred-from-viewed-scene-sheet',
  );
  assert.deepEqual(gate.inspectedTransformations[0].viewedImagePaths, [viewedPath('mechanism')]);
});
test('slash-qualified transformation strings bind only when an authored scene matches', () => {
  const row = review();
  row.inspectedTransformations = [
    'mechanism/detail: The source value changes the visible result.',
    'payoff: The changed prediction matches the measured outcome.',
  ];
  const gate = publicationGate(row, rubric, evidence);
  assert.equal(gate.decision, 'POST');
  assert.deepEqual(
    gate.inspectedTransformations.map((item) => item.sceneId),
    ['mechanism', 'payoff'],
  );
  assert.deepEqual(
    gate.inspectedTransformations.map((item) => item.evidenceBinding),
    ['inferred-from-viewed-scene-sheet', 'inferred-from-viewed-scene-sheet'],
  );
});
test('unscoped legacy transformation notes stay supplemental for quarantine reviews', () => {
  const row = review();
  row.recommendation = 'REWORK';
  row.inspectedTransformations = [
    'The first example changes the model state.',
    'The final example measures the consequence.',
  ];
  const gate = publicationGate(row, rubric, evidence);
  assert.equal(gate.decision, 'QUARANTINE');
  assert.equal(gate.reviewStatus, 'reviewed');
  assert.equal(gate.inspectedTransformations[0].mechanism, row.inspectedTransformations[0]);
  assert.equal(gate.inspectedTransformations[0].evidenceBinding, 'unbound');
  const post = review();
  post.inspectedTransformations = row.inspectedTransformations;
  assert.equal(publicationGate(post, rubric, evidence).decision, 'QUARANTINE');
  assert.equal(publicationGate(post, rubric, evidence).reviewStatus, 'needs-verification');
  const noObservations = review();
  noObservations.recommendation = 'REWORK';
  delete noObservations.inspectedTransformations;
  const emptyGate = publicationGate(noObservations, rubric, evidence);
  assert.equal(emptyGate.reviewStatus, 'reviewed');
  assert.deepEqual(emptyGate.inspectedTransformations, []);
  const missingPostEvidence = review();
  delete missingPostEvidence.inspectedTransformations;
  assert.equal(publicationGate(missingPostEvidence, rubric, evidence).decision, 'QUARANTINE');
});
test('duplicate transformations and explicit unviewed image paths cannot qualify', () => {
  const duplicate = review();
  duplicate.inspectedTransformations[1] = { ...duplicate.inspectedTransformations[0] };
  assert.equal(publicationGate(duplicate, rubric, evidence).decision, 'QUARANTINE');
  const forged = review();
  forged.inspectedTransformations[0].viewedImagePaths = ['scenes/not-viewed.png'];
  const gate = publicationGate(forged, rubric, evidence);
  assert.equal(gate.decision, 'QUARANTINE');
  assert.ok(
    gate.issues.includes(
      'Transformation references an image that was not personally viewed and registered',
    ),
  );
  assert.deepEqual(gate.inspectedTransformations[0].viewedImagePaths, []);
  const singular = review();
  singular.inspectedTransformations[0].viewedImagePath = 'scenes/not-viewed.png';
  assert.equal(publicationGate(singular, rubric, evidence).decision, 'QUARANTINE');
});
test('density CLI rejects missing values, unknown lesson IDs, and empty assignments', () => {
  assert.throws(
    () => parseAuditOptions(['--assignment', 'assignment.json', '--output']),
    /Missing value for --output/,
  );
  assert.throws(
    () => parseAuditOptions(['--assignment', '--output', 'report.json']),
    /Missing value for --assignment/,
  );
  assert.throws(
    () =>
      parseAuditOptions(['--assignment', 'assignment.json', '--output', 'report.json', '--lesson']),
    /Missing value for --lesson/,
  );
  const options = parseAuditOptions([
    '--assignment',
    'assignment.json',
    '--output',
    'report.json',
    '--lesson',
    'missing',
  ]);
  assert.throws(
    () => selectDensityLessons({ lessons: [{ id: 'known' }] }, options.lessonIds),
    /Unknown lesson ID: missing/,
  );
  assert.throws(() => selectDensityLessons({ lessons: [] }, []), /at least one lesson/);
});
test('density counts visible context, separates math and numbers, and clips to the teaching area', () => {
  const label = { x: 200, y: 300, width: 100, height: 30, text: 'three words here', alpha: 0.26 };
  const result = textDensity([
    label,
    { ...label, y: 350, alpha: 0.24 },
    { ...label, y: 400, text: '2 3.5' },
    { ...label, y: 450, text: 'x + y', kind: 'math' },
    { ...label, y: 50 },
  ]);
  assert.equal(result.visibleWords, 5);
  assert.equal(result.proseWords, 3);
  assert.equal(result.numericTokens, 2);
  assert.equal(result.foregroundWords, 0);
  assert.equal(result.mathObjects, 1);
  assert.equal(
    rectangleUnionArea([
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 5, y: 0, width: 10, height: 10 },
    ]),
    150,
  );
});

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixtureId = 'hybrid-search';
const pixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ZtwAAAAASUVORK5CYII=',
  'base64',
);
const nativePng = createCanvas(1920, 1080).toBuffer('image/png');
const digest = (bytes) => reviewDigest(bytes);
const sourceContext = await (async () => {
  const markup = await fsPromises.readFile(
    path.join(repoRoot, `videos/lessons/${fixtureId}.lesson.yaml`),
  );
  const animation = await fsPromises.readFile(
    path.join(repoRoot, `videos/animations/${fixtureId}.mjs`),
  );
  const lesson = parseYaml(markup.toString());
  return {
    lesson,
    sourceFingerprint: await currentSourceFingerprint(repoRoot, fixtureId, {}),
    articleSha256: digest(
      await fsPromises.readFile(path.join(repoRoot, 'web/src/content', lesson.source)),
    ),
    authoredSourceSha256: { markup: digest(markup), animation: digest(animation) },
  };
})();

async function makeBuildFixture(scenario = 'valid') {
  const temp = await fsPromises.realpath(
    await fsPromises.mkdtemp(path.join(os.tmpdir(), 'leetllm-curation-')),
  );
  const physical = path.join(temp, 'physical'),
    encoded = path.join(physical, 'encoded-review');
  const deliveryAlias = path.join(temp, 'delivery'),
    renderAlias = path.join(temp, 'render');
  await fsPromises.mkdir(path.join(encoded, 'scenes'), { recursive: true });
  await fsPromises.mkdir(path.join(encoded, 'frames'), { recursive: true });
  await fsPromises.symlink(physical, deliveryAlias, 'dir');
  await fsPromises.symlink(physical, renderAlias, 'dir');

  const imageFiles = [];
  const sheetIds = ['leetllm-intro', ...sourceContext.lesson.scenes.map((scene) => scene.id)];
  for (const id of [...sheetIds, ...(scenario === 'unviewed-extra-sheet' ? ['extra'] : [])]) {
    const relative = `scenes/${id}.png`,
      file = path.join(encoded, relative);
    await fsPromises.writeFile(file, pixelPng);
    imageFiles.push({ relative, file });
  }
  for (const number of [1, 2, 3]) {
    const extension = scenario === 'non-png-extension' && number === 3 ? 'jpg' : 'png';
    const relative = `frames/sample-${String(number).padStart(4, '0')}.${extension}`,
      file = path.join(encoded, relative);
    const bytes =
      scenario === 'non-png-signature' && number === 3
        ? Buffer.from('this is text')
        : scenario === 'short-png' && number === 3
          ? Buffer.from('89504e470d0a1a0a', 'hex')
          : scenario === 'thumbnail' && number === 3
            ? pixelPng
            : scenario === 'undecodable-png' && number === 3
              ? nativePng.subarray(0, 33)
              : nativePng;
    await fsPromises.writeFile(file, bytes);
    imageFiles.push({ relative, file });
  }
  let escapedFile;
  if (scenario === 'escape') {
    escapedFile = path.join(temp, 'outside.png');
    await fsPromises.writeFile(escapedFile, pixelPng);
    const link = path.join(encoded, 'frames/sample-0003.png');
    await fsPromises.unlink(link);
    await fsPromises.symlink(escapedFile, link);
  }

  const artifactSha256 = {};
  for (const { relative, file } of imageFiles)
    artifactSha256[relative] = digest(await fsPromises.readFile(file));
  const movie = Buffer.from('fixture mp4 bytes'),
    movieSha256 = digest(movie),
    sourceFingerprint = sourceContext.sourceFingerprint;
  await fsPromises.writeFile(path.join(physical, `${fixtureId}.mp4`), movie);
  await fsPromises.writeFile(
    path.join(physical, 'verification.json'),
    JSON.stringify({
      source: sourceContext.lesson.source,
      sourceSha256: scenario === 'stale-article' ? '0'.repeat(64) : sourceContext.articleSha256,
      sha256: movieSha256,
      fingerprint: sourceFingerprint,
      width: 1920,
      height: 1080,
      frameAudit: { frames: 100 },
      brandIntro: scenario === 'missing-brand' ? null : { duration: 4 },
      artifactSha256: { [`${fixtureId}.mp4`]: movieSha256 },
    }),
  );
  const samples = imageFiles
    .filter(({ relative }) => relative.startsWith('frames/'))
    .map(({ relative }, index) => ({
      image: relative,
      frame: scenario === 'duplicate-sample-frame' && index === 2 ? 1 : index + 1,
      time: (index + 1) / 30,
    }));
  if (scenario === 'unregistered-sample') samples.pop();
  await fsPromises.writeFile(
    path.join(encoded, 'verification.json'),
    JSON.stringify({
      videoSha256: movieSha256,
      artifactSha256,
      samples,
      sceneSheets: sheetIds.map((scene) => ({ scene, image: `scenes/${scene}.png` })),
    }),
  );

  const sceneIds = sourceContext.lesson.scenes.map((scene) => scene.id);
  const viewedImages = [
    ...sheetIds
      .filter((id) => scenario !== 'unviewed-intro' || id !== 'leetllm-intro')
      .map((id) => ({
        path: path.join(renderAlias, 'encoded-review', `scenes/${id}.png`),
        sha256: artifactSha256[`scenes/${id}.png`],
      })),
    ...[1, 2, 3].map((number) => {
      const ext = scenario === 'non-png-extension' && number === 3 ? 'jpg' : 'png';
      const relative = `frames/sample-${String(number).padStart(4, '0')}.${ext}`;
      return {
        path: path.join(renderAlias, 'encoded-review', relative),
        sha256: artifactSha256[relative],
      };
    }),
  ];
  if (scenario === 'missing')
    viewedImages.at(-1).path = path.join(renderAlias, 'encoded-review/frames/not-present.png');
  if (scenario === 'mismatched-sha') viewedImages.at(-1).sha256 = '0'.repeat(64);

  const firstMechanism = sceneIds[1],
    finalScene = sceneIds.at(-1);
  const row = {
    id: fixtureId,
    reviewer: 'temporary-fixture',
    rubric: 'videos/curation-rubric.json',
    reason: 'The examples show the mechanism and its payoff.',
    recommendation: 'POST',
    overallScore: 92,
    dimensionScores: {
      visualExplanation: 33,
      construction: 18,
      density: 14,
      teachingArc: 14,
      narrationDirection: 8,
      finish: 5,
    },
    blockers: [],
    movieSha256,
    sourceFingerprint,
    authoredSourceSha256: sourceContext.authoredSourceSha256,
    viewedImages,
    reviewedScenes: sceneIds.map((id) => ({
      id,
      mechanism: 'The visible state changes for a stated reason.',
      visualGrade: 'strong',
      density: 'clear',
      deficiencyRemedy: 'No material deficiency.',
    })),
    inspectedTransformations: [
      {
        sceneId: firstMechanism,
        mechanism: 'The input changes the visible candidate order.',
        viewedImagePath: path.join(encoded, `scenes/${firstMechanism}.png`),
      },
      {
        sceneId: finalScene,
        mechanism: 'Changing the cutoff changes which source reaches context.',
      },
    ],
  };
  const reviewFile = path.join(temp, 'review.json');
  await fsPromises.writeFile(reviewFile, JSON.stringify({ reviews: [row] }));
  const assignment = {
    lessons: [
      {
        id: fixtureId,
        source: sourceContext.lesson.source,
        sourceDirectory: deliveryAlias,
        movieSha256,
        sourceFingerprint,
        authoredSourceSha256: sourceContext.authoredSourceSha256,
        sourceContext: { article: { sha256: sourceContext.articleSha256 } },
      },
    ],
  };
  return { temp, encoded, assignment, reviewFile };
}

test('buildCuration resolves equivalent encoded-review symlink aliases and canonical transformation paths', async (t) => {
  const fixture = await makeBuildFixture();
  t.after(() => fsPromises.rm(fixture.temp, { recursive: true, force: true }));
  const result = await buildCuration({
    root: repoRoot,
    assignment: fixture.assignment,
    reviewFiles: [fixture.reviewFile],
    rubric,
  });
  assert.equal(result.lessons[0].decision, 'POST');
  assert.equal(result.lessons[0].reviewStatus, 'reviewed');
  assert.match(
    result.lessons[0].inspectedTransformations[0].viewedImagePaths[0],
    /\/render\/encoded-review\/scenes\//,
  );
  assert.equal(
    result.lessons[0].inspectedTransformations[0].evidenceBinding,
    'explicit-viewed-image-reference',
  );
  assert.equal(
    result.lessons[0].inspectedTransformations[1].evidenceBinding,
    'inferred-from-viewed-scene-sheet',
  );
});

test('buildCuration quarantines escaped, mismatched, non-PNG, and missing viewed evidence without aborting', async (t) => {
  const cases = [
    ['escape', /Viewed image escapes encoded-review root/],
    ['mismatched-sha', /Viewed image checksum does not match encoded-review registry/],
    ['non-png-signature', /Viewed image is not a PNG/],
    ['short-png', /Viewed image is not a PNG/],
    ['non-png-extension', /Viewed image is not a PNG/],
    ['missing', /Missing viewed image/],
  ];
  for (const [scenario, issue] of cases) {
    const fixture = await makeBuildFixture(scenario);
    try {
      const result = await buildCuration({
        root: repoRoot,
        assignment: fixture.assignment,
        reviewFiles: [fixture.reviewFile],
        rubric,
      });
      assert.equal(result.lessons[0].decision, 'QUARANTINE', scenario);
      assert.equal(result.lessons[0].reviewStatus, 'needs-verification', scenario);
      assert.ok(
        result.lessons[0].gateIssues.some((message) => issue.test(message)),
        scenario,
      );
    } finally {
      await fsPromises.rm(fixture.temp, { recursive: true, force: true });
    }
  }
});

test('POST requires every registered scene sheet and three distinct decoded native samples', async () => {
  for (const [scenario, issue] of [
    ['missing-brand', /brand intro is missing/],
    ['unviewed-intro', /Scene sheets not viewed:.*leetllm-intro/],
    ['unviewed-extra-sheet', /Scene sheets not viewed:.*extra/],
    ['thumbnail', /Viewed native frame is not 1920x1080/],
    ['undecodable-png', /Unable to read viewed image/],
    ['unregistered-sample', /Viewed frame is not an encoded native sample/],
    ['duplicate-sample-frame', /duplicate images or frame numbers/],
  ]) {
    const fixture = await makeBuildFixture(scenario);
    try {
      const result = await buildCuration({
        root: repoRoot,
        assignment: fixture.assignment,
        reviewFiles: [fixture.reviewFile],
        rubric,
      });
      assert.equal(result.lessons[0].decision, 'QUARANTINE', scenario);
      assert.ok(
        result.lessons[0].gateIssues.some((message) => issue.test(message)),
        `${scenario}: ${result.lessons[0].gateIssues.join('; ')}`,
      );
    } finally {
      await fsPromises.rm(fixture.temp, { recursive: true, force: true });
    }
  }
});

test('current-render publication binds the canonical article while historical review stays explicit', async (t) => {
  const valid = await makeBuildFixture(),
    stale = await makeBuildFixture('stale-article');
  t.after(() =>
    Promise.all(
      [valid, stale].map((fixture) =>
        fsPromises.rm(fixture.temp, { recursive: true, force: true }),
      ),
    ),
  );
  const run = (fixture, requireCurrentRender) =>
    buildCuration({
      root: repoRoot,
      assignment: fixture.assignment,
      reviewFiles: [fixture.reviewFile],
      rubric,
      requireCurrentRender,
    });
  assert.equal((await run(valid, true)).lessons[0].decision, 'POST');
  const historical = await run(stale, false),
    current = await run(stale, true);
  assert.equal(historical.lessons[0].decision, 'POST');
  assert.equal(historical.lessons[0].evidence.articleCurrent, null);
  assert.equal(current.lessons[0].decision, 'QUARANTINE');
  assert.equal(current.lessons[0].evidence.articleCurrent, false);
  assert.ok(
    current.lessons[0].gateIssues.includes(
      'Current canonical article differs from the reviewed render source',
    ),
  );
});

test('buildCuration rejects duplicate assignment IDs before loading reviews', async () => {
  await assert.rejects(
    buildCuration({
      root: path.join(os.tmpdir(), 'missing-curation-root'),
      assignment: { lessons: [{ id: 'duplicate' }, { id: 'duplicate' }] },
      reviewFiles: ['missing-review.json'],
      rubric,
    }),
    /Duplicate curation assignment: duplicate/,
  );
});

test('complete curation rejects waiting and partial assignments before reading review artifacts', async () => {
  for (const assignment of [
    { status: 'waiting', lessons: [], pendingIds: ['bayes'] },
    { status: 'partial', lessons: [{ id: 'bayes' }], pending: [{ id: 'probability' }] },
    { status: 'ready', lessons: [{ id: 'bayes' }] },
  ]) {
    await assert.rejects(
      buildCuration({
        root: repoRoot,
        assignment,
        reviewFiles: ['missing-review.json'],
        rubric,
        requireComplete: true,
        requireCurrentRender: true,
      }),
      /assignment is not ready|complete canonical lesson order/,
    );
  }
  const subset = await buildCuration({
    root: repoRoot,
    assignment: { status: 'partial', lessons: [], pendingIds: ['bayes'] },
    reviewFiles: [],
    rubric,
  });
  assert.equal(subset.summary.total, 0);
});

test('curate --require-complete refuses an empty ready-only assignment without writing a final catalog', async (t) => {
  const temporary = await fsPromises.mkdtemp(
    path.join(os.tmpdir(), 'leetllm-incomplete-curation-'),
  );
  t.after(() => fsPromises.rm(temporary, { recursive: true, force: true }));
  const assignmentFile = path.join(temporary, 'assignment.json'),
    reviews = path.join(temporary, 'reviews'),
    output = path.join(temporary, 'catalog.json');
  await fsPromises.mkdir(reviews);
  await fsPromises.writeFile(
    assignmentFile,
    JSON.stringify({ status: 'waiting', lessons: [], pendingIds: ['bayes'] }),
  );
  const command = spawnSync(
    process.execPath,
    [
      'videos/curate.mjs',
      '--assignment',
      assignmentFile,
      '--reviews',
      reviews,
      '--output',
      output,
      '--require-complete',
      '--require-current-render',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(command.status, 1, command.stderr);
  assert.match(command.stderr, /Curation assignment is not ready: waiting/);
  await assert.rejects(fsPromises.access(output), { code: 'ENOENT' });
});

test('complete assignments bind the canonical IDs and current collection while historical assignments stay usable', () => {
  const collectionBytes = fs.readFileSync(
    new URL('../collections/complete-curriculum.json', import.meta.url),
  );
  const collection = JSON.parse(collectionBytes),
    collectionSha256 = digest(collectionBytes);
  const lessons = collection.lessons.map(({ id }) => ({ id }));
  const binding = {
    id: collection.id,
    version: collection.version,
    path: 'videos/collections/complete-curriculum.json',
    sha256: collectionSha256,
  };
  assert.doesNotThrow(() => validateCompleteAssignment({ lessons }, collection, collectionSha256));
  const current = {
    lessons,
    status: 'ready',
    readyIds: lessons.map((row) => row.id),
    pendingIds: [],
    pending: [],
    collection: binding,
  };
  assert.doesNotThrow(() => validateCompleteAssignment(current, collection, collectionSha256));
  assert.throws(
    () =>
      validateCompleteAssignment(
        { ...current, pendingIds: ['bayes'] },
        collection,
        collectionSha256,
      ),
    /still has pendingIds/,
  );
  assert.throws(
    () =>
      validateCompleteAssignment(
        { ...current, pending: [{ id: 'bayes' }] },
        collection,
        collectionSha256,
      ),
    /still has pending/,
  );
  assert.throws(
    () => validateCompleteAssignment({ ...current, readyIds: [] }, collection, collectionSha256),
    /ready IDs/,
  );
  assert.throws(
    () =>
      validateCompleteAssignment(
        { ...current, collection: { ...binding, sha256: '0'.repeat(64) } },
        collection,
        collectionSha256,
      ),
    /collection binding/,
  );
  assert.throws(
    () =>
      validateCompleteAssignment(
        { ...current, lessons: [...lessons].reverse() },
        collection,
        collectionSha256,
      ),
    /canonical lesson order/,
  );
});
