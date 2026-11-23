import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  draw as drawContextEngineering,
  sampleModel,
  validateModel,
} from '../animations/context-engineering.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

registerLessonFonts();

async function measuredCandidateCue() {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/context-engineering.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'evaluate');
  assert.notEqual(sceneIndex, -1);
  const timeline = await loadMeasuredTimeline('context-engineering');
  const measured = timeline.scenes.find((scene) => scene.id === 'evaluate');
  const authored = lesson.scenes[sceneIndex];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(authored, measured),
    cueTiming: 'provider-words',
  };
  const cue = timing.visualCues.find(
    (item) => item.phrase === 'The candidate packet supplies five answers',
  );
  assert(cue, 'the candidate tally phrase must resolve from provider-word timing');
  const time = cue.start + (cue.end - cue.start) / 2;
  return {
    lesson,
    scene: authored,
    state: frameState(timing, time, sceneIndex, lesson.scenes.length),
    cue,
  };
}

function paint(lesson, scene, state) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(canvas.getContext('2d'), lesson, scene, state, drawContextEngineering);
}

test('the measured five-answer phrase focuses candidate evidence and its computed tally', async () => {
  assert.equal(validateModel(), true);
  const sample = await measuredCandidateCue();
  const current = sampleModel('evaluate', sample.state);
  assert.equal(current.baseline.score, 4);
  assert.equal(current.candidate.score, 5);
  assert.equal(current.candidate.criticalPass, false);
  const candidateAuthorizer = current.candidate.rows.find((row) => row.source === 'D4');
  assert.equal(candidateAuthorizer.answer, 'unknown');
  assert.equal(candidateAuthorizer.pass, false);
  assert.equal(candidateAuthorizer.critical, true);

  const audit = paint(sample.lesson, sample.scene, sample.state);
  const candidateRows = audit.targets.filter(
    (part) => part.id === 'evaluate-object-candidate-pass-answer-found-unknown-38',
  );
  const candidateTally = audit.targets.find(
    (part) => part.id === 'evaluate-object-candidate-tally',
  );
  assert.equal(candidateRows.length, 6, 'all six candidate row results should be present');
  assert(
    candidateRows.every((part) => part.alpha > 0.9),
    'candidate row results should be highlighted during the claim',
  );
  assert(
    candidateTally && candidateTally.alpha > 0.9,
    'the actual candidate score should be highlighted',
  );
  assert(audit.labels.some((label) => label.text === '· candidate 5/6'));

  const baselineTally = audit.targets.find((part) => part.id === 'evaluate-object-baseline-tally');
  assert(
    baselineTally && baselineTally.alpha < candidateTally.alpha,
    'baseline count should remain context',
  );
  assert(sample.cue.targets.includes('evaluate-object-candidate-pass-answer-found-unknown-38'));
  assert(sample.cue.targets.includes('evaluate-object-candidate-tally'));
});

test('the critical authorizer omission still rejects the candidate after the cue', () => {
  const protectedCase = sampleModel('evaluate', { beat: 2, beatP: 0 });
  const candidateAuthorizer = protectedCase.candidate.rows.find((row) => row.source === 'D4');
  assert.equal(candidateAuthorizer.answer, 'unknown');
  assert.equal(candidateAuthorizer.pass, false);
  assert.equal(candidateAuthorizer.critical, true);
  assert.equal(protectedCase.candidate.score, 5);
  assert.equal(protectedCase.approved, false);
});

test('untimed source previews sequence the two derived findings through the same clear transfer lane', () => {
  for (let step = 0; step <= 40; step++) {
    const audit = paint(
      {},
      { id: 'write', title: 'Store checked findings' },
      { beat: 0, beatP: step / 40, opacity: 1 },
    );
    assert.deepEqual(
      [...(audit.issues ?? []), ...layoutIssues(audit)],
      [],
      'fallback construction at ' + step / 40,
    );
  }
});

test('the probe difference uses numeric operands only after both supplied success fractions are revealed', () => {
  const render = (after) =>
    paint(
      {},
      { id: 'capacity-and-evidence', title: 'Compare the same supplied probe' },
      {
        beat: 3,
        beatP: 0.99,
        opacity: 1,
        cues: Object.fromEntries(
          ['ce-position-ten', 'ce-position-seven', 'ce-position-difference'].map((id) => [
            id,
            {
              phase: after.includes(id) ? 'after' : 'before',
              progress: after.includes(id) ? 1 : 0,
            },
          ]),
        ),
      },
    );
  const before = render([]),
    first = render(['ce-position-ten']),
    both = render(['ce-position-ten', 'ce-position-seven']),
    done = render(['ce-position-ten', 'ce-position-seven', 'ce-position-difference']);
  for (const a of [before, first])
    assert(
      !a.labels.some((l) => l.kind === 'math' && l.text.includes(String.raw`{10\over12}`)),
      'unearned numeric subtraction operands must remain hidden',
    );
  assert(
    both.labels.some(
      (l) =>
        l.kind === 'math' &&
        l.text.includes(String.raw`{10\over12}`) &&
        l.text.includes(String.raw`{7\over12}`),
    ),
  );
  assert(!both.labels.some((l) => l.text === '25 percentage points'));
  assert(done.labels.some((l) => l.text === '25 percentage points'));
});
