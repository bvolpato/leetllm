import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const inside = (parent, file) => {
  const relative = path.relative(parent, file);
  return (
    relative === '' ||
    (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  );
};
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const defaultCache = new Map();

function realpathInside(boundary, candidate, label) {
  const resolved = realpathSync(candidate);
  if (!inside(boundary, resolved))
    throw new Error(`Vizmatic runtime path escapes its package boundary: ${label}`);
  return resolved;
}

function statKey(stat) {
  return [stat.dev, stat.ino, stat.mode, stat.size, stat.mtimeNs, stat.ctimeNs]
    .map(String)
    .join(':');
}

function collectTree({ packageRoot, logicalRoot, sourceRoot, boundary }) {
  const root = realpathInside(boundary, sourceRoot, logicalRoot);
  const files = [],
    activeDirectories = new Set();
  function visit(source, logicalPath) {
    const resolved = realpathInside(boundary, source, logicalPath);
    const stat = statSync(resolved, { bigint: true });
    if (stat.isDirectory()) {
      if (activeDirectories.has(resolved))
        throw new Error(`Vizmatic runtime symlink cycle at ${logicalPath}`);
      activeDirectories.add(resolved);
      for (const name of readdirSync(resolved).sort(compare))
        visit(path.join(resolved, name), `${logicalPath}/${name}`);
      activeDirectories.delete(resolved);
      return;
    }
    if (!stat.isFile()) throw new Error(`Unsupported Vizmatic runtime entry: ${logicalPath}`);
    files.push({
      path: logicalPath,
      resolvedPath: path.relative(packageRoot, resolved).split(path.sep).join('/'),
      filePath: resolved,
      stat,
    });
  }
  visit(root, logicalRoot);
  return files;
}

function collectFile({ packageRoot, logicalPath, sourcePath, boundary }) {
  try {
    lstatSync(sourcePath);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const resolved = realpathInside(boundary, sourcePath, logicalPath),
    stat = statSync(resolved, { bigint: true });
  if (!stat.isFile()) throw new Error(`Unsupported Vizmatic runtime entry: ${logicalPath}`);
  return [
    {
      path: logicalPath,
      resolvedPath: path.relative(packageRoot, resolved).split(path.sep).join('/'),
      filePath: resolved,
      stat,
    },
  ];
}

function inventory(packageRoot, entry) {
  const distRoot = realpathInside(packageRoot, path.join(packageRoot, 'dist'), 'dist');
  const entryPath = realpathInside(distRoot, entry, 'entry');
  const files = collectTree({
    packageRoot,
    logicalRoot: 'dist',
    sourceRoot: distRoot,
    boundary: distRoot,
  });
  const assetsPath = path.join(packageRoot, 'assets');
  let assetsRoot;
  try {
    assetsRoot = realpathInside(packageRoot, assetsPath, 'assets');
  } catch (error) {
    if (error.code === 'ENOENT') assetsRoot = undefined;
    else throw error;
  }
  if (assetsRoot) {
    for (const directory of ['fonts', 'emoji']) {
      const sourceRoot = path.join(assetsRoot, directory);
      try {
        lstatSync(sourceRoot);
        files.push(
          ...collectTree({
            packageRoot,
            logicalRoot: `assets/${directory}`,
            sourceRoot,
            boundary: assetsRoot,
          }),
        );
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    files.push(
      ...collectFile({
        packageRoot,
        logicalPath: 'assets/emoji.json.br',
        sourcePath: path.join(assetsRoot, 'emoji.json.br'),
        boundary: assetsRoot,
      }),
    );
  }
  files.sort((a, b) => compare(a.path, b.path));
  const signature = files.map((file) => [file.path, file.resolvedPath, statKey(file.stat)]);
  return { distRoot, entryPath, files, signature };
}

function framed(hash, bytes) {
  const length = Buffer.allocUnsafe(8);
  length.writeBigUInt64BE(BigInt(bytes.length));
  hash.update(length);
  hash.update(bytes);
}

function readStableFile(filePath, expectedStat, label) {
  const before = statSync(filePath, { bigint: true });
  if (statKey(before) !== statKey(expectedStat))
    throw new Error(`Vizmatic runtime changed while reading: ${label}`);
  const bytes = readFileSync(filePath);
  if (statKey(statSync(filePath, { bigint: true })) !== statKey(before))
    throw new Error(`Vizmatic runtime changed while reading: ${label}`);
  return bytes;
}

function runtimeDigest(files, entryPath) {
  const hash = createHash('sha256');
  framed(hash, Buffer.from('vizmatic-runtime-v1'));
  let bytes = 0,
    entrySha256;
  for (const file of files) {
    const content = readStableFile(file.filePath, file.stat, file.path),
      relativePath = Buffer.from(file.path),
      resolvedPath = Buffer.from(file.resolvedPath);
    framed(hash, relativePath);
    framed(hash, resolvedPath);
    framed(hash, content);
    bytes += content.length;
    if (file.filePath === entryPath) entrySha256 = digest(content);
  }
  if (!entrySha256) throw new Error('Vizmatic runtime entry is not in the hashed dist tree');
  return {
    runtimeSha256: hash.digest('hex'),
    runtimeFileCount: files.length,
    runtimeBytes: bytes,
    entrySha256,
  };
}

function packageFile(packageRoot, name) {
  const filePath = path.join(packageRoot, name),
    resolved = realpathInside(packageRoot, filePath, name);
  const stat = statSync(resolved, { bigint: true });
  if (!stat.isFile()) throw new Error(`Vizmatic package metadata is not a file: ${name}`);
  const bytes = readStableFile(resolved, stat, name);
  return { path: name, filePath: resolved, stat, bytes, sha256: digest(bytes) };
}

function clone(value) {
  return { ...value, runtimeRoots: [...value.runtimeRoots] };
}

// Hash all distributed executable chunks and the font/emoji assets the renderer can load.
// Cache the default checkout by its file inventory metadata; explicit entries always re-read bytes.
export function renderEngineProvenance(options = {}) {
  const explicitEntry = Object.hasOwn(options, 'entry');
  const entry = path.resolve(options.entry ?? fileURLToPath(import.meta.resolve('vizmatic')));
  const packageRoot = realpathSync(path.dirname(path.dirname(entry)));
  const packageJson = packageFile(packageRoot, 'package.json');
  const packageMetadata = JSON.parse(packageJson.bytes.toString('utf8'));
  const lockPath = path.join(packageRoot, 'pnpm-lock.yaml');
  let lock;
  try {
    lock = packageFile(packageRoot, 'pnpm-lock.yaml');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const contents = inventory(packageRoot, entry),
    cacheKey = contents.entryPath;
  const cacheSignature = JSON.stringify({
    package: [packageJson.sha256, statKey(packageJson.stat)],
    lock: lock ? [lock.sha256, statKey(lock.stat)] : null,
    runtime: contents.signature,
  });
  if (!explicitEntry) {
    const cached = defaultCache.get(cacheKey);
    if (cached?.signature === cacheSignature) return clone(cached.provenance);
  }

  const runtime = runtimeDigest(contents.files, contents.entryPath);
  const provenance = {
    name: packageMetadata.name,
    version: packageMetadata.version,
    entryPath: path.relative(packageRoot, contents.entryPath).split(path.sep).join('/'),
    entrySha256: runtime.entrySha256,
    packageSha256: packageJson.sha256,
    dependencyLockSha256: lock?.sha256 ?? null,
    runtimeSha256: runtime.runtimeSha256,
    runtimeFileCount: runtime.runtimeFileCount,
    runtimeBytes: runtime.runtimeBytes,
    runtimeRoots: ['dist/**', 'assets/fonts/**', 'assets/emoji/**', 'assets/emoji.json.br'],
  };
  if (!explicitEntry) defaultCache.set(cacheKey, { signature: cacheSignature, provenance });
  return clone(provenance);
}

export function renderEngineBytes(options = {}) {
  return Buffer.from(JSON.stringify(renderEngineProvenance(options)));
}
