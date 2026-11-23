import { mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const { positionals, values } = parseArgs({
  options: {
    out: { type: 'string' },
    'course-root': { type: 'string' },
    'lessons-dir': { type: 'string' },
  },
  allowPositionals: true,
});
const [id] = positionals;
const extension = extname(values.out ?? '').toLowerCase();
if (
  positionals.length !== 1 ||
  !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ||
  !['.mp4', '.flac'].includes(extension)
)
  throw new Error(
    'Usage: node videos/soundtracks/render.mjs <id> --out <movie.mp4|score.flac> [--course-root <dir>]',
  );
const root = resolve(values['course-root'] ?? fileURLToPath(new URL('../../', import.meta.url)));
const source = (file) => pathToFileURL(join(root, 'videos', file)).href;
const output = resolve(values.out);
const scoreURL = new URL('./course-score.mjs', import.meta.url);
scoreURL.searchParams.set('course', root);
if (values['lessons-dir']) scoreURL.searchParams.set('lessons', resolve(values['lessons-dir']));
const score = await import(scoreURL);
if (extension === '.mp4') {
  const movie = source('full-directors/render.mjs');
  // A frozen movie imports the filename-only writer. A current movie reports its own local score.
  const hooks = registerHooks({
    resolve(specifier, context, next) {
      if (
        context.parentURL === movie &&
        (specifier === './sound.mjs' || specifier === '../soundtracks/course-score.mjs')
      )
        return { url: scoreURL.href, shortCircuit: true };
      return next(specifier, context);
    },
  });
  try {
    process.argv = [process.execPath, fileURLToPath(movie), id, '--out', output];
    if (values['lessons-dir']) process.argv.push('--lessons-dir', resolve(values['lessons-dir']));
    await import(movie);
  } finally {
    hooks.deregister();
  }
  await score.reportSoundtrack(id, output, score.soundtrack);
} else {
  const { loadFullFilm } = await import(source('full-directors/film.mjs'));
  const { buildTimeline } = await import(source('director-cuts/lesson-runtime/timeline.mjs'));
  const { prepareSpeech } = await import(source('director-cuts/lesson-runtime/sound.mjs'));
  const film = await loadFullFilm(id, { lessonsDir: values['lessons-dir'] });
  await mkdir(dirname(output), { recursive: true });
  const work = await mkdtemp(join(dirname(output), '.soundtrack-'));
  try {
    const { schedule } = buildTimeline(film, await prepareSpeech(film, work));
    const result = await score.scoreForLesson(id, schedule, work);
    await rename(result.audio, output);
    await score.reportSoundtrack(id, output, result.soundtrack);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
