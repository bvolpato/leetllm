#!/usr/bin/env node
import { registerLessonFonts } from './lib/fonts.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { readLesson, frameState } from './lib/lesson.mjs';
import { resolveSceneCues, validateVisualCues } from './lib/narration-cues.mjs';
import {
  cueTargetIssues,
  narratedTargetsAtTime,
  CUE_ONSET_GRACE_SECONDS,
  CUE_ONSET_GRACE_FRACTION,
} from './lib/narration-cue-audit.mjs';
import { drawFrame } from './lib/scene.mjs';
import { FrameAudit, layoutIssues } from './lib/frame-audit.mjs';
import { aggregateOcclusion } from './lib/aggregate-occlusion.mjs';
import { lexicalTokens } from './lib/captions.mjs';
import { renderEngineProvenance } from './lib/render-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2),
  option = (flag, fallback) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback);
if (args.includes('--help')) {
  console.log(
    'node videos/audit-narration-cues.mjs --assignment FILE [--selection build/video-visual-teaching-delivery-20261023/selection.json] [--output DIR] [--lesson ID] [--all-frames]',
  );
  process.exit(0);
}
const assignment = option('--assignment');
if (!assignment) throw new Error('--assignment is required');
const output = path.resolve(
  root,
  option('--output', 'build/video-narration-direction-20261025/cue-audit'),
);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const hashFile = async (file) => digest(await fs.readFile(file));
const selectionFile = path.resolve(
  root,
  option('--selection', 'build/video-visual-teaching-delivery-20261023/selection.json'),
);
const assignmentFile = path.resolve(root, assignment);
const selectionBytes = await fs.readFile(selectionFile),
  assignmentBytes = await fs.readFile(assignmentFile);
const selection = JSON.parse(selectionBytes.toString('utf8'));
const entries = JSON.parse(assignmentBytes.toString('utf8')).lessons.filter(
  (row) => !option('--lesson') || row.id === option('--lesson'),
);
const toolSha256 = await hashFile(fileURLToPath(import.meta.url));
const frameworkFiles = [
  'lib/scene.mjs',
  'lib/lesson.mjs',
  'lib/narration-cues.mjs',
  'lib/narration-cue-audit.mjs',
  'lib/captions.mjs',
  'lib/frame-audit.mjs',
  'lib/label-collisions.mjs',
  'lib/aggregate-occlusion.mjs',
  'lib/render-engine.mjs',
];
const frameworkSha256 = Object.fromEntries(
  await Promise.all(
    frameworkFiles.map(async (file) => [file, await hashFile(path.join(root, 'videos', file))]),
  ),
);
const renderEngine = renderEngineProvenance();
registerLessonFonts();

await fs.mkdir(output, { recursive: true });
const sourceBindings = [],
  baselineBindings = [];
