import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { draw as drawHypothesis, paired } from '../animations/hypothesis-testing.mjs';
import {
  draw as drawPrompt,
  sampleModel as promptModel,
} from '../animations/prompt-engineering-fundamentals.mjs';
import {
  draw as drawTraining,
  microbatchGradients,
  sampleModel as trainingModel,
} from '../animations/training-backpropagation-gradient-descent.mjs';
import { confusionFrame, draw as drawLogistic } from '../animations/logistic-regression.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

registerLessonFonts();

async function measuredCue(lessonId, sceneId, phrase) {
  const lesson = await readLesson(path.join(root, `videos/lessons/${lessonId}.lesson.yaml`), root);
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === sceneId);
  assert.notEqual(sceneIndex, -1, `${lessonId}/${sceneId} must exist`);
  const timeline = await loadMeasuredTimeline(lessonId);
  const measured = timeline.scenes.find((scene) => scene.id === sceneId);
  const authored = lesson.scenes[sceneIndex];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(authored, measured),
    cueTiming: 'provider-words',
  };
  const cue = timing.visualCues.find((item) => item.id === phrase || item.phrase === phrase);
  assert(cue, `${lessonId}/${sceneId} must resolve measured phrase: ${phrase}`);
  const time = cue.start + (cue.end - cue.start) / 2;
  const state = frameState(timing, time, sceneIndex, lesson.scenes.length);
  return { lesson, scene: authored, timing, cue, time, state };
}

function paint(lesson, scene, state, draw) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
}

