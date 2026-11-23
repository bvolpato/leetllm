#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { generateInspectionData } from './inspection-data.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
if (args.includes('--help')) {
  console.log(
    'node videos/private-gallery/build-inspection-index.mjs --inventory PATH --output NEW_DIRECTORY [--inspection-run SHARED_RUN_DIRECTORY] [--progress-overlay FILE ...] [--candidate-inspection-run DIRECTORY --candidate-plan-sha256 SHA --candidate-ids ID,ID] [--correction-intake FILE] [--job-root DIRECTORY ...] [--status-snapshot videos/reviews/inspection-milestone-2026-11-08.json]\nGenerates an immutable all-199 evidence snapshot, HTML, JSON, CSV and existing private-gallery media manifest. No uploads or authority writes.',
  );
  process.exit(0);
}
const output = path.resolve(
  root,
  option('--output', 'build/video-inspection-milestone-20261108/attempt-01'),
);
if (await fs.stat(path.join(output, 'status-index.json')).catch(() => null))
  throw new Error('Output already contains a sealed index. Choose a new output directory.');
const jobRoots = args.flatMap((value, index) => (value === '--job-root' ? [args[index + 1]] : []));
const progressOverlayPaths = args.flatMap((value, index) =>
  value === '--progress-overlay' ? [args[index + 1]] : [],
);
if (progressOverlayPaths.length && !option('--inspection-run', ''))
  throw new Error('--progress-overlay requires --inspection-run');
if (
  (args.includes('--candidate-plan-sha256') || args.includes('--candidate-ids')) &&
  !option('--candidate-inspection-run', '')
)
  throw new Error('Candidate plan and IDs require --candidate-inspection-run');
const result = await generateInspectionData({
  root,
  output,
  jobRoots,
  inspectionRun: option('--inspection-run', ''),
  progressOverlayPaths,
  candidateInspectionRun: option('--candidate-inspection-run', ''),
  candidatePlanSha256: option('--candidate-plan-sha256', ''),
  candidateIds: option('--candidate-ids', '').split(',').filter(Boolean),
  correctionIntakePath: option('--correction-intake', ''),
  inventoryPath: option(
    '--inventory',
    'build/video-delivery-20261108-readiness-inventory/inventory-v10.json',
  ),
  publishedPath: option('--published', 'web/src/generated/lesson-videos.json'),
  collectionPath: 'videos/collections/complete-curriculum.json',
});
await fs.mkdir(output, { recursive: true });
if (result.progressSnapshot)
  await fs.writeFile(
    path.join(output, 'inspection-progress-observed.json'),
    result.progressSnapshot,
    { flag: 'wx' },
  );
for (const snapshot of result.progressOverlaySnapshots)
  await fs.writeFile(path.join(output, snapshot.name), snapshot.bytes, { flag: 'wx' });
if (result.candidateProgressSnapshot)
  await fs.writeFile(
    path.join(output, 'candidate-inspection-progress-observed.json'),
    result.candidateProgressSnapshot,
    { flag: 'wx' },
  );
for (const name of ['index.html', 'inspection.css', 'inspection.js'])
  await fs.copyFile(path.join(here, 'inspection', name), path.join(output, name));
for (const [name, value] of Object.entries({
  'status-index.json': result.data,
  'media-manifest.json': result.assetManifest,
  'input-bindings.json': result.inputs,
  'hosting-compatibility.json': result.compatibility,
}))
  await fs.writeFile(path.join(output, name), JSON.stringify(value, null, 2) + '\n', {
    flag: 'wx',
  });
