#!/usr/bin/env node
// Check lesson coverage ledgers against their articles and narration. See TEACHING_STANDARD.md.
//   node videos/check-coverage.mjs                 Check every ledger.
//   node videos/check-coverage.mjs --lesson ID     Check one ledger.
//   node videos/check-coverage.mjs --hash ID       Print the current script hash for review records.
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { lessonSourcePaths } from './lib/lesson-production.mjs';
import { scriptHash, validateCoverage } from './lib/coverage.mjs';

const here = fileURLToPath(new URL('.', import.meta.url)),
  root = resolve(here, '..');

/** Without an explicit edition, keep the packaging preference for Stage. */
function lessonFile(id, mode) {
  if (mode !== undefined) return join(root, lessonSourcePaths(id, { mode, root }).lessonFile);
  const stage = join(root, lessonSourcePaths(id, { mode: 'stage', root }).lessonFile);
  return existsSync(stage) ? stage : join(here, 'lessons', `${id}.lesson.yaml`);
}

export async function checkLessonCoverage(id, { mode } = {}) {
  const lessonPath = lessonFile(id, mode);
  const localLedger = join(here, 'stage-lessons', id, 'coverage.yaml');
  const file =
    lessonPath.endsWith('/lesson.yaml') && existsSync(localLedger)
      ? localLedger
      : join(here, 'coverage', `${id}.yaml`);
  if (!existsSync(file))
    return { id, problems: [`no coverage ledger at videos/coverage/${id}.yaml`], summary: null };
  const lesson = parse(await readFile(lessonPath, 'utf8'));
  const coverage = parse(await readFile(file, 'utf8'));
  const article = await readFile(join(root, 'web/src/content', lesson.source), 'utf8');
  return { id, ...validateCoverage({ coverage, lesson, article }) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const value = (flag) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const mode = value('--mode');
  if (args.includes('--mode') && !['canvas', 'stage'].includes(mode)) {
    console.error('--mode requires canvas or stage');
    process.exit(1);
  }
  const hashFor = value('--hash');
  if (hashFor) {
    console.log(scriptHash(parse(await readFile(lessonFile(hashFor, mode), 'utf8'))));
    process.exit(0);
  }
  const chosen = value('--lesson');
  const ids = chosen
    ? [chosen]
    : (await readdir(join(here, 'coverage')))
        .filter((name) => name.endsWith('.yaml'))
        .map((name) => name.replace(/\.yaml$/, ''))
        .filter((id) => mode === undefined || existsSync(lessonFile(id, mode)))
        .sort();
  let failed = 0;
  for (const id of ids) {
    const { problems, summary } = await checkLessonCoverage(id, { mode });
    if (problems.length) {
      failed += 1;
      console.error(`${id}: ${problems.length} problem(s)`);
      for (const problem of problems) console.error(`  ${problem}`);
    } else
      console.log(
        `${id}: sections ${summary.sections} taught, quiz ${summary.quiz} taught, ${summary.removed} removed point(s), script ${summary.script}`,
      );
  }
  process.exit(failed ? 1 : 0);
}
