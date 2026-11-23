import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as model from '../animations/docker-containerization-reproducible-ai.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();
const cue = (progress) => ({
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  progress,
  strength: 0,
  targets: [],
});
const paint = (id, beat, cues = {}, beatP = 0.5) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Which files does your container see?' },
    { beat, beatP, t: 10, duration: 30, opacity: 1, cues },
    model.draw,
  );

test('the rendered scorer normalizes labels and distinguishes its threshold from the reference report', () => {
  assert.deepEqual(model.score(model.FIXTURE), {
    matches: 2,
    total: 3,
    fraction: 2 / 3,
    threshold: true,
  });
  assert.equal(model.score([{ expected: ' BLOCKED ', prediction: 'blocked' }]).matches, 1);
  assert.equal(model.score([]).threshold, false);
  assert.equal(model.checkReport(model.FIXTURE).exact, true);
  assert.equal(model.checkReport(model.CHANGED_FIXTURE).threshold, true);
  assert.equal(model.checkReport(model.CHANGED_FIXTURE).exact, false);
  assert.equal(model.checkReport(model.FIXTURE, 'another-image').exact, false);
});

test('a bind mount replaces the path view while retaining the baked fixture and permits recovery', () => {
  const hidden = model.visibleFixture(model.FIXTURE, []);
  assert.equal(hidden.source, 'mount');
  assert.equal(hidden.missing, true);
  assert.equal(hidden.error, model.MISSING_FIXTURE_ERROR);
  assert.equal(hidden.exitCode, 1);
  assert.equal(hidden.storedRows, model.FIXTURE);
  assert.deepEqual(hidden.rows, []);
  const recovered = model.visibleFixture(hidden.storedRows);
  assert.equal(recovered.source, 'image');
  assert.equal(recovered.report.matches, 2);
  assert.equal(recovered.exitCode, 0);
  const changed = model.visibleFixture(model.FIXTURE, model.CHANGED_FIXTURE);
  assert.equal(changed.report.matches, 3);
  assert.equal(changed.storedRows[1].prediction, 'escalated');
});

test('the learner prediction holds the baked path until attachment and error follows the missing view', () => {
  const prediction = model.mountState({
    beat: 0,
    beatP: 0.9,
    cues: { 'mount-overlay': cue(0), 'mount-restore': cue(0), 'mount-failure': cue(0) },
  });
  assert.equal(prediction.source, 'image');
  assert.equal(prediction.missing, false);
  assert.equal(prediction.errorVisible, false);
  const attached = model.mountState({
    beat: 1,
    beatP: 0.5,
    cues: { 'mount-overlay': cue(1), 'mount-restore': cue(0), 'mount-failure': cue(0) },
  });
  assert.equal(attached.source, 'mount');
  assert.equal(attached.missing, true);
  assert.equal(attached.errorVisible, false);
  const failed = model.mountState({
    beat: 2,
    cues: { 'mount-overlay': cue(1), 'mount-restore': cue(0), 'mount-failure': cue(1) },
  });
  assert.equal(failed.errorVisible, true);
  const restored = model.mountState({
    beat: 3,
    cues: { 'mount-overlay': cue(1), 'mount-restore': cue(1), 'mount-failure': cue(1) },
  });
  assert.equal(restored.source, 'image');
  assert.equal(restored.errorVisible, false);
  assert.equal(restored.resultVisible, true);
});

test('dependency input identity survives a source edit and changes after a separate requirements edit', () => {
  const base = model.teachingKeys(),
    source = model.teachingKeys({ source: 'script B' }),
    dependencies = model.teachingKeys({ requirements: 'requirements B' });
  assert.equal(base.base, source.base);
  assert.equal(base.install, source.install);
  assert.notEqual(base.application, source.application);
  assert.notEqual(base.install, dependencies.install);
  assert.notEqual(base.application, dependencies.application);
  assert.equal(model.cacheState('requirements', 0.2).requirements, 'requirements A');
  assert.equal(model.cacheState('requirements', 0.4).install, base.install);
  assert.equal(model.cacheState('requirements', 1).install, dependencies.install);
});

test('row comparisons wait for their own words and the report survives container removal', () => {
  const cues = {
    'eval-first': cue(0),
    'eval-second': cue(0),
    'eval-third': cue(0),
    'eval-score': cue(0),
    'eval-count-gate': cue(0),
    'eval-exit': cue(0),
    'eval-remove': cue(0),
  };
  assert.equal(model.evaluationState({ beat: 0, cues }).read, 0);
  const first = model.evaluationState({ beat: 0, cues: { ...cues, 'eval-first': cue(1) } });
  assert.equal(first.read, 1);
  assert.equal(first.result.matches, 1);
  assert.equal(first.reportVisible, false);
  const final = model.evaluationState({
    beat: 2,
    cues: Object.fromEntries(Object.keys(cues).map((k) => [k, cue(1)])),
  });
  assert.equal(final.read, 3);
  assert.equal(final.result.matches, 2);
  assert.equal(final.reportVisible, true);
  assert.equal(final.removed, true);
});

