import { execFileSync } from 'node:child_process';
import { readFile, writeFile, rename, rm, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const {
  DIRECTOR_WORK: work,
  DIRECTOR_MODULES,
  DIRECTOR_MASTER,
  DIRECTOR_OUTPUT,
  COURSE_VIDEOS,
} = process.env;
const timing = JSON.parse(await readFile(join(work, 'timing.json')));
const require = createRequire(join(DIRECTOR_MODULES || COURSE_VIDEOS, 'sound.cjs'));
const { renderNarrationHold } = await import(
  pathToFileURL(require.resolve('vizmatic/stage/export'))
);
const { mixCourseBed } = await import(pathToFileURL(join(COURSE_VIDEOS, 'lib/course-bed.mjs')));
const ffmpeg = (args) =>
  execFileSync('ffmpeg', ['-nostdin', '-y', '-v', 'error', ...args], {
    cwd: work,
    stdio: 'inherit',
  });
const totalFrames = timing.frames + 120;
function foley(kind) {
  const sampleRate = 24000,
    samples = new Float32Array(Math.round(sampleRate * 0.21));
  let seed = 102,
    previous = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    if (kind === 'slip') {
      const whisk = 0.028 * (noise - previous) * Math.sin(Math.PI * Math.min(1, t / 0.17)) ** 2;
      const latch =
        t > 0.12 ? 0.05 * Math.exp(-(t - 0.12) * 65) * Math.sin(2 * Math.PI * 390 * (t - 0.12)) : 0;
      samples[i] = whisk + latch;
    } else {
      samples[i] =
        0.075 * Math.exp(-t * 48) * Math.sin(2 * Math.PI * 195 * t) +
        0.035 * noise * Math.exp(-t * 130);
    }
    previous = noise;
  }
  return { sampleRate, samples };
}
function stamp(seconds) {
  const ms = Math.round(seconds * 1000);
  const pad = (n, size = 2) => String(n).padStart(size, '0');
  return (
    pad(Math.floor(ms / 3600000)) +
    ':' +
    pad(Math.floor(ms / 60000) % 60) +
    ':' +
    pad(Math.floor(ms / 1000) % 60) +
    ',' +
    pad(ms % 1000, 3)
  );
}
const cues = [];
for (const beat of timing.beats) {
  let chunk = [];
  const emit = () => {
    if (!chunk.length) return;
    const start = 4 + beat.start + chunk[0].start;
    const finish = 4 + beat.start + chunk.at(-1).end;
    cues.push(
      cues.length +
        1 +
        '\n' +
        stamp(start) +
        ' --> ' +
        stamp(finish) +
        '\n' +
        chunk.map((w) => w.text).join(' '),
    );
    chunk = [];
  };
  for (const w of beat.words) {
    if (
      (beat.id === 'changed' && w.text.toLowerCase().startsWith('blocked')) ||
      (beat.id === 'miss' && w.text.toLowerCase().startsWith('that'))
    )
      emit();
    chunk.push(w);
    if (
      chunk.length >= 7 ||
      chunk.map((w) => w.text).join(' ').length >= 40 ||
      /[?!.:,]$/.test(w.text)
    )
      emit();
  }
  emit();
}
await writeFile(join(work, 'captions.srt'), cues.join('\n\n') + '\n');
const inputs = [],
  filters = [],
  segments = [];
for (const [i, b] of timing.beats.entries()) {
  let file = b.audio;
  const effect = ['slip', 'miss'].includes(b.id);
  if (effect) {
    file = join(work, b.id + '-hold.flac');
    const speechFrames = Math.round(b.duration * 48000);
    await renderNarrationHold({
      narration: b.audio,
      speechFrames,
      holdFrames: b.frames * 1600 - speechFrames,
      sound: foley(b.id),
      output: file,
    });
  }
  inputs.push('-i', file);
  filters.push(
    '[' +
      i +
      ':a]aformat=sample_rates=48000:channel_layouts=stereo,apad,atrim=end_sample=' +
      b.frames * 1600 +
      '[s' +
      i +
      ']',
  );
  segments.push('[s' + i + ']');
}
filters.push(segments.join('') + 'concat=n=' + segments.length + ':v=0:a=1[voice]');
const voice = join(work, 'voice.wav'),
  mixed = join(work, 'scored.flac');
