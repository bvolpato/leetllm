import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import { draw } from '../animations/persistent-memory.mjs';
registerLessonFonts();
async function fixture(id) {
  const data = await loadMeasuredTimeline('persistent-memory');
  const lesson = await readRepositoryLesson('videos/lessons/persistent-memory.lesson.yaml');
  const index = lesson.scenes.findIndex((s) => s.id === id),
    scene = lesson.scenes[index];
  const timing = structuredClone(data.scenes.find((saved) => saved.id === id));
  timing.visualCues = resolveSceneCues(scene, timing);
  return { lesson, scene, index, timing };
}
function labels(f, time) {
  const canvas = createCanvas(1920, 1080);
  const audit = drawFrame(
    canvas.getContext('2d'),
    f.lesson,
    f.scene,
    frameState(f.timing, time, f.index, f.lesson.scenes.length),
    draw,
  );
  assert.deepEqual([...(audit.issues ?? []), ...layoutIssues(audit)], []);
  return audit.labels.map((v) => v.text);
}
test('projection text and read eligibility remain stale until refresh completion', async () => {
  const f = await fixture('supersession-and-revocation'),
    cue = f.timing.visualCues.find((c) => c.id === 'projection-refresh');
  for (const time of [cue.start + 1 / 30, (cue.start + cue.end) / 2, cue.end - 1 / 30]) {
    const values = labels(f, time);
    assert(values.includes('Search projection · v1'));
    assert(values.includes('Version mismatch: omit stale copy'));
    assert(!values.includes('Version + grant match: readable'));
  }
  const completed = labels(f, cue.end + 1 / 30);
  assert(completed.includes('Search projection · v2'));
  assert(completed.includes('Version + grant match: readable'));
});
test('fresh rejection and pinned prompt wait for their complete measured clauses', async () => {
  const f = await fixture('return-session');
  for (const [id, result] of [
    ['fresh-stale-answer', 'REJECT stale projection; read current scoped profile'],
    ['fresh-profile-pin', 'Next prompt · pinned v3 verifier'],
  ]) {
    const cue = f.timing.visualCues.find((c) => c.id === id);
    for (const time of [cue.start + 1 / 30, (cue.start + cue.end) / 2, cue.end - 1 / 30])
      assert(!labels(f, time).includes(result));
    assert(labels(f, cue.end + 1 / 30).includes(result));
  }
});
