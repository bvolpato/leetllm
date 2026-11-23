import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { draw } from '../animations/structured-generation.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
registerLessonFonts();
const cue = (p) => ({
  phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
  progress: p,
  strength: 0,
});
function paint(id, beat, values) {
  const cues = Object.fromEntries(Object.entries(values).map(([id, p]) => [id, cue(p)]));
  const a = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Follow the current state', beats: [{}, {}, {}] },
    { beat, beatP: 0.5, t: 10, duration: 70, opacity: 1, cues },
    draw,
  );
  assert.deepEqual([...a.issues, ...layoutIssues(a)], []);
  return a.labels.map((l) => l.text);
}
test('trial frame pops do not commit a partial token or leak a fresh prediction', () => {
  const render = (a, b, eos = 0, old = 0) =>
    paint('fresh-nesting', a ? 1 : 0, {
      'sg-fresh-a': a,
      'sg-fresh-b': b,
      'sg-fresh-eos': eos,
      'sg-fresh-old-eos': old,
    });
  const held = render(0, 0);
  assert(!held.includes('Whole token accepted'));
  assert(!held.includes('Whole token rejected'));
  assert(held.includes('4 pending object closings'));
  assert.equal(held.filter((s) => /^open \d+ → }$/.test(s)).length, 8);
  const trial = render(0.5, 0);
  assert(trial.includes('4 pending object closings'));
  assert(!trial.includes('Whole token accepted'));
  assert.equal(trial.filter((s) => /^open \d+ → }$/.test(s)).length, 6);
  const committed = render(1, 0, 1);
  assert(committed.includes('0 pending object closings'));
  assert(committed.includes('Whole token accepted'));
  assert(committed.includes('EOS: allowed'));
  assert(!committed.includes('Fresh input · four unresolved objects'));
  const alternative = render(1, 1, 1);
  assert(alternative.includes('Whole token rejected'));
  assert(alternative.includes('original prefix · depth 4'));
  assert(alternative.includes('0 pending object closings'));
  assert(!alternative.includes('original EOS: blocked'));
  assert(render(1, 1, 1, 1).includes('original EOS: blocked'));
});
test('a displayed fresh snapshot reveals no rollback verdict before its separate clause', () => {
  const initial = paint('fresh-incident', 0, { 'sg-fresh-show': 0, 'sg-fresh-deny': 0 });
  assert(!initial.includes('DENY'));
  assert(!initial.some((s) => s.includes('No rollback effect was authorized')));
  const display = paint('fresh-incident', 1, { 'sg-fresh-show': 1, 'sg-fresh-deny': 0 });
  assert(display.includes('failed snapshot'));
  assert(!display.includes('DENY'));
  assert(!display.some((s) => s.includes('No rollback effect was authorized')));
  assert(paint('fresh-incident', 1, { 'sg-fresh-show': 1, 'sg-fresh-deny': 1 }).includes('DENY'));
});
test('a connected flat tree keeps a true caption until the parent relationships change', () => {
  const initial = paint('flat-tree', 0, { 'sg-tree-change': 0, 'sg-tree-reject': 0 });
  assert(initial.some((s) => s.includes('Root traversal reaches both children')));
  assert(!initial.some((s) => s.includes('cannot reach the disconnected cycle')));
  const changed = paint('flat-tree', 1, { 'sg-tree-change': 1, 'sg-tree-reject': 0 });
  assert(changed.includes('Reached from root: root'));
  assert(!changed.some((s) => s.startsWith('Reject:')));
  assert(
    paint('flat-tree', 1, { 'sg-tree-change': 1, 'sg-tree-reject': 1 }).some((s) =>
      s.startsWith('Reject:'),
    ),
  );
});

test('the schedule clock has finished all prerequisite work when sampling completes', () => {
  const labels = paint('mask-schedule', 2, {
    'sg-mask-schedule-2': 0.35,
    'sg-schedule-change': 1,
    'sg-schedule-wait': 1,
    'sg-schedule-slow-result': 1,
    'sg-schedule-result': 1,
    'sg-schedule-serial': 1,
    'sg-schedule-mask': 1,
    'sg-schedule-gpu': 1,
  });
  assert(labels.includes('Simulated work clock: 11.0 ms'));
  assert(labels.includes('11 ms total'));
});
