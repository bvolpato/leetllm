#!/usr/bin/env node
import { verifiedClockReceipt } from './lib/frame-clock.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadImage } from '@napi-rs/canvas';
import { currentSourceFingerprint } from './lib/source-fingerprint.mjs';
import { readLesson } from './lib/lesson.mjs';
import { LAYOUT_AUDIT_RULES } from './lib/frame-audit.mjs';
import { validateMotionTimeline, validateMotionReceipt } from './lib/motion-audit.mjs';
import { textInkSampleFrames } from './audit-text-ink.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const collectionDefault = path.join(repositoryRoot, 'videos/collections/complete-curriculum.json');
const rubricPath = 'videos/curation-rubric.json';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const hashFile = async (file) => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const inside = (root, file) => {
  const relative = path.relative(root, file);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
};
const isSha256 = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

export function parseArguments(args) {
  const options = { lessons: [], shards: 1, rotation: 0, readyOnly: false };
  const seen = new Set();
  for (let index = 0; index < args.length;) {
    const flag = args[index++];
    if (!flag.startsWith('--')) throw new Error(`Unexpected argument ${flag}`);
    if (seen.has(flag) && flag !== '--lesson') throw new Error(`Duplicate option ${flag}`);
    seen.add(flag);
    if (flag === '--input' || flag === '--output' || flag === '--collection') {
      const value = args[index];
      if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
      options[flag.slice(2)] = value;
      index++;
    } else if (flag === '--lesson') {
      let count = 0;
      while (index < args.length && !args[index].startsWith('--')) {
        options.lessons.push(args[index++]);
        count++;
      }
      if (!count) throw new Error('--lesson requires one or more IDs');
    } else if (flag === '--shards' || flag === '--rotate') {
      const value = args[index];
      if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
      if (!/^\d+$/.test(value)) throw new Error(`${flag} must be a non-negative integer`);
      const parsed = Number(value);
      if (!Number.isSafeInteger(parsed)) throw new Error(`${flag} must be a safe integer`);
      if (flag === '--shards') {
        if (parsed < 1 || parsed > 16) throw new Error('--shards must be an integer from 1 to 16');
        options.shards = parsed;
      } else {
        options.rotation = parsed;
      }
      index++;
    } else if (flag === '--ready-only') {
      options.readyOnly = true;
    } else {
      throw new Error(`Unknown option ${flag}`);
    }
  }
  if (!options.input) throw new Error('--input is required');
  if (!options.output) throw new Error('--output is required');
  const duplicate = options.lessons.find((id, index) => options.lessons.indexOf(id) !== index);
  if (duplicate) throw new Error(`Duplicate lesson ID ${duplicate}`);
  for (const id of options.lessons)
    if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error(`Invalid lesson ID ${id}`);
  return options;
}

async function hashRegisteredFile(baseDirectory, relativePath, expectedHash) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`invalid registered artifact path ${relativePath}`);
  }
  const resolved = path.resolve(baseDirectory, relativePath);
  if (!inside(baseDirectory, resolved))
    throw new Error(`registered artifact escapes its directory: ${relativePath}`);
  const [realBase, realFile, stat] = await Promise.all([
    fs.realpath(baseDirectory),
    fs.realpath(resolved),
    fs.stat(resolved),
  ]);
  if (!inside(realBase, realFile) || !stat.isFile())
    throw new Error(`registered artifact is not a regular in-directory file: ${relativePath}`);
  const actualHash = await hashFile(resolved);
  if (!isSha256(expectedHash) || actualHash !== expectedHash)
    throw new Error(`registered artifact checksum mismatch: ${relativePath}`);
  return { path: resolved, sha256: actualHash };
}

