import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, openSync, writeFileSync } from 'node:fs';
import { link, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { parseArgs, promisify } from 'node:util';
import { BRAND_INTRO_SECONDS } from '../lib/brand.mjs';
import { courseBedPolicy, soundbedDirectory } from '../lib/course-bed.mjs';
import { measureCourseBed } from '../lib/course-bed-evidence.mjs';
import { courseNarrator, prepareTakes } from '../lib/course-speech.mjs';
import { buildTimeline, fps } from '../director-cuts/lesson-runtime/timeline.mjs';
import { loadFullFilm } from './film.mjs';
import { pcmHeader, scoreTiming, voiceBatches } from './sound.mjs';

const run = promisify(execFile);
const voiceRate = courseNarrator.sampleRate;
const sampleRate = 48000;
const bytesPerFrame = 4;
const guardFrames = 12 * fps;
const introFrames = BRAND_INTRO_SECONDS * fps;
const {
  positionals: [id, ...extra],
  values,
} = parseArgs({
  options: {
    beat: { type: 'string' },
    schedule: { type: 'string' },
    out: { type: 'string' },
    'lessons-dir': { type: 'string' },
  },
  allowPositionals: true,
});
if (
  !id ||
  extra.length ||
  !values.out ||
  extname(values.out).toLowerCase() !== '.wav' ||
  Boolean(values.beat) === Boolean(values.schedule)
)
  throw new Error(
    'Use audition.mjs <lesson> (--beat <beat-id> | --schedule <paint-input.json>) --out <new.wav> [--lessons-dir <dir>].',
  );

const film = await loadFullFilm(id, { lessonsDir: values['lessons-dir'] });
const output = resolve(values.out);
const library = JSON.parse(
  await readFile(new URL('./audition-soundbed.json', import.meta.url), 'utf8'),
);
const policy = courseBedPolicy(id, '', 0);

async function measuredWindow(work) {
  if (values.beat) {
    if (!process.env.LEETLLM_SPEECH_CACHE)
      throw new Error('--beat requires LEETLLM_SPEECH_CACHE with the measured takes.');
    if (!film.beats.some((beat) => beat.id === values.beat))
      throw new Error('Unknown beat ' + values.beat);
    const { takes } = await prepareTakes(
      film.beats.map((beat) => beat.say),
      work,
      { retainedOnly: true },
    );
    const { schedule, frames } = buildTimeline(film, takes);
    const selected = schedule.find((row) => row.beat.id === values.beat);
    return {
      schedule,
      frames,
      start: selected.startFrame,
      end: selected.startFrame + selected.frames,
    };
  }
  const spec = JSON.parse(await readFile(values.schedule, 'utf8'));
  assert.equal(spec.id, id, 'The schedule belongs to another lesson');
  assert.equal(spec.takes.length, film.beats.length, 'The schedule omits authored beats');
  for (const [i, take] of spec.takes.entries()) {
    assert(
      take.id === film.beats[i].id && take.say === film.beats[i].say,
      'The schedule has stale narration at ' + take.id,
    );
    assert.equal(
      createHash('sha256')
        .update(await readFile(take.audio))
        .digest('hex'),
      take.audioSha256,
      'Audio hash mismatch for ' + take.id,
    );
  }
  const { schedule, frames } = buildTimeline(film, spec.takes);
  for (const [i, entry] of schedule.entries()) {
    const take = spec.takes[i];
    assert(
      take.startFrame === entry.startFrame + introFrames && take.frames === entry.frames,
      'The measured clock changed at ' + take.id,
    );
  }
  assert.equal(spec.totalFrames, frames + introFrames, 'Incorrect measured film length');
  const start = spec.start - introFrames,
    end = spec.end - introFrames;
  assert(
    Number.isSafeInteger(spec.start) &&
      Number.isSafeInteger(spec.end) &&
      start >= 0 &&
      start < end &&
      end <= frames,
    'Invalid audition window',
  );
  return { schedule, frames, start, end };
}

function exitStatus(child, name) {
  return new Promise((accept, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) =>
      code === 0 ? accept() : reject(new Error(name + ' exited with ' + (signal ?? code))),
    );
  });
}

// Feed the whole narration to the composer and save just the mixer's surrounding samples.
async function* voiceStream(schedule, frames, first, last, voice, signal) {
  const byte = (frame) => frame * (voiceRate / fps) * bytesPerFrame;
  const fd = openSync(voice, 'wx', 0o600);
  try {
    writeFileSync(fd, pcmHeader(byte(last - first)));
    yield pcmHeader(byte(frames));
    let position = 0;
    for (const args of voiceBatches(schedule)) {
      const decoder = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'inherit'], signal });
      const finished = exitStatus(decoder, 'Voice decoder');
      // The decoder can fail while its last stdout chunk is still draining.
      finished.catch(() => {});
      try {
        for await (const chunk of decoder.stdout) {
          const lo = Math.max(0, byte(first) - position);
          const hi = Math.min(chunk.length, byte(last) - position);
          if (lo < hi) writeFileSync(fd, chunk.subarray(lo, hi));
          position += chunk.length;
          yield chunk;
        }
        await finished;
      } finally {
        if (decoder.exitCode === null && decoder.signalCode === null) decoder.kill();
        await finished.catch(() => {});
      }
    }
    assert.equal(position, byte(frames), 'Decoded voice length differs from the measured clock');
  } finally {
    closeSync(fd);
  }
}

