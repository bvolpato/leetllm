import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { stringify } from 'yaml';
import {
  lessonRenderRuntime,
  productionSourceManifest,
  verifyProductionSources,
} from '../lib/lesson-production.mjs';
import { currentSourceFingerprint } from '../lib/source-fingerprint.mjs';
import { snapshotLessonSource } from '../lib/lesson-snapshot.mjs';

const run = promisify(execFile);
const repository = fileURLToPath(new URL('../../', import.meta.url));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const baseline = await productionSourceManifest({ root: repository, id: 'vectors' });

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'lesson-production-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const entry of baseline.closure.files) {
    const target = path.join(root, entry.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(path.join(repository, entry.path), target);
  }
  await fs.symlink(
    path.join(repository, 'videos/node_modules'),
    path.join(root, 'videos/node_modules'),
  );
  await fs.mkdir(path.join(root, 'web/src/content/example'), { recursive: true });
  await fs.writeFile(path.join(root, 'web/src/content/example/content.md'), 'Article.');
  await fs.mkdir(path.join(root, 'videos/films/example'), { recursive: true });
  await fs.writeFile(
    path.join(root, 'videos/films/example/scene.mjs'),
    "export function draw(ctx, scene, state, api) { api.text(ctx, 'Ready', 960, 500, 32, api.C.ink); }\n",
  );
  const entry =
    "import { defineCanvasLesson } from '../lib/lesson-definition.mjs';\nimport { draw } from '../films/example/scene.mjs';\nexport default defineCanvasLesson({ id: 'example', scenes: [{ id: 'only', draw }] });\n";
  // The composer is new and may not be imported by an unmigrated baseline lesson.
  for (const name of ['lesson-definition.mjs', 'lesson-definition.d.ts'])
    await fs.copyFile(
      path.join(repository, 'videos/lib', name),
      path.join(root, 'videos/lib', name),
    );
  await fs.writeFile(path.join(root, 'videos/animations/example.mjs'), entry);
  const lesson = {
    version: 1,
    id: 'example',
    title: 'Example',
    source: 'example/content.md',
    scenes: [
      {
        id: 'only',
        title: 'One scene',
        visual: 'A word.',
        beats: [{ say: 'Read the word on screen.', hold: 0.2 }],
      },
    ],
  };
  await fs.writeFile(path.join(root, 'videos/lessons/example.lesson.yaml'), stringify(lesson));
  return { root, lesson, entry };
}

const receiptFor = (manifest) => ({
  id: manifest.id,
  fingerprint: manifest.fingerprint,
  renderEngine: manifest.renderEngine,
  sourceManifest: manifest,
});

test('render, curation and packaging source contracts invalidate a changed transitive scene with an unchanged entry', async (t) => {
  const { root } = await fixture(t);
  const manifest = await productionSourceManifest({ root, id: 'example' }),
    receipt = receiptFor(manifest);
  assert.equal(await currentSourceFingerprint(root, 'example', receipt), manifest.fingerprint);
  assert.deepEqual(await verifyProductionSources(root, receipt), manifest);
  const entry = await fs.readFile(path.join(root, 'videos/animations/example.mjs'));
  await fs.appendFile(
    path.join(root, 'videos/films/example/scene.mjs'),
    '\nexport const changed = 2;\n',
  );
  assert.deepEqual(await fs.readFile(path.join(root, 'videos/animations/example.mjs')), entry);
  assert.notEqual(
    (await productionSourceManifest({ root, id: 'example' })).fingerprint,
    manifest.fingerprint,
  );
  await assert.rejects(verifyProductionSources(root, receipt), /different source code or assets/);
  await assert.rejects(
    currentSourceFingerprint(root, 'example', receipt),
    /different source code or assets/,
  );
});

test('the actual renderer validates composed narration instead of silently using a fallback draw', async (t) => {
  const { root, entry } = await fixture(t);
  const command = [path.join(root, 'videos/render.mjs'), '--lesson', 'example', '--validate'];
  await run(process.execPath, command, { cwd: root });
  await run(
    process.execPath,
    [path.join(root, 'videos/audit-occlusion.mjs'), '--lesson', 'example', '--validate'],
    { cwd: root },
  );
  await run(
    process.execPath,
    [
      path.join(root, 'videos/audit-text-ink.mjs'),
      '--lesson',
      'example',
      '--input',
      path.join(root, 'audit'),
    ],
    { cwd: root },
  );
  await fs.writeFile(
    path.join(root, 'videos/animations/example.mjs'),
    entry.replace("id: 'only', draw", "id: 'different', draw"),
  );
  await assert.rejects(run(process.execPath, command, { cwd: root }), (error) =>
    error.stderr.includes('scene order differs'),
  );
});

