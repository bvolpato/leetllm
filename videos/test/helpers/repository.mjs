import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLesson } from '../../lib/lesson.mjs';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

export function readRepositoryLesson(file) {
  return readLesson(file instanceof URL ? file : resolve(repositoryRoot, file), repositoryRoot);
}
