import { execFileSync } from 'node:child_process';
import { closeSync, fstatSync, openSync, writeSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mixCourseScore } from '../lib/course-bed.mjs';
import { courseNarrator } from '../lib/course-speech.mjs';
import { fps } from '../director-cuts/lesson-runtime/timeline.mjs';

const rate = courseNarrator.sampleRate;
const channels = 2;
const bytesPerFrame = channels * 2;
const takesPerBatch = 12;

export function pcmHeader(bytes) {
  if (!Number.isSafeInteger(bytes) || bytes <= 0 || bytes > 0xffffffff - 36)
    throw new RangeError('Narration exceeds the PCM WAV size limit.');
  const header = Buffer.alloc(44);
  header.write('RIFF');
  header.writeUInt32LE(bytes + 36, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * bytesPerFrame, 28);
  header.writeUInt16LE(bytesPerFrame, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(bytes, 40);
  return header;
}

export function* voiceBatches(schedule) {
  const samplesPerFrame = rate / fps;
  for (let start = 0; start < schedule.length; start += takesPerBatch) {
    const takes = schedule.slice(start, start + takesPerBatch);
    const filters = takes.map(
      ({ frames }, i) =>
        `[${i}:a:0]aformat=sample_fmts=s16:sample_rates=${rate}:channel_layouts=stereo,apad,atrim=end_sample=${frames * samplesPerFrame},asetpts=PTS-STARTPTS[a${i}]`,
    );
    filters.push(takes.map((_, i) => `[a${i}]`).join('') + `concat=n=${takes.length}:v=0:a=1[out]`);
    yield [
      '-nostdin',
      '-v',
      'error',
      '-xerror',
      ...takes.flatMap(({ audio }) => ['-threads', '1', '-i', audio]),
      '-filter_complex_threads',
      '1',
      '-filter_complex',
      filters.join(';'),
      '-map',
      '[out]',
      '-c:a',
      'pcm_s16le',
      '-f',
      's16le',
      'pipe:1',
    ];
  }
}

// Each child appends raw samples to the same file descriptor. Only this function writes the header.
export function writeVoice(schedule, voice) {
  const samplesPerFrame = rate / fps;
  const frames = schedule.reduce((total, entry) => total + entry.frames, 0);
  const bytes = frames * samplesPerFrame * bytesPerFrame;
  const header = pcmHeader(bytes);
  const fd = openSync(voice, 'wx', 0o600);
  try {
    writeSync(fd, header);
    for (const args of voiceBatches(schedule))
      execFileSync('ffmpeg', args, { stdio: ['ignore', fd, 'inherit'] });
    if (fstatSync(fd).size !== header.length + bytes)
      throw new Error('Decoded narration does not span the measured timeline.');
  } finally {
    closeSync(fd);
  }
}

export function scoreTiming(schedule) {
  return JSON.stringify({
    beats: schedule.map(({ startFrame }) => startFrame / fps),
    scenes: schedule
      .filter(({ beat }) => beat.beatIndex === 0)
      .map(({ startFrame }) => startFrame / fps),
  });
}

export async function writeScore(id, schedule, work) {
  const scratch = await mkdtemp(join(work, '.score-source-'));
  const voice = join(scratch, 'voice.wav');
  const timing = join(scratch, 'score-timing.json');
  const audio = join(work, 'score.flac');
  try {
    await writeFile(timing, scoreTiming(schedule));
    writeVoice(schedule, voice);
    await mixCourseScore({ lesson: id, voice, timing, out: audio, introSeconds: 0 });
    return audio;
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
