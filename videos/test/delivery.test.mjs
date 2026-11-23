import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashDeliveryFiles, withStagedDelivery } from '../lib/delivery.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'leetllm-delivery-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return {
    root,
    final: join(root, 'lesson'),
    staging: join(root, '.staging'),
    previous: join(root, '.staging/lesson.previous'),
  };
}

async function writeDelivery(directory, version) {
  await mkdir(directory, { recursive: true });
  await Promise.all(
    ['lesson.mp4', 'lesson.vtt', 'verification.json'].map((name) =>
      writeFile(join(directory, name), `${version}:${name}`),
    ),
  );
}

async function assertDelivery(directory, version) {
  for (const name of ['lesson.mp4', 'lesson.vtt', 'verification.json']) {
    assert.equal(await readFile(join(directory, name), 'utf8'), `${version}:${name}`);
  }
}

test('a failed build preserves the published movie, captions, and receipt together', async (t) => {
  const paths = await fixture(t);
  await writeDelivery(paths.final, 'old');
  await assert.rejects(
    withStagedDelivery(paths.final, async (stage) => {
      await writeDelivery(stage, 'new');
      throw new Error('simulated encode failure');
    }),
    /simulated encode failure/,
  );
  await assertDelivery(paths.final, 'old');
  assert.deepEqual(await readdir(paths.staging), []);
});

test('optional failed-stage retention preserves the attempt and releases its lock', async (t) => {
  const paths = await fixture(t);
  await writeDelivery(paths.final, 'old');
  let failedStage;
  await assert.rejects(
    withStagedDelivery(
      paths.final,
      async (stage) => {
        failedStage = stage;
        await writeDelivery(stage, 'failed');
        throw new Error('retained encode failure');
      },
      { preserveFailedStage: true },
    ),
    /retained encode failure/,
  );
  await assertDelivery(paths.final, 'old');
  await assertDelivery(failedStage, 'failed');
  assert.deepEqual(await readdir(paths.staging), [failedStage.split('/').at(-1)]);
  await withStagedDelivery(paths.final, (stage) => writeDelivery(stage, 'next'), {
    preserveFailedStage: true,
  });
  await assertDelivery(paths.final, 'next');
  await assertDelivery(failedStage, 'failed');
});

test('optional failed-stage retention still publishes and clears a successful stage', async (t) => {
  const paths = await fixture(t);
  await withStagedDelivery(paths.final, (stage) => writeDelivery(stage, 'complete'), {
    preserveFailedStage: true,
  });
  await assertDelivery(paths.final, 'complete');
  assert.deepEqual(await readdir(paths.staging), []);
});

test('successful publication replaces the complete delivery and retains one previous version', async (t) => {
  const paths = await fixture(t);
  await writeDelivery(paths.final, 'old');
  const result = await withStagedDelivery(paths.final, async (stage) => {
    await writeDelivery(stage, 'new');
    return 'complete';
  });
  assert.equal(result, 'complete');
  await assertDelivery(paths.final, 'new');
  await assertDelivery(paths.previous, 'old');
  await withStagedDelivery(paths.final, (stage) => writeDelivery(stage, 'newest'));
  await assertDelivery(paths.final, 'newest');
  await assertDelivery(paths.previous, 'new');
  assert.deepEqual(await readdir(paths.staging), ['lesson.previous']);
});

test('a failed stage rename rolls the previous delivery back into place', async (t) => {
  const paths = await fixture(t);
  await writeDelivery(paths.final, 'old');
  await assert.rejects(
    withStagedDelivery(paths.final, async (stage) => {
      await writeDelivery(stage, 'new');
      // Removing our own stage forces the real publication rename to fail.
      await rm(stage, { recursive: true });
    }),
    (error) => error.code === 'ENOENT',
  );
  await assertDelivery(paths.final, 'old');
  assert.deepEqual(await readdir(paths.staging), []);
});

test('the next invocation recovers an interrupted directory swap before building', async (t) => {
  const paths = await fixture(t);
  await writeDelivery(paths.previous, 'old');
  await assert.rejects(
    withStagedDelivery(paths.final, async (stage) => {
      await assertDelivery(paths.final, 'old');
      await writeDelivery(stage, 'new');
      throw new Error('build failed after recovery');
    }),
    /build failed after recovery/,
  );
  await assertDelivery(paths.final, 'old');
  assert.deepEqual(await readdir(paths.staging), []);
});

test('an exclusive lesson lock prevents concurrent delivery writers', async (t) => {
  const paths = await fixture(t);
  let release, started;
  const hold = new Promise((resolve) => {
    release = resolve;
  });
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  const first = withStagedDelivery(paths.final, async (stage) => {
    await writeDelivery(stage, 'first');
    started();
    await hold;
  });
  await ready;
  try {
    const lock = JSON.parse(await readFile(join(paths.staging, 'lesson.lock'), 'utf8'));
    assert.equal(lock.pid, process.pid);
    await assert.rejects(
      withStagedDelivery(paths.final, () => assert.fail('second writer acquired the lock')),
      /Delivery is locked:.*writer has stopped/,
    );
  } finally {
    release();
    await first;
  }
  await assertDelivery(paths.final, 'first');
  assert.deepEqual(await readdir(paths.staging), []);
});

test('delivery hashes cover nested public files and exclude only the root receipt', async (t) => {
  const paths = await fixture(t);
  await writeDelivery(paths.final, 'old');
  await mkdir(join(paths.final, 'encoded-review'));
  await writeFile(join(paths.final, 'encoded-review/verification.json'), 'encoded review');
  const sha = (value) => createHash('sha256').update(value).digest('hex');
  const hashes = await hashDeliveryFiles(paths.final);
  assert.deepEqual(hashes, {
    'encoded-review/verification.json': sha('encoded review'),
    'lesson.mp4': sha('old:lesson.mp4'),
    'lesson.vtt': sha('old:lesson.vtt'),
  });
  await writeFile(join(paths.final, 'verification.json'), 'updated root receipt');
  assert.deepEqual(await hashDeliveryFiles(paths.final), hashes);
  await writeFile(join(paths.final, 'lesson.vtt'), 'changed captions');
  assert.equal((await hashDeliveryFiles(paths.final))['lesson.vtt'], sha('changed captions'));
});
