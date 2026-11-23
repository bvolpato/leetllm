#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { parse } from 'yaml';
import { DecodedFrameAudit } from './inspect.mjs';
import { conceptSourceFiles } from './lib/concepts.mjs';
import { renderEngineBytes } from './lib/render-engine.mjs';
import { regenerateLessonCaptions } from './regenerate-captions.mjs';
import {
  buildSceneCoverage,
  assessRevisionPublicationReadiness,
  bindBaselineReviewImage,
  bindRevisionReviewImage,
  classifyArtifactReview,
  escapeHtml,
  hasOnlyUvReleaseAgeMetadataChanged,
  isPngSignature,
  paginateMotionScenes,
  normalizeReviewerPayload,
  reconcilePublicationSelection,
  readReviewerFiles,
  reviewImageMetadataPath,
  selectReviewPlayer,
  relativeLink,
  summarizeRevisionReviewRows,
  summarizeReviewerRows,
} from './lib/review-coverage.mjs';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const inputRoot = path.resolve(option('--input', 'build/video-complete-curriculum'));
const collectionPath = path.resolve(
  option('--collection', 'videos/collections/complete-curriculum.json'),
);
const selectionPath = path.resolve(option('--selection', 'videos/reviews/youtube-selection.json'));
const outputRoot = path.resolve(option('--output', 'build/video-worldclass-review-20261023'));
const reviewerRoot = path.resolve(option('--reviewers', outputRoot));
const additionalMaterialsRoot = path.resolve(
  option('--additional-materials', 'build/video-worldclass-review-20261023-corrected/materials'),
);
const revisionsFlag = args.indexOf('--revisions');
if (revisionsFlag >= 0 && (!args[revisionsFlag + 1] || args[revisionsFlag + 1].startsWith('--'))) {
  throw new Error('--revisions requires a directory');
}
const revisionsRoot = revisionsFlag < 0 ? null : path.resolve(args[revisionsFlag + 1]);
const refreshFlag = args.indexOf('--refresh-decode');
const refreshDecodeRoot =
  refreshFlag < 0
    ? null
    : path.resolve(
        args[refreshFlag + 1] && !args[refreshFlag + 1].startsWith('--')
          ? args[refreshFlag + 1]
          : path.join(outputRoot, 'refresh-decode'),
      );

if (args.includes('--help')) {
  process.stdout.write(
    'Usage: node videos/review-coverage.mjs [--input DIR] [--collection FILE] [--selection FILE] [--output DIR] [--reviewers DIR] [--additional-materials DIR] [--revisions DIR] [--refresh-decode [DIR]]\n',
  );
  process.exit(0);
}

function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

if (isWithin(inputRoot, outputRoot)) {
  throw new Error(`Review output must be outside the video input tree: ${outputRoot}`);
}
if (refreshDecodeRoot && isWithin(inputRoot, refreshDecodeRoot)) {
  throw new Error(
    `Refreshed decode output must be outside the video input tree: ${refreshDecodeRoot}`,
  );
}
if (revisionsRoot && (isWithin(inputRoot, revisionsRoot) || isWithin(revisionsRoot, inputRoot))) {
  throw new Error(
    `Revision output must be separate from the canonical video input tree: ${revisionsRoot}`,
  );
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function sha256File(file) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(file), hash);
  return hash.digest('hex');
}

const hashCache = new Map();
let hashedBytes = 0;
async function actualSha256(file) {
  const resolved = path.resolve(file);
  if (hashCache.has(resolved)) return hashCache.get(resolved);
  const info = await fs.stat(resolved);
  const digest = await sha256File(resolved);
  hashCache.set(resolved, digest);
  hashedBytes += info.size;
  return digest;
}

async function checkArtifact(file, expected, label, issues) {
  try {
    const actual = await actualSha256(file);
    if (actual !== expected)
      issues.push({ path: file, label, expected, actual, kind: 'hash-mismatch' });
    return { path: file, passed: actual === expected };
  } catch (error) {
    issues.push({
      path: file,
      label,
      expected,
      kind: error.code === 'ENOENT' ? 'missing' : 'read-error',
      message: error.message,
    });
    return { path: file, passed: false };
  }
}

async function verifyHashMap(baseDirectory, hashes, label, issues) {
  const entries = Object.entries(hashes ?? {});
  let passed = 0;
  for (const [relative, expected] of entries) {
    const result = await checkArtifact(
      path.resolve(baseDirectory, relative),
      expected,
      `${label}:${relative}`,
      issues,
    );
    if (result.passed) passed += 1;
  }
  return { declared: entries.length, passed, failed: entries.length - passed };
}

async function isPngFile(file) {
  const handle = await fs.open(file, 'r');
  try {
    const signature = Buffer.alloc(8);
    const { bytesRead } = await handle.read(signature, 0, signature.length, 0);
    return bytesRead === signature.length && isPngSignature(signature);
  } finally {
    await handle.close();
  }
}

async function verifyBaselineReviewerImages(row, lessonId, manifestRow, encodedDirectory, encoded) {
  const images = Array.isArray(row.viewedImages) ? row.viewedImages : [];
  const evidenceIntegrity = [];
  const materialDirectories = [
    path.join(additionalMaterialsRoot, lessonId),
    path.join(repoRoot, 'build/video-youtube-curation-20261021/materials', lessonId),
    path.join(outputRoot, 'materials', lessonId),
  ];
  const atlasDirectories = [path.join(outputRoot, 'materials', lessonId)];
  if (!images.length) {
    evidenceIssues.push({
      path: null,
      label: `${row.reviewer}:${lessonId}:review-image`,
      kind: 'empty-image-evidence',
    });
    return evidenceIntegrity;
  }
  for (const image of images) {
    let binding = bindBaselineReviewImage(repoRoot, lessonId, image, {
      movieSha256: manifestRow.sha256,
      sourceFingerprint: manifestRow.fingerprint,
      encodedDirectory,
      encodedArtifactHashes: encoded.artifactSha256,
      materialDirectories,
      atlasDirectories,
    });
    if (!binding) {
      const metadataPath = reviewImageMetadataPath(repoRoot, lessonId, image, {
        materialDirectories,
        atlasDirectories,
      });
      if (metadataPath) {
        try {
          const metadata = await readJson(metadataPath);
          const metadataOptions =
            path.basename(metadataPath) === 'material.json'
              ? { materialMetadata: metadata, materialDirectories }
              : { atlasMetadata: metadata, atlasDirectories };
          binding = bindBaselineReviewImage(repoRoot, lessonId, image, {
            movieSha256: manifestRow.sha256,
            sourceFingerprint: manifestRow.fingerprint,
            ...metadataOptions,
          });
        } catch (error) {
          if (error.code !== 'ENOENT') {
            evidenceIssues.push({
              path: metadataPath,
              label: `${row.reviewer}:${lessonId}:review-image-metadata`,
              kind: 'read-error',
              message: error.message,
            });
          }
        }
      }
    }
    if (!binding) {
      const issue = {
        path: image?.path ?? null,
        label: `${row.reviewer}:${lessonId}:review-image`,
        kind: 'unbound-image',
      };
      evidenceIssues.push(issue);
      evidenceIntegrity.push({ ...issue, passed: false });
      continue;
    }
    try {
      if (!(await isPngFile(binding.path))) {
        const issue = {
          path: image.path,
          label: `${row.reviewer}:${lessonId}:review-image`,
          kind: 'not-png-image',
        };
        evidenceIssues.push(issue);
        evidenceIntegrity.push({ ...issue, passed: false });
        continue;
      }
    } catch (error) {
      const issue = {
        path: image.path,
        label: `${row.reviewer}:${lessonId}:review-image`,
        kind: 'read-error',
        message: error.message,
      };
      evidenceIssues.push(issue);
      evidenceIntegrity.push({ ...issue, passed: false });
      continue;
    }
    const checked = await checkArtifact(
      binding.path,
      image.sha256,
      `${row.reviewer}:${lessonId}:review-image`,
      evidenceIssues,
    );
    evidenceIntegrity.push({ ...checked, path: image.path, kind: binding.kind });
  }
  return evidenceIntegrity;
}

async function refreshDecodeAudit(videoPath, timeline, expectedVideoHash, outputDirectory) {
  const actualVideoHash = await actualSha256(videoPath);
  if (actualVideoHash !== expectedVideoHash)
    throw new Error('Movie changed before refreshed decode began');
  const frameAudit = new DecodedFrameAudit(timeline, 320, 180);
  const frameBytes = frameAudit.width * frameAudit.height;
  const child = spawn(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-threads',
      '2',
      '-filter_threads',
      '1',
      '-i',
      videoPath,
      '-map',
      '0:v:0',
      '-vf',
      `scale=${frameAudit.width}:${frameAudit.height}:flags=area,format=gray`,
      '-fps_mode',
      'passthrough',
      '-pix_fmt',
      'gray',
      '-f',
      'rawvideo',
      'pipe:1',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let stderr = '';
  let pending = Buffer.alloc(0);
  const exited = new Promise((resolveExit) => {
    child.once('error', (error) => resolveExit({ error }));
    child.once('close', (code, signal) => resolveExit({ code, signal }));
  });
  child.stderr.on('data', (bytes) => {
    stderr = (stderr + bytes).slice(-8000);
  });
  try {
    for await (const chunk of child.stdout) {
      pending = pending.length ? Buffer.concat([pending, chunk]) : chunk;
      let offset = 0;
      while (pending.length - offset >= frameBytes) {
        frameAudit.observe(pending.subarray(offset, offset + frameBytes));
        offset += frameBytes;
      }
      pending = pending.subarray(offset);
    }
    const exit = await exited;
    if (exit.error) throw exit.error;
    if (exit.code !== 0)
      throw new Error(`FFmpeg decode failed (${exit.code ?? exit.signal}): ${stderr}`);
    if (pending.length)
      throw new Error(`FFmpeg returned ${pending.length} trailing bytes of an incomplete frame`);
    const audit = frameAudit.finish();
    const timelineSha256 = await actualSha256(path.join(path.dirname(videoPath), 'timeline.json'));
    const auditBytes = Buffer.from(JSON.stringify(audit, null, 2));
    const metricsBytes = Buffer.from(JSON.stringify(frameAudit.metrics));
    await fs.mkdir(outputDirectory, { recursive: true });
    await fs.writeFile(path.join(outputDirectory, 'decoded-frame-audit.json'), auditBytes);
    await fs.writeFile(path.join(outputDirectory, 'decoded-frame-metrics.json'), metricsBytes);
    await fs.writeFile(
      path.join(outputDirectory, 'verification.json'),
      `${JSON.stringify(
        {
          videoSha256: actualVideoHash,
          timelineSha256,
          auditSha256: createHash('sha256').update(auditBytes).digest('hex'),
          metricsSha256: createHash('sha256').update(metricsBytes).digest('hex'),
          ffmpegThreads: 2,
          resolution: `${frameAudit.width}x${frameAudit.height} grayscale`,
          frames: audit.frames,
          expectedFrames: audit.expectedFrames,
          passed: audit.passed && audit.decodePassed,
        },
        null,
        2,
      )}\n`,
    );
    return {
      path: outputDirectory,
      frames: audit.frames,
      expectedFrames: audit.expectedFrames,
      passed: audit.passed && audit.decodePassed,
    };
  } catch (error) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      const timer = setTimeout(() => child.kill('SIGKILL'), 1000);
      await exited;
      clearTimeout(timer);
    }
    throw error;
  }
}