test('the audio renderer prefers a compatible uv on PATH and falls back before starting the adapter', async (t) => {
  const root = await fs.realpath((await fixture(t)).root);
  await fs.copyFile(path.join(repository, 'uv.toml'), path.join(root, 'uv.toml'));
  const adapter = 'videos/offline.py';
  await fs.writeFile(
    path.join(root, adapter),
    `#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.9"
# dependencies = []
# ///
import json, os, sys
from pathlib import Path

# Report which uv launched the adapter before any speech work starts.
with Path("invocations.jsonl").open("a") as log:
    print(json.dumps([os.environ["UV"], sys.executable]), file=log)
sys.exit("offline adapter stopped here")
`,
  );
  const command = [
    path.join(root, 'videos/render.mjs'),
    '--lesson',
    'example',
    '--audio-only',
    '--output',
    path.join(root, 'output'),
    '--tts-script',
    adapter,
  ];
  const env = {
    ...process.env,
    UV_OFFLINE: '1',
    UV_PYTHON_DOWNLOADS: 'never',
    UV_CONFIG_FILE: path.join(root, 'uv.toml'),
    UV_CACHE_DIR: path.join(root, 'cache'),
  };
  delete env.UV_NO_CONFIG;
  const invocations = path.join(root, 'invocations.jsonl');
  async function runAdapter(settings) {
    await assert.rejects(run(process.execPath, command, { cwd: root, env: settings }), (error) => {
      assert.match(error.stderr, /offline adapter stopped here/);
      return true;
    });
    const record = JSON.parse(await fs.readFile(invocations, 'utf8'));
    await fs.unlink(invocations);
    return record;
  }
  const [installed, python] = await runAdapter(env);
  const home = path.join(root, 'home');
  const name = process.platform === 'win32' ? 'uv.exe' : 'uv';
  const preferred = path.join(root, 'bin', name);
  const fallback = path.join(home, '.local', 'bin', name);
  for (const executable of [preferred, fallback]) {
    await fs.mkdir(path.dirname(executable), { recursive: true });
    await fs.copyFile(installed, executable);
  }
  const isolated = {
    ...env,
    HOME: home,
    USERPROFILE: home,
    PATH: path.dirname(preferred),
    UV_PYTHON: python,
  };
  delete isolated.UV;
  assert.equal((await runAdapter(isolated))[0], await fs.realpath(preferred));
  assert.equal((await runAdapter({ ...isolated, UV: fallback }))[0], await fs.realpath(fallback));

  // An executable that rejects uv commands shadows the compatible user installation.
  await fs.copyFile(process.execPath, preferred);
  assert.equal((await runAdapter(isolated))[0], await fs.realpath(fallback));
  await fs.writeFile(path.join(root, 'uv.toml'), 'required-version = ">=999"\n');
  await assert.rejects(run(process.execPath, command, { cwd: root, env: isolated }), (error) => {
    assert.match(error.stderr, /Required uv version `>=999` does not match the running version/);
    assert(error.stderr.includes(fallback));
    return true;
  });
  await assert.rejects(fs.stat(invocations), { code: 'ENOENT' });
});

test('a film sidecar binds required font bytes and rejects missing or escaping inputs', async (t) => {
  const { root } = await fixture(t);
  const sidecar = path.join(root, 'videos/films/example/sources.json');
  await fs.writeFile(sidecar, JSON.stringify({ files: ['videos/assets/missing-font.ttf'] }));
  await assert.rejects(productionSourceManifest({ root, id: 'example' }), /ENOENT/);
  await fs.writeFile(path.join(root, 'videos/assets/missing-font.ttf'), 'font bytes');
  const manifest = await productionSourceManifest({ root, id: 'example' });
  assert(manifest.closure.files.some((file) => file.path === 'videos/films/example/sources.json'));
  assert(manifest.closure.files.some((file) => file.path === 'videos/assets/missing-font.ttf'));
  await fs.writeFile(sidecar, JSON.stringify({ files: ['../outside.ttf'] }));
  await assert.rejects(productionSourceManifest({ root, id: 'example' }), /escapes source root/);
  await fs.writeFile(sidecar, JSON.stringify({ file: 'videos/assets/missing-font.ttf' }));
  await assert.rejects(productionSourceManifest({ root, id: 'example' }), /unknown input field/);
});

