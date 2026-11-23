import { createHash } from 'node:crypto';
import { readFile, stat, realpath, readdir } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { parse } from 'yaml';
import { lessonSourceManifest } from './lesson-source-manifest.mjs';
import { renderEngineProvenance } from './render-engine.mjs';

const slug = /^[a-z][a-z0-9-]*$/;
const digest = (value) => createHash('sha256').update(value).digest('hex');

function relativeFile(root, file) {
  const relative = path.relative(root, path.resolve(root, file));
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Lesson input escapes repository: ${file}`);
  }
  return relative.split(path.sep).join('/');
}

function declaredInputs(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${label}: expected an input object`);
  for (const key of Object.keys(value)) {
    if (!['files', 'assets', 'dynamicImports'].includes(key))
      throw new Error(`${label}: unknown input field ${key}`);
  }
  const { files = [], assets = [], dynamicImports = {} } = value;
  const local = (file) =>
    typeof file === 'string' &&
    file.length > 0 &&
    !path.isAbsolute(file) &&
    !/^[a-z][a-z0-9+.-]*:/i.test(file);
  if (!Array.isArray(files) || files.some((file) => !local(file)))
    throw new Error(`${label}: files must contain repository-relative paths`);
  if (
    !Array.isArray(assets) ||
    assets.some(
      (asset) =>
        !asset ||
        typeof asset !== 'object' ||
        !local(asset.path) ||
        (asset.source?.path !== undefined && !local(asset.source.path)),
    )
  ) {
    throw new Error(`${label}: assets must name repository-relative local files`);
  }
  if (
    !dynamicImports ||
    typeof dynamicImports !== 'object' ||
    Array.isArray(dynamicImports) ||
    Object.entries(dynamicImports).some(
      ([from, targets]) =>
        !local(from) ||
        !Array.isArray(targets) ||
        !targets.length ||
        targets.some((file) => !local(file)),
    )
  ) {
    throw new Error(
      `${label}: dynamicImports must map repository-relative importers to local targets`,
    );
  }
  return { files, assets, dynamicImports };
}

/** Resolve the established authoring locations without executing a lesson module. */
export function lessonSourcePaths(id, { mode = 'canvas', root } = {}) {
  if (!slug.test(id)) throw new Error(`Invalid lesson id: ${id}`);
  if (!['canvas', 'stage'].includes(mode)) throw new Error(`Unknown lesson mode: ${mode}`);
  const project = `videos/stage-lessons/${id}`;
  if (
    mode === 'stage' &&
    root &&
    !existsSync(path.join(root, project + '.lesson.yaml')) &&
    existsSync(path.join(root, project, 'lesson.yaml'))
  ) {
    return { lessonFile: project + '/lesson.yaml', moduleFile: project + '/index.mjs' };
  }
  const directory = mode === 'stage' ? 'stage-lessons' : 'lessons';
  return {
    lessonFile: `videos/${directory}/${id}.lesson.yaml`,
    moduleFile:
      mode === 'stage' ? `videos/stage-lessons/${id}.film.mjs` : `videos/animations/${id}.mjs`,
  };
}

/** Validate a composed Canvas definition before using the legacy audited draw API. */
export function canvasLessonImplementation(module, lesson) {
  const definition = module.default;
  if (definition?.kind === 'leetllm.canvas-lesson') {
    definition.validate(lesson);
    return {
      draw: definition.draw,
      validateModel: definition.validateModel ?? module.validateModel,
    };
  }
  if (definition?.kind) throw new Error(`${lesson.id}: expected a Canvas lesson definition`);
  if (typeof module.draw !== 'function')
    throw new Error(`${lesson.id}: export draw or default defineCanvasLesson(...)`);
  return { draw: module.draw, validateModel: module.validateModel };
}

