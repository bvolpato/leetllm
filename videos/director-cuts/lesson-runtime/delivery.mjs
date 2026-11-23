import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BRAND_INTRO_SECONDS } from '../../lib/brand.mjs';
import { fps, height, width } from './timeline.mjs';

export function verifyStreams(info, frames, chapters, expectedChapters) {
  const video = info.streams.find((s) => s.codec_type === 'video');
  const audio = info.streams.find((s) => s.codec_type === 'audio');
  const english = info.streams.find((s) => s.codec_type === 'subtitle');
  assert.deepEqual(
    [
      video?.codec_name,
      video?.pix_fmt,
      video?.width,
      video?.height,
      video?.avg_frame_rate,
      Number(video?.nb_frames),
    ],
    ['h264', 'yuv420p', width, height, `${fps}/1`, frames],
    'Invalid delivery picture',
  );
  assert.deepEqual(
    [audio?.codec_name, audio?.channels, Number(audio?.sample_rate)],
    ['aac', 2, 48000],
    'Invalid delivery sound',
  );
  assert(Math.abs(Number(audio.duration) - frames / fps) <= 0.002, 'Audio does not span the film.');
  assert.deepEqual(
    [english?.codec_name, english?.tags?.language, english?.disposition?.default],
    ['mov_text', 'eng', 1],
    'Missing default English phrase captions',
  );
  assert.equal(info.chapters.length, chapters, 'Missing chapters');
  assert.equal(Number(info.chapters[0].end_time), BRAND_INTRO_SECONDS, 'Invalid opening duration');
  if (expectedChapters) {
    assert.equal(expectedChapters.length, chapters, 'Unexpected source chapter count');
    for (const [index, source] of expectedChapters.entries()) {
      const actual = info.chapters[index];
      assert.equal(actual.tags?.title, source.tags?.title, `Chapter ${index + 1} title changed`);
      for (const field of ['start_time', 'end_time']) {
        assert(
          Math.abs(Number(actual[field]) - Number(source[field])) <= 0.000501,
          `Chapter ${index + 1} (${source.tags?.title}) ${field} differs from the authored clock`,
        );
      }
    }
    assert(
      Math.abs(Number(info.chapters.at(-1).end_time) - frames / fps) <= 0.000501,
      'Final chapter does not reach the last video frame boundary',
    );
  }
}

export function finishMovie({
  body,
  audio,
  captions,
  chapters,
  bodyFrames,
  chapterCount,
  staged,
  pictureIncludesOpening = false,
  productionPlayback = false,
}) {
  const script = fileURLToPath(new URL('./intro.py', import.meta.url));
  const intro = execFileSync(
    process.env.UV || 'uv',
    ['run', '--no-project', '--script', script, process.execPath],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  ).trim();
  const introFrames = BRAND_INTRO_SECONDS * fps;
  // Encode both pictures with one H.264 configuration so the decoder never changes at the join.
  const picture = (file, frames, label) =>
    `[${file}:v:0]trim=end_frame=${frames},settb=1/${fps},setpts=N,setsar=1,format=yuv420p[${label}]`;
  const sound = (file, frames, label) =>
    `[${file}:a:0]aformat=sample_rates=48000:channel_layouts=stereo,apad,atrim=end_sample=${frames * (48000 / fps)},asetpts=PTS-STARTPTS[${label}]`;
  const filters = [
    ...(pictureIncludesOpening
      ? []
      : [
          picture(0, introFrames, 'intro'),
          picture(1, bodyFrames, 'body'),
          '[intro][body]concat=n=2:v=1:a=0[v]',
        ]),
    sound(0, introFrames, 'chime'),
    sound(2, bodyFrames, 'mix'),
    '[chime][mix]concat=n=2:v=0:a=1[a]',
  ];
  const ffmpeg = (args) =>
    execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-xerror', ...args], { stdio: 'inherit' });
  ffmpeg([
    '-y',
    '-threads',
    '2',
    '-i',
    intro,
    '-threads',
    '2',
    '-i',
    body,
    '-i',
    audio,
    '-f',
    'srt',
    '-i',
    captions,
    '-f',
    'ffmetadata',
    '-i',
    chapters,
    '-filter_complex_threads',
    '2',
    '-filter_complex',
    filters.join(';'),
    '-map',
    pictureIncludesOpening ? '1:v:0' : '[v]',
    '-map',
    '[a]',
    '-map',
    '3:s:0',
    '-map_metadata',
    '4',
    '-map_chapters',
    '4',
    ...(pictureIncludesOpening
      ? ['-c:v', 'copy']
      : [
          '-c:v',
          'libx264',
          '-profile:v',
          'high',
          '-level:v',
          '4.1',
          '-pix_fmt',
          'yuv420p',
          '-r',
          String(fps),
          '-preset',
          'veryfast',
          '-crf',
          '16',
          '-threads:v',
          '2',
          '-color_primaries',
          'bt709',
          '-color_trc',
          'bt709',
          '-colorspace',
          'bt709',
          '-color_range',
          'tv',
        ]),
    '-c:a',
    'aac',
    '-ar',
    '48000',
    '-ac',
    '2',
    '-b:a',
    '192k',
    '-c:s',
    'mov_text',
    '-metadata:s:s:0',
    'language=eng',
    '-disposition:s:0',
    'default',
    // Chapter samples use the movie clock. The automatic clock can reach 48 million
    // ticks per second and overflow a signed packet duration within a single teaching unit.
    '-movie_timescale',
    '1000',
    '-movflags',
    '+faststart',
    staged,
  ]);
  const info = JSON.parse(
    execFileSync('ffprobe', [
      '-v',
      'error',
      '-show_streams',
      '-show_chapters',
      '-of',
      'json',
      staged,
    ]),
  );
  const source = JSON.parse(
    execFileSync('ffprobe', [
      '-v',
      'error',
      '-f',
      'ffmetadata',
      '-show_chapters',
      '-of',
      'json',
      chapters,
    ]),
  );
  verifyStreams(info, introFrames + bodyFrames, chapterCount, source.chapters);
  if (productionPlayback !== true) {
    ffmpeg(['-threads', '2', '-i', staged, '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-']);
  }
  return info;
}
