import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, readdir, readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep, win32 } from 'node:path';
import { spawnSync } from 'node:child_process';
import { renderEngineProvenance } from './render-engine.mjs';

const slug = /^[a-z][a-z0-9-]*$/;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function validateCollection(value, { knownIds } = {}) {
  const fail = (message) => {
    throw new Error(`Invalid collection: ${message}`);
  };
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('expected an object');
  if (value.version !== 1) fail('version must be 1');
  if (!slug.test(value.id ?? '')) fail('id must be a lowercase slug');
  if (typeof value.title !== 'string' || !value.title.trim()) fail('title is required');
  if (!Array.isArray(value.lessons) || value.lessons.length === 0)
    fail('lessons must be a nonempty array');
  const ids = new Set();
  const lessons = value.lessons.map((lesson, index) => {
    if (!lesson || typeof lesson !== 'object' || Array.isArray(lesson))
      fail(`lesson ${index + 1} must be an object`);
    if (!slug.test(lesson.id ?? '')) fail(`lesson ${index + 1} has an invalid id`);
    if (ids.has(lesson.id)) fail(`duplicate lesson id ${lesson.id}`);
    ids.add(lesson.id);
    if (knownIds && !knownIds.has(lesson.id)) fail(`unknown lesson id ${lesson.id}`);
    if (typeof lesson.title !== 'string' || !lesson.title.trim())
      fail(`${lesson.id}: title is required`);
    if (typeof lesson.group !== 'string' || !lesson.group.trim())
      fail(`${lesson.id}: group is required`);
    if (
      typeof lesson.source !== 'string' ||
      !lesson.source.trim() ||
      isAbsolute(lesson.source) ||
      win32.isAbsolute(lesson.source) ||
      lesson.source.split(/[\\/]/).some((part) => part === '..' || part === '.')
    ) {
      fail(`${lesson.id}: source must be a repository-relative path`);
    }
    return { ...lesson };
  });
  if (value.description !== undefined && typeof value.description !== 'string')
    fail('description must be a string');
  if (value.output !== undefined && (typeof value.output !== 'string' || !value.output.trim()))
    fail('output must be a path');
  return { ...value, lessons };
}

export async function discoverFiles(directory, { extensions, include = () => true } = {}) {
  const found = [];
  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const path = join(current, entry.name);
      if (entry.isSymbolicLink())
        throw new Error(`Source freeze does not accept symlinks: ${path}`);
      if (entry.isDirectory()) await visit(path);
      else if (
        entry.isFile() &&
        (!extensions || extensions.some((extension) => entry.name.endsWith(extension))) &&
        include(path)
      )
        found.push(path);
    }
  }
  await visit(directory);
  return found;
}

export async function freezeFiles(root, paths, runtime = {}) {
  const rootPath = resolve(root);
  const names = [
    ...new Set(
      paths.map((path) => relative(rootPath, resolve(rootPath, path)).split(sep).join('/')),
    ),
  ].sort();
  if (names.some((name) => name === '..' || name.startsWith('../') || isAbsolute(name)))
    throw new Error('Source freeze path escaped its root');
  const files = [];
  for (const name of names) {
    const path = resolve(rootPath, name);
    const info = await lstat(path);
    if (info.isSymbolicLink()) throw new Error(`Source freeze does not accept symlinks: ${name}`);
    if (!info.isFile()) throw new Error(`Source freeze input is not a file: ${name}`);
    files.push({ path: name, sha256: sha256(await readFile(path)) });
  }
  const sourceSha256 = sha256(Buffer.from(JSON.stringify({ files, runtime })));
  return { sha256: sourceSha256, files, runtime };
}

export async function assertFreezeMatches(root, frozen, currentPaths, runtime = frozen.runtime) {
  const current = await freezeFiles(root, currentPaths, runtime);
  const expectedPaths = frozen.files.map((file) => file.path);
  const currentPathsSorted = current.files.map((file) => file.path);
  const expected = new Map(frozen.files.map((file) => [file.path, file.sha256]));
  const actual = new Map(current.files.map((file) => [file.path, file.sha256]));
  const changed = [...new Set([...expectedPaths, ...currentPathsSorted])].filter(
    (path) => expected.get(path) !== actual.get(path),
  );
  if (changed.length || current.sha256 !== frozen.sha256) {
    throw new Error(
      `Source freeze changed${changed.length ? `: ${changed.slice(0, 8).join(', ')}${changed.length > 8 ? ', …' : ''}` : ' (runtime inputs differ)'}`,
    );
  }
  return current;
}

export async function runBoundedQueue(items, concurrency, callback, { onFailure } = {}) {
  if (!Array.isArray(items)) throw new TypeError('Queue items must be an array');
  if (!Number.isInteger(concurrency) || concurrency < 1)
    throw new RangeError('Queue concurrency must be a positive integer');
  const results = new Array(items.length),
    failures = [];
  let next = 0,
    stopped = false;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (!stopped) {
      const index = next++;
      if (index >= items.length) return;
      try {
        results[index] = await callback(items[index], index);
      } catch (error) {
        failures.push({ index, error });
        if (!stopped) {
          stopped = true;
          onFailure?.(error, items[index], index);
        }
        return;
      }
    }
  });
  await Promise.all(workers);
  if (failures.length) {
    failures.sort((a, b) => a.index - b.index);
    const first = failures[0].error;
    if (failures.length > 1)
      throw new AggregateError(
        failures.map((item) => item.error),
        `Batch queue stopped after ${failures.length} task failure(s): ${first.message}`,
        { cause: first },
      );
    throw first;
  }
  return results;
}

