import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { measureCourseBed } from '../lib/course-bed-evidence.mjs';
import { mixCourseBed, mixCourseScore } from '../lib/course-bed.mjs';

function wav(rate, channels, frames, sample) {
  const bytes = Buffer.alloc(44 + frames * channels * 2);
  bytes.write('RIFF');
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(channels, 22);
  bytes.writeUInt32LE(rate, 24);
  bytes.writeUInt32LE(rate * channels * 2, 28);
  bytes.writeUInt16LE(channels * 2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(bytes.length - 44, 40);
  for (let i = 0; i < frames; i++) {
    for (let ch = 0; ch < channels; ch++)
      bytes.writeInt16LE(sample(i / rate, ch), 44 + 2 * (i * channels + ch));
  }
  return bytes;
}

test('measures speech and stereo bed power separately and omits the logo', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'bed-evidence-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const voice = join(dir, 'voice.wav'),
    bed = join(dir, 'bed.wav');
  await writeFile(
    voice,
    wav(48000, 1, 14400, (s) => (s < 0.1 ? 16000 : s < 0.2 ? 8000 : 0)),
  );
  await writeFile(
    bed,
    wav(48000, 2, 14400, (s, ch) => (s < 0.1 ? 7000 : ch ? -800 : 800)),
  );
  const result = await measureCourseBed(voice, bed, 0.1);
  const compressed = join(dir, 'bed.flac');
  execFileSync('ffmpeg', ['-v', 'error', '-i', bed, '-c:a', 'flac', compressed]);
  assert.deepEqual(await measureCourseBed(voice, compressed, 0.1), result);
  await assert.rejects(measureCourseBed(compressed, bed, 0.1));
  assert.equal(result.active.windows, 5);
  assert.equal(result.quiet.windows, 5);
  assert.equal(result.active.bedMinusVoiceDb, -20);
  assert.equal(result.active.voicePeakDbfs, 20 * Math.log10(8000 / 32768));
  assert.equal(result.quiet.bedRmsDbfs, 20 * Math.log10(800 / 32768));
  assert.equal(result.quiet.voiceRmsDbfs, null);
  assert.equal(result.quiet.bedMinusVoiceDb, null);
  await writeFile(
    voice,
    wav(24000, 1, 7200, () => 8000),
  );
  const mono = await measureCourseBed(voice, bed, 0.1);
  assert.equal(mono.active.windows, 10);
  assert.ok(Math.abs(mono.active.bedMinusVoiceDb + 20) < 0.01);
  await writeFile(
    voice,
    wav(24000, 1, 7100, () => 8000),
  );
  await assert.rejects(measureCourseBed(voice, bed, 0.1), /durations differ/);
  await writeFile(voice, 'broken');
  await assert.rejects(measureCourseBed(voice, bed, 0.1));
});

test('the full score preserves the measured levels and final audio of the WAV bed mix', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'full-score-bed-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const voice = join(dir, 'voice.wav');
  await writeFile(
    voice,
    wav(24000, 1, 24000 * 3 + 1, (s) =>
      s < 1.5 ? Math.round(4000 * Math.sin(2 * Math.PI * 220 * s)) : 0,
    ),
  );
  const options = { lesson: 'data-quality', voice, introSeconds: 0 };
  const original = join(dir, 'original.flac');
  const score = join(dir, 'score.flac');
  const receipt = await mixCourseBed({ ...options, out: original });
  const measured = await mixCourseScore({ ...options, out: score });
  assert.deepEqual(measured, { trimDb: receipt.trimDb, levels: receipt.levels });
  assert.deepEqual(await readFile(score), await readFile(original));
});
