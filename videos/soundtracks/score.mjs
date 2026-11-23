import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const sha = (bytes) => createHash('sha256').update(bytes).digest();
const rate = 48000;

// The release hashes each relative path, a zero byte and the binary SHA-256 of the file.
async function lessonFiles(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) files.push(...(await lessonFiles(directory, path + '/')));
    else {
      assert(entry.isFile(), 'Expected an ordinary file in the reviewed lesson: ' + path);
      files.push(path);
    }
  }
  return files;
}

export async function loadCue(id, courseRoot, lessonsDir) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id), 'Invalid lesson id');
  let bytes;
  try {
    bytes = await readFile(new URL('./' + id + '.json', import.meta.url));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  const cue = JSON.parse(bytes);
  assert.equal(cue.lesson, id);
  assert.equal(cue.edge, 'speech-end');
  assert.equal(basename(cue.asset), cue.asset);
  assert(/^[a-z0-9][a-z0-9-]*\.wav$/.test(cue.asset), 'Invalid cue WAV name');
  const directory = join(lessonsDir ?? join(courseRoot, 'videos/full-directors/lessons'), id);
  const digest = createHash('sha256');
  for (const name of (await lessonFiles(directory)).sort()) {
    digest
      .update(name)
      .update('\0')
      .update(sha(await readFile(join(directory, name))));
  }
  assert.equal(
    digest.digest('hex'),
    cue.sourceSha256,
    'The soundtrack belongs to another lesson revision',
  );
  const asset = join(directory, cue.asset);
  assert.equal(sha(await readFile(asset)).toString('hex'), cue.assetSha256, 'The cue WAV changed');
  return { ...cue, asset, declarationSha256: sha(bytes).toString('hex') };
}

export async function addCue(score, cue, schedule, fps, out) {
  const beat = schedule.find((entry) => entry.beat.id === cue.beat);
  assert(beat, 'The measured timeline has no beat ' + cue.beat);
  const start = Math.round((beat.startFrame / fps + beat.speechDuration) * rate);
  const end = Math.round(((beat.startFrame + beat.frames) / fps) * rate);
  const { stdout } = await exec('ffprobe', [
    '-v',
    'error',
    '-show_streams',
    '-of',
    'json',
    cue.asset,
  ]);
  const [stream] = JSON.parse(stdout).streams;
  assert.equal(stream.channels, 1, 'A lesson cue must be mono');
  assert.equal(stream.codec_name, 'pcm_s16le');
  assert.equal(stream.time_base, '1/' + stream.sample_rate);
  const samples = Math.ceil((stream.duration_ts * rate) / Number(stream.sample_rate));
  assert(
    Number.isSafeInteger(start) && samples > 0 && start + samples <= end,
    'The cue exceeds the measured hold',
  );
  // Duplicate the mono cue at unity gain. Keep the existing stereo score and its full duration.
  const graph =
    '[1:a]aresample=48000,pan=stereo|c0=c0|c1=c0,adelay=' +
    start +
    'S:all=1[cue];[0:a][cue]amix=inputs=2:duration=first:normalize=0[mix]';
  await exec('ffmpeg', [
    '-nostdin',
    '-v',
    'error',
    '-xerror',
    '-i',
    score,
    '-i',
    cue.asset,
    '-filter_complex',
    graph,
    '-map',
    '[mix]',
    '-c:a',
    'flac',
    '-sample_fmt',
    's32',
    '-bits_per_raw_sample',
    '24',
    out,
  ]);
  return {
    declarationSha256: cue.declarationSha256,
    assetSha256: cue.assetSha256,
    sourceSha256: cue.sourceSha256,
    reviewedCommit: cue.reviewedCommit,
    beat: cue.beat,
    sampleRate: rate,
    startSample: start,
    samples,
  };
}