async function audition(work) {
  const { schedule, frames, start, end } = await measuredWindow(work);
  const first = Math.max(0, start - guardFrames),
    last = Math.min(frames, end + guardFrames);
  const nativeSample = (frame) => frame * (voiceRate / fps);
  const mixSample = (frame) => frame * (sampleRate / fps);
  const voice = join(work, 'voice.wav'),
    raw = join(work, 'raw.wav'),
    bed = join(work, 'bed.wav');
  const timing = join(work, 'marks.json');
  await writeFile(timing, scoreTiming(schedule));
  const tools = await soundbedDirectory(library);
  const control = new AbortController();
  const composer = spawn(
    'uv',
    [
      'run',
      '--no-project',
      '--script',
      join(tools, 'soundbed.py'),
      'bed',
      '--voice',
      '-',
      '--out',
      raw,
      '--palette',
      policy.palette,
      '--seed',
      String(policy.seed),
      '--timing',
      timing,
      '--start-sample',
      String(nativeSample(first)),
      '--end-sample',
      String(nativeSample(last)),
    ],
    {
      cwd: work,
      stdio: ['pipe', 'inherit', 'inherit'],
      signal: control.signal,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
    },
  );
  const tasks = [
    exitStatus(composer, 'Vizmatic'),
    pipeline(voiceStream(schedule, frames, first, last, voice, control.signal), composer.stdin, {
      signal: control.signal,
    }),
  ];
  try {
    await Promise.all(tasks);
  } finally {
    control.abort();
    await Promise.allSettled(tasks);
  }
  const ffmpeg = (args) =>
    run('ffmpeg', [
      '-nostdin',
      '-v',
      'error',
      '-xerror',
      '-filter_complex_threads',
      '1',
      '-filter_threads',
      '1',
      ...args,
    ]);
  const fade = 'afade=t=in:st=' + policy.introSeconds + ':d=' + policy.fadeSeconds;
  await ffmpeg([
    '-i',
    raw,
    '-af',
    `asetpts=PTS+${nativeSample(first)}/(${voiceRate}*TB),${fade},asetpts=PTS-STARTPTS`,
    '-ar',
    '48000',
    '-ac',
    '2',
    '-c:a',
    'pcm_s16le',
    bed,
  ]);
  await rm(raw);
  const levels = await measureCourseBed(voice, bed, 0);
  const relative = levels.active.bedMinusVoiceDb;
  const trimDb =
    relative !== null && relative > policy.maxActiveBedDb ? policy.dialogueBedDb - relative : 0;
  const norm = `loudnorm=I=${policy.integratedLufs}:TP=${policy.truePeakDbtp}:LRA=${policy.loudnessRangeLu}`;
  const bedFilter = trimDb < 0 ? `[1:a]volume=${trimDb}dB,aformat=sample_fmts=s16[b];` : '';
  const graph =
    '[0:a]aformat=sample_rates=48000:channel_layouts=stereo[v];' +
    bedFilter +
    '[v]' +
    (trimDb < 0 ? '[b]' : '[1:a]') +
    `amix=inputs=2:duration=first:normalize=0,${norm},aresample=48000,` +
    `atrim=start_sample=${mixSample(start - first)}:end_sample=${mixSample(end - first)}[mix]`;
  const mixed = join(work, 'audition.wav');
  await ffmpeg([
    '-i',
    voice,
    '-i',
    bed,
    '-filter_complex',
    graph,
    '-map',
    '[mix]',
    '-ar',
    '48000',
    '-ac',
    '2',
    '-c:a',
    'pcm_s16le',
    mixed,
  ]);
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'a:0',
    '-show_entries',
    'stream=duration_ts,time_base',
    '-of',
    'json',
    mixed,
  ]);
  const [audio] = JSON.parse(stdout).streams;
  assert(
    audio.time_base === '1/48000' && audio.duration_ts === mixSample(end - start),
    'Audition length differs from the measured window',
  );
  await link(mixed, output);
  return {
    kind: 'voice-and-bed-audition',
    id,
    output,
    startFrame: start + introFrames,
    endFrameExclusive: end + introFrames,
    samplesPerChannel: audio.duration_ts,
    library: library.commit,
    seed: policy.seed,
    palette: policy.palette,
    trimDb,
  };
}

await mkdir(dirname(output), { recursive: true });
const work = await mkdtemp(join(dirname(output), '.course-audition-'));
try {
  console.log(JSON.stringify(await audition(work)));
} finally {
  await rm(work, { recursive: true, force: true });
}