async function inspectRevisionLesson(id, catalogLesson) {
  if (!revisionsRoot) return null;
  const directory = path.join(revisionsRoot, id);
  try {
    if (!(await fs.stat(directory)).isDirectory()) return null;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }

  const receiptPath = path.join(directory, 'verification.json');
  let receipt;
  try {
    receipt = await readJson(receiptPath);
  } catch (error) {
    if (error.code !== 'ENOENT')
      return {
        id,
        directory,
        status: 'render receipt invalid',
        error: error.message,
        moviePath: null,
        encodedReview: null,
        review: { status: 'pending', rows: [] },
      };
    return {
      id,
      directory,
      status: 'render pending',
      moviePath: null,
      encodedReview: null,
      review: { status: 'pending', rows: [] },
    };
  }

  const current = currentSourceById.get(id);
  const moviePath = path.join(directory, `${id}.mp4`);
  const issues = [];
  const movieCheck = await checkArtifact(moviePath, receipt.sha256, 'revision:movie', issues);
  const receiptMovieHash = receipt.artifactSha256?.[`${id}.mp4`];
  if (receiptMovieHash !== receipt.sha256)
    issues.push({
      path: receiptPath,
      label: 'revision:receipt-movie-hash',
      expected: receipt.sha256,
      actual: receiptMovieHash,
      kind: 'hash-mismatch',
    });
  if (!receipt.artifactSha256?.['timeline.json'])
    issues.push({ path: receiptPath, label: 'revision:receipt-timeline-hash', kind: 'missing' });
  const rootArtifacts = await verifyHashMap(
    directory,
    receipt.artifactSha256,
    'revision-artifact',
    issues,
  );
  let timeline = null;
  try {
    timeline = await readJson(path.join(directory, 'timeline.json'));
    if (
      timeline.id !== id ||
      !Array.isArray(timeline.scenes) ||
      timeline.scenes.length !== receipt.scenes
    ) {
      issues.push({
        path: path.join(directory, 'timeline.json'),
        label: 'revision:timeline-lesson',
        kind: 'timeline-mismatch',
      });
    }
  } catch (error) {
    issues.push({
      path: path.join(directory, 'timeline.json'),
      label: 'revision:timeline',
      kind: error.code === 'ENOENT' ? 'missing' : 'read-error',
      message: error.message,
    });
  }
  const sourceMatches = Boolean(
    current &&
    receipt.fingerprint === current.fingerprint &&
    receipt.source === catalogLesson.source &&
    receipt.sourceSha256 === current.articleSha256 &&
    receipt.ttsAdapter?.path === current.adapterPath &&
    receipt.ttsAdapter?.sha256 === current.adapterSha256,
  );
  if (!sourceMatches)
    issues.push({
      path: receiptPath,
      label: 'revision:current-source',
      expected: {
        fingerprint: current?.fingerprint,
        source: catalogLesson.source,
        sourceSha256: current?.articleSha256,
      },
      actual: {
        fingerprint: receipt.fingerprint,
        source: receipt.source,
        sourceSha256: receipt.sourceSha256,
      },
      kind: 'source-stale',
    });
  const expectedFrames =
    timeline?.scenes?.reduce(
      (sum, scene) => sum + (scene.frames ?? 0),
      timeline?.intro?.frames ?? 0,
    ) ?? 0;
  const renderFrameAuditPassed =
    receipt.fullDecode === 'passed' &&
    receipt.frameAudit?.passed === true &&
    Number(receipt.frameAudit.frames) > 0 &&
    receipt.frameAudit.frames === expectedFrames;
  if (!renderFrameAuditPassed)
    issues.push({
      path: receiptPath,
      label: 'revision:render-frame-audit',
      kind: 'audit-pending-or-failed',
    });
  const renderPassed =
    receipt.id === id &&
    movieCheck.passed &&
    rootArtifacts.declared > 0 &&
    rootArtifacts.failed === 0 &&
    renderFrameAuditPassed;
  let encodedReview = {
    status: 'pending',
    path: path.join(directory, 'encoded-review', 'index.html'),
    contactSheet: path.join(directory, 'encoded-review', 'contact-sheet.png'),
    movieSha256: null,
    sourceFingerprint: null,
    frames: null,
    expectedFrames: null,
    hashesPassed: 0,
    hashesDeclared: 0,
    passed: false,
    issues: [],
  };
  const encodedDirectory = path.join(directory, 'encoded-review');
  const encodedVerificationPath = path.join(encodedDirectory, 'verification.json');
  let encodedReviewArtifactHashes = {};
  try {
    const encoded = await readJson(encodedVerificationPath);
    encodedReviewArtifactHashes = encoded.artifactSha256 ?? {};
    const encodedIssues = [];
    if (encoded.videoSha256 !== receipt.sha256)
      encodedIssues.push({
        path: encodedVerificationPath,
        label: 'revision-encoded:movie',
        expected: receipt.sha256,
        actual: encoded.videoSha256,
        kind: 'hash-mismatch',
      });
    for (const required of [
      'index.html',
      'decoded-frame-audit.json',
      'decoded-frame-metrics.json',
      'contact-sheet.png',
    ]) {
      if (!encoded.artifactSha256?.[required])
        encodedIssues.push({
          path: encodedVerificationPath,
          label: `revision-encoded:${required}`,
          kind: 'missing',
        });
    }
    if (
      encoded.decodedFrameAudit?.passed !== true ||
      encoded.decodedFrameAudit?.decodePassed !== true ||
      encoded.decodedFrameAudit.frames !== encoded.decodedFrameAudit.expectedFrames
    ) {
      encodedIssues.push({
        path: encodedVerificationPath,
        label: 'revision-encoded:full-decode',
        kind: 'audit-pending-or-failed',
      });
    }
    const encodedIntegrity = await verifyHashMap(
      encodedDirectory,
      encoded.artifactSha256,
      'revision-encoded-artifact',
      encodedIssues,
    );
    const audit = await readJson(path.join(encodedDirectory, 'decoded-frame-audit.json'));
    const metrics = await readJson(path.join(encodedDirectory, 'decoded-frame-metrics.json'));
    if (audit.frames !== metrics.length || audit.frames !== encoded.decodedFrameAudit?.frames) {
      encodedIssues.push({
        path: path.join(encodedDirectory, 'decoded-frame-metrics.json'),
        label: 'revision-encoded:metric-count',
        expected: encoded.decodedFrameAudit?.frames,
        actual: metrics.length,
        kind: 'frame-count-mismatch',
      });
    }
    if (
      audit.passed !== true ||
      audit.decodePassed !== true ||
      audit.frames !== audit.expectedFrames
    ) {
      encodedIssues.push({
        path: path.join(encodedDirectory, 'decoded-frame-audit.json'),
        label: 'revision-encoded:audit',
        kind: 'audit-pending-or-failed',
      });
    }
    encodedReview = {
      status: encodedIssues.length === 0 && encodedIntegrity.failed === 0 ? 'current' : 'issues',
      path: path.join(encodedDirectory, 'index.html'),
      contactSheet: path.join(encodedDirectory, 'contact-sheet.png'),
      posterFrame: (() => {
        const sample = encoded.samples?.find(
          (sample) =>
            encoded.artifactSha256?.[sample.image] &&
            sample.targets?.some(
              (target) =>
                target.scene !== 'leetllm-intro' && target.beat === 0 && target.phase === 'middle',
            ),
        );
        return sample ? path.join(encodedDirectory, sample.image) : null;
      })(),
      verificationPath: encodedVerificationPath,
      movieSha256: encoded.videoSha256,
      sourceFingerprint: receipt.fingerprint,
      matchesCurrentCheckout: sourceMatches,
      frames: audit.frames,
      expectedFrames: audit.expectedFrames,
      hashesPassed: encodedIntegrity.passed,
      hashesDeclared: encodedIntegrity.declared,
      passed:
        encodedIssues.length === 0 &&
        encodedIntegrity.declared > 0 &&
        encodedIntegrity.failed === 0,
      issues: encodedIssues,
    };
  } catch (error) {
    if (error.code !== 'ENOENT')
      encodedReview = {
        ...encodedReview,
        status: 'issues',
        issues: [{ kind: 'read-error', message: error.message }],
      };
  }

  let structuralAudit = { status: 'pending', passed: false, issues: [] };
  const structuralPath = path.join(directory, 'aggregate-occlusion.json');
  try {
    const audit = await readJson(structuralPath);
    const structuralIssues = [];
    const toolSha256 = createHash('sha256')
      .update(
        Buffer.concat(
          await Promise.all(
            ['videos/audit-occlusion.mjs', 'videos/lib/aggregate-occlusion.mjs'].map((file) =>
              fs.readFile(path.resolve(repoRoot, file)),
            ),
          ),
        ),
      )
      .digest('hex');
    if (audit.videoSha256 !== receipt.sha256)
      structuralIssues.push({
        path: structuralPath,
        label: 'revision-occlusion:movie',
        kind: 'hash-mismatch',
      });
    if (audit.sourceFingerprint !== receipt.fingerprint)
      structuralIssues.push({
        path: structuralPath,
        label: 'revision-occlusion:source',
        kind: 'fingerprint-mismatch',
      });
    if (audit.toolSha256 !== toolSha256)
      structuralIssues.push({
        path: structuralPath,
        label: 'revision-occlusion:tool',
        expected: toolSha256,
        actual: audit.toolSha256,
        kind: 'tool-mismatch',
      });
    if (audit.passed !== true || audit.frames !== audit.expectedFrames || audit.issueFrames !== 0)
      structuralIssues.push({
        path: structuralPath,
        label: 'revision-occlusion:result',
        kind: 'audit-pending-or-failed',
      });
    structuralAudit = {
      status: structuralIssues.length ? 'issues' : 'current',
      passed: structuralIssues.length === 0,
      path: structuralPath,
      issues: structuralIssues,
    };
  } catch (error) {
    if (error.code !== 'ENOENT')
      structuralAudit = {
        status: 'issues',
        passed: false,
        path: structuralPath,
        issues: [{ kind: 'read-error', message: error.message }],
      };
  }

  let captions = { status: 'pending', current: false, cues: null, issues: [] };
  try {
    const checked = await regenerateLessonCaptions({ input: revisionsRoot, id, check: true });
    captions = { status: 'current', current: checked.upToDate, cues: checked.cues, issues: [] };
  } catch (error) {
    captions = {
      status: 'issues',
      current: false,
      cues: null,
      issues: [{ kind: 'captions-stale', message: error.message }],
    };
    issues.push({
      path: path.join(directory, `${id}.srt`),
      label: 'revision:captions',
      kind: 'captions-stale',
      message: error.message,
    });
  }

  let textInkAudit = { status: 'pending', passed: false, issues: [] };
  let motionAudit = { status: 'pending', passed: false, issues: [] };
  try {
    const timelineSha256 = await actualSha256(path.join(directory, 'timeline.json'));
    const receiptSha256 = await actualSha256(receiptPath);
    const auditChecks = [
      {
        key: 'textInk',
        file: 'text-ink-audit.json',
        tools: ['videos/audit-text-ink.mjs', 'videos/lib/text-ink-audit.mjs'],
      },
      {
        key: 'motion',
        file: 'motion-audit.json',
        tools: ['videos/audit-motion.mjs', 'videos/lib/motion-audit.mjs'],
      },
    ];
    for (const check of auditChecks) {
      const auditPath = path.join(directory, check.file);
      const audit = await readJson(auditPath);
      const toolSha256 = createHash('sha256')
        .update(
          Buffer.concat(
            await Promise.all(check.tools.map((file) => fs.readFile(path.resolve(repoRoot, file)))),
          ),
        )
        .digest('hex');
      const auditIssues = [];
      if (audit.id !== id || audit.passed !== true)
        auditIssues.push({
          path: auditPath,
          label: `revision-${check.key}:result`,
          kind: 'audit-pending-or-failed',
        });
      if ((audit.videoSha256 ?? audit.movieSha256) !== receipt.sha256)
        auditIssues.push({
          path: auditPath,
          label: `revision-${check.key}:movie`,
          kind: 'hash-mismatch',
        });
      if (audit.sourceFingerprint !== receipt.fingerprint)
        auditIssues.push({
          path: auditPath,
          label: `revision-${check.key}:source`,
          kind: 'fingerprint-mismatch',
        });
      if (audit.timelineSha256 !== timelineSha256)
        auditIssues.push({
          path: auditPath,
          label: `revision-${check.key}:timeline`,
          kind: 'hash-mismatch',
        });
      if (audit.receiptSha256 !== receiptSha256)
        auditIssues.push({
          path: auditPath,
          label: `revision-${check.key}:receipt`,
          kind: 'hash-mismatch',
        });
      if (audit.toolSha256 !== toolSha256)
        auditIssues.push({
          path: auditPath,
          label: `revision-${check.key}:tool`,
          expected: toolSha256,
          actual: audit.toolSha256,
          kind: 'tool-mismatch',
        });
      const result = {
        status: auditIssues.length ? 'issues' : 'current',
        passed: auditIssues.length === 0,
        path: auditPath,
        reportSha256: await actualSha256(auditPath),
        issues: auditIssues,
      };
      if (check.key === 'textInk') textInkAudit = result;
      else motionAudit = result;
    }
  } catch (error) {
    const audit = {
      status: 'issues',
      passed: false,
      issues: [{ kind: 'read-or-binding-error', message: error.message }],
    };
    if (textInkAudit.status === 'pending') textInkAudit = audit;
    else motionAudit = audit;
  }

  const reviewRows = (revisionRowsByLesson.get(id) ?? []).map((row) => ({
    reviewer: row.reviewer ?? 'replacement reviewer',
    movieSha256: row.movieSha256 ?? null,
    sourceFingerprint: row.sourceFingerprint ?? null,
    movieCurrent: row.movieSha256 === receipt.sha256,
    sourceCurrent: row.sourceFingerprint === receipt.fingerprint,
    visualScore: row.visualScore ?? null,
    animationScore: row.animationScore ?? null,
    overallScore: row.overallScore ?? null,
    dimensionScores: row.dimensionScores ?? null,
    readyForYoutube: row.readyForYoutube ?? null,
    findings: Array.isArray(row.findings) ? row.findings : [],
    blockers: Array.isArray(row.blockers) ? row.blockers : null,
    viewedImages: row.viewedImages ?? [],
    reviewedScenes: row.reviewedScenes ?? [],
    evidencePassed: Array.isArray(row.viewedImages) && row.viewedImages.length > 0,
  }));
  for (const row of reviewRows) {
    for (const image of row.viewedImages) {
      if (!image.path || !image.sha256) {
        row.evidencePassed = false;
        continue;
      }
      const boundImage = bindRevisionReviewImage(
        repoRoot,
        encodedDirectory,
        image,
        encodedReviewArtifactHashes,
      );
      if (!boundImage) {
        row.evidencePassed = false;
        continue;
      }
      try {
        if (
          !(await isPngFile(boundImage.path)) ||
          (await actualSha256(boundImage.path)) !== boundImage.sha256
        )
          row.evidencePassed = false;
      } catch {
        row.evidencePassed = false;
      }
    }
  }
  const review = summarizeRevisionReviewRows(reviewRows, {
    movieSha256: receipt.sha256,
    sourceFingerprint: receipt.fingerprint,
    matchesCurrentCheckout: sourceMatches,
  });
  const automatedVerificationPassed =
    renderPassed && encodedReview.passed && structuralAudit.passed;
  const auditBindings = {
    renderReceipt: renderPassed,
    encodedDecode: encodedReview.passed,
    structuralOcclusion: structuralAudit.passed,
    textInk: textInkAudit.passed,
    motion: motionAudit.passed,
  };
  const publicationReadiness = assessRevisionPublicationReadiness({
    automatedVerificationPassed,
    captionsCurrent: captions.current,
    auditBindings,
    review,
  });
  const status = !renderPassed
    ? 'render issues'
    : !encodedReview.passed
      ? 'encoded-frame audit pending'
      : !structuralAudit.passed
        ? 'structural audit pending'
        : publicationReadiness.status;
  return {
    id,
    directory,
    status,
    available: true,
    moviePath,
    movieSha256: receipt.sha256,
    sourceFingerprint: receipt.fingerprint,
    sourceCurrent: sourceMatches,
    matchesCurrentCheckout: sourceMatches,
    renderPassed,
    renderFrameAuditPassed,
    rootArtifactHashesPassed: rootArtifacts.passed,
    rootArtifactHashesDeclared: rootArtifacts.declared,
    encodedReview,
    structuralAudit,
    captions,
    textInkAudit,
    motionAudit,
    auditBindings,
    review,
    automatedVerificationPassed,
    publicationReady: publicationReadiness.publicationReady,
    publicationReadiness,
    issues,
  };
}

