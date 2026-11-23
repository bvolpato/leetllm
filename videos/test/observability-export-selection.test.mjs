import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as animation from '../animations/observability-monitoring-llm-systems.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();

async function fixture() {
  const id = 'observability-monitoring-llm-systems';
  const lesson = await readLesson(path.join(root, `videos/lessons/${id}.lesson.yaml`), root);

  const timeline = await loadMeasuredTimeline(id);
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'privacy');
  const scene = lesson.scenes[sceneIndex],
    measured = timeline.scenes.find((scene) => scene.id === 'privacy');
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const paint = (time) => {
    const canvas = createCanvas(1920, 1080);
    return drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      frameState(timing, time, sceneIndex, lesson.scenes.length),
      animation.draw,
    );
  };
  return { timing, paint };
}

test('the raw-content phrase paints both actual input fields outside the selected export', async () => {
  const { timing, paint } = await fixture();
  const cue = timing.visualCues.find((cue) => cue.id === 'exclude-content');
  for (const fraction of [0.05, 0.5, 0.95]) {
    const audit = paint(cue.start + (cue.end - cue.start) * fraction);
    const raw = audit.labels.filter((label) => /rawMessage|rawAnswer/.test(label.text));
    assert.equal(raw.length, 2, 'both excluded input fields must be visible');
    assert(
      raw.every((label) => label.x < 990),
      'raw content must remain on the input side',
    );
    const output = audit.targets.filter((target) => target.id === 'selected-export-fields');
    assert(output.length > 0 && output.every((target) => target.x >= 1200));
    for (const key of ['request', 'prompt', 'evidence', 'route', 'input', 'output']) {
      assert(
        audit.labels.some((label) => label.x >= 1200 && label.text.startsWith(key + ':')),
        `the exported ${key} identity and value must be visible`,
      );
    }
  }
});

test('selection copies allowed identities in order while raw values stay local at every progress', () => {
  const record = animation.sampleModel('privacy', { beat: 0, beatP: 0 }).record;
  const expected = Object.entries(animation.exportRecord(record));
  for (let step = 0; step <= 60; step++) {
    const p = step / 60,
      snapshot = animation.exportSelection(record, p);
    const completed = Math.min(expected.length, Math.floor(p * expected.length + 1e-9));
    assert.deepEqual(snapshot.exportedEntries, expected.slice(0, completed));
    assert.deepEqual(snapshot.blockedEntries, [
      ['rawMessage', record.rawMessage],
      ['rawAnswer', record.rawAnswer],
    ]);
    assert(snapshot.rows.every((row) => row.progress >= 0 && row.progress <= 1));
  }
  assert.throws(
    () => animation.exportSelection({ ...record, prompt: record.rawMessage }, 1),
    /unapproved prompt identifier/,
  );
  assert.deepEqual(animation.exportSelection(record, 1, 0.99).exportedEntries, []);
  assert.deepEqual(animation.exportSelection(record, 1, 0.99).selectedEntries, expected);
  assert.deepEqual(animation.exportSelection(record, 1, 1).exportedEntries, expected);
});

test('the forged-identifier case still rejects and never paints a successful export', async () => {
  const { timing, paint } = await fixture();
  const cue = timing.visualCues.find((cue) => cue.id === 'reject-private-id');
  const audit = paint((cue.start + cue.end) / 2);
  assert(audit.labels.some((label) => label.text === 'Private operator message'));
  assert(audit.labels.some((label) => label.text === 'REJECT: unapproved prompt identifier'));
  assert(!audit.targets.some((target) => target.id === 'selected-export-fields'));
});
