import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import {
  codingChapterState,
  draw,
  mixedWorkSchedule,
  parserTrace,
} from '../animations/ai-lab-coding-interview-python-systems.mjs';

registerLessonFonts();
const paint = (id, beat, beatP, cues = {}) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Construction contract' },
    { t: 1, duration: 30, opacity: 1, beat, beatP, cues },
    draw,
  );
test('a rejected header removes the attachment owner without modifying the previous record', () => {
  const states = parserTrace(['t|INFO|message|tail', ' detail', 'malformed', ' orphan']);
  assert.equal(states[1].records[0].message, 'message|tail detail');
  assert.equal(states[2].current, null);
  assert.deepEqual(states[3].records, states[2].records);
});
test('the mixed workload conserves one sequential CPU lane while overlapping waits', () => {
  const s = mixedWorkSchedule({ jobs: 3, wait: 4, cpu: 0.5 });
  assert.equal(s.serial, 13.5);
  assert.equal(s.overlapped, 5.5);
  assert.deepEqual(
    s.compute.map((x) => [x.start, x.end]),
    [
      [4, 4.5],
      [4.5, 5],
      [5, 5.5],
    ],
  );
});
test('the fresh prediction keeps both finish answers hidden until their completed clauses', () => {
  for (const [beat, p, cues] of [
    [0, 1, {}],
    [
      1,
      0.7,
      {
        'ci-fresh-worker-plan-serial': { phase: 'before', progress: 0 },
        'ci-fresh-worker-plan-overlap': { phase: 'before', progress: 0 },
      },
    ],
  ]) {
    const frame = drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id: 'fresh-worker-plan', title: 'Predict the workload' },
      { t: 1, duration: 30, opacity: 1, beat, beatP: p, cues },
      draw,
    );
    assert(!frame.labels.some((l) => /serial: 8 s|overlapped waits: 5 s/.test(l.text)));
  }
  const revealed = codingChapterState('fresh-worker-plan', {
    beat: 1,
    beatP: 1,
    cues: {
      'ci-fresh-worker-plan-serial': { phase: 'after', progress: 1 },
      'ci-fresh-worker-plan-overlap': { phase: 'after', progress: 1 },
    },
  });
  assert.equal(revealed.serialVisible, true);
  assert.equal(revealed.overlapVisible, true);
});
test('TTL scan deletion and permanent overwrite change the actual retained records', () => {
  const removed = codingChapterState('ttl-reads', {
    beat: 1,
    beatP: 0.6,
    cues: {
      'ci-ttl-reads-scan': { phase: 'after', progress: 1 },
      'ci-ttl-reads-overwrite': { phase: 'before', progress: 0 },
    },
  });
  assert.deepEqual(
    removed.entries.map((x) => x.key),
    ['task:2'],
  );
  const replaced = codingChapterState('ttl-reads', {
    beat: 1,
    beatP: 1,
    cues: {
      'ci-ttl-reads-scan': { phase: 'after', progress: 1 },
      'ci-ttl-reads-overwrite': { phase: 'after', progress: 1 },
    },
  });
  assert.equal(replaced.entries.find((x) => x.key === 'task:1').deadline, null);
  assert.equal(replaced.entries.find((x) => x.key === 'task:1').value, 'ready');
});
test('a dependent stays outside the ready heap before its final prerequisite publishes', () => {
  const pending = paint('graph-validation', 1, 0.2, {
    'ci-graph-validation-ready': { phase: 'before', progress: 0 },
  });
  assert(!pending.labels.some((l) => l.text === '(2, ship)'));
  assert(pending.labels.some((l) => l.text.includes('ship') && l.text.includes('waiting')));
});
test('parent-side merge remains pending while returned result identities are still travelling', () => {
  const pending = paint('fresh-worker-plan', 2, 0.2);
  assert(!pending.labels.some((l) => l.text === 'parent records: A, B'));
  const done = paint('fresh-worker-plan', 2, 1);
  assert(done.labels.some((l) => l.text === 'parent records: A, B'));
});
