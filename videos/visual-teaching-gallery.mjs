#!/usr/bin/env node
import { verifiedClockReceipt } from './lib/frame-clock.mjs';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { inspectionEvidence } from './batch.mjs';
import { regenerateLessonCaptions } from './regenerate-captions.mjs';
import { conceptSourceFiles } from './lib/concepts.mjs';
import { renderEngineBytes } from './lib/render-engine.mjs';
import { currentSourceFingerprint } from './lib/source-fingerprint.mjs';
import { LAYOUT_AUDIT_RULES } from './lib/frame-audit.mjs';
import { textInkSampleFrames } from './audit-text-ink.mjs';
import { TEXT_INK_RULE, TEXT_INK_SCOPE } from './lib/text-ink-audit.mjs';
import {
  validateMotionTimeline,
  validateMotionReceipt,
  MOTION_SCOPE,
  MOTION_SAMPLE_PROGRESS,
  MOTION_CHANNEL_DELTA,
  MOTION_MINIMUM_PIXELS,
} from './lib/motion-audit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const groups = [
  'foundations',
  'statistics',
  'products',
  'training-agents',
  'inference',
  'advanced',
];
const defaultRenders = [
  'video-visual-teaching-20261023',
  'video-visual-teaching-second-wave-20261023',
  'video-visual-teaching-third-wave-20261023',
  'video-visual-teaching-fourth-wave-20261023',
];
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const shaPattern = /^[a-f0-9]{64}$/;
const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const absolute = (file) => path.resolve(root, file);
const inside = (parent, file) => {
  const relative = path.relative(parent, file);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};