function normalizedTaskId(task) {
  return task
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function expectedCellTarget(row, model) {
  const other = model === 'a' ? 'b' : 'a';
  const relation = row[model] === row[other] ? 'shared' : row[model] ? 'only-pass' : 'only-fail';
  return `model-${model}-${relation}-${normalizedTaskId(row.task)}`;
}

function target(audit, id) {
  const result = audit.targets.find((part) => part.id === id);
  assert(result, `painted semantic target ${id} must be visible during its measured phrase`);
  return result;
}

test('paired model explanations keep the B-only win and lift contribution attached to permission when rows reorder', async () => {
  const original = paired.slice();
  try {
    const permission = paired.find((row) => row.task === 'permission');
    assert(permission && permission.a === 0 && permission.b === 1);
    paired.splice(0, paired.length, ...paired.filter((row) => row !== permission), permission);
    const rowIndex = paired.indexOf(permission);
    const aTarget = expectedCellTarget(permission, 'a');
    const bTarget = expectedCellTarget(permission, 'b');

    const intro = await measuredCue('hypothesis-testing', 'intro', 'One task passes for Model B');
    assert.deepEqual(intro.cue.targets, [aTarget, bTarget]);
    const introAudit = paint(intro.lesson, intro.scene, intro.state, drawHypothesis);
    assert.equal(target(introAudit, aTarget).x, 235 + rowIndex * 245);
    assert.equal(target(introAudit, bTarget).x, 235 + rowIndex * 245);

    const lift = await measuredCue('hypothesis-testing', 'paired-design', 'pair-lift');
    assert(lift.cue.targets.includes('paired-observed-lift'));
    assert(lift.cue.targets.includes(aTarget) && lift.cue.targets.includes(bTarget));
    const pendingLift = paint(lift.lesson, lift.scene, lift.state, drawHypothesis);
    assert(!pendingLift.labels.some((label) => label.text.startsWith('Observed lift +')));
    const liftIndex = lift.lesson.scenes.indexOf(lift.scene);
    const completedLift = frameState(
      lift.timing,
      lift.cue.end + 1 / 30,
      liftIndex,
      lift.lesson.scenes.length,
    );
    const liftAudit = paint(lift.lesson, lift.scene, completedLift, drawHypothesis);
    target(liftAudit, 'paired-observed-lift');
    assert(
      liftAudit.labels.some(
        (label) => label.text === `Observed lift +${permission.b - permission.a}/${paired.length}`,
      ),
    );
    assert.equal(target(liftAudit, aTarget).y, 370 + rowIndex * 67);
    assert.equal(target(liftAudit, bTarget).y, 370 + rowIndex * 67);

    const disagreement = await measuredCue(
      'hypothesis-testing',
      'paired-design',
      'only a disagreement',
    );
    const differenceTarget = 'paired-positive-difference-permission';
    assert(disagreement.cue.targets.includes(differenceTarget));
    assert(
      disagreement.cue.targets.includes(aTarget) && disagreement.cue.targets.includes(bTarget),
    );
    const disagreementAudit = paint(
      disagreement.lesson,
      disagreement.scene,
      disagreement.state,
      drawHypothesis,
    );
    const contribution = target(disagreementAudit, differenceTarget);
    assert.equal(contribution.x, 1195);
    assert.equal(contribution.y, 370 + rowIndex * 67);
    assert(
      disagreementAudit.labels.some(
        (label) =>
          label.text === '+1' &&
          label.x >= contribution.x &&
          label.x < contribution.x + contribution.width,
      ),
    );
  } finally {
    paired.splice(0, paired.length, ...original);
  }
});

test('prompt cues focus assembled section bodies and the edited deadline line while preserving the JSON field cue', async () => {
  const example = await measuredCue(
    'prompt-engineering-fundamentals',
    'prompt-assembly',
    'boundary example',
  );
  assert.deepEqual(example.cue.targets, ['prompt-example-body']);
  const exampleAudit = paint(example.lesson, example.scene, example.state, drawPrompt);
  const exampleBody = target(exampleAudit, 'prompt-example-body');
  assert(exampleBody.width > 1000 && exampleBody.markCounts.labels >= 3);
  assert(
    exampleAudit.labels.some((label) => label.text === 'Unpaged P1 at minute 31 → page_on_call;'),
  );
  assert(!exampleAudit.targets.some((part) => part.id === 'assembled-section-2'));

  const edit = await measuredCue(
    'prompt-engineering-fundamentals',
    'prompt-revision',
    'deadline minutes since P1 declaration',
  );
  const editModel = promptModel('prompt-revision', edit.state);
  assert.equal(editModel.revised, true);
  const editAudit = paint(edit.lesson, edit.scene, edit.state, drawPrompt);
  const editedLine = target(editAudit, 'revised-reference-phrase');
  assert(
    editedLine.x < 1410,
    'the cue should frame the prompt text, not the right-side summary badge',
  );
  assert(
    editAudit.labels.some((label) => label.text === 'Deadline: minutes since P1 declaration.'),
  );
  assert(!editAudit.targets.some((part) => part.id === 'revision-summary-badge'));

  const response = await measuredCue(
    'prompt-engineering-fundamentals',
    'complete-response',
    'deadline',
  );
  const responseAudit = paint(response.lesson, response.scene, response.state, drawPrompt);
  target(responseAudit, 'response-field-2');
  assert(responseAudit.labels.some((label) => label.text === '  "deadline_minutes": 30,'));
});

test('batch cues keep equal example shares and the changed chunk objective attached to their computed gradients', async () => {
  const gradients = microbatchGradients();
  assert.deepEqual(
    gradients.rowGradients.map((row) => row.bias),
    [-3, -5, -7],
  );
  assert.equal(gradients.full.bias, -5);

  const meanCue = await measuredCue(
    'training-backpropagation-gradient-descent',
    'batches',
    'every request one third',
  );
  const meanAudit = paint(meanCue.lesson, meanCue.scene, meanCue.state, drawTraining);
  assert(target(meanAudit, 'batch-shares').alpha > 0.9);
  assert(meanAudit.labels.some((label) => label.text === 'g_b=-5'));
  assert.deepEqual(trainingModel('batches', meanCue.state).weights, [1 / 3, 1 / 3, 1 / 3]);

  const weighted = await measuredCue(
    'training-backpropagation-gradient-descent',
    'batches',
    'Weight each chunk mean by its share',
  );
  const weightedAudit = paint(weighted.lesson, weighted.scene, weighted.state, drawTraining);
  assert(target(weightedAudit, 'chunk-gradient-buffer').alpha > 0.9);
  const weightedModel = trainingModel('batches', weighted.state);
  const arrivedWeight = [gradients.first, gradients.last].reduce(
    (sum, row, i) => sum + Number(weightedModel.arrivals[i]) * row.weight * [2 / 3, 1 / 3][i],
    0,
  );
  assert(Math.abs(weightedModel.accumulated - arrivedWeight) < 1e-12);

  const changed = await measuredCue(
    'training-backpropagation-gradient-descent',
    'batches',
    'objective we wrote',
  );
  const changedAudit = paint(changed.lesson, changed.scene, changed.state, drawTraining);
  assert(target(changedAudit, 'chunk-gradient-buffer').alpha > 0.9);
  assert.equal(trainingModel('batches', changed.state).accumulated, -13.75);
  assert(changedAudit.labels.some((label) => label.text === 'g_b=-5.5'));
});

test('the log-odds definition is the focused formula while equal score steps remain visible', async () => {
  const definition = await measuredCue(
    'logistic-regression',
    'sigmoid',
    'logarithm of the positive-class odds',
  );
  assert.deepEqual(definition.cue.targets, ['log-odds-definition']);
  const audit = paint(definition.lesson, definition.scene, definition.state, drawLogistic);
  const odds = target(audit, 'log-odds-definition');
  assert(odds.alpha > 0.9);
  assert(audit.labels.some((label) => label.text === 'z = ln[p/(1 − p)]'));
  assert(audit.labels.some((label) => label.text === 'Equal score step: Δz = 2'));
  assert(audit.labels.some((label) => label.text === 'center: probability +0.462'));
  assert(audit.labels.some((label) => label.text === 'tail: probability +0.016'));
});

test('threshold cost cue shows its unit-cost rule and a subtotal derived from the current confusion counts', async () => {
  const costCue = await measuredCue(
    'logistic-regression',
    'confusion',
    'Calculate total cost at several thresholds',
  );
  assert.deepEqual(costCue.cue.targets, [
    'review-cost-rule',
    'review-cost-worked-example',
    'review-cost-alternatives',
    'review-policy-cost',
  ]);
  const frame = confusionFrame(costCue.state.beat, costCue.state.beatP, costCue.state.cues);
  assert.equal(frame.cost, frame.counts.fp * 18 + frame.counts.fn * 120);
  const audit = paint(costCue.lesson, costCue.scene, costCue.state, drawLogistic);
  const rule = target(audit, 'review-cost-rule');
  const subtotal = target(audit, 'review-cost-worked-example');
  assert(rule.alpha > 0.9 && subtotal.alpha > 0.9);
  assert(audit.labels.some((label) => label.text === 'Cost = $18 × FP + $120 × FN'));
  assert(
    audit.labels.some(
      (label) =>
        label.text ===
        `At τ=${frame.threshold.toFixed(2)}: $${frame.cost} = $18 × ${frame.counts.fp} + $120 × ${frame.counts.fn}`,
    ),
  );
  assert(audit.labels.some((label) => label.text.startsWith('τ 0.80 · queue')));
  assert(audit.labels.some((label) => label.text.startsWith('τ 0.50 · queue')));
});
