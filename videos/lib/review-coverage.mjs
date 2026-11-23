import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const LONG_STILL_SECONDS = 6;
export const EARLY_SETTLE_SECONDS = 4;
export const EARLY_SETTLE_FRACTION = 0.5;
export const HIGH_CHANGE_FRACTION = 0.1;

export function hasOnlyUvReleaseAgeMetadataChanged(adapterBytes, baselineSha256) {
  const normalized = Buffer.from(
    adapterBytes.toString('utf8').replace(/^# \[tool\.uv\]\r?\n# exclude-newer = "P7D"\r?\n/m, ''),
  );
  return createHash('sha256').update(normalized).digest('hex') === baselineSha256;
}

export function paginateMotionScenes(scenes, scenesPerPage = 4) {
  if (!Number.isInteger(scenesPerPage) || scenesPerPage < 1) {
    throw new RangeError('scenesPerPage must be a positive integer');
  }
  const pages = [];
  for (let start = 0; start < scenes.length; start += scenesPerPage) {
    pages.push({
      page: pages.length + 1,
      startIndex: start,
      scenes: scenes.slice(start, start + scenesPerPage),
    });
  }
  return pages;
}

export function normalizeReviewerPayload(payload, reviewerName) {
  const lessons = Array.isArray(payload)
    ? payload
    : (payload?.lessons ?? payload?.rows ?? payload?.reviews ?? []);
  if (!Array.isArray(lessons)) throw new TypeError(`${reviewerName}: lessons must be an array`);
  return lessons.map((row) => ({
    ...row,
    reviewer: row.reviewer ?? payload.reviewer ?? reviewerName,
  }));
}

export function mapStillRunsToBeats(
  stillRuns,
  timeline,
  fps,
  {
    earlySettleSeconds = EARLY_SETTLE_SECONDS,
    earlySettleFraction = EARLY_SETTLE_FRACTION,
    longStillSeconds = LONG_STILL_SECONDS,
  } = {},
) {
  const beats = (timeline.scenes ?? []).flatMap((scene) =>
    (scene.beats ?? []).map((beat, index) => ({
      scene: scene.id,
      beat: index,
      start: (scene.start ?? 0) + (beat.start ?? 0),
      end: (scene.start ?? 0) + (beat.end ?? 0),
    })),
  );
  const longStillCandidates = [];
  const earlySettleCandidates = [];

  for (const run of stillRuns ?? []) {
    const duration = Number(run.duration ?? (run.lastFrame - run.firstFrame + 1) / fps);
    const startTime = run.firstFrame / fps;
    const endTime = (run.lastFrame + 1) / fps;
    const owningBeat = beats.find(
      (beat) => beat.scene === run.scene && startTime < beat.end && endTime > beat.start,
    );
    const candidate = {
      scene: run.scene ?? owningBeat?.scene ?? null,
      beat: owningBeat?.beat ?? null,
      firstFrame: run.firstFrame,
      lastFrame: run.lastFrame,
      startTime,
      endTime,
      duration,
      beatProgress:
        owningBeat && owningBeat.end > owningBeat.start
          ? Math.max(
              0,
              Math.min(1, (startTime - owningBeat.start) / (owningBeat.end - owningBeat.start)),
            )
          : null,
    };
    if (duration >= longStillSeconds) longStillCandidates.push(candidate);
    if (
      owningBeat &&
      duration >= earlySettleSeconds &&
      candidate.beatProgress <= earlySettleFraction
    ) {
      earlySettleCandidates.push(candidate);
    }
  }

  return { longStillCandidates, earlySettleCandidates };
}

export function rankSceneBeatsByMotion(timeline, metrics, fps) {
  const scenes = timeline.scenes ?? [];
  const totals = scenes.map((scene) =>
    (scene.beats ?? []).map((beat, index) => ({
      scene: scene.id,
      beat: index,
      start: (scene.start ?? 0) + (beat.start ?? 0),
      end: (scene.start ?? 0) + (beat.end ?? 0),
      motionSum: 0,
      measuredFrames: 0,
    })),
  );
  let sceneIndex = 0;
  let beatIndex = 0;
  for (const metric of metrics ?? []) {
    const frame = Number(metric[0]);
    const time = frame / fps;
    while (
      sceneIndex < scenes.length &&
      time >= (scenes[sceneIndex].start ?? 0) + (scenes[sceneIndex].duration ?? 0)
    ) {
      sceneIndex += 1;
      beatIndex = 0;
    }
    const scene = scenes[sceneIndex];
    if (!scene) break;
    const sceneBeats = totals[sceneIndex];
    while (beatIndex < sceneBeats.length && time >= sceneBeats[beatIndex].end) beatIndex += 1;
    const beat = sceneBeats[beatIndex];
    if (beat && time >= beat.start && time < beat.end) {
      beat.motionSum += Math.abs(Number(metric[1]) || 0);
      beat.measuredFrames += 1;
    }
  }
  return new Map(
    totals.map((beats, index) => {
      const selected =
        [...beats].sort((a, b) => b.motionSum - a.motionSum || a.beat - b.beat)[0] ?? null;
      return [scenes[index].id, selected];
    }),
  );
}

export function buildSceneCoverage({ timeline, lesson, encodedReview, audit, fps }) {
  const authoredScenes = new Map((lesson.scenes ?? []).map((scene) => [scene.id, scene]));
  const samplesBySceneBeat = new Map();
  const sampledFrames = new Set();
  for (const sample of encodedReview.samples ?? []) {
    sampledFrames.add(sample.frame);
    for (const target of sample.targets ?? []) {
      if (!target.scene || target.scene === 'leetllm-intro') continue;
      const key = `${target.scene}:${target.beat ?? ''}`;
      const samples = samplesBySceneBeat.get(key) ?? [];
      samples.push({
        frame: sample.frame,
        time: sample.time,
        phase: target.phase ?? 'sample',
        image: sample.image,
      });
      samplesBySceneBeat.set(key, samples);
    }
  }

  const scenes = (timeline.scenes ?? []).map((scene) => {
    const authoredScene = authoredScenes.get(scene.id);
    const beats = (scene.beats ?? []).map((beat, index) => {
      const samples = (samplesBySceneBeat.get(`${scene.id}:${index}`) ?? []).sort(
        (a, b) => a.time - b.time,
      );
      const phases = [...new Set(samples.map((sample) => sample.phase))];
      return {
        index,
        text: beat.say,
        start: (scene.start ?? 0) + (beat.start ?? 0),
        end: (scene.start ?? 0) + (beat.end ?? 0),
        duration: beat.duration ?? Math.max(0, (beat.end ?? 0) - (beat.start ?? 0)),
        phases,
        samples,
      };
    });
    return {
      id: scene.id,
      title: authoredScene?.title ?? '(missing authored scene title)',
      titlePresent: Boolean(authoredScene?.title),
      start: scene.start ?? 0,
      duration: scene.duration,
      beats,
      sheet:
        (encodedReview.sceneSheets ?? []).find((sheet) => sheet.scene === scene.id)?.image ?? null,
      sampledBeatCount: beats.filter((beat) => beat.samples.length > 0).length,
    };
  });
  const beatCount = scenes.reduce((sum, scene) => sum + scene.beats.length, 0);
  const coveredBeatCount = scenes.reduce((sum, scene) => sum + scene.sampledBeatCount, 0);
  const stills = mapStillRunsToBeats(audit.stillRuns, timeline, fps);
  const nonTransitionPeaks = (audit.peakChanges ?? []).filter(
    (peak) => !(peak.knownTransitions ?? []).length,
  );
  const highChangeCandidates = nonTransitionPeaks.filter(
    (peak) => peak.changedFraction >= HIGH_CHANGE_FRACTION,
  );

  return {
    scenes,
    beatCount,
    coveredBeatCount,
    beatSampleCoverage: beatCount ? coveredBeatCount / beatCount : 0,
    sampledFrames: sampledFrames.size,
    frameSampleCoverage: audit.frames ? sampledFrames.size / audit.frames : 0,
    sampleCount: (encodedReview.samples ?? []).length,
    stillCandidates: stills.longStillCandidates,
    earlySettleCandidates: stills.earlySettleCandidates,
    nonTransitionPeakCount: nonTransitionPeaks.length,
    highChangeCandidates,
    thresholds: {
      longStillSeconds: LONG_STILL_SECONDS,
      earlySettleSeconds: EARLY_SETTLE_SECONDS,
      earlySettleFraction: EARLY_SETTLE_FRACTION,
      highChangeFraction: HIGH_CHANGE_FRACTION,
    },
  };
}

export function summarizeReviewerRows(reviewers, lessonById) {
  const byLesson = new Map();
  for (const reviewer of reviewers) {
    for (const row of reviewer.lessons) {
      if (!lessonById.has(row.id)) continue;
      const entries = byLesson.get(row.id) ?? [];
      const expected = lessonById.get(row.id);
      const movieCurrent = row.movieSha256 === expected.sha256;
      const sourceCurrent = row.sourceFingerprint === expected.fingerprint;
      const findings = Array.isArray(row.findings) ? row.findings : [];
      const explicitBlockers = Array.isArray(row.blockers) ? row.blockers : [];
      entries.push({
        reviewer: row.reviewer,
        movieSha256: row.movieSha256 ?? null,
        sourceFingerprint: row.sourceFingerprint ?? null,
        movieCurrent,
        sourceCurrent,
        stale: !movieCurrent || !sourceCurrent,
        visualScore: row.visualScore ?? null,
        animationScore: row.animationScore ?? null,
        readyForYoutube: row.readyForYoutube ?? null,
        findings,
        blockers: explicitBlockers,
        reviewedScenes: row.reviewedScenes ?? [],
        viewedImages: row.viewedImages ?? [],
      });
      byLesson.set(row.id, entries);
    }
  }
  return byLesson;
}

export function classifyArtifactReview(
  row,
  expected,
  { matchesCurrentCheckout = null, evidencePassed = true } = {},
) {
  const movieCurrent = row.movieSha256 === expected.sha256;
  const sourceCurrent = row.sourceFingerprint === expected.fingerprint;
  const evidenceCurrent = evidencePassed === true;
  return {
    movieCurrent,
    sourceCurrent,
    evidenceCurrent,
    matchesCurrentCheckout,
    stale: !movieCurrent || !sourceCurrent || !evidenceCurrent,
  };
}

export function summarizeRevisionReviewRows(
  rows,
  { movieSha256, sourceFingerprint, matchesCurrentCheckout = null },
) {
  const reviews = rows.map((row) => {
    const movieCurrent = row.movieSha256 === movieSha256;
    const sourceMatches = row.sourceFingerprint === sourceFingerprint;
    const evidenceCurrent = row.evidencePassed === true;
    return {
      ...row,
      movieCurrent,
      sourceCurrent: sourceMatches,
      matchesCurrentCheckout,
      evidenceCurrent,
      current: movieCurrent && sourceMatches && evidenceCurrent,
    };
  });
  const current = reviews.filter((row) => row.current).length;
  return {
    status: !reviews.length ? 'pending' : current ? 'current' : 'stale',
    current,
    pending: reviews.length === 0 ? 1 : 0,
    stale: reviews.length > 0 && current === 0 ? 1 : 0,
    rows: reviews,
  };
}

const sha256Pattern = /^[a-f0-9]{64}$/u;
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function isPngSignature(bytes) {
  return (
    Buffer.isBuffer(bytes) &&
    bytes.length >= pngSignature.length &&
    bytes.subarray(0, pngSignature.length).equals(pngSignature)
  );
}

export function bindRevisionReviewImage(repoRoot, encodedDirectory, image, artifactHashes) {
  if (
    !image?.path ||
    !sha256Pattern.test(image.sha256 ?? '') ||
    path.extname(image.path).toLowerCase() !== '.png'
  )
    return null;
  const resolvedPath = path.resolve(repoRoot, image.path);
  const relativePath = path.relative(encodedDirectory, resolvedPath).split(path.sep).join('/');
  const withinBundle =
    relativePath !== '' &&
    !relativePath.startsWith('../') &&
    relativePath !== '..' &&
    !path.isAbsolute(relativePath);
  if (!withinBundle || artifactHashes?.[relativePath] !== image.sha256) return null;
  return { path: resolvedPath, sha256: image.sha256, kind: 'encoded-review' };
}

export function reviewImageMetadataPath(
  repoRoot,
  lessonId,
  image,
  { materialDirectories = [], atlasDirectories = [] } = {},
) {
  if (
    !image?.path ||
    !sha256Pattern.test(image.sha256 ?? '') ||
    path.extname(image.path).toLowerCase() !== '.png'
  )
    return null;
  const resolvedPath = path.resolve(repoRoot, image.path);
  const relativePath = path.relative(repoRoot, resolvedPath);
  if (
    path.isAbsolute(relativePath) ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`)
  )
    return null;
  const parts = relativePath.split(path.sep);
  const materialsIndex = parts.lastIndexOf('materials');
  if (
    parts[0] !== 'build' ||
    materialsIndex < 1 ||
    parts[materialsIndex + 1] !== lessonId ||
    parts.length !== materialsIndex + 3
  )
    return null;
  const filename = parts.at(-1);
  const allowedDirectories =
    filename === 'motion-all-scenes.png' ? atlasDirectories : materialDirectories;
  const allowedPaths = allowedDirectories.map((directory) => path.resolve(repoRoot, directory));
  if (
    !['scenes.png', 'motion.png', 'motion-all-scenes.png'].includes(filename) ||
    !allowedPaths.includes(path.dirname(resolvedPath))
  )
    return null;
  return path.join(
    path.dirname(resolvedPath),
    filename === 'motion-all-scenes.png' ? 'motion-all-scenes.json' : 'material.json',
  );
}

function sameImage(repoRoot, metadata, image) {
  return Boolean(
    metadata?.path &&
    metadata.sha256 === image.sha256 &&
    path.resolve(repoRoot, metadata.path) === path.resolve(repoRoot, image.path),
  );
}

function currentOverviewMetadata(repoRoot, lessonId, metadata, { movieSha256, sourceFingerprint }) {
  if (
    metadata?.id !== lessonId ||
    metadata.movieSha256 !== movieSha256 ||
    metadata.sourceFingerprint !== sourceFingerprint
  )
    return false;
  const directory = path.dirname(path.resolve(repoRoot, metadata.sceneOverview?.path ?? ''));
  const scene = metadata.sceneOverview;
  const motion = metadata.motionOverview;
  return (
    path.resolve(repoRoot, scene?.path ?? '') === path.join(directory, 'scenes.png') &&
    sha256Pattern.test(scene?.sha256 ?? '') &&
    path.resolve(repoRoot, motion?.path ?? '') === path.join(directory, 'motion.png') &&
    sha256Pattern.test(motion?.sha256 ?? '')
  );
}

export function bindBaselineReviewImage(
  repoRoot,
  lessonId,
  image,
  {
    movieSha256,
    sourceFingerprint,
    encodedDirectory,
    encodedArtifactHashes,
    materialDirectories,
    atlasDirectories,
    materialMetadata,
    atlasMetadata,
  } = {},
) {
  const encoded =
    encodedDirectory && encodedArtifactHashes
      ? bindRevisionReviewImage(repoRoot, encodedDirectory, image, encodedArtifactHashes)
      : null;
  if (encoded) return encoded;

  const metadataPath = reviewImageMetadataPath(repoRoot, lessonId, image, {
    materialDirectories,
    atlasDirectories,
  });
  if (!metadataPath) return null;
  const resolvedPath = path.resolve(repoRoot, image.path);
  const filename = path.basename(resolvedPath);
  if (filename === 'scenes.png' || filename === 'motion.png') {
    if (
      !currentOverviewMetadata(repoRoot, lessonId, materialMetadata, {
        movieSha256,
        sourceFingerprint,
      })
    )
      return null;
    const asset =
      filename === 'scenes.png' ? materialMetadata.sceneOverview : materialMetadata.motionOverview;
    if (!sameImage(repoRoot, asset, image)) return null;
    return {
      path: resolvedPath,
      sha256: image.sha256,
      kind: filename === 'scenes.png' ? 'scene-overview' : 'motion-overview',
    };
  }

  if (
    atlasMetadata?.schemaVersion !== 1 ||
    atlasMetadata.id !== lessonId ||
    atlasMetadata.movieSha256 !== movieSha256 ||
    atlasMetadata.sourceFingerprint !== sourceFingerprint ||
    !sameImage(repoRoot, { path: atlasMetadata.image, sha256: atlasMetadata.imageSha256 }, image)
  )
    return null;
  return { path: resolvedPath, sha256: image.sha256, kind: 'motion-atlas' };
}

export function selectReviewPlayer({ baseline, revision }) {
  const useRevision = Boolean(
    revision?.matchesCurrentCheckout &&
    revision.renderPassed &&
    revision.encodedReview?.passed &&
    revision.captions?.current,
  );
  if (!useRevision)
    return {
      useRevision: false,
      videoPath: baseline.moviePath,
      posterPath: baseline.posterPath,
      captionsPath: baseline.captionsPath,
      label: 'Baseline render',
    };
  return {
    useRevision: true,
    videoPath: revision.moviePath,
    posterPath: revision.encodedReview.posterFrame ?? revision.encodedReview.contactSheet,
    captionsPath: revision.captionsPath,
    label: `Latest render; review ${revision.publicationReady ? 'ready' : 'pending'}`,
  };
}

export function assessRevisionPublicationReadiness({
  automatedVerificationPassed,
  captionsCurrent,
  auditBindings = {},
  review,
} = {}) {
  const currentReviews = Array.isArray(review?.rows)
    ? review.rows.filter((row) => row.current === true)
    : [];
  const currentImageBoundReview =
    review?.status === 'current' &&
    currentReviews.length > 0 &&
    currentReviews.every((row) => row.evidenceCurrent === true);
  const reviewersReady =
    currentImageBoundReview &&
    currentReviews.every(
      (row) =>
        row.readyForYoutube === true && Array.isArray(row.blockers) && row.blockers.length === 0,
    );
  const auditBindingsPassed =
    Object.keys(auditBindings).length > 0 &&
    Object.values(auditBindings).every((value) => value === true);
  const publicationReady =
    automatedVerificationPassed === true &&
    captionsCurrent === true &&
    auditBindingsPassed &&
    reviewersReady;
  const hasHumanHold = currentReviews.some(
    (row) =>
      row.readyForYoutube === false || !Array.isArray(row.blockers) || row.blockers.length > 0,
  );
  const status = publicationReady
    ? 'publication ready'
    : automatedVerificationPassed !== true
      ? 'automated checks pending'
      : review?.status === 'stale'
        ? 'automated checks passed · human review stale'
        : hasHumanHold
          ? 'automated checks passed · human review hold'
          : !captionsCurrent
            ? 'automated checks passed · captions stale'
            : !auditBindingsPassed
              ? 'automated checks passed · audit bindings pending'
              : 'automated checks passed · human review pending';
  return {
    automatedVerificationPassed: automatedVerificationPassed === true,
    currentImageBoundReview,
    reviewersReady: Boolean(reviewersReady),
    captionsCurrent: captionsCurrent === true,
    auditBindingsPassed,
    auditBindings,
    publicationReady,
    status,
  };
}

export function reconcilePublicationSelection(selection, currentArtifact) {
  if (!selection || !['keep', 'skip'].includes(selection.decision)) {
    return { decision: 'unreviewed', movieCurrent: false, sourceCurrent: false, stale: true };
  }
  const movieCurrent = selection.movieSha256 === currentArtifact.sha256;
  const sourceCurrent = selection.sourceFingerprint === currentArtifact.fingerprint;
  return {
    decision: selection.decision,
    reason: selection.reason ?? '',
    revisitCondition: selection.revisitCondition ?? '',
    scores: selection.scores ?? {},
    selectionScore: selection.selectionScore ?? null,
    qualityScore: selection.qualityScore ?? null,
    blockers: selection.blockers ?? [],
    reviewedScenes: selection.reviewedScenes ?? [],
    movieSha256: selection.movieSha256 ?? null,
    sourceFingerprint: selection.sourceFingerprint ?? null,
    movieCurrent,
    sourceCurrent,
    stale: !movieCurrent || !sourceCurrent,
  };
}

export function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );
}

export function relativeLink(fromDirectory, targetPath) {
  return path.relative(fromDirectory, targetPath).split(path.sep).join('/');
}

export async function readReviewerFiles(directory, count = 5) {
  const reviewers = [];
  const files = [];
  for (let index = 1; index <= count; index += 1) {
    const name = `reviewer-${index}`;
    const file = path.join(directory, `${name}.json`);
    try {
      const payload = JSON.parse(await fs.readFile(file, 'utf8'));
      reviewers.push({
        name: payload.reviewer ?? name,
        path: file,
        lessons: normalizeReviewerPayload(payload, name),
      });
      files.push({ name, path: file, status: 'loaded', lessons: reviewers.at(-1).lessons.length });
    } catch (error) {
      if (error.code === 'ENOENT') {
        files.push({ name, path: file, status: 'pending', lessons: 0 });
        continue;
      }
      files.push({ name, path: file, status: 'invalid', lessons: 0, error: error.message });
    }
  }
  return { reviewers, files };
}
