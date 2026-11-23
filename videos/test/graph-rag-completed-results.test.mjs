import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import * as graph from '../animations/graph-rag.mjs';

const { createCanvas } = createRequire(import.meta.url)('@napi-rs/canvas');
const lesson = await readRepositoryLesson('videos/lessons/graph-rag.lesson.yaml');
registerLessonFonts();
const canvas = createCanvas(1920, 1080);
function prepare(id) {
  const scene = lesson.scenes.find((s) => s.id === id),
    index = lesson.scenes.indexOf(scene);
  const sounds = scene.beats.map((beat, beatIndex) => {
    const words = beat.say.split(/\s+/);
    return {
      beatIndex,
      duration: words.length / 3,
      words: words.map((text, i) => ({ text, start: i / 3, end: (i + 1) / 3 - 0.005 })),
    };
  });
  const timing = makeSceneTimeline(
    scene,
    sounds.map((s) => s.duration),
  );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing);
  return { scene, index, timing };
}
function paint(p, time) {
  const audit = drawFrame(
    canvas.getContext('2d'),
    lesson,
    p.scene,
    frameState(p.timing, time, p.index, lesson.scenes.length),
    graph.draw,
  );
  return { audit, labels: audit.labels.filter((l) => l.alpha > 0.05).map((l) => l.text) };
}

test('computed graph results wait for their complete clauses', () => {
  const cases = [
    ['triples', 'messages-mean', '0.6'],
    ['walk-evidence', 'publisher-answer', 'Willow Press · supported by A + B'],
    ['community-construction', 'cache-term', '= 0.1389'],
    ['community-construction', 'eval-term', 'Eval: 1/6 − (2/12)²'],
    ['community-construction', 'modularity-result', 'Q = 5/18 ≈ 0.278'],
    ['community-construction', 'all-one', 'One community: 1 − 1² = 0'],
    ['local-context-budget', 'pack-total', 'Used 85 · remaining 5'],
    ['local-context-budget', 'pack-reject', 'Report 80 > remaining 5 → not admitted'],
    ['workload-cost', 'volume-ten', 'Q=10 : 18 / 208'],
    ['workload-cost', 'volume-many', 'Q=500 : 851 / 600'],
    ['workload-cost', 'cost-crossing', 'Crossover: 199 / .9 ≈ 221.1'],
    ['transfer', 'lookup-result', 'Juniper Press'],
    ['transfer', 'count-two', '2 gardening IDs'],
    ['transfer', 'count-result', 'Gardening · 2 of 4'],
  ];
  for (const [id, key, label] of cases) {
    const p = prepare(id),
      cue = p.timing.visualCues.find((c) => c.id === id + '-' + key);
    assert(
      !paint(p, cue.end - 0.001).labels.includes(label),
      id + '/' + key + ' must remain pending',
    );
    assert(paint(p, cue.end + 0.001).labels.includes(label), id + '/' + key + ' must complete');
  }
});

test('fixed token captions describe true common-axis widths during admission', () => {
  const p = prepare('local-context-budget'),
    cue = p.timing.visualCues.find((c) => c.id === 'local-context-budget-pack-first');
  for (const fraction of [0.951, 0.956, 0.98, 1]) {
    const { audit, labels } = paint(p, cue.start + fraction * (cue.end - cue.start));
    assert(labels.includes('text unit · 55'));
    const bar = audit.shapes.find((s) => s.kind === 'rect' && s.x === 720 && s.height === 150);
    assert(bar);
    assert.equal(bar.width, 55 * 16);
  }
});

test('a blocked old publisher stays blocked through the later study recap', () => {
  const p = prepare('drift-followups');
  for (const fraction of [0.05, 0.5, 0.95]) {
    const beat = p.timing.beats[2],
      { labels } = paint(p, beat.start + (beat.end - beat.start) * fraction);
    assert(labels.includes('B-v1: BLOCKED after correction'));
    assert(labels.includes('Old B cannot answer after correction'));
    assert(!labels.includes('B: published by Willow Press.'));
  }
});
