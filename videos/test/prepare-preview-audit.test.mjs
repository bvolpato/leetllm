import test from 'node:test';
import { courseNarrator } from '../lib/course-speech.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { preparePreviewAudit } from '../prepare-preview-audit.mjs';
import { publicationPlan } from '../lib/r2-publication.mjs';

const firstSay = 'Weights map to values.';
const secondSay = 'Nearby codes approximate weights.';

async function fixture(t) {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'leetllm-preview-audit-')),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const lessonDirectory = path.join(root, 'videos/lessons');
  const animationDirectory = path.join(root, 'videos/animations');
  const articleDirectory = path.join(root, 'web/src/content/fundamentals/preview-audit-fixture');
  const measuredDirectory = path.join(root, 'measured/preview');
  await Promise.all(
    [
      lessonDirectory,
      animationDirectory,
      articleDirectory,
      measuredDirectory,
      path.join(root, 'build'),
    ].map((directory) => fs.mkdir(directory, { recursive: true })),
  );
  const article =
    '---\n{"slug":"preview-audit-fixture","title":"Preview audit fixture"}\n---\nA measured preview fixture.\n';
  const markup = `version: 1\nid: preview-audit-fixture\ntitle: Preview audit fixture\nsource: fundamentals/preview-audit-fixture/content.md\nvoice: en-US-JennyNeural\nrate: "+0%"\nscenes:\n  - id: explanation\n    title: One measured change\n    visual: Show the mapping.\n    beats:\n      - say: "${firstSay}"\n        hold: 0.5\n        visual_cues:\n          - id: mapping\n            phrase: map to values\n            targets: [mapped-values]\n            color: cyan\n      - say: "${secondSay}"\n        hold: 0.4\n        visual_cues:\n          - id: approximation\n            phrase: approximate weights\n            targets: [compressed-values]\n            color: yellow\n`;
  const markupPath = path.join(lessonDirectory, 'preview-audit-fixture.lesson.yaml');
  const animationPath = path.join(animationDirectory, 'preview-audit-fixture.mjs');
  const timelinePath = path.join(measuredDirectory, 'timeline.json');
  await Promise.all([
    fs.writeFile(path.join(articleDirectory, 'content.md'), article),
    fs.writeFile(markupPath, markup),
    fs.writeFile(animationPath, 'export const draw = () => {};\n'),
  ]);
  const firstWords = [
    { text: 'Weights', start: 0, end: 0.12 },
    { text: 'map', start: 0.2, end: 0.32 },
    { text: 'to', start: 0.4, end: 0.5 },
    { text: 'values.', start: 0.6, end: 0.76 },
  ];
  const secondWords = [
    { text: 'Nearby', start: 0, end: 0.12 },
    { text: 'codes', start: 0.2, end: 0.32 },
    { text: 'approximate', start: 0.4, end: 0.58 },
    { text: 'weights.', start: 0.7, end: 0.86 },
  ];
  const timeline = {
    id: 'preview-audit-fixture',
    provider: 'measured-preview',
    voice: courseNarrator.voice,
    rate: courseNarrator.rate,
    fps: 30,
    width: 1920,
    height: 1080,
    intro: { duration: 0, frames: 0, fps: 30 },
    scenes: [
      {
        id: 'explanation',
        fps: 30,
        frames: 105,
        duration: 3.5,
        start: 0,
        beats: [
          { say: firstSay, hold: 0.5, start: 0.4, end: 1.3, duration: 0.9, until: 1.8 },
          { say: secondSay, hold: 0.4, start: 1.8, end: 2.8, duration: 1, until: 3.2 },
        ],
        sounds: [
          { beatIndex: 0, duration: 0.9, words: firstWords },
          { beatIndex: 1, duration: 1, words: secondWords },
        ],
      },
    ],
    duration: 3.5,
  };
  const timelineBytes = Buffer.from(JSON.stringify(timeline, null, 2) + '\n');
  await fs.writeFile(timelinePath, timelineBytes);
  return {
    root,
    markupPath,
    animationPath,
    timelinePath,
    timeline,
    timelineBytes,
    outputPath: path.join(root, 'build/source-preview-cue-audit'),
  };
}

