#!/usr/bin/env node
import { courseNarrator } from './lib/course-speech.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readLesson } from './lib/lesson.mjs';
import { validateVisualCues, resolveSceneCues } from './lib/narration-cues.mjs';
import { cueVisibilityCoverage } from './lib/narration-cue-audit.mjs';
import { renderEngineProvenance } from './lib/render-engine.mjs';
import { LAYOUT_AUDIT_RULES } from './lib/frame-audit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
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

export function preflightProblems(report, row, expected) {
  const issues = [];
  if (!report.allFrames || report.toolSha256 !== expected.toolSha256)
    issues.push('Missing full-frame coverage or current audit tool binding');
  if (
    row.baseline?.timelinePath !== expected.baseline?.timelinePath ||
    row.baseline?.timelineSha256 !== expected.baseline?.timelineSha256 ||
    row.baseline?.receiptPath !== expected.baseline?.receiptPath ||
    row.baseline?.receiptSha256 !== expected.baseline?.receiptSha256
  ) {
    issues.push('Measured baseline timeline or receipt changed');
  }
  if (JSON.stringify(report.renderEngine) !== JSON.stringify(expected.renderEngine))
    issues.push('Vizmatic engine changed');
  if (
    Object.entries(expected.frameworkSha256).some(
      ([file, sha]) => report.frameworkSha256?.[file] !== sha,
    )
  )
    issues.push('Shared framework changed');
  if (
    row.animationSha256 !== expected.animationSha256 ||
    row.markupSha256 !== expected.markupSha256
  )
    issues.push('Authored source changed');
  if (!row.passed || row.issues?.length) issues.push('Source audit did not pass');
  if (
    row.beats !== expected.beats ||
    row.cuedBeats !== expected.beats ||
    row.cues !== expected.cues
  )
    issues.push('Incomplete narration cue coverage');
  if (
    row.scenes?.length !== expected.scenes.length ||
    new Set(row.scenes?.map((scene) => scene.id)).size !== expected.scenes.length
  )
    issues.push('Incomplete scene coverage');
  for (const scene of expected.scenes) {
    const actual = row.scenes?.find((item) => item.id === scene.id),
      full = actual?.allFrameAudit;
    if (
      !full?.passed ||
      full.frames !== scene.frames ||
      full.fps !== scene.fps ||
      full.issueFrames !== 0 ||
      full.issues?.length ||
      LAYOUT_AUDIT_RULES.some((rule) => !full.ruleCoverage?.includes(rule))
    )
      issues.push(`${scene.id}: incomplete or failed frame audit`);
    const visibility = actual?.allFrameTargetVisibility;
    if (
      !visibility ||
      visibility.issueFrames !== 0 ||
      Object.entries(scene.targetVisibility).some(([key, value]) => visibility[key] !== value)
    )
      issues.push(`${scene.id}: incomplete or failed target visibility audit`);
    if (
      !actual?.cues ||
      actual.cues !== scene.cues ||
      actual.beats !== scene.beats ||
      actual.cuedBeats !== scene.beats ||
      actual.frames?.length !== scene.cues * 3 ||
      actual.issues?.length ||
      actual.frames?.some((frame) => frame.issues?.length)
    )
      issues.push(`${scene.id}: incomplete or failed phrase samples`);
  }
  return issues;
}

