import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';
import { createHash } from 'node:crypto';
import { builders, acceptsWheel, member, projectLane, wheels } from './build.mjs';
import { runtimes, boundAccess, launchBind, mountFlags } from './runtime.mjs';
import {
  firstFailed,
  lastReports,
  practiceState,
  release,
  runJobEvents,
  SCORE_THRESHOLD_LINE,
  snapshot,
} from './release.mjs';
import { bench } from './artwork.mjs';
import {
  CHANGED_FIXTURE,
  CHANGED_FIXTURE_JSONL,
  FIXTURE,
  FRESH_FIXTURE,
  FRESH_REPAIRED,
  PROJECT_FILES,
} from '../../../films/docker-containerization-reproducible-ai/fixtures.mjs';
import {
  matchesReferenceReport,
  score,
  stageContents,
  teachingKeys,
  visibleFixture,
} from '../../../films/docker-containerization-reproducible-ai/model.mjs';

const chapters = [...builders, ...runtimes, ...release];
const settings = [
  'Image assembly',
  'Build inputs',
  'Build inputs',
  'Image assembly',
  'Image assembly',
  'Release platform',
  'Package installation',
  'Build cache',
  'Runtime inspection',
  'Runtime inspection',
  'Scorer assembly',
  'Input reader',
  'Engine host',
  'Persistent storage',
  'Service configuration',
  'Secret lifetime',
  'Layer inspection',
  'Device exposure',
  'Device exposure',
  'Report comparison',
  'Continuous integration',
  'Fresh clone',
  'Practice   /   read-path diagnosis',
];

function check() {
  assert.equal(chapters.length, 23);
  assert.deepEqual(PROJECT_FILES.map(projectLane), [
    'recipe',
    'builder',
    'runtime',
    'runtime',
    'excluded',
    'excluded',
    'excluded',
  ]);
  assert.deepEqual(stageContents(false), { env: {}, files: ['/opt/venv'] });
  assert.ok(stageContents(true).files.includes('/opt/helper.bin'));
  assert.equal(stageContents(true).env.TOOL_MODE, 'review');
  assert.deepEqual(
    ['amd64', 'arm64'].map((arch) => member(arch)),
    ['A', 'B'],
  );
  assert.deepEqual(
    ['amd64', 'arm64'].map((arch) => member(arch, 'arm64')),
    ['B', 'B'],
  );
  assert.equal(acceptsWheel(wheels[0], [wheels[0]]), true);
  assert.equal(acceptsWheel(wheels[1], [wheels[0]]), false);
  const baseline = teachingKeys(),
    source = teachingKeys({ source: 'script B' }),
    requirements = teachingKeys({ requirements: 'requirements B' });
  assert.equal(baseline.install, source.install);
  assert.notEqual(baseline.application, source.application);
  assert.notEqual(baseline.install, requirements.install);
  assert.equal(boundAccess(0), false);
  assert.equal(boundAccess(10001), true);
  assert.deepEqual(
    FIXTURE.map((row) => score([row]).matches),
    [1, 0, 1],
  );
  assert.equal(score(FIXTURE).threshold, true);
  assert.ok(score(FIXTURE).fraction < Number(score(FIXTURE).fraction.toFixed(3)));
  assert.equal(visibleFixture(FIXTURE, []).exitCode, 1);
  assert.deepEqual(visibleFixture(FIXTURE, []).storedRows, FIXTURE);
  assert.equal(visibleFixture(FIXTURE).report.matches, 2);
  const rejected = launchBind(false, '--mount'),
    created = launchBind(rejected.existsAfter, '-v'),
    retry = launchBind(created.existsAfter, '--mount');
  assert.deepEqual(
    [rejected, created, retry].map((run) => run.reporter),
    ['Docker Engine', 'scorer', 'scorer'],
  );
  assert.deepEqual(mountFlags(true, false), { root: 'read-only', bind: 'writable' });
  assert.deepEqual(
    [firstFailed(false, null, null), firstFailed(true, false, null), firstFailed(true, true, false)],
    [0, 1, 2],
  );
  const fixed = lastReports({ host: CHANGED_FIXTURE }),
    rebuilt = lastReports({ image: CHANGED_FIXTURE, host: CHANGED_FIXTURE });
  assert.deepEqual(
    fixed.map((r) => r.matches),
    [2, 3],
  );
  assert.deepEqual(
    rebuilt.map((r) => r.matches),
    [3, 3],
  );
  assert.deepEqual(
    fixed.map((result) => matchesReferenceReport(result, SCORE_THRESHOLD_LINE)),
    [true, false],
  );
  assert.ok(fixed.every((r) => r.threshold));
  const builds = ['build A', 'write A', 'build B'];
  assert.deepEqual(runJobEvents(builds), {
    tag: 'B', file: 'A', captured: null, baked: null, mounted: null,
  });
  const byTag = runJobEvents([...builds, 'read tag', 'baked', 'mounted']);
  assert.deepEqual([byTag.baked, byTag.mounted], ['B', 'B']);
  const byFile = [...builds, 'read file'];
  assert.deepEqual(runJobEvents([...byFile, 'baked']), {
    tag: 'B', file: 'A', captured: 'A', baked: 'A', mounted: null,
  });
  assert.deepEqual(runJobEvents([...byFile, 'baked', 'mounted']), {
    tag: 'B', file: 'A', captured: 'A', baked: 'A', mounted: 'A',
  });
  assert.equal(runJobEvents(['build A', 'read tag', 'build B', 'baked']).baked, 'A');
  const data = Buffer.from(CHANGED_FIXTURE_JSONL),
    snapshotResult = snapshot(data);
  assert.equal(snapshotResult.rows[1].prediction, 'blocked');
  assert.equal(snapshotResult.score.matches, 3);
  assert.equal(snapshotResult.sha, createHash('sha256').update(data).digest('hex'));
  const old = practiceState(false, false),
    edited = practiceState(true, false),
    rerun = practiceState(true, true);
  assert.deepEqual(edited.hostFile, FRESH_REPAIRED);
  assert.deepEqual(
    [old.hostReport, edited.hostReport, rerun.hostReport].map((s) => s.matches),
    [4, 4, 5],
  );
  assert.deepEqual(
    [old.hostReport, rerun.hostReport].map((s) => s.threshold),
    [false, true],
  );
  assert.deepEqual(
    old.hostFile.filter((r, i) => r.prediction !== FRESH_FIXTURE[i].prediction).map((r) => r.id),
    [305],
  );
  return true;
}

function draw(ctx, clock) {
  const { chapterIndex, chapterTitle, beatIndex } = clock.beat;
  const at = (beat, phrase, seconds = 0.48, captionStart) =>
    beatIndex === beat ? clock.reveal(phrase, seconds, { captionStart }) : Number(beatIndex > beat);
  const after = (beat, phrase) => {
    if (beatIndex !== beat) return beatIndex > beat;
    const { start, end } = clock.wordCue(phrase);
    return clock.reveal(phrase, end - start, { captionStart: phrase }) === 1;
  };
  const opening = chapterIndex === 0;
  const packaged = opening && at(1, 'Python three twelve');
  bench(
    ctx,
    packaged ? 'Give the scorer its own Python' : chapterTitle,
    opening && !packaged ? 'Runtime diagnosis' : settings[chapterIndex],
  );
  chapters[chapterIndex](ctx, {
    at,
    after,
    b: beatIndex,
    speechDone: clock.elapsed + 1e-9 >= clock.speechDuration,
  });
}

export default { title: 'Package and Prove a Reproducible Runtime', preparePicture: prepareCaptions, draw, check };
