#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderFilmVideo } from 'vizmatic/stage/export';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { readLesson, srt } from '../lib/lesson.mjs';
import { lessonSourcePaths } from '../lib/lesson-production.mjs';
import { teachingCaptions } from '../lib/teaching-captions.mjs';
import { compileStageLesson } from '../lib/stage-lesson.mjs';

if (existsSync(new URL('../../../REVIEW_ONLY', import.meta.url))) {
  throw Error('The review-only phase is active. Excerpt rendering is paused.');
}

const [id, timelineFile, sceneId, offsetArg, durationArg, outputFile, widthArg = '1280'] =
  process.argv.slice(2);
if (!outputFile)
  throw Error(
    'Usage: node tools/stage-excerpt.mjs ID TIMELINE_JSON SCENE_ID OFFSET_SECONDS DURATION_SECONDS OUTPUT_MP4 [WIDTH]',
  );
const root = fileURLToPath(new URL('../../', import.meta.url));
const project = lessonSourcePaths(id, { mode: 'stage', root });
const lesson = await readLesson(path.join(root, project.lessonFile), root);
const timeline = JSON.parse(await readFile(timelineFile, 'utf8'));
if (timeline.id !== id || timeline.estimated || !timeline.fps)
  throw Error('Expected a measured timeline for the selected film');
if (
  lesson.scenes.length !== timeline.scenes.length ||
  lesson.scenes.some((scene, i) => {
    const measured = timeline.scenes[i];
    return (
      scene.id !== measured.id ||
      scene.beats.length !== measured.beats.length ||
      scene.beats.some((beat, j) => beat.say !== measured.beats[j].say)
    );
  })
)
  throw Error('The timeline does not match the current script');
const scene = timeline.scenes.find((item) => item.id === sceneId);
if (!scene) throw Error('Unknown scene: ' + sceneId);
const fps = timeline.fps;
const offset = Math.round(Number(offsetArg) * fps) / fps;
const duration = Math.round(Number(durationArg) * fps) / fps;
const width = Number(widthArg);
if (!(
  duration >= 15 &&
  duration <= 30 &&
  offset >= 0 &&
  offset + duration <= scene.duration + 1e-6 &&
  Number.isInteger(width) &&
  width >= 320 &&
  width % 2 === 0
))
  throw Error('Choose 15 to 30 seconds inside one scene and a positive even video width');
registerLessonFonts();
const definition = (await import(pathToFileURL(path.join(root, project.moduleFile)))).default;
const { compiled } = await compileStageLesson(definition, lesson, timeline);
const movieStart = scene.start + offset;
const filmStart = movieStart - timeline.scenes[0].start;
const output = path.resolve(outputFile);
await mkdir(path.dirname(output), { recursive: true });
const tmp = await mkdtemp(path.join(path.dirname(output), '.stage-excerpt-'));
try {
  const inputs = [],
    labels = [];
  const filters = [];
  for (const [i, sound] of scene.sounds.entries()) {
    const bytes = await readFile(sound.audio);
    if (
      createHash('sha256').update(bytes).digest('hex') !== sound.audioHash ||
      !sound.words?.length
    )
      throw Error('Measured audio changed or lacks word timings: ' + sound.audio);
    inputs.push('-i', sound.audio);
    labels.push('[a' + i + ']');
    const hold = scene.beats[i].until - scene.beats[i].end;
    filters.push(
      `[${i + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,apad,atrim=duration=${(sound.duration + hold).toFixed(6)}[a${i}]`,
    );
  }
  const delay = Math.round(scene.beats[0].start * 1000);
  filters.push(
    `${labels.join('')}concat=n=${labels.length}:v=0:a=1,adelay=${delay}|${delay},apad,atrim=start=${offset}:duration=${duration},asetpts=PTS-STARTPTS[a]`,
  );
  const movieCaptions = project.lessonFile.endsWith('/lesson.yaml')
    ? timeline.scenes.flatMap(teachingCaptions)
    : timeline.captions;
  const captions = movieCaptions
    .filter((c) => c.end > movieStart && c.start < movieStart + duration)
    .map((c) => ({
      ...c,
      start: Math.max(0, c.start - movieStart),
      end: Math.min(duration, c.end - movieStart),
    }));
  if (!captions.length) throw Error('Selected passage has no measured captions');
  const subs = path.join(tmp, 'captions.srt');
  await writeFile(subs, srt(captions));
  const picture = path.join(tmp, 'picture.mp4');
  const rendered = await renderFilmVideo(compiled, picture, {
    from: filmStart,
    to: filmStart + duration,
    width,
    workers: 1,
    threads: 2,
    quality: 'high',
  });
  if (rendered.frameCount !== Math.round(duration * fps))
    throw Error('Unexpected frame count: ' + rendered.frameCount);
  const muxed = path.join(tmp, 'clip.mp4');
  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-nostdin',
      '-i',
      picture,
      ...inputs,
      '-i',
      subs,
      '-filter_complex',
      filters.join(';'),
      '-map',
      '0:v:0',
      '-map',
      '[a]',
      '-map',
      String(scene.sounds.length + 1) + ':s:0',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '160k',
      '-c:s',
      'mov_text',
      '-disposition:s:0',
      'default',
      '-metadata:s:s:0',
      'language=eng',
      '-movflags',
      '+faststart',
      muxed,
    ],
    { stdio: 'inherit' },
  );
  await rename(muxed, output);
  console.log(JSON.stringify({ id, scene: sceneId, movieStart, duration, file: output }));
} finally {
  await rm(tmp, { recursive: true, force: true });
}
