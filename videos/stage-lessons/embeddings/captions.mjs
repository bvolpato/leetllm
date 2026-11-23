import { readFile, writeFile } from 'node:fs/promises';
import { lexicalTokens } from '../../lib/captions.mjs';
import { srt, vtt, wordCaptions } from '../../lib/lesson.mjs';

const [timelineFile, outputPrefix] = process.argv.slice(2);
if (!timelineFile || !outputPrefix) {
  throw new Error('Supply the rendered timeline.json and the output filename prefix.');
}

const timeline = JSON.parse(await readFile(timelineFile, 'utf8'));
const captions = timeline.scenes.flatMap((scene) =>
  scene.beats.flatMap((beat, index) => {
    const offset = scene.start + beat.start;
    const measured = scene.sounds[index].words;
    let indexInBeat = 0;
    const words = beat.say.split(/\s+/u).map((text) => {
      const expected = lexicalTokens(text).join('');
      const start = measured[indexInBeat]?.start;
      let actual = '';
      while (actual.length < expected.length && indexInBeat < measured.length) {
        actual += lexicalTokens(measured[indexInBeat++].text).join('');
      }
      if (expected !== actual || start === undefined) {
        throw new Error(`Caption and recording disagree on "${text}" in ${scene.id}`);
      }
      return { text, start, end: measured[indexInBeat - 1].end };
    });
    if (indexInBeat !== measured.length) throw new Error(`Unused speech timings in ${scene.id}`);
    const reveals = scene.visualCues
      .filter((cue) => cue.beat === index)
      .flatMap((cue) => [cue.start - beat.start, cue.end - beat.start]);
    const parts = [];
    let first = 0;
    for (let i = 1; i < words.length; i++) {
      if (
        reveals.some((time) => time > words[i - 1].start + 0.001 && time <= words[i].start + 0.001)
      ) {
        parts.push(words.slice(first, i));
        first = i;
      }
    }
    parts.push(words.slice(first));
    return parts.flatMap((part) => wordCaptions(part, offset));
  }),
);
await writeFile(`${outputPrefix}.srt`, srt(captions));
await writeFile(`${outputPrefix}.vtt`, vtt(captions));
