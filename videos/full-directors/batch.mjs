import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
  discoverFiles,
  freezeFiles,
  hashFileStream,
  runBoundedQueue,
  runtimeSnapshot,
  validateCollection,
} from '../lib/batch.mjs';
import { lessonSourceManifest } from '../lib/lesson-source-manifest.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const directors = join(root, 'videos/full-directors');
const usage =
  'Usage: node videos/full-directors/batch.mjs --out DIR [--jobs 1..4] [--verify-only] (--all | SLUG...)';

const curriculum = join(root, 'videos/collections/complete-curriculum.json');
const loadCatalog = async () => validateCollection(JSON.parse(await readFile(curriculum, 'utf8')));

async function sourceFreeze(lesson, runtime) {
  const { id, source } = lesson;
  const directory = 'videos/full-directors/lessons/' + id;
  const timeline = 'videos/director-cuts/lesson-runtime/timeline.mjs';
  const short = 'videos/director-cuts/lessons/' + id + '/film.mjs';
  const entry = directory + '/film.mjs';
  const hasShortFilm = await fileInfo(join(root, short));
  // The shared timeline loads the short edition by the selected curriculum slug.
  const closure = await lessonSourceManifest({
    root,
    entry: hasShortFilm ? [entry, timeline] : entry,
    dynamicImports: hasShortFilm ? { [timeline]: [short] } : {},
  });
  const inputs = [
    directory,
    'web/src/content/' + dirname(source),
    'web/tools/book/fonts',
    'videos/lib',
    'videos/adapters',
    'videos/assets',
    'videos/test/fixtures',
    'videos/stage-lessons/kit.mjs',
    'videos/lessons/' + id + '.lesson.yaml',
    'videos/director-cuts/lesson-runtime',
    'videos/director-cuts/lessons/' + id,
    'videos/render.mjs',
    'videos/check-coverage.mjs',
    'videos/catalog.mjs',
    'videos/narration.json',
    'videos/soundbed.json',
    'videos/vizmatic-review.commit',
    'videos/package.json',
    'videos/package-lock.json',
    ...['render.mjs', 'check.mjs', 'film.mjs', 'sound.mjs'].map(
      (name) => 'videos/full-directors/' + name,
    ),
    ...['course-score.mjs', 'score.mjs', id + '.json'].map((name) => 'videos/soundtracks/' + name),
    ...closure.files
      .filter((file) => file.path.startsWith('videos/films/'))
      .map((file) => file.path.split('/').slice(0, 3).join('/')),
  ];
  const paths = [];
  for (const input of new Set(inputs)) {
    const path = join(root, input);
    const info = await fileInfo(path);
    if (info?.isDirectory()) {
      const files = await discoverFiles(path, {
        include: (file) => !(file.endsWith('.pyc') && basename(dirname(file)) === '__pycache__'),
      });
      paths.push(...files);
    } else if (info) paths.push(path);
  }
  return freezeFiles(root, paths, { lesson, modules: closure.fingerprint, runtime });
}

function observeRuntime() {
  return runtimeSnapshot({
    spawnSyncImpl(command, args, options) {
      const first = spawnSync(command, args, options);
      if (!first.error && first.status === 0 && (first.stdout || first.stderr)?.trim())
        return first;
      console.warn(
        `Retrying ${command} version probe (${first.error?.code || first.status || 'empty response'})`,
      );
      return spawnSync(command, args, { ...options, timeout: 15000 });
    },
  });
}

function requireVersions(runtime) {
  const missing = ['ffmpeg', 'ffprobe', 'uv'].filter((name) => !runtime[name]);
  if (missing.length) throw new Error('Could not verify runtime versions: ' + missing.join(', '));
  return runtime;
}

function changedInputs(before, after) {
  const changed = [];
  for (const key of ['lesson', 'modules']) {
    if (JSON.stringify(before.runtime[key]) !== JSON.stringify(after.runtime[key]))
      changed.push(key);
  }
  for (const [key, value] of Object.entries(after.runtime.runtime)) {
    const previous = before.runtime.runtime[key];
    if (value !== null && JSON.stringify(previous) !== JSON.stringify(value))
      changed.push(`${key} (${JSON.stringify(previous)} -> ${JSON.stringify(value)})`);
  }
  const files = new Map(before.files.map((entry) => [entry.path, entry.sha256]));
  for (const entry of after.files) {
    if (files.get(entry.path) !== entry.sha256) changed.push(entry.path);
    files.delete(entry.path);
  }
  return [...changed, ...files.keys()];
}

