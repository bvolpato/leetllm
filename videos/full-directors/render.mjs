import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { buildTimeline, fps } from '../director-cuts/lesson-runtime/timeline.mjs';
import { encodePicture } from '../director-cuts/lesson-runtime/picture.mjs';
import { filmText, prepareSpeech } from '../director-cuts/lesson-runtime/sound.mjs';
import { finishMovie } from '../director-cuts/lesson-runtime/delivery.mjs';
import { BRAND_INTRO_SECONDS } from '../lib/brand.mjs';
import { loadFullFilm } from './film.mjs';
import { reportSoundtrack, scoreForLesson } from '../soundtracks/course-score.mjs';

const { positionals, values } = parseArgs({
  options: {
    out: { type: 'string' },
    'lessons-dir': { type: 'string' },
    'reuse-canvas-readback': { type: 'boolean', default: false },
    'stage-for-production': { type: 'boolean', default: false },
  },
  allowPositionals: true,
});
if (positionals.length !== 1 || extname(values.out ?? '').toLowerCase() !== '.mp4')
  throw new Error(
    'Usage: node videos/full-directors/render.mjs <id> --out <movie.mp4> [--lessons-dir <dir>] [--reuse-canvas-readback]',
  );
const [id] = positionals;
const film = await loadFullFilm(id, { lessonsDir: values['lessons-dir'] });
const output = resolve(values.out);
await mkdir(dirname(output), { recursive: true });
const work = await mkdtemp(join(dirname(output), '.full-director-'));
try {
  const timeline = buildTimeline(film, await prepareSpeech(film, work));
  const { schedule } = timeline;
  const { audio, soundtrack } = await scoreForLesson(id, schedule, work, values['lessons-dir']);
  await rm(join(work, '.audio-cache'), { recursive: true, force: true });
  const body = join(work, 'picture.mp4');
  const canvasReadback = await encodePicture(film, timeline, body, {
    includeOpening: true,
    reuseReadback: values['reuse-canvas-readback'],
  });
  // Drawing the film records every reveal that needs a new caption.
  const { subtitles, metadata } = filmText(film, schedule, { teachingChapters: true });
  const captions = join(work, 'phrases.srt');
  const chapters = join(work, 'chapters.ffmeta');
  await Promise.all([writeFile(captions, subtitles), writeFile(chapters, metadata)]);
  const staged = join(work, 'movie.mp4');
  const info = finishMovie({
    body,
    audio,
    chapters,
    captions,
    staged,
    bodyFrames: timeline.frames,
    chapterCount: film.chapters.length + 1,
    pictureIncludesOpening: true,
    productionPlayback: values['stage-for-production'],
  });
  await rename(staged, output);
  console.log(
    JSON.stringify({
      id,
      title: film.title,
      output,
      beats: schedule.length,
      frames: BRAND_INTRO_SECONDS * fps + timeline.frames,
      timing: 'measured words',
      ...(canvasReadback && { canvasReadback }),
      ...(values['stage-for-production'] && { playback: 'pending-production-verification' }),
      bodyFrames: timeline.frames,
      chapters: info.chapters.map((c) => ({
        title: c.tags.title,
        start: Number(c.start_time),
        end: Number(c.end_time),
      })),
    }),
  );
  await reportSoundtrack(id, output, soundtrack);
} finally {
  await rm(work, { recursive: true, force: true });
}
