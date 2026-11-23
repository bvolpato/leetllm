import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { finishMovie, verifyStreams } from './delivery.mjs';

test('a copied picture with long teaching chapters keeps each title, cue and final frame', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'director-chapter-clock-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const body = join(dir, 'picture.mp4'),
    audio = join(dir, 'score.flac'),
    captions = join(dir, 'captions.srt'),
    chapters = join(dir, 'chapters.ffmeta'),
    staged = join(dir, 'movie.mp4');
  const duration = 65,
    frames = duration * 30;
  const ffmpeg = (...args) =>
    execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-xerror', ...args]);
  // A solid picture keeps this 1080p regression small. The 55.4-second second chapter
  // exceeded the muxer's packet-duration limit at the former automatic timescale.
  ffmpeg(
    '-f',
    'lavfi',
    '-i',
    'color=c=navy:s=1920x1080:r=30:duration=65',
    '-c:v',
    'libx264',
    '-threads',
    '2',
    '-pix_fmt',
    'yuv420p',
    '-preset',
    'ultrafast',
    body,
  );
  ffmpeg('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo:d=61', '-c:a', 'flac', audio);
  await writeFile(captions, '1\n00:00:04,000 --> 00:00:59,400\nRead the result.\n');
  const longTitle = 'Read é = #1; ' + 'abc '.repeat(59) + 'é';
  const ffTitle = longTitle.replace(/[\\#;=]/gu, '\\$&');
  await writeFile(
    chapters,
    [
      ';FFMETADATA1',
      'title=Chapter clock',
      '[CHAPTER]',
      'TIMEBASE=1/1000',
      'START=0',
      'END=4000',
      'title=LeetLLM',
      '[CHAPTER]',
      'TIMEBASE=1/48000',
      'START=192000',
      'END=2851200',
      'title=' + ffTitle,
      '[CHAPTER]',
      'TIMEBASE=1/30',
      'START=1782',
      'END=1950',
      'title=Final decision',
    ].join('\n') + '\n',
  );
  const cache = join(dir, 'intro-cache');
  await mkdir(cache);
  const prior = process.env.LEETLLM_INTRO_CACHE;
  process.env.LEETLLM_INTRO_CACHE = cache;
  t.after(() => {
    if (prior === undefined) delete process.env.LEETLLM_INTRO_CACHE;
    else process.env.LEETLLM_INTRO_CACHE = prior;
  });
  const info = finishMovie({
    body,
    audio,
    captions,
    chapters,
    staged,
    bodyFrames: frames - 120,
    chapterCount: 3,
    pictureIncludesOpening: true,
  });
  assert.deepEqual(
    info.chapters.map((c) => [c.tags.title, Number(c.start_time), Number(c.end_time)]),
    [
      ['LeetLLM', 0, 4],
      [longTitle, 4, 59.4],
      ['Final decision', 59.4, 65],
    ],
  );
  const clock = info.streams.find((s) => s.codec_tag_string === 'text');
  assert.equal(clock.time_base, '1/1000');
  const packets = JSON.parse(
    execFileSync('ffprobe', [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-read_intervals',
      '64%',
      '-show_frames',
      '-show_entries',
      'frame=best_effort_timestamp_time',
      '-of',
      'json',
      staged,
    ]),
  ).frames;
  assert(
    Math.abs(Number(packets.at(-1).best_effort_timestamp_time) - (frames - 1) / 30) < 0.000001,
  );
  const expected = structuredClone(info.chapters);
  info.chapters[1].end_time = '4.000000';
  assert.throws(() => verifyStreams(info, frames, 3, expected), /end_time differs/);
});
