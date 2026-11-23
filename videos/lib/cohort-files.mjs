import { createHash } from 'node:crypto';
import { createReadStream, constants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
export const inside = (root, file) => {
  const relative = path.relative(root, file);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};

export async function fileRecord(file) {
  const digest = createHash('sha256');
  let bytes = 0;
  for await (const chunk of createReadStream(file)) {
    digest.update(chunk);
    bytes += chunk.length;
  }
  return { path: path.resolve(file), sha256: digest.digest('hex'), bytes };
}

export async function writeJson(file, value, { replace = false } = {}) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const bytes = JSON.stringify(value, null, 2) + '\n';
  if (!replace) return fs.writeFile(file, bytes, { flag: 'wx' });
  const temporary = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temporary, bytes, { flag: 'wx' });
  await fs.rename(temporary, file);
}

export async function confined(root, relative) {
  const file = path.resolve(root, relative);
  if (!inside(root, file) || !inside(root, await fs.realpath(file)))
    throw new Error(`Cohort input escapes its root: ${relative}`);
  return file;
}

export async function verifiedRecord(root, value) {
  if (!value || typeof value.path !== 'string' || !/^[a-f0-9]{64}$/.test(value.sha256 ?? ''))
    throw new Error('Authority records require a path and exact SHA-256');
  const record = await fileRecord(await confined(root, value.path));
  if (record.sha256 !== value.sha256) throw new Error(`Authority changed: ${value.path}`);
  return record;
}

export async function copyVerifiedFile(original, destination) {
  await fs.copyFile(original.path, destination, constants.COPYFILE_EXCL);
  const copied = await fileRecord(destination);
  if (copied.sha256 !== original.sha256 || copied.bytes !== original.bytes)
    throw new Error(`Copied bytes differ from verified original: ${original.path}`);
  return copied;
}

/** Explicit empty installation configuration, separate from release/source inputs. */
export async function privateInstallEnvironment(directory) {
  const config = path.join(directory, 'install-config');
  await fs.mkdir(config, { recursive: true });
  const files = ['user.npmrc', 'global.npmrc'].map((name) => path.join(config, name));
  for (const file of files) {
    try {
      await fs.writeFile(file, '', { flag: 'wx' });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    if ((await fs.readFile(file)).length !== 0)
      throw new Error(`Installation config is not empty: ${file}`);
  }
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !/^npm_config_/i.test(key) && !['NPM_TOKEN', 'NODE_AUTH_TOKEN'].includes(key),
    ),
  );
  return { ...env, npm_config_userconfig: files[0], npm_config_globalconfig: files[1] };
}

export async function preserveAuthorities(root, values, directory) {
  if (!Array.isArray(values) || !values.length)
    throw new Error('Declare exact source-quality, migration and release authorities');
  await fs.mkdir(directory);
  const records = [];
  for (const [index, value] of values.entries()) {
    const original = await verifiedRecord(root, value);
    const copy = path.join(
      directory,
      `${String(index).padStart(3, '0')}-${path.basename(original.path)}`,
    );
    records.push({ role: value.role, original, preserved: await copyVerifiedFile(original, copy) });
  }
  return records;
}

/** Hash private installed dependencies, rejecting links back to a live checkout/store. */
export async function dependencyInventory(root) {
  root = await fs.realpath(root);
  const records = [];
  async function visit(file) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    const info = await fs.lstat(file);
    if (info.isSymbolicLink()) {
      await confined(root, relative);
      records.push({ path: relative, link: await fs.readlink(file) });
    } else if (info.isDirectory()) {
      for (const name of (await fs.readdir(file)).sort()) await visit(path.join(file, name));
    } else if (info.isFile()) {
      const record = await fileRecord(file);
      records.push({
        path: relative,
        sha256: record.sha256,
        bytes: record.bytes,
        executable: Boolean(info.mode & 0o111),
      });
    } else throw new Error(`Unsupported installed dependency: ${relative}`);
  }
  for (const directory of ['vizmatic/node_modules', 'repository/videos/node_modules'])
    await visit(path.join(root, directory));
  records.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  return { version: 1, files: records, fingerprint: sha256(JSON.stringify(records)) };
}

export async function availableBytes(directory) {
  const value = await fs.statfs(directory, { bigint: true });
  return Number(value.bavail * value.bsize);
}

export async function directoryBytes(directory) {
  let total = 0;
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) total += await directoryBytes(file);
    else if (entry.isFile()) total += (await fs.stat(file)).size;
  }
  return total;
}
