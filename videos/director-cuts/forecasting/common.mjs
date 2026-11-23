import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync, readFileSync } from 'node:fs';
export const sourceDir = dirname(fileURLToPath(import.meta.url));
export const project = JSON.parse(readFileSync(join(sourceDir, 'lesson.json'), 'utf8'));
export const scratch = resolve(process.env.DIRECTOR_WORK || join(sourceDir, 'build'));
mkdirSync(scratch, { recursive: true });
export function envPath(key) {
  if (!process.env[key]) throw Error('Set ' + key + ' for this build.');
  return resolve(process.env[key]);
}
export function courseModule(name) {
  return import(pathToFileURL(join(envPath('COURSE_VIDEOS'), 'lib', name)).href);
}
export async function canvasRuntime() {
  const consumer = createRequire(
    join(process.env.DIRECTOR_MODULES || envPath('COURSE_VIDEOS'), 'consumer.cjs'),
  );
  const viz = await import(pathToFileURL(consumer.resolve('vizmatic')).href);
  return { viz, canvas: consumer('@napi-rs/canvas') };
}
export const artifact = (name) => join(scratch, name);
export const covered = (mornings, setting) => mornings.filter((jobs) => jobs <= setting).length;
export function cutoff(mornings, pct) {
  const ranked = [...mornings].sort((a, b) => a - b);
  return ranked[Math.ceil(ranked.length * pct) - 1];
}
export function alternate() {
  const next = [...project.mornings];
  next[project.posterOrder.morning] = project.posterOrder.newCount;
  return next;
}
const original = project.mornings,
  next = alternate();
if (
  cutoff(original, project.quantile) !== 10 ||
  covered(original, 9) !== 0 ||
  covered(original, 10) !== 9 ||
  covered(next, 10) !== 8 ||
  covered(next, 39) !== 8 ||
  covered(next, 40) !== 9 ||
  cutoff(next, project.quantile) !== 40
) {
  throw Error('The recorded experiment and its narrated results differ.');
}
