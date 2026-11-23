import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, rename, rm, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkpointScope, sceneCheckpoint } from '../render.mjs';

test('scene retries bind the whole measured timeline, source and encoder', () => {
  const sound = {
    audio: '/attempt/one.mp3',
    boundaries: '/attempt/one.json',
    audioHash: 'audio',
    boundariesHash: 'words',
  };
  const timeline = {
    scenes: [
      { start: 0, sounds: [sound] },
      { start: 5, sounds: [] },
    ],
  };
  const key = () => checkpointScope('source', timeline, { encoder: 'videotoolbox' });
  const original = key();
  sound.audio = '/attempt/two.mp3';
  sound.boundaries = '/attempt/two.json';
  assert.equal(key(), original);
  assert.notEqual(checkpointScope('new-source', timeline, { encoder: 'videotoolbox' }), original);
  assert.notEqual(checkpointScope('source', timeline, { encoder: 'libx264' }), original);
  timeline.scenes[1].start += 1;
  assert.notEqual(key(), original);
  timeline.scenes[1].start -= 1;
  sound.boundariesHash = 'other words';
  assert.notEqual(key(), original);
});

test('only a complete matching picture, audio and frame audit can enter a fresh attempt', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'film-checkpoint-'));
  try {
    const cache = join(temp, 'store'),
      output = join(temp, 'attempt');
    await mkdir(output);
    const files = ['scene.mp4', 'scene.flac', 'scene.render.json'].map((name) =>
      join(output, name),
    );
    const marker = JSON.stringify({
      key: 'source',
      audioFormat: 'flac',
      h264Encoder: 'videotoolbox',
      frames: 30,
      audit: { passed: true, frames: 30 },
    });
    const source = ['picture', 'sound', marker];
    for (const [i, file] of files.entries()) await writeFile(file, source[i]);
    const record = sceneCheckpoint(cache, 'source', files, 'videotoolbox', 30);
    await record.save();
    for (const file of files) await unlink(file);
    assert.equal(await sceneCheckpoint(cache, 'source', files, 'libx264', 30).restore(), false);
    assert.equal(
      await sceneCheckpoint(cache, 'source', files, 'videotoolbox', 31).restore(),
      false,
    );
    assert.equal(await record.restore(), true);
    assert.deepEqual(await Promise.all(files.map((file) => readFile(file, 'utf8'))), source);
    const receipt = JSON.parse(await readFile(join(cache, 'scene.mp4.source.json')));
    for (const file of files) await unlink(file);
    const flac = join(cache, receipt.entry, 'narration.flac');
    const legacy = join(cache, receipt.entry, 'narration.wav');
    await rename(flac, legacy);
    assert.equal(await record.restore(), false);
    await rename(legacy, flac);
    await writeFile(flac, 'other');
    assert.equal(await record.restore(), false);
    for (const file of files) await assert.rejects(readFile(file), { code: 'ENOENT' });
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
