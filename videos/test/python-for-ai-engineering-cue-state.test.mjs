import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import * as animation from '../animations/python-for-ai-engineering.mjs';

registerLessonFonts();
const lesson = await readLesson(
  new URL('../lessons/python-for-ai-engineering.lesson.yaml', import.meta.url),
  new URL('../../', import.meta.url).pathname,
);
const measured = await loadMeasuredTimeline('python-for-ai-engineering');
function paint(id, cueId, progress) {
  const scene = lesson.scenes.find((s) => s.id === id),
    raw = measured.scenes.find((s) => s.id === id);
  const timing = { ...raw, visualCues: resolveSceneCues(scene, raw) },
    cue = timing.visualCues.find((c) => c.id === cueId);
  assert(cue, cueId);
  const t =
    progress < 0
      ? cue.start - 0.06
      : progress > 1
        ? cue.end + cue.linger + 0.06
        : cue.start + (cue.end - cue.start) * progress;
  const state = frameState(timing, t, lesson.scenes.indexOf(scene), lesson.scenes.length),
    canvas = createCanvas(1920, 1080);
  const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, animation.draw);
  return { state, audit, labels: audit.labels.map((l) => l.text), canvas };
}

test('the measured question and comparison preserve an unknown Boolean until its spoken result completes', () => {
  const question = paint('opening', 'opening-predict', 0.5);
  assert(question.labels.includes('row result = ?'));
  assert(!question.labels.some((t) => ['True', 'False'].includes(t)));
  assert(!question.labels.some((t) => t.includes('0.667')));
  const before = paint('row-values', 'compare-labels', -1),
    middle = paint('row-values', 'compare-labels', 0.5),
    held = paint('row-values', 'compare-labels', 2);
  for (const image of [before, middle]) {
    assert(image.labels.includes('Boolean = ?'));
    assert(!image.labels.includes('False'));
  }
  assert(held.labels.includes('False'));
  assert(held.labels.includes('" ESCALATED "'));
  assert(held.labels.includes('"escalated"'));
});

test('strip and lower follow separate measured clauses while the original field stays intact', () => {
  const before = paint('row-values', 'strip-label', -1),
    stripped = paint('row-values', 'strip-label', 2),
    lower = paint('row-values', 'lower-label', 2);
  assert.equal(animation.rowFrame(before.state).value, ' ESCALATED ');
  assert.equal(animation.rowFrame(stripped.state).value, 'ESCALATED');
  assert.equal(animation.rowFrame(lower.state).value, 'escalated');
  for (const image of [before, stripped, lower]) {
    assert.equal(animation.examples[1].prediction, ' ESCALATED ');
    assert(image.labels.includes('" ESCALATED "'));
  }
});

test('each real Boolean travels under its retained row owner and enters the list only at append completion', () => {
  const ids = ['append-first', 'append-second', 'append-third'],
    expected = [true, false, true];
  ids.forEach((id, i) => {
    for (const progress of [0.15, 0.5, 0.85]) {
      const image = paint('batch', id, progress),
        s = animation.batchFrame(image.state);
      assert.equal(s.active, i);
      assert.equal(s.processed, i);
      assert.equal(s.results[i], null);
      assert.deepEqual(s.appended, expected.slice(0, i));
      assert.deepEqual(s.results.slice(0, i), expected.slice(0, i));
      const moving = image.audit.labels.find(
        (l) => l.text === (expected[i] ? 'True' : 'False') && l.fontSize === 32,
      );
      assert(moving, 'Actual moving Boolean glyphs must be painted');
      assert(moving.x >= 500 && moving.x + moving.width <= 1900);
      assert.deepEqual([...image.audit.issues, ...layoutIssues(image.audit)], []);
    }
    const held = paint('batch', id, 2),
      s = animation.batchFrame(held.state);
    assert.deepEqual(s.results.slice(0, i + 1), expected.slice(0, i + 1));
    assert.equal(s.processed, i + 1);
  });
  const final = animation.batchFrame(paint('batch', 'divide-counts', 2).state);
  assert.equal(final.matches, 2);
  assert.equal(final.total, 3);
  assert.equal(final.fraction, 2 / 3);
});

