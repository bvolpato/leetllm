import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { artifact, sourceDir, envPath } from './common.mjs';

function run(file) {
  return new Promise((done, fail) => {
    const child = spawn(process.execPath, [join(sourceDir, file)], { stdio: 'inherit' });
    child.on('error', fail);
    child.on('exit', (code, signal) =>
      code === 0 ? done() : fail(Error(file + ' stopped with ' + (signal ?? code))),
    );
  });
}
await run('speech.mjs');
await Promise.all([run('art.mjs'), run('soundtrack.mjs')]);
const timing = JSON.parse(readFileSync(artifact('timing.json'), 'utf8'));
const intro = 4;
const stamp = (s) => new Date(Math.round(s * 1000)).toISOString().slice(11, 23).replace('.', ',');
const captions = [];
for (const b of timing.beats) {
  let part = [];
  for (const [i, w] of b.words.entries()) {
    part.push(w);
    if (
      /[.!?]$/.test(w.text) ||
      (part.length >= 6 && /,/.test(w.text)) ||
      i === b.words.length - 1
    ) {
      const text = part
        .map((x) => x.text)
        .join(' ')
        .replace('P ninety', 'P90');
      captions.push({ start: b.start + intro + part[0].start, end: b.start + intro + w.end, text });
      part = [];
    }
  }
}
writeFileSync(
  artifact('captions.srt'),
  captions
    .map((c, i) => [i + 1, stamp(c.start) + ' --> ' + stamp(c.end), c.text, ''].join('\n'))
    .join('\n'),
);
const chapterDefs = [
  ['open', 'The morning ticket'],
  ['ask', 'Set the rail'],
  ['change', 'The school poster run'],
  ['try', 'One more sheet'],
];
const chapters = chapterDefs.map(([id, title]) => ({
  title,
  start: Math.round((intro + timing.beats.find((b) => b.id === id).start) * 1000),
}));
chapters.unshift({ title: 'LeetLLM', start: 0 });
const length = intro + timing.seconds;
writeFileSync(
  artifact('chapters.ffmeta'),
  ';FFMETADATA1\n' +
    chapters
      .map(
        (c, i) =>
          '[CHAPTER]\nTIMEBASE=1/1000\nSTART=' +
          c.start +
          '\nEND=' +
          (chapters[i + 1]?.start ?? Math.round(length * 1000)) +
          '\ntitle=' +
          c.title +
          '\n',
      )
      .join(''),
);
const output = envPath('DIRECTOR_OUTPUT'),
  parent = dirname(output);
mkdirSync(parent, { recursive: true });
const staging = mkdtempSync(join(parent, '.forecasting-'));
const temp = join(staging, 'film.mp4');
try {
  const graph = [
    '[0:v]trim=end_frame=120,setpts=PTS-STARTPTS,setsar=1,format=yuv420p[logo]',
    '[1:v]setpts=PTS-STARTPTS,setsar=1,format=yuv420p[body]',
    '[logo][body]concat=n=2:v=1:a=0[video]',
    '[0:a]aresample=48000,atrim=end_sample=192000,asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo[chime]',
    '[2:a]aresample=48000,atrim=end_sample=' +
      timing.frames * 1600 +
      ',asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo[mix]',
    '[chime][mix]concat=n=2:v=0:a=1[audio]',
  ].join(';');
  execFileSync(
    'ffmpeg',
    [
      '-nostdin',
      '-y',
      '-v',
      'error',
      '-t',
      '4',
      '-i',
      envPath('DIRECTOR_MASTER'),
      '-i',
      artifact('body.mp4'),
      '-i',
      artifact('mixed.flac'),
      '-i',
      artifact('captions.srt'),
      '-f',
      'ffmetadata',
      '-i',
      artifact('chapters.ffmeta'),
      '-filter_complex',
      graph,
      '-map',
      '[video]',
      '-map',
      '[audio]',
      '-map',
      '3:0',
      '-map_chapters',
      '4',
      '-c:v',
      'libx264',
      '-threads',
      '2',
      '-preset',
      'veryfast',
      '-crf',
      '16',
      '-r',
      '30',
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
      '-movflags',
      '+faststart',
      temp,
    ],
    { stdio: 'inherit' },
  );
  const info = JSON.parse(
    execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_format', '-show_streams', '-show_chapters', '-of', 'json', temp],
      { encoding: 'utf8' },
    ),
  );
  const [video, audio, captionsStream] = info.streams;
  if (
    video.codec_name !== 'h264' ||
    video.width !== 1920 ||
    video.height !== 1080 ||
    video.avg_frame_rate !== '30/1' ||
    Number(video.nb_frames) !== 120 + timing.frames
  )
    throw Error('Incorrect number or geometry of video frames');
  if (
    audio.codec_name !== 'aac' ||
    audio.channels !== 2 ||
    Number(audio.sample_rate) !== 48000 ||
    Math.abs(Number(audio.duration) - length) > 0.002
  )
    throw Error('Incorrect full-film sound timing');
  if (
    captionsStream.codec_name !== 'mov_text' ||
    captionsStream.tags?.language !== 'eng' ||
    captionsStream.disposition.default !== 1
  )
    throw Error('English captions missing');
  if (info.chapters.length !== chapters.length) throw Error('Missing chapters');
  execFileSync(
    'ffmpeg',
    [
      '-nostdin',
      '-v',
      'error',
      '-xerror',
      '-i',
      temp,
      '-map',
      '0:v:0',
      '-map',
      '0:a:0',
      '-f',
      'null',
      '-',
    ],
    { stdio: 'inherit' },
  );
  writeFileSync(
    artifact('verification.json'),
    JSON.stringify(
      {
        width: video.width,
        height: video.height,
        frames: Number(video.nb_frames),
        duration: length,
        voice: timing.voice.voice,
        captions: captions.length,
        chapters,
      },
      null,
      2,
    ),
  );
  renameSync(temp, output);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