test('prepares a source-only bundle bound to exact measured words and authored sources', async (t) => {
  const sample = await fixture(t);
  const before = await Promise.all(
    [sample.markupPath, sample.animationPath, sample.timelinePath].map(async (file) =>
      fs.readFile(file),
    ),
  );
  const result = await preparePreviewAudit({
    root: sample.root,
    lessonId: 'preview-audit-fixture',
    timelinePath: sample.timelinePath,
    outputPath: sample.outputPath,
  });

  const selection = JSON.parse(
    await fs.readFile(path.join(sample.outputPath, 'selection.json'), 'utf8'),
  );
  const lessonDirectory = path.join(sample.root, selection.lessons[0].sourceDirectory);
  const receiptPath = path.join(lessonDirectory, 'verification.json');
  const receipt = JSON.parse(await fs.readFile(receiptPath, 'utf8'));
  assert.equal(result.preparation.status, 'ready');
  assert.equal(result.preparation.scenes[0].cues, 2);
  assert.ok(result.preparation.scenes[0].spokenCueFrames > 0);
  assert.ok(result.preparation.scenes[0].spokenCueTargets > 0);
  assert.equal(selection.sourcePreviewOnly, true);
  assert.equal(selection.notExportVerification, true);
  assert.equal(receipt.sourcePreviewOnly, true);
  assert.equal(receipt.notExportVerification, true);
  assert.equal(receipt.artifactSha256['timeline.json'], result.preparation.measuredTimeline.sha256);
  assert.equal('sha256' in receipt, false);
  assert.equal('fullDecode' in receipt, false);
  assert.equal('frameAudit' in receipt, false);
  assert.deepEqual(await fs.readFile(path.join(lessonDirectory, 'timeline.json')), before[2]);
  assert.deepEqual(
    await Promise.all(
      [sample.markupPath, sample.animationPath, sample.timelinePath].map((file) =>
        fs.readFile(file),
      ),
    ),
    before,
  );
});

test('rejects a measured preview with a different narrator even if it matches an old markup voice', async (t) => {
  const sample = await fixture(t);
  const timeline = JSON.parse(await fs.readFile(sample.timelinePath, 'utf8'));
  timeline.voice = 'en-US-JennyNeural';
  await fs.writeFile(sample.timelinePath, JSON.stringify(timeline));
  await assert.rejects(
    preparePreviewAudit({ ...sample, lessonId: 'preview-audit-fixture' }),
    /narration voice changed/,
  );
});

test('refuses a measured preview whose narration differs from the authored beat', async (t) => {
  const sample = await fixture(t);
  sample.timeline.scenes[0].beats[0].say = 'Weights become nearby values.';
  await fs.writeFile(sample.timelinePath, JSON.stringify(sample.timeline, null, 2) + '\n');
  await assert.rejects(
    preparePreviewAudit({
      root: sample.root,
      lessonId: 'preview-audit-fixture',
      timelinePath: sample.timelinePath,
      outputPath: sample.outputPath,
    }),
    /narration changed/,
  );
  await assert.rejects(fs.lstat(sample.outputPath), (error) => error.code === 'ENOENT');
});

test('accepts the renderer’s existing 200 ms final-word padding allowance', async (t) => {
  const sample = await fixture(t);
  sample.timeline.scenes[0].sounds[0].words.at(-1).end = 1.1;
  await fs.writeFile(sample.timelinePath, JSON.stringify(sample.timeline, null, 2) + '\n');
  const result = await preparePreviewAudit({
    root: sample.root,
    lessonId: 'preview-audit-fixture',
    timelinePath: sample.timelinePath,
    outputPath: sample.outputPath,
  });
  assert.equal(result.preparation.scenes[0].cues, 2);
  assert.ok(result.preparation.scenes[0].spokenCueFrames > 0);
});