export async function runReviewQueue(
  items,
  concurrency,
  callback,
  { keepGoing = false, assertSources, signal, maxFailures = 8 } = {},
) {
  if (!keepGoing) return runBoundedQueue(items, concurrency, callback);
  if (typeof assertSources !== 'function')
    throw new TypeError('Review queue requires a source-freeze check');
  if (!Number.isInteger(maxFailures) || maxFailures < 1)
    throw new RangeError('Review failure limit must be a positive integer');
  const failures = [];
  const results = await runBoundedQueue(items, concurrency, async (item, index) => {
    try {
      return await callback(item, index);
    } catch (error) {
      if (signal?.aborted) throw error;
      await assertSources();
      failures.push({ index, error });
      if (failures.length >= maxFailures)
        throw new AggregateError(
          failures.map((item) => item.error),
          `Review queue reached its limit of ${maxFailures} failed lessons`,
          { cause: error },
        );
      return undefined;
    }
  });
  if (failures.length) {
    failures.sort((a, b) => a.index - b.index);
    throw new AggregateError(
      failures.map((item) => item.error),
      `${failures.length} lesson review(s) failed; independent lessons were still processed`,
      { cause: failures[0].error },
    );
  }
  return results;
}

const truncatedSpeechCacheLine =
  /^Error: Word timing exceeds audio: (?:\/|[A-Za-z]:\\)[^\r\n]*[\\/]\.audio-cache[\\/][0-9a-f]{64}\.json$/m;

export async function runWithTruncatedSpeechRecovery({
  run,
  readLog,
  logFileForAttempt,
  assertFrozen,
  signal,
  onRetry = () => {},
}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (signal?.aborted) throw new Error('Audio preparation interrupted');
    const logFile = logFileForAttempt(attempt);
    try {
      await run({ attempt, logFile });
      return;
    } catch (error) {
      if (signal?.aborted || attempt === 3) throw error;
      let log;
      try {
        log = await readLog(logFile);
      } catch {
        throw error;
      }
      if (!truncatedSpeechCacheLine.test(log)) throw error;
      await assertFrozen();
      onRetry({ attempt, nextAttempt: attempt + 1, logFile });
    }
  }
}

export function runtimeSnapshot({ spawnSyncImpl = spawnSync } = {}) {
  const version = (command) => {
    try {
      const flag = command === 'ffmpeg' || command === 'ffprobe' ? '-version' : '--version';
      const result = spawnSyncImpl(command, [flag], { encoding: 'utf8', timeout: 3000 });
      if (result.error || result.status !== 0) return null;
      return (result.stdout || result.stderr).trim().split(/\r?\n/, 1)[0] || null;
    } catch {
      return null;
    }
  };
  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    ffmpeg: version('ffmpeg'),
    ffprobe: version('ffprobe'),
    uv: version('uv'),
    vizmatic: renderEngineProvenance(),
  };
}

export async function hashFileStream(path) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest('hex');
}

export function validateOutputPath(
  output,
  { repositoryRoot, videosRoot, contentRoot, buildRoot = join(repositoryRoot, 'build') },
) {
  const path = resolve(output),
    repository = resolve(repositoryRoot);
  const withinOrEqual = (base, candidate) =>
    resolve(base) === resolve(candidate) || assertInside(base, candidate);
  if (withinOrEqual(path, repository))
    throw new Error('Output cannot be a parent directory of the repository');
  const inRepository = withinOrEqual(repository, path);
  if (inRepository && !withinOrEqual(buildRoot, path))
    throw new Error('Output inside the repository must be under build/');
  if (withinOrEqual(videosRoot, path) || withinOrEqual(contentRoot, path)) {
    throw new Error('Output cannot overlap video sources or article content');
  }
  return path;
}

export function inspectReportIsComplete(report, receipt) {
  const audit = report?.decodedFrameAudit;
  return (
    report?.videoSha256 === receipt?.sha256 &&
    audit?.passed === true &&
    audit?.decodePassed === true &&
    Number.isInteger(audit.frames) &&
    audit.frames === audit.expectedFrames &&
    audit.frames === receipt?.frameAudit?.frames &&
    Array.isArray(audit.unexplainedBlankRuns) &&
    audit.unexplainedBlankRuns.length === 0
  );
}

export function assertInside(directory, candidate) {
  const base = resolve(directory),
    path = resolve(candidate),
    fromBase = relative(base, path);
  if (!fromBase || fromBase === '..' || fromBase.startsWith(`..${sep}`) || isAbsolute(fromBase))
    return false;
  return true;
}