for (const entry of entries) {
  const file = `videos/lessons/${entry.id}.lesson.yaml`,
    module = `videos/animations/${entry.id}.mjs`;
  sourceBindings.push({
    id: entry.id,
    file,
    module,
    markup: await hashFile(path.resolve(root, file)),
    animation: await hashFile(path.resolve(root, module)),
  });
  const baseline = selection.lessons.find((item) => item.id === entry.id);
  if (!baseline) throw new Error(`${entry.id}: missing measured baseline`);
  const dir = path.resolve(root, baseline.sourceDirectory),
    timelineFile = path.join(dir, 'timeline.json'),
    receiptFile = path.join(dir, 'verification.json');
  const timelineBytes = await fs.readFile(timelineFile),
    receiptBytes = await fs.readFile(receiptFile);
  const receipt = JSON.parse(receiptBytes.toString('utf8'));
  if (digest(timelineBytes) !== receipt.artifactSha256['timeline.json'])
    throw new Error(`${entry.id}: measured baseline timeline hash differs`);
  baselineBindings.push({
    id: entry.id,
    timelineFile,
    receiptFile,
    timelineBytes,
    receiptBytes,
    timelinePath: path.relative(root, timelineFile),
    timelineSha256: digest(timelineBytes),
    receiptPath: path.relative(root, receiptFile),
    receiptSha256: digest(receiptBytes),
  });
}
const results = [];
for (const entry of entries) {
  const row = { id: entry.id, passed: false, scenes: [], issues: [] };
  try {
    const sourceBinding = sourceBindings.find((item) => item.id === entry.id),
      file = sourceBinding.file,
      module = sourceBinding.module;
    const sourceHashes = { markup: sourceBinding.markup, animation: sourceBinding.animation };
    const lesson = await readLesson(path.resolve(root, file), root);
    const baselineBinding = baselineBindings.find((item) => item.id === entry.id);
    row.baseline = {
      timelinePath: baselineBinding.timelinePath,
      timelineSha256: baselineBinding.timelineSha256,
      receiptPath: baselineBinding.receiptPath,
      receiptSha256: baselineBinding.receiptSha256,
    };
    const timelineBytes = baselineBinding.timelineBytes;
    const original = JSON.parse(timelineBytes),
      { draw, validateModel } = await import(pathToFileURL(path.resolve(root, module)));
    if (validateModel) validateModel();
    const folder = path.join(output, lesson.id);
    await fs.mkdir(folder, { recursive: true });
    const canvas = createCanvas(1920, 1080);
    for (const [sceneIndex, scene] of lesson.scenes.entries()) {
      const previous = original.scenes.find((item) => item.id === scene.id);
      if (
        !previous ||
        previous.beats.length !== scene.beats.length ||
        scene.beats.some(
          (beat, i) =>
            beat.say !== previous.beats[i].say ||
            (beat.hold ?? 0.45) !== (previous.beats[i].hold ?? 0.45),
        )
      ) {
        throw new Error(
          `${scene.id}: narration changed; prepare new measured audio before this audit`,
        );
      }
      const cues = resolveSceneCues(scene, previous),
        timing = { ...previous, visualCues: cues, cueTiming: 'provider-words' };
      const sceneRow = {
        id: scene.id,
        beats: scene.beats.length,
        cuedBeats: new Set(cues.map((cue) => cue.beat)).size,
        cues: cues.length,
        frames: [],
        issues: [],
      };
      const sheet = createCanvas(960, Math.max(200, cues.length * 200)),
        sheetCtx = sheet.getContext('2d');
      sheetCtx.fillStyle = '#0a1020';
      sheetCtx.fillRect(0, 0, sheet.width, sheet.height);
      for (const [index, cue] of cues.entries()) {
        const times = [
          Math.min(cue.start + 0.08, (cue.start + cue.end) / 2),
          (cue.start + cue.end) / 2,
          cue.end - Math.min(0.04, (cue.end - cue.start) / 4),
        ];
        for (const [sample, time] of times.entries()) {
          const audit = drawFrame(
            canvas.getContext('2d'),
            lesson,
            scene,
            frameState(timing, time, sceneIndex, lesson.scenes.length),
            draw,
          );
          const problems = layoutIssues(audit);
          const targetParts = audit.targets.filter((part) => cue.targets.includes(part.id));
          problems.push(...cueTargetIssues(audit, cue, { checkOpacity: sample > 0 }));
          const textOnlyFocus =
            targetParts.length > 0 &&
            targetParts.every(
              (part) =>
                !part.markCounts.shapes &&
                !part.markCounts.connectors &&
                !part.markCounts.paths &&
                !part.markCounts.math,
            );
          const longLabels = audit.labels
            .filter(
              (label) =>
                label.alpha > 0.1 && label.kind === 'text' && lexicalTokens(label.text).length > 12,
            )
            .map((label) => ({ text: label.text, words: lexicalTokens(label.text).length }));
          const image = `${scene.id}-${cue.id}-${sample}.png`;
          if (sample === 1 || problems.length)
            await fs.writeFile(path.join(folder, image), await canvas.encode('png'));
          const frame = {
            cue: cue.id,
            time,
            phrase: cue.phrase,
            targetParts,
            textOnlyFocus,
            longLabels,
            issues: problems,
            ...(sample === 1 || problems.length
              ? { image: path.relative(root, path.join(folder, image)) }
              : {}),
          };
          sceneRow.frames.push(frame);
          if (problems.length) sceneRow.issues.push({ cue: cue.id, time, issues: problems });
          sheetCtx.drawImage(canvas, sample * 320, index * 200, 320, 180);
          sheetCtx.fillStyle = '#e9efff';
          sheetCtx.font = '12px "Lesson Sans"';
          sheetCtx.fillText(
            `${cue.id} · ${time.toFixed(3)}s`,
            sample * 320 + 6,
            index * 200 + 195,
            308,
          );
        }
      }
      const sheetFile = path.join(folder, scene.id + '-cues.png');
      await fs.writeFile(sheetFile, await sheet.encode('png'));
      sceneRow.sheet = { path: path.relative(root, sheetFile), sha256: await hashFile(sheetFile) };
      if (args.includes('--all-frames')) {
        const frames = new FrameAudit(scene.id, timing.fps);
        const visibility = {
          onsetGraceSeconds: CUE_ONSET_GRACE_SECONDS,
          maximumGraceFraction: CUE_ONSET_GRACE_FRACTION,
          checkedFrames: 0,
          checkedCueFrames: 0,
          checkedTargets: 0,
          issueFrames: 0,
        };
        for (let frame = 0; frame < timing.frames; frame++) {
          const time = frame / timing.fps;
          const audit = drawFrame(
            canvas.getContext('2d'),
            lesson,
            scene,
            frameState(timing, time, sceneIndex, lesson.scenes.length),
            draw,
          );
          const targets = narratedTargetsAtTime(audit, cues, time);
          if (targets.checkedCues) visibility.checkedFrames++;
          visibility.checkedCueFrames += targets.checkedCues;
          visibility.checkedTargets += targets.checkedTargets;
          if (targets.issues.length) visibility.issueFrames++;
          const issues = [...layoutIssues(audit), ...aggregateOcclusion(audit), ...targets.issues];
          frames.observe(frame, { ...audit, issues });
        }
        sceneRow.allFrameAudit = frames.finish(timing.frames);
        sceneRow.allFrameTargetVisibility = visibility;
        console.log(
          JSON.stringify({
            id: lesson.id,
            scene: scene.id,
            frames: timing.frames,
            issueFrames: sceneRow.allFrameAudit.issueFrames,
          }),
        );
      }
      row.scenes.push(sceneRow);
    }
    row.animationSha256 = await hashFile(path.resolve(root, module));
    row.markupSha256 = await hashFile(path.resolve(root, file));
    if (row.animationSha256 !== sourceHashes.animation || row.markupSha256 !== sourceHashes.markup)
      throw new Error('Authored source changed during cue audit; rerun after edits finish');
    if (
      JSON.stringify(renderEngineProvenance()) !== JSON.stringify(renderEngine) ||
      (
        await Promise.all(
          frameworkFiles.map(
            async (file) =>
              (await hashFile(path.join(root, 'videos', file))) === frameworkSha256[file],
          ),
        )
      ).some((matches) => !matches)
    ) {
      throw new Error(
        'Shared framework or Vizmatic engine changed during cue audit; rerun against a stable engine',
      );
    }
    row.cues = row.scenes.reduce((n, scene) => n + scene.cues, 0);
    row.cuedBeats = row.scenes.reduce((n, scene) => n + scene.cuedBeats, 0);
    row.beats = row.scenes.reduce((n, scene) => n + scene.beats, 0);
    row.passed =
      row.cues > 0 &&
      row.scenes.every(
        (scene) => !scene.issues.length && (!scene.allFrameAudit || scene.allFrameAudit.passed),
      );
  } catch (error) {
    row.issues.push(error.message);
  }
  results.push(row);
  console.log(
    JSON.stringify({
      id: row.id,
      passed: row.passed,
      cues: row.cues,
      cuedBeats: row.cuedBeats,
      issues: row.issues,
      sceneIssues: row.scenes.reduce((n, scene) => n + scene.issues.length, 0),
    }),
  );
}
const stable =
  (await hashFile(fileURLToPath(import.meta.url))) === toolSha256 &&
  (await hashFile(assignmentFile)) === digest(assignmentBytes) &&
  (await hashFile(selectionFile)) === digest(selectionBytes) &&
  JSON.stringify(renderEngineProvenance()) === JSON.stringify(renderEngine) &&
  !(
    await Promise.all(
      frameworkFiles.map(
        async (file) => (await hashFile(path.join(root, 'videos', file))) === frameworkSha256[file],
      ),
    )
  ).some((matches) => !matches) &&
  !(
    await Promise.all(
      sourceBindings.map(
        async (binding) =>
          (await hashFile(path.resolve(root, binding.file))) === binding.markup &&
          (await hashFile(path.resolve(root, binding.module))) === binding.animation,
      ),
    )
  ).some((matches) => !matches) &&
  !(
    await Promise.all(
      baselineBindings.map(
        async (binding) =>
          (await hashFile(binding.timelineFile)) === binding.timelineSha256 &&
          (await hashFile(binding.receiptFile)) === binding.receiptSha256,
      ),
    )
  ).some((matches) => !matches);
if (!stable)
  throw new Error(
    'Audit inputs changed during cue audit; rerun against stable source, baseline, framework and Vizmatic inputs',
  );
const report = {
  generatedAt: new Date().toISOString(),
  passed: results.every((row) => row.passed),
  scope:
    'Current authored cues resolved against checksum-bound measured provider word timings; three native frames per phrase, layout and text-density diagnostics, and sampled target bounds and recorded paint alpha. Optional all-frame source audits check every measured lesson frame for geometry and later-paint glyph occlusion, plus narrated target presence, in-frame bounds, and the recorded-alpha threshold after a 120 ms onset allowance capped at 20 percent of phrase duration. All-frame target results contain aggregate counts and failing frames. These diagnostics do not assess aesthetics, readability, or encoded-video quality.',
  allFrames: args.includes('--all-frames'),
  inputs: { assignmentSha256: digest(assignmentBytes), selectionSha256: digest(selectionBytes) },
  toolSha256,
  frameworkSha256,
  renderEngine,
  lessons: results,
};
await fs.writeFile(path.join(output, 'review.json'), JSON.stringify(report, null, 2) + '\n');
if (results.some((row) => !row.passed)) process.exitCode = 1;
