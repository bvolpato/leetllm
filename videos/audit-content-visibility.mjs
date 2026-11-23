#!/usr/bin/env node
import { registerLessonFonts } from './lib/fonts.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { readLesson, frameState } from './lib/lesson.mjs';
import { resolveSceneCues } from './lib/narration-cues.mjs';
import { drawFrame } from './lib/scene.mjs';
import { renderEngineProvenance } from './lib/render-engine.mjs';
import { verifyPreparedNarration } from './reuse-narration.mjs';

export const VISIBILITY_RULE = Object.freeze({
  width: 320,
  height: 180,
  nativeWidth: 1920,
  nativeHeight: 1080,
  grayAbove: 48,
  minimumForegroundFraction: 0.001,
  roi: Object.freeze({ left: 100, top: 200, right: 1820, bottom: 985 }),
});
export const SCENE_SAMPLE_SECONDS = Object.freeze([0.5, 0.75, 1, 1.5, 2, 3]);

// Area averaging precedes quantization, so a few bright native pixels cannot
// masquerade as legible downsampled content. Native render frames are opaque.
export function areaDownsampleGrayscale(rgba, width, height, outWidth = 320, outHeight = 180) {
  if (
    ![width, height, outWidth, outHeight].every((n) => Number.isInteger(n) && n > 0) ||
    rgba.length !== width * height * 4
  )
    throw new Error('Invalid RGBA frame dimensions');
  const pixels = new Uint8Array(outWidth * outHeight);
  const sx = width / outWidth,
    sy = height / outHeight;
  const integerScale = Number.isInteger(sx) && Number.isInteger(sy);
  for (let y = 0; y < outHeight; y++)
    for (let x = 0; x < outWidth; x++) {
      const x0 = x * sx,
        x1 = (x + 1) * sx,
        y0 = y * sy,
        y1 = (y + 1) * sy;
      let gray = 0;
      for (let py = Math.floor(y0); py < Math.ceil(y1); py++) {
        const wy = integerScale ? 1 : Math.min(y1, py + 1) - Math.max(y0, py);
        for (let px = Math.floor(x0); px < Math.ceil(x1); px++) {
          const weight = integerScale ? 1 : wy * (Math.min(x1, px + 1) - Math.max(x0, px));
          const i = (py * width + px) * 4;
          gray += (0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]) * weight;
        }
      }
      pixels[y * outWidth + x] = Math.round(gray / (sx * sy));
    }
  return pixels;
}

export function evaluateGrayscaleVisibility(pixels, width = 320, height = 180) {
  if (
    ![width, height].every((n) => Number.isInteger(n) && n > 0) ||
    pixels.length !== width * height
  ) {
    throw new Error('Invalid grayscale frame dimensions');
  }
  const rule = VISIBILITY_RULE;
  const roi = {
    left: Math.floor((width * rule.roi.left) / rule.nativeWidth),
    right: Math.ceil((width * rule.roi.right) / rule.nativeWidth),
    top: Math.floor((height * rule.roi.top) / rule.nativeHeight),
    bottom: Math.ceil((height * rule.roi.bottom) / rule.nativeHeight),
  };
  let foregroundPixels = 0,
    graySum = 0;
  for (let y = roi.top; y < roi.bottom; y++)
    for (let x = roi.left; x < roi.right; x++) {
      const value = pixels[y * width + x];
      graySum += value;
      if (value > rule.grayAbove) foregroundPixels++;
    }
  const contentPixels = (roi.right - roi.left) * (roi.bottom - roi.top);
  // DecodedFrameAudit rounds its stored foreground fraction to six places.
  const foregroundFraction = Number((foregroundPixels / contentPixels).toFixed(6));
  return {
    roi,
    contentPixels,
    foregroundPixels,
    foregroundFraction,
    meanGray: Number((graySum / contentPixels).toFixed(4)),
    belowEncodedThreshold: foregroundFraction < rule.minimumForegroundFraction,
    deficitPercent: Number(
      (100 * Math.max(0, 1 - foregroundFraction / rule.minimumForegroundFraction)).toFixed(2),
    ),
  };
}

export function evaluateContentVisibility(rgba, width = 1920, height = 1080) {
  return evaluateGrayscaleVisibility(areaDownsampleGrayscale(rgba, width, height));
}