async function main(args) {
  const options = {
    reports: [],
    selection: 'build/video-visual-teaching-delivery-20261023/selection.json',
  };
  const flags = {
    '--assignment': 'assignment',
    '--report': 'reports',
    '--output': 'output',
    '--selection': 'selection',
  };
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--help') {
      console.log(
        'node videos/verify-narration-preflight.mjs --assignment FILE --report FILE ... --output FILE [--selection FILE]',
      );
      return;
    }
    const key = flags[args[index]],
      value = args[++index];
    if (!key || !value || value.startsWith('--'))
      throw new Error('Invalid preflight verification arguments');
    if (key === 'reports') options.reports.push(value);
    else options[key] = value;
  }
  if (!options.assignment || !options.output || !options.reports.length)
    throw new Error('--assignment, --report and --output are required');
  const read = (file) => fs.readFile(path.resolve(root, file));
  const hash = async (file) => digest(await read(file));
  const assignmentFile = path.resolve(root, options.assignment),
    selectionFile = path.resolve(root, options.selection);
  const assignmentBytes = await fs.readFile(assignmentFile),
    selectionBytes = await fs.readFile(selectionFile);
  const assignment = JSON.parse(assignmentBytes),
    selection = JSON.parse(selectionBytes);
  if (
    !assignment.lessons?.length ||
    new Set(assignment.lessons.map((row) => row.id)).size !== assignment.lessons.length
  )
    throw new Error('Assignment IDs must be nonempty and unique');
  const toolSha256 = await hash('videos/audit-narration-cues.mjs'),
    preflightToolSha256 = await hash(fileURLToPath(import.meta.url));
  const renderEngine = renderEngineProvenance();
  const frameworkSha256 = Object.fromEntries(
    await Promise.all(frameworkFiles.map(async (file) => [file, await hash('videos/' + file)])),
  );
  const reports = await Promise.all(
    options.reports.map(async (file) => {
      const bytes = await read(file);
      return { file, sha256: digest(bytes), report: JSON.parse(bytes) };
    }),
  );
  const lessons = [],
    sourceBindings = [],
    baselineBindings = [],
    reportBindings = [],
    contactImageBindings = [];
  for (const item of reports) reportBindings.push({ file: item.file, sha256: item.sha256 });
  for (const { id } of assignment.lessons) {
    const markup = `videos/lessons/${id}.lesson.yaml`,
      animation = `videos/animations/${id}.mjs`;
    const sourceBinding = {
      id,
      animation,
      animationSha256: await hash(animation),
      markup,
      markupSha256: await hash(markup),
    };
    sourceBindings.push(sourceBinding);
    const original = selection.lessons.find((row) => row.id === id);
    if (!original) throw new Error(`${id}: missing measured baseline`);
    const timelineFile = path.resolve(root, original.sourceDirectory, 'timeline.json');
    const receiptFile = path.resolve(root, original.sourceDirectory, 'verification.json');
    const timelineBytes = await fs.readFile(timelineFile),
      receiptBytes = await fs.readFile(receiptFile);
    const timeline = JSON.parse(timelineBytes),
      receipt = JSON.parse(receiptBytes);
    if (digest(timelineBytes) !== receipt.artifactSha256['timeline.json'])
      throw new Error(`${id}: baseline timing changed`);
    const baseline = {
      timelinePath: path.relative(root, timelineFile),
      timelineSha256: digest(timelineBytes),
      receiptPath: path.relative(root, receiptFile),
      receiptSha256: digest(receiptBytes),
    };
    baselineBindings.push({ id, ...baseline, timelineFile, receiptFile, timeline });
  }
  for (const { id } of assignment.lessons) {
    const sourceBinding = sourceBindings.find((item) => item.id === id);
    const lesson = await readLesson(path.resolve(root, sourceBinding.markup), root);
    const baselineBinding = baselineBindings.find((item) => item.id === id);
    const { timelinePath, timelineSha256, receiptPath, receiptSha256, timeline } = baselineBinding;
    const baseline = { timelinePath, timelineSha256, receiptPath, receiptSha256 };
    if (courseNarrator.voice !== timeline.voice || courseNarrator.rate !== timeline.rate)
      throw new Error(`${id}: narration voice or rate changed`);
    const scenes = lesson.scenes.map((scene) => {
      const timing = timeline.scenes.find((row) => row.id === scene.id);
      if (
        !timing ||
        timing.beats.length !== scene.beats.length ||
        scene.beats.some(
          (beat, index) =>
            beat.say !== timing.beats[index].say ||
            (beat.hold ?? 0.45) !== (timing.beats[index].hold ?? 0.45),
        )
      )
        throw new Error(`${id}/${scene.id}: narration changed`);
      return {
        id: scene.id,
        frames: timing.frames,
        fps: timing.fps,
        beats: scene.beats.length,
        cues: validateVisualCues(scene).length,
        targetVisibility: cueVisibilityCoverage(
          resolveSceneCues(scene, timing),
          timing.frames,
          timing.fps,
        ),
      };
    });
    const expected = {
      animationSha256: sourceBinding.animationSha256,
      markupSha256: sourceBinding.markupSha256,
      baseline,
      scenes,
      beats: scenes.reduce((n, scene) => n + scene.beats, 0),
      cues: scenes.reduce((n, scene) => n + scene.cues, 0),
      frameworkSha256,
      renderEngine,
      toolSha256,
    };
    const candidates = reports.flatMap((item) =>
      (item.report.lessons ?? [])
        .filter((row) => row.id === id)
        .map((row) => ({ ...item, row, issues: preflightProblems(item.report, row, expected) })),
    );
    const candidate = candidates.find((item) => !item.issues.length);
    if (candidate) {
      for (const scene of candidate.row.scenes) {
        if (!scene.sheet?.path || (await hash(scene.sheet.path)) !== scene.sheet.sha256)
          throw new Error(`${id}/${scene.id}: sampled contact image changed`);
        contactImageBindings.push({ path: scene.sheet.path, sha256: scene.sheet.sha256 });
      }
    }
    lessons.push({
      id,
      passed: Boolean(candidate),
      animationSha256: expected.animationSha256,
      markupSha256: expected.markupSha256,
      baseline,
      ...(candidate
        ? {
            evidence: { path: candidate.file, sha256: candidate.sha256 },
            frames: scenes.reduce((n, scene) => n + scene.frames, 0),
            cues: expected.cues,
            beats: expected.beats,
          }
        : {
            issues: candidates.length
              ? candidates.map((item) => ({ report: item.file, issues: item.issues }))
              : ['No full-frame preflight report'],
          }),
    });
  }
  const result = {
    generatedAt: new Date().toISOString(),
    passed: lessons.every((row) => row.passed),
    scope:
      'Current source, measured timeline and receipt, and engine bindings; complete narration cue coverage; every lesson frame checked for geometry and later-paint glyph occlusion; narrated target presence, in-frame bounds, and recorded-alpha threshold checks after the bounded onset allowance; aggregate counts and failing frames; and checksum-bound sampled contact images. This does not assess aesthetics, readability, or encoded-video quality.',
    toolSha256,
    preflightToolSha256,
    renderEngine,
    frameworkSha256,
    lessons,
  };
  const stable =
    (await hash('videos/audit-narration-cues.mjs')) === toolSha256 &&
    (await hash(fileURLToPath(import.meta.url))) === preflightToolSha256 &&
    (await hash(assignmentFile)) === digest(assignmentBytes) &&
    (await hash(selectionFile)) === digest(selectionBytes) &&
    JSON.stringify(renderEngineProvenance()) === JSON.stringify(renderEngine) &&
    !(
      await Promise.all(
        frameworkFiles.map(
          async (file) => (await hash('videos/' + file)) === frameworkSha256[file],
        ),
      )
    ).some((matches) => !matches) &&
    !(
      await Promise.all(
        sourceBindings.map(
          async (binding) =>
            (await hash(binding.markup)) === binding.markupSha256 &&
            (await hash(binding.animation)) === binding.animationSha256,
        ),
      )
    ).some((matches) => !matches) &&
    !(
      await Promise.all(
        baselineBindings.map(
          async (binding) =>
            (await hash(binding.timelineFile)) === binding.timelineSha256 &&
            (await hash(binding.receiptFile)) === binding.receiptSha256,
        ),
      )
    ).some((matches) => !matches) &&
    !(
      await Promise.all(
        reportBindings.map(async (binding) => (await hash(binding.file)) === binding.sha256),
      )
    ).some((matches) => !matches) &&
    !(
      await Promise.all(
        contactImageBindings.map(async (binding) => (await hash(binding.path)) === binding.sha256),
      )
    ).some((matches) => !matches);
  if (!stable) throw new Error('Preflight inputs changed during verification');
  await fs.mkdir(path.dirname(path.resolve(root, options.output)), { recursive: true });
  await fs.writeFile(path.resolve(root, options.output), JSON.stringify(result, null, 2) + '\n');
  console.log(
    JSON.stringify({
      passed: result.passed,
      total: lessons.length,
      checked: lessons.filter((row) => row.passed).length,
      missing: lessons.filter((row) => !row.passed).map((row) => row.id),
    }),
  );
  if (!result.passed) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url)
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
