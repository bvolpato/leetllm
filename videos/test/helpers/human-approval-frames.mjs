import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createCanvas } from '@napi-rs/canvas';
import { draw } from '../../animations/human-approval.mjs';
import { registerLessonFonts } from '../../lib/fonts.mjs';
import { frameState, readLesson } from '../../lib/lesson.mjs';
import { resolveSceneCues } from '../../lib/narration-cues.mjs';
import { drawFrame } from '../../lib/scene.mjs';
import { loadMeasuredTimeline, timelineFromMeasuredFixture } from './measured-narration.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const lesson = await readLesson(root + 'videos/lessons/human-approval.lesson.yaml', root);
const fixture = await loadMeasuredTimeline('human-approval');
const freshness = timelineFromMeasuredFixture(
  JSON.parse(
    await readFile(
      new URL('../fixtures/measured-narration/human-approval-freshness.json', import.meta.url),
      'utf8',
    ),
  ),
  lesson,
);
const measurements = [...fixture.scenes, ...freshness.scenes];
registerLessonFonts();

export function measuredScene(id) {
  const index = lesson.scenes.findIndex((scene) => scene.id === id);
  const scene = lesson.scenes[index];
  const measured = measurements.find((row) => row.id === id);
  assert(measured, 'Missing measured narration for ' + id);
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  function paint(time) {
    const state = frameState(timing, time, index, lesson.scenes.length);
    return drawFrame(createCanvas(1920, 1080).getContext('2d'), lesson, scene, state, draw);
  }
  function labels(time, minAlpha = 0) {
    const painted = paint(time);
    return painted.labels
      .filter((label) => label.alpha >= minAlpha)
      .map((label) => label.text.trim().replace(/\s+/g, ' '))
      .join('\n');
  }
  function boundary(phrase, expectedBeat) {
    const probe = structuredClone(scene);
    const beats = probe.beats.filter((beat) =>
      beat.say.toLowerCase().includes(phrase.toLowerCase()),
    );
    assert.equal(beats.length, 1, 'Expected one spoken occurrence of ' + phrase);
    if (expectedBeat !== undefined) assert.equal(probe.beats.indexOf(beats[0]), expectedBeat);
    for (const beat of probe.beats) delete beat.visual_cues;
    beats[0].visual_cues = [{ id: 'boundary', phrase, targets: ['independent-probe'] }];
    const [cue] = resolveSceneCues(probe, timing);
    const frame = Math.ceil(cue.end * 30);
    return { ...cue, before: labels((frame - 1) / 30), after: labels(frame / 30, 0.8) };
  }
  return { scene, timing, labels, boundary };
}

export function revealedAt(scene, phrase, pattern) {
  const result = scene.boundary(phrase);
  assert.doesNotMatch(result.before, pattern, 'Result appeared before the end of ' + phrase);
  assert.match(result.after, pattern, 'Result missing at the end of ' + phrase);
  return result;
}