test('snapshot-local module aliases retain Node real-file import resolution', async (t) => {
  const { root, entry } = await fixture(t);
  await fs.mkdir(path.join(root, 'videos/films/real'), { recursive: true });
  await fs.writeFile(path.join(root, 'videos/films/real/value.mjs'), 'export const value = 1;\n');
  await fs.writeFile(
    path.join(root, 'videos/films/real/scene.mjs'),
    "import { value } from './value.mjs';\nexport function draw() { return value; }\n",
  );
  await fs.symlink('../real/scene.mjs', path.join(root, 'videos/films/example/alias.mjs'));
  await fs.writeFile(
    path.join(root, 'videos/animations/example.mjs'),
    entry.replace('/scene.mjs', '/alias.mjs'),
  );
  const manifest = await productionSourceManifest({ root, id: 'example' });
  const snapshot = await snapshotLessonSource({
    root,
    destination: path.join(root, 'alias-cold'),
    manifest,
  });
  await fs.symlink(
    path.join(repository, 'videos/node_modules'),
    path.join(snapshot.repository, 'videos/node_modules'),
  );
  const alias = path.join(snapshot.repository, 'videos/films/example/alias.mjs');
  const target = await fs.realpath(alias);
  assert(target.startsWith(snapshot.repository + path.sep));
  assert.equal((await import(new URL(`file://${alias}`))).draw(), 1);
  assert.deepEqual(
    await productionSourceManifest({ root: snapshot.repository, id: 'example' }),
    manifest,
  );
});

test('declared paper derivatives and metadata survive a relocated immutable snapshot and stale paper bytes fail', async (t) => {
  const { root, lesson } = await fixture(t);
  await fs.mkdir(path.join(root, 'videos/assets/example'), { recursive: true });
  const image = Buffer.from('local image bytes'),
    paper = Buffer.from('%PDF-1.7\nsource paper');
  const imagePath = 'videos/assets/example/figure.png',
    paperPath = 'videos/assets/example/paper.pdf',
    metadataPath = 'videos/assets/example/provenance.json';
  await fs.writeFile(path.join(root, imagePath), image);
  await fs.writeFile(path.join(root, paperPath), paper);
  const metadata = {
    assets: [
      {
        id: 'paper-figure',
        path: imagePath,
        sha256: hash(image),
        mediaType: 'image/png',
        width: 200,
        height: 100,
        source: {
          path: paperPath,
          sha256: hash(paper),
          title: 'Original paper',
          locator: 'Figure 2, page 3',
        },
        derivation: { crop: [0, 0, 200, 100] },
      },
    ],
  };
  await fs.writeFile(path.join(root, metadataPath), JSON.stringify(metadata));
  lesson.asset_manifests = [metadataPath];
  await fs.writeFile(path.join(root, 'videos/lessons/example.lesson.yaml'), stringify(lesson));
  const manifest = await productionSourceManifest({ root, id: 'example' });
  const snapshot = await snapshotLessonSource({
    root,
    destination: path.join(root, 'cold'),
    manifest,
  });
  await fs.symlink(
    path.join(repository, 'videos/node_modules'),
    path.join(snapshot.repository, 'videos/node_modules'),
  );
  assert.deepEqual(await fs.readFile(path.join(snapshot.repository, imagePath)), image);
  assert.deepEqual(await fs.readFile(path.join(snapshot.repository, paperPath)), paper);
  assert.deepEqual(
    await productionSourceManifest({ root: snapshot.repository, id: 'example' }),
    manifest,
  );
  await assert.rejects(
    snapshotLessonSource({ root, destination: path.join(root, 'cold'), manifest }),
    /EEXIST/,
  );
  await fs.writeFile(path.join(root, paperPath), 'changed original paper');
  await assert.rejects(productionSourceManifest({ root, id: 'example' }), /asset SHA-256 mismatch/);
  assert.deepEqual(await fs.readFile(path.join(snapshot.repository, paperPath)), paper);
});