async function finalize(pending, lesson, index, movie, receipts) {
  const refusal = join(pending, 'refused.json');
  if (await fileInfo(refusal)) throw new Error('Source changed during export. Inspect ' + refusal);
  if (!(await lstat(pending)).isDirectory()) throw new Error('Invalid pending export directory');
  const staged = join(pending, 'movie.mp4');
  const record = join(pending, 'verification.json');
  if (!(await lstat(staged)).isFile() || !(await lstat(record)).isFile())
    throw new Error('Invalid pending export files');
  const { source, digest } = JSON.parse(await readFile(record, 'utf8'));
  const sourceDigest = createHash('sha256')
    .update(JSON.stringify({ files: source.files, runtime: source.runtime }))
    .digest('hex');
  if (
    !/^[a-f0-9]{64}$/.test(digest) ||
    sourceDigest !== source.sha256 ||
    source.runtime.lesson.id !== lesson.id ||
    (await hashFileStream(staged)) !== digest
  )
    throw new Error('Pending movie or verification record changed: ' + pending);
  const current = (await loadCatalog()).lessons[index];
  const runtime = observeRuntime();
  const after = current?.id === lesson.id ? await sourceFreeze(current, runtime) : null;
  const changed = after ? changedInputs(source, after) : ['curriculum order'];
  if (changed.length) {
    const observed = { before: source.sha256, after: after?.sha256 ?? null, runtime, changed };
    await writeFile(refusal, JSON.stringify(observed), { flag: 'wx' });
    throw new Error(
      `Lesson source or renderer changed during the export (${source.sha256} -> ${observed.after}): ${changed.slice(0, 10).join(', ')}. Inspect ${refusal}.`,
    );
  }
  if (['ffmpeg', 'ffprobe', 'uv'].some((name) => !runtime[name])) {
    await writeFile(
      join(pending, 'unavailable.json'),
      JSON.stringify({ source: after.sha256, runtime }),
    );
  }
  requireVersions(runtime);
  if (after.sha256 !== source.sha256) throw new Error('Source verification failed for ' + pending);
  const marker = join(receipts, `${lesson.id}.${source.sha256}.${digest}`);
  await writeFile(marker, '', { flag: 'a' });
  await link(staged, movie);
  await rm(pending, { recursive: true });
}

function run(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(directors, script), ...args], {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with ${signal || code}`));
    });
  });
}

async function fileInfo(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      all: { type: 'boolean' },
      out: { type: 'string' },
      jobs: { type: 'string', default: '4' },
      'verify-only': { type: 'boolean' },
      help: { type: 'boolean' },
    },
  });
  if (values.help) return console.log(usage);
  if (
    !values.out ||
    !/^[1-4]$/.test(values.jobs) ||
    Boolean(values.all) === Boolean(positionals.length)
  )
    throw new Error(usage);

  const catalog = await loadCatalog();
  const wanted = new Set(positionals);
  const lessons = catalog.lessons
    .map((lesson, index) => ({
      lesson,
      index,
      name: `${String(index + 1).padStart(3, '0')}-${lesson.id}.mp4`,
    }))
    .filter(({ lesson }) => values.all || wanted.delete(lesson.id));
  if (wanted.size) throw new Error('Unknown curriculum slug: ' + [...wanted].join(', '));
  const output = resolve(values.out);
  const receipts = join(output, '.full-directors');
  await mkdir(receipts, { recursive: true });
  const saved = await readdir(receipts);
  await runBoundedQueue(lessons, Number(values.jobs), async ({ lesson, index, name }) => {
    const { id } = lesson;
    try {
      const movie = join(output, name);
      const existing = await fileInfo(movie);
      const unverified = () => console.warn(`Existing/unverified ${name} (preserved)`);
      if (existing && (!existing.isFile() || !saved.some((entry) => entry.startsWith(id + '.'))))
        return unverified();
      const pending = join(receipts, 'pending-' + id);
      if (existing) {
        const { sha256 } = await sourceFreeze(lesson, requireVersions(observeRuntime()));
        if (!saved.some((entry) => entry.startsWith(`${id}.${sha256}.`))) return unverified();
        const marker = join(receipts, `${id}.${sha256}.${await hashFileStream(movie)}`);
        if (!(await fileInfo(marker))?.isFile()) return unverified();
        return console.log(`Verified existing ${name}`);
      }
      if (!(await fileInfo(pending))) {
        if (values['verify-only']) throw new Error('No checked export to verify for ' + id);
        const source = await sourceFreeze(lesson, requireVersions(observeRuntime()));
        const work = await mkdtemp(join(receipts, 'work-'));
        try {
          const staged = join(work, 'movie.mp4');
          console.log(`Checking and rendering ${name}`);
          await run('check.mjs', [id, '--sheet', join(work, 'sheet.jpg')]);
          await run('render.mjs', [id, '--out', staged, '--reuse-canvas-readback']);
          const digest = await hashFileStream(staged);
          await writeFile(join(work, 'verification.json'), JSON.stringify({ source, digest }), {
            flag: 'wx',
          });
          await rename(work, pending);
        } finally {
          await rm(work, { recursive: true, force: true });
        }
      }
      await finalize(pending, lesson, index, movie, receipts);
      console.log(`Finished ${name}`);
    } catch (error) {
      console.error(`${name}: ${error.message}`);
      process.exitCode = 1;
    }
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