/** Resolve the runtime installed for this workspace, including a relocated snapshot. */
export async function lessonRenderRuntime(root) {
  const runtimeRoot = await realpath(path.join(root, 'videos/node_modules/vizmatic'));
  const metadata = JSON.parse(await readFile(path.join(runtimeRoot, 'package.json'), 'utf8'));
  const imported = metadata.exports?.['.']?.import;
  const entryPath = typeof imported === 'string' ? imported : imported?.default;
  if (
    metadata.name !== 'vizmatic' ||
    typeof entryPath !== 'string' ||
    !entryPath.startsWith('./')
  ) {
    throw new Error('Installed Vizmatic must declare its local ESM entry');
  }
  const entry = await realpath(path.join(runtimeRoot, relativeFile(runtimeRoot, entryPath)));
  relativeFile(runtimeRoot, entry);
  return { root: runtimeRoot, entry, provenance: renderEngineProvenance({ entry }) };
}

/**
 * One versioned source contract for render caches, package verification and snapshots.
 * Asset, asset-manifest and source-file paths are repository-relative. Explicit local
 * assets bind all provenance metadata and original bytes when source.path is declared.
 * No URL is fetched.
 */
export async function productionSourceManifest({ root, id, mode = 'canvas', ttsScript }) {
  root = path.resolve(root);
  const realRoot = await realpath(root);
  const confinedRead = async (name) => {
    const file = relativeFile(root, name),
      actual = await realpath(path.join(root, file));
    relativeFile(realRoot, actual);
    return readFile(actual, 'utf8');
  };
  const paths = lessonSourcePaths(id, { mode, root });
  const lesson = parse(await confinedRead(paths.lessonFile));
  if (lesson.id !== id) throw new Error(`${paths.lessonFile}: lesson id differs from ${id}`);
  if (typeof lesson.source !== 'string')
    throw new Error(`${paths.lessonFile}: article source is required`);
  const articleRoot = path.resolve(root, 'web/src/content');
  relativeFile(articleRoot, path.resolve(articleRoot, lesson.source));
  const adapter = relativeFile(
    root,
    ttsScript ?? JSON.parse(await confinedRead('videos/narration.json')).ttsScript,
  );
  const files = [
    paths.lessonFile,
    'videos/narration.json',
    'videos/soundbed.json',
    'videos/collections/complete-curriculum.json',
    adapter,
    ...(adapter === 'videos/adapters/course-kokoro.py'
      ? ['videos/adapters/course-kokoro-worker.py']
      : []),
    'videos/package.json',
    'videos/package-lock.json',
    'videos/.npmrc',
    'videos/check-npm-release-age.mjs',
    'videos/package.py',
    'videos/quality.py',
    'videos/quality-rubric.json',
    'CONTENT_GUIDELINES.md',
    'web/src/content/references.json',
    'videos/assets/leetllm-mark.svg',
    relativeFile(root, path.resolve(root, 'web/src/content', lesson.source)),
  ];
  const optional = [
    `videos/coverage/${id}.yaml`,
    ...(paths.lessonFile.endsWith('/lesson.yaml')
      ? [`videos/stage-lessons/${id}/coverage.yaml`]
      : []),
    'videos/assets/concepts/manifest.json',
  ];
  for (const name of optional) {
    try {
      if ((await stat(path.join(root, name))).isFile()) files.push(name);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  // Canvas concept SVGs are read by the shared renderer at runtime, not ESM imports.
  if (mode === 'canvas') {
    for (const name of await readdir(path.join(root, 'videos/assets/concepts'))) {
      if (name.endsWith('.svg')) files.push(`videos/assets/concepts/${name}`);
    }
  }
  const declarations = [
    declaredInputs(
      {
        files: lesson.source_files ?? [],
        assets: lesson.assets ?? [],
        dynamicImports: lesson.dynamic_imports ?? {},
      },
      paths.lessonFile,
    ),
  ];
  const sidecar = `videos/films/${id}/sources.json`;
  try {
    declarations.push(declaredInputs(JSON.parse(await confinedRead(sidecar)), sidecar));
    files.push(sidecar);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const dispatchers = [
    'videos/render.mjs',
    'videos/audit-occlusion.mjs',
    'videos/audit-text-ink.mjs',
    'videos/audit-labels.mjs',
    'videos/audit-arrowheads.mjs',
    'videos/audit-continuity.mjs',
  ];
  const assets = [],
    dynamicImports = Object.fromEntries(
      dispatchers.map((importer) => [importer, [paths.moduleFile]]),
    );
  for (const declaration of declarations) {
    files.push(...declaration.files);
    assets.push(...declaration.assets);
    for (const [importer, targets] of Object.entries(declaration.dynamicImports)) {
      if (dispatchers.includes(relativeFile(root, importer)))
        throw new Error(`${id}: the selected renderer/audit import closure cannot be overridden`);
      dynamicImports[importer] = [...new Set([...(dynamicImports[importer] ?? []), ...targets])];
    }
  }
  if (lesson.asset_manifests !== undefined && !Array.isArray(lesson.asset_manifests))
    throw new Error(`${id}: asset_manifests must be an array`);
  for (const name of lesson.asset_manifests ?? []) {
    const local = relativeFile(root, name);
    const metadata = JSON.parse(await confinedRead(local));
    if (!Array.isArray(metadata.assets)) throw new Error(`${name}: expected assets array`);
    files.push(local);
    assets.push(...declaredInputs({ assets: metadata.assets }, local).assets);
  }
  const closure = await lessonSourceManifest({
    root,
    entry: [
      'videos/render.mjs',
      'videos/catalog.mjs',
      'videos/tools/lesson-source.mjs',
      'videos/audit-occlusion.mjs',
      'videos/audit-text-ink.mjs',
      'videos/audit-motion.mjs',
      'videos/audit-labels.mjs',
      'videos/audit-arrowheads.mjs',
      'videos/audit-continuity.mjs',
      'videos/inspect.mjs',
      'videos/regenerate-captions.mjs',
      paths.moduleFile,
    ],
    files,
    assets,
    dynamicImports,
  });
  const runtime = await lessonRenderRuntime(root),
    runtimeRoot = runtime.root;
  const runtimeInstallation = [];
  for (const name of ['pnpm-workspace.yaml', 'pnpmfile.cjs', '.pnpmfile.cjs']) {
    try {
      const actual = await realpath(path.join(runtimeRoot, name));
      relativeFile(runtimeRoot, actual);
      const bytes = await readFile(actual);
      runtimeInstallation.push({ path: name, sha256: digest(bytes), bytes: bytes.length });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  const manifest = {
    version: 1,
    kind: 'leetllm.production-source',
    id,
    mode,
    ...paths,
    ttsScript: adapter,
    closure,
    renderEngine: runtime.provenance,
    runtimeInstallation,
  };
  return {
    ...manifest,
    fingerprint: digest(Buffer.from('leetllm-production-source-v1\0' + JSON.stringify(manifest))),
  };
}

/** Recompute current inputs; a stored file list alone cannot hide an added import. */
export async function verifyProductionSources(root, receipt) {
  const expected = receipt.sourceManifest;
  if (expected?.version !== 1 || expected.kind !== 'leetllm.production-source')
    throw new Error('Unsupported production source manifest');
  if (expected.id !== receipt.id)
    throw new Error('Production source manifest lesson differs from receipt');
  const current = await productionSourceManifest({
    root,
    id: expected.id,
    mode: expected.mode,
    ttsScript: expected.ttsScript,
  });
  if (
    JSON.stringify(current) !== JSON.stringify(expected) ||
    current.fingerprint !== receipt.fingerprint
  ) {
    throw new Error(`Video was rendered with different source code or assets: ${receipt.id}`);
  }
  if (JSON.stringify(current.renderEngine) !== JSON.stringify(receipt.renderEngine))
    throw new Error(`Vizmatic engine changed after rendering: ${receipt.id}`);
  return current;
}
