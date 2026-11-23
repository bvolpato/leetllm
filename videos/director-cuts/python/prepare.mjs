import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { lines, fixture, shortened, corrected, score } from './film.mjs';
import assert from 'node:assert/strict';
const { COURSE_VIDEOS, DIRECTOR_WORK } = process.env;
assert.deepEqual(score(fixture), [2, 3]);
assert.deepEqual(score(shortened), [2, 2]);
assert.deepEqual(score(corrected), [3, 3]);
const { examples } = await import(
  pathToFileURL(join(COURSE_VIDEOS, 'films/python-for-ai-engineering/fixtures.mjs'))
);
assert.deepEqual(
  examples.map((r) => [+r.prompt.match(/\d+/)[0], r.expected, r.prediction]),
  fixture.map((r) => [r.id, r.expected, r.prediction]),
);
const { prepareTakes, courseNarrator } = await import(
  pathToFileURL(join(COURSE_VIDEOS, 'lib/course-speech.mjs'))
);
process.env.LEETLLM_KOKORO_WARM = '1';
const { takes } = await prepareTakes(
  lines.map((r) => r[1]),
  DIRECTOR_WORK,
);
let frame = 0;
const beats = [];
for (let index = 0; index < lines.length; index++) {
  const [id, say, hold] = lines[index],
    take = takes[index];
  const frames = Math.ceil((take.duration + hold) * 30);
  beats.push({
    id,
    say,
    start: frame / 30,
    frames,
    duration: take.duration,
    words: take.words,
    audio: take.audio,
  });
  frame += frames;
}
await writeFile(
  join(DIRECTOR_WORK, 'timing.json'),
  JSON.stringify({ fps: 30, frames: frame, voice: courseNarrator, beats }, null, 2),
);
console.log('Body', frame / 30, 'seconds');
