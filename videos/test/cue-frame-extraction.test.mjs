import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {
  CUE_FRAME_POLICY,
  CUE_HOLD_FRAME_POLICY,
  deriveCueSelection,
  frameFileName,
  main,
  validateReusableReview,
} from '../extract-narration-cue-frames.mjs';

function timeline({
  fps = 10,
  intro = { id: 'leetllm-intro', start: 0, frames: 40 },
  start = 4,
  frames = 100,
  cues,
}) {
  return {
    fps,
    width: 1920,
    height: 1080,
    intro,
    scenes: [{ id: 'intro', start, frames, visualCues: cues }],
  };
}

test('cue phases include the measured scene start and round to nearest global frame', () => {
  const selection = deriveCueSelection(
    timeline({
      cues: [
        {
          id: 'phrase',
          phrase: 'the measured phrase',
          targets: ['target-a'],
          beat: 0,
          start: 1,
          end: 2,
        },
      ],
    }),
  );

  assert.deepEqual(
    selection.samples.map((sample) => sample.phase),
    ['early', 'middle', 'late'],
  );
  assert.deepEqual(
    selection.samples.map((sample) => sample.frame),
    [51, 55, 60],
  );
  assert.deepEqual(
    selection.samples.map((sample) => sample.timeSeconds),
    [5.1, 5.5, 6],
  );
  assert(selection.samples.every((sample) => sample.sceneStartSeconds === 4));
  assert(selection.samples.every((sample) => sample.scene === 'intro' && sample.beat === 0));
  assert.equal(selection.frames.length, 3);
});

test('short cues deduplicate early, middle, and late samples onto one frame', () => {
  const selection = deriveCueSelection(
    timeline({
      fps: 30,
      intro: null,
      start: 0,
      frames: 30,
      cues: [
        { id: 'short', phrase: 'quick cue', targets: ['target'], beat: 0, start: 0, end: 0.01 },
      ],
    }),
  );

  assert.equal(selection.samples.length, 3);
  assert.deepEqual(
    selection.samples.map((sample) => sample.frame),
    [0, 0, 0],
  );
  assert.deepEqual(selection.frames, [{ frame: 0, timeSeconds: 0, sampleIndices: [0, 1, 2] }]);
});

test('optional hold probes inspect the actual result after the words and after emphasis clears', () => {
  const selection = deriveCueSelection(
    timeline({
      cues: [
        {
          id: 'phrase',
          phrase: 'the result',
          targets: ['result'],
          beat: 0,
          start: 1,
          end: 2,
          linger: 0.4,
        },
      ],
    }),
    { afterCues: true },
  );
  assert.equal(selection.policy, CUE_HOLD_FRAME_POLICY);
  assert.equal(selection.cueCount, 1);
  assert.deepEqual(
    selection.samples.map((sample) => sample.phase),
    ['early', 'middle', 'late', 'after-phrase', 'after-highlight'],
  );
  assert.deepEqual(
    selection.samples.map((sample) => sample.frame),
    [51, 55, 60, 62, 66],
  );
});

test('hold probes stay outside a scene exit fade and never cross into the next scene', () => {
  const selection = deriveCueSelection(
    timeline({
      frames: 30,
      cues: [
        { id: 'last', phrase: 'last result', targets: ['result'], beat: 0, start: 2, end: 2.5 },
      ],
    }),
    { afterCues: true },
  );
  assert.equal(selection.cueCount, 1);
  assert.equal(selection.samples.length, 3);
  assert(selection.samples.every((sample) => sample.sceneLocalSeconds <= 2.5));
});

test('cue samples outside the movie clamp to its nearest available frame', () => {
  const selection = deriveCueSelection(
    timeline({
      fps: 10,
      intro: null,
      start: 0,
      frames: 5,
      cues: [
        { id: 'late', phrase: 'outside range', targets: ['target'], beat: 0, start: 1, end: 2 },
      ],
    }),
  );

  assert.deepEqual(
    selection.samples.map((sample) => sample.frame),
    [4, 4, 4],
  );
  assert(selection.samples.every((sample) => sample.clampedToFrameRange));
  assert.deepEqual(selection.frames, [{ frame: 4, timeSeconds: 0.4, sampleIndices: [0, 1, 2] }]);
});

