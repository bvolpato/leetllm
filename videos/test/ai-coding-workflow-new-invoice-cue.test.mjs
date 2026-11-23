import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  draw as drawCodingWorkflow,
  sampleModel,
} from '../animations/ai-coding-workflow-with-agents.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function measuredReplayCues() {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/ai-coding-workflow-with-agents.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'replay');
  assert.notEqual(sceneIndex, -1);
  const scene = lesson.scenes[sceneIndex];
  const timeline = await loadMeasuredTimeline('ai-coding-workflow-with-agents');
  const measured = timeline.scenes.find((scene) => scene.id === 'replay');
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const eventCue = timing.visualCues.find((item) => item.id === 'replay-b2-2');
  const invoiceCue = timing.visualCues.find((item) => item.id === 'replay-b2-3');
  assert(eventCue, 'the measured new-event phrase must resolve');
  assert(invoiceCue, 'the measured invoice-creation phrase must resolve');
  assert(
    eventCue.end < invoiceCue.start,
    'the distinct spoken clauses must keep their measured order',
  );
  return { lesson, scene, sceneIndex, timing, eventCue, invoiceCue };
}

function assertExistingRetry(store, count = 1) {
  assert.equal(store.deliveries.length, 2);
  assert.equal(store.deliveries[0].event, 'billing event 78291');
  assert.equal(store.deliveries[1].event, 'billing event 78291');
  assert.equal(store.deliveries[0].invoice, 'invoice 1');
  assert.equal(store.deliveries[1].invoice, 'invoice 1');
  assert.equal(store.count, count);
}

function render(lesson, scene, state) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(canvas.getContext('2d'), lesson, scene, state, drawCodingWorkflow);
}

test('provider-timed new event precedes its second invoice and preserves the deduplicated retry', async () => {
  const { lesson, scene, sceneIndex, timing, eventCue, invoiceCue } = await measuredReplayCues();
  const beforeEvent = frameState(timing, eventCue.start - 0.01, sceneIndex, lesson.scenes.length);
  const beforeModel = sampleModel('replay', beforeEvent);
  assertExistingRetry(beforeModel.store);
  assert(
    !render(lesson, scene, beforeEvent).labels.some(
      (label) => label.text === 'billing event 99002',
    ),
  );

  const duringEvent = frameState(
    timing,
    (eventCue.start + eventCue.end) / 2,
    sceneIndex,
    lesson.scenes.length,
  );
  const eventModel = sampleModel('replay', duringEvent);
  assertExistingRetry(eventModel.store);
  const eventAudit = render(lesson, scene, duringEvent);
  const eventLabels = eventAudit.labels;
  assert(eventLabels.some((label) => label.text === 'billing event 99002' && label.alpha > 0.8));
  assert(!eventLabels.some((label) => label.text === 'invoice 2' && label.alpha > 0.3));
  assert(eventLabels.some((label) => label.text === 'Stored invoices: 1' && label.alpha > 0.3));
  assert(eventAudit.targets.some((part) => part.id === 'new-event-identity' && part.alpha > 0.8));

  const beforeInvoice = frameState(
    timing,
    invoiceCue.start - 0.01,
    sceneIndex,
    lesson.scenes.length,
  );
  const pendingModel = sampleModel('replay', beforeInvoice);
  assertExistingRetry(pendingModel.store);
  const pendingLabels = render(lesson, scene, beforeInvoice).labels;
  assert(pendingLabels.some((label) => label.text === 'billing event 99002' && label.alpha > 0.8));
  assert(!pendingLabels.some((label) => label.text === 'invoice 2' && label.alpha > 0.3));
  assert(pendingLabels.some((label) => label.text === 'Stored invoices: 1' && label.alpha > 0.3));

  const clauseEnd = invoiceCue.end - 0.04;
  const afterInvoice = frameState(timing, clauseEnd, sceneIndex, lesson.scenes.length);
  const result = sampleModel('replay', afterInvoice);
  assert.equal(result.store.deliveries.length, 3);
  assertExistingRetry({ ...result.store, deliveries: result.store.deliveries.slice(0, 2) }, 2);
  assert.deepEqual(result.store.deliveries[2], {
    event: 'billing event 99002',
    invoice: 'invoice 2',
  });
  assert.equal(result.store.count, 2);

  const resultAudit = render(lesson, scene, afterInvoice);
  const resultLabels = resultAudit.labels;
  const visible = resultLabels.filter((label) => label.alpha > 0.8).map((label) => label.text);
  const held = resultLabels.filter((label) => label.alpha > 0.3).map((label) => label.text);
  assert(visible.includes('billing event 99002'));
  assert(visible.includes('invoice 2'));
  assert.equal(held.filter((label) => label === 'billing event 78291').length, 2);
  assert.equal(held.filter((label) => label === 'invoice 1').length, 2);
  assert(visible.includes('Stored invoices: 2'));
  for (const target of ['new-invoice-result', 'stored-count']) {
    assert(
      resultAudit.targets.some((part) => part.id === target && part.alpha > 0.8),
      `${target} must be the visible cue focus`,
    );
  }
});
