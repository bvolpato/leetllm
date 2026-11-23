import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const cli = fileURLToPath(new URL('../../full-directors/review-motion.mjs', import.meta.url));
const build = process.env.VIZMATIC_BUILD;
const vizmatic = await import(
  build ? pathToFileURL(join(build, 'dist/index.js')).href : 'vizmatic'
);
const skip =
  typeof vizmatic.measureRegionChange !== 'function'
    ? 'This Vizmatic build predates the optional review API.'
    : spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0 &&
      'FFmpeg is unavailable.';

test(
  'the review CLI uses absolute film frames and a new reference for a later hold',
  { skip },
  async () => {
    const dir = await mkdtemp(join(tmpdir(), 'course-review-motion-'));
    try {
      const clip = join(dir, 'motion.mkv');
      const encoded = spawnSync(
        'ffmpeg',
        [
          '-v',
          'error',
          '-f',
          'lavfi',
          '-i',
          'color=black:s=480x270:r=30',
          '-vf',
          "drawbox=x=12:y=8:w=20:h=20:color=white:t=fill:enable='gte(n,2)'",
          '-frames:v',
          '5',
          '-threads',
          '1',
          '-c:v',
          'ffv1',
          clip,
        ],
        { encoding: 'utf8' },
      );
      assert.equal(encoded.status, 0, encoded.stderr);
      function run(frames, region, expectation) {
        return spawnSync(
          process.execPath,
          [
            cli,
            clip,
            '--clip-start',
            '120',
            '--frames',
            frames,
            '--region',
            region,
            '--expect',
            expectation,
            ...(build ? ['--vizmatic-build', build] : []),
          ],
          { encoding: 'utf8' },
        );
      }
      const moved = run('120:125', '12,8,20,20', 'move');
      assert.equal(moved.status, 0, moved.stderr);
      assert.equal(JSON.parse(moved.stdout).firstChangedFrame, 122);
      const held = run('122:125', '12,8,20,20', 'hold');
      assert.equal(held.status, 0, held.stderr);
      assert.equal(JSON.parse(held.stdout).peakChangedPixels, 0);
      const missed = run('120:125', '100,100,20,20', 'move');
      assert.equal(missed.status, 1);
      assert.equal(JSON.parse(missed.stdout).passed, false);
      const truncated = run('122:126', '12,8,20,20', 'hold');
      assert.equal(truncated.status, 2);
      assert.match(truncated.stderr, /Expected 4 complete frames. Decoded 3/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
);
