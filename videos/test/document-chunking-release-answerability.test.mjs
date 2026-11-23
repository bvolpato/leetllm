import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import {
  RELEASE_WORD_CAP,
  releaseComparison,
  releaseSnapshot,
  draw,
  balancedChildren,
  checkedParents,
  cosine,
  topicVector,
  freshEvidence,
  extendedFrame,
} from '../animations/document-chunking.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

test('the ten-word cutoff separates short incomplete context from the complete rule', () => {
  const candidates = releaseComparison();
  assert.equal(RELEASE_WORD_CAP, 10);
  assert.deepEqual(
    candidates.map((candidate) => [
      candidate.wordCount,
      candidate.withinCap,
      candidate.answerable,
      candidate.releasable,
    ]),
    [
      [5, true, false, false],
      [12, false, false, false],
      [10, true, true, true],
    ],
  );
  assert.deepEqual(
    candidates.map((candidate) => candidate.coverage),
    [
      { condition: true, deadline: false, identifier: false },
      { condition: false, deadline: true, identifier: true },
      { condition: true, deadline: true, identifier: true },
    ],
  );
});

test('the release scene reveals checks candidate by candidate and selects only the passing span', () => {
  assert.equal(releaseSnapshot(0, 0.5).visibleCount, 2);
  assert.equal(releaseSnapshot(1, 0.1).evaluatedCount, 1);
  assert.equal(releaseSnapshot(1, 0.8).evaluatedCount, 3);
  assert.equal(releaseSnapshot(2, 0.02).selected, null);
  const result = releaseSnapshot(2, 0.5);
  assert.equal(result.selected.id, 'complete-rule');
  assert.equal(result.selected.wordCount, result.wordCap);
  assert.equal(result.locator, 'incident-runbook-v3.pdf · page 7');
});
test('balanced source spans preserve the hard cap when the preferred minimum is impossible', () => {
  const source =
    'Page on-call within 15 minutes with deploy ID. Include the service name and rollback attempt.';
  const balanced = balancedChildren(source, 7, 4),
    impossible = balancedChildren(source, 7, 6);
  assert.deepEqual(
    balanced.map((x) => [x.length, x.start, x.end, x.review]),
    [
      [5, 0, 30, false],
      [5, 31, 58, false],
      [5, 59, 93, false],
    ],
  );
  for (const row of balanced) assert.equal(row.text, source.slice(row.start, row.end));
  assert.equal(balanced.map((x) => x.text).join(' '), source);
  assert.ok(
    impossible.every((row) => row.review && row.length <= 7),
    'An impossible preferred minimum must not silently enlarge the hard cap',
  );
});
test('parent authorization,version and whole-context budget reject independently before return', () => {
  assert.equal(checkedParents().words, 14);
  assert.equal(checkedParents({ version: 2 }).status, 'stale child-to-parent link');
  assert.equal(
    checkedParents({ version: 2, allowed: false, budget: 10 }).status,
    'parent access denied',
  );
  assert.equal(
    checkedParents({ budget: 10 }).status,
    'context budget exceeded; select smaller complete evidence',
  );
});
test('undefined topic direction and lost evidence cannot be certified by a source identity', () => {
  assert.deepEqual(topicVector('incident'), [0, 0]);
  assert.equal(cosine([0, 0], [1, 1]), null);
  assert.ok(Math.abs(cosine([2, 0], [1, 1]) - Math.SQRT1_2) < 1e-12);
  assert.equal(freshEvidence().complete, true);
  assert.equal(freshEvidence({ dropCondition: true }).complete, false);
  assert.equal(freshEvidence({ budget: 11 }).parentAdmitted, false);
  assert.equal(extendedFrame('earned-transfer', { beat: 0, beatP: 1, cues: {} }).freshStage, 0);
  assert.equal(
    extendedFrame('earned-transfer', {
      beat: 1,
      beatP: 1,
      cues: { 'fresh-budget-cut': { phase: 'during' } },
    }).freshStage,
    2,
  );
});

test('measured coverage phrases focus the spoken candidate checks through their highlight hold', async () => {
  registerLessonFonts();
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const lesson = await readLesson(
    new URL('../lessons/document-chunking.lesson.yaml', import.meta.url),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'evaluate-and-release');
  const scene = lesson.scenes[sceneIndex];
  const measured = (await loadMeasuredTimeline('document-chunking')).scenes[0];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const canvas = createCanvas(1920, 1080);
  for (const [id, expected] of [
    ['release-fragment-check-b2-1', 'condition ✓  ·  deadline ×  ·  deploy ID ×'],
    ['release-complete-rule-b2-2', 'condition ×  ·  deadline ✓  ·  deploy ID ✓'],
    ['release-all-fields-b2-3', 'condition ✓  ·  deadline ✓  ·  deploy ID ✓'],
  ]) {
    const cue = timing.visualCues.find((cue) => cue.id === id);
    assert(cue, `measured phrase ${id} must resolve`);
    for (const time of [
      cue.start - 0.04,
      cue.start + 0.08,
      (cue.start + cue.end) / 2,
      cue.end - 0.04,
      cue.end + cue.linger / 2,
      cue.end + cue.linger + 0.04,
    ]) {
      const state = frameState(timing, time, sceneIndex, lesson.scenes.length);
      const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
      assert.deepEqual(layoutIssues(audit), [], `${id} at ${time}s`);
      if (!state.cues[id].active) continue;
      const target = audit.targets.find((target) => target.id === 'release-coverage');
      assert(
        target && target.markCounts.labels >= 2,
        'focus must bind painted coverage and cutoff checks',
      );
      const labels = audit.labels.filter(
        (label) =>
          label.x >= target.x &&
          label.y >= target.y &&
          label.x + label.width <= target.x + target.width + 1 &&
          label.y + label.height <= target.y + target.height + 1,
      );
      assert(
        labels.some((label) => label.text === expected && label.alpha > 0.9),
        `${id} must keep its own candidate's coverage highlighted`,
      );
      assert(
        labels.some(
          (label) => ['within cutoff', 'over cutoff'].includes(label.text) && label.alpha > 0.9,
        ),
      );
    }
  }
});