test('copying row dictionaries changes the actual mutation destination while a shallow list still shares its row', () => {
  const alias = animation.copyFrame(paint('copies', 'mutate-alias', 2).state);
  const shallow = animation.copyFrame(paint('copies', 'mutate-shallow', 2).state);
  const owned = animation.copyFrame(paint('copies', 'mutate-owned', 2).state);
  assert(alias.sameList && alias.sameRow);
  assert(!shallow.sameList && shallow.sameRow);
  assert(!owned.sameList && !owned.sameRow);
  assert.equal(alias.baselinePrediction, 'blocked');
  assert.equal(shallow.baselinePrediction, 'blocked');
  assert.equal(owned.baselinePrediction, 'escalated');
  assert.equal(owned.trialPrediction, 'blocked');
  assert.equal(animation.sampleModel('copies', { beat: 2, beatP: 0.1 }).sameRow, true);
  assert.equal(animation.sampleModel('copies', { beat: 2, beatP: 0.3 }).sameRow, false);
});

test('actual typed-function calls and the integer error remain distinct from schema rejection', () => {
  assert(paint('functions', 'return-false', 2).labels.includes('False'));
  assert(paint('functions', 'return-true', 2).labels.includes('True'));
  assert(
    !paint('functions', 'method-error', 0.5).labels.some((t) => t.startsWith('AttributeError')),
  );
  assert(
    paint('functions', 'method-error', 2).labels.some((t) =>
      t.startsWith("AttributeError: 'int' object"),
    ),
  );
  const parsed = animation.parseJsonLine('{"prompt":"Q","expected":"blocked","prediction":7}', 2);
  assert(parsed.decoded);
  assert(!parsed.parsed.accepted);
  assert.equal(parsed.parsed.error, 'prediction must be a string');
  assert.equal(animation.parseJsonLine('{"prediction":}', 2).decoded, false);
  for (const value of [7, true, null, [], {}])
    assert.equal(
      animation.classifyJsonRow({ prompt: 'Q', expected: 'blocked', prediction: value }, 2)
        .accepted,
      false,
    );
  assert(
    paint('jsonl-boundary', 'reject-number', 2).labels.includes(
      'TypeError: line 2: prediction must be a string',
    ),
  );
  assert(
    paint('jsonl-boundary', 'syntax-error', 2).labels.includes('ValueError: line 2: invalid JSON'),
  );
});

test('the measured deletion clears request 102 before request 103 closes its gap and withholds the new count in transit', () => {
  for (const progress of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 0.95]) {
    const image = paint('exact-metric', 'remove-request', progress);
    assert.deepEqual(
      [...image.audit.issues, ...layoutIssues(image.audit)],
      [],
      'Deletion progress ' + progress,
    );
    assert(image.labels.includes('count pending'));
    assert(!image.labels.includes('2 / 2'));
  }
  const held = paint('exact-metric', 'remove-request', 2),
    s = animation.metricFrame(held.state);
  assert.equal(s.result.matches, 2);
  assert.equal(s.result.total, 2);
  assert.equal(s.result.gate, true);
  assert.equal(s.fixtureMatches, false);
  assert(held.labels.includes('2 / 2'));
  assert(
    paint('exact-metric', 'fixture-fails', 2).labels.includes(
      'FAIL  expected (2, 3) · received (2, 2)',
    ),
  );
});

function constructionState(sceneId, beat, values = {}) {
  const scene = lesson.scenes.find((s) => s.id === sceneId);
  return {
    beat,
    beatP: 0.5,
    cues: Object.fromEntries(
      scene.beats
        .flatMap((b) => b.visual_cues ?? [])
        .map((c) => {
          const progress = values[c.id] ?? 0;
          return [
            c.id,
            { progress, phase: progress === 1 ? 'after' : progress === 0 ? 'before' : 'active' },
          ];
        }),
    ),
  };
}

