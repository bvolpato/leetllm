import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  statfs,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { prepareTakes } from '../../lib/course-speech.mjs';

const enabled = process.env.FULL_DIRECTOR_SMOKE === '1';
test(
  'public export joins the chime to authored frame zero, the measured score and curriculum chapters',
  { skip: !enabled },
  async (t) => {
    const root = await mkdtemp(join(tmpdir(), 'full-movie-smoke-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const { bavail, bsize } = await statfs(root);
    assert(
      bavail * bsize >= 8 * 1024 ** 3 + 64 * 1024 ** 2,
      'The smoke needs 64 MiB above the production free-space reserve.',
    );
    const lessonsDir = join(root, 'lessons'),
      dir = join(lessonsDir, 'library-hours');
    const text = 'Sunday. The library is closed.';
    const chapters = [
      {
        id: 'calendar',
        title: 'Check the date',
        sourceChapters: ['c01'],
        beats: [
          { id: 'date', say: text, hold: 0.4 },
          { id: 'hours', say: text, hold: 0.1 },
        ],
      },
      {
        id: 'door',
        title: 'Try the door',
        sourceChapters: ['c02', 'c03'],
        beats: [{ id: 'visit', say: text, hold: 0.55 }],
      },
    ];
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'narration.json'), JSON.stringify(chapters));
    await writeFile(
      join(dir, 'film.mjs'),
      `import { readFileSync } from 'node:fs';
  export default {
    title: 'Library hours', check() { return true; },
    preparePicture(schedule) {
      return schedule.map(entry => readFileSync(entry.audio).length);
    },
    draw(ctx, clock) {
      if (!(clock.pictureData[clock.index] > 0)) throw new Error('The measured audio was empty.');
      const closed = clock.reveal('is closed', 0);
      ctx.fillStyle = clock.beat.chapterIndex === 1 ? '#00ff00' : closed ? '#0000ff' : '#ff0000';
      ctx.fillRect(0, 0, clock.width, clock.height);
    },
  };`,
    );
    const output = join(root, 'fixture.mp4'),
      intro = join(root, 'intro');
    const env = {
      ...process.env,
      LEETLLM_INTRO_CACHE: intro,
      LEETLLM_SPEECH_CACHE: process.env.LEETLLM_SPEECH_CACHE || join(root, 'speech'),
    };
    const run = (cmd, args, options = {}) =>
      execFileSync(cmd, args, { env, stdio: 'pipe', ...options });
    const cli = fileURLToPath(new URL('../render.mjs', import.meta.url));
    const report = JSON.parse(
      run(process.execPath, [cli, 'library-hours', '--lessons-dir', lessonsDir, '--out', output]),
    );
    const checker = fileURLToPath(new URL('../check.mjs', import.meta.url));
    const reviewed = JSON.parse(
      run(process.execPath, [
        checker,
        'library-hours',
        '--lessons-dir',
        lessonsDir,
        '--measured',
        '--sheet',
        join(root, 'sheet.jpg'),
      ]),
    );
    assert.equal(reviewed.timing, 'measured words');
    assert.equal(reviewed.bodyFrames, report.bodyFrames);
    const data = JSON.parse(
      run('ffprobe', [
        '-v',
        'error',
        '-of',
        'json',
        '-show_streams',
        '-show_chapters',
        '-show_format',
        output,
      ]),
    );
    const [video] = data.streams;
    const audio = data.streams.find((s) => s.codec_type === 'audio');
    const subtitles = data.streams.find((s) => s.codec_type === 'subtitle');
    assert.deepEqual(
      [video.codec_name, video.width, video.height, video.avg_frame_rate],
      ['h264', 1920, 1080, '30/1'],
    );
    assert.deepEqual([audio.codec_name, audio.sample_rate, audio.channels], ['aac', '48000', 2]);
    assert.deepEqual(
      [subtitles.codec_name, subtitles.tags.language, subtitles.disposition.default],
      ['mov_text', 'eng', 1],
    );
    assert.equal(data.format.tags.title, 'Library hours');

    // Read the provider measurements independently of the MP4's timestamps.
    const savedCache = process.env.LEETLLM_SPEECH_CACHE;
    process.env.LEETLLM_SPEECH_CACHE = env.LEETLLM_SPEECH_CACHE;
    let take;
    try {
      ({
        takes: [take],
      } = await prepareTakes([text], join(root, 'measure'), { retainedOnly: true }));
    } finally {
      if (savedCache === undefined) delete process.env.LEETLLM_SPEECH_CACHE;
      else process.env.LEETLLM_SPEECH_CACHE = savedCache;
    }
    const boundaries = JSON.parse(await readFile(take.boundaries));
    assert.equal(boundaries.provider, 'kokoro');
    assert.equal(boundaries.voice, 'af_heart');
    const beatFrames = chapters.flatMap((c) =>
      c.beats.map((b) => Math.ceil(30 * (take.duration + b.hold) - 1e-9)),
    );
    const starts = [0, 120, 120 + beatFrames[0] + beatFrames[1]];
    const frames = starts.at(-1) + beatFrames[2];
    assert.equal(Number(video.nb_frames), frames);
    assert.equal(report.frames, frames);
    assert.deepEqual(
      data.chapters.map((c) => c.tags.title),
      ['LeetLLM', ...chapters.map((c) => c.title)],
    );
    for (const [i, c] of data.chapters.entries()) {
      assert(Math.abs(Number(c.start_time) - starts[i] / 30) < 0.001);
      assert(Math.abs(Number(c.end_time) - (starts[i + 1] ?? frames) / 30) < 0.001);
    }
    const ffmpeg = (...args) =>
      run('ffmpeg', ['-nostdin', '-v', 'error', '-xerror', '-threads', '2', ...args]);
    const phrases = ffmpeg('-i', output, '-map', '0:s:0', '-f', 'srt', 'pipe:1').toString();
    const toMs = (ts) =>
      ts.split(/[:,]/u).reduce((n, value, i) => n * (i === 3 ? 1000 : 60) + Number(value), 0);
    const cueStarts = [...phrases.matchAll(/(\d\d:\d\d:\d\d,\d{3}) --> [^\n]+\nis closed\./gu)].map(
      (match) => toMs(match[1]),
    );
    const revealTime = take.words.find((w) => w.text === 'is').start;
    assert.deepEqual(
      cueStarts,
      [120, 120 + beatFrames[0], starts.at(-1)].map((start) =>
        Math.ceil((start / 30 + revealTime) * 1000 - 1e-8),
      ),
    );

    const official = join(
      intro,
      (await readdir(intro)).find((path) => path.endsWith('.mp4')),
    );
    const pixels = (file) =>
      ffmpeg(
        '-i',
        file,
        '-map',
        '0:v:0',
        '-vf',
        'scale=32:18:flags=area',
        '-pix_fmt',
        'rgb24',
        '-f',
        'rawvideo',
        'pipe:1',
      );
    const movie = pixels(output),
      opener = pixels(official),
      stride = 32 * 18 * 3;
    assert.equal(movie.length, frames * stride);
    assert.equal(opener.length, 120 * stride);
    let error = 0;
    for (let i = 0; i < opener.length; i++) error += Math.abs(movie[i] - opener[i]);
    assert(error / opener.length < 2, 'Opening pixels differ from the official animation.');
    const change = Math.ceil(revealTime * 30 - 1e-9);
    for (let i = 120; i < frames; i++) {
      const local = i < 120 + beatFrames[0] ? i - 120 : i - 120 - beatFrames[0];
      const channel = i >= starts.at(-1) ? 1 : local >= change ? 2 : 0;
      assert(movie[i * stride + channel] > 240, `Unexpected authored frame ${i}`);
    }
    const rate = 8000;
    const decode = (file) =>
      ffmpeg('-i', file, '-map', '0:a:0', '-ac', '1', '-ar', String(rate), '-f', 'f32le', 'pipe:1');
    const chime = decode(official),
      mixed = decode(output);
    let dot = 0,
      a2 = 0,
      b2 = 0;
    for (let i = 0; i < 3.9 * rate * 4; i += 4) {
      const a = chime.readFloatLE(i),
        b = mixed.readFloatLE(i);
      dot += a * b;
      a2 += a * a;
      b2 += b * b;
    }
    assert(dot / Math.sqrt(a2 * b2) > 0.99, 'Opening chime differs from the official recording.');
    assert(mixed.length >= (frames / 30 - 0.002) * rate * 4);
    const voice = decode(take.audio);
    let speechProduct = 0,
      speechPower = 0,
      mixPower = 0;
    for (let i = 0; i < voice.length; i += 4) {
      const a = voice.readFloatLE(i),
        b = mixed.readFloatLE(i + 4 * rate * 4);
      speechProduct += a * b;
      speechPower += a * a;
      mixPower += b * b;
    }
    assert(
      speechProduct / Math.sqrt(speechPower * mixPower) > 0.96,
      'Mixed speech differs from the measured take.',
    );
    // The voice has finished here. The continuous course score remains audible during the hold.
    const holdStart = Math.ceil((4 + take.duration + 0.1) * rate);
    let holdPower = 0;
    for (let i = holdStart; i < holdStart + 800; i++) holdPower += mixed.readFloatLE(i * 4) ** 2;
    assert(Math.sqrt(holdPower / 800) > 0.0001, 'Silent score in the first hold.');
    assert((await readdir(root)).every((file) => !file.startsWith('.full-director-')));
    // The same host also accepts the short format with one chapter per take.
    const videos = fileURLToPath(new URL('../../', import.meta.url));
    const shadow = join(root, 'videos'),
      cuts = join(shadow, 'director-cuts');
    const runtime = join(cuts, 'lesson-runtime'),
      shortDir = join(cuts, 'lessons', 'library-hours');
    await mkdir(shortDir, { recursive: true });
    await mkdir(runtime);
    await Promise.all(
      [
        'assets',
        'lib',
        'node_modules',
        'render.mjs',
        'package-lock.json',
        'vizmatic-review.commit',
      ].map((name) => symlink(join(videos, name), join(shadow, name))),
    );
    for (const name of ['render.mjs', 'cuts.json'])
      await copyFile(join(videos, 'director-cuts', name), join(cuts, name));
    for (const name of [
      'intro.py',
      'delivery.mjs',
      'render.mjs',
      'sound.mjs',
      'picture.mjs',
      'timeline.mjs',
    ])
      await copyFile(join(videos, 'director-cuts/lesson-runtime', name), join(runtime, name));
    await writeFile(
      join(shortDir, 'film.mjs'),
      (await readFile(join(dir, 'film.mjs'), 'utf8')).replace(
        "title: 'Library hours'",
        `title: 'Hours', beats: ${JSON.stringify([chapters[0].beats[0]])}`,
      ),
    );
    const shortMovie = join(root, 'short.mp4');
    run(process.execPath, [join(cuts, 'render.mjs'), 'library-hours', '--out', shortMovie]);
    const short = JSON.parse(
      run('ffprobe', ['-v', 'error', '-of', 'json', '-show_streams', '-show_chapters', shortMovie]),
    );
    assert.deepEqual(
      short.chapters.map((c) => c.tags.title),
      ['LeetLLM', 'date'],
    );
    assert.equal(Number(short.streams[0].nb_frames), 120 + beatFrames[0]);
    assert(pixels(shortMovie)[120 * stride] > 240);
    t.diagnostic(
      JSON.stringify({
        frames,
        chapters: report.chapters,
        voice: boundaries.voice,
        cueStartsMs: cueStarts,
        chimeCorrelation: dot / Math.sqrt(a2 * b2),
        openerMeanRgbError: error / opener.length,
      }),
    );
  },
);