test('requires sound durations to match their cursor-scheduled beats', async (t) => {
  const sample = await fixture(t);
  sample.timeline.scenes[0].sounds[1].duration = 0.9999;
  await fs.writeFile(sample.timelinePath, JSON.stringify(sample.timeline, null, 2) + '\n');
  await assert.rejects(
    preparePreviewAudit({
      root: sample.root,
      lessonId: 'preview-audit-fixture',
      timelinePath: sample.timelinePath,
      outputPath: sample.outputPath,
    }),
    /renderer schedule/,
  );
  await assert.rejects(fs.lstat(sample.outputPath), (error) => error.code === 'ENOENT');
});

test('rejects word events beyond the renderer’s 200 ms TTS padding allowance', async (t) => {
  const sample = await fixture(t);
  sample.timeline.scenes[0].sounds[0].words.at(-1).end = 1.101;
  await fs.writeFile(sample.timelinePath, JSON.stringify(sample.timeline, null, 2) + '\n');
  await assert.rejects(
    preparePreviewAudit({
      root: sample.root,
      lessonId: 'preview-audit-fixture',
      timelinePath: sample.timelinePath,
      outputPath: sample.outputPath,
    }),
    /padding allowance/,
  );
  await assert.rejects(fs.lstat(sample.outputPath), (error) => error.code === 'ENOENT');
});

test('refuses beat timings shifted from the renderer cursor schedule', async (t) => {
  const sample = await fixture(t);
  Object.assign(sample.timeline.scenes[0].beats[1], { start: 2, end: 3, until: 3.4 });
  await fs.writeFile(sample.timelinePath, JSON.stringify(sample.timeline, null, 2) + '\n');
  await assert.rejects(
    preparePreviewAudit({
      root: sample.root,
      lessonId: 'preview-audit-fixture',
      timelinePath: sample.timelinePath,
      outputPath: sample.outputPath,
    }),
    /renderer schedule/,
  );
  await assert.rejects(fs.lstat(sample.outputPath), (error) => error.code === 'ENOENT');
});

test('rejects duplicate speech events for a beat', async (t) => {
  const sample = await fixture(t);
  sample.timeline.scenes[0].sounds[1].beatIndex = 0;
  await fs.writeFile(sample.timelinePath, JSON.stringify(sample.timeline, null, 2) + '\n');
  await assert.rejects(
    preparePreviewAudit({
      root: sample.root,
      lessonId: 'preview-audit-fixture',
      timelinePath: sample.timelinePath,
      outputPath: sample.outputPath,
    }),
    /duplicate measured speech/,
  );
  await assert.rejects(fs.lstat(sample.outputPath), (error) => error.code === 'ENOENT');
});

test('rejects a missing measured speech event', async (t) => {
  const sample = await fixture(t);
  sample.timeline.scenes[0].sounds.pop();
  await fs.writeFile(sample.timelinePath, JSON.stringify(sample.timeline, null, 2) + '\n');
  await assert.rejects(
    preparePreviewAudit({
      root: sample.root,
      lessonId: 'preview-audit-fixture',
      timelinePath: sample.timelinePath,
      outputPath: sample.outputPath,
    }),
    /does not cover every authored beat/,
  );
  await assert.rejects(fs.lstat(sample.outputPath), (error) => error.code === 'ENOENT');
});

test('rejects beat timing that runs beyond its measured scene frame window', async (t) => {
  const sample = await fixture(t);
  sample.timeline.scenes[0].beats[1].until = 3.6;
  await fs.writeFile(sample.timelinePath, JSON.stringify(sample.timeline, null, 2) + '\n');
  await assert.rejects(
    preparePreviewAudit({
      root: sample.root,
      lessonId: 'preview-audit-fixture',
      timelinePath: sample.timelinePath,
      outputPath: sample.outputPath,
    }),
    /outside measured scene frame window/,
  );
  await assert.rejects(fs.lstat(sample.outputPath), (error) => error.code === 'ENOENT');
});

