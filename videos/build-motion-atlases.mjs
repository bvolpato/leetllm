#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { parse } from 'yaml';
import { paginateMotionScenes, rankSceneBeatsByMotion } from './lib/review-coverage.mjs';

const require = createRequire(path.resolve('videos/package.json'));
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const inputRoot = path.resolve(option('--input', 'build/video-complete-curriculum'));
const outputRoot = path.resolve(option('--output', 'build/video-worldclass-review-20261023'));
const repoRoot = process.cwd();
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fileHash = async (file) => hash(await fs.readFile(file));
const pagesOnly = args.includes('--pages-only');
const scenesPerPage = 4;
const rowHeight = 356;
const imageWidth = 512;

function repoRelative(file) {
  return path.relative(repoRoot, file).split(path.sep).join('/');
}

async function assertFilesAbsent(files) {
  for (const file of files) {
    try {
      await fs.access(file);
      throw new Error(`Refusing to replace existing reviewer material: ${file}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

async function renderMotionPages({
  id,
  title,
  movieSha256,
  sourceFingerprint,
  master,
  masterImageSha256,
  receipt,
  materialsDir,
}) {
  const pages = paginateMotionScenes(master.scenes, scenesPerPage);
  const pagesDir = path.join(materialsDir, 'motion-pages');
  const pageFiles = pages.map((page) =>
    path.join(pagesDir, `page-${String(page.page).padStart(2, '0')}.png`),
  );
  const indexPath = path.join(materialsDir, 'motion-pages.json');
  await assertFilesAbsent([...pageFiles, indexPath]);
  await fs.mkdir(pagesDir, { recursive: true });

  const pageIndex = [];
  for (const [pageIndexNumber, page] of pages.entries()) {
    const height = rowHeight * page.scenes.length;
    const canvas = createCanvas(imageWidth * 3, height);
    const context = canvas.getContext('2d');
    context.fillStyle = '#101319';
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (const [row, scene] of page.scenes.entries()) {
      const y = row * rowHeight;
      context.fillStyle = '#f2f4f8';
      context.font = 'bold 16px sans-serif';
      context.fillText(
        `${page.startIndex + row + 1}. ${scene.title}`,
        12,
        y + 21,
        canvas.width - 24,
      );
      context.fillStyle = '#aab5c7';
      context.font = '13px sans-serif';
      context.fillText(
        `Beat ${scene.beat + 1} · largest decoded motion sum ${scene.motionSum.toFixed(2)} · ${scene.measuredFrames} frames`,
        12,
        y + 40,
        canvas.width - 24,
      );
      for (const [column, sample] of scene.samples.entries()) {
        const samplePath = path.resolve(repoRoot, sample.path);
        const actualHash = await fileHash(samplePath);
        if (actualHash !== sample.sha256)
          throw new Error(
            `${id}/${scene.scene}: ${sample.phase} sample changed since master atlas generation`,
          );
        const image = await loadImage(samplePath);
        if (image.width !== receipt.width || image.height !== receipt.height) {
          throw new Error(`${id}/${scene.scene}: native sample dimensions changed`);
        }
        context.drawImage(image, column * imageWidth, y + 47, imageWidth, 288);
        context.fillStyle = '#aab5c7';
        context.font = '12px sans-serif';
        context.fillText(
          `${sample.phase} · ${sample.time.toFixed(2)}s · frame ${sample.frame}`,
          column * imageWidth + 9,
          y + 350,
          imageWidth - 18,
        );
      }
    }
    const file = pageFiles[pageIndexNumber];
    const png = await canvas.encode('png');
    await fs.writeFile(file, png);
    pageIndex.push({
      page: page.page,
      path: repoRelative(file),
      sha256: hash(png),
      width: canvas.width,
      height: canvas.height,
      firstScene: page.scenes[0].scene,
      lastScene: page.scenes.at(-1).scene,
      sceneIds: page.scenes.map((scene) => scene.scene),
      scenes: page.scenes,
    });
  }

  const index = {
    schemaVersion: 1,
    id,
    title,
    movieSha256,
    sourceFingerprint,
    scenesPerPage,
    dimensions: {
      width: imageWidth * 3,
      rowHeight,
      imageWidth,
      sampleWidth: imageWidth,
      sampleHeight: 288,
    },
    masterAtlas: {
      path: repoRelative(path.join(materialsDir, 'motion-all-scenes.png')),
      sha256: masterImageSha256,
    },
    sceneCount: master.scenes.length,
    pages: pageIndex,
  };
  await fs.writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  return { pages: pageIndex.length, scenes: master.scenes.length, indexPath };
}

if (args.includes('--help')) {
  process.stdout.write(
    'Usage: node videos/build-motion-atlases.mjs [--input DIR] [--output REVIEW_DIR] [--pages-only]\n',
  );
  process.exit(0);
}

const collection = JSON.parse(
  await fs.readFile('videos/collections/complete-curriculum.json', 'utf8'),
);
const manifest = JSON.parse(await fs.readFile(path.join(inputRoot, 'manifest.json'), 'utf8'));
const manifestById = new Map(manifest.map((row) => [row.id, row]));
if (
  manifestById.size !== collection.lessons.length ||
  collection.lessons.some((row) => !manifestById.has(row.id))
) {
  throw new Error(
    'Video manifest and complete-curriculum collection do not contain the same lesson set',
  );
}

let sceneCount = 0;
let sampleCount = 0;
for (const catalogLesson of collection.lessons) {
  const id = catalogLesson.id;
  const lessonDir = path.join(inputRoot, id);
  const [receipt, timeline, encoded, metrics, authored] = await Promise.all([
    fs.readFile(path.join(lessonDir, 'verification.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(lessonDir, 'timeline.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(lessonDir, 'encoded-review/verification.json'), 'utf8').then(JSON.parse),
    fs
      .readFile(path.join(lessonDir, 'encoded-review/decoded-frame-metrics.json'), 'utf8')
      .then(JSON.parse),
    fs.readFile(path.resolve(repoRoot, 'videos/lessons', `${id}.lesson.yaml`), 'utf8').then(parse),
  ]);
  const manifestRow = manifestById.get(id);
  if (receipt.sha256 !== manifestRow.sha256 || encoded.videoSha256 !== manifestRow.sha256) {
    throw new Error(
      `${id}: video and encoded review receipts are not bound to the same manifest hash`,
    );
  }
  if (receipt.fingerprint !== manifestRow.fingerprint || authored.id !== id) {
    throw new Error(`${id}: source or lesson metadata does not match the current render`);
  }
  const materialsDir = path.join(outputRoot, 'materials', id);
  if (pagesOnly) {
    const masterImagePath = path.join(materialsDir, 'motion-all-scenes.png');
    const masterJsonPath = path.join(materialsDir, 'motion-all-scenes.json');
    const master = JSON.parse(await fs.readFile(masterJsonPath, 'utf8'));
    const actualMasterHash = await fileHash(masterImagePath);
    if (
      master.id !== id ||
      master.movieSha256 !== manifestRow.sha256 ||
      master.sourceFingerprint !== manifestRow.fingerprint
    ) {
      throw new Error(`${id}: existing master motion atlas is stale for the requested page build`);
    }
    if (actualMasterHash !== master.imageSha256)
      throw new Error(`${id}: existing master motion atlas image hash mismatch`);
    if (master.scenes?.length !== timeline.scenes.length)
      throw new Error(`${id}: existing master motion atlas has a different scene count`);
    const rendered = await renderMotionPages({
      id,
      title: catalogLesson.title,
      movieSha256: manifestRow.sha256,
      sourceFingerprint: manifestRow.fingerprint,
      master,
      masterImageSha256: actualMasterHash,
      receipt,
      materialsDir,
    });
    sceneCount += rendered.scenes;
    sampleCount += rendered.scenes * 3;
    continue;
  }
  const metricPath = 'decoded-frame-metrics.json';
  const actualMetricHash = await fileHash(path.join(lessonDir, 'encoded-review', metricPath));
  if (actualMetricHash !== encoded.artifactSha256?.[metricPath])
    throw new Error(`${id}: decoded metric artifact hash mismatch`);
  const rankings = rankSceneBeatsByMotion(timeline, metrics, Number(timeline.fps));
  const authoredByScene = new Map(authored.scenes.map((scene) => [scene.id, scene]));
  const sampleBySceneBeatPhase = new Map();
  for (const sample of encoded.samples ?? []) {
    for (const target of sample.targets ?? []) {
      if (target.beat === undefined || !['early', 'middle', 'late'].includes(target.phase))
        continue;
      sampleBySceneBeatPhase.set(`${target.scene}:${target.beat}:${target.phase}`, sample);
    }
  }

  const selectedScenes = [];
  for (const scene of timeline.scenes) {
    const selection = rankings.get(scene.id);
    const authoredScene = authoredByScene.get(scene.id);
    if (!authoredScene?.title || !selection)
      throw new Error(`${id}/${scene.id}: missing scene title or beat motion ranking`);
    const samples = [];
    for (const phase of ['early', 'middle', 'late']) {
      const sample = sampleBySceneBeatPhase.get(`${scene.id}:${selection.beat}:${phase}`);
      if (!sample)
        throw new Error(
          `${id}/${scene.id}: encoded review lacks ${phase} sample for selected beat ${selection.beat + 1}`,
        );
      const sampleFile = path.join(lessonDir, 'encoded-review', sample.image);
      const expectedHash = encoded.artifactSha256?.[sample.image];
      if (!expectedHash)
        throw new Error(
          `${id}/${scene.id}: selected frame is absent from encoded artifact hash map`,
        );
      const actualHash = await fileHash(sampleFile);
      if (actualHash !== expectedHash)
        throw new Error(`${id}/${scene.id}: selected ${phase} image hash mismatch`);
      samples.push({
        phase,
        frame: sample.frame,
        time: sample.time,
        path: repoRelative(sampleFile),
        sha256: actualHash,
      });
    }
    selectedScenes.push({
      scene: scene.id,
      title: authoredScene.title,
      beat: selection.beat,
      narration: scene.beats[selection.beat].say,
      beatStart: selection.start,
      beatEnd: selection.end,
      motionSum: Number(selection.motionSum.toFixed(4)),
      measuredFrames: selection.measuredFrames,
      samples,
    });
  }

  const imagePath = path.join(materialsDir, 'motion-all-scenes.png');
  const jsonPath = path.join(materialsDir, 'motion-all-scenes.json');
  await fs.mkdir(materialsDir, { recursive: true });
  for (const file of [imagePath, jsonPath]) {
    try {
      await fs.access(file);
      throw new Error(`Refusing to replace existing reviewer material: ${file}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  const canvas = createCanvas(imageWidth * 3, rowHeight * selectedScenes.length);
  const context = canvas.getContext('2d');
  context.fillStyle = '#101319';
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (const [index, scene] of selectedScenes.entries()) {
    const y = index * rowHeight;
    context.fillStyle = '#f2f4f8';
    context.font = 'bold 16px sans-serif';
    context.fillText(`${index + 1}. ${scene.title}`, 12, y + 21, canvas.width - 24);
    context.fillStyle = '#aab5c7';
    context.font = '13px sans-serif';
    context.fillText(
      `Beat ${scene.beat + 1} · largest decoded motion sum ${scene.motionSum.toFixed(2)} · ${scene.measuredFrames} frames`,
      12,
      y + 40,
      canvas.width - 24,
    );
    for (const [column, sample] of scene.samples.entries()) {
      const x = column * imageWidth;
      const image = await loadImage(path.resolve(repoRoot, sample.path));
      if (image.width !== receipt.width || image.height !== receipt.height) {
        throw new Error(`${id}/${scene.scene}: native sample dimensions changed`);
      }
      context.drawImage(image, x, y + 47, imageWidth, 288);
      context.fillStyle = '#aab5c7';
      context.font = '12px sans-serif';
      context.fillText(
        `${sample.phase} · ${sample.time.toFixed(2)}s · frame ${sample.frame}`,
        x + 9,
        y + 350,
        imageWidth - 18,
      );
    }
  }
  await fs.writeFile(imagePath, await canvas.encode('png'));
  const imageSha256 = await fileHash(imagePath);
  const atlas = {
    schemaVersion: 1,
    id,
    title: catalogLesson.title,
    movieSha256: receipt.sha256,
    sourceFingerprint: receipt.fingerprint,
    image: repoRelative(imagePath),
    imageSha256,
    metricArtifact: {
      path: repoRelative(path.join(lessonDir, 'encoded-review', metricPath)),
      sha256: encoded.artifactSha256[metricPath],
      rows: metrics.length,
      column: 'meanAbsoluteDifference',
    },
    selection:
      'For every authored scene, select the beat with the largest sum of per-frame mean absolute grayscale change during its narration interval. Show encoded early, middle and late samples for that beat.',
    width: canvas.width,
    height: canvas.height,
    scenes: selectedScenes,
  };
  await fs.writeFile(jsonPath, `${JSON.stringify(atlas, null, 2)}\n`);
  await renderMotionPages({
    id,
    title: catalogLesson.title,
    movieSha256: manifestRow.sha256,
    sourceFingerprint: manifestRow.fingerprint,
    master: atlas,
    masterImageSha256: imageSha256,
    receipt,
    materialsDir,
  });
  sceneCount += selectedScenes.length;
  sampleCount += selectedScenes.length * 3;
}

process.stdout.write(
  `${JSON.stringify({ lessons: collection.lessons.length, scenes: sceneCount, nativeSamples: sampleCount, output: path.join(outputRoot, 'materials') }, null, 2)}\n`,
);