function htmlFor(report) {
  const outputDir = report.outputPath;
  const e = escapeHtml;
  const lessons = report.lessons
    .map((lesson) => {
      const videoPath = relativeLink(outputDir, lesson.video.path);
      const encodedPath = relativeLink(outputDir, lesson.encodedReview.path);
      const contactPath = relativeLink(outputDir, lesson.encodedReview.contactSheet);
      const atlasPath = lesson.motionAtlas
        ? relativeLink(outputDir, lesson.motionAtlas.imagePath)
        : null;
      const motionPagesIndexHref = lesson.motionPages
        ? relativeLink(outputDir, lesson.motionPages.indexPath)
        : null;
      const motionPageLinks =
        lesson.motionPages?.pages
          .map((page) => {
            const first = page.scenes[0]?.title ?? page.firstScene;
            const last = page.scenes.at(-1)?.title ?? page.lastScene;
            const href = relativeLink(outputDir, page.path);
            return `<a href="${e(href)}">page ${String(page.page).padStart(2, '0')} · ${e(first)}–${e(last)}</a>`;
          })
          .join(' · ') ?? '';
      const additionalMaterialLinks =
        lesson.additionalMaterials?.assets
          .map((asset) => {
            const href = relativeLink(outputDir, asset.path);
            return `<a href="${e(href)}">${e(asset.label)}</a>`;
          })
          .join(' · ') ?? '';
      const issueCount = lesson.artifactIntegrity.mismatches.length;
      const findingCount = lesson.reviewers.reduce(
        (sum, reviewer) => sum + reviewer.findings.length,
        0,
      );
      const blockerCount = lesson.reviewers.reduce(
        (sum, reviewer) => sum + reviewer.blockers.length,
        0,
      );
      const staleReviewCount = lesson.reviewers.filter((reviewer) => reviewer.stale).length;
      const currentReviewCount = lesson.reviewers.filter((reviewer) => !reviewer.stale).length;
      const checkoutDiffers = !lesson.currentSource?.matchesCurrentCheckout;
      const status = issueCount
        ? 'artifact issue'
        : staleReviewCount
          ? 'stale review'
          : !currentReviewCount
            ? 'review pending'
            : blockerCount
              ? 'reviewed with blocker'
              : checkoutDiffers
                ? 'reviewed · checkout differs'
                : 'reviewed';
      const selection = lesson.publicationSelection;
      const selectionStatus = selection.stale
        ? `${selection.decision} · stale`
        : selection.decision;
      const revision = lesson.revision;
      const revisionMoviePath = revision?.moviePath
        ? relativeLink(outputDir, revision.moviePath)
        : null;
      const revisionEncodedPath = revision?.encodedReview?.passed
        ? relativeLink(outputDir, revision.encodedReview.path)
        : null;
      const player = selectReviewPlayer({
        baseline: {
          moviePath: videoPath,
          posterPath: (() => {
            const sample = lesson.scenes[0]?.beats[0]?.samples.find(
              (sample) => sample.phase === 'middle',
            );
            return sample
              ? relativeLink(
                  outputDir,
                  path.join(report.inputRoot, lesson.id, 'encoded-review', sample.image),
                )
              : contactPath;
          })(),
          captionsPath: relativeLink(
            outputDir,
            path.join(report.inputRoot, lesson.id, `${lesson.id}.vtt`),
          ),
        },
        revision: revision
          ? {
              ...revision,
              moviePath: revisionMoviePath,
              captionsPath: relativeLink(
                outputDir,
                path.join(revision.directory, `${lesson.id}.vtt`),
              ),
              encodedReview: {
                ...revision.encodedReview,
                contactSheet: revision.encodedReview?.contactSheet
                  ? relativeLink(outputDir, revision.encodedReview.contactSheet)
                  : null,
                posterFrame: revision.encodedReview?.posterFrame
                  ? relativeLink(outputDir, revision.encodedReview.posterFrame)
                  : null,
              },
            }
          : null,
      });
      const revisionReviews =
        revision?.review?.rows
          .map(
            (row) =>
              `<section class="review"><h4>${e(row.reviewer)} · ${row.current ? 'current for reviewed export' : 'stale'}</h4><p>Visual ${e(row.visualScore ?? '—')} / 100 · Animation ${e(row.animationScore ?? '—')} / 100 · YouTube ${row.readyForYoutube === null ? 'unscored' : row.readyForYoutube ? 'ready' : 'hold'}</p><p>Movie ${row.movieCurrent ? 'matches' : 'mismatch'} · receipt source ${row.sourceCurrent ? 'matches' : 'mismatch'} · checkout source ${row.matchesCurrentCheckout ? 'matches' : 'differs'} · viewed-image hashes ${row.evidenceCurrent ? 'verified' : 'missing or stale'}</p><ul>${row.findings.map((finding) => `<li>${e(finding.severity ?? 'finding')}: ${e(finding.issue ?? finding)}</li>`).join('')}${(row.blockers ?? []).map((blocker) => `<li><strong>Blocker:</strong> ${e(blocker.issue ?? blocker.message ?? blocker)}</li>`).join('')}</ul></section>`,
          )
          .join('') ?? '';
      const displayedReviews =
        revision?.review?.status === 'current' ? revision.review.rows : lesson.reviewers;
      const reviewSummary = displayedReviews.length
        ? displayedReviews
            .map(
              (row) =>
                `${e(row.reviewer)}: ${row.overallScore == null ? '' : `overall ${e(row.overallScore)}/100 · `}visual ${e(row.visualScore ?? '—')}, animation ${e(row.animationScore ?? '—')}, ${row.readyForYoutube === null ? 'decision pending' : row.readyForYoutube ? 'ready' : 'hold'}${row.stale ? ' (stale for reviewed export)' : ' (matches reviewed export)'}${row.matchesCurrentCheckout ? '' : ' · checkout source differs'}`,
            )
            .join('<br>')
        : 'No current reviewer record loaded';
      const scenes = lesson.scenes
        .map((scene) => {
          const sheet = scene.sheet
            ? `<a href="${e(relativeLink(outputDir, path.resolve(report.inputRoot, lesson.id, 'encoded-review', scene.sheet)))}">scene sheet</a>`
            : 'no scene sheet';
          const beats = scene.beats
            .map((beat) => {
              const samples =
                beat.samples
                  .map((sample) => {
                    const image = path.resolve(
                      report.inputRoot,
                      lesson.id,
                      'encoded-review',
                      sample.image,
                    );
                    const href = relativeLink(outputDir, image);
                    const time = sample.time.toFixed(2);
                    return `<a href="${e(href)}" title="${e(sample.phase)} at ${time}s">${e(sample.phase)} ${time}s</a>`;
                  })
                  .join(' · ') || '<span class="muted">no native samples</span>';
              return `<li><span class="beat-label">Beat ${beat.index + 1}</span> ${samples}</li>`;
            })
            .join('');
          return `<details class="scene" id="${e(`${lesson.id}-${scene.id}`)}"><summary>${e(scene.title)} <small>${e(scene.id)} · ${scene.sampledBeatCount}/${scene.beats.length} beats sampled · ${sheet}</small></summary><ol>${beats}</ol></details>`;
        })
        .join('');
      const candidates = [
        ...lesson.temporal.earlySettleCandidates.map((candidate) => ({
          ...candidate,
          label: 'early settle',
        })),
        ...lesson.temporal.stillCandidates.map((candidate) => ({
          ...candidate,
          label: 'long still',
        })),
        ...lesson.temporal.highChangeCandidates.map((candidate) => ({
          label: 'large change',
          scene: candidate.scene,
          beat: null,
          startTime: candidate.time,
          duration: 0,
          changedFraction: candidate.changedFraction,
          firstFrame: candidate.frame,
        })),
      ].sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
      const candidateRows = candidates
        .slice(0, 40)
        .map((candidate) => {
          const stamp = Number(candidate.startTime ?? candidate.time ?? 0).toFixed(2);
          const scene = lesson.scenes.find((row) => row.id === candidate.scene);
          const sceneHref = scene?.sheet ? `#${e(lesson.id)}-${e(scene.id)}` : videoPath;
          return `<li><a href="${e(videoPath)}#t=${stamp}">${stamp}s</a> ${e(candidate.label)} · ${e(candidate.scene ?? 'unknown scene')}${candidate.beat === null ? '' : ` beat ${candidate.beat + 1}`} · ${Number(candidate.duration ?? 0).toFixed(1)}s${candidate.changedFraction === undefined ? '' : ` · ${Math.round(candidate.changedFraction * 100)}% pixels changed`}${sceneHref ? ` <a href="${e(sceneHref)}">scene</a>` : ''}</li>`;
        })
        .join('');
      const reviewers =
        lesson.reviewers
          .map((reviewer) => {
            const findings = reviewer.findings
              .map(
                (finding) =>
                  `<li><strong>${e(finding.severity ?? 'finding')}</strong> ${e(finding.scene ?? '')}: ${e(finding.issue ?? finding)}</li>`,
              )
              .join('');
            const blockers = reviewer.blockers
              .map(
                (blocker) =>
                  `<li><strong>Blocker</strong> ${e(blocker.issue ?? blocker.message ?? blocker)}</li>`,
              )
              .join('');
            const evidence =
              reviewer.evidenceIntegrity
                ?.map(
                  (item) =>
                    `<li>${e(item.path)}: ${item.passed ? 'hash verified' : 'stale or missing'}</li>`,
                )
                .join('') ?? '';
            return `<section class="review"><h4>${e(reviewer.reviewer)}${reviewer.stale ? ' · stale for reviewed export' : ' · matches reviewed export'}${reviewer.matchesCurrentCheckout ? '' : ' · checkout source differs'}</h4><p>Visual ${e(reviewer.visualScore ?? '—')} / 100 · Animation ${e(reviewer.animationScore ?? '—')} / 100 · YouTube ${reviewer.readyForYoutube === null ? 'unscored' : reviewer.readyForYoutube ? 'ready' : 'hold'} · image evidence ${reviewer.evidenceCurrent ? 'verified' : 'missing or stale'}</p><ul>${findings}${blockers}${evidence}</ul></section>`;
          })
          .join('') || '<p class="muted">No new reviewer record loaded.</p>';
      const mismatchRows = lesson.artifactIntegrity.mismatches
        .slice(0, 8)
        .map(
          (issue) =>
            `<li>${e(issue.kind)} · ${e(path.relative(report.inputRoot, issue.path))}</li>`,
        )
        .join('');
      return `<tr data-revised="${Boolean(revision?.available)}" data-decision="${e(selection.decision)}" data-hold="${displayedReviews.some((row) => row.readyForYoutube !== true) || Boolean(revision?.available && !revision.publicationReady)}" data-search="${e(`${lesson.id} ${lesson.title} ${lesson.group} ${status} ${selection.decision} ${revision?.status ?? ''}`.toLowerCase())}">
      <td><strong>${e(lesson.title)}</strong><br><code>${e(lesson.id)}</code><br><span class="pill ${issueCount || staleReviewCount || !currentReviewCount ? 'bad' : checkoutDiffers ? 'changed' : 'ok'}">${e(status)}</span></td>
      <td><strong class="${selection.decision === 'keep' ? 'keep' : selection.decision === 'skip' ? 'skip' : 'muted'}">${e(selectionStatus)}</strong><br><small>prior curation · score ${e(selection.selectionScore ?? '—')}${selection.movieCurrent ? '' : ' · movie changed'}${selection.sourceCurrent ? '' : ' · reviewed source changed'}${selection.matchesCurrentCheckout ? '' : ' · checkout source differs'}</small></td>
      <td>${Math.floor(lesson.video.duration / 60)}:${String(Math.floor(lesson.video.duration % 60)).padStart(2, '0')}<br><small>${e(lesson.group)}</small><br><a href="${e(videoPath)}">Baseline MP4</a> · <a href="${e(encodedPath)}">encoded review</a> · <a href="${e(contactPath)}">all sample frames</a>${atlasPath ? ` · <a href="${e(atlasPath)}">all-scenes motion atlas</a>` : ''}${motionPageLinks ? `<br><small>Four-scene atlas pages: ${motionPageLinks}${motionPagesIndexHref ? ` · <a href="${e(motionPagesIndexHref)}">page/frame metadata</a>` : ''}</small>` : ''}${additionalMaterialLinks ? `<br><small>Corrected scene materials: ${additionalMaterialLinks}</small>` : ''}${revision?.available ? `<br><strong>Replacement: ${e(revision.status)}</strong>${revisionMoviePath ? ` · <a href="${e(revisionMoviePath)}">revised MP4</a>` : ''}${revisionEncodedPath ? ` · <a href="${e(revisionEncodedPath)}">revised encoded review</a>` : ''}` : ''}</td>
      <td>${lesson.temporal.frames.toLocaleString()} / ${lesson.temporal.expectedFrames.toLocaleString()} frames<br>${(lesson.temporal.frameSampleCoverage * 100).toFixed(2)}% native image samples<br>${lesson.temporal.coveredBeatCount}/${lesson.temporal.beatCount} beats touched</td>
      <td>${lesson.structural.passed ? 'pass' : 'ISSUES'} · ${lesson.structural.issueFrames} issue frames<br>${lesson.temporal.unexplainedBlankRuns} unexplained blank runs<br>${lesson.artifactIntegrity.verifiedArtifacts}/${lesson.artifactIntegrity.declaredArtifacts} hashes verified</td>
      <td>${lesson.temporal.earlySettleCandidates.length} early-settle<br>${lesson.temporal.stillCandidates.length} long still<br>${lesson.temporal.highChangeCandidates.length} large-change candidates<br>${findingCount} reviewer findings / ${blockerCount} blockers</td>
      <td><details><summary>Evidence, timing and findings</summary><p><strong>${e(player.label)}</strong>${player.useRevision ? ' · baseline MP4 remains linked in the Movie column' : ''}</p><video controls preload="none" poster="${e(player.posterPath)}"><source src="${e(player.videoPath)}" type="video/mp4"><track kind="captions" srclang="en" label="English" src="${e(player.captionsPath)}"></video>
        <p><code>Player SHA-256 ${e(player.useRevision ? revision.movieSha256 : lesson.video.sha256)}</code></p><p>${reviewSummary}</p>
        <h4>Render-source provenance</h4><p>Checkout reproduces this baseline render: ${lesson.currentSource?.matchesCurrentCheckout ? 'yes' : 'no'} · reviewed MP4 SHA-256 ${e(lesson.video.sha256)} · baseline render-source fingerprint ${e(lesson.currentSource?.baselineFingerprint ?? 'unavailable')} · current checkout fingerprint ${e(lesson.currentSource?.fingerprint ?? 'unavailable')}.</p><p>Article ${e(lesson.source)}: ${lesson.currentSource?.articleCurrent ? 'unchanged' : 'changed or unavailable'} (baseline SHA-256 ${e(lesson.currentSource?.baselineArticleSha256 ?? 'unavailable')}; current SHA-256 ${e(lesson.currentSource?.articleSha256 ?? 'unavailable')}). TTS adapter ${e(lesson.currentSource?.adapterPath ?? 'unavailable')}: ${lesson.currentSource?.adapterSha256 === lesson.currentSource?.baselineAdapterSha256 ? 'unchanged' : 'changed'} (baseline SHA-256 ${e(lesson.currentSource?.baselineAdapterSha256 ?? 'unavailable')}; current SHA-256 ${e(lesson.currentSource?.adapterSha256 ?? 'unavailable')}). ${lesson.currentSource?.adapterMetadataOnlyChange ? 'The TTS source difference is only the uv PEP 723 release-age setting exclude-newer = P7D; edge-tts==7.3.1 and narration code match the baseline bytes.' : ''} Review and YouTube curation remain bound to the exact baseline MP4 and receipt above; source mismatch is reported separately as regeneration provenance.</p>
        ${
          revision?.available
            ? `<h4>Replacement: ${e(revision.status)}</h4><p>Automated verification ${revision.automatedVerificationPassed ? 'passed' : 'pending or failed'} · publication readiness ${revision.publicationReady ? 'ready' : 'pending'} · checkout source ${revision.matchesCurrentCheckout ? 'matches' : 'differs'} · captions ${e(revision.captions?.status ?? 'pending')} · audit bindings ${Object.values(revision.auditBindings ?? {}).filter(Boolean).length}/${Object.keys(revision.auditBindings ?? {}).length} current · human review ${e(revision.review?.status ?? 'pending')}.</p><p>${revisionMoviePath ? `<a href="${e(revisionMoviePath)}">Open replacement MP4</a>` : ''}${revisionEncodedPath ? ` · <a href="${e(revisionEncodedPath)}">Open replacement encoded review</a>` : ''} · SHA-256 ${e(revision.movieSha256 ?? 'pending')} · receipt source fingerprint ${e(revision.sourceFingerprint ?? 'pending')}</p>${revisionReviews}${
                revision.issues?.length
                  ? `<ul>${revision.issues
                      .slice(0, 10)
                      .map(
                        (issue) =>
                          `<li>${e(issue.label ?? issue.kind)}: ${e(issue.message ?? issue.kind)}</li>`,
                      )
                      .join('')}</ul>`
                  : ''
              }`
            : ''
        }
        <h4>Prior YouTube selection: ${e(selectionStatus)}</h4><p>${e(selection.reason || 'No curation rationale recorded.')}</p>${selection.revisitCondition ? `<p><strong>Revisit when:</strong> ${e(selection.revisitCondition)}</p>` : ''}
        ${mismatchRows ? `<h4>Artifact-integrity errors</h4><ul>${mismatchRows}</ul>` : ''}
        <h4>Temporal candidates <small>(screening cues; pauses can be intentional)</small></h4><ul>${candidateRows || '<li>None at configured thresholds.</li>'}</ul>
        ${atlasPath ? `<h4>All-scenes motion atlas</h4><p><a href="${e(atlasPath)}">Open master image</a> · ${lesson.motionAtlas.sceneCount} scenes, ${lesson.motionAtlas.sampleCount} native frames. Each scene shows the beat with the largest decoded motion sum.</p>` : ''}
        ${motionPageLinks ? `<h4>Readable atlas pages</h4><p>${motionPageLinks}</p>` : ''}
        ${additionalMaterialLinks ? `<h4>Corrected scene overview</h4><p>${additionalMaterialLinks}</p>` : ''}
        <h4>Scenes and sampled beats</h4>${scenes}<h4>Fresh reviewer records</h4>${reviewers}
      </details></td>
    </tr>`;
    })
    .join('\n');
  const reportJson = JSON.stringify(report)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" type="image/svg+xml" href="./leetllm-mark.svg"><title>LeetLLM video review coverage</title>
<style>
:root{color-scheme:dark;--bg:#10141d;--panel:#191f2b;--line:#30394a;--ink:#eef2f8;--muted:#aab5c7;--accent:#73d2f2;--good:#9be4ba;--warn:#ffd27e;--bad:#ff9f9f}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif}main{max-width:1680px;margin:auto;padding:28px}h1{font-size:clamp(1.8rem,3vw,2.7rem);margin:0 0 6px}.lede,.muted,small{color:var(--muted)}.keep{color:var(--good)}.skip{color:var(--warn)}.notice{background:#202a38;border-left:4px solid var(--accent);padding:14px 18px;margin:20px 0;border-radius:6px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:20px 0}.card{background:var(--panel);border:1px solid var(--line);padding:14px;border-radius:8px}.card strong{display:block;font-size:1.5rem}.controls{position:sticky;top:0;background:#10141df2;padding:12px 0;z-index:2}input{width:min(500px,100%);padding:11px 14px;border-radius:7px;background:var(--panel);color:var(--ink);border:1px solid var(--line)}.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:9px}table{border-collapse:collapse;width:100%;min-width:1300px}th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid var(--line)}th{position:sticky;top:59px;background:#1a202c;z-index:1}td{max-width:330px}code{font-size:.84em;color:#d0d8e4;overflow-wrap:anywhere}a{color:var(--accent)}.pill{display:inline-block;border-radius:99px;padding:1px 9px;font-size:.78rem;margin-top:4px}.ok{background:#16462e;color:var(--good)}.changed{background:#45402a;color:var(--warn)}.bad{background:#542a2a;color:var(--bad)}details{margin:4px 0}details>summary{cursor:pointer;color:var(--accent)}details[open]>summary{margin-bottom:10px}details video{width:min(860px,100%);background:#000;border-radius:8px}.scene{border-left:2px solid var(--line);padding-left:12px;margin:8px 0}.scene summary small{display:block}.scene ol{padding-left:24px}.scene li{margin:5px 0}.beat-label{color:var(--muted);margin-right:8px}.review{border:1px solid var(--line);border-radius:6px;padding:10px;margin:8px 0}.review h4{margin:0}.review ul{padding-left:20px}.review li{margin:6px 0}#coverage-note{font-size:.86rem}footer{margin:24px 0;color:var(--muted)}@media(max-width:700px){main{padding:14px}}
.controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center}.controls select{padding:11px 14px;border:1px solid var(--line);border-radius:7px;background:var(--panel);color:var(--ink);font:inherit}
body{overflow-wrap:anywhere}details video{aspect-ratio:16/9;object-fit:contain}
</style></head><body><main>
<h1>LeetLLM video review coverage</h1><p class="lede">${report.summary.lessonCount} baseline lesson exports · generated ${e(report.generatedAt)}</p>
<div class="notice"><strong>What this report can prove.</strong> Every movie received a complete temporal decode at ${report.summary.decodeWidth}×${report.summary.decodeHeight} grayscale and its stored artifact hashes were checked. High-resolution stills are sparse review anchors sampled around scene/beat boundaries, beat phases and selected motion peaks. They cover ${report.summary.nativeSamplePercent.toFixed(2)}% of decoded frames and give concrete visual inspection points. Human review is anchored to those samples; automated decode and structural checks cover the full temporal stream. Fresh review rows match the exact reviewed MP4, receipt fingerprint, and image evidence. Checkout reproducibility is reported separately; a changed fingerprint flags source regeneration work.</div>
<div class="notice"><strong>Current-source comparison.</strong> ${report.sourceProvenance.articleHashesMatchBaseline}/${report.summary.lessonCount} baseline article hashes match this checkout. ${report.sourceProvenance.matchesCurrentCheckout}/${report.summary.lessonCount} complete render-source fingerprints match. TTS adapter ${e(report.sourceProvenance.ttsAdapter.paths.join(', ') || 'unavailable')} baseline SHA-256 ${e(report.sourceProvenance.ttsAdapter.baselineSha256.join(', ') || 'unavailable')}; current SHA-256 ${e(report.sourceProvenance.ttsAdapter.currentSha256.join(', ') || 'unavailable')}. ${report.sourceProvenance.ttsAdapter.metadataOnlyChange ? 'Removing the added uv exclude-newer = P7D metadata reproduces the baseline adapter hash exactly; edge-tts==7.3.1 and narration code are unchanged.' : 'Adapter bytes are compared directly by SHA-256.'} Each full fingerprint covers the lesson YAML, animation module, renderer and shared sources, concept assets, npm lock, and TTS adapter. Per-lesson baseline and checkout fingerprints appear in the review details; they remain the source-regeneration signal.</div>
<div class="cards"><div class="card"><strong>${report.summary.selectionKeep}</strong>prior YouTube keeps</div><div class="card"><strong>${report.summary.selectionSkip}</strong>prior YouTube skips</div><div class="card"><strong>${report.summary.fullDecodePassed}/${report.summary.lessonCount}</strong>full temporal decode receipts pass</div><div class="card"><strong>${report.summary.structuralPass}/${report.summary.lessonCount}</strong>all-frame structural receipts pass</div><div class="card"><strong>${report.summary.artifactHashesPassed.toLocaleString()}</strong>artifact hashes checked</div><div class="card"><strong>${report.summary.totalFrames.toLocaleString()}</strong>decoded frames measured</div><div class="card"><strong>${report.summary.beatCoveragePercent.toFixed(1)}%</strong>beats with a high-resolution sample</div><div class="card"><strong>${report.summary.reviewerRowsCurrent}/${report.summary.reviewerRowsCurrent + report.summary.reviewerRowsStale}</strong>fresh reviews for exact baseline exports</div><div class="card"><strong>${report.summary.motionPagesPass}/${report.summary.lessonCount}</strong>four-scene atlas sets verified</div><div class="card"><strong>${report.summary.additionalMaterialsPass}/${report.summary.lessonCount}</strong>corrected overviews verified</div><div class="card"><strong>${report.summary.reproducibleSourceMatches}/${report.summary.lessonCount}</strong>baseline render inputs match this checkout</div>${revisionsRoot ? `<div class="card"><strong>${report.summary.revisionAutomatedVerificationPassed}/${report.summary.revisionLessonsFound}</strong>replacement automated checks passed</div><div class="card"><strong>${report.summary.revisionPublicationReady}/${report.summary.revisionLessonsFound}</strong>replacement publication ready</div><div class="card"><strong>${report.summary.revisionReviewsCurrent}/${report.summary.revisionLessonsFound}</strong>replacement reviews current · ${report.summary.revisionReviewsPending} pending · ${report.summary.revisionReviewsStale} stale</div>` : ''}</div>
<p id="coverage-note">The motion screen surfaces long still runs (≥${report.thresholds.longStillSeconds}s), early-settle candidates (≥${report.thresholds.earlySettleSeconds}s beginning in the first ${(report.thresholds.earlySettleFraction * 100).toFixed(0)}% of a narrated beat), and non-transition frame changes where ≥${(report.thresholds.highChangeFraction * 100).toFixed(0)}% of downscaled pixels change. These are cues for human review; intentional reading pauses and visual cuts can trigger them.</p>
<div class="notice">${report.reviewers.files.map((file) => `${e(file.name)}: ${e(file.status)}${file.status === 'loaded' ? ` (${file.lessons} lesson rows)` : ''}`).join(' · ')}${revisionsRoot ? `<br>Replacement reviewer file: ${e(report.revisions.reviewerFile.status)}${report.revisions.reviewerFile.status === 'loaded' ? ` (${report.revisions.reviewerFile.lessons} lesson rows)` : ''}` : ''}${report.summary.lessonsMissingFreshReview.length ? `<p><strong>Still awaiting fresh review:</strong> ${report.summary.lessonsMissingFreshReview.map(e).join(', ')}</p>` : ''}</div>
<div class="controls"><select id="review-filter" aria-label="Review collection"><option value="all">All lessons</option><option value="revised">Revised videos</option><option value="keep">Previously selected</option><option value="skip">Previously skipped</option><option value="hold">Needs review</option></select><input id="search" type="search" placeholder="Filter by lesson, title, group, or status" aria-label="Filter lessons"><span id="visible-count" class="muted"></span></div>
<div class="table-wrap"><table><thead><tr><th>Lesson</th><th>Prior YouTube selection</th><th>Movie</th><th>Temporal / visual samples</th><th>Automated receipts</th><th>Review cues</th><th>Inspect</th></tr></thead><tbody id="lessons">${lessons}</tbody></table></div>
<footer>Coverage report is local. Movies and images are linked by relative paths; keep this file beside the original build directories for links to work. Data snapshot: ${e(path.basename(report.jsonPath))}.</footer>
</main><script type="application/json" id="coverage-data">${reportJson}</script><script>
const input=document.querySelector('#search'),mode=document.querySelector('#review-filter'),rows=[...document.querySelectorAll('#lessons tr')],count=document.querySelector('#visible-count');const fragment=location.hash.slice(1);if([...mode.options].some(option=>option.value===fragment))mode.value=fragment;function filter(){const term=input.value.trim().toLowerCase();let shown=0;for(const row of rows){const selected=mode.value==='all'||mode.value==='revised'&&row.dataset.revised==='true'||mode.value==='hold'&&row.dataset.hold==='true'||row.dataset.decision===mode.value;const match=selected&&(!term||row.dataset.search.includes(term));row.hidden=!match;if(match)shown++}count.textContent=shown+' of '+rows.length+' lessons'}input.addEventListener('input',filter);mode.addEventListener('change',()=>{history.replaceState(null,'','#'+mode.value);filter()});filter();
</script></body></html>`;
}

const collection = await readJson(collectionPath);
const manifest = await readJson(path.join(inputRoot, 'manifest.json'));
const publicationSelection = await readJson(selectionPath);
if (!Array.isArray(manifest))
  throw new Error(`Expected a manifest array at ${path.join(inputRoot, 'manifest.json')}`);
const manifestById = new Map(manifest.map((row) => [row.id, row]));
const selectionById = new Map((publicationSelection.lessons ?? []).map((row) => [row.id, row]));
const lessons = collection.lessons ?? [];
if (
  manifestById.size !== lessons.length ||
  lessons.some((lesson) => !manifestById.has(lesson.id))
) {
  throw new Error(
    `Input manifest lesson set differs from ${collectionPath}; expected ${lessons.length}, received ${manifestById.size}`,
  );
}
if (
  selectionById.size !== lessons.length ||
  lessons.some((lesson) => !selectionById.has(lesson.id))
) {
  throw new Error(
    `YouTube selection lesson set differs from ${collectionPath}; expected ${lessons.length}, received ${selectionById.size}`,
  );
}

const commonRenderSources = [
  'videos/render.mjs',
  'videos/lib/scene.mjs',
  'videos/lib/lesson.mjs',
  'videos/lib/delivery.mjs',
  'videos/lib/brand.mjs',
  'videos/lib/frame-audit.mjs',
  'videos/lib/layout-review.mjs',
  'videos/assets/leetllm-mark.svg',
  'videos/package-lock.json',
  ...conceptSourceFiles().map((file) => `videos/${file}`),
];
const commonRenderBytes = await Promise.all(
  commonRenderSources.map((file) => fs.readFile(path.resolve(repoRoot, file))),
);
const currentSourceById = new Map(
  await Promise.all(
    lessons.map(async (lesson) => {
      const canonicalReceiptPath = path.join(inputRoot, lesson.id, 'verification.json');
      try {
        const receipt = await readJson(canonicalReceiptPath);
        const adapter = receipt.ttsAdapter;
        if (!adapter?.path || !adapter.sha256)
          throw new Error('baseline receipt has no TTS adapter provenance');
        const [lessonBytes, animationBytes, adapterBytes] = await Promise.all([
          fs.readFile(path.resolve(repoRoot, 'videos/lessons', `${lesson.id}.lesson.yaml`)),
          fs.readFile(path.resolve(repoRoot, 'videos/animations', `${lesson.id}.mjs`)),
          fs.readFile(path.resolve(repoRoot, adapter.path)),
        ]);
        const adapterSha256 = createHash('sha256').update(adapterBytes).digest('hex');
        const adapterMetadataOnlyChange = hasOnlyUvReleaseAgeMetadataChanged(
          adapterBytes,
          adapter.sha256,
        );
        const fingerprint = createHash('sha256')
          .update(
            Buffer.concat([
              lessonBytes,
              animationBytes,
              ...commonRenderBytes,
              renderEngineBytes(),
              adapterBytes,
            ]),
          )
          .digest('hex');
        const articleSha256 = await actualSha256(
          path.resolve(repoRoot, 'web/src/content', lesson.source),
        );
        return [
          lesson.id,
          {
            baselineFingerprint: receipt.fingerprint,
            fingerprint,
            fingerprintCurrent: fingerprint === receipt.fingerprint,
            adapterPath: adapter.path,
            adapterSha256,
            baselineAdapterSha256: adapter.sha256,
            adapterMetadataOnlyChange,
            baselineArticleSha256: receipt.sourceSha256,
            articleSha256,
            articleCurrent:
              receipt.source === lesson.source && receipt.sourceSha256 === articleSha256,
            matchesCurrentCheckout:
              fingerprint === receipt.fingerprint &&
              receipt.source === lesson.source &&
              receipt.sourceSha256 === articleSha256,
            matches:
              fingerprint === receipt.fingerprint &&
              receipt.source === lesson.source &&
              receipt.sourceSha256 === articleSha256,
            error: null,
          },
        ];
      } catch (error) {
        return [
          lesson.id,
          {
            baselineFingerprint: null,
            fingerprint: null,
            fingerprintCurrent: false,
            adapterPath: null,
            adapterSha256: null,
            baselineAdapterSha256: null,
            adapterMetadataOnlyChange: false,
            baselineArticleSha256: null,
            articleSha256: null,
            articleCurrent: false,
            matchesCurrentCheckout: false,
            matches: false,
            error: error.message,
          },
        ];
      }
    }),
  ),
);

const reviewerExpectedById = new Map(
  lessons.map((lesson) => [lesson.id, manifestById.get(lesson.id)]),
);

const { reviewers, files: reviewerFiles } = await readReviewerFiles(reviewerRoot, 5);
const reviewerRowsByLesson = summarizeReviewerRows(reviewers, reviewerExpectedById);
let revisionReviewers = [];
let revisionReviewerFile = {
  status: revisionsRoot ? 'pending' : 'not-requested',
  lessons: 0,
  path: revisionsRoot ? path.join(reviewerRoot, 'reviewer-revisions.json') : null,
};
if (revisionsRoot) {
  try {
    const payload = await readJson(revisionReviewerFile.path);
    const sources = Array.isArray(payload.reviewers) ? payload.reviewers : [payload];
    revisionReviewers = sources.map((reviewer, index) => ({
      name: reviewer.reviewer ?? `revision-reviewer-${index + 1}`,
      lessons: normalizeReviewerPayload(reviewer, `revision-reviewer-${index + 1}`),
    }));
    revisionReviewerFile = {
      ...revisionReviewerFile,
      status: 'loaded',
      lessons: revisionReviewers.reduce((sum, reviewer) => sum + reviewer.lessons.length, 0),
    };
  } catch (error) {
    if (error.code !== 'ENOENT')
      revisionReviewerFile = { ...revisionReviewerFile, status: 'invalid', error: error.message };
  }
}
const revisionRowsByLesson = new Map();
for (const reviewer of revisionReviewers)
  for (const row of reviewer.lessons) {
    const rows = revisionRowsByLesson.get(row.id) ?? [];
    rows.push(row);
    revisionRowsByLesson.set(row.id, rows);
  }
if (refreshDecodeRoot) {
  await fs.mkdir(refreshDecodeRoot, { recursive: true });
  const existing = await fs.readdir(refreshDecodeRoot);
  if (existing.length)
    throw new Error(
      `Refreshed decode directory must be empty; refusing to replace files under ${refreshDecodeRoot}`,
    );
}
const evidenceIssues = [];

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  collection: {
    id: collection.id,
    title: collection.title,
    source: path.relative(repoRoot, collectionPath),
  },
  publicationSelectionSource: path.relative(repoRoot, selectionPath),
  revisions: { directory: revisionsRoot, reviewerFile: revisionReviewerFile },
  refreshedDecodeRoot: refreshDecodeRoot,
  inputRoot,
  outputPath: outputRoot,
  jsonPath: path.join(outputRoot, 'coverage.json'),
  thresholds: null,
  reviewers: { directory: reviewerRoot, files: reviewerFiles },
  summary: {
    lessonCount: lessons.length,
    fullDecodePassed: 0,
    structuralPass: 0,
    totalFrames: 0,
    expectedFrames: 0,
    totalNativeSampleFrames: 0,
    totalNativeSamples: 0,
    coveredBeats: 0,
    totalBeats: 0,
    artifactHashesPassed: 0,
    artifactHashFailures: 0,
    reviewerRowsCurrent: 0,
    reviewerRowsStale: 0,
    reviewerFindings: 0,
    reviewerBlockers: 0,
    longStillCandidates: 0,
    earlySettleCandidates: 0,
    highChangeCandidates: 0,
    selectionKeep: 0,
    selectionSkip: 0,
    selectionStale: 0,
    motionAtlasPass: 0,
    motionPagesPass: 0,
    motionPageImagesPass: 0,
    additionalMaterialsPass: 0,
    currentSourceMatched: 0,
    reproducibleSourceMatches: 0,
    currentSourceStale: 0,
    revisionLessonsFound: 0,
    revisionRenderPass: 0,
    revisionEncodedReviewPass: 0,
    revisionStructuralAuditPass: 0,
    revisionAutomatedVerificationPassed: 0,
    revisionPublicationReady: 0,
    revisionReviewsCurrent: 0,
    revisionReviewsPending: 0,
    revisionReviewsStale: 0,
    refreshedDecodePass: 0,
  },
  integrityIssues: evidenceIssues,
  lessons: [],
};

let decodeWidth = null;
let decodeHeight = null;
let nativeSampleRows = 0;
let additionalMaterialsAvailable = false;
try {
  additionalMaterialsAvailable = (await fs.stat(additionalMaterialsRoot)).isDirectory();
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
for (const catalogLesson of lessons) {
  const id = catalogLesson.id;
  const lessonDir = path.join(inputRoot, id);
  const moviePath = path.join(lessonDir, `${id}.mp4`);
  const receiptPath = path.join(lessonDir, 'verification.json');
  const timelinePath = path.join(lessonDir, 'timeline.json');
  const occlusionPath = path.join(lessonDir, 'aggregate-occlusion.json');
  const encodedDir = path.join(lessonDir, 'encoded-review');
  const encodedPath = path.join(encodedDir, 'verification.json');
  const auditPath = path.join(encodedDir, 'decoded-frame-audit.json');
  const metricsPath = path.join(encodedDir, 'decoded-frame-metrics.json');
  const lessonYamlPath = path.resolve(repoRoot, 'videos/lessons', `${id}.lesson.yaml`);
  const [manifestRow, receipt, timeline, occlusion, encoded, audit, authoredLesson] =
    await Promise.all([
      Promise.resolve(manifestById.get(id)),
      readJson(receiptPath),
      readJson(timelinePath),
      readJson(occlusionPath),
      readJson(encodedPath),
      readJson(auditPath),
      fs.readFile(lessonYamlPath, 'utf8').then(parse),
    ]);
  const metrics = await readJson(metricsPath);
  const hashIssues = [];
  const movie = await checkArtifact(moviePath, manifestRow.sha256, 'manifest:movie', hashIssues);
  const receiptMovie = await checkArtifact(moviePath, receipt.sha256, 'receipt:movie', hashIssues);
  const encodedMovie = encoded.videoSha256 === manifestRow.sha256;
  if (!encodedMovie)
    hashIssues.push({
      path: encodedPath,
      label: 'encoded-review:movie',
      expected: manifestRow.sha256,
      actual: encoded.videoSha256,
      kind: 'hash-mismatch',
    });
  const occlusionMovie = occlusion.videoSha256 === manifestRow.sha256;
  if (!occlusionMovie)
    hashIssues.push({
      path: occlusionPath,
      label: 'occlusion:movie',
      expected: manifestRow.sha256,
      actual: occlusion.videoSha256,
      kind: 'hash-mismatch',
    });
  if (receipt.fingerprint !== manifestRow.fingerprint)
    hashIssues.push({
      path: receiptPath,
      label: 'manifest:source-fingerprint',
      expected: manifestRow.fingerprint,
      actual: receipt.fingerprint,
      kind: 'fingerprint-mismatch',
    });
  if (authoredLesson.id !== id)
    hashIssues.push({
      path: lessonYamlPath,
      label: 'lesson:id',
      expected: id,
      actual: authoredLesson.id,
      kind: 'lesson-mismatch',
    });
  const rootIntegrity = await verifyHashMap(
    lessonDir,
    receipt.artifactSha256,
    'receipt-artifact',
    hashIssues,
  );
  const encodedIntegrity = await verifyHashMap(
    encodedDir,
    encoded.artifactSha256,
    'encoded-artifact',
    hashIssues,
  );
  const metricsRows = Array.isArray(metrics) ? metrics.length : 0;
  if (metricsRows !== audit.frames)
    hashIssues.push({
      path: metricsPath,
      label: 'decoded-metrics:frame-count',
      expected: audit.frames,
      actual: metricsRows,
      kind: 'frame-count-mismatch',
    });
  let refreshedDecode = null;
  if (refreshDecodeRoot) {
    try {
      refreshedDecode = await refreshDecodeAudit(
        moviePath,
        timeline,
        manifestRow.sha256,
        path.join(refreshDecodeRoot, id),
      );
      if (
        refreshedDecode.frames !== audit.frames ||
        refreshedDecode.expectedFrames !== audit.expectedFrames
      ) {
        refreshedDecode.passed = false;
        refreshedDecode.error = 'Refreshed frame count differs from the hash-bound stored audit';
      }
      if (refreshedDecode.passed) report.summary.refreshedDecodePass += 1;
    } catch (error) {
      refreshedDecode = {
        path: path.join(refreshDecodeRoot, id),
        passed: false,
        error: error.message,
      };
    }
  }

  const fps =
    Number(String(receipt.fps ?? timeline.fps ?? 30).split('/')[0]) /
    Number(String(receipt.fps ?? timeline.fps ?? 30).split('/')[1] ?? 1);
  const sceneCoverage = buildSceneCoverage({
    timeline,
    lesson: authoredLesson,
    encodedReview: encoded,
    audit,
    fps,
  });
  const currentSource = currentSourceById.get(id);
  const reviewerRows = reviewerRowsByLesson.get(id) ?? [];
  for (const row of reviewerRows) {
    row._coverageEvidenceIntegrity = await verifyBaselineReviewerImages(
      row,
      id,
      manifestRow,
      encodedDir,
      encoded,
    );
  }
  const reviewerDetails = reviewerRows.map((row) => {
    const evidenceIntegrity = row._coverageEvidenceIntegrity ?? [];
    const viewedImages = Array.isArray(row.viewedImages) ? row.viewedImages : [];
    const evidencePassed =
      viewedImages.length > 0 &&
      evidenceIntegrity.length === viewedImages.length &&
      evidenceIntegrity.every((item) => item.passed);
    return {
      ...row,
      ...classifyArtifactReview(row, manifestRow, {
        matchesCurrentCheckout: Boolean(currentSource?.matchesCurrentCheckout),
        evidencePassed,
      }),
      evidenceIntegrity,
    };
  });
  const currentReviewerRows = reviewerDetails.filter((row) => !row.stale);
  const priorSelection = {
    ...reconcilePublicationSelection(selectionById.get(id), {
      sha256: manifestRow.sha256,
      fingerprint: manifestRow.fingerprint,
    }),
    matchesCurrentCheckout: Boolean(currentSource?.matchesCurrentCheckout),
  };
  const revision = await inspectRevisionLesson(id, catalogLesson);
  if (priorSelection.decision === 'keep') report.summary.selectionKeep += 1;
  if (priorSelection.decision === 'skip') report.summary.selectionSkip += 1;
  if (priorSelection.stale) report.summary.selectionStale += 1;
  const atlasImagePath = path.join(outputRoot, 'materials', id, 'motion-all-scenes.png');
  const atlasJsonPath = path.join(outputRoot, 'materials', id, 'motion-all-scenes.json');
  let motionAtlas = null;
  let atlasData = null;
  try {
    const atlas = await readJson(atlasJsonPath);
    atlasData = atlas;
    const atlasIssues = [];
    const imageSha256 = await actualSha256(atlasImagePath);
    if (atlas.imageSha256 !== imageSha256)
      atlasIssues.push({
        path: atlasImagePath,
        label: 'motion-atlas:image',
        expected: atlas.imageSha256,
        actual: imageSha256,
        kind: 'hash-mismatch',
      });
    if (atlas.movieSha256 !== manifestRow.sha256)
      atlasIssues.push({
        path: atlasJsonPath,
        label: 'motion-atlas:movie',
        expected: manifestRow.sha256,
        actual: atlas.movieSha256,
        kind: 'hash-mismatch',
      });
    if (atlas.sourceFingerprint !== manifestRow.fingerprint)
      atlasIssues.push({
        path: atlasJsonPath,
        label: 'motion-atlas:source',
        expected: manifestRow.fingerprint,
        actual: atlas.sourceFingerprint,
        kind: 'fingerprint-mismatch',
      });
    for (const scene of atlas.scenes ?? [])
      for (const sample of scene.samples ?? []) {
        const samplePath = path.resolve(repoRoot, sample.path);
        const relative = path.relative(encodedDir, samplePath).split(path.sep).join('/');
        if (encoded.artifactSha256?.[relative] !== sample.sha256) {
          atlasIssues.push({
            path: samplePath,
            label: `motion-atlas:${scene.scene}:${sample.phase}`,
            expected: encoded.artifactSha256?.[relative],
            actual: sample.sha256,
            kind: 'hash-mismatch',
          });
        }
      }
    if ((atlas.scenes ?? []).length !== timeline.scenes.length)
      atlasIssues.push({
        path: atlasJsonPath,
        label: 'motion-atlas:scene-count',
        expected: timeline.scenes.length,
        actual: atlas.scenes?.length ?? 0,
        kind: 'scene-count-mismatch',
      });
    hashIssues.push(...atlasIssues);
    motionAtlas = {
      imagePath: atlasImagePath,
      jsonPath: atlasJsonPath,
      imageSha256,
      sceneCount: atlas.scenes?.length ?? 0,
      sampleCount: (atlas.scenes ?? []).reduce(
        (sum, scene) => sum + (scene.samples?.length ?? 0),
        0,
      ),
      passed: atlasIssues.length === 0,
      issues: atlasIssues,
    };
  } catch (error) {
    if (error.code !== 'ENOENT')
      hashIssues.push({
        path: atlasJsonPath,
        label: 'motion-atlas:read',
        kind: 'read-error',
        message: error.message,
      });
  }
  const motionPagesIndexPath = path.join(outputRoot, 'materials', id, 'motion-pages.json');
  let motionPages = null;
  if (motionAtlas) {
    try {
      const pageIndex = await readJson(motionPagesIndexPath);
      const pageIssues = [];
      const indexSha256 = await actualSha256(motionPagesIndexPath);
      if (pageIndex.id !== id)
        pageIssues.push({
          path: motionPagesIndexPath,
          label: 'motion-pages:id',
          expected: id,
          actual: pageIndex.id,
          kind: 'lesson-mismatch',
        });
      if (pageIndex.movieSha256 !== manifestRow.sha256)
        pageIssues.push({
          path: motionPagesIndexPath,
          label: 'motion-pages:movie',
          expected: manifestRow.sha256,
          actual: pageIndex.movieSha256,
          kind: 'hash-mismatch',
        });
      if (pageIndex.sourceFingerprint !== manifestRow.fingerprint)
        pageIssues.push({
          path: motionPagesIndexPath,
          label: 'motion-pages:source',
          expected: manifestRow.fingerprint,
          actual: pageIndex.sourceFingerprint,
          kind: 'fingerprint-mismatch',
        });
      if (pageIndex.scenesPerPage !== 4)
        pageIssues.push({
          path: motionPagesIndexPath,
          label: 'motion-pages:page-size',
          expected: 4,
          actual: pageIndex.scenesPerPage,
          kind: 'page-size-mismatch',
        });
      if (pageIndex.masterAtlas?.sha256 !== motionAtlas.imageSha256)
        pageIssues.push({
          path: motionPagesIndexPath,
          label: 'motion-pages:master-atlas',
          expected: motionAtlas.imageSha256,
          actual: pageIndex.masterAtlas?.sha256,
          kind: 'hash-mismatch',
        });
      if (
        path.resolve(repoRoot, pageIndex.masterAtlas?.path ?? '') !== path.resolve(atlasImagePath)
      )
        pageIssues.push({
          path: motionPagesIndexPath,
          label: 'motion-pages:master-path',
          expected: atlasImagePath,
          actual: pageIndex.masterAtlas?.path,
          kind: 'path-mismatch',
        });
      const expectedPages = paginateMotionScenes(atlasData.scenes ?? [], 4);
      if (pageIndex.pages?.length !== expectedPages.length)
        pageIssues.push({
          path: motionPagesIndexPath,
          label: 'motion-pages:count',
          expected: expectedPages.length,
          actual: pageIndex.pages?.length ?? 0,
          kind: 'page-count-mismatch',
        });
      const pages = [];
      let passedImages = 0;
      for (const [index, expectedPage] of expectedPages.entries()) {
        const page = pageIndex.pages?.[index];
        if (!page) continue;
        const pagePath = path.resolve(repoRoot, page.path ?? '');
        const expectedSceneIds = expectedPage.scenes.map((scene) => scene.scene);
        if (
          page.page !== expectedPage.page ||
          JSON.stringify(page.sceneIds) !== JSON.stringify(expectedSceneIds)
        ) {
          pageIssues.push({
            path: motionPagesIndexPath,
            label: `motion-pages:page-${expectedPage.page}-scenes`,
            expected: expectedSceneIds,
            actual: page.sceneIds,
            kind: 'scene-page-mismatch',
          });
        }
        if (!isWithin(outputRoot, pagePath)) {
          pageIssues.push({
            path: pagePath,
            label: `motion-pages:page-${expectedPage.page}-path`,
            kind: 'outside-review-output',
          });
        } else {
          const checked = await checkArtifact(
            pagePath,
            page.sha256,
            `motion-pages:page-${expectedPage.page}`,
            pageIssues,
          );
          if (checked.passed) passedImages += 1;
        }
        if (page.width !== 1536 || page.height !== 356 * expectedPage.scenes.length) {
          pageIssues.push({
            path: pagePath,
            label: `motion-pages:page-${expectedPage.page}-dimensions`,
            expected: { width: 1536, height: 356 * expectedPage.scenes.length },
            actual: { width: page.width, height: page.height },
            kind: 'dimensions-mismatch',
          });
        }
        pages.push({
          page: page.page,
          path: pagePath,
          width: page.width,
          height: page.height,
          firstScene: page.firstScene,
          lastScene: page.lastScene,
          sceneIds: page.sceneIds,
          scenes: expectedPage.scenes.map((scene) => ({ scene: scene.scene, title: scene.title })),
        });
      }
      hashIssues.push(...pageIssues);
      motionPages = {
        indexPath: motionPagesIndexPath,
        indexSha256,
        sceneCount: pageIndex.sceneCount,
        scenesPerPage: pageIndex.scenesPerPage,
        pages,
        pageCount: pageIndex.pages?.length ?? 0,
        imageCountPassed: passedImages,
        passed: pageIssues.length === 0 && passedImages === expectedPages.length,
        issues: pageIssues,
      };
    } catch (error) {
      if (error.code !== 'ENOENT')
        hashIssues.push({
          path: motionPagesIndexPath,
          label: 'motion-pages:read',
          kind: 'read-error',
          message: error.message,
        });
      else
        hashIssues.push({
          path: motionPagesIndexPath,
          label: 'motion-pages:index',
          kind: 'missing',
        });
    }
  }
  let additionalMaterials = null;
  if (additionalMaterialsAvailable) {
    const materialPath = path.join(additionalMaterialsRoot, id, 'material.json');
    try {
      const material = await readJson(materialPath);
      const materialIssues = [];
      if (
        material.id !== id ||
        material.movieSha256 !== manifestRow.sha256 ||
        material.sourceFingerprint !== manifestRow.fingerprint
      ) {
        materialIssues.push({
          path: materialPath,
          label: 'corrected-material:binding',
          expected: {
            id,
            movieSha256: manifestRow.sha256,
            sourceFingerprint: manifestRow.fingerprint,
          },
          actual: {
            id: material.id,
            movieSha256: material.movieSha256,
            sourceFingerprint: material.sourceFingerprint,
          },
          kind: 'stale-material',
        });
      }
      const assets = [];
      for (const [key, label] of [
        ['sceneOverview', 'Corrected scene overview'],
        ['motionOverview', 'Declared-motion overview'],
      ]) {
        const metadata = material[key];
        if (!metadata?.path || !metadata.sha256) {
          materialIssues.push({
            path: materialPath,
            label: `corrected-material:${key}`,
            kind: 'missing-asset-metadata',
          });
          continue;
        }
        const assetPath = path.resolve(repoRoot, metadata.path);
        const checked = await checkArtifact(
          assetPath,
          metadata.sha256,
          `corrected-material:${key}`,
          materialIssues,
        );
        assets.push({ path: assetPath, label, passed: checked.passed });
      }
      hashIssues.push(...materialIssues);
      additionalMaterials = { path: materialPath, assets, passed: materialIssues.length === 0 };
    } catch (error) {
      if (error.code !== 'ENOENT')
        hashIssues.push({
          path: materialPath,
          label: 'corrected-material:read',
          kind: 'read-error',
          message: error.message,
        });
      else
        hashIssues.push({
          path: materialPath,
          label: 'corrected-material:bundle',
          kind: 'missing',
        });
    }
  }
  if (sceneCoverage.scenes.some((scene) => !scene.titlePresent)) {
    hashIssues.push({
      path: lessonYamlPath,
      label: 'authored-scene-titles',
      kind: 'missing-scene-title',
    });
  }
  const mismatches = [
    ...hashIssues,
    ...evidenceIssues.filter((issue) => issue.label?.includes(`:${id}:`)),
  ];
  const pageArtifactsDeclared = Number(motionPages !== null) + (motionPages?.pageCount ?? 0);
  const pageArtifactsPassed =
    Number(Boolean(motionPages?.passed)) + (motionPages?.imageCountPassed ?? 0);
  const correctedAssetsDeclared = additionalMaterials?.assets.length ?? 0;
  const correctedAssetsPassed =
    additionalMaterials?.assets.filter((asset) => asset.passed).length ?? 0;
  const verifiedArtifacts =
    rootIntegrity.passed +
    encodedIntegrity.passed +
    Number(movie.passed) +
    Number(receiptMovie.passed) +
    Number(motionAtlas?.passed) +
    pageArtifactsPassed +
    correctedAssetsPassed;
  const declaredArtifacts =
    rootIntegrity.declared +
    encodedIntegrity.declared +
    2 +
    Number(motionAtlas !== null) +
    pageArtifactsDeclared +
    correctedAssetsDeclared;
  const actualVideoStat = await fs.stat(moviePath);
  const lessonReport = {
    id,
    title: catalogLesson.title,
    group: catalogLesson.group,
    source: catalogLesson.source,
    currentSource,
    revision,
    video: {
      path: moviePath,
      sha256: await actualSha256(moviePath),
      expectedSha256: manifestRow.sha256,
      bytes: actualVideoStat.size,
      duration: receipt.duration,
      width: receipt.width,
      height: receipt.height,
      fps: receipt.fps,
      audioCodec: receipt.audioCodec,
      frames: receipt.frameAudit?.frames ?? Math.round(receipt.duration * fps),
    },
    encodedReview: {
      path: path.join(lessonDir, 'encoded-review', 'index.html'),
      contactSheet: path.join(encodedDir, 'contact-sheet.png'),
      sampleCount: sceneCoverage.sampleCount,
      distinctSampleFrames: sceneCoverage.sampledFrames,
    },
    structural: {
      passed:
        occlusion.passed === true &&
        occlusion.frames === occlusion.expectedFrames &&
        occlusion.issueFrames === 0,
      frames: occlusion.frames,
      expectedFrames: occlusion.expectedFrames,
      issueFrames: occlusion.issueFrames,
      issues: occlusion.issues ?? [],
      videoHashBound: occlusionMovie,
    },
    temporal: {
      passed:
        audit.passed === true &&
        audit.decodePassed === true &&
        audit.frames === audit.expectedFrames,
      frames: audit.frames,
      expectedFrames: audit.expectedFrames,
      width: audit.width,
      height: audit.height,
      metricsRows,
      blankRuns: (audit.blankRuns ?? []).length,
      unexplainedBlankRuns: (audit.unexplainedBlankRuns ?? []).length,
      fullDecode: audit.decodePassed === true,
      frameSampleCoverage: sceneCoverage.frameSampleCoverage,
      sampledFrames: sceneCoverage.sampledFrames,
      sampleCount: sceneCoverage.sampleCount,
      beatCount: sceneCoverage.beatCount,
      coveredBeatCount: sceneCoverage.coveredBeatCount,
      beatSampleCoverage: sceneCoverage.beatSampleCoverage,
      stillCandidates: sceneCoverage.stillCandidates,
      earlySettleCandidates: sceneCoverage.earlySettleCandidates,
      nonTransitionPeakCount: sceneCoverage.nonTransitionPeakCount,
      highChangeCandidates: sceneCoverage.highChangeCandidates,
      thresholds: sceneCoverage.thresholds,
      interpretation: audit.interpretation,
    },
    refreshedDecode,
    scenes: sceneCoverage.scenes,
    motionAtlas,
    motionPages,
    additionalMaterials,
    reviewers: reviewerDetails,
    publicationSelection: priorSelection,
    artifactIntegrity: {
      passed: mismatches.length === 0 && verifiedArtifacts === declaredArtifacts,
      verifiedArtifacts,
      declaredArtifacts,
      rootArtifactMap: rootIntegrity,
      encodedArtifactMap: encodedIntegrity,
      movieHashBound: movie.passed && receiptMovie.passed && encodedMovie && occlusionMovie,
      mismatches,
    },
  };
  if (audit.width && audit.height) {
    decodeWidth ??= audit.width;
    decodeHeight ??= audit.height;
    if (audit.width !== decodeWidth || audit.height !== decodeHeight) {
      lessonReport.temporal.resolutionConsistent = false;
    } else lessonReport.temporal.resolutionConsistent = true;
  }
  report.lessons.push(lessonReport);

  report.summary.totalFrames += audit.frames ?? 0;
  report.summary.expectedFrames += audit.expectedFrames ?? 0;
  report.summary.totalNativeSampleFrames += sceneCoverage.sampledFrames;
  report.summary.totalNativeSamples += sceneCoverage.sampleCount;
  report.summary.coveredBeats += sceneCoverage.coveredBeatCount;
  report.summary.totalBeats += sceneCoverage.beatCount;
  report.summary.artifactHashesPassed += verifiedArtifacts;
  report.summary.artifactHashFailures += mismatches.length;
  report.summary.reviewerRowsCurrent += currentReviewerRows.length;
  report.summary.reviewerRowsStale += reviewerRows.length - currentReviewerRows.length;
  report.summary.reviewerFindings += reviewerDetails.reduce(
    (sum, row) => sum + row.findings.length,
    0,
  );
  report.summary.reviewerBlockers += reviewerDetails.reduce(
    (sum, row) => sum + row.blockers.length,
    0,
  );
  report.summary.longStillCandidates += sceneCoverage.stillCandidates.length;
  report.summary.earlySettleCandidates += sceneCoverage.earlySettleCandidates.length;
  report.summary.highChangeCandidates += sceneCoverage.highChangeCandidates.length;
  nativeSampleRows += sceneCoverage.sampleCount;
  if (lessonReport.temporal.passed) report.summary.fullDecodePassed += 1;
  if (lessonReport.structural.passed) report.summary.structuralPass += 1;
  if (lessonReport.artifactIntegrity.passed)
    report.summary.artifactIntegrityPass = (report.summary.artifactIntegrityPass ?? 0) + 1;
  if (motionAtlas?.passed) report.summary.motionAtlasPass += 1;
  if (motionPages?.passed) report.summary.motionPagesPass += 1;
  report.summary.motionPageImagesPass += motionPages?.imageCountPassed ?? 0;
  if (additionalMaterials?.passed) report.summary.additionalMaterialsPass += 1;
  if (currentSource?.matchesCurrentCheckout) {
    report.summary.currentSourceMatched += 1;
    report.summary.reproducibleSourceMatches += 1;
  } else report.summary.currentSourceStale += 1;
  if (revision?.available) report.summary.revisionLessonsFound += 1;
  if (revision?.renderPassed) report.summary.revisionRenderPass += 1;
  if (revision?.encodedReview?.passed) report.summary.revisionEncodedReviewPass += 1;
  if (revision?.structuralAudit?.passed) report.summary.revisionStructuralAuditPass += 1;
  if (revision?.automatedVerificationPassed)
    report.summary.revisionAutomatedVerificationPassed += 1;
  if (revision?.publicationReady) report.summary.revisionPublicationReady += 1;
  if (revision?.review?.status === 'current') report.summary.revisionReviewsCurrent += 1;
  else if (revision?.available && revision?.review?.status === 'pending')
    report.summary.revisionReviewsPending += 1;
  else if (revision?.available) report.summary.revisionReviewsStale += 1;
}

report.thresholds = report.lessons[0]?.temporal.thresholds ?? null;
report.summary.decodeWidth = decodeWidth;
report.summary.decodeHeight = decodeHeight;
report.summary.nativeSamplePercent = report.summary.totalFrames
  ? (report.summary.totalNativeSampleFrames / report.summary.totalFrames) * 100
  : 0;
report.summary.beatCoveragePercent = report.summary.totalBeats
  ? (report.summary.coveredBeats / report.summary.totalBeats) * 100
  : 0;
report.summary.totalVideoBytes = report.lessons.reduce(
  (sum, lesson) => sum + lesson.video.bytes,
  0,
);
report.summary.totalVideoGiB = report.summary.totalVideoBytes / 2 ** 30;
report.summary.artifactIntegrityPass ??= 0;
report.summary.artifactHashesDeclared = report.lessons.reduce(
  (sum, lesson) => sum + lesson.artifactIntegrity.declaredArtifacts,
  0,
);
report.summary.artifactHashesPassed = report.lessons.reduce(
  (sum, lesson) => sum + lesson.artifactIntegrity.verifiedArtifacts,
  0,
);
report.summary.artifactHashFailures = report.lessons.reduce(
  (sum, lesson) => sum + lesson.artifactIntegrity.mismatches.length,
  0,
);
report.summary.reviewFilesPending = reviewerFiles.filter(
  (file) => file.status === 'pending',
).length;
report.summary.reviewFilesInvalid = reviewerFiles.filter(
  (file) => file.status === 'invalid',
).length;
report.summary.reviewerRowsStale = report.lessons.reduce(
  (sum, lesson) => sum + lesson.reviewers.filter((row) => row.stale).length,
  0,
);
report.summary.reviewerRowsCurrent = report.lessons.reduce(
  (sum, lesson) => sum + lesson.reviewers.filter((row) => !row.stale).length,
  0,
);
report.summary.lessonsWithFreshReview = report.lessons.filter((lesson) =>
  lesson.reviewers.some((row) => !row.stale),
).length;
report.summary.lessonsMissingFreshReview = report.lessons
  .filter((lesson) => !lesson.reviewers.some((row) => !row.stale))
  .map((lesson) => lesson.id);
report.summary.reviewImageHashFailures = evidenceIssues.length;
report.summary.hashBytesRead = hashedBytes;
report.summary.hashFilesRead = hashCache.size;
const sourceRows = report.lessons.map((lesson) => lesson.currentSource).filter(Boolean);
const uniqueValues = (values) => [...new Set(values.filter(Boolean))];
const baselineAdapterHashes = uniqueValues(
  sourceRows.map((source) => source.baselineAdapterSha256),
);
const currentAdapterHashes = uniqueValues(sourceRows.map((source) => source.adapterSha256));
const adapterPaths = uniqueValues(sourceRows.map((source) => source.adapterPath));
const adapterMetadataOnlyCount = sourceRows.filter(
  (source) => source.adapterMetadataOnlyChange,
).length;
report.sourceProvenance = {
  baselineReviewBinding:
    'exact MP4 SHA-256, baseline receipt fingerprint, and reviewed image hashes',
  matchesCurrentCheckout: report.summary.reproducibleSourceMatches,
  currentCheckoutMismatches: report.summary.currentSourceStale,
  articleHashesMatchBaseline: report.lessons.filter(
    (lesson) => lesson.currentSource?.articleCurrent,
  ).length,
  ttsAdapter: {
    paths: adapterPaths,
    baselineSha256: baselineAdapterHashes,
    currentSha256: currentAdapterHashes,
    changedReceipts: sourceRows.filter(
      (source) => source.adapterSha256 !== source.baselineAdapterSha256,
    ).length,
    metadataOnlyReceipts: adapterMetadataOnlyCount,
    metadataOnlyChange: adapterMetadataOnlyCount === sourceRows.length && sourceRows.length > 0,
  },
};

await fs.mkdir(outputRoot, { recursive: true });
await fs.writeFile(report.jsonPath, `${JSON.stringify(report, null, 2)}\n`);
await fs.copyFile(
  path.join(repoRoot, 'videos/assets/leetllm-mark.svg'),
  path.join(outputRoot, 'leetllm-mark.svg'),
);
await fs.writeFile(path.join(outputRoot, 'index.html'), htmlFor(report));
process.stdout.write(
  `${JSON.stringify(
    {
      lessons: report.summary.lessonCount,
      fullDecodePassed: report.summary.fullDecodePassed,
      structuralPass: report.summary.structuralPass,
      artifactIntegrityPass: report.summary.artifactIntegrityPass,
      artifactHashesPassed: report.summary.artifactHashesPassed,
      artifactHashesDeclared: report.summary.artifactHashesDeclared,
      artifactHashFailures: report.summary.artifactHashFailures,
      nativeSamplePercent: Number(report.summary.nativeSamplePercent.toFixed(3)),
      coveredBeats: `${report.summary.coveredBeats}/${report.summary.totalBeats}`,
      reviewerRowsCurrent: report.summary.reviewerRowsCurrent,
      reviewerRowsStale: report.summary.reviewerRowsStale,
      currentSourceMatched: report.summary.currentSourceMatched,
      reproducibleSourceMatches: report.summary.reproducibleSourceMatches,
      revisionLessonsFound: report.summary.revisionLessonsFound,
      revisionAutomatedVerificationPassed: report.summary.revisionAutomatedVerificationPassed,
      revisionPublicationReady: report.summary.revisionPublicationReady,
      revisionReviewsCurrent: report.summary.revisionReviewsCurrent,
      revisionReviewsPending: report.summary.revisionReviewsPending,
      revisionReviewsStale: report.summary.revisionReviewsStale,
      output: outputRoot,
    },
    null,
    2,
  )}\n`,
);
