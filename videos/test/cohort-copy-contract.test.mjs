import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const moduleUrl = process.env.LEETLLM_COHORT_FILES_UNDER_TEST
  ? pathToFileURL(process.env.LEETLLM_COHORT_FILES_UNDER_TEST)
  : new URL('../lib/cohort-files.mjs', import.meta.url);
const { fileRecord, preserveAuthorities, privateInstallEnvironment } = await import(moduleUrl);
const exec = promisify(execFile);

test('a real input mutation during the verified-copy window rejects the preserved authority', async (t) => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'cohort-copy-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const original = path.join(root, 'signed-lock.yaml');
  await fs.writeFile(original, 'declared exact bytes');
  const record = await fileRecord(original),
    copy = fs.copyFile;
  let mutated = false;
  fs.copyFile = async (input, ...args) => {
    if (input === original) {
      await fs.writeFile(original, 'concurrent different bytes');
      mutated = true;
    }
    return copy(input, ...args);
  };
  try {
    await assert.rejects(
      preserveAuthorities(root, [record], path.join(root, 'preserved')),
      /Copied bytes differ from verified original/,
    );
  } finally {
    fs.copyFile = copy;
  }
  assert(mutated);
  assert.equal(
    await fs.readFile(path.join(root, 'preserved/000-signed-lock.yaml'), 'utf8'),
    'concurrent different bytes',
  );
});

test('distinct empty private configurations work with actual npm and reject nonempty configuration', async (t) => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'cohort-npm-config-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  assert.equal(typeof privateInstallEnvironment, 'function');
  const env = await privateInstallEnvironment(root);
  assert.notEqual(env.npm_config_userconfig, env.npm_config_globalconfig);
  const result = await exec('npm', ['config', 'get', 'userconfig'], { cwd: root, env });
  assert.equal(result.stdout.trim(), env.npm_config_userconfig);
  await fs.writeFile(env.npm_config_globalconfig, 'registry=https://unexpected.invalid');
  await assert.rejects(privateInstallEnvironment(root), /Installation config is not empty/);
});
