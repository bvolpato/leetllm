import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  draw,
  boundConstruction,
  freshAdmissionConstruction,
} from '../animations/observability-monitoring-llm-systems.mjs';

const root = new URL('../../', import.meta.url).pathname;
registerLessonFonts();
const lesson = await readLesson(
  root + 'videos/lessons/observability-monitoring-llm-systems.lesson.yaml',
  root,
);
const cue = (phase, progress = phase === 'before' ? 0 : 1) => ({
  phase,
  progress,
  strength: 0,
  active: false,
  end: 10,
});
function paint(id, beat, overrides = {}, time = 11, opacity = 1) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [c.id, { ...c, ...cue(i < beat ? 'after' : 'before') }]),
      ),
    );
  for (const [id, c] of Object.entries(overrides)) Object.assign(cues[id], c);
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { beat, beatP: 0.99, t: time, opacity, cues },
    draw,
  );
}

test('cache-token bar lengths use the same token scale for long and short requests', () => {
  const a = paint('usage-contract', 2),
    bars = a.shapes.filter((s) => s.kind === 'rect' && s.height === 40);
  assert.equal(bars.filter((s) => s.width === 1000).length, 1);
  assert.equal(bars.filter((s) => s.width === 900).length, 1);
  assert.equal(
    bars.filter((s) => s.width === 10).length,
    4,
    'A ten-token miss must not be expanded to twenty tokens.',
  );
});

test('an absent final event widens the attainable bound while retaining the known lower count', () => {
  const before = boundConstruction({ beat: 1, cues: {} }),
    after = boundConstruction({ beat: 2, cues: { 'ob-unknown-bounds-3-1': cue('after') } });
  assert.equal(before.lowerCount, 1);
  assert.equal(before.upperCount, 3);
  assert.equal(before.knownWithheld, 3);
  assert.equal(after.lowerCount, 1);
  assert.equal(after.upperCount, 4);
  assert.equal(after.missingEvents, 1);
  assert.equal(after.knownWithheld, 2);
});

test('the final admission worksheet withholds verdicts and recomputes each repaired resource independently', () => {
  const initial = paint('fresh-window', 0);
  assert(!initial.labels.some((l) => /HOLD|admitted|calls sent/.test(l.text)));
  const timeOnly = freshAdmissionConstruction({
    beat: 2,
    cues: { 'ob-fresh-window-3-1': cue('after'), 'ob-fresh-window-3-2': cue('after') },
  });
  assert.equal(timeOnly.deadline, 16);
  assert.equal(timeOnly.result.executed, false);
  assert.equal(timeOnly.result.reason, 'spending budget');
  assert.equal(timeOnly.effects, 0);
  const fixed = paint('fresh-window', 2, {
    'ob-fresh-window-3-1': cue('after'),
    'ob-fresh-window-3-2': cue('after'),
    'ob-fresh-window-3-3': cue('after'),
    'ob-fresh-window-3-4': cue('after'),
  });
  assert(fixed.labels.some((l) => l.text.includes('6 + 3 = 9c')));
  assert(!fixed.labels.some((l) => l.text.includes('11c')));
  assert(!fixed.labels.some((l) => l.text.includes('dispatch admitted')));
  const complete = freshAdmissionConstruction({ beat: 3, cues: {} });
  assert.equal(complete.result.executed, true);
  assert.equal(complete.effects, 1);
});

test('the dispatch rail clears the moving poll label while the completed scene fades', () => {
  const scene = lesson.scenes.find((s) => s.id === 'fresh-window');
  const ready = Object.fromEntries(scene.beats[2].visual_cues.map((c) => [c.id, cue('after')]));
  for (const opacity of [1, 0.956, 0.5, 0.26])
    for (let i = 0; i <= 10; i++) {
      const audit = paint('fresh-window', 2, ready, 10 + i * 0.04, opacity);
      assert.deepEqual(
        layoutIssues(audit).filter((x) => x.type === 'label-connector'),
        [],
        `dispatch progress ${i / 10}, opacity ${opacity}`,
      );
    }
  const complete = paint('fresh-window', 3, {}, 11, 0.956);
  assert.deepEqual(
    layoutIssues(complete).filter((x) => x.type === 'label-connector'),
    [],
  );
});