test('a published runtime cold snapshot installs its exact registry package and validates without ambient modules', async (t) => {
  const { root } = await fixture(t);
  const manifest = await productionSourceManifest({ root, id: 'example' });
  assert.equal(manifest.renderEngine.dependencyLockSha256, null);
  const snapshot = await snapshotLessonSource({
    root,
    destination: path.join(root, 'public-cold'),
    manifest,
  });
  assert(!snapshot.runtimeFiles.some((file) => file.path === 'pnpm-lock.yaml'));
  assert.deepEqual(snapshot.install, [
    {
      cwd: 'repository/videos',
      command: ['node', 'check-npm-release-age.mjs', 'package-lock.json'],
    },
    { cwd: 'repository/videos', command: ['npm', 'ci', '--ignore-scripts'] },
  ]);
  for (const install of snapshot.install)
    await run(install.command[0], install.command.slice(1), {
      cwd: path.join(root, 'public-cold', install.cwd),
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
    });
  const installed = await fs.realpath(
    path.join(snapshot.repository, 'videos/node_modules/vizmatic'),
  );
  assert(installed.startsWith(snapshot.repository + path.sep));
  await run(
    process.execPath,
    [path.join(snapshot.repository, 'videos/render.mjs'), '--lesson', 'example', '--validate'],
    {
      cwd: snapshot.repository,
      timeout: 30_000,
    },
  );
  assert.deepEqual(
    await productionSourceManifest({ root: snapshot.repository, id: 'example' }),
    manifest,
  );
});

test('a source runtime snapshot retains its bound lock and legacy file-dependency installation sequence', async (t) => {
  const { root } = await fixture(t);
  const sourceRuntime = path.join(root, 'source-runtime');
  await fs.cp((await lessonRenderRuntime(repository)).root, sourceRuntime, { recursive: true });
  await fs.chmod(sourceRuntime, 0o755);
  for (const entry of await fs.readdir(sourceRuntime, { recursive: true, withFileTypes: true })) {
    if (entry.isDirectory()) await fs.chmod(path.join(entry.parentPath, entry.name), 0o755);
  }
  const lock = "lockfileVersion: '9.0'\nimporters: {}\n";
  await fs.writeFile(path.join(sourceRuntime, 'pnpm-lock.yaml'), lock);
  await fs.unlink(path.join(root, 'videos/node_modules'));
  await fs.mkdir(path.join(root, 'videos/node_modules'));
  await fs.symlink(sourceRuntime, path.join(root, 'videos/node_modules/vizmatic'));
  const packageFile = path.join(root, 'videos/package.json');
  const packageMetadata = JSON.parse(await fs.readFile(packageFile, 'utf8'));
  packageMetadata.dependencies.vizmatic = 'file:../../vizmatic';
  await fs.writeFile(packageFile, JSON.stringify(packageMetadata));
  const manifest = await productionSourceManifest({ root, id: 'example' });
  assert.equal(manifest.renderEngine.dependencyLockSha256, hash(lock));
  const snapshot = await snapshotLessonSource({
    root,
    destination: path.join(root, 'source-cold'),
    manifest,
  });
  assert.equal(
    await fs.readFile(path.join(root, 'source-cold/vizmatic/pnpm-lock.yaml'), 'utf8'),
    lock,
  );
  assert.deepEqual(snapshot.install, [
    {
      cwd: 'vizmatic',
      command: ['pnpm', 'install', '--frozen-lockfile', '--prod', '--ignore-scripts'],
    },
    { cwd: 'repository/videos', command: ['npm', 'ci', '--ignore-scripts'] },
  ]);
});

test('a directory stage project binds its recorded script, scene imports and local ledger', async (t) => {
  const { root, lesson } = await fixture(t);
  const project = path.join(root, 'videos/stage-lessons/example');
  await fs.mkdir(project, { recursive: true });
  await fs.writeFile(path.join(project, 'lesson.yaml'), stringify(lesson));
  await fs.writeFile(path.join(project, 'index.mjs'), "import './picture.mjs';\n");
  await fs.writeFile(path.join(project, 'picture.mjs'), 'export const color = "blue";\n');
  await fs.writeFile(path.join(project, 'coverage.yaml'), 'version: 1\n');
  const manifest = await productionSourceManifest({ root, id: 'example', mode: 'stage' });
  const sources = manifest.closure.files.map((entry) => entry.path);
  for (const name of ['index.mjs', 'picture.mjs', 'lesson.yaml', 'coverage.yaml'])
    assert.ok(sources.includes('videos/stage-lessons/example/' + name));
  await fs.writeFile(path.join(project, 'picture.mjs'), 'export const color = "green";\n');
  const next = await productionSourceManifest({ root, id: 'example', mode: 'stage' });
  assert.notEqual(next.fingerprint, manifest.fingerprint);
});
