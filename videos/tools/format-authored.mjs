#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { formatSource, semanticHash } from './migrate-lesson-modules.mjs';

const videos = fileURLToPath(new URL('../', import.meta.url));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function authoredFiles(testsOnly) {
  const files = [];
  for (const folder of testsOnly ? ['test'] : ['', 'lib', 'test']) {
    for (const name of await fs.readdir(path.join(videos, folder))) {
      if (name.endsWith('.mjs')) files.push(path.posix.join(folder, name));
    }
  }
  if (!testsOnly) files.push('stage-lessons/kit.mjs');
  return files.sort();
}

async function main() {
  const { values } = parseArgs({
    options: {
      check: { type: 'boolean' },
      write: { type: 'boolean' },
      archive: { type: 'string' },
      exclude: { type: 'string', multiple: true, default: [] },
      'tests-only': { type: 'boolean', default: false },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log('node videos/tools/format-authored.mjs --check [--tests-only]');
    console.log(
      'node videos/tools/format-authored.mjs --write --archive NEW_DIRECTORY [--exclude test/FILE.mjs]',
    );
    console.log(
      'Formats direct videos/*.mjs, lib/*.mjs, test/*.mjs and stage-lessons/kit.mjs with unchanged JavaScript AST.',
    );
    console.log('Film, animation, asset and tool directories are outside this command.');
    return;
  }
  if (Boolean(values.check) === Boolean(values.write)) throw new Error('Choose --check or --write');
  if (values.write && !values.archive)
    throw new Error('--write requires a new --archive directory');
  const excluded = new Set(values.exclude);
  if (
    [...excluded].some(
      (name) =>
        path.isAbsolute(name) || name.split(/[\\/]/).includes('..') || !name.endsWith('.mjs'),
    )
  ) {
    throw new Error(
      '--exclude takes a selected path relative to videos/, such as test/example.test.mjs',
    );
  }
  const names = await authoredFiles(values['tests-only']);
  for (const name of excluded)
    if (!names.includes(name)) throw new Error(`Unknown exclusion: ${name}`);
  const selected = [];
  for (const name of names.filter((name) => !excluded.has(name))) {
    const file = path.join(videos, name);
    if (!(await fs.lstat(file)).isFile())
      throw new Error(`Expected a regular authored module: ${name}`);
    const before = await fs.readFile(file),
      source = before.toString('utf8');
    const after = Buffer.from(await formatSource(source, file));
    const changed = !before.equals(after);
    selected.push({ name, file, before, after, changed, ast: semanticHash(source) });
    if (changed && values.check) console.error(name);
  }
  const changes = selected.filter((entry) => entry.changed);
  if (values.write) {
    const archive = path.resolve(values.archive);
    await fs.mkdir(archive);
    const formatterInputs = [];
    for (const name of [
      'tools/format-authored.mjs',
      'tools/migrate-lesson-modules.mjs',
      '.prettierrc.json',
      'package.json',
      'package-lock.json',
    ]) {
      const bytes = await fs.readFile(path.join(videos, name));
      const output = path.join(archive, 'formatter', name);
      await fs.mkdir(path.dirname(output), { recursive: true });
      await fs.writeFile(output, bytes, { flag: 'wx' });
      formatterInputs.push({ path: `videos/${name}`, sha256: digest(bytes) });
    }
    for (const entry of selected) {
      await fs.mkdir(path.dirname(path.join(archive, 'before', entry.name)), { recursive: true });
      await fs.writeFile(path.join(archive, 'before', entry.name), entry.before, { flag: 'wx' });
    }
    const files = selected.map((entry) => ({
      path: `videos/${entry.name}`,
      beforeSha256: digest(entry.before),
      afterSha256: digest(entry.after),
      semanticSha256: entry.ast,
      changed: entry.changed,
    }));
    const plan = {
      version: 1,
      files,
      exclusions: [...excluded],
      testsOnly: values['tests-only'],
      formatterInputs,
      node: process.version,
    };
    await fs.writeFile(path.join(archive, 'plan.json'), JSON.stringify(plan, null, 2) + '\n', {
      flag: 'wx',
    });
    // Recheck the whole selection before the first write, then each file at its write.
    for (const entry of selected) {
      if (!(await fs.readFile(entry.file)).equals(entry.before))
        throw new Error(`Source changed during formatting preflight: ${entry.name}`);
    }
    for (const entry of changes) {
      if (!(await fs.readFile(entry.file)).equals(entry.before))
        throw new Error(`Source changed before formatting write: ${entry.name}`);
      await fs.writeFile(entry.file, entry.after);
    }
    for (const entry of selected) {
      const current = await fs.readFile(entry.file);
      if (!current.equals(entry.after) || semanticHash(current.toString('utf8')) !== entry.ast) {
        throw new Error(
          `Authored module differs from its reviewed formatting result: ${entry.name}`,
        );
      }
    }
    await fs.writeFile(
      path.join(archive, 'result.json'),
      JSON.stringify({ ...plan, passed: true, formatted: changes.length }, null, 2) + '\n',
      { flag: 'wx' },
    );
  }
  console.log(
    `${selected.length} authored modules checked; ${changes.length} ${values.write ? 'formatted' : 'need formatting'}; ${excluded.size} explicit exclusions.`,
  );
  if (values.check && changes.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
