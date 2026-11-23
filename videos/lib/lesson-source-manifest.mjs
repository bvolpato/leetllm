// @ts-check
import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { init, parse } from 'es-module-lexer/minimal';

/** @typedef {string | URL} LocalFile */
/** @typedef {{path: LocalFile, sha256?: string, source?: {path?: LocalFile, sha256?: string}, [key: string]: unknown}} LocalAsset */
/** @typedef {{path: string, resolvedPath: string, sha256: string, bytes: number}} SourceFile */
/** @typedef {SourceFile & {absolute: string, resolved: string, stat: import('node:fs').BigIntStats, content: Buffer}} SourceRecord */

/** @param {string} a @param {string} b */
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
/** @param {Buffer} bytes */
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const moduleExtensions = new Set(['', '.js', '.mjs']);

/** @param {string} parent @param {string} candidate */
function inside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return (
    relative === '' ||
    (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  );
}

/** @param {LocalFile} value @param {string} base @param {string} label */
function localPath(value, base, label) {
  if (value instanceof URL) {
    if (value.protocol !== 'file:') throw new Error(`${label}: only local file URLs are allowed`);
    return fileURLToPath(value);
  }
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${label}: expected a nonempty local file path`);
  }
  if (value.startsWith('file:')) return localPath(new URL(value), base, label);
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    throw new Error(`${label}: only local file paths are allowed`);
  }
  return path.resolve(base, value);
}

/** @param {import('node:fs').BigIntStats} value */
function statKey(value) {
  return [value.dev, value.ino, value.mode, value.size, value.mtimeNs, value.ctimeNs].join(':');
}

/**
 * Sort metadata keys without changing meaningful array order or accepting lossy JSON.
 * @param {unknown} value
 * @param {Set<object>} ancestors
 * @returns {unknown}
 */
function canonical(value, ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof URL) return value.href;
  if (typeof value !== 'object' || ancestors.has(value)) {
    throw new TypeError('Asset metadata must be finite, acyclic JSON data');
  }
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError('Asset metadata must use plain JSON objects');
  }
  ancestors.add(value);
  const result = Array.isArray(value)
    ? value.map((item) => canonical(item, ancestors))
    : Object.fromEntries(
        Object.entries(value)
          .sort(([a], [b]) => compare(a, b))
          .map(([key, item]) => [key, canonical(item, ancestors)]),
      );
  ancestors.delete(value);
  return result;
}

/**
 * Bind a lesson's actual ESM dependency closure and explicit local inputs.
 *
 * `entry` roots are parsed recursively. `files` are non-module provenance inputs,
 * such as narration, article, runtime configuration or an asset manifest JSON.
 * Paths in `files`, `assets` and dynamic-import declarations are root-relative.
 * Bare packages remain external; the caller binds its lockfile and render engine.
 *
 * Computed import expressions need an explicit importer-to-targets declaration.
 * Literal relative dynamic imports are resolved without such a declaration.
 * No module is executed and no remote resource is fetched.
 *
 * @param {{
 *   root: LocalFile,
 *   entry: LocalFile | readonly LocalFile[],
 *   files?: readonly LocalFile[],
 *   assets?: readonly LocalAsset[],
 *   dynamicImports?: Readonly<Record<string, readonly LocalFile[]>>
 * }} options
 */
export async function lessonSourceManifest({
  root,
  entry,
  files = [],
  assets = [],
  dynamicImports = {},
}) {
  await init;
  const logicalRoot = localPath(root, process.cwd(), 'Source root');
  const realRoot = await realpath(logicalRoot);
  if (!(await stat(realRoot)).isDirectory()) throw new Error('Source root must be a directory');

  /** @param {string} file */
  const relativePath = (file) => path.relative(logicalRoot, file).split(path.sep).join('/');
  /** @param {LocalFile} value @param {string} base @param {string} label */
  function confined(value, base = logicalRoot, label = 'Lesson source') {
    const absolute = localPath(value, base, label);
    if (!inside(logicalRoot, absolute))
      throw new Error(`${label} escapes source root: ${absolute}`);
    return absolute;
  }

  const roots = (Array.isArray(entry) ? entry : [entry]).map((file) => confined(file));
  if (roots.length === 0) throw new Error('Source manifest needs at least one entry module');
  /** @type {Map<string, string[]>} */
  const explicitDynamic = new Map();
  for (const [importer, targets] of Object.entries(dynamicImports)) {
    if (!Array.isArray(targets) || targets.length === 0) {
      throw new Error(`Dynamic import closure for ${importer} must name at least one local target`);
    }
    const normalized = relativePath(confined(importer));
    if (explicitDynamic.has(normalized))
      throw new Error(`Duplicate dynamic import closure: ${normalized}`);
    explicitDynamic.set(
      normalized,
      targets.map((target) => confined(target)),
    );
  }
  const usedDynamic = new Set();
  /** @type {Map<string, SourceRecord>} */
  const records = new Map();
  const modules = new Set();
  const external = new Map();

  /** @param {LocalFile} value @param {string | undefined} expectedHash */
  async function collect(value, expectedHash = undefined) {
    const absolute = confined(value);
    const relative = relativePath(absolute);
    if (expectedHash !== undefined && !/^[a-f0-9]{64}$/.test(expectedHash)) {
      throw new Error(`${relative}: expected SHA-256 must be 64 lowercase hexadecimal characters`);
    }
    let record = records.get(relative);
    if (!record) {
      const resolved = await realpath(absolute);
      if (!inside(realRoot, resolved))
        throw new Error(`Lesson source symlink escapes source root: ${relative}`);
      const before = await stat(absolute, { bigint: true });
      if (!before.isFile()) throw new Error(`Lesson source must be a regular file: ${relative}`);
      const content = await readFile(absolute);
      const after = await stat(absolute, { bigint: true });
      if (statKey(before) !== statKey(after) || resolved !== (await realpath(absolute))) {
        throw new Error(`Lesson source changed while reading: ${relative}`);
      }
      record = {
        path: relative,
        resolvedPath: path.relative(realRoot, resolved).split(path.sep).join('/'),
        sha256: digest(content),
        bytes: content.length,
        absolute,
        resolved,
        stat: after,
        content,
      };
      records.set(relative, record);
    }
    if (expectedHash !== undefined && record.sha256 !== expectedHash) {
      throw new Error(
        `${relative}: asset SHA-256 mismatch; expected ${expectedHash}, found ${record.sha256}`,
      );
    }
    return record;
  }

  /** @param {LocalFile} value */
  async function visit(value) {
    const record = await collect(value);
    if (modules.has(record.path)) return;
    modules.add(record.path);
    const extension = path.extname(record.path);
    if (extension === '.cjs' || extension === '.ts' || extension === '.tsx') {
      throw new Error(
        `${record.path}: source closure expects JavaScript ESM; unsupported module extension ${extension}`,
      );
    }
    if (extension === '.json') return;
    if (!moduleExtensions.has(extension)) {
      throw new Error(
        `${record.path}: unsupported module dependency ${extension}; declare non-module inputs in files or assets`,
      );
    }
    let imports;
    try {
      [imports] = parse(record.content.toString('utf8'), record.path);
    } catch (error) {
      throw new Error(`Cannot parse lesson imports in ${record.path}`, { cause: error });
    }
    let computed = false;
    for (const imported of imports) {
      if (imported.d === -2) continue; // import.meta has no dependency edge.
      if (imported.n === undefined) {
        if (imported.d >= 0) computed = true;
        continue;
      }
      const specifier = imported.n;
      if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('file:')) {
        // Node resolves a symlinked module's relative imports from its real file.
        const dependency = fileURLToPath(new URL(specifier, pathToFileURL(record.resolved)));
        const local = inside(realRoot, dependency)
          ? path.join(logicalRoot, path.relative(realRoot, dependency))
          : dependency;
        await visit(confined(local));
      } else if (specifier.startsWith('#')) {
        throw new Error(
          `${record.path}: package import alias ${specifier} must use an explicit relative import`,
        );
      } else if (/^[a-z][a-z0-9+.-]*:/i.test(specifier) && !specifier.startsWith('node:')) {
        throw new Error(
          `${record.path}: remote or embedded module import is not a local source: ${specifier}`,
        );
      } else {
        external.set(`${record.path}\0${specifier}`, { from: record.path, specifier });
      }
    }
    if (computed) {
      const targets = explicitDynamic.get(record.path);
      if (!targets)
        throw new Error(
          `${record.path}: computed dynamic import needs an explicit dynamicImports closure`,
        );
      usedDynamic.add(record.path);
      for (const target of targets) await visit(target);
    }
  }

  for (const file of roots) await visit(file);
  for (const file of files) await collect(file);
  const boundAssets = [];
  for (const asset of assets) {
    const image = await collect(asset.path, asset.sha256);
    const metadata = { ...asset, path: image.path };
    if (asset.source?.path !== undefined) {
      const original = await collect(asset.source.path, asset.source.sha256);
      metadata.source = { ...asset.source, path: original.path };
    }
    boundAssets.push(canonical(metadata));
  }
  for (const importer of explicitDynamic.keys()) {
    if (!usedDynamic.has(importer)) throw new Error(`Unused dynamic import closure: ${importer}`);
  }

  // Recheck every input after traversal, so a changed dependency cannot be sealed.
  for (const record of records.values()) {
    if (
      statKey(await stat(record.absolute, { bigint: true })) !== statKey(record.stat) ||
      (await realpath(record.absolute)) !== record.resolved
    ) {
      throw new Error(`Lesson source changed during manifest collection: ${record.path}`);
    }
  }

  const manifest = {
    version: 1,
    entries: [...new Set(roots.map(relativePath))].sort(compare),
    files: [...records.values()]
      .sort((a, b) => compare(a.path, b.path))
      .map((record) => ({
        path: record.path,
        resolvedPath: record.resolvedPath,
        sha256: record.sha256,
        bytes: record.bytes,
      })),
    assets: boundAssets,
    externalImports: [...external.values()].sort(
      (a, b) => compare(a.from, b.from) || compare(a.specifier, b.specifier),
    ),
    dynamicImports: [...explicitDynamic]
      .filter(([from]) => usedDynamic.has(from))
      .sort(([a], [b]) => compare(a, b))
      .map(([from, targets]) => ({
        from,
        targets: [...new Set(targets.map(relativePath))].sort(compare),
      })),
  };
  const bytes = Buffer.from(JSON.stringify(manifest));
  const length = Buffer.alloc(8);
  length.writeBigUInt64BE(BigInt(bytes.length));
  const fingerprint = createHash('sha256')
    .update('leetllm-lesson-source-v1\0')
    .update(length)
    .update(bytes)
    .digest('hex');
  return { ...manifest, fingerprint };
}
