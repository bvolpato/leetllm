import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeSceneTimeline } from '../lib/lesson.mjs';
import { sceneAudio } from '../render.mjs';

test('the demonstration occupies only its own narration hold', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'course-hold-'));
  try {
    const file = join(dir, 'speech.wav');
    const raw = join(dir, 'speech.s16le');
    const input = Buffer.alloc(4800 * 2);
    for (let i = 0; i < 4800; i++) input.writeInt16LE(4000, 2 * i);
    await writeFile(raw, input);
    execFileSync('ffmpeg', [
      '-v',
      'error',
      '-f',
      's16le',
      '-ar',
      '48000',
      '-ac',
      '1',
      '-i',
      raw,
      file,
    ]);
    const timeline = makeSceneTimeline(
      { id: 'probe', beats: [{ hold_sound: 'echo', hold: 0.1 }, { hold: 0.1 }] },
      [0.1, 0.1],
    );
    timeline.sounds = [
      { audio: file, duration: 0.1 },
      { audio: file, duration: 0.1 },
    ];
    const out = join(dir, 'audio.flac');
    const pcm = { sampleRate: 48000, samples: new Float32Array(2400).fill(-0.25) };
    await assert.rejects(sceneAudio(timeline, out), /Unknown hold_sound/);
    await assert.rejects(
      sceneAudio(timeline, out, { echo: { ...pcm, sampleRate: 8000 } }),
      /exceeds the narration hold/,
    );
    await sceneAudio(timeline, out, { echo: pcm });
    const decoded = execFileSync('ffmpeg', [
      '-v',
      'error',
      '-i',
      out,
      '-af',
      'pan=mono|c0=c0',
      '-f',
      's16le',
      '-',
    ]);
    const sample = (index) => decoded.readInt16LE(index * 2);
    assert.equal(sample(19199), 0);
    assert.ok(sample(19200) > 0);
    assert.ok(sample(23999) > 0);
    assert.equal(sample(24000), -8192);
    assert.equal(sample(26399), -8192);
    assert.equal(sample(26400), 0);
    assert.equal(sample(28799), 0);
    assert.ok(sample(28800) > 0);
    assert.equal(sample(33600), 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
