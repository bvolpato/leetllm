import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  draw as drawRecursiveContext,
  sampleModel,
  characterPlan,
  previewForHistory,
  chooseRoute,
} from '../animations/recursive-context.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function measuredBudgetScene() {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/recursive-context.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'shared-budget');
  assert.notEqual(sceneIndex, -1);
  const timeline = await loadMeasuredTimeline('recursive-context');
  const measured = timeline.scenes.find((scene) => scene.id === 'shared-budget');
  const scene = lesson.scenes[sceneIndex];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const cue = (id) => {
    const value = timing.visualCues.find((item) => item.id === id);
    assert(value, `measured cue ${id} must resolve from provider words`);
    return value;
  };
  return { lesson, scene, sceneIndex, timing, cue };
}

function stateAt(timing, sceneIndex, sceneCount, cue, progress = 0.5) {
  return frameState(timing, cue.start + (cue.end - cue.start) * progress, sceneIndex, sceneCount);
}

function paint(lesson, scene, state) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(canvas.getContext('2d'), lesson, scene, state, drawRecursiveContext);
}

function assertRootRow(lesson, scene, state, expected) {
  const model = sampleModel('shared-budget', state);
  const root = model.entries.Root;
  assert.equal(root?.status, expected.status);
  if (expected.status) assert.equal(root.charged, expected.charged);
  else assert.equal(root, undefined);
  assert.equal(model.chargedCalls, expected.chargedCalls);
  assert.equal(model.chargedCost, expected.chargedCost);
  assert.equal(model.availableCalls, 4 - expected.chargedCalls);
  assert.equal(model.availableCost, 10 - expected.chargedCost);

  const audit = paint(lesson, scene, state);
  const target = audit.targets.find((part) => part.id === 'budget-root' && part.alpha > 0.9);
  assert(target, 'the actual root ledger row must remain visible during its spoken stage');
  assert(
    audit.labels.some(
      (label) => label.text === (expected.status ?? 'not requested') && label.alpha > 0.9,
    ),
  );
  if (expected.status)
    assert(
      audit.labels.some((label) => label.text === expected.charged.toFixed(1) && label.alpha > 0.9),
    );
  return model;
}

test('root reservation, dispatch, and reconciliation follow their measured clauses and hold into child work', async () => {
  const { lesson, scene, sceneIndex, timing, cue } = await measuredBudgetScene();
  const at = (id, progress = 0.5) =>
    stateAt(timing, sceneIndex, lesson.scenes.length, cue(id), progress);

  assert.deepEqual(cue('reserve-root').targets, ['budget-root']);
  assert.deepEqual(cue('dispatch-root').targets, ['budget-root']);
  assert.deepEqual(cue('settle-root').targets, ['budget-root']);

  const before = frameState(
    timing,
    cue('reserve-root').start - 0.05,
    sceneIndex,
    lesson.scenes.length,
  );
  assertRootRow(lesson, scene, before, {
    status: undefined,
    charged: 0,
    chargedCalls: 0,
    chargedCost: 0,
  });

  const reserved = at('reserve-root');
  assertRootRow(lesson, scene, reserved, {
    status: 'reserved',
    charged: 2,
    chargedCalls: 1,
    chargedCost: 2,
  });

  const beforeDispatch = frameState(
    timing,
    cue('dispatch-root').start - 0.05,
    sceneIndex,
    lesson.scenes.length,
  );
  assertRootRow(lesson, scene, beforeDispatch, {
    status: 'reserved',
    charged: 2,
    chargedCalls: 1,
    chargedCost: 2,
  });

  const dispatched = at('dispatch-root');
  assertRootRow(lesson, scene, dispatched, {
    status: 'in flight',
    charged: 2,
    chargedCalls: 1,
    chargedCost: 2,
  });

  const beforeSettlement = frameState(
    timing,
    cue('settle-root').start - 0.05,
    sceneIndex,
    lesson.scenes.length,
  );
  assertRootRow(lesson, scene, beforeSettlement, {
    status: 'in flight',
    charged: 2,
    chargedCalls: 1,
    chargedCost: 2,
  });

  const settled = at('settle-root');
  assertRootRow(lesson, scene, settled, {
    status: 'in flight',
    charged: 2,
    chargedCalls: 1,
    chargedCost: 2,
  });

  const afterSettlement = frameState(
    timing,
    cue('settle-root').end + 0.01,
    sceneIndex,
    lesson.scenes.length,
  );
  assertRootRow(lesson, scene, afterSettlement, {
    status: 'settled',
    charged: 1.5,
    chargedCalls: 1,
    chargedCost: 1.5,
  });

  const childTimeout = at('unknown-outcome');
  const later = sampleModel('shared-budget', childTimeout);
  assert.equal(later.entries.Root.status, 'settled');
  assert.equal(later.entries.Root.charged, 1.5);
  assert.equal(later.entries['Child A'].status, 'unknown');
  assert.equal(later.entries['Child A'].charged, 3);
  assert.equal(later.chargedCalls, 2);
  assert.equal(later.chargedCost, 4.5);
  assert.equal(later.availableCalls, 2);
  assert.equal(later.availableCost, 5.5);
});

test('complete character requests fit and invalid merge capacity rejects before planning', () => {
  assert.equal(characterPlan(512).calls, 31);
  assert.equal(characterPlan(512).total, 407);
  assert.equal(characterPlan(256).calls, 63);
  assert(characterPlan(256).total <= 256);
  assert.throws(() => characterPlan(64), /merge cannot fit/);
});
test('history previews include their marker inside tiny and normal caps', () => {
  for (const cap of [0, 1, 13, 14, 15, 40]) {
    const preview = previewForHistory('x'.repeat(100), cap);
    assert(preview.length <= cap);
  }
  assert.equal(previewForHistory('short', 40), 'short');
  assert.equal(previewForHistory('x'.repeat(100), 40).length, 40);
  assert.throws(() => previewForHistory('x', -1));
});
test('fresh route selection enforces every supplied policy limit', () => {
  const rows = [
    { id: 'Direct', recall: 0.91, cost: 0.25, latency: 11 },
    { id: 'REPL', recall: 0.93, cost: 0.27, latency: 10 },
    { id: 'Recursive', recall: 0.96, cost: 0.45, latency: 9 },
  ];
  assert.equal(chooseRoute(rows).choice, 'Direct');
  assert.equal(chooseRoute(rows, { recall: 0.9, cost: 0.2, latency: 12 }).choice, 'HOLD');
});