test('build credentials disappear with the build step while runtime credentials require a separate mount', () => {
  const before = model.secretState({
    beat: 1,
    cues: {
      'secret-mount': cue(0),
      'secret-unmount': cue(0),
      'secret-output': cue(0),
      'secret-runtime': cue(0),
    },
  });
  assert.equal(before.buildMounted, false);
  assert.equal(before.layerHasCredential, false);
  const during = model.secretState({
    beat: 1,
    cues: {
      'secret-mount': cue(1),
      'secret-unmount': cue(0),
      'secret-output': cue(1),
      'secret-runtime': cue(0),
    },
  });
  assert.equal(during.buildMounted, true);
  assert.equal(during.outputReady, true);
  assert.equal(during.runtimeMounted, false);
  const after = model.secretState({
    beat: 2,
    cues: {
      'secret-mount': cue(1),
      'secret-unmount': cue(1),
      'secret-output': cue(1),
      'secret-runtime': cue(1),
    },
  });
  assert.equal(after.buildMounted, false);
  assert.equal(after.runtimeMounted, true);
  assert.equal(after.layerHasCredential, false);
});

test('all source-only illustrations fit at prediction, action and held-result states', () => {
  for (const [id, beats] of [
    ['opening', 2],
    ['context', 3],
    ['stages', 3],
    ['cache', 3],
    ['runtime', 2],
    ['evaluation', 3],
    ['mounts', 4],
    ['storage', 2],
    ['secrets', 3],
    ['gpu', 2],
    ['identity', 3],
  ]) {
    for (let beat = 0; beat < beats; beat++)
      for (const progress of [0, 0.425, 0.5, 1]) {
        const frame = paint(id, beat, {}, progress);
        assert.deepEqual(
          [...frame.issues, ...layoutIssues(frame)],
          [],
          `${id}/${beat}/${progress}`,
        );
      }
  }
});

test('pending cache and secret labels describe the state before the narrated action', () => {
  const cache = paint('cache', 2, { 'cache-dependency-edit': cue(0) });
  assert(cache.labels.some((label) => label.text === 'same install inputs'));
  assert(!cache.labels.some((label) => label.text === 'changed input: revisit install'));
  const secret = paint('secrets', 1, {
    'secret-mount': cue(0),
    'secret-unmount': cue(0),
    'secret-output': cue(0),
    'secret-runtime': cue(0),
  });
  assert(secret.labels.some((label) => label.text === 'Build secret · waiting'));
  assert(!secret.labels.some((label) => label.text === 'Build-secret mount ended'));
  const after = paint('secrets', 1, {
    'secret-mount': cue(1),
    'secret-unmount': cue(1),
    'secret-output': cue(1),
    'secret-runtime': cue(0),
  });
  assert(after.labels.some((label) => label.text === 'Build-secret mount ended'));
});

test('a fading container retains a painted focus target until its removal cue finishes', () => {
  const frame = paint('evaluation', 2, {
    'eval-exit': cue(1),
    'eval-remove': { ...cue(0.999), strength: 1, targets: ['container-exit'], color: 'yellow' },
    'eval-retain': cue(0),
  });
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  assert(frame.labels.some((label) => label.text === 'Removing C1'));
});

test('the actual scorer output label remains verbatim in both receipts', () => {
  const expected =
    'Eval rows: 3\nExact-match accuracy on tiny fixture: 0.667 (2/3)\nGate passed. You may commit.\n';
  const output = paint('evaluation', 1, { 'eval-score': cue(1), 'eval-count-gate': cue(1) });
  assert(
    output.labels.some(
      (label) => label.text === 'Exact-match accuracy on tiny fixture: 0.667 (2/3)',
    ),
  );
  assert.equal(model.referenceReport(), expected);
  const retained = paint('evaluation', 2, {
    'eval-exit': cue(1),
    'eval-remove': cue(1),
    'eval-retain': cue(1),
  });
  assert(retained.labels.some((label) => label.text === 'Exact-match accuracy on tiny fixture:'));
  assert(retained.labels.some((label) => label.text === '0.667 (2/3)'));
  assert.deepEqual([...retained.issues, ...layoutIssues(retained)], []);
});

test('the bind prediction keeps its repair and failure answer concealed', () => {
  const frame = paint('mounts', 0, {
    'mount-overlay': cue(0),
    'mount-failure': cue(0),
    'mount-restore': cue(0),
  });
  assert(
    frame.labels.some(
      (label) => label.text === 'Keep Image I1 fixed and follow /app/eval into the next run',
    ),
  );
  assert(!frame.labels.some((label) => /recreate without|ERROR:|exit 0/i.test(label.text)));
});

test('completed result cues govern the fresh threshold verdicts and same-image repair', () => {
  assert.equal(model.score(model.FRESH_FIXTURE).matches, 5);
  assert.equal(model.score(model.FRESH_MOUNTED).matches, 4);
  const held = paint('fresh-container', 1, {
    'dk-fresh-container-bakedmath': cue(1),
    'dk-fresh-container-baked': cue(0.999),
    'dk-fresh-container-mountmath': cue(1),
    'dk-fresh-container-mounted': cue(0.999),
  });
  assert(
    !held.labels.some((label) =>
      /threshold PASS|threshold FAIL|reference PASS|reference FAIL/.test(label.text),
    ),
  );
  const revealed = paint('fresh-container', 1, {
    'dk-fresh-container-baked': cue(1),
    'dk-fresh-container-mounted': cue(1),
  });
  assert(
    revealed.labels.some((label) => /0.714 · threshold PASS · reference PASS/.test(label.text)),
  );
  assert(
    revealed.labels.some((label) => /0.571 · threshold FAIL · reference FAIL/.test(label.text)),
  );
  const repaired = paint('fresh-container', 2, { 'dk-fresh-container-repair': cue(1) });
  assert.equal(repaired.labels.filter((label) => label.text === '5 matching / 7 rows').length, 2);
  assert(repaired.labels.some((label) => /Same image · one host-row repair/.test(label.text)));
});