const columns = [
  'order',
  'id',
  'title',
  'group',
  'scriptReviewRecorded',
  'encodedVisualReviewRecorded',
  'mechanicalMigrationRecorded',
  'renderStatus',
  'newRunStatus',
  'newRunManualInspection',
  'candidateMovieSha256',
  'candidateReview',
  'candidateSourceDrift',
  'inventorySourceDrift',
  'findings',
  'paperFigureSource',
  'playbackKind',
  'playbackUrl',
];
const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const rows = result.data.lessons.map((row) => [
  row.order,
  row.id,
  row.title,
  row.group,
  row.inspected.scriptReviewRecorded,
  row.inspected.encodedVisualReviewRecorded,
  row.mechanical.recorded,
  row.renderStatus,
  row.currentInspection?.state ?? '',
  row.currentInspection?.directionReview ?? '',
  row.candidate?.media.video.sha256 ?? '',
  row.exactCandidateReview?.recommendation ?? '',
  row.candidate?.changedSinceFreeze.length ?? '',
  row.sourceDriftSinceInventory.length,
  row.findings.map((finding) => `${finding.id}: ${finding.summary}`).join(' | '),
  row.paperUse.sourceIntegrated,
  row.playback.kind,
  row.playback.url,
]);
await fs.writeFile(
  path.join(output, 'status-index.csv'),
  [columns, ...rows].map((row) => row.map(csv).join(',')).join('\n') + '\n',
  { flag: 'wx' },
);
const statusSnapshot = option('--status-snapshot', '');
if (statusSnapshot) {
  const allowed = path.join(root, 'videos/reviews/inspection-milestone-2026-11-08.json');
  if (path.resolve(root, statusSnapshot) !== allowed)
    throw new Error('Only the explicitly authorized milestone status path is writable.');
  const previous = await fs
    .readFile(allowed)
    .catch((error) => (error.code === 'ENOENT' ? null : Promise.reject(error)));
  if (previous)
    await fs.writeFile(path.join(output, 'previous-status-snapshot.json'), previous, {
      flag: 'wx',
    });
  const dataBytes = await fs.readFile(path.join(output, 'status-index.json'));
  const snapshot = {
    schemaVersion: 1,
    generatedAt: result.data.generatedAt,
    scope:
      'Recorded per-lesson inspection and delivery status. This report performs no new personal review and changes no canonical decision or score. Historical inspection is separate from the current source and selected movie.',
    inventory: result.data.inventory,
    publishedManifest: result.data.publishedManifest,
    detailedIndex: {
      path: path.relative(root, path.join(output, 'status-index.json')),
      sha256: createHash('sha256').update(dataBytes).digest('hex'),
    },
    summary: result.data.summary,
    sharedInspectionRun: result.data.sharedInspectionRun,
    candidateInspectionRun: result.data.candidateInspectionRun,
    correctionIntake: result.data.correctionIntake,
    lessons: result.data.lessons.map((row) => ({
      id: row.id,
      title: row.title,
      currentBindings: {
        ...row.currentBindings,
        moduleFiles: undefined,
        moduleFileCount: row.currentBindings.moduleFiles.length,
      },
      recordedRevisits: {
        fullScriptPeer: row.originalFullScriptPeer,
        prospectiveFullSourcePeers: row.prospectiveFullSourcePeers,
        scriptReviewRecorded: row.inspected.scriptReviewRecorded,
        encodedVisualReviewRecorded: row.inspected.encodedVisualReviewRecorded,
        encodedReviews: row.historicalEncodedReview.map((review) => ({
          record: review.record,
          movieSha256: review.movieSha256,
          recommendation: review.recommendation,
        })),
        supplementalSourceReviews: row.inspected.supplementalSourceReviews.map((review) => ({
          record: review.record,
          status: review.status,
          scope: review.scope,
        })),
        mechanicalOnlyDoesNotCreateVisualReview: true,
        mechanicalRecords: row.mechanical.records,
      },
      renderAvailability: {
        currentInspection: row.currentInspection
          ? {
              state: row.currentInspection.state,
              directionReview: row.currentInspection.directionReview,
              plan: row.currentInspection.plan,
              progress: row.currentInspection.job,
              error: row.currentInspection.error,
              progressObservations: row.currentInspection.progressObservations,
              overlayChecks: row.currentInspection.overlayChecks,
            }
          : null,
        status: row.renderStatus,
        correctionInspection: row.correctionInspection,
        latestJob: row.latestJob?.job ?? null,
        selectedCandidate: row.candidate
          ? {
              job: row.candidate.job,
              movie: row.candidate.media.video,
              runtimeVersion: row.candidate.runtimeVersion,
              changedSinceFreeze: row.candidate.changedSinceFreeze,
            }
          : null,
      },
      exactCandidateReview: row.exactCandidateReview,
      knownIssues: {
        sourceCorrection: row.sourceCorrection,
        scope: row.findingsScope,
        movieSha256: row.findingsMovieSha256,
        findings: row.findings,
      },
      sourceChangedSinceInventory: row.sourceDriftSinceInventory,
      closingPatch: {
        sourceOnlyRecorded: row.t7.sourceOnlyApplicationRecorded,
        currentSpeechMatchesPatch: row.t7.appliedEndingSpeechMatchesCurrent,
        audioAndMovieRenewalImplied: false,
        index: row.t7.finalApplicationIndex,
      },
      paperUse: row.paperUse,
      playback: row.playback,
    })),
    limits: result.data.limits,
  };
  await fs.writeFile(allowed, JSON.stringify(snapshot, null, 2) + '\n');
}
// Local symlinks provide the same content-addressed URLs as the existing private manifest.
for (const row of result.assetManifest.lessons)
  for (const kind of ['video', 'poster', 'vtt', 'srt', 'chapters']) {
    const asset = row[kind];
    const destination = path.join(output, asset.path);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.symlink(path.resolve(root, asset.source), destination);
  }
console.log(
  JSON.stringify(
    { output, ...result.data.summary, uploadCompatibility: result.compatibility },
    null,
    2,
  ),
);
