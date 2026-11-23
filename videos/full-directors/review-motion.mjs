#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const width = 480;
const height = 270;
const usage =
  'node videos/full-directors/review-motion.mjs CLIP --frames START:END --region X,Y,W,H --expect move|hold [--clip-start FRAME] [--tolerance 12] [--min-pixels 12] [--vizmatic-build DIRECTORY]';

function integer(text, label) {
  if (!/^\d+$/u.test(text) || !Number.isSafeInteger(Number(text))) {
    throw new Error(`${label} must be a nonnegative integer.`);
  }
  return Number(text);
}

async function review() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      frames: { type: 'string' },
      region: { type: 'string' },
      expect: { type: 'string' },
      'clip-start': { type: 'string', default: '0' },
      tolerance: { type: 'string', default: '12' },
      'min-pixels': { type: 'string', default: '12' },
      'vizmatic-build': { type: 'string' },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log(usage);
    return;
  }
  if (
    positionals.length !== 1 ||
    !values.frames ||
    !values.region ||
    !['move', 'hold'].includes(values.expect)
  ) {
    throw new Error(usage);
  }
  const clip = resolve(positionals[0]);
  const clipStart = integer(values['clip-start'], '--clip-start');
  const range = values.frames.split(':').map((n) => integer(n, '--frames'));
  const [start, end] = range;
  if (range.length !== 2 || start < clipStart || end - start < 2) {
    throw new Error(
      '--frames START:END must contain at least two frames at or after --clip-start. END is exclusive.',
    );
  }
  const coordinates = values.region.split(',').map((n) => integer(n, '--region'));
  const [x, y, w, h] = coordinates;
  if (coordinates.length !== 4 || w < 1 || h < 1 || x + w > width || y + h > height) {
    throw new Error('--region must be a nonempty rectangle inside the 480 × 270 review picture.');
  }
  const region = { x, y, width: w, height: h };
  const tolerance = integer(values.tolerance, '--tolerance');
  const minPixels = integer(values['min-pixels'], '--min-pixels');
  if (tolerance > 255 || minPixels < 1 || minPixels > w * h) {
    throw new Error(
      'Use a tolerance from 0 to 255 and a pixel threshold between 1 and the region area.',
    );
  }
  let vizmatic;
  if (values['vizmatic-build']) {
    vizmatic = await import(pathToFileURL(resolve(values['vizmatic-build'], 'dist/index.js')).href);
  } else {
    try {
      vizmatic = await import('vizmatic');
    } catch (error) {
      if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    }
  }
  if (typeof vizmatic?.measureRegionChange !== 'function') {
    throw new Error(
      'Use --vizmatic-build with a built Vizmatic checkout that exports measureRegionChange (PR 149).',
    );
  }

  const frameBytes = width * height * 4;
  const count = end - start;
  const child = spawn(
    'ffmpeg',
    [
      '-nostdin',
      '-v',
      'error',
      '-xerror',
      '-threads',
      '1',
      '-filter_threads',
      '1',
      '-i',
      clip,
      '-map',
      '0:v:0',
      '-an',
      '-sn',
      '-dn',
      '-vf',
      `trim=start_frame=${start - clipStart}:end_frame=${end - clipStart},scale=${width}:${height}:flags=area`,
      '-fps_mode',
      'passthrough',
      '-frames:v',
      String(count),
      '-threads',
      '1',
      '-pix_fmt',
      'rgba',
      '-f',
      'rawvideo',
      'pipe:1',
    ],
    { stdio: ['ignore', 'pipe', 'inherit'] },
  );
  const exited = new Promise((resolveExit) => {
    child.once('error', (error) => resolveExit({ error }));
    child.once('close', (code, signal) => resolveExit({ code, signal }));
  });
  let baseline,
    filled = 0,
    seen = 0;
  let current = Buffer.allocUnsafe(frameBytes);
  let firstChangedFrame = null,
    firstChangedBounds = null,
    peakChangedPixels = 0;
  try {
    for await (const chunk of child.stdout) {
      let offset = 0;
      while (offset < chunk.length) {
        const bytes = Math.min(chunk.length - offset, frameBytes - filled);
        chunk.copy(current, filled, offset, offset + bytes);
        filled += bytes;
        offset += bytes;
        if (filled !== frameBytes) continue;
        if (baseline) {
          const { changedPixels, bounds } = vizmatic.measureRegionChange(baseline, current, {
            width,
            height,
            region,
            tolerance,
          });
          peakChangedPixels = Math.max(peakChangedPixels, changedPixels);
          if (firstChangedFrame === null && changedPixels >= minPixels) {
            firstChangedFrame = start + seen;
            firstChangedBounds = bounds;
          }
        } else {
          baseline = current;
          current = Buffer.allocUnsafe(frameBytes);
        }
        seen++;
        filled = 0;
      }
    }
    const { error, code, signal } = await exited;
    if (error) throw error;
    if (code !== 0) throw new Error(`FFmpeg decode failed (${signal ?? code}).`);
    if (seen !== count || filled !== 0)
      throw new Error(`Expected ${count} complete frames. Decoded ${seen}.`);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await exited;
  }
  const passed = (firstChangedFrame !== null) === (values.expect === 'move');
  console.log(
    JSON.stringify({
      clip,
      clipStart,
      start,
      endExclusive: end,
      width,
      height,
      region,
      tolerance,
      minPixels,
      expected: values.expect,
      firstChangedFrame,
      firstChangedBounds,
      peakChangedPixels,
      passed,
    }),
  );
  if (!passed) process.exitCode = 1;
}

review().catch((error) => {
  console.error(error.message);
  process.exitCode = 2;
});