export function sceneVisibilitySamples(timing) {
  const fps = timing.fps ?? 30;
  const seen = new Set();
  return SCENE_SAMPLE_SECONDS.flatMap((requestedTime) => {
    const frame = Math.round(requestedTime * fps),
      time = frame / fps;
    // Match the encoded checker's known scene fades, including its exit fade.
    if (time <= 0.45 || timing.duration - time <= 0.35 || frame >= timing.frames || seen.has(frame))
      return [];
    seen.add(frame);
    const knownTransitions = [];
    for (const [beat, interval] of (timing.beats ?? []).entries()) {
      const tolerance = Math.max(0.12, 2 / fps);
      if (Math.abs(time - interval.start) <= tolerance) knownTransitions.push(`beat-${beat}-start`);
      if (Math.abs(time - interval.until) <= tolerance) knownTransitions.push(`beat-${beat}-end`);
    }
    return [{ requestedTime, frame, time, knownTransitions }];
  });
}

export function classifyVisibilitySamples(samples) {
  const candidates = samples.filter((sample) => sample.belowEncodedThreshold);
  // Sparse sampling cannot prove a continuous blank run. Repeated, neighboring
  // non-transition misses warrant stopping for review; isolated misses advise.
  const repeated = samples.some(
    (sample, i) =>
      i > 0 &&
      sample.belowEncodedThreshold &&
      samples[i - 1].belowEncodedThreshold &&
      !sample.knownTransitions.length &&
      !samples[i - 1].knownTransitions.length,
  );
  return {
    status: repeated
      ? 'source-preflight-block'
      : candidates.length
        ? 'review-needed'
        : 'sampled-visible',
    candidateCount: candidates.length,
    worstDeficitPercent: Math.max(0, ...candidates.map((sample) => sample.deficitPercent)),
  };
}

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const hashFile = async (file) => digest(await fs.readFile(file));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function preparedVisibilityBinding(batch, id, timelineBytes) {
  const timeline = verifyPreparedNarration(batch, id, timelineBytes);
  const evidence = batch.lessons.find((lesson) => lesson.id === id).phases.audio.evidence;
  return { timeline, audioPhaseEvidenceSha256: digest(JSON.stringify(evidence)) };
}

async function measuredBaseline(directory, id, allowPrepared) {
  let timelinePath = path.join(directory, 'timeline.json'),
    receiptPath = path.join(directory, 'verification.json');
  try {
    const timelineBytes = await fs.readFile(timelinePath),
      receiptBytes = await fs.readFile(receiptPath);
    const receipt = JSON.parse(receiptBytes);
    if (receipt.id !== id || digest(timelineBytes) !== receipt.artifactSha256?.['timeline.json'])
      throw new Error('Measured timeline differs from verification receipt');
    return {
      timeline: JSON.parse(timelineBytes),
      binding: {
        kind: 'encoded-movie-receipt',
        path: timelinePath,
        sha256: digest(timelineBytes),
        verificationPath: receiptPath,
        verificationSha256: digest(receiptBytes),
      },
    };
  } catch (error) {
    if (error.code !== 'ENOENT' || !allowPrepared) throw error;
    const parent = path.dirname(directory),
      batchRoot = path.basename(parent) === 'previews' ? path.dirname(parent) : parent;
    timelinePath = path.join(batchRoot, 'previews', id, 'timeline.json');
    receiptPath = path.join(batchRoot, 'batch-receipt.json');
    const timelineBytes = await fs.readFile(timelinePath),
      receiptBytes = await fs.readFile(receiptPath);
    const { timeline, audioPhaseEvidenceSha256 } = preparedVisibilityBinding(
      JSON.parse(receiptBytes),
      id,
      timelineBytes,
    );
    return {
      timeline,
      binding: {
        kind: 'completed-audio-phase',
        path: timelinePath,
        sha256: digest(timelineBytes),
        verificationPath: receiptPath,
        verificationSha256AtCapture: digest(receiptBytes),
        audioPhaseEvidenceSha256,
        receiptContainerMayChange: true,
      },
    };
  }
}

async function baselineStillCurrent(row) {
  if ((await hashFile(row.timeline.path)) !== row.timeline.sha256) return false;
  const receiptBytes = await fs.readFile(row.timeline.verificationPath);
  if (row.timeline.kind === 'completed-audio-phase') {
    const binding = preparedVisibilityBinding(
      JSON.parse(receiptBytes),
      row.id,
      await fs.readFile(row.timeline.path),
    );
    if (binding.audioPhaseEvidenceSha256 !== row.timeline.audioPhaseEvidenceSha256) return false;
  } else if (digest(receiptBytes) !== row.timeline.verificationSha256) return false;
  for (const file of row.speechFiles) if ((await hashFile(file.path)) !== file.sha256) return false;
  return true;
}