const json = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const optionalJson = async (file) => {
  try {
    return await json(file);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
};
const fileExists = async (file) => {
  try {
    return (await fs.stat(file)).isFile();
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
};

function options(argv) {
  const out = {
    baseline: 'build/video-worldclass-current-20261023',
    coverage: 'build/video-worldclass-review-20261023/coverage.json',
    output: 'build/video-visual-teaching-review-20261023',
    crossReviews: 'build/visual-teaching-cross-review',
    renderRoots: [],
    editorial: [],
    sourceReviews: [],
  };
  const flags = {
    '--baseline': 'baseline',
    '--coverage': 'coverage',
    '--output': 'output',
    '--cross-reviews': 'crossReviews',
    '--render-root': 'renderRoots',
    '--editorial': 'editorial',
    '--source-review': 'sourceReviews',
  };
  for (let i = 0; i < argv.length; i++) {
    if (['--help', '-h'].includes(argv[i])) {
      out.help = true;
      continue;
    }
    const [flag, inline] = argv[i].split(/=(.*)/s, 2),
      key = flags[flag];
    if (!key) throw new Error(`Unknown option: ${flag}`);
    const value = inline ?? argv[++i];
    if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
    if (Array.isArray(out[key])) out[key].push(value);
    else out[key] = value;
  }
  return out;
}

const hashes = new Map();
async function hash(file) {
  const resolved = absolute(file);
  if (!hashes.has(resolved))
    hashes.set(
      resolved,
      (async () => {
        const value = createHash('sha256');
        await pipeline(createReadStream(resolved), value);
        return value.digest('hex');
      })(),
    );
  return hashes.get(resolved);
}

async function verifyMap(directory, map) {
  const entries = Object.entries(map ?? {});
  if (!entries.length) return false;
  for (const [relative, expected] of entries) {
    const file = path.resolve(directory, relative);
    if (!inside(directory, file) || !shaPattern.test(expected) || (await hash(file)) !== expected)
      return false;
  }
  return true;
}

function sourceBindings(row) {
  return {
    animation:
      row.animationSha256 ??
      row.reviewedSourceSha256?.animation ??
      row.sourceValidation?.animationSha256 ??
      row.sourceVerification?.animationSha256 ??
      row.sourceSha256,
    markup:
      row.markupSha256 ??
      row.lessonSha256 ??
      row.reviewedSourceSha256?.markup ??
      row.sourceValidation?.lessonSha256 ??
      row.sourceVerification?.markupSha256,
  };
}

function findingOpen(finding) {
  return !/^(?:resolved|closed|fixed|accepted|withdrawn)(?:\b|[-_])/i.test(
    finding.status ?? 'open',
  );
}

export function mergePlayingFindings(sourceFindings, reviews) {
  const merged = new Map();
  const key = (finding) =>
    JSON.stringify([finding.scene ?? '', finding.issue ?? finding.description ?? '']);
  for (const finding of sourceFindings) merged.set(key(finding), finding);
  for (const review of reviews.filter((row) => row.bound))
    for (const raw of review.findings ?? []) {
      const finding = typeof raw === 'string' ? { issue: raw } : { ...raw };
      if (/resolved.*source.*awaiting.*encode/i.test(finding.status ?? '')) {
        finding.sourceResolutionStatus = finding.status;
        finding.status = 'open-in-playing-movie-source-fix-awaiting-encode';
      }
      Object.assign(finding, {
        reviewer: review.reviewer,
        recordPath: review.recordPath,
        scope: 'playing-movie',
      });
      merged.set(key(finding), finding);
    }
  return [...merged.values()];
}

export function playingEditorialScores(reviews) {
  return [
    ...new Set(
      reviews.filter((row) => row.bound && Number.isFinite(row.score)).map((row) => row.score),
    ),
  ].sort((a, b) => a - b);
}

export function sourceReviewDisplay(review, sourceCurrent, sourceFindings, reviews = []) {
  const hasOpen = mergePlayingFindings(sourceFindings, reviews).some(findingOpen),
    remaining = review?.remainingIssues ?? [];
  return {
    label: !review
      ? 'Review pending'
      : !sourceCurrent
        ? 'Source recheck needed'
        : hasOpen
          ? 'Independent recheck needed'
          : review.sourceReviewStatus === 'accepted-unchanged'
            ? 'Source retained'
            : review.sourceReviewStatus === 'needs-revision' || remaining.length
              ? 'Source needs revision'
              : 'Source revised',
    detail: !review
      ? 'No source review record yet.'
      : !sourceCurrent
        ? 'Reviewed source hashes or scene coverage differ from the current files.'
        : hasOpen
          ? 'Independent findings remain open; source acceptance needs rechecking.'
          : review.sourceReviewStatus === 'accepted-unchanged'
            ? 'Current script and animation match the retained source review.'
            : 'Current source reviewed; exact movie acceptance is separate.',
  };
}

async function sourceFingerprint(id, receipt) {
  if (receipt.sourceManifest !== undefined) return currentSourceFingerprint(root, id, receipt);
  const adapter = absolute(receipt.ttsAdapter?.path ?? 'videos/tts.py');
  if (!inside(root, adapter)) throw new Error('TTS adapter is outside the repository');
  const files = [
    `videos/lessons/${id}.lesson.yaml`,
    `videos/animations/${id}.mjs`,
    'videos/render.mjs',
    ...[
      'lib/scene.mjs',
      'lib/lesson.mjs',
      'lib/narration-cues.mjs',
      'lib/captions.mjs',
      'lib/delivery.mjs',
      'lib/brand.mjs',
      'lib/frame-audit.mjs',
      'lib/layout-review.mjs',
      'assets/leetllm-mark.svg',
      'package-lock.json',
      ...conceptSourceFiles(),
    ].map((file) => `videos/${file}`),
  ];
  return digest(
    Buffer.concat([
      ...(await Promise.all(files.map((file) => fs.readFile(absolute(file))))),
      renderEngineBytes(),
      await fs.readFile(adapter),
    ]),
  );
}

async function storedInspection(directory, id, timeline, receipt, lesson) {
  const expected = validateMotionTimeline(lesson, timeline),
    timelineHash = await hash(path.join(directory, 'timeline.json'));
  const receiptHash = await hash(path.join(directory, 'verification.json')),
    movieHash = await hash(path.join(directory, `${id}.mp4`));
  validateMotionReceipt(lesson, timeline, await verifiedClockReceipt(path.join(directory, `${id}.mp4`), receipt, timeline.fps), {
    movieSha256: movieHash,
    timelineSha256: timelineHash,
    frames: expected.frames,
  });
  const inkFile = path.join(directory, 'text-ink-audit.json'),
    motionFile = path.join(directory, 'motion-audit.json');
  const ink = await json(inkFile),
    motion = await json(motionFile);
  const authorHash = digest(
    Buffer.concat(
      await Promise.all(
        [`videos/lessons/${id}.lesson.yaml`, `videos/animations/${id}.mjs`].map((file) =>
          fs.readFile(absolute(file)),
        ),
      ),
    ),
  );
  const binding = (report) =>
    report.id === id &&
    report.passed === true &&
    Array.isArray(report.issues) &&
    report.issues.length === 0 &&
    report.videoSha256 === movieHash &&
    report.sourceFingerprint === receipt.fingerprint &&
    report.timelineSha256 === timelineHash &&
    report.receiptSha256 === receiptHash &&
    shaPattern.test(report.toolSha256 ?? '') &&
    report.timingSource === 'measured-final' &&
    report.width === timeline.width &&
    report.height === timeline.height &&
    report.fps === timeline.fps;
  if (
    !binding(ink) ||
    ink.version !== 1 ||
    ink.rule !== TEXT_INK_RULE ||
    ink.scope !== TEXT_INK_SCOPE ||
    !['sampled-final', 'all-frames'].includes(ink.mode) ||
    ink.authorSourceSha256 !== authorHash ||
    ink.issueFrames !== 0 ||
    ink.thresholds?.minimumOpacity !== 0.25 ||
    ink.thresholds?.opacityQuantizationTolerance !== 1 / 255 ||
    ink.thresholds?.minimumChannelDelta !== 6 ||
    ink.thresholds?.minimumGlyphPixels !== 3
  )
    throw new Error('Original text audit identity, author, result or threshold binding differs');
  const timings = [...(timeline.intro ? [timeline.intro] : []), ...timeline.scenes];
  if (!Array.isArray(ink.scenes) || ink.scenes.length !== timings.length)
    throw new Error('Original text audit scene coverage differs');
  let frames = 0,
    labels = 0,
    skipped = 0,
    total = 0;
  for (const [index, timing] of timings.entries()) {
    const scene = ink.scenes[index],
      samples = ink.mode === 'all-frames' ? null : textInkSampleFrames(timing, timeline.fps);
    const checked = samples?.length ?? timing.frames;
    if (
      scene.scene !== timing.id ||
      scene.totalFrames !== timing.frames ||
      scene.checkedFrames !== checked ||
      scene.issueFrames !== 0 ||
      JSON.stringify(scene.sampleFrames) !== JSON.stringify(samples) ||
      !Number.isInteger(scene.checkedLabels) ||
      scene.checkedLabels < 0 ||
      !Number.isInteger(scene.skippedLabels) ||
      scene.skippedLabels < 0
    )
      throw new Error('Original text audit sample coverage differs');
    frames += checked;
    labels += scene.checkedLabels;
    skipped += scene.skippedLabels;
    total += timing.frames;
  }
  if (
    frames <= 0 ||
    labels <= 0 ||
    ink.checkedFrames !== frames ||
    ink.totalFrames !== total ||
    total !== expected.frames ||
    ink.checkedLabels !== labels ||
    ink.skippedLabels !== skipped
  )
    throw new Error('Original text audit totals differ');
  const coverage = motion.coverage,
    count = expected.checks.length;
  if (
    !binding(motion) ||
    motion.version !== 1 ||
    motion.mode !== 'declared-regions-encoded' ||
    motion.rule !== 'declared-region-pixel-change' ||
    motion.scope !== MOTION_SCOPE ||
    motion.movieSha256 !== movieHash ||
    motion.lessonSha256 !== (await hash(`videos/lessons/${id}.lesson.yaml`)) ||
    motion.thresholds?.minimumChannelDelta !== MOTION_CHANNEL_DELTA ||
    motion.thresholds?.minimumChangedPixels !== MOTION_MINIMUM_PIXELS ||
    JSON.stringify(motion.sampleProgress) !== JSON.stringify(MOTION_SAMPLE_PROGRESS) ||
    !Array.isArray(motion.checks) ||
    motion.checks.length !== count ||
    coverage?.narratedBeats !== expected.narratedBeats ||
    coverage.declaredChecks !== count ||
    coverage.checkedBeats !== count ||
    coverage.fraction !== (expected.narratedBeats ? count / expected.narratedBeats : 0) ||
    coverage.status !== (count ? 'declared-subset' : 'none')
  )
    throw new Error('Original motion audit declaration or coverage binding differs');
  for (const [index, declaration] of expected.checks.entries()) {
    const check = motion.checks[index],
      pairs = check.pairs;
    if (
      check.scene !== declaration.scene ||
      check.sceneIndex !== declaration.sceneIndex ||
      check.beat !== declaration.beat ||
      JSON.stringify(check.region) !== JSON.stringify(declaration.region) ||
      check.minimumChangedFraction !== declaration.minimumChangedFraction ||
      JSON.stringify(check.samples) !== JSON.stringify(declaration.samples) ||
      !Array.isArray(pairs) ||
      pairs.length !== 3
    )
      throw new Error('Original motion audit sample declaration differs');
    const pixels = declaration.region[2] * declaration.region[3];
    for (const [pairIndex, [from, to]] of [
      [0, 1],
      [1, 2],
      [0, 2],
    ].entries()) {
      const pair = pairs[pairIndex];
      if (
        pair.from !== from ||
        pair.to !== to ||
        !Number.isInteger(pair.changedPixels) ||
        pair.changedPixels < 0 ||
        pair.changedPixels > pixels ||
        pair.regionPixels !== pixels ||
        !Number.isFinite(pair.changedFraction) ||
        Math.abs(pair.changedFraction - pair.changedPixels / pixels) > 1e-12 ||
        pair.passed !==
          (pair.changedPixels >= MOTION_MINIMUM_PIXELS &&
            pair.changedFraction >= declaration.minimumChangedFraction)
      )
        throw new Error('Original motion audit pair result differs');
    }
    if (check.passed !== true || check.passed !== pairs.some((pair) => pair.passed))
      throw new Error('Original declared motion did not pass');
  }
  return {
    textInk: {
      report: await hash(inkFile),
      tool: ink.toolSha256,
      authorSourceSha256: ink.authorSourceSha256,
      frames,
      totalFrames: total,
    },
    motion: {
      report: await hash(motionFile),
      tool: motion.toolSha256,
      declaredChecks: count,
      narratedBeats: expected.narratedBeats,
    },
    toolPolicy:
      'Exact historical report, movie, receipt, timeline, authored-source and sample bindings. Recorded historical tool hashes remain explicit.',
  };
}

export async function checkCandidate(renderRoot, id, source) {
  const directory = path.join(renderRoot, id),
    receiptFile = path.join(directory, 'verification.json');
  const receipt = await optionalJson(receiptFile);
  if (!receipt) return null;
  const original = source.original === true;
  const result = {
    directory,
    receiptFile,
    movie: path.join(directory, `${id}.mp4`),
    receipt,
    original,
    gates: [],
    passed: false,
    errors: [],
    generatedAt: receipt.generatedAt ?? '',
  };
  const check = async (
    name,
    run,
    failureReason = 'Recorded evidence does not satisfy this verification requirement.',
  ) => {
    try {
      const passed = await run();
      result.gates.push({
        name,
        passed: passed === true,
        ...(passed === true ? {} : { reason: failureReason }),
      });
      if (passed !== true) result.errors.push(`${name}: ${failureReason}`);
    } catch (error) {
      result.gates.push({ name, passed: false, reason: error.message });
      result.errors.push(`${name}: ${error.message}`);
    }
  };
  let timeline,
    expectedFrames = 0;
  await check(
    original ? 'Retained authored source binding' : 'Current source',
    async () =>
      receipt.id === id &&
      receipt.source === source.lesson.source &&
      (original
        ? source.originalAuthoredBound
        : receipt.sourceSha256 === (await hash(`web/src/content/${source.lesson.source}`)) &&
          receipt.fingerprint === (await sourceFingerprint(id, receipt)) &&
          receipt.ttsAdapter?.sha256 === (await hash(receipt.ttsAdapter?.path ?? 'videos/tts.py'))),
    original
      ? 'The current authored files are not bound to an accepted retained-source review.'
      : 'The source article, render fingerprint or TTS adapter differs from this export.',
  );
  await check(
    'Movie and delivery hashes',
    async () =>
      receipt.sha256 === (await hash(result.movie)) &&
      receipt.artifactSha256?.[`${id}.mp4`] === receipt.sha256 &&
      (await verifyMap(directory, receipt.artifactSha256)),
  );
  await check('Geometry · every frame', async () => {
    timeline = await json(path.join(directory, 'timeline.json'));
    expectedFrames =
      (timeline.intro?.frames ?? 0) + timeline.scenes.reduce((n, scene) => n + scene.frames, 0);
    const audit = await json(path.join(directory, 'frame-audit.json'));
    return (
      timeline.id === id &&
      timeline.scenes.length === source.lesson.scenes.length &&
      receipt.fullDecode === 'passed' &&
      receipt.width === 1920 &&
      receipt.height === 1080 &&
      timeline.width === receipt.width &&
      timeline.height === receipt.height &&
      receipt.frameAudit?.passed === true &&
      receipt.frameAudit.frames === expectedFrames &&
      audit.passed === true &&
      audit.frames === expectedFrames &&
      audit.expectedFrames === expectedFrames &&
      audit.issueFrames === 0 &&
      (original
        ? Object.keys(audit.ruleCoverage ?? {}).length > 0
        : JSON.stringify(audit.ruleCoverage) === JSON.stringify(LAYOUT_AUDIT_RULES))
    );
  });
  await check('Occlusion · every frame', async () => {
    const audit = await json(path.join(directory, 'aggregate-occlusion.json'));
    const tool = digest(
      Buffer.concat(
        await Promise.all(
          ['videos/audit-occlusion.mjs', 'videos/lib/aggregate-occlusion.mjs'].map((file) =>
            fs.readFile(absolute(file)),
          ),
        ),
      ),
    );
    return (
      expectedFrames > 0 &&
      audit.id === id &&
      audit.mode === 'all-frames' &&
      audit.passed === true &&
      audit.issueFrames === 0 &&
      audit.frames === expectedFrames &&
      audit.expectedFrames === expectedFrames &&
      audit.videoSha256 === receipt.sha256 &&
      audit.sourceFingerprint === receipt.fingerprint &&
      (original ? shaPattern.test(audit.toolSha256 ?? '') : audit.toolSha256 === tool)
    );
  });
  await check('Encoded decode and images', async () => {
    const directoryEncoded = path.join(directory, 'encoded-review'),
      encoded = await json(path.join(directoryEncoded, 'verification.json'));
    const audit = await json(path.join(directoryEncoded, 'decoded-frame-audit.json'));
    const metrics = await json(path.join(directoryEncoded, 'decoded-frame-metrics.json'));
    const needed = [
      'index.html',
      'decoded-frame-audit.json',
      'decoded-frame-metrics.json',
      'contact-sheet.png',
    ];
    return (
      expectedFrames > 0 &&
      encoded.videoSha256 === receipt.sha256 &&
      needed.every((name) => encoded.artifactSha256?.[name]) &&
      encoded.decodedFrameAudit?.passed === true &&
      encoded.decodedFrameAudit?.decodePassed === true &&
      encoded.decodedFrameAudit.frames === expectedFrames &&
      audit.passed === true &&
      audit.decodePassed === true &&
      audit.frames === expectedFrames &&
      audit.expectedFrames === expectedFrames &&
      metrics.length === expectedFrames &&
      (await verifyMap(directoryEncoded, encoded.artifactSha256))
    );
  });
  let inspection = null,
    inspectionError;
  try {
    inspection = original
      ? await storedInspection(directory, id, timeline, receipt, source.lesson)
      : await inspectionEvidence(renderRoot, id);
  } catch (error) {
    inspectionError = error.message;
    result.errors.push(`Inspection binding: ${inspectionError}`);
  }
  result.gates.push({
    name: `Text ink and exact bindings${inspection?.textInk?.frames ? ` · ${inspection.textInk.frames} sampled states` : ''}`,
    passed: Boolean(inspection?.textInk),
    ...(inspectionError ? { reason: inspectionError } : {}),
  });
  result.gates.push({
    name: `Declared motion and exact bindings${inspection?.motion ? ` · ${inspection.motion.declaredChecks}/${inspection.motion.narratedBeats} beats` : ''}`,
    passed: Boolean(inspection?.motion),
    ...(inspectionError ? { reason: inspectionError } : {}),
  });
  await check('Paragraph captions and bindings', async () => {
    const captionRoot = path.dirname(await fs.realpath(directory));
    return (await regenerateLessonCaptions({ input: captionRoot, id, check: true })).upToDate;
  });
  result.inspection = inspection;
  result.passed = result.gates.every((gate) => gate.passed);
  result.timeline = timeline;
  return result;
}

async function editorialReview(
  records,
  candidate,
  sceneIds,
  { original = false, currentHashes } = {},
) {
  const reviews = [];
  for (const record of records) {
    const issues = [];
    if (
      !shaPattern.test(record.movieSha256 ?? '') ||
      !shaPattern.test(record.sourceFingerprint ?? '') ||
      record.movieSha256 !== candidate.receipt.sha256 ||
      record.sourceFingerprint !== candidate.receipt.fingerprint
    )
      issues.push('Movie or source binding differs');
    if (
      !Array.isArray(record.reviewedScenes) ||
      !sceneIds.every((id) => record.reviewedScenes.includes(id))
    )
      issues.push('Scene review incomplete');
    if (!Array.isArray(record.viewedImages) || !record.viewedImages.length)
      issues.push('Viewed image evidence missing');
    const encoded = await optionalJson(
      path.join(candidate.directory, 'encoded-review', 'verification.json'),
    );
    let encodedRoot;
    try {
      encodedRoot = await fs.realpath(path.join(candidate.directory, 'encoded-review'));
    } catch {
      issues.push('Encoded review directory missing');
    }
    for (const image of record.viewedImages ?? []) {
      if (typeof image.path !== 'string' || path.extname(image.path).toLowerCase() !== '.png') {
        issues.push('Viewed image must be a PNG frame or sheet');
        continue;
      }
      try {
        const file = await fs.realpath(absolute(image.path)),
          relative = encodedRoot
            ? path.relative(encodedRoot, file).split(path.sep).join('/')
            : null;
        if (
          !encodedRoot ||
          !inside(encodedRoot, file) ||
          encoded?.artifactSha256?.[relative] !== image.sha256 ||
          !shaPattern.test(image.sha256) ||
          (await hash(file)) !== image.sha256 ||
          !(await fs.readFile(file))
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        )
          issues.push('Viewed image is stale or unbound');
      } catch {
        issues.push('Viewed image missing');
      }
    }
    const score =
      Number.isFinite(record.overallScore) && record.overallScore >= 0 && record.overallScore <= 100
        ? record.overallScore
        : null;
    const dimensions = record.dimensionScores;
    const dimensionsValid =
      dimensions &&
      [
        ['correctness', 25],
        ['teaching', 20],
        ['clarity', 20],
        ['animation', 15],
        ['narration', 15],
        ['production', 5],
      ].every(
        ([key, maximum]) =>
          Number.isFinite(dimensions[key]) && dimensions[key] >= 0 && dimensions[key] <= maximum,
      );
    if (
      dimensions &&
      (!dimensionsValid ||
        (score !== null && Object.values(dimensions).reduce((n, value) => n + value, 0) !== score))
    )
      issues.push('Score dimensions do not reconcile');
    const bound = issues.length === 0;
    const supporting = [];
    for (const image of record.additionalViewedImages ?? []) {
      if (
        typeof image.path !== 'string' ||
        path.extname(image.path).toLowerCase() !== '.png' ||
        !shaPattern.test(image.sha256 ?? '')
      )
        continue;
      try {
        const file = await fs.realpath(absolute(image.path));
        if (
          inside(root, file) &&
          (await hash(file)) === image.sha256 &&
          (await fs.readFile(file))
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        )
          supporting.push(image);
      } catch {
        /* Supplementary views do not replace registered encoded-image evidence. */
      }
    }
    const authoredSourceBound =
      !original ||
      (record.authoredSourceSha256?.animation === currentHashes?.animation &&
        record.authoredSourceSha256?.markup === currentHashes?.markup);
    const approved =
      bound &&
      candidate.passed &&
      record.readyForYoutube === true &&
      Array.isArray(record.blockers) &&
      record.blockers.length === 0 &&
      Array.isArray(record.findings) &&
      !record.findings.some(findingOpen) &&
      score !== null &&
      score >= 95 &&
      dimensionsValid &&
      dimensions.clarity >= 18 &&
      dimensions.animation >= 13 &&
      authoredSourceBound;
    reviews.push({
      reviewer: record.reviewer,
      recordPath: record.recordPath,
      bound,
      authoredSourceBound,
      approved,
      readyForYoutube: record.readyForYoutube,
      blockers: record.blockers ?? null,
      score: bound ? score : null,
      issues,
      dimensions: bound ? dimensions : null,
      findings: bound ? (record.findings ?? []) : [],
      deductions: bound ? (record.deductions ?? []) : [],
      reviewLimits: record.reviewLimits ?? [],
      additionalViewedImages: bound ? supporting : [],
    });
  }
  return reviews;
}

function htmlPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LeetLLM · Visual teaching review</title><link rel="icon" href="data:,"><link rel="stylesheet" href="gallery.css"></head><body>
<header class="masthead"><a class="wordmark" href="#">Leet<span>LLM</span></a><span class="local-label">LOCAL REVIEW</span></header>
<main><div class="intro"><p class="eyebrow">THE VISUAL TEACHING COLLECTION</p><h1>Review the visual lessons.</h1><p>Review every lesson, follow the revisions and compare the exports. Source review, technical verification and final editorial approval have separate states.</p></div>
<div id="summary" class="summary" aria-label="Collection review counts"></div>
<section class="workspace" aria-label="Video reviewer"><div class="viewer"><div class="player-top"><span id="playing-kind" class="badge"></span><span id="playing-number"></span></div><video id="player" controls playsinline preload="metadata" aria-label="Selected lesson video"></video><div class="viewer-body"><p id="selected-group" class="eyebrow"></p><h2 id="selected-title"></h2><p id="selected-state"></p><div id="downloads" class="downloads"></div><details><summary>Review, evidence and provenance</summary><div id="lesson-detail"></div></details></div></div><aside class="review-context"><p class="eyebrow">WHAT THE LABELS MEAN</p><h2>Evidence before approval.</h2><p><strong>Source revised</strong> means the script or animation changed. Its encoded movie can still be pending.</p><p><strong>Verified updated export</strong> means the current source, movie, frame audits and captions agree. It is ready for your review.</p><p><strong>Approved final media</strong> requires a separate editorial review bound to the exact movie and viewed frames.</p><p>Older scores are labeled <strong>previous</strong>. The new rubric targets 95/100; targets never replace an observed score.</p><p><a href="scores.csv" download>Download score table (CSV)</a> · <a href="scores.md">Table</a> · <a href="rubric.json">Scoring rubric</a></p><a href="review-data.json">Download the full review data</a><p id="generated" class="fine"></p></aside></section>
<section class="library" aria-label="All lesson reviews"><div class="library-heading"><div><p class="eyebrow">ALL LESSONS</p><h2>Choose a lesson to review.</h2></div><div class="view-switch" aria-label="Layout"><button id="table-view" aria-pressed="true">Table</button><button id="card-view" aria-pressed="false">Cards</button></div></div><div class="toolbar"><nav id="filters" aria-label="Lesson filters"><button data-filter="all" aria-pressed="true">All</button><button data-filter="updated" aria-pressed="false">Updated</button><button data-filter="needs-work" aria-pressed="false">Needs work</button><button data-filter="retained" aria-pressed="false">Retained</button></nav><label class="search-label"><span>Find a topic</span><input id="search" type="search" placeholder="Search lessons, groups or findings" autocomplete="off"></label></div><p id="result-count" aria-live="polite"></p><div id="lesson-list"></div><p id="empty" hidden>No lessons match this view.</p></section>
<footer>Local review collection. Regenerate this gallery after source edits, new renders or editorial decisions. Original exports remain available for comparison.</footer></main><script src="gallery.js" defer></script></body></html>`;
}

const css = `.score-dimensions{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin:14px 0}.score-dimensions>div{display:flex;justify-content:space-between;gap:10px;border:1px solid var(--line);border-radius:8px;padding:8px 10px}.score-dimensions dt{font-size:13px}.score-dimensions dd{margin:0;font-weight:700;white-space:nowrap}:root{color-scheme:light;--ink:#19312c;--muted:#5c6c66;--line:#d8dfd8;--green:#18775c;--paper:#f6f7f1;--white:#fff;--amber:#8b570a;--red:#a23e3c}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 system-ui,sans-serif}a{color:var(--green);text-underline-offset:3px;overflow-wrap:anywhere}button,input{font:inherit}button{cursor:pointer}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #48aa88;outline-offset:3px}.masthead{max-width:1480px;margin:auto;padding:25px 36px;display:flex;align-items:center;gap:18px;border-bottom:1px solid var(--line)}.wordmark{font-size:25px;letter-spacing:-1px;font-weight:850;color:var(--ink);text-decoration:none}.wordmark span{color:var(--green)}.local-label,.eyebrow{font-size:11px;letter-spacing:.14em;font-weight:750;color:var(--muted)}.local-label{border-left:1px solid var(--line);padding-left:18px}main{max-width:1480px;padding:0 36px;margin:auto}.intro{max-width:850px;padding:32px 0 16px}.intro h1{font-size:clamp(32px,3.8vw,46px);line-height:1.1;letter-spacing:-.045em;margin:12px 0 20px}.intro p:last-child{max-width:740px;color:var(--muted);font-size:16px}.summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:0 0 34px}.summary>div{background:#edf1e8;border:1px solid var(--line);border-radius:12px;padding:16px 19px}.summary strong{display:block;font-size:29px;line-height:1.2}.summary span{color:var(--muted);font-size:13px}.workspace{display:grid;grid-template-columns:minmax(0,2.6fr) minmax(240px,1fr);gap:28px;align-items:start}.viewer{min-width:0;background:var(--white);border:1px solid var(--line);border-radius:15px;overflow:hidden;box-shadow:0 12px 30px #21372a08}.player-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 16px;font-size:12px;color:var(--muted)}video{display:block;width:100%;height:auto;aspect-ratio:16/9;background:#0a1020;object-fit:contain}.viewer-body{padding:20px 24px}.viewer-body h2{font-size:25px;line-height:1.25;margin:8px 0 10px;letter-spacing:-.02em}.viewer-body>p:not(.eyebrow){color:var(--muted);font-size:14px}.badge{display:inline-flex;border:1px solid #c7d7cc;background:#eaf3ec;color:#226045;border-radius:20px;padding:3px 9px;font-size:11px;font-weight:700;line-height:1.45;white-space:normal}.badge.pending{color:var(--amber);background:#fff4df;border-color:#edd8b1}.badge.issue{color:var(--red);background:#fff0ec;border-color:#e8c5bd}.badge.quiet{color:var(--muted);background:#f0f2ee;border-color:var(--line)}.downloads{display:flex;flex-wrap:wrap;gap:8px;margin:19px 0}.downloads a{border:1px solid var(--line);border-radius:7px;padding:6px 10px;font-size:12px;text-decoration:none;background:#fafbf7}.review-context{padding:12px 2px}.review-context h2{font-size:25px;line-height:1.2;letter-spacing:-.02em}.review-context p{font-size:14px;color:var(--muted)}.review-context strong{color:var(--ink)}.fine{font-size:11px!important;color:var(--muted)}details{border-top:1px solid var(--line);padding-top:12px;margin-top:16px;min-width:0}summary{cursor:pointer;font-size:13px;font-weight:650}.detail-section{margin:18px 0}.detail-section h3{font-size:14px;margin:0 0 7px}.detail-section p,.detail-section li{font-size:13px;color:var(--muted)}.detail-section ul{padding-left:20px}.gate-list{list-style:none;padding:0!important;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.gate-list li{padding:7px 8px;background:#f3f5ef;border-radius:6px;font-size:12px}.gate-list .failed{background:#fff3e4;color:var(--amber)}.hashes{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;background:#f3f5ef;padding:12px;border-radius:7px;font:11px/1.6 ui-monospace,monospace;max-width:100%}.library{margin-top:52px}.library-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}.library h2{font-size:28px;margin:6px 0 22px;letter-spacing:-.025em}.toolbar{display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap}.toolbar nav,.view-switch{display:flex;gap:4px;flex-wrap:wrap}.toolbar button,.view-switch button{border:1px solid var(--line);border-radius:7px;background:transparent;color:var(--muted);padding:8px 13px;font-size:13px}.toolbar button[aria-pressed=true],.view-switch button[aria-pressed=true]{background:var(--ink);border-color:var(--ink);color:white}.search-label{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:12px}.search-label input{width:280px;max-width:100%;border:1px solid var(--line);border-radius:8px;background:white;padding:9px 12px;font-size:13px;color:var(--ink)}#result-count{font-size:12px;color:var(--muted);margin:18px 0 12px}.lesson-table{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;background:white;border:1px solid var(--line);border-radius:12px;overflow:hidden}.lesson-table th{text-align:left;background:#edf1e8;color:var(--muted);font-size:11px;letter-spacing:.03em;padding:12px}.lesson-table td{padding:15px 12px;vertical-align:top;border-top:1px solid #e5e9e2;font-size:12px;overflow-wrap:anywhere}.lesson-table th:nth-child(1){width:32%}.lesson-table th:nth-child(2){width:22%}.lesson-table th:nth-child(3){width:23%}.lesson-table th:nth-child(4){width:14%}.lesson-table th:nth-child(5){width:9%}.lesson-title{border:0;background:none;padding:0;color:var(--ink);font-weight:720;text-align:left;font-size:14px;line-height:1.35}.lesson-title:hover{color:var(--green);text-decoration:underline}.lesson-group{display:block;font-size:11px;color:var(--muted);margin:5px 0}.cell-note{display:block;color:var(--muted);font-size:11px;margin-top:6px}.open-button{border:1px solid var(--line);border-radius:7px;padding:7px 10px;background:#f8faf5;font-size:12px;color:var(--green)}tr.selected{background:#f1f7ed}.lesson-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.lesson-card{background:white;border:1px solid var(--line);border-radius:12px;padding:18px;min-width:0}.lesson-card.selected{border-color:var(--green);box-shadow:0 0 0 1px var(--green)}.lesson-card .lesson-title{font-size:17px;min-height:46px}.card-status{display:flex;flex-wrap:wrap;gap:6px;margin:15px 0}.card-note{font-size:12px;color:var(--muted)}.lesson-card .open-button{margin-top:12px}footer{padding:35px 0;color:var(--muted);font-size:12px}#empty{padding:30px;background:white;border:1px solid var(--line);border-radius:10px}@media(max-width:1000px){.workspace{grid-template-columns:minmax(0,1fr)}.review-context{display:none}.lesson-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.lesson-table th:nth-child(4){width:15%}.lesson-table th:nth-child(5){width:10%}.lesson-table th:nth-child(1){width:30%}}@media(max-width:620px){.masthead{padding:18px 18px}main{padding:0 16px}.intro{padding-top:32px}.intro p:last-child{font-size:16px}.summary{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:23px}.summary>div{padding:12px}.summary strong{font-size:25px}.summary span{font-size:11px}.viewer-body{padding:16px}.viewer-body h2{font-size:21px}.library{margin-top:34px}.library h2{font-size:23px}.library-heading{align-items:flex-start}.view-switch{margin-top:22px}.view-switch button{padding:5px 8px;font-size:11px}.toolbar{gap:12px}.toolbar nav{width:100%}.toolbar button{padding:7px 9px;font-size:12px}.search-label{width:100%;display:block}.search-label>span{display:none}.search-label input{width:100%}.lesson-table,.lesson-table tbody,.lesson-table tr,.lesson-table td{display:block;width:100%}.lesson-table thead{display:none}.lesson-table{background:transparent;border:0;overflow:visible}.lesson-table tr{background:white;border:1px solid var(--line);border-radius:10px;margin-bottom:10px;padding:13px}.lesson-table td{border:0;padding:4px 0}.lesson-table td[data-label]:before{content:attr(data-label)' ';font-size:11px;font-weight:700;color:var(--muted);margin-right:7px}.lesson-table td:last-child{padding-top:9px}.lesson-table tr.selected{background:#f1f7ed}.lesson-title{font-size:15px}.lesson-group{margin:4px 0}.cell-note{display:inline;margin-left:6px}.lesson-cards{grid-template-columns:minmax(0,1fr)}.gate-list{grid-template-columns:minmax(0,1fr)}.local-label{font-size:10px}.downloads{gap:6px}.downloads a{font-size:11px}.player-top{font-size:10px;padding:9px 11px}}`;

const browserScript = `const E=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let data,selected,filter='all',layout='table';const badge=(text,kind='quiet')=>'<span class="badge '+kind+'">'+esc(text)+'</span>';const duration=n=>Math.floor(n/60)+'m '+Math.round(n%60)+'s';const link=(url,label,download=false)=>url?'<a href="'+esc(url)+'"'+(download?' download':'')+'>'+esc(label)+'</a>':'';function shown(){const q=E('#search').value.trim().toLowerCase();return data.lessons.filter(r=>(filter==='all'||filter==='updated'&&r.updated||filter==='needs-work'&&r.needsWork||filter==='retained'&&r.retained)&&(!q||r.search.includes(q)))}function sourceBadge(r){return badge(r.source.label,r.source.current&&!r.openFindings.length?'':r.needsWork?'issue':'pending')}function mediaBadge(r){return badge(r.approved?'Approved final media':r.updatedMovie?'Verified updated export':r.updated?'Export pending':'Original export',r.approved?'':r.updatedMovie?'pending':'quiet')}function scores(r){return r.editorialScores.length?'Fresh review'+(r.editorialScores.length>1?'s':'')+': '+r.editorialScores.map(s=>s+'/100').join(' · '):r.previousScores.length?'Previous: '+r.previousScores.map(s=>s.label+' '+s.score).join(' · '):'Fresh score pending'}function renderList(){const rows=shown();E('#result-count').textContent=rows.length+' of '+data.lessons.length+' lessons · '+(filter==='all'?'all review states':filter.replace('-',' '));E('#empty').hidden=rows.length>0;E('#lesson-list').className=layout==='cards'?'lesson-cards':'';E('#lesson-list').innerHTML=layout==='cards'?rows.map(r=>'<article class="lesson-card '+(selected===r.id?'selected':'')+'" data-id="'+r.id+'"><span class="lesson-group">'+esc(r.group)+' · '+duration(r.duration)+'</span><button class="lesson-title" data-open="'+r.id+'">'+esc(r.title)+'</button><div class="card-status">'+sourceBadge(r)+mediaBadge(r)+'</div><p class="card-note">'+esc(r.openFindings.length?r.openFindings.length+' independent finding(s) need recheck':r.source.current?'Source evidence matches the current files':'Source review needs current bindings')+'</p><p class="card-note">'+esc(scores(r))+'</p><button class="open-button" data-open="'+r.id+'">Review lesson</button></article>').join(''):'<table class="lesson-table"><thead><tr><th>Lesson</th><th>Source review</th><th>Media / independent review</th><th>Editorial scores</th><th>Player</th></tr></thead><tbody>'+rows.map(r=>'<tr data-id="'+r.id+'" class="'+(selected===r.id?'selected':'')+'"><td><button class="lesson-title" data-open="'+r.id+'">'+esc(r.title)+'</button><span class="lesson-group">'+esc(r.group)+' · '+duration(r.duration)+'</span></td><td data-label="Source">'+sourceBadge(r)+'<span class="cell-note">'+esc(r.source.detail)+'</span></td><td data-label="Media">'+mediaBadge(r)+'<span class="cell-note">'+esc(r.openFindings.length?r.openFindings.length+' independent finding(s) need recheck':r.updatedMovie?'Editorial review '+(r.approved?'approved':'pending'):r.renderNote)+'</span></td><td data-label="Scores">'+esc(scores(r))+'</td><td><button class="open-button" data-open="'+r.id+'">Open</button></td></tr>').join('')+'</tbody></table>'}function editorialDetails(r){const dimensions=[['correctness','Correctness',25],['teaching','Teaching',20],['clarity','Clarity',20],['animation','Animation',15],['narration','Narration',15],['production','Production',5]];return r.editorialReviews.filter(review=>review.bound).map(review=>'<div class="detail-section editorial-detail"><h3>Editorial review · '+esc(review.score)+'/100</h3><dl class="score-dimensions">'+dimensions.map(([key,label,max])=>'<div><dt>'+label+'</dt><dd>'+esc(Number.isFinite(review.dimensions?.[key])?review.dimensions[key]:'pending')+'/'+max+'</dd></div>').join('')+'</dl>'+((review.deductions??[]).length?'<p><strong>Where points were deducted</strong></p><ul>'+review.deductions.map(item=>'<li>'+esc(typeof item==='string'?item:(item.dimension?item.dimension+': ':'')+(item.reason??item.rationale??item.description??''))+'</li>').join('')+'</ul>':'')+'<p class="fine">Editorial judgment uses the reviewed scripts, scene sheets and selected native cue frames. Full-stream technical and audio checks are recorded separately.</p></div>').join('')}function details(r){let out='<div class="detail-section"><h3>Source review</h3><p>'+esc(r.source.detail)+'</p>'+(r.source.rationale?'<p>'+esc(r.source.rationale)+'</p>':'')+'<ul>'+r.changes.map(x=>'<li><strong>'+esc(x.scene??'Lesson')+':</strong> '+esc(x.description??x)+'</li>').join('')+'</ul></div>';if(r.remainingIssues.length)out+='<div class="detail-section"><h3>Remaining source issues</h3><ul>'+r.remainingIssues.map(issue=>'<li>'+esc(typeof issue==='string'?issue:issue.issue??issue.description??JSON.stringify(issue))+'</li>').join('')+'</ul></div>';if(r.findings.length)out+='<div class="detail-section"><h3>Independent findings</h3><ul>'+r.findings.map(f=>'<li><strong>'+esc(f.scene??'Lesson')+' · '+esc(f.status??'open')+'</strong><br>'+esc(f.issue??f.description??'')+(f.resolution?'<br>Resolution: '+esc(f.resolution):'')+((f.acceptanceRationale??f.adjudication)?'<br>Review decision: '+esc(f.acceptanceRationale??f.adjudication):'')+(f.proposedRemedy||f.remedy||f.fix?'<br>Remedy: '+esc(f.proposedRemedy??f.remedy??f.fix):'')+'</li>').join('')+'</ul></div>';out+=editorialDetails(r);out+='<div class="detail-section"><h3>'+esc(r.technical?'Playing export checks · '+r.technical.kind:'Updated export checks')+'</h3>'+((r.technical??r.candidate)?'<ul class="gate-list">'+(r.technical??r.candidate).gates.map(g=>'<li class="'+(g.passed?'':'failed')+'">'+(g.passed?'Passed: ':'Pending / failed: ')+esc(g.name)+(g.reason?'<br>'+esc(g.reason):'')+'</li>').join('')+'</ul>':'<p>No replacement delivery receipt is available yet.</p>')+'</div>';out+='<div class="detail-section"><h3>Scripts and evidence</h3><ul>'+r.links.map(x=>'<li>'+link(x.url,x.label)+'</li>').join('')+'</ul></div>';out+='<div class="detail-section"><h3>Exact provenance</h3><pre class="hashes">'+esc(JSON.stringify(r.provenance,null,2))+'</pre></div>';return out}function select(id,scroll=false){const r=data.lessons.find(x=>x.id===id);if(!r)return;selected=id;history.replaceState(null,'','#'+id);const p=E('#player');p.pause();p.removeAttribute('src');p.innerHTML='';p.poster=r.primary.poster??'';if(r.primary.movie){p.src=r.primary.movie;if(r.primary.vtt){const track=document.createElement('track');track.kind='captions';track.label='English';track.srclang='en';track.src=r.primary.vtt;p.append(track)}}p.load();E('#playing-kind').className='badge '+(r.approved?'':r.updatedMovie?'pending':'quiet');E('#playing-kind').textContent=r.approved?'Approved final media · '+(r.updatedMovie?'updated':'retained')+' export':r.updatedMovie?'Updated export · editorial review pending':'Original export · comparison copy';E('#playing-number').textContent='Lesson '+r.order+' / '+data.lessons.length;E('#selected-group').textContent=r.group;E('#selected-title').textContent=r.title;E('#selected-state').textContent=r.openFindings.length?'Independent findings still need rechecking. '+r.source.detail:r.approved?'Exact playing export approved against the current rubric.':r.updatedMovie?r.approved?'Exact export approved against the current rubric.':'Technical checks pass. Please review the explanation, visuals and narration before approval.':r.sourceRevised?'The source has changed. The original export stays playable while the replacement is pending.':'Original export shown. Retaining a source scene does not establish a new movie review.';E('#downloads').innerHTML=link(r.primary.movie,'Download playing MP4',true)+link(r.primary.srt,'SRT captions',true)+link(r.script,'Current narration script',true)+link(r.markup,'Current scene markup',true)+link(r.animation,'Animation source',true)+(r.updatedMovie?link(r.original.movie,'Compare original MP4'):r.candidate?.movie?link(r.candidate.movie,'Unapproved updated export'): '');E('#lesson-detail').innerHTML=details(r);renderList();if(scroll)E('.workspace').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}addEventListener('hashchange',()=>{if(data&&location.hash.slice(1)!==selected)select(location.hash.slice(1))});async function start(){const response=await fetch('review-data.json',{cache:'no-store'});if(!response.ok)throw Error('Review data unavailable');data=await response.json();window.reviewGalleryData=data;E('#summary').innerHTML=[[data.lessons.length,'lessons in the collection'],[data.summary.sourceCurrent,'current source reviews'],[data.summary.verifiedUpdated,'verified updated exports'],[data.summary.approved,'approved final movies']].map(([n,label])=>'<div><strong>'+n+'</strong><span>'+label+'</span></div>').join('');E('#generated').textContent='Generated '+new Date(data.generatedAt).toLocaleString()+'. '+data.summary.openFindings+' independent findings remain open.';document.querySelectorAll('[data-filter]').forEach(button=>{const key=button.dataset.filter,count=data.lessons.filter(r=>key==='all'||key==='updated'&&r.updated||key==='needs-work'&&r.needsWork||key==='retained'&&r.retained).length;button.textContent=button.textContent+' '+count;button.onclick=()=>{filter=key;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));renderList()}});E('#search').oninput=renderList;for(const[id,mode]of[['#table-view','table'],['#card-view','cards']])E(id).onclick=()=>{layout=mode;E('#table-view').setAttribute('aria-pressed',String(mode==='table'));E('#card-view').setAttribute('aria-pressed',String(mode==='cards'));renderList()};E('#lesson-list').onclick=event=>{const button=event.target.closest('[data-open]');if(button)select(button.dataset.open,true)};select(data.lessons.some(r=>r.id===location.hash.slice(1))?location.hash.slice(1):data.lessons.find(r=>r.updatedMovie)?.id??data.lessons[0].id)}start().catch(error=>{E('#result-count').textContent=error.message;console.error(error)});`;

async function build(opts) {
  const output = absolute(opts.output),
    baseline = absolute(opts.baseline);
  if (
    !inside(absolute('build'), output) ||
    output === absolute('build') ||
    inside(baseline, output)
  )
    throw new Error('Gallery output must be a separate directory beneath build/');
  const coverage = await json(absolute(opts.coverage)),
    manifest = await json(path.join(baseline, 'manifest.json'));
  if (
    !Array.isArray(manifest) ||
    manifest.length !== coverage.lessons.length ||
    new Set(manifest.map((row) => row.id)).size !== manifest.length ||
    new Set(coverage.lessons.map((row) => row.id)).size !== manifest.length
  )
    throw new Error('Baseline and coverage must contain the same complete collection');
  const manifestById = new Map(manifest.map((row) => [row.id, row])),
    sourceReviews = new Map(),
    crossReviews = new Map(),
    editorial = new Map(),
    warnings = [];
  const sourceReviewFiles = opts.sourceReviews?.length
    ? opts.sourceReviews
    : groups.map((group) => `build/visual-teaching-${group}/review.json`);
  for (const name of sourceReviewFiles) {
    const file = absolute(name),
      report = await optionalJson(file);
    if (!report) {
      warnings.push(`Source review pending: ${path.relative(root, file)}`);
      continue;
    }
    for (const row of report.lessons ?? []) {
      if (!manifestById.has(row.id)) throw new Error(`Unknown source review lesson: ${row.id}`);
      if (sourceReviews.has(row.id)) throw new Error(`Duplicate source review for ${row.id}`);
      sourceReviews.set(row.id, {
        ...row,
        reviewer: row.reviewer ?? report.reviewer,
        reviewScope: row.scope ?? report.scope,
        recordPath: file,
      });
    }
  }
  for (const name of (await fs.readdir(absolute(opts.crossReviews))).filter((name) =>
    name.endsWith('.json'),
  )) {
    const file = path.join(absolute(opts.crossReviews), name),
      report = await json(file);
    for (const row of report.lessons ?? []) {
      const rows = crossReviews.get(row.id) ?? [];
      rows.push({ ...row, reviewer: report.reviewer, recordPath: file });
      crossReviews.set(row.id, rows);
    }
  }
  for (const name of opts.editorial) {
    const file = absolute(name),
      report = await json(file);
    if (report.rubric !== 'videos/visual-teaching-rubric.json')
      throw new Error(
        `Fresh editorial reviews must name the current visual teaching rubric: ${name}`,
      );
    for (const row of report.lessons ?? []) {
      const rows = editorial.get(row.id) ?? [];
      rows.push({ ...row, reviewer: row.reviewer ?? report.reviewer, recordPath: file });
      editorial.set(row.id, rows);
    }
  }
  const renderRoots = (
    opts.renderRoots.length ? opts.renderRoots : defaultRenders.map((name) => `build/${name}`)
  ).map(absolute);
  const phases = new Map();
  for (const directory of renderRoots) {
    if (!inside(absolute('build'), directory) || directory === baseline)
      throw new Error('Render roots must be separate directories beneath build/');
    const batch = await optionalJson(path.join(directory, 'batch-receipt.json'));
    for (const row of batch?.lessons ?? [])
      phases.set(
        `${directory}/${row.id}`,
        Object.fromEntries(
          Object.entries(row.phases ?? {}).map(([key, value]) => [key, value.status]),
        ),
      );
  }
  await fs.mkdir(path.join(output, 'sources'), { recursive: true });
  const href = (file) =>
    file
      ? path.relative(output, absolute(file)).split(path.sep).map(encodeURIComponent).join('/')
      : null;
  const lessons = [];
  for (const [index, entry] of coverage.lessons.entries()) {
    const { id } = entry,
      baselineReceipt = manifestById.get(id);
    if (!baselineReceipt || !/^[a-z][a-z0-9-]*$/.test(id))
      throw new Error(`Invalid or missing baseline lesson: ${id}`);
    const markupFile = absolute(`videos/lessons/${id}.lesson.yaml`),
      animationFile = absolute(`videos/animations/${id}.mjs`),
      markupBytes = await fs.readFile(markupFile),
      lesson = parse(markupBytes.toString());
    const currentHashes = { animation: await hash(animationFile), markup: digest(markupBytes) },
      review = sourceReviews.get(id),
      bindings = review ? sourceBindings(review) : {};
    const reviewedScenes = review?.reviewedScenes ?? [],
      allScenes = lesson.scenes.every((scene) => reviewedScenes.includes(scene.id));
    const sourceCurrent =
      bindings.animation === currentHashes.animation &&
      bindings.markup === currentHashes.markup &&
      allScenes;
    const independent = crossReviews.get(id) ?? [],
      findings = independent.flatMap((row) =>
        (row.findings ?? []).map((finding) => ({
          ...finding,
          reviewer: row.reviewer,
          recordPath: href(row.recordPath),
        })),
      );
    const openFindings = findings.filter(findingOpen),
      changes = review?.changes ?? [];
    const remaining = review?.remainingIssues ?? [],
      updated = changes.length > 0 || /revised/.test(review?.sourceReviewStatus ?? '');
    const candidates = [];
    for (const directory of renderRoots) {
      try {
        const candidate = await checkCandidate(directory, id, { lesson, currentHashes });
        if (candidate) candidates.push(candidate);
      } catch (error) {
        warnings.push(`${id}: ${path.basename(directory)}: ${error.message}`);
      }
    }
    candidates.sort(
      (a, b) => Number(b.passed) - Number(a.passed) || b.generatedAt.localeCompare(a.generatedAt),
    );
    const candidate = candidates[0] ?? null,
      updatedMovie = Boolean(candidate?.passed);
    const editorialRecords = editorial.get(id) ?? [],
      retainedSource =
        sourceCurrent &&
        review?.sourceReviewStatus === 'accepted-unchanged' &&
        !openFindings.length &&
        !remaining.length;
    const originalAuthoredBound =
      retainedSource &&
      editorialRecords.some(
        (record) =>
          record.authoredSourceSha256?.animation === currentHashes.animation &&
          record.authoredSourceSha256?.markup === currentHashes.markup,
      );
    const originalTechnical =
      !updatedMovie && editorialRecords.length
        ? await checkCandidate(baseline, id, { lesson, original: true, originalAuthoredBound })
        : null;
    const editorialTarget = updatedMovie ? candidate : originalTechnical;
    const reviews = editorialTarget
      ? await editorialReview(
          editorialRecords,
          editorialTarget,
          lesson.scenes.map((scene) => scene.id),
          { original: !updatedMovie, currentHashes },
        )
      : [];
    const currentReviews = reviews.filter((row) => row.bound),
      editorialScores = playingEditorialScores(reviews);
    const playingFindings = mergePlayingFindings(findings, currentReviews),
      playingOpenFindings = playingFindings.filter(findingOpen);
    const { label: sourceLabel, detail: sourceDetail } = sourceReviewDisplay(
      review,
      sourceCurrent,
      findings,
      currentReviews,
    );
    const approved = Boolean(
      (updatedMovie || (originalTechnical?.passed && retainedSource)) &&
      sourceCurrent &&
      !playingOpenFindings.length &&
      !remaining.length &&
      currentReviews.length > 0 &&
      currentReviews.every((row) => row.approved),
    );
    const editorialScore = editorialScores.length ? editorialScores[0] : null;
    const originalDirectory = path.join(baseline, id),
      originalFile = path.join(originalDirectory, `${id}.mp4`);
    const baselineHashCurrent = (await hash(originalFile)) === baselineReceipt.sha256;
    const media = async (directory, receipt, enabled = true) => {
      const first = Object.keys(receipt.artifactSha256 ?? {}).find((name) =>
        /^\d\d-.*\.png$/.test(name),
      );
      return {
        movie: enabled ? href(path.join(directory, `${id}.mp4`)) : null,
        srt: href(path.join(directory, `${id}.srt`)),
        vtt: href(path.join(directory, `${id}.vtt`)),
        poster:
          first && (await fileExists(path.join(directory, first)))
            ? href(path.join(directory, first))
            : null,
      };
    };
    const original = await media(originalDirectory, baselineReceipt, baselineHashCurrent),
      primary = updatedMovie ? await media(candidate.directory, candidate.receipt) : original;
    await fs.copyFile(markupFile, path.join(output, 'sources', `${id}.lesson.yaml`));
    await fs.copyFile(animationFile, path.join(output, 'sources', `${id}.mjs`));
    const scriptSource = path.join(
      updatedMovie ? candidate.directory : originalDirectory,
      `${id}.script.md`,
    );
    const scriptFile = path.join(output, 'sources', `${id}.script.md`);
    await fs.writeFile(
      scriptFile,
      `# ${lesson.title}\n\n` +
        lesson.scenes
          .map(
            (scene) =>
              `## ${scene.title}\n\n${scene.beats.map((beat) => beat.say.trim()).join('\n\n')}`,
          )
          .join('\n\n'),
    );
    const links = [];
    if (review) links.push({ label: 'Source review record', url: href(review.recordPath) });
    for (const row of independent)
      links.push({
        label: `Independent review · ${row.reviewer ?? 'reviewer'}`,
        url: href(row.recordPath),
      });
    for (const row of reviews)
      if (row.recordPath)
        links.push({
          label: `Editorial review · ${row.reviewer ?? 'reviewer'}${row.bound ? ' · playing movie' : ' · other or unbound export'}`,
          url: href(row.recordPath),
        });
    const supportingPaths = new Set();
    for (const row of currentReviews)
      for (const image of row.additionalViewedImages)
        if (!supportingPaths.has(image.path)) {
          supportingPaths.add(image.path);
          links.push({
            label: `Supporting view · ${path.basename(image.path)}`,
            url: href(image.path),
          });
        }
    for (const image of (review?.viewedImages ?? []).slice(0, 8))
      if (image.path)
        links.push({
          label: `Reviewed image · ${path.basename(image.path)}`,
          url: href(image.path),
        });
    for (const [directory, label] of [
      [originalDirectory, 'Original'],
      ...(candidate ? [[candidate.directory, 'Updated']] : []),
    ]) {
      for (const [file, kind] of [
        ['encoded-review/index.html', 'encoded frame gallery'],
        ['frame-gallery.html', 'frame gallery'],
        ['verification.json', 'delivery receipt'],
        ['aggregate-occlusion.json', 'occlusion audit'],
        ['text-ink-audit.json', 'text audit'],
        ['motion-audit.json', 'motion audit'],
      ]) {
        if (await fileExists(path.join(directory, file)))
          links.push({ label: `${label} ${kind}`, url: href(path.join(directory, file)) });
      }
    }
    if (await fileExists(scriptSource))
      links.push({ label: 'Narration shipped with playing movie', url: href(scriptSource) });
    const previousScores = [];
    if (Number.isFinite(entry.publicationSelection?.qualityScore))
      previousScores.push({ label: 'production', score: entry.publicationSelection.qualityScore });
    for (const row of entry.reviewers ?? []) {
      if (Number.isFinite(row.visualScore))
        previousScores.push({ label: 'visual', score: row.visualScore });
      if (Number.isFinite(row.animationScore))
        previousScores.push({ label: 'animation', score: row.animationScore });
    }
    const renderPhases = renderRoots
      .map((directory) => ({
        root: path.relative(root, directory),
        phases: phases.get(`${directory}/${id}`) ?? null,
      }))
      .filter((row) => row.phases);
    const renderNote = candidate
      ? candidate.passed
        ? 'Verified current replacement; editorial review pending.'
        : 'Replacement checks are pending or stale.'
      : renderPhases.length
        ? 'Replacement queued or in progress; original remains available.'
        : 'No replacement export has been verified.';
    const row = {
      id,
      order: index + 1,
      title: lesson.title,
      group: entry.group ?? lesson.source.split('/')[0],
      duration: updatedMovie ? candidate.receipt.duration : baselineReceipt.duration,
      updated: updated || Boolean(candidate),
      sourceRevised: updated,
      retained: retainedSource,
      needsWork:
        !sourceCurrent ||
        playingOpenFindings.length > 0 ||
        remaining.length > 0 ||
        review?.sourceReviewStatus === 'needs-revision' ||
        Boolean(candidate && !candidate.passed) ||
        currentReviews.some((row) => !row.approved),
      source: {
        label: sourceLabel,
        detail: sourceDetail,
        current: sourceCurrent,
        status: review?.sourceReviewStatus ?? 'pending',
        rationale:
          review?.unchangedRationale ??
          (typeof review?.currentMechanismRationale === 'string'
            ? review.currentMechanismRationale
            : null),
      },
      changes,
      findings: playingFindings,
      openFindings: playingOpenFindings,
      remainingIssues: remaining,
      updatedMovie,
      approved,
      editorialScore,
      editorialScores,
      previousScores,
      editorialReviews: reviews,
      primary,
      original,
      script: href(scriptFile),
      markup: href(path.join(output, 'sources', `${id}.lesson.yaml`)),
      animation: href(path.join(output, 'sources', `${id}.mjs`)),
      links,
      renderNote,
      candidate: candidate
        ? {
            movie: href(candidate.movie),
            root: href(candidate.directory),
            passed: candidate.passed,
            gates: candidate.gates,
            errors: candidate.errors,
            generatedAt: candidate.generatedAt,
          }
        : null,
      technical: editorialTarget
        ? {
            kind: updatedMovie ? 'updated export' : 'retained original export',
            passed: editorialTarget.passed,
            gates: editorialTarget.gates,
          }
        : null,
      provenance: {
        currentSource: currentHashes,
        reviewedSource: bindings,
        sourceReviewer: review?.reviewer ?? null,
        originalMovieSha256: baselineReceipt.sha256,
        originalHashVerified: baselineHashCurrent,
        originalSourceFingerprint: baselineReceipt.fingerprint,
        originalRenderEngine: baselineReceipt.renderEngine ?? 'Not recorded in this older export',
        originalAuthoredSourceBound: originalAuthoredBound,
        updatedMovieSha256: candidate?.receipt.sha256 ?? null,
        updatedSourceFingerprint: candidate?.receipt.fingerprint ?? null,
        sourceReviewScope: review?.reviewScope ?? null,
        inspection: editorialTarget?.inspection ?? null,
        primary: updatedMovie ? 'verified updated export' : 'original export',
        renderPhases,
        editorialReviews: reviews,
        reviewScope:
          'Source snapshots and independent findings are separate from exact encoded movie acceptance.',
      },
    };
    row.search = [row.title, row.id, row.group, ...findings.map((finding) => finding.issue ?? '')]
      .join(' ')
      .toLowerCase();
    lessons.push(row);
    if ((index + 1) % 25 === 0)
      console.log(`Gallery: ${index + 1}/${coverage.lessons.length} lessons checked`);
  }
  const result = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    rubric: 'videos/visual-teaching-rubric.json',
    baseline: path.relative(root, baseline),
    renderRoots: renderRoots.map((directory) => path.relative(root, directory)),
    warnings,
    summary: {
      total: lessons.length,
      sourceCurrent: lessons.filter((row) => row.source.current).length,
      updated: lessons.filter((row) => row.updated).length,
      verifiedUpdated: lessons.filter((row) => row.updatedMovie).length,
      approved: lessons.filter((row) => row.approved).length,
      openFindings: lessons.reduce((n, row) => n + row.openFindings.length, 0),
      retained: lessons.filter((row) => row.retained).length,
      needsWork: lessons.filter((row) => row.needsWork).length,
    },
    lessons,
  };
  await Promise.all([
    fs.writeFile(path.join(output, 'review-data.json'), JSON.stringify(result, null, 2)),
    fs.writeFile(path.join(output, 'index.html'), htmlPage()),
    fs.writeFile(path.join(output, 'gallery.css'), css),
    fs.writeFile(path.join(output, 'gallery.js'), browserScript),
    fs.copyFile(absolute('videos/visual-teaching-rubric.json'), path.join(output, 'rubric.json')),
  ]);
  console.log(
    JSON.stringify(
      { output: path.relative(root, output), ...result.summary, warnings: warnings.length },
      null,
      2,
    ),
  );
  return result;
}

async function main() {
  const opts = options(process.argv.slice(2));
  if (opts.help) {
    console.log(
      'node videos/visual-teaching-gallery.mjs [--baseline DIR] [--coverage FILE] [--output DIR] [--cross-reviews DIR] [--source-review FILE ...] [--render-root DIR ...] [--editorial FILE ...]',
    );
    return;
  }
  await build(opts);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  main().catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