test('rejects a cue with no spoken frame after the shared onset allowance', async (t) => {
  const sample = await fixture(t);
  const markup = await fs.readFile(sample.markupPath, 'utf8');
  await fs.writeFile(
    sample.markupPath,
    markup.replace('phrase: approximate weights', 'phrase: weights'),
  );
  sample.timeline.scenes[0].sounds[1].words.at(-1).start = 0.9;
  sample.timeline.scenes[0].sounds[1].words.at(-1).end = 0.901;
  await fs.writeFile(sample.timelinePath, JSON.stringify(sample.timeline, null, 2) + '\n');
  await assert.rejects(
    preparePreviewAudit({
      root: sample.root,
      lessonId: 'preview-audit-fixture',
      timelinePath: sample.timelinePath,
      outputPath: sample.outputPath,
    }),
    /no measured spoken frame/,
  );
  await assert.rejects(fs.lstat(sample.outputPath), (error) => error.code === 'ENOENT');
});

test('rejects a cue that falls entirely inside the allowed word-event padding', async (t) => {
  const sample = await fixture(t);
  const markup = await fs.readFile(sample.markupPath, 'utf8');
  await fs.writeFile(sample.markupPath, markup.replace('phrase: map to values', 'phrase: values'));
  sample.timeline.scenes[0].sounds[0].words.at(-1).start = 1.05;
  sample.timeline.scenes[0].sounds[0].words.at(-1).end = 1.1;
  await fs.writeFile(sample.timelinePath, JSON.stringify(sample.timeline, null, 2) + '\n');
  await assert.rejects(
    preparePreviewAudit({
      root: sample.root,
      lessonId: 'preview-audit-fixture',
      timelinePath: sample.timelinePath,
      outputPath: sample.outputPath,
    }),
    /no overlap with measured audio/,
  );
  await assert.rejects(fs.lstat(sample.outputPath), (error) => error.code === 'ENOENT');
});

test('refuses unsafe and colliding outputs without modifying a completed bundle', async (t) => {
  const sample = await fixture(t);
  const outside = path.join(sample.root, 'outside-audit-output');
  await assert.rejects(
    preparePreviewAudit({
      root: sample.root,
      lessonId: 'preview-audit-fixture',
      timelinePath: sample.timelinePath,
      outputPath: outside,
    }),
    /direct child of/,
  );
  await assert.rejects(fs.lstat(outside), (error) => error.code === 'ENOENT');
  await assert.rejects(
    preparePreviewAudit({
      root: sample.root,
      lessonId: 'preview-audit-fixture',
      timelinePath: sample.timelinePath,
      outputPath: 'build/../outside-audit-output',
    }),
    /parent-directory segments/,
  );

  await preparePreviewAudit({
    root: sample.root,
    lessonId: 'preview-audit-fixture',
    timelinePath: sample.timelinePath,
    outputPath: sample.outputPath,
  });
  const existing = await fs.readFile(path.join(sample.outputPath, 'selection.json'));
  await assert.rejects(
    preparePreviewAudit({
      root: sample.root,
      lessonId: 'preview-audit-fixture',
      timelinePath: sample.timelinePath,
      outputPath: sample.outputPath,
    }),
    /already exists/,
  );
  assert.deepEqual(await fs.readFile(path.join(sample.outputPath, 'selection.json')), existing);
});

test('the source-preview receipt cannot satisfy the R2 export publication contract', async (t) => {
  const sample = await fixture(t);
  await preparePreviewAudit({
    root: sample.root,
    lessonId: 'preview-audit-fixture',
    timelinePath: sample.timelinePath,
    outputPath: sample.outputPath,
  });
  const selectionFile = path.join(sample.outputPath, 'selection.json');
  const collectionFile = path.join(sample.root, 'collection.json');
  await fs.writeFile(
    collectionFile,
    JSON.stringify({
      lessons: [
        { id: 'preview-audit-fixture', source: 'fundamentals/preview-audit-fixture/content.md' },
      ],
    }),
  );
  await assert.rejects(
    publicationPlan({
      root: sample.root,
      selectionFile,
      collectionFile,
      domain: 'videos.leetllm.com',
    }),
    /decoded, geometry-verified movie receipt/,
  );
});