test('existing review reuse requires matching artifact bindings and extracted image hashes', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'cue-frame-review-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const selection = deriveCueSelection(
    timeline({
      fps: 30,
      intro: null,
      start: 0,
      frames: 30,
      cues: [
        { id: 'reuse', phrase: 'reuse cue', targets: ['target'], beat: 0, start: 0.2, end: 0.8 },
      ],
    }),
  );
  const image = createCanvas(2, 2).toBuffer('image/png');
  const imageSha256 = createHash('sha256').update(image).digest('hex');
  const bindings = {
    lessonId: 'fixture',
    moviePath: 'fixture/fixture.mp4',
    sourceFingerprint: 'e'.repeat(64),
    movieSha256: 'a'.repeat(64),
    verificationSha256: 'b'.repeat(64),
    timelineSha256: 'c'.repeat(64),
    toolSha256: 'd'.repeat(64),
    ffmpegVersion: 'ffmpeg fixture',
    selectionSha256: selection.selectionSha256,
    fps: 30,
    width: 2,
    height: 2,
    frameCount: 30,
  };
  const frameRecords = [];
  for (const frame of selection.frames) {
    const imageName = frameFileName(frame.frame);
    await writeFile(path.join(directory, imageName), image);
    frameRecords.push({
      frame: frame.frame,
      timeSeconds: frame.timeSeconds,
      image: imageName,
      sha256: imageSha256,
      width: 2,
      height: 2,
    });
  }
  const framesByNumber = new Map(frameRecords.map((frame) => [frame.frame, frame]));
  await writeFile(
    path.join(directory, 'review.json'),
    JSON.stringify({
      schemaVersion: 1,
      status: 'extracted',
      bindings,
      selection: { policy: CUE_FRAME_POLICY, selectionSha256: selection.selectionSha256 },
      frames: frameRecords,
      samples: selection.samples.map((sample) => {
        const frame = framesByNumber.get(sample.frame);
        return {
          ...sample,
          image: frame.image,
          imageSha256: frame.sha256,
          imageWidth: frame.width,
          imageHeight: frame.height,
        };
      }),
    }),
  );

  assert.equal((await validateReusableReview(directory, bindings, selection)).status, 'extracted');
  await assert.rejects(
    validateReusableReview(directory, { ...bindings, movieSha256: 'e'.repeat(64) }, selection),
    /binding differs: movieSha256/,
  );

  await writeFile(path.join(directory, frameRecords[0].image), Buffer.from('corrupted image'));
  await assert.rejects(
    validateReusableReview(directory, bindings, selection),
    /valid PNG|image binding differs/,
  );
});

