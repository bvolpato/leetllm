import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

// Word events and beat intervals come from measured narration, without render
// paths or audio assets. Tests resolve current authored cues against these words.
export async function loadMeasuredTimeline(lessonId) {
  if (!/^[a-z][a-z0-9-]*$/.test(lessonId)) throw new Error(`Invalid fixture lesson ID: ${lessonId}`);
  const fixture = JSON.parse(await readFile(new URL(`../fixtures/measured-narration/${lessonId}.json`, import.meta.url), 'utf8'));
  if (fixture.version !== 1 || fixture.lessonId !== lessonId) throw new Error(`Invalid measured fixture: ${lessonId}`);
  const lesson = parse(await readFile(new URL(`../../lessons/${lessonId}.lesson.yaml`, import.meta.url), 'utf8'));
  return timelineFromMeasuredFixture(fixture, lesson);
}

export function timelineFromMeasuredFixture(fixture, lesson) {
  for (const scene of fixture.scenes) {
    const authored = lesson.scenes.find(candidate => candidate.id === scene.id);
    if (!authored) throw new Error(`Missing authored scene for measured narration: ${fixture.lessonId}/${scene.id}`);
    if (scene.beats.length !== authored.beats.length) {
      throw new Error(`Stale measured narration: ${fixture.lessonId}/${scene.id} beat count changed. Regenerate its fixture.`);
    }
    scene.beats.forEach((beat, index) => {
      if (beat.say !== authored.beats[index]?.say) {
        throw new Error(`Stale measured narration: ${fixture.lessonId}/${scene.id} beat ${index + 1}. Regenerate its fixture.`);
      }
    });
  }
  return {
    scenes: fixture.scenes.map(({ provenance: _provenance, ...scene }) => ({
      ...scene,
      sounds: scene.sounds.map(({ boundariesSha256: _boundariesSha256, words, ...sound }) => ({
        ...sound, words: words.map(([text, start, end]) => ({ text, start, end })),
      })),
    })),
  };
}
