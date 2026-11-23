import { mkdir, mkdtemp, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { createPicture } from './picture.mjs';
import { buildTimeline, estimateTakes, firstFrameAt, fps, loadFilm, width } from './timeline.mjs';

const { positionals, values } = parseArgs({
  options: { stills: { type: 'string' } },
  allowPositionals: true,
});
if (positionals.length !== 1 || values.stills === '')
  throw new Error(
    'Usage: node videos/director-cuts/lesson-runtime/check.mjs <id> [--stills <dir>]',
  );
const [id] = positionals;
const film = await loadFilm(id);
const timeline = buildTimeline(film, estimateTakes(film));
const { draw, canvas } = createPicture(film);
async function inspect(staging) {
  let pictures = 0;
  let revealStarts = 0;
  for (const entry of timeline.schedule) {
    const { frames, startFrame, speechDuration } = entry;
    const sample = new Set();
    const visualStarts = new Set();
    const add = (localFrame) => sample.add(Math.max(0, Math.min(frames - 1, localFrame)));
    for (const fraction of [0, 0.25, 0.5, 0.75, 1])
      add(Math.round(speechDuration * fps * fraction));
    add(frames - 1);
    // Set iteration visits new samples too, including cues discovered during a transition.
    for (const localFrame of sample) {
      const frame = startFrame + localFrame;
      const clock = timeline.clockAtFrame(frame, (start, span) => {
        visualStarts.add(start);
        add(firstFrameAt(start) - 1);
        add(firstFrameAt(start));
        add(firstFrameAt(start + span / 2));
        add(firstFrameAt(start + span));
      });
      try {
        draw(clock);
        const pixels = canvas.data();
        for (let alpha = 3; alpha < pixels.length; alpha += 4) {
          if (!pixels[alpha]) {
            const pixel = (alpha - 3) / 4;
            throw new Error(
              `The background leaves a transparent pixel at (${pixel % width}, ${Math.floor(pixel / width)}).`,
            );
          }
        }
      } catch (cause) {
        throw new Error(`${id} / ${entry.beat.id} / body frame ${frame}: ${cause.message}`, {
          cause,
        });
      }
      if (staging) {
        const name = `${id}-b${String(entry.index + 1).padStart(2, '0')}-f${String(frame).padStart(6, '0')}.png`;
        await writeFile(join(staging, name), await canvas.encode('png'));
      }
      pictures++;
    }
    revealStarts += visualStarts.size;
  }
  return { pictures, revealStarts };
}

let staging;
let inspected;
try {
  if (values.stills) {
    await mkdir(values.stills, { recursive: true });
    staging = await mkdtemp(join(values.stills, '.director-stills-'));
  }
  inspected = await inspect(staging);
  if (staging) {
    for (const name of await readdir(staging)) {
      await rename(join(staging, name), join(values.stills, name));
    }
  }
} finally {
  if (staging) await rm(staging, { recursive: true, force: true });
}
console.log(
  JSON.stringify({
    id,
    title: film.title,
    beats: film.beats.length,
    ...inspected,
    timing: 'estimated words',
    stills: values.stills ?? null,
  }),
);