test('single-lesson extraction works before a collection manifest exists', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'cue-frame-single-lesson-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const renderRoot = path.join(directory, 'renders'),
    reviewRoot = path.join(directory, 'reviews');
  const lessonRoot = path.join(renderRoot, 'fixture');
  await mkdir(lessonRoot, { recursive: true });
  const videoPath = path.join(lessonRoot, 'fixture.mp4');
  const encode = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'lavfi',
      '-i',
      'color=c=black:s=160x90:r=10:d=2',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-pix_fmt',
      'yuv420p',
      '-threads',
      '1',
      videoPath,
    ],
    { encoding: 'utf8' },
  );
  assert.equal(encode.status, 0, encode.stderr || 'ffmpeg failed to create the fixture movie');

  const timeline = {
    id: 'fixture',
    fps: 10,
    width: 160,
    height: 90,
    duration: 2,
    intro: { id: 'leetllm-intro', start: 0, duration: 0.5, frames: 5, fps: 10 },
    scenes: [
      {
        id: 'intro',
        start: 0.5,
        duration: 1.5,
        frames: 15,
        fps: 10,
        visualCues: [
          {
            id: 'fixture-cue',
            phrase: 'the measured phrase',
            targets: ['fixture-target'],
            beat: 0,
            start: 0.1,
            end: 0.5,
            linger: 0.1,
          },
        ],
      },
    ],
  };
  const timelineBytes = Buffer.from(JSON.stringify(timeline));
  await writeFile(path.join(lessonRoot, 'timeline.json'), timelineBytes);
  const movieSha256 = createHash('sha256')
    .update(await readFile(videoPath))
    .digest('hex');
  const sourceFingerprint = 'e'.repeat(64);
  const timelineSha256 = createHash('sha256').update(timelineBytes).digest('hex');
  await writeFile(
    path.join(lessonRoot, 'verification.json'),
    JSON.stringify({
      id: 'fixture',
      file: videoPath,
      fingerprint: sourceFingerprint,
      sha256: movieSha256,
      fps: '10/1',
      width: 160,
      height: 90,
      fullDecode: 'passed',
      frameAudit: { passed: true, frames: 20 },
      artifactSha256: {
        'fixture.mp4': movieSha256,
        'timeline.json': timelineSha256,
      },
    }),
  );

  await assert.rejects(readFile(path.join(renderRoot, 'manifest.json')), { code: 'ENOENT' });
  await main(['--input', renderRoot, '--output', reviewRoot, '--lesson', 'fixture']);
  const review = JSON.parse(
    await readFile(path.join(reviewRoot, 'fixture', 'review.json'), 'utf8'),
  );
  assert.equal(review.bindings.sourceFingerprint, sourceFingerprint);
  assert.equal(review.bindings.movieSha256, movieSha256);
  assert.equal(review.verification.dimensions.width, 160);
  assert.equal(review.verification.dimensions.height, 90);
  assert.equal(review.selection.sampleCount, 3);
  assert.equal(review.selection.uniqueFrameCount, 3);
  assert(review.samples.every((sample) => sample.imageWidth === 160 && sample.imageHeight === 90));

  const holdRoot = path.join(directory, 'hold-reviews');
  await main(['--input', renderRoot, '--output', holdRoot, '--lesson', 'fixture', '--after-cues']);
  const held = JSON.parse(await readFile(path.join(holdRoot, 'fixture', 'review.json'), 'utf8'));
  assert.equal(held.selection.policy, CUE_HOLD_FRAME_POLICY);
  assert.equal(held.selection.cueCount, 1);
  assert.equal(held.selection.sampleCount, 5);
  assert(held.samples.some((sample) => sample.phase === 'after-highlight'));
  await main(['--input', renderRoot, '--output', holdRoot, '--lesson', 'fixture', '--after-cues']);
  await assert.rejects(
    main(['--input', renderRoot, '--output', holdRoot, '--lesson', 'fixture']),
    /binding differs: selectionSha256/,
  );

  await writeFile(
    path.join(renderRoot, 'manifest.json'),
    JSON.stringify([
      {
        id: 'fixture',
        sha256: movieSha256,
        fingerprint: 'f'.repeat(64),
        artifactSha256: { 'timeline.json': timelineSha256 },
      },
    ]),
  );
  await assert.rejects(
    main(['--input', renderRoot, '--output', path.join(directory, 'all-reviews'), '--all']),
    /source fingerprint differs/,
  );

  await writeFile(
    path.join(renderRoot, 'manifest.json'),
    JSON.stringify([
      {
        id: 'fixture',
        sha256: movieSha256,
        fingerprint: sourceFingerprint,
        artifactSha256: { 'timeline.json': timelineSha256 },
      },
    ]),
  );
  const allHoldRoot = path.join(directory, 'all-hold-reviews');
  await main(['--input', renderRoot, '--output', allHoldRoot, '--all', '--after-cues']);
  const collection = JSON.parse(await readFile(path.join(allHoldRoot, 'manifest.json'), 'utf8'));
  assert.equal(collection.selectionPolicy, CUE_HOLD_FRAME_POLICY);
  assert.equal(collection.lessons[0].samples, 5);
});
