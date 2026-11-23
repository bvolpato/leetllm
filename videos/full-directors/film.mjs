import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkFilm } from '../director-cuts/lesson-runtime/timeline.mjs';

const defaultLessons = fileURLToPath(new URL('./lessons/', import.meta.url));

export async function loadFullFilm(id, { lessonsDir = defaultLessons } = {}) {
  if (typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id))
    throw new Error('Expected a lesson ID.');
  const directory = join(lessonsDir, id);
  const chapters = JSON.parse(await readFile(join(directory, 'narration.json'), 'utf8'));
  if (!Array.isArray(chapters) || !chapters.length) throw new Error('Expected teaching chapters.');
  const ids = new Set();
  const beats = chapters.flatMap((chapter, chapterIndex) => {
    if (typeof chapter?.id !== 'string' || !chapter.id.trim() || ids.has(chapter.id))
      throw new Error(`Chapter ${chapterIndex + 1} needs a unique, nonempty id.`);
    ids.add(chapter.id);
    if (typeof chapter.title !== 'string' || !chapter.title.trim())
      throw new Error(`Missing title for chapter ${chapter.id}.`);
    if (
      !Array.isArray(chapter.sourceChapters) ||
      !chapter.sourceChapters.length ||
      chapter.sourceChapters.some((source) => typeof source !== 'string' || !source.trim()) ||
      new Set(chapter.sourceChapters).size !== chapter.sourceChapters.length
    )
      throw new Error(`Expected original chapter IDs for ${chapter.id}.`);
    if (!Array.isArray(chapter.beats) || !chapter.beats.length)
      throw new Error(`Chapter ${chapter.id} needs at least one beat.`);
    return chapter.beats.map((beat, beatIndex) => ({
      ...beat,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      chapterIndex,
      beatIndex,
      beatsInChapter: chapter.beats.length,
    }));
  });
  const { default: authored } = await import(pathToFileURL(join(directory, 'film.mjs')).href);
  const selected = authored.compareRgbaChapters;
  if (selected !== undefined && (!Array.isArray(selected) || selected.some(id => !ids.has(id))))
    throw new Error('compareRgbaChapters must list authored chapter IDs.');
  const film = { ...authored, chapters, beats };
  await checkFilm(film);
  return film;
}
