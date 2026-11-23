import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readLesson } from './lib/lesson.mjs';
import { lessonSourcePaths } from './lib/lesson-production.mjs';

const here = dirname(fileURLToPath(import.meta.url));

export async function discoverLessons(
  source = here,
  root = resolve(source, '..'),
  { lessonId, withStage = false } = {},
) {
  const stage = withStage ? await discoverStageLessons(source, root, lessonId) : [];
  const files = (await lessonFiles(join(source, 'lessons')))
    .filter(
      (file) =>
        file.endsWith('.lesson.yaml') &&
        (lessonId === undefined || file === `${lessonId}.lesson.yaml`),
    )
    .sort();
  if (!files.length && !stage.length)
    throw new Error(
      lessonId === undefined ? 'No lesson markup found' : `Lesson not found: ${lessonId}`,
    );
  const canvas = await Promise.all(
    files.map(async (file) => {
      const lesson = await readLesson(join(source, 'lessons', file), root);
      if (file !== `${lesson.id}.lesson.yaml`) {
        throw new Error(`Lesson ID ${lesson.id} does not match filename ${file}`);
      }
      return {
        id: lesson.id,
        title: lesson.title,
        source: lesson.source,
        mode: 'canvas',
        ...lessonSourcePaths(lesson.id),
      };
    }),
  );
  return [
    ...canvas.filter((lesson) => !stage.some((film) => film.id === lesson.id)),
    ...stage,
  ].sort((a, b) => a.id.localeCompare(b.id));
}

async function lessonFiles(directory) {
  try {
    return await readdir(directory);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function discoverStageLessons(source, root, lessonId) {
  const directory = join(source, 'stage-lessons');
  const files = (await lessonFiles(directory)).filter(
    (file) =>
      file.endsWith('.lesson.yaml') &&
      (lessonId === undefined || file === `${lessonId}.lesson.yaml`),
  );
  return Promise.all(
    files.map(async (file) => {
      const lesson = await readLesson(join(directory, file), root);
      if (file !== `${lesson.id}.lesson.yaml`) {
        throw new Error(`Lesson ID ${lesson.id} does not match filename ${file}`);
      }
      return {
        id: lesson.id,
        title: lesson.title,
        source: lesson.source,
        mode: 'stage',
        ...lessonSourcePaths(lesson.id, { mode: 'stage' }),
      };
    }),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const index = process.argv.indexOf('--lesson');
  discoverLessons(here, resolve(here, '..'), {
    withStage: process.argv.includes('--with-stage'),
    lessonId: index >= 0 ? process.argv[index + 1] : undefined,
  })
    .then((catalog) => console.log(JSON.stringify(catalog)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