async function verifyArtifactMap(directory, artifactMap, label) {
  if (
    !artifactMap ||
    typeof artifactMap !== 'object' ||
    Array.isArray(artifactMap) ||
    !Object.keys(artifactMap).length
  ) {
    throw new Error(`${label} artifact registry is missing`);
  }
  const verified = new Map();
  for (const [relativePath, expectedHash] of Object.entries(artifactMap)) {
    verified.set(relativePath, await hashRegisteredFile(directory, relativePath, expectedHash));
  }
  return verified;
}

async function toolHash(files) {
  const parts = await Promise.all(
    files.map((file) => fs.readFile(path.join(scriptDirectory, file))),
  );
  return digest(Buffer.concat(parts));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exactSceneIds(timeline) {
  return [
    ...(timeline.intro ? [timeline.intro.id] : []),
    ...timeline.scenes.map((scene) => scene.id),
  ];
}

async function inspectLesson(
  row,
  index,
  inputRoot,
  collectionContext,
  manifestState,
  rubricSha256,
) {
  const id = row.id;
  const sourceDirectory = path.resolve(inputRoot, id);
  const lessonFile = path.join(scriptDirectory, 'lessons', `${id}.lesson.yaml`);
  const animationFile = path.join(scriptDirectory, 'animations', `${id}.mjs`);
  const articleFile = path.resolve(repositoryRoot, 'web/src/content', row.source);
  const lesson = await readLesson(lessonFile, repositoryRoot);
  assert(lesson.id === id, `authored lesson ID is ${lesson.id}`);
  assert(
    lesson.source === row.source,
    `authored source ${lesson.source} differs from collection source ${row.source}`,
  );
  assert(
    !path.isAbsolute(row.source) &&
      inside(path.resolve(repositoryRoot, 'web/src/content'), articleFile),
    'canonical article path escapes content root',
  );

  const [lessonBytes, animationBytes, articleBytes, receiptBytes, timelineBytes] =
    await Promise.all([
      fs.readFile(lessonFile),
      fs.readFile(animationFile),
      fs.readFile(articleFile),
      fs.readFile(path.join(sourceDirectory, 'verification.json')),
      fs.readFile(path.join(sourceDirectory, 'timeline.json')),
    ]);
  const authoredSourceSha256 = {
    animation: digest(animationBytes),
    markup: digest(lessonBytes),
  };
  const receiptSha256 = digest(receiptBytes),
    timelineSha256 = digest(timelineBytes);
  const receipt = JSON.parse(receiptBytes),
    timeline = JSON.parse(timelineBytes);
  const currentArticleSha256 = digest(articleBytes);
  const adapterFile = path.resolve(repositoryRoot, receipt.ttsAdapter?.path ?? '');
  assert(
    receipt.ttsAdapter?.path && inside(repositoryRoot, adapterFile),
    'receipt TTS adapter path is missing or outside repository',
  );
  assert(
    (await hashFile(adapterFile)) === receipt.ttsAdapter.sha256,
    'receipt TTS adapter checksum differs from current adapter',
  );
  const actualFingerprint = await currentSourceFingerprint(repositoryRoot, id, receipt);
  const sourceFingerprint = receipt.fingerprint;
  assert(receipt.id === id, `receipt ID ${receipt.id} differs from selected movie ID`);
  assert(receipt.source === row.source, 'receipt source differs from canonical collection');
  assert(
    receipt.sourceSha256 === currentArticleSha256,
    'article checksum differs from render receipt',
  );
  assert(
    sourceFingerprint === actualFingerprint,
    'render receipt fingerprint differs from current source fingerprint',
  );
  assert(
    receipt.ttsAdapter?.path && receipt.ttsAdapter?.sha256,
    'receipt lacks TTS adapter provenance',
  );
  assert(timeline.id === id, `timeline ID ${timeline.id} differs from selected movie ID`);
  assert(
    timeline.width === 1920 && timeline.height === 1080 && Number.isInteger(timeline.fps),
    'timeline geometry is not native 1920×1080',
  );
  assert(
    timeline.scenes?.length === lesson.scenes.length,
    'timeline scene count differs from current authored lesson',
  );
  const timelineSceneIds = exactSceneIds(timeline);
  assert(
    new Set(timelineSceneIds).size === timelineSceneIds.length,
    'timeline contains duplicate scene IDs',
  );
  assert(
    JSON.stringify(timeline.scenes.map((scene) => scene.id)) ===
      JSON.stringify(lesson.scenes.map((scene) => scene.id)),
    'timeline scene order differs from current authored lesson',
  );
  assert(
    timelineSha256 === receipt.artifactSha256?.['timeline.json'],
    'timeline checksum differs from receipt registry',
  );
  const measured = validateMotionTimeline(lesson, timeline);
  assert(measured.checks.length > 0, 'current authored lesson has no declared motion checks');

  const moviePath = path.join(sourceDirectory, `${id}.mp4`);
  const movieSha256 = await hashFile(moviePath);
  assert(
    isSha256(movieSha256) && receipt.sha256 === movieSha256,
    'actual MP4 checksum differs from render receipt',
  );
  validateMotionReceipt(lesson, timeline, await verifiedClockReceipt(moviePath, receipt, timeline.fps), {
    movieSha256,
    timelineSha256,
    frames: measured.frames,
  });
  assert(
    receipt.artifactSha256?.[`${id}.mp4`] === movieSha256,
    'receipt registry does not bind this exact MP4',
  );
  assert(receipt.fullDecode === 'passed', 'receipt full decode did not pass');
  assert(
    receipt.width === timeline.width && receipt.height === timeline.height,
    'receipt geometry differs from timeline',
  );
  assert(
    receipt.frameAudit?.passed === true && receipt.frameAudit.frames === measured.frames,
    'receipt frame audit does not cover measured timeline',
  );
  assert(
    receipt.labelAudit === 'registered-geometry-every-frame',
    'receipt does not declare registered geometry audit coverage',
  );
  const rootArtifacts = await verifyArtifactMap(
    sourceDirectory,
    receipt.artifactSha256,
    'render receipt',
  );
  assert(
    rootArtifacts.has(`${id}.mp4`) &&
      rootArtifacts.has('timeline.json') &&
      rootArtifacts.has('frame-audit.json'),
    'receipt registry lacks required movie, timeline, or frame-audit artifact',
  );
  const frameAudit = await readJson(path.join(sourceDirectory, 'frame-audit.json'));
  const expectedFrames = measured.frames;
  assert(
    frameAudit.passed === true &&
      frameAudit.frames === expectedFrames &&
      frameAudit.expectedFrames === expectedFrames &&
      frameAudit.issueFrames === 0,
    'registered geometry audit did not pass complete frame coverage',
  );
  assert(
    JSON.stringify(frameAudit.ruleCoverage) === JSON.stringify(LAYOUT_AUDIT_RULES),
    'geometry audit rule coverage is incomplete or stale',
  );
  const expectedFrameScenes = timelineSceneIds.map((scene) => ({
    scene,
    frames:
      scene === timeline.intro?.id
        ? timeline.intro.frames
        : timeline.scenes.find((item) => item.id === scene).frames,
  }));
  assert(
    frameAudit.scenes?.length === expectedFrameScenes.length,
    'geometry audit scene coverage is incomplete',
  );
  for (const [sceneIndex, expected] of expectedFrameScenes.entries()) {
    const audited = frameAudit.scenes[sceneIndex];
    assert(
      audited.scene === expected.scene &&
        audited.frames === expected.frames &&
        audited.passed === true &&
        audited.issueFrames === 0 &&
        JSON.stringify(audited.ruleCoverage) === JSON.stringify(LAYOUT_AUDIT_RULES),
      `geometry audit failed or omitted ${expected.scene}`,
    );
  }

  const [occlusion, textInk, motion, encoded] = await Promise.all([
    readJson(path.join(sourceDirectory, 'aggregate-occlusion.json')),
    readJson(path.join(sourceDirectory, 'text-ink-audit.json')),
    readJson(path.join(sourceDirectory, 'motion-audit.json')),
    readJson(path.join(sourceDirectory, 'encoded-review/verification.json')),
  ]);
  const [occlusionToolSha256, textToolSha256, motionToolSha256, inspectorSha256] =
    await Promise.all([
      toolHash(['audit-occlusion.mjs', 'lib/aggregate-occlusion.mjs']),
      toolHash(['audit-text-ink.mjs', 'lib/text-ink-audit.mjs']),
      toolHash(['audit-motion.mjs', 'lib/motion-audit.mjs']),
      hashFile(path.join(scriptDirectory, 'inspect.mjs')),
    ]);

  assert(
    occlusion.id === id &&
      occlusion.mode === 'all-frames' &&
      occlusion.passed === true &&
      occlusion.frames === expectedFrames &&
      occlusion.expectedFrames === expectedFrames &&
      occlusion.issueFrames === 0 &&
      Array.isArray(occlusion.issues) &&
      occlusion.issues.length === 0 &&
      occlusion.videoSha256 === movieSha256 &&
      occlusion.sourceFingerprint === sourceFingerprint &&
      occlusion.toolSha256 === occlusionToolSha256,
    'aggregate occlusion audit is failed, incomplete, stale, or bound to another movie/source/tool',
  );

  const authorSourceSha256 = digest(Buffer.concat([lessonBytes, animationBytes]));
  assert(
    textInk.version === 1 &&
      textInk.id === id &&
      ['sampled-final', 'all-frames'].includes(textInk.mode) &&
      textInk.timingSource === 'measured-final' &&
      textInk.passed === true &&
      textInk.issueFrames === 0 &&
      textInk.checkedFrames > 0 &&
      textInk.totalFrames === expectedFrames &&
      textInk.width === timeline.width &&
      textInk.height === timeline.height &&
      textInk.fps === timeline.fps &&
      Array.isArray(textInk.issues) &&
      textInk.issues.length === 0 &&
      textInk.videoSha256 === movieSha256 &&
      textInk.sourceFingerprint === sourceFingerprint &&
      textInk.authorSourceSha256 === authorSourceSha256 &&
      textInk.timelineSha256 === timelineSha256 &&
      textInk.receiptSha256 === receiptSha256 &&
      textInk.toolSha256 === textToolSha256,
    'text-ink audit is failed, incomplete, stale, or bound to another movie/source/tool',
  );
  const expectedAuditScenes = timelineSceneIds;
  const textTimings = [...(timeline.intro ? [timeline.intro] : []), ...timeline.scenes];
  assert(
    textInk.scenes?.length === expectedAuditScenes.length &&
      textInk.scenes.every((scene, sceneIndex) => {
        const timing = textTimings[sceneIndex],
          sampleFrames =
            textInk.mode === 'all-frames' ? null : textInkSampleFrames(timing, timeline.fps);
        return (
          scene.scene === expectedAuditScenes[sceneIndex] &&
          scene.totalFrames === timing.frames &&
          scene.checkedFrames === (sampleFrames?.length ?? timing.frames) &&
          scene.issueFrames === 0 &&
          JSON.stringify(scene.sampleFrames) === JSON.stringify(sampleFrames) &&
          Number.isInteger(scene.checkedLabels) &&
          scene.checkedLabels >= 0 &&
          Number.isInteger(scene.skippedLabels) &&
          scene.skippedLabels >= 0
        );
      }) &&
      textInk.scenes.reduce((sum, scene) => sum + scene.checkedFrames, 0) ===
        textInk.checkedFrames &&
      textInk.scenes.reduce((sum, scene) => sum + scene.checkedLabels, 0) ===
        textInk.checkedLabels &&
      textInk.checkedLabels > 0 &&
      textInk.scenes.reduce((sum, scene) => sum + scene.skippedLabels, 0) === textInk.skippedLabels,
    'text-ink audit does not cover every timeline scene',
  );

  assert(
    motion.id === id &&
      motion.mode === 'declared-regions-encoded' &&
      motion.passed === true &&
      Array.isArray(motion.issues) &&
      motion.issues.length === 0 &&
      motion.checks?.length === measured.checks.length &&
      motion.movieSha256 === movieSha256 &&
      motion.videoSha256 === movieSha256 &&
      motion.timelineSha256 === timelineSha256 &&
      motion.receiptSha256 === receiptSha256 &&
      motion.lessonSha256 === authoredSourceSha256.markup &&
      motion.sourceFingerprint === sourceFingerprint &&
      motion.toolSha256 === motionToolSha256 &&
      motion.width === timeline.width &&
      motion.height === timeline.height &&
      motion.fps === timeline.fps &&
      motion.timingSource === 'measured-final',
    'encoded motion audit is failed, incomplete, stale, or bound to another movie/source/tool',
  );
  assert(
    motion.coverage?.narratedBeats === measured.narratedBeats &&
      motion.coverage.declaredChecks === measured.checks.length &&
      motion.coverage.checkedBeats === measured.checks.length &&
      motion.coverage.status === 'declared-subset' &&
      motion.coverage.fraction === measured.checks.length / measured.narratedBeats,
    'encoded motion audit has incomplete declared-beat coverage',
  );
  for (const [checkIndex, expected] of measured.checks.entries()) {
    const actual = motion.checks[checkIndex];
    assert(
      actual.scene === expected.scene &&
        actual.sceneIndex === expected.sceneIndex &&
        actual.beat === expected.beat &&
        JSON.stringify(actual.region) === JSON.stringify(expected.region) &&
        actual.minimumChangedFraction === expected.minimumChangedFraction &&
        JSON.stringify(actual.samples) === JSON.stringify(expected.samples) &&
        actual.passed === true &&
        Array.isArray(actual.pairs) &&
        actual.pairs.length === 3 &&
        actual.pairs.some((pair) => pair.passed === true),
      `encoded motion audit failed or is stale for ${expected.scene}/${expected.beat}`,
    );
  }

  const encodedDirectory = path.join(sourceDirectory, 'encoded-review');
  assert(
    encoded.videoSha256 === movieSha256 && encoded.inspectorSha256 === inspectorSha256,
    'encoded review is bound to another movie or stale inspector',
  );
  const encodedArtifacts = await verifyArtifactMap(
    encodedDirectory,
    encoded.artifactSha256,
    'encoded review',
  );
  const decodedFrameAudit = await readJson(path.join(encodedDirectory, 'decoded-frame-audit.json'));
  assert(
    encodedArtifacts.has('decoded-frame-audit.json') &&
      digest(await fs.readFile(path.join(encodedDirectory, 'decoded-frame-audit.json'))) ===
        encoded.artifactSha256['decoded-frame-audit.json'],
    'encoded decoded-frame audit is not registered',
  );
  assert(
    JSON.stringify(decodedFrameAudit) === JSON.stringify(encoded.decodedFrameAudit),
    'encoded registry summary differs from decoded-frame audit file',
  );
  assert(
    decodedFrameAudit.passed === true &&
      decodedFrameAudit.decodePassed === true &&
      decodedFrameAudit.frames === expectedFrames &&
      decodedFrameAudit.expectedFrames === expectedFrames,
    'encoded decode audit is failed or incomplete',
  );
  assert(
    Array.isArray(encoded.sceneSheets) && encoded.sceneSheets.length === timelineSceneIds.length,
    'encoded scene-sheet registry is incomplete',
  );
  const sceneSheetInventory = [];
  for (const [sceneIndex, scene] of timelineSceneIds.entries()) {
    const sheet = encoded.sceneSheets[sceneIndex];
    const expectedPath = `scenes/${scene}.png`;
    assert(
      sheet?.scene === scene && sheet.image === expectedPath,
      `encoded scene-sheet order or identity differs at ${scene}`,
    );
    const registered = encodedArtifacts.get(expectedPath);
    assert(registered, `encoded scene sheet is missing from artifact registry: ${scene}`);
    const bytes = await fs.readFile(registered.path);
    assert(
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      `scene sheet is not PNG: ${scene}`,
    );
    sceneSheetInventory.push({ scene, path: registered.path, sha256: registered.sha256 });
  }
  assert(
    Array.isArray(encoded.samples) && encoded.samples.length >= 3,
    'encoded review has fewer than three native frame samples',
  );
  const seenFrames = new Set(),
    nativeFrames = [];
  for (const sample of encoded.samples) {
    assert(
      Number.isInteger(sample.frame) &&
        sample.frame >= 0 &&
        sample.frame < expectedFrames &&
        Number.isFinite(sample.time) &&
        Math.abs(sample.time - sample.frame / timeline.fps) <= 1 / timeline.fps &&
        Array.isArray(sample.targets) &&
        sample.targets.length > 0 &&
        sample.targets.every(
          (target) => timelineSceneIds.includes(target.scene) && typeof target.phase === 'string',
        ),
      'encoded sample has invalid frame, time, or scene targets',
    );
    assert(!seenFrames.has(sample.frame), `encoded sample frame ${sample.frame} is duplicated`);
    seenFrames.add(sample.frame);
    const frameScene = timelineSceneIds.find((sceneId) => {
      if (sceneId === timeline.intro?.id) return sample.frame < timeline.intro.frames;
      const timing = timeline.scenes.find((item) => item.id === sceneId);
      const firstFrame = Math.round(timing.start * timeline.fps);
      return sample.frame >= firstFrame && sample.frame < firstFrame + timing.frames;
    });
    assert(
      frameScene && sample.targets.every((target) => target.scene === frameScene),
      `encoded sample frame ${sample.frame} targets ${sample.targets.map((target) => target.scene).join(',')} outside its scene ${frameScene ?? '(unknown)'}`,
    );
    const registered = encodedArtifacts.get(sample.image);
    assert(
      registered && /^frames\/sample-\d+\.png$/.test(sample.image),
      `encoded sample is not a registered native frame: ${sample.image}`,
    );
    const bytes = await fs.readFile(registered.path);
    assert(
      bytes.length >= 33 &&
        bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
        bytes.readUInt32BE(8) === 13 &&
        bytes.toString('ascii', 12, 16) === 'IHDR',
      `native frame is not PNG: ${sample.image}`,
    );
    assert(
      bytes.readUInt32BE(16) === 1920 && bytes.readUInt32BE(20) === 1080,
      `native frame is not 1920x1080: ${sample.image}`,
    );
    const decoded = await loadImage(bytes);
    assert(
      decoded.width === 1920 && decoded.height === 1080,
      `decoded native frame is not 1920x1080: ${sample.image}`,
    );
    nativeFrames.push({
      path: registered.path,
      sha256: registered.sha256,
      frame: sample.frame,
      time: sample.time,
      targets: sample.targets,
    });
  }
  const registeredFrameFiles = [...encodedArtifacts.keys()].filter((file) =>
    /^frames\/sample-\d+\.png$/.test(file),
  );
  assert(
    registeredFrameFiles.length === encoded.samples.length &&
      new Set(encoded.samples.map((sample) => sample.image)).size === encoded.samples.length,
    'encoded sample inventory does not match registered native frame files',
  );

  if (manifestState.error) throw new Error(`input manifest is invalid: ${manifestState.error}`);
  if (manifestState.present) {
    const manifestRow = manifestState.rows.get(id);
    assert(manifestRow, 'input manifest does not contain the exact canonical lesson ID');
    assert(
      manifestRow.id === id &&
        manifestRow.source === row.source &&
        manifestRow.sourceSha256 === currentArticleSha256 &&
        manifestRow.fingerprint === sourceFingerprint &&
        manifestRow.sha256 === movieSha256,
      'input manifest does not bind this exact movie and current source',
    );
  }

  const sceneById = new Map(lesson.scenes.map((scene) => [scene.id, scene]));
  const scenes = timeline.scenes.map((scene) => ({
    id: scene.id,
    title: sceneById.get(scene.id).title,
    beatCount: scene.beats.length,
    sheet: sceneSheetInventory.find((sheet) => sheet.scene === scene.id),
  }));
  const reportHashes = {
    frameAudit: digest(await fs.readFile(path.join(sourceDirectory, 'frame-audit.json'))),
    occlusion: digest(await fs.readFile(path.join(sourceDirectory, 'aggregate-occlusion.json'))),
    textInk: digest(await fs.readFile(path.join(sourceDirectory, 'text-ink-audit.json'))),
    motion: digest(await fs.readFile(path.join(sourceDirectory, 'motion-audit.json'))),
    encodedVerification: digest(
      await fs.readFile(path.join(encodedDirectory, 'verification.json')),
    ),
  };
  return {
    id,
    index,
    group: row.group,
    title: row.title,
    source: row.source,
    sourceDirectory,
    rubric: rubricPath,
    movieSha256,
    sourceFingerprint,
    authoredSourceSha256,
    scenes,
    imageInventory: { sceneSheets: sceneSheetInventory, nativeFrames },
    sourceContext: {
      collection: {
        path: path.relative(repositoryRoot, collectionContext.path),
        id: collectionContext.id,
        version: collectionContext.version,
        canonicalIndex: index,
        sha256: collectionContext.sha256,
      },
      article: { path: articleFile, sha256: currentArticleSha256 },
      authored: {
        lessonYaml: lessonFile,
        animation: animationFile,
        combinedSha256: authorSourceSha256,
      },
      render: {
        directory: sourceDirectory,
        receipt: { path: path.join(sourceDirectory, 'verification.json'), sha256: receiptSha256 },
        timeline: { path: path.join(sourceDirectory, 'timeline.json'), sha256: timelineSha256 },
        artifactCount: rootArtifacts.size,
      },
      audits: Object.fromEntries(
        Object.entries(reportHashes).map(([key, sha256]) => [
          key,
          {
            path:
              key === 'encodedVerification'
                ? path.join(encodedDirectory, 'verification.json')
                : path.join(
                    sourceDirectory,
                    `${key === 'frameAudit' ? 'frame-audit' : key === 'textInk' ? 'text-ink-audit' : key === 'occlusion' ? 'aggregate-occlusion' : 'motion-audit'}.json`,
                  ),
            sha256,
          },
        ]),
      ),
      encodedReview: {
        directory: encodedDirectory,
        registryArtifactCount: encodedArtifacts.size,
        inspectorSha256: encoded.inspectorSha256,
        rubricSha256,
      },
    },
  };
}

async function loadManifest(inputRoot) {
  const file = path.join(inputRoot, 'manifest.json');
  try {
    const value = await readJson(file);
    const rows = Array.isArray(value) ? value : value?.lessons;
    if (!Array.isArray(rows))
      throw new Error('manifest must be an array or contain a lessons array');
    const byId = new Map();
    for (const row of rows) {
      if (!row?.id || byId.has(row.id))
        throw new Error(`manifest has missing or duplicate lesson ID ${row?.id ?? '(missing)'}`);
      byId.set(row.id, row);
    }
    return { present: true, rows: byId };
  } catch (error) {
    if (error.code === 'ENOENT') return { present: false, rows: new Map() };
    return { present: true, rows: new Map(), error: error.message };
  }
}

async function writeJsonAtomic(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temporary, file);
}

