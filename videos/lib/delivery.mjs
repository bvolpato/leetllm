import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, mkdtemp, open, readdir, rename, rm } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function withStagedDelivery(
  finalDirectory,
  build,
  { preserveFailedStage = false } = {},
) {
  finalDirectory = resolve(finalDirectory);
  const name = basename(finalDirectory);
  const staging = join(dirname(finalDirectory), '.staging');
  const previous = join(staging, `${name}.previous`);
  const lockPath = join(staging, `${name}.lock`);
  await mkdir(staging, { recursive: true });
  let lock;
  try {
    lock = await open(lockPath, 'wx');
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    throw new Error(
      `Delivery is locked: ${lockPath}. Read its PID and remove the lock only after confirming its writer has stopped.`,
      { cause: error },
    );
  }

  let stage,
    published = false;
  try {
    await lock.writeFile(`${JSON.stringify({ pid: process.pid })}\n`);
    // A stopped writer may have moved the old delivery before publishing its stage.
    if (!(await exists(finalDirectory)) && (await exists(previous)))
      await rename(previous, finalDirectory);
    stage = await mkdtemp(join(staging, `${name}-`));
    const result = await build(stage);
    await rm(previous, { recursive: true, force: true });
    const hadFinal = await exists(finalDirectory);
    if (hadFinal) await rename(finalDirectory, previous);
    try {
      await rename(stage, finalDirectory);
      published = true;
    } catch (publicationError) {
      if (hadFinal) {
        try {
          await rename(previous, finalDirectory);
        } catch (rollbackError) {
          throw new AggregateError(
            [publicationError, rollbackError],
            `Delivery publication and rollback failed. The next invocation will recover ${previous} if ${finalDirectory} is absent.`,
          );
        }
      }
      throw publicationError;
    }
    return result;
  } finally {
    try {
      if (stage && (published || !preserveFailedStage))
        await rm(stage, { recursive: true, force: true });
    } finally {
      try {
        await lock.close();
      } finally {
        await rm(lockPath, { force: true });
      }
    }
  }
}

export async function hashDeliveryFiles(directory) {
  const hashes = {};
  async function visit(relative = '') {
    const entries = await readdir(join(directory, relative), { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (name === 'verification.json') continue;
      if (entry.isDirectory()) {
        await visit(name);
        continue;
      }
      if (!entry.isFile()) throw new Error(`Unsupported delivery entry: ${join(directory, name)}`);
      const digest = createHash('sha256');
      for await (const block of createReadStream(join(directory, name))) digest.update(block);
      hashes[name] = digest.digest('hex');
    }
  }
  await visit();
  return hashes;
}
