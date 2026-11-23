import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { productionSourceManifest, lessonRenderRuntime } from './lesson-production.mjs';
import { renderEngineProvenance } from './render-engine.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const inside = (root, file) => {
  const name = path.relative(root, file);
  return name !== '..' && !name.startsWith(`..${path.sep}`) && !path.isAbsolute(name);
};

/** Copy the exact declared closure into a new workspace, without mutable source links. */
export async function snapshotLessonSource({ root, destination, manifest }) {
  root = await fs.realpath(root);
  const current = await productionSourceManifest({
    root,
    id: manifest.id,
    mode: manifest.mode,
    ttsScript: manifest.ttsScript,
  });
  if (JSON.stringify(current) !== JSON.stringify(manifest))
    throw new Error('Source changed before snapshot');
  const target = path.resolve(destination);
  await fs.mkdir(target); // An existing attempt is immutable, including an incomplete one.
  const repository = path.join(target, 'repository');
  const copied = [],
    materialized = new Map(),
    aliases = [];
  for (const record of manifest.closure.files) {
    const original = path.resolve(root, record.path);
    if (!inside(root, original) || !inside(root, await fs.realpath(original)))
      throw new Error(`Snapshot source escapes root: ${record.path}`);
    const bytes = await fs.readFile(original);
    if (sha256(bytes) !== record.sha256)
      throw new Error(`Source changed while snapshotting: ${record.path}`);
    // Keep Node's real-file import base for an internal alias. Every target is a
    // copied file inside this snapshot; no link points back at the live checkout.
    const output = path.resolve(repository, record.resolvedPath);
    if (!inside(repository, output))
      throw new Error(`Snapshot output escapes root: ${record.path}`);
    if (materialized.has(output)) {
      if (materialized.get(output) !== record.sha256)
        throw new Error(`Conflicting snapshot aliases: ${record.path}`);
    } else {
      await fs.mkdir(path.dirname(output), { recursive: true });
      await fs.writeFile(output, bytes, { flag: 'wx' });
      materialized.set(output, record.sha256);
    }
    if (record.path !== record.resolvedPath) aliases.push({ path: record.path, output });
    copied.push({ path: record.path, sha256: record.sha256, bytes: bytes.length });
  }
  for (const alias of aliases) {
    const output = path.resolve(repository, alias.path);
    if (!inside(repository, output) || materialized.has(output))
      throw new Error(`Conflicting snapshot alias: ${alias.path}`);
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.symlink(path.relative(path.dirname(output), alias.output), output);
  }
  const after = await productionSourceManifest({
    root,
    id: manifest.id,
    mode: manifest.mode,
    ttsScript: manifest.ttsScript,
  });
  if (JSON.stringify(after) !== JSON.stringify(manifest))
    throw new Error('Source changed during snapshot');
  const engineRoot = (await lessonRenderRuntime(root)).root;
  const runtimeFiles = [];
  const activeDirectories = new Set();
  async function copyRuntime(input, relative) {
    const actual = await fs.realpath(input);
    if (!inside(engineRoot, actual))
      throw new Error(`Vizmatic snapshot dependency escapes package: ${relative}`);
    const info = await fs.stat(actual);
    if (info.isDirectory()) {
      if (activeDirectories.has(actual))
        throw new Error(`Vizmatic snapshot directory cycle: ${relative}`);
      activeDirectories.add(actual);
      for (const name of (await fs.readdir(actual)).sort())
        await copyRuntime(path.join(actual, name), `${relative}/${name}`);
      activeDirectories.delete(actual);
    } else if (info.isFile()) {
      const bytes = await fs.readFile(actual),
        output = path.join(target, 'vizmatic', relative);
      await fs.mkdir(path.dirname(output), { recursive: true });
      await fs.writeFile(output, bytes, { flag: 'wx' });
      runtimeFiles.push({ path: relative, sha256: sha256(bytes), bytes: bytes.length });
    } else throw new Error(`Unsupported Vizmatic snapshot file: ${relative}`);
  }
  for (const name of ['dist', 'assets', 'package.json'])
    await copyRuntime(path.join(engineRoot, name), name);
  const sourcePackage = manifest.renderEngine.dependencyLockSha256 !== null;
  if (sourcePackage) await copyRuntime(path.join(engineRoot, 'pnpm-lock.yaml'), 'pnpm-lock.yaml');
  for (const record of manifest.runtimeInstallation) {
    await copyRuntime(path.join(engineRoot, record.path), record.path);
    if (runtimeFiles.at(-1).sha256 !== record.sha256)
      throw new Error(`Vizmatic installation input changed: ${record.path}`);
  }
  const frozenEngine = renderEngineProvenance({
    entry: path.join(target, 'vizmatic', manifest.renderEngine.entryPath),
  });
  if (JSON.stringify(frozenEngine) !== JSON.stringify(manifest.renderEngine))
    throw new Error('Vizmatic changed during snapshot');
  const record = {
    version: 1,
    repository,
    manifest,
    files: copied,
    runtimeFiles,
    install: [
      ...(sourcePackage
        ? [
            {
              cwd: 'vizmatic',
              command: ['pnpm', 'install', '--frozen-lockfile', '--prod', '--ignore-scripts'],
            },
          ]
        : [
            {
              cwd: 'repository/videos',
              command: ['node', 'check-npm-release-age.mjs', 'package-lock.json'],
            },
          ]),
      { cwd: 'repository/videos', command: ['npm', 'ci', '--ignore-scripts'] },
    ],
    dependencies:
      'The snapshot contains immutable local source/assets and the exact distributed Vizmatic runtime. Install its pinned dependencies in this isolated workspace before rendering.',
  };
  await fs.writeFile(
    path.join(target, 'source-snapshot.json'),
    JSON.stringify(record, null, 2) + '\n',
    { flag: 'wx' },
  );
  return record;
}