test('a row copy isolates string rebinding while nested tag mutation follows its actual referenced list', () => {
  const shared = animation.nestedState(
    constructionState('nested-ownership', 1, { 'py-nested-string': 1, 'py-nested-tag': 1 }),
  );
  assert.equal(shared.baseline.prediction, 'escalated');
  assert.equal(shared.trial.prediction, 'blocked');
  assert.notEqual(shared.baseline, shared.trial);
  assert.equal(shared.baseline.tags, shared.trial.tags);
  assert.deepEqual(shared.baseline.tags, ['review']);
  const separated = animation.nestedState(
    constructionState('nested-ownership', 2, { 'py-nested-repair': 1, 'py-nested-ownership-2': 1 }),
  );
  assert.notEqual(separated.baseline.tags, separated.trial.tags);
  assert.deepEqual(separated.baseline.tags, []);
  assert.deepEqual(separated.trial.tags, ['review']);
});

test('the fresh typed-input failure cannot publish a partial count and its repaired wrong label stays wrong', () => {
  const pending = animation.freshState(constructionState('fresh-input-receipt', 0));
  assert.equal(pending.result, null);
  const rejected = animation.freshState(
    constructionState('fresh-input-receipt', 1, {
      'py-fresh-decode': 1,
      'py-fresh-error': 1,
      'py-fresh-no-metric': 1,
    }),
  );
  assert(rejected.rejected && rejected.noMetric);
  assert.equal(rejected.result, null);
  for (const progress of [0, 0.25, 0.5, 0.99]) {
    const repairing = animation.freshState(
      constructionState('fresh-input-receipt', 2, { 'py-fresh-repair': progress }),
    );
    assert.equal(repairing.rows[4].prediction, true);
    assert.equal(repairing.result, null);
  }
  const repaired = animation.freshState(
    constructionState('fresh-input-receipt', 2, { 'py-fresh-repair': 1 }),
  );
  assert.equal(repaired.rows[4].prediction, 'open');
  assert.equal(repaired.result, null);
  const counted = animation.freshState(
    constructionState('fresh-input-receipt', 2, { 'py-fresh-repair': 1, 'py-fresh-count': 1 }),
  );
  assert.equal(counted.result.matches, 3);
  assert.equal(counted.result.total, 5);
  assert.equal(counted.result.gate, false);
  assert.equal(counted.floor, false);
  assert.equal(animation.exactMatch(counted.rows[4].expected, counted.rows[4].prediction), false);
});

test('the schema projects only its three label fields while preserving the original decoded object', () => {
  const decoded = {
    prompt: 'Q',
    expected: 'open',
    prediction: ' OPEN ',
    confidence: true,
    unrelated: { retained: true },
  };
  const result = animation.classifyJsonRow(decoded, 7);
  assert.equal(result.accepted, true);
  assert.deepEqual(result.row, { prompt: 'Q', expected: 'open', prediction: ' OPEN ' });
  assert.notEqual(result.row, decoded);
  assert.equal(decoded.confidence, true);
  assert.deepEqual(decoded.unrelated, { retained: true });
});

test('the fresh-result footer waits for the same completed no-metric and serialization-repair operations', () => {
  function labels(beat, values) {
    const scene = lesson.scenes.find((s) => s.id === 'fresh-input-receipt');
    const state = {
      ...constructionState(scene.id, beat, values),
      opacity: 1,
      p: 0.5,
      t: 50,
      duration: 100,
      sceneIndex: lesson.scenes.indexOf(scene),
      sceneCount: lesson.scenes.length,
      width: 1920,
      height: 1080,
    };
    const canvas = createCanvas(1920, 1080);
    return drawFrame(canvas.getContext('2d'), lesson, scene, state, animation.draw).labels.map(
      (l) => l.text,
    );
  }
  assert(
    !labels(1, { 'py-fresh-decode': 1 }).includes('The unchanged loader prints no partial score.'),
  );
  assert(
    labels(1, { 'py-fresh-decode': 1, 'py-fresh-error': 1, 'py-fresh-no-metric': 1 }).includes(
      'The unchanged loader prints no partial score.',
    ),
  );
  assert(
    !labels(2, { 'py-fresh-open': 1 }).includes(
      'Repair the representation while preserving the producer’s actual wrong label.',
    ),
  );
  assert(
    labels(2, { 'py-fresh-open': 1, 'py-fresh-repair': 1 }).includes(
      'Repair the representation while preserving the producer’s actual wrong label.',
    ),
  );
});
