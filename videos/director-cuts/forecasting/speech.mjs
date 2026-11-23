import { writeFileSync } from 'node:fs';
import { project, artifact, courseModule, scratch } from './common.mjs';
const { prepareTakes, courseNarrator } = await courseModule('course-speech.mjs');
if (courseNarrator.voice !== 'af_heart' || courseNarrator.speed !== 1.12)
  throw Error('Expected the course af_heart voice at 1.12');
process.env.LEETLLM_KOKORO_WARM = '1';
const { takes } = await prepareTakes(
  project.beats.map((b) => b.say),
  scratch,
);
let clock = 0.08;
const beats = project.beats.map((beat, i) => {
  const take = takes[i];
  const part = {
    ...beat,
    start: clock,
    duration: take.duration,
    audio: take.audio,
    words: take.words,
  };
  clock += take.duration + beat.hold;
  return part;
});
const frames = Math.ceil(clock * 30);
writeFileSync(
  artifact('timing.json'),
  JSON.stringify({ fps: 30, frames, seconds: frames / 30, voice: courseNarrator, beats }, null, 2),
);