export async function main(args = process.argv.slice(2)) {
  const option = (flag, fallback) =>
    args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
  if (args.includes('--help')) {
    console.log(
      'node videos/audit-content-visibility.mjs --assignment FILE --selection FILE [--prepared] [--lesson ID ... | --all] --output FILE',
    );
    return 0;
  }
  if (!option('--assignment') || !option('--selection'))
    throw new Error('--assignment and --selection are required');
  const inputPaths = {
    assignment: path.resolve(root, option('--assignment')),
    selection: path.resolve(root, option('--selection')),
  };
  const output = path.resolve(root, option('--output', 'build/qa/content-visibility-sampled.json'));
  const assignmentBytes = await fs.readFile(inputPaths.assignment),
    selectionBytes = await fs.readFile(inputPaths.selection);
  const selection = JSON.parse(selectionBytes),
    requested = args.flatMap((arg, i) => (arg === '--lesson' ? [args[i + 1]] : []));
  const entries = JSON.parse(assignmentBytes).lessons.filter(
    (entry) => !requested.length || requested.includes(entry.id),
  );
  if (!entries.length || requested.some((id) => !entries.some((entry) => entry.id === id)))
    throw new Error('Unknown or empty lesson selection');
  const tool = fileURLToPath(import.meta.url);
  const frameworkFiles = (await fs.readdir(path.join(root, 'videos/lib')))
    .filter((file) => file.endsWith('.mjs'))
    .sort();
  const frameworkHashes = async () =>
    Object.fromEntries(
      await Promise.all(
        frameworkFiles.map(async (file) => [
          file,
          await hashFile(path.join(root, 'videos/lib', file)),
        ]),
      ),
    );
  registerLessonFonts();

  const report = {
    generatedAt: new Date().toISOString(),
    completed: false,
    scope:
      'Sampled current native source renders, using checksum-bound measured narration and freshly resolved current cues. This is a content visibility preflight, not encoded inspection, semantic validation, a readability guarantee, or human approval.',
    limitations: [
      'Only the six early scene sample times are inspected; later or between-sample defects can be missed.',
      'Native RGB area averaging uses BT.601 grayscale weights. Encoding, color-range conversion, and FFmpeg rounding may move borderline pixels across the threshold.',
      'Repeated neighboring non-transition misses block this source preflight pending review; they do not prove a continuous encoded blank run. Isolated or known beat-transition misses are advisories.',
      'Bright content elsewhere inside the content ROI can hide a faint individual target. This diagnostic does not replace target, geometry, motion, or encoded gates.',
    ],
    rule: VISIBILITY_RULE,
    sampleSeconds: SCENE_SAMPLE_SECONDS,
    policy: {
      repeatedNonTransitionMisses: 'source-preflight-block',
      isolatedOrKnownTransitionMiss: 'review-needed',
      legitimateSceneFades: 'excluded',
    },
    tool: { path: path.relative(root, tool), sha256: await hashFile(tool) },
    preparedFallback: args.includes('--prepared'),
    narrationVerifierSha256: await hashFile(path.join(root, 'videos/reuse-narration.mjs')),
    inputs: {
      assignment: { path: inputPaths.assignment, sha256: digest(assignmentBytes) },
      selection: { path: inputPaths.selection, sha256: digest(selectionBytes) },
    },
    frameworkSha256: await frameworkHashes(),
    encodedCheckerSha256: await hashFile(path.join(root, 'videos/inspect.mjs')),
    renderEngine: renderEngineProvenance(),
    fontSha256: Object.fromEntries(
      await Promise.all(fontPaths.map(async ([file]) => [file, await hashFile(file)])),
    ),
    expectedLessons: entries.length,
    lessons: [],
  };
  await fs.mkdir(path.dirname(output), { recursive: true });
  const imageRoot = output.replace(/\.json$/i, '') + '-frames';
  const write = async () => {
    report.updatedAt = new Date().toISOString();
    report.summary = {
      lessons: report.lessons.length,
      scenes: report.lessons.reduce((sum, row) => sum + row.scenes.length, 0),
      samples: report.lessons.reduce(
        (sum, row) => sum + row.scenes.reduce((n, scene) => n + scene.samples.length, 0),
        0,
      ),
      candidates: report.lessons
        .flatMap((row) =>
          row.scenes.flatMap((scene) =>
            scene.samples
              .filter((sample) => sample.belowEncodedThreshold)
              .map((sample) => ({
                id: row.id,
                scene: scene.id,
                time: sample.time,
                foregroundFraction: sample.foregroundFraction,
                deficitPercent: sample.deficitPercent,
                sceneStatus: scene.status,
                captureCurrent: row.captureCurrent,
                image: sample.image,
              })),
          ),
        )
        .sort((a, b) => b.deficitPercent - a.deficitPercent),
      blocked: report.lessons
        .filter((row) => row.captureCurrent && row.status === 'source-preflight-block')
        .map((row) => row.id),
      advisory: report.lessons
        .filter((row) => row.captureCurrent && row.status === 'review-needed')
        .map((row) => row.id),
      needsRerun: report.lessons
        .filter((row) => !row.captureCurrent || row.status === 'needs-rerun')
        .map((row) => row.id),
    };
    const temporary = output + '.tmp';
    await fs.writeFile(temporary, JSON.stringify(report, null, 2) + '\n');
    await fs.rename(temporary, output);
  };
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  for (const entry of entries) {
    const row = {
      id: entry.id,
      status: 'incomplete',
      captureCurrent: false,
      scenes: [],
      issues: [],
    };
    report.lessons.push(row);
    try {
      const sourcePaths = {
        animation: path.resolve(root, entry.animation ?? `videos/animations/${entry.id}.mjs`),
        markup: path.resolve(root, entry.markup ?? `videos/lessons/${entry.id}.lesson.yaml`),
      };
      row.sources = Object.fromEntries(
        await Promise.all(
          Object.entries(sourcePaths).map(async ([name, file]) => [
            name,
            { path: file, sha256: await hashFile(file) },
          ]),
        ),
      );
      const lesson = await readLesson(sourcePaths.markup, root);
      const article = path.resolve(root, 'web/src/content', lesson.source);
      row.sources.article = { path: article, sha256: await hashFile(article) };
      const baseline = selection.lessons.find((item) => item.id === entry.id);
      if (!baseline) throw new Error('Missing measured baseline');
      const directory = path.resolve(root, baseline.sourceDirectory);
      const { timeline, binding } = await measuredBaseline(
        directory,
        entry.id,
        args.includes('--prepared'),
      );
      row.timeline = binding;
      row.speechFiles = [];
      for (const scene of timeline.scenes)
        for (const sound of scene.sounds ?? []) {
          const audio = await fs.readFile(sound.audio),
            boundaries = await fs.readFile(sound.boundaries);
          if (
            digest(audio) !== sound.audioHash ||
            digest(boundaries) !== sound.boundariesHash ||
            JSON.stringify(JSON.parse(boundaries).words) !== JSON.stringify(sound.words)
          )
            throw new Error(
              `${scene.id}/${sound.beatIndex}: measured audio or word-boundary evidence differs`,
            );
          row.speechFiles.push(
            { key: sound.key, kind: 'audio', path: sound.audio, sha256: sound.audioHash },
            {
              key: sound.key,
              kind: 'word-boundaries',
              path: sound.boundaries,
              sha256: sound.boundariesHash,
            },
          );
        }
      if (!row.speechFiles.length)
        throw new Error('Measured timeline has no bound speech evidence');
      const { draw, validateModel } = await import(
        pathToFileURL(sourcePaths.animation).href + '?visibility=' + row.sources.animation.sha256
      );
      if (typeof draw !== 'function') throw new Error('Animation does not export draw');
      if (validateModel) validateModel();
      row.modelValidation = validateModel ? 'passed' : 'not-exported';
      for (const [sceneIndex, scene] of lesson.scenes.entries()) {
        const measured = timeline.scenes.find((item) => item.id === scene.id);
        if (
          !measured ||
          measured.beats.length !== scene.beats.length ||
          scene.beats.some(
            (beat, i) =>
              beat.say !== measured.beats[i].say ||
              (beat.hold ?? 0.45) !== (measured.beats[i].hold ?? 0.45),
          )
        )
          throw new Error(`${scene.id}: narration/hold differs from measured baseline`);
        const timing = {
          ...measured,
          visualCues: resolveSceneCues(scene, measured),
          cueTiming: 'provider-words',
        };
        const sceneRow = {
          id: scene.id,
          duration: timing.duration,
          fps: timing.fps,
          cueTiming: timing.cueTiming,
          resolvedCuesSha256: digest(JSON.stringify(timing.visualCues)),
          samples: [],
        };
        row.scenes.push(sceneRow);
        for (const sample of sceneVisibilitySamples(timing)) {
          const state = frameState(timing, sample.time, sceneIndex, lesson.scenes.length);
          drawFrame(ctx, lesson, scene, state, draw);
          const rgba = ctx.getImageData(0, 0, 1920, 1080).data;
          const result = {
            ...sample,
            globalTime: measured.start + sample.time,
            sceneOpacity: state.opacity,
            ...evaluateContentVisibility(rgba),
            nativeRgbaSha256: digest(rgba),
            actuallyHumanViewed: false,
          };
          if (result.belowEncodedThreshold) {
            const folder = path.join(imageRoot, entry.id);
            await fs.mkdir(folder, { recursive: true });
            const image = path.join(folder, `${scene.id}-${sample.frame}.png`);
            const png = await canvas.encode('png');
            await fs.writeFile(image, png);
            result.image = { path: image, sha256: digest(png) };
          }
          sceneRow.samples.push(result);
        }
        Object.assign(sceneRow, classifyVisibilitySamples(sceneRow.samples));
        if (!sceneRow.samples.length)
          row.issues.push(`${scene.id}: no sample outside known scene fades`);
      }
      row.captureCurrent =
        (
          await Promise.all(
            Object.values(row.sources).map(
              async (source) => (await hashFile(source.path)) === source.sha256,
            ),
          )
        ).every(Boolean) && (await baselineStillCurrent(row));
      if (!row.captureCurrent)
        row.issues.push(
          'Source or measured baseline changed during sampling; rerun this lesson after edits finish',
        );
      row.status = row.scenes.some((scene) => scene.status === 'source-preflight-block')
        ? 'source-preflight-block'
        : row.scenes.some((scene) => scene.status === 'review-needed')
          ? 'review-needed'
          : 'sampled-visible';
      if (row.issues.length) row.status = 'needs-rerun';
    } catch (error) {
      row.issues.push(error.message);
      row.status = 'needs-rerun';
      row.captureCurrent = false;
    }
    console.log(
      JSON.stringify({
        id: row.id,
        status: row.status,
        captureCurrent: row.captureCurrent,
        samples: row.scenes.reduce((n, scene) => n + scene.samples.length, 0),
        candidates: row.scenes.reduce((n, scene) => n + (scene.candidateCount ?? 0), 0),
        issues: row.issues,
      }),
    );
    await write();
  }
  const sharedCurrent =
    (await hashFile(tool)) === report.tool.sha256 &&
    (await hashFile(path.join(root, 'videos/reuse-narration.mjs'))) ===
      report.narrationVerifierSha256 &&
    (await hashFile(path.join(root, 'videos/inspect.mjs'))) === report.encodedCheckerSha256 &&
    JSON.stringify(await frameworkHashes()) === JSON.stringify(report.frameworkSha256) &&
    JSON.stringify(renderEngineProvenance()) === JSON.stringify(report.renderEngine) &&
    (
      await Promise.all(
        Object.entries(report.fontSha256).map(
          async ([file, sha]) => (await hashFile(file)) === sha,
        ),
      )
    ).every(Boolean) &&
    (
      await Promise.all(
        Object.values(report.inputs).map(
          async (input) => (await hashFile(input.path)) === input.sha256,
        ),
      )
    ).every(Boolean);
  report.sharedBindingsCurrent = sharedCurrent;
  // A lesson edited after its own turn must not retain a current-source claim.
  for (const row of report.lessons)
    if (row.captureCurrent) {
      const current =
        sharedCurrent &&
        (
          await Promise.all(
            Object.values(row.sources).map(
              async (source) => (await hashFile(source.path)) === source.sha256,
            ),
          )
        ).every(Boolean) &&
        (await baselineStillCurrent(row));
      if (!current) {
        row.captureCurrent = false;
        row.status = 'needs-rerun';
        row.issues.push(
          'Binding changed before final cross-lesson check; preserved captures are historical',
        );
      }
    }
  report.completed = true;
  await write();
  const exitCode = report.summary.needsRerun.length ? 2 : report.summary.blocked.length ? 1 : 0;
  report.exitCode = exitCode;
  await write();
  console.log(
    JSON.stringify({
      completed: true,
      output,
      lessons: report.summary.lessons,
      samples: report.summary.samples,
      blocked: report.summary.blocked,
      advisory: report.summary.advisory,
      needsRerun: report.summary.needsRerun,
      exitCode,
    }),
  );
  return exitCode;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(error.stack);
      process.exitCode = 2;
    });
}
