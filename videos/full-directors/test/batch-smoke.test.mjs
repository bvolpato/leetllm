import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const source = fileURLToPath(new URL('../../', import.meta.url));

test(
  'batch CLI verifies a real tiny export and resumes around failed and pre-existing movies',
  {
    skip: process.env.FULL_DIRECTOR_SMOKE !== '1',
  },
  async (t) => {
    const root = await mkdtemp(join(tmpdir(), 'director-batch-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const videos = join(root, 'videos');
    const directors = join(videos, 'full-directors');
    const out = join(root, 'masters');
    const lessons = ['unknown-master', 'broken-example', 'library-hours'].map((id) => ({
      id,
      title: id,
      group: 'Computing Foundations',
      source: 'foundations/' + id + '/content.md',
    }));
    await mkdir(join(videos, 'collections'), { recursive: true });
    await mkdir(directors);
    for (const path of [
      'lib',
      'assets',
      'adapters',
      'director-cuts/lesson-runtime',
      'soundtracks',
      'narration.json',
      'soundbed.json',
      'vizmatic-review.commit',
      'package.json',
      'package-lock.json',
      'render.mjs',
      'check-coverage.mjs',
      'full-directors/batch.mjs',
      'full-directors/check.mjs',
      'full-directors/render.mjs',
      'full-directors/film.mjs',
      'full-directors/sound.mjs',
    ]) {
      await cp(join(source, path), join(videos, path), { recursive: true });
    }
    await symlink(
      await realpath(join(source, 'node_modules')),
      join(videos, 'node_modules'),
      'dir',
    );
    await writeFile(
      join(videos, 'collections/complete-curriculum.json'),
      JSON.stringify({
        version: 1,
        id: 'fixtures',
        title: 'Batch fixtures',
        lessons,
      }),
    );
    for (const { id } of lessons.slice(1)) {
      const dir = join(directors, 'lessons', id);
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, 'narration.json'),
        JSON.stringify([
          {
            id: 'hours',
            title: 'Opening hours',
            sourceChapters: ['c01'],
            beats: [{ id: 'date', say: 'Sunday. The library is closed.', hold: 0.25 }],
          },
        ]),
      );
      await writeFile(
        join(dir, 'film.mjs'),
        `export default {
      title: 'Library hours',
      check() { ${id === 'broken-example' ? "throw new Error('broken example');" : 'return true;'} },
      draw(ctx, clock) {
        ctx.fillStyle = clock.elapsed > 0.15 ? '#0000ff' : '#ff0000';
        ctx.fillRect(0, 0, clock.width, clock.height);
      },
    };`,
      );
    }
    const cli = (...args) =>
      exec(process.execPath, [join(directors, 'batch.mjs'), '--out', out, ...args], {
        env: {
          ...process.env,
          LEETLLM_INTRO_CACHE: join(root, 'intro'),
          LEETLLM_SPEECH_CACHE: process.env.LEETLLM_SPEECH_CACHE || join(root, 'speech'),
        },
      });
    await assert.rejects(cli('--jobs', '5', '--all'), /Usage:/);
    await assert.rejects(cli('absent'), /Unknown curriculum slug/);
    await mkdir(out);
    const legacy = join(out, '001-unknown-master.mp4');
    await writeFile(legacy, 'external movie');
    await assert.rejects(cli('--jobs', '1', '--all'), (error) => {
      assert.match(error.stderr, /Existing\/unverified 001-unknown-master/);
      assert.match(error.stderr, /broken example/);
      assert.match(error.stdout, /Finished 003-library-hours/, error.stderr);
      return true;
    });
    assert.equal(await readFile(legacy, 'utf8'), 'external movie');
    await assert.rejects(stat(join(out, '002-broken-example.mp4')), { code: 'ENOENT' });
    const movie = join(out, '003-library-hours.mp4');
    const probe = JSON.parse(
      (
        await exec('ffprobe', [
          '-v',
          'error',
          '-show_streams',
          '-show_chapters',
          '-of',
          'json',
          movie,
        ])
      ).stdout,
    );
    const [picture, audio, captions] = probe.streams;
    assert.deepEqual(
      [picture.codec_name, picture.width, picture.height, picture.avg_frame_rate],
      ['h264', 1920, 1080, '30/1'],
    );
    assert.deepEqual(
      [
        audio.codec_name,
        audio.channels,
        audio.sample_rate,
        captions.codec_name,
        captions.tags.language,
      ],
      ['aac', 2, '48000', 'mov_text', 'eng'],
    );
    assert.deepEqual(
      probe.chapters.map((chapter) => chapter.tags.title),
      ['LeetLLM', 'Opening hours'],
    );
    const original = await readFile(movie);
    await writeFile(join(directors, 'lessons/broken-example/film.mjs'), '// An unrelated edit.');
    assert.match((await cli('library-hours')).stdout, /Verified existing 003-library-hours/);
    await writeFile(movie, original.subarray(0, 256));
    assert.match((await cli('library-hours')).stderr, /Existing\/unverified/);
    assert.deepEqual(await readFile(movie), original.subarray(0, 256));
    await writeFile(movie, original);
    await writeFile(join(directors, 'lessons/library-hours/narration.json'), '[]');
    assert.match((await cli('library-hours')).stderr, /Existing\/unverified/);
    assert.deepEqual(await readFile(movie), original);
  },
);
