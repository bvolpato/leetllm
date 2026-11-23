#!/usr/bin/env node
import { courseNarrator } from './lib/course-speech.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { makeSceneTimeline, readLesson } from './lib/lesson.mjs';
import { resolveSceneCues } from './lib/narration-cues.mjs';
import { timedWordTokens } from './lib/captions.mjs';
import {
  CUE_ONSET_GRACE_SECONDS,
  CUE_ONSET_GRACE_FRACTION,
  cueVisibilityCoverage,
} from './lib/narration-cue-audit.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');
const lessonIdPattern = /^[a-z][a-z0-9-]*$/;
const outputNamePattern = /^[a-z0-9][a-z0-9._-]*$/;
const scheduleToleranceSeconds = 1e-6;
const frameCountTolerance = 0;
const measuredWordPaddingSeconds = 0.2;
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const posixPath = (value) => value.split(path.sep).join('/');

function rootRelative(root, file) {
  return posixPath(path.relative(root, file));
}

async function hashFile(file) {
  return digest(await fs.readFile(file));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateMeasuredTimeline(lesson, timeline) {
  assert(
    timeline && typeof timeline === 'object' && !Array.isArray(timeline),
    'Measured timeline must be a JSON object',
  );
  assert(timeline.id === lesson.id, `${lesson.id}: measured timeline lesson ID differs`);
  assert(timeline.voice === courseNarrator.voice, `${lesson.id}: narration voice changed`);
  assert(timeline.rate === courseNarrator.rate, `${lesson.id}: narration rate changed`);
  assert(Number.isFinite(timeline.fps) && timeline.fps > 0, `${lesson.id}: invalid lesson FPS`);
  assert(
    Array.isArray(timeline.scenes) && timeline.scenes.length === lesson.scenes.length,
    `${lesson.id}: measured scene count differs from authored source`,
  );

  const scenes = [];
  const introDuration = timeline.intro?.duration ?? 0;
  assert(
    Number.isFinite(introDuration) && introDuration >= 0,
    `${lesson.id}: invalid measured intro duration`,
  );
  let lessonCursor = introDuration;
  for (const [sceneIndex, scene] of lesson.scenes.entries()) {
    const measured = timeline.scenes[sceneIndex];
    assert(
      measured?.id === scene.id,
      `${lesson.id}: measured scene order differs at index ${sceneIndex}`,
    );
    assert(
      Number.isInteger(measured.frames) &&
        measured.frames > 0 &&
        Number.isFinite(measured.fps) &&
        measured.fps > 0 &&
        Number.isFinite(measured.duration) &&
        measured.duration > 0,
      `${lesson.id}/${scene.id}: invalid measured frame timing`,
    );
    assert(
      Math.abs(measured.duration - measured.frames / measured.fps) <= scheduleToleranceSeconds,
      `${lesson.id}/${scene.id}: measured duration differs from frame count`,
    );
    assert(
      Number.isFinite(measured.start) &&
        Math.abs(measured.start - lessonCursor) <= scheduleToleranceSeconds,
      `${lesson.id}/${scene.id}: measured scene order or start offset differs`,
    );
    assert(
      measured.fps === timeline.fps,
      `${lesson.id}/${scene.id}: scene FPS differs from lesson timeline`,
    );
    assert(
      Array.isArray(measured.beats) && measured.beats.length === scene.beats.length,
      `${lesson.id}/${scene.id}: measured beat count differs from authored source`,
    );
    assert(
      Array.isArray(measured.sounds),
      `${lesson.id}/${scene.id}: measured speech events are missing`,
    );

    const soundsByBeat = new Map();
    for (const sound of measured.sounds) {
      assert(
        Number.isInteger(sound.beatIndex) &&
          sound.beatIndex >= 0 &&
          sound.beatIndex < scene.beats.length,
        `${lesson.id}/${scene.id}: measured speech has an invalid beat index`,
      );
      assert(
        !soundsByBeat.has(sound.beatIndex),
        `${lesson.id}/${scene.id}: duplicate measured speech for beat ${sound.beatIndex}`,
      );
      assert(
        Number.isFinite(sound.duration) &&
          sound.duration > 0 &&
          Array.isArray(sound.words) &&
          sound.words.length,
        `${lesson.id}/${scene.id}/${sound.beatIndex}: measured speech duration or word events are missing`,
      );
      try {
        timedWordTokens(sound.words, scene.beats[sound.beatIndex].say);
      } catch (error) {
        throw new Error(
          `${lesson.id}/${scene.id}/${sound.beatIndex}: measured words do not match authored narration: ${error.message}`,
        );
      }
      if (
        sound.words.at(-1).end >
        sound.duration + measuredWordPaddingSeconds + scheduleToleranceSeconds
      ) {
        throw new Error(
          `${lesson.id}/${scene.id}/${sound.beatIndex}: measured word timing exceeds audio padding allowance`,
        );
      }
      soundsByBeat.set(sound.beatIndex, sound);
    }
    assert(
      soundsByBeat.size === scene.beats.length,
      `${lesson.id}/${scene.id}: measured speech does not cover every authored beat`,
    );

    const expected = makeSceneTimeline(
      scene,
      scene.beats.map((_, beatIndex) => soundsByBeat.get(beatIndex).duration),
      measured.fps,
    );
    assert(
      Math.abs(measured.frames - expected.frames) <= frameCountTolerance,
      `${lesson.id}/${scene.id}: measured frame count differs from the renderer schedule`,
    );
    assert(
      Math.abs(measured.duration - expected.duration) <= scheduleToleranceSeconds,
      `${lesson.id}/${scene.id}: measured frame window differs from the renderer schedule`,
    );

    for (const [beatIndex, beat] of scene.beats.entries()) {
      const timing = measured.beats[beatIndex];
      if (beat.say !== timing?.say) {
        throw new Error(
          `${lesson.id}/${scene.id}: narration changed; source preview does not match authored script`,
        );
      }
      const expectedHold = beat.hold ?? 0.45;
      const measuredHold = timing.hold ?? 0.45;
      if (expectedHold !== measuredHold) {
        throw new Error(
          `${lesson.id}/${scene.id}: hold changed; source preview does not match authored script`,
        );
      }
      assert(
        [timing.start, timing.end, timing.duration, timing.until].every(Number.isFinite) &&
          timing.start >= 0 &&
          timing.end > timing.start &&
          timing.duration > 0 &&
          timing.until >= timing.end,
        `${lesson.id}/${scene.id}/${beatIndex}: invalid measured beat timing`,
      );
      assert(
        timing.end <= measured.duration + scheduleToleranceSeconds &&
          timing.until <= measured.duration + scheduleToleranceSeconds,
        `${lesson.id}/${scene.id}/${beatIndex}: beat schedule extends outside measured scene frame window`,
      );
      const scheduledBeat = expected.beats[beatIndex],
        sound = soundsByBeat.get(beatIndex);
      for (const field of ['start', 'end', 'duration', 'until']) {
        assert(
          Math.abs(timing[field] - scheduledBeat[field]) <= scheduleToleranceSeconds,
          `${lesson.id}/${scene.id}/${beatIndex}: measured beat cursor differs from the renderer schedule`,
        );
      }
      assert(
        Math.abs(timing.duration - sound.duration) <= scheduleToleranceSeconds,
        `${lesson.id}/${scene.id}/${beatIndex}: measured speech duration differs from its beat schedule`,
      );
    }

    const resolvedCues = resolveSceneCues(scene, measured);
    let spokenCueFrames = 0,
      spokenCueTargets = 0;
    for (const cue of resolvedCues) {
      if (
        cue.start < -scheduleToleranceSeconds ||
        cue.end > measured.duration + scheduleToleranceSeconds
      ) {
        throw new Error(
          `${lesson.id}/${scene.id}/${cue.id}: cue extends outside the measured scene frame window`,
        );
      }
      const beat = measured.beats[cue.beat];
      const spokenCue = {
        ...cue,
        start: Math.max(cue.start, beat.start),
        end: Math.min(cue.end, beat.end),
      };
      if (!(spokenCue.end > spokenCue.start)) {
        throw new Error(
          `${lesson.id}/${scene.id}/${cue.id}: cue has no overlap with measured audio`,
        );
      }
      const coverage = cueVisibilityCoverage([spokenCue], measured.frames, measured.fps);
      if (!coverage.checkedCueFrames || !coverage.checkedTargets) {
        const onset = Math.min(
          CUE_ONSET_GRACE_SECONDS,
          (cue.end - cue.start) * CUE_ONSET_GRACE_FRACTION,
        );
        throw new Error(
          `${lesson.id}/${scene.id}/${cue.id}: cue has no measured spoken frame after the ${onset.toFixed(3)}s onset allowance`,
        );
      }
      spokenCueFrames += coverage.checkedCueFrames;
      spokenCueTargets += coverage.checkedTargets;
    }
    scenes.push({
      id: scene.id,
      frames: measured.frames,
      fps: measured.fps,
      beats: scene.beats.length,
      cues: resolvedCues.length,
      spokenCueFrames,
      spokenCueTargets,
    });
    lessonCursor += measured.duration;
  }
  assert(
    Number.isFinite(timeline.duration) &&
      Math.abs(timeline.duration - lessonCursor) <= scheduleToleranceSeconds,
    `${lesson.id}: measured lesson duration differs from the renderer schedule`,
  );
  return scenes;
}

async function resolveOutputDirectory(root, outputPath) {
  assert(typeof outputPath === 'string' && outputPath.trim(), '--output must name a new directory');
  assert(
    !outputPath.split(/[\\/]+/).includes('..'),
    '--output cannot contain parent-directory segments',
  );
  const buildDirectory = path.join(root, 'build');
  const buildInfo = await fs.lstat(buildDirectory);
  assert(
    buildInfo.isDirectory() && !buildInfo.isSymbolicLink(),
    'build output root must be a real directory',
  );
  const buildRealPath = await fs.realpath(buildDirectory);
  assert(buildRealPath === buildDirectory, 'build output root must not resolve through a symlink');
  const outputDirectory = path.resolve(root, outputPath);
  assert(
    path.dirname(outputDirectory) === buildDirectory &&
      outputNamePattern.test(path.basename(outputDirectory)),
    `--output must be a named direct child of ${buildDirectory}`,
  );
  try {
    await fs.lstat(outputDirectory);
    throw new Error(`Output directory already exists: ${outputDirectory}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return outputDirectory;
}

export async function preparePreviewAudit({
  root = projectRoot,
  lessonId,
  timelinePath,
  outputPath,
}) {
  assert(
    typeof lessonId === 'string' && lessonIdPattern.test(lessonId),
    '--lesson must be a lowercase lesson ID',
  );
  assert(
    typeof timelinePath === 'string' && timelinePath.trim(),
    '--timeline must name a measured timeline.json file',
  );
  const realRoot = await fs.realpath(root);
  const outputDirectory = await resolveOutputDirectory(realRoot, outputPath);
  const sourceTimelinePath = path.resolve(realRoot, timelinePath);
  assert(
    path.basename(sourceTimelinePath) === 'timeline.json',
    '--timeline must point to a file named timeline.json',
  );
  const sourceTimelineInfo = await fs.lstat(sourceTimelinePath);
  assert(
    sourceTimelineInfo.isFile() && !sourceTimelineInfo.isSymbolicLink(),
    '--timeline must be a regular, non-symlink file',
  );

  const markupPath = path.join(realRoot, 'videos/lessons', `${lessonId}.lesson.yaml`);
  const animationPath = path.join(realRoot, 'videos/animations', `${lessonId}.mjs`);
  const validatorPaths = [
    'lib/lesson.mjs',
    'lib/narration-cues.mjs',
    'lib/narration-cue-audit.mjs',
    'lib/captions.mjs',
  ].map((file) => path.join(projectRoot, 'videos', file));
  const [lesson, markupSha256, animationSha256, ...validatorHashes] = await Promise.all([
    readLesson(markupPath, realRoot),
    hashFile(markupPath),
    hashFile(animationPath),
    ...validatorPaths.map(hashFile),
  ]);
  assert(lesson.id === lessonId, `${lessonId}: lesson file ID does not match the requested ID`);

  const timelineBytes = await fs.readFile(sourceTimelinePath);
  let timeline;
  try {
    timeline = JSON.parse(timelineBytes.toString('utf8'));
  } catch (error) {
    throw new Error(`Measured timeline is not valid JSON: ${error.message}`);
  }
  const sceneBindings = validateMeasuredTimeline(lesson, timeline);
  const timelineSha256 = digest(timelineBytes);
  const toolSha256 = await hashFile(scriptPath);
  const sourceDirectory = path.join(outputDirectory, lessonId);
  const sourceDirectoryRef = rootRelative(realRoot, sourceDirectory);
  const sourcePreviewOnly = true;
  const notExportVerification = true;
  const generatedAt = new Date().toISOString();
  const binding = {
    lesson: {
      id: lessonId,
      title: lesson.title,
      markup: rootRelative(realRoot, markupPath),
      markupSha256,
      animation: rootRelative(realRoot, animationPath),
      animationSha256,
    },
    validators: Object.fromEntries(
      validatorPaths.map((file, index) => [rootRelative(realRoot, file), validatorHashes[index]]),
    ),
    preparationTool: { path: rootRelative(realRoot, scriptPath), sha256: toolSha256 },
    measuredTimeline: { path: rootRelative(realRoot, sourceTimelinePath), sha256: timelineSha256 },
    voice: courseNarrator.voice,
    rate: courseNarrator.rate,
  };
  const assignment = {
    schemaVersion: 1,
    sourcePreviewOnly,
    notExportVerification,
    lessons: [{ id: lessonId }],
  };
  const selection = {
    schemaVersion: 1,
    sourcePreviewOnly,
    notExportVerification,
    lessons: [
      {
        id: lessonId,
        title: lesson.title,
        sourceDirectory: sourceDirectoryRef,
        sourcePreviewOnly,
        notExportVerification,
        timelineSha256,
        sourceBinding: binding,
      },
    ],
  };
  const receipt = {
    schemaVersion: 1,
    id: lessonId,
    title: lesson.title,
    sourcePreviewOnly,
    notExportVerification,
    voice: binding.voice,
    rate: binding.rate,
    sourceBinding: binding,
    artifactSha256: { 'timeline.json': timelineSha256 },
  };
  const preparation = {
    schemaVersion: 1,
    generatedAt,
    status: 'ready',
    scope:
      'Measured source-preview timing compatibility for narration-cue review. This bundle does not verify or represent an exported video.',
    sourcePreviewOnly,
    notExportVerification,
    ...binding,
    scenes: sceneBindings,
    scheduleTolerances: {
      seconds: scheduleToleranceSeconds,
      frames: frameCountTolerance,
      measuredWordPaddingSeconds,
      cueOnsetGraceSeconds: CUE_ONSET_GRACE_SECONDS,
      cueOnsetGraceFraction: CUE_ONSET_GRACE_FRACTION,
    },
    outputs: {
      assignment: {
        path: rootRelative(realRoot, path.join(outputDirectory, 'assignment.json')),
        sha256: digest(JSON.stringify(assignment, null, 2) + '\n'),
      },
      selection: {
        path: rootRelative(realRoot, path.join(outputDirectory, 'selection.json')),
        sha256: digest(JSON.stringify(selection, null, 2) + '\n'),
      },
      timeline: {
        path: rootRelative(realRoot, path.join(sourceDirectory, 'timeline.json')),
        sha256: timelineSha256,
      },
      receipt: {
        path: rootRelative(realRoot, path.join(sourceDirectory, 'verification.json')),
        sha256: digest(JSON.stringify(receipt, null, 2) + '\n'),
      },
    },
  };
  const assignmentBytes = Buffer.from(JSON.stringify(assignment, null, 2) + '\n');
  const selectionBytes = Buffer.from(JSON.stringify(selection, null, 2) + '\n');
  const receiptBytes = Buffer.from(JSON.stringify(receipt, null, 2) + '\n');
  const preparationBytes = Buffer.from(JSON.stringify(preparation, null, 2) + '\n');

  let created = false;
  try {
    await fs.mkdir(outputDirectory);
    created = true;
    await fs.mkdir(sourceDirectory);
    await fs.writeFile(path.join(sourceDirectory, 'timeline.json'), timelineBytes, { flag: 'wx' });
    await fs.writeFile(path.join(sourceDirectory, 'verification.json'), receiptBytes, {
      flag: 'wx',
    });
    await fs.writeFile(path.join(outputDirectory, 'assignment.json'), assignmentBytes, {
      flag: 'wx',
    });
    await fs.writeFile(path.join(outputDirectory, 'selection.json'), selectionBytes, {
      flag: 'wx',
    });
    await fs.writeFile(path.join(outputDirectory, 'preparation.json'), preparationBytes, {
      flag: 'wx',
    });

    const stableHashes = await Promise.all([
      hashFile(markupPath),
      hashFile(animationPath),
      ...validatorPaths.map(hashFile),
      hashFile(scriptPath),
      hashFile(sourceTimelinePath),
      hashFile(path.join(sourceDirectory, 'timeline.json')),
      hashFile(path.join(sourceDirectory, 'verification.json')),
      hashFile(path.join(outputDirectory, 'assignment.json')),
      hashFile(path.join(outputDirectory, 'selection.json')),
      hashFile(path.join(outputDirectory, 'preparation.json')),
    ]);
    const expectedHashes = [
      markupSha256,
      animationSha256,
      ...validatorHashes,
      toolSha256,
      timelineSha256,
      timelineSha256,
      digest(receiptBytes),
      digest(assignmentBytes),
      digest(selectionBytes),
      digest(preparationBytes),
    ];
    assert(
      stableHashes.every((hash, index) => hash === expectedHashes[index]),
      'Preparation inputs changed during source-preview audit setup',
    );
  } catch (error) {
    if (created) await fs.rm(outputDirectory, { recursive: true, force: true });
    throw error;
  }
  return { outputDirectory, preparation };
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const key = argv[index];
    if (key === '--help') return null;
    if (!['--lesson', '--timeline', '--output'].includes(key) || options[key]) {
      throw new Error(`Invalid or duplicate argument: ${key}`);
    }
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`${key} requires a value`);
    options[key] = value;
  }
  for (const key of ['--lesson', '--timeline', '--output']) {
    if (!options[key]) throw new Error(`${key} is required`);
  }
  return {
    lessonId: options['--lesson'],
    timelinePath: options['--timeline'],
    outputPath: options['--output'],
  };
}

async function main(argv) {
  const options = parseArguments(argv);
  if (!options) {
    console.log(
      'node videos/prepare-preview-audit.mjs --lesson ID --timeline FILE --output NEW_BUILD_DIRECTORY',
    );
    return;
  }
  const { outputDirectory, preparation } = await preparePreviewAudit(options);
  console.log(
    JSON.stringify({
      status: preparation.status,
      sourcePreviewOnly: true,
      notExportVerification: true,
      outputDirectory: path.relative(projectRoot, outputDirectory),
      timelineSha256: preparation.measuredTimeline.sha256,
    }),
  );
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
