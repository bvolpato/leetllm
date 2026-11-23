import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { score } from './sound.mjs';
import { renderPicture } from './picture.mjs';
import { buildCaptions } from './captions.mjs';

const source = new URL('./script.json', import.meta.url);
const script = JSON.parse(await readFile(source, 'utf8'));
const required = (name) => {
  assert(process.env[name], name + ' is required');
  return resolve(process.env[name]);
};
const work = required('DIRECTOR_WORK'),
  output = required('DIRECTOR_OUTPUT');
const master = required('DIRECTOR_MASTER'),
  videos = required('COURSE_VIDEOS');
const modules = process.env.DIRECTOR_MODULES ? resolve(process.env.DIRECTOR_MODULES) : videos;
await mkdir(work, { recursive: true });
await mkdir(dirname(output), { recursive: true });
const timing = await score(script, work, videos);
await renderPicture({ script, timing, work, modules });
const subtitles = join(work, 'film.srt');
await writeFile(subtitles, buildCaptions(master, script.originalOpeningFrames, timing));
const opening = script.originalOpeningFrames / 30,
  body = timing.frames / 30;
const frames = script.originalOpeningFrames + timing.frames;
const title = 'Which guide answers the query?';
const chapterNames = [
  ['LeetLLM', 0],
  ['Two guides for one question', 4],
  ['Read their reach', opening],
  ['Give both arrows one unit', opening + timing.schedule.find((b) => b.id === 'normalize').start],
  ['Turn the query', opening + timing.schedule.find((b) => b.id === 'predict').start],
];
const metadata = [';FFMETADATA1', `title=${title}`];
chapterNames.forEach(([name, t], i) =>
  metadata.push(
    '[CHAPTER]',
    'TIMEBASE=1/1000',
    `START=${Math.round(t * 1000)}`,
    `END=${Math.round((chapterNames[i + 1]?.[1] ?? frames / 30) * 1000)}`,
    `title=${name}`,
  ),
);
await writeFile(join(work, 'chapters.txt'), metadata.join('\n') + '\n');
const ff = (...args) => execFileSync('ffmpeg', ['-v', 'error', '-nostdin', '-y', ...args]);
const temp = join(dirname(output), '.096-geometry-delivery.tmp.mp4');
const video = `[0:v]trim=end_frame=${script.originalOpeningFrames},settb=1/30,setpts=N,setsar=1[v0];[1:v]trim=end_frame=${timing.frames},settb=1/30,setpts=N,setsar=1[v1];[v0][v1]concat=n=2:v=1:a=0[v]`;
const audio = `[0:a]aresample=48000,atrim=end_sample=${script.originalOpeningFrames * 1600},asetpts=PTS-STARTPTS,afade=t=out:st=${opening - 0.1}:d=0.1[a0];[2:a]aresample=48000,apad,atrim=end_sample=${timing.frames * 1600},asetpts=PTS-STARTPTS,afade=t=in:d=0.10,afade=t=out:st=${body - 0.48}:d=0.48[a1];[a0][a1]concat=n=2:v=0:a=1[a]`;
ff(
  '-t',
  String(opening),
  '-i',
  master,
  '-i',
  join(work, 'body.mp4'),
  '-i',
  join(work, 'mixed.flac'),
  '-i',
  subtitles,
  '-f',
  'ffmetadata',
  '-i',
  join(work, 'chapters.txt'),
  '-filter_complex_threads',
  '2',
  '-filter_complex',
  video + ';' + audio,
  '-map',
  '[v]',
  '-map',
  '[a]',
  '-map',
  '3:s:0',
  '-map_metadata',
  '4',
  '-map_chapters',
  '4',
  '-c:v',
  'libx264',
  '-preset',
  'veryfast',
  '-threads:v',
  '2',
  '-crf',
  '16',
  '-pix_fmt',
  'yuv420p',
  '-r',
  '30',
  '-c:a',
  'aac',
  '-ar',
  '48000',
  '-ac',
  '2',
  '-b:a',
  '224k',
  '-c:s',
  'mov_text',
  '-metadata:s:s:0',
  'language=eng',
  '-disposition:s:0',
  'default',
  '-movflags',
  '+faststart',
  temp,
);
ff('-xerror', '-threads', '2', '-i', temp, '-map', '0:v', '-map', '0:a', '-f', 'null', '-');
const probe = JSON.parse(
  execFileSync('ffprobe', [
    '-v',
    'error',
    '-show_streams',
    '-show_format',
    '-show_chapters',
    '-of',
    'json',
    temp,
  ]),
);
const [v, a, s] = probe.streams;
assert.deepEqual(
  [v.codec_name, v.width, v.height, v.avg_frame_rate, Number(v.nb_frames)],
  ['h264', 1920, 1080, '30/1', frames],
);
assert.deepEqual(
  [a.codec_name, a.channels, Number(a.sample_rate), s.codec_name, s.disposition.default],
  ['aac', 2, 48000, 'mov_text', 1],
);
assert.equal(probe.chapters.length, chapterNames.length);
assert(Math.abs(Number(a.duration) - frames / 30) <= 0.001);
await rename(temp, output);
console.log(`${output}: ${frames} frames, ${(frames / 30).toFixed(3)}s`);