ffmpeg([
  ...inputs,
  '-filter_complex',
  filters.join(';'),
  '-map',
  '[voice]',
  '-c:a',
  'pcm_s16le',
  voice,
]);
const scoreReceipt = await mixCourseBed({
  lesson: 'python-for-ai-engineering',
  source: '',
  voice,
  out: mixed,
  introSeconds: 0,
});
await writeFile(join(work, 'score.json'), JSON.stringify(scoreReceipt, null, 2));
await rm(voice);
ffmpeg([
  '-i',
  DIRECTOR_MASTER,
  '-t',
  '4',
  '-map',
  '0:v:0',
  '-an',
  '-sn',
  '-dn',
  '-map_chapters',
  '-1',
  '-c:v',
  'libx264',
  '-threads',
  '2',
  '-preset',
  'veryfast',
  '-crf',
  '16',
  '-pix_fmt',
  'yuv420p',
  '-video_track_timescale',
  '15360',
  '-frames:v',
  '120',
  'intro.mp4',
]);
await writeFile(join(work, 'picture.concat'), "file 'intro.mp4'\nfile 'body.mp4'\n");
const candidate = join(work, 'output.mp4');
ffmpeg([
  '-f',
  'concat',
  '-safe',
  '0',
  '-i',
  join(work, 'picture.concat'),
  '-i',
  DIRECTOR_MASTER,
  '-i',
  mixed,
  '-i',
  join(work, 'captions.srt'),
  '-filter_complex',
  '[1:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=end_sample=192000,asetpts=PTS-STARTPTS[brand];[brand][2:a]concat=n=2:v=0:a=1[sound]',
  '-map',
  '0:v:0',
  '-map',
  '[sound]',
  '-map',
  '3:s:0',
  '-map_metadata',
  '-1',
  '-map_chapters',
  '-1',
  '-c:v',
  'copy',
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-ar',
  '48000',
  '-ac',
  '2',
  '-c:s',
  'mov_text',
  '-metadata:s:s:0',
  'language=eng',
  '-disposition:s:0',
  'default',
  '-t',
  String(totalFrames / 30),
  '-movflags',
  '+faststart',
  candidate,
]);
const probe = JSON.parse(
  execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', candidate],
    { encoding: 'utf8' },
  ),
);
const [v, a, s] = probe.streams;
if (
  v.codec_name !== 'h264' ||
  v.width !== 1920 ||
  v.height !== 1080 ||
  Number(v.nb_frames) !== totalFrames ||
  v.avg_frame_rate !== '30/1' ||
  a.codec_name !== 'aac' ||
  Math.abs(Number(a.duration) - totalFrames / 30) > 0.025 ||
  s.codec_name !== 'mov_text' ||
  s.tags.language !== 'eng' ||
  s.disposition.default !== 1
)
  throw Error('Invalid film streams ' + JSON.stringify(probe));
ffmpeg(['-xerror', '-i', candidate, '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-']);
const digest = createHash('sha256')
  .update(await readFile(candidate))
  .digest('hex');
await writeFile(
  join(work, 'verification.json'),
  JSON.stringify(
    {
      sha256: digest,
      frames: totalFrames,
      seconds: totalFrames / 30,
      captions: cues.length,
      voice: timing.voice,
      palette: scoreReceipt.palette,
      source: fixtureDescription(),
    },
    null,
    2,
  ),
);
function fixtureDescription() {
  return 'Request 102 expects blocked and originally saved “ ESCALATED ”. The two-row run omits 102; the three-match run changes its prediction to blocked.';
}
await mkdir(dirname(DIRECTOR_OUTPUT), { recursive: true });
await rename(candidate, DIRECTOR_OUTPUT);
console.log(DIRECTOR_OUTPUT, digest);