export async function generateAssignments(options, { cwd = process.cwd() } = {}) {
  const inputRoot = path.resolve(cwd, options.input);
  const outputRoot = path.resolve(cwd, options.output);
  const collectionFile = path.resolve(cwd, options.collection ?? collectionDefault);
  const collectionBytes = await fs.readFile(collectionFile);
  const collection = JSON.parse(collectionBytes);
  if (
    !collection?.id ||
    !Number.isInteger(collection.version) ||
    !Array.isArray(collection.lessons) ||
    !collection.lessons.length
  ) {
    throw new Error(
      'Canonical collection must include an ID, integer version, and nonempty lesson list',
    );
  }
  const ids = new Set();
  for (const row of collection.lessons) {
    if (!/^[a-z][a-z0-9-]*$/.test(row.id ?? '') || ids.has(row.id))
      throw new Error(`Canonical collection has invalid or duplicate ID ${row.id}`);
    if (
      ![row.group, row.title, row.source].every(
        (value) => typeof value === 'string' && value.trim(),
      )
    ) {
      throw new Error(`Canonical collection row ${row.id} is missing group, title, or source`);
    }
    ids.add(row.id);
  }
  const unknown = options.lessons.filter((id) => !ids.has(id));
  if (unknown.length)
    throw new Error(`Unknown lesson ID${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}`);
  const selected = collection.lessons
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !options.lessons.length || options.lessons.includes(row.id));
  const manifestState = await loadManifest(inputRoot);
  const [rubricBytes, rubricSha256] = await Promise.all([
    fs.readFile(path.join(repositoryRoot, rubricPath)),
    hashFile(path.join(repositoryRoot, rubricPath)),
  ]);
  JSON.parse(rubricBytes);
  const collectionContext = {
    path: collectionFile,
    id: collection.id,
    version: collection.version,
    sha256: digest(collectionBytes),
  };
  const ready = [],
    pending = [];
  for (const { row, index } of selected) {
    try {
      ready.push(
        await inspectLesson(row, index, inputRoot, collectionContext, manifestState, rubricSha256),
      );
    } catch (error) {
      pending.push({ id: row.id, index, issues: [error.message] });
    }
  }
  if (pending.length && !options.readyOnly) {
    const details = pending.map((item) => `${item.id}: ${item.issues.join('; ')}`).join('\n');
    throw new Error(
      `Refusing to write assignments because selected lessons are incomplete or stale:\n${details}`,
    );
  }
  const status = ready.length === 0 ? 'waiting' : pending.length ? 'partial' : 'ready';
  const rotation = options.rotation % options.shards;
  const byShard = Array.from({ length: options.shards }, () => []);
  for (const lesson of ready) byShard[(lesson.index + rotation) % options.shards].push(lesson);
  const shared = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status,
    rubric: rubricPath,
    rubricSha256,
    collection: {
      id: collection.id,
      version: collection.version,
      path: path.relative(repositoryRoot, collectionFile),
      sha256: collectionContext.sha256,
    },
    inputDirectory: inputRoot,
    shardCount: options.shards,
    rotation,
    readyIds: ready.map((lesson) => lesson.id),
    pendingIds: pending.map((item) => item.id),
    pending,
    lessons: ready,
  };
  const outputs = [{ file: path.join(outputRoot, 'assignment.json'), value: shared }];
  for (const [shard, lessons] of byShard.entries())
    outputs.push({
      file: path.join(outputRoot, `assignment-${shard}.json`),
      value: { ...shared, shard, reviewer: `codex-reviewer-shard-${shard + 1}`, lessons },
    });
  for (const output of outputs) await writeJsonAtomic(output.file, output.value);
  return {
    status,
    selected: selected.length,
    ready: ready.length,
    pending: pending.length,
    readyIds: shared.readyIds,
    pendingIds: shared.pendingIds,
    outputDirectory: outputRoot,
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = await generateAssignments(options);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
