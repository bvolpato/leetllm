import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { collectInspectionRun } from './inspection-run.mjs';
import {
  collectCandidateInspectionRun,
  selectInspectionJobs,
} from './candidate-inspection-run.mjs';
import { GALLERY_UPLOAD_LIMITS } from './worker.mjs';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const slash = (value) => value.split(path.sep).join('/');
const accepted = (value) => /^(accepted|accept)/i.test(value ?? '');

export function exactMovieReview(records, movieSha256, { inspectionPlanSha256 } = {}) {
  return (
    records
      .filter((record) => movieSha256 && record.movieSha256 === movieSha256)
      .filter(
        (record) => !inspectionPlanSha256 || record.inspectionPlanSha256 === inspectionPlanSha256,
      )
      .sort((a, b) => String(b.reviewedAt ?? '').localeCompare(String(a.reviewedAt ?? '')))[0] ??
    null
  );
}

export function inspectionFlags(row) {
  const full = row.originalFullPeer;
  const script = Boolean(full?.exactPreservedRecord && accepted(full.declaredStatus));
  const visual = row.allLocatedEncodedReviewRecords.length > 0;
  const original = full?.exactPreservedRecord?.path;
  const supplemental = row.acceptedScopedDefinitionRecords.filter(
    (record) => record.record.path !== original,
  );
  return {
    scriptReviewRecorded: script,
    encodedVisualReviewRecorded: visual,
    mechanicalMigrationRecorded: row.mechanical.records.length > 0,
    supplementalSourceReviews: supplemental.map((record) => ({
      record: record.record,
      status: record.status,
      scope: record.scope,
      scriptMatchesInventory: record.scriptMatchesCurrent,
    })),
    scope:
      'Recorded manuscript and encoded-image inspections are separate. Formatting, file organization and native parity alone never count as an encoded visual revisit.',
  };
}

export function pendingStatus(candidate, exactReview, latestJob) {
  if (!candidate) return latestJob ? `Render ${latestJob.state}` : 'Render pending';
  if (!exactReview) return 'Exact movie available; review missing';
  if (exactReview.recommendation === 'POST') return 'Exact movie reviewed: POST';
  return `Exact movie reviewed: ${exactReview.recommendation}`;
}

export function findFindings(review, id) {
  const scoped = Array.isArray(review?.lessons)
    ? review.lessons.find((lesson) => lesson.id === id)
    : review;
  const values = scoped?.findings ?? scoped?.blockers ?? scoped?.rework ?? [];
  return (Array.isArray(values) ? values : [values])
    .filter((finding) => finding && !/^(resolved|closed|fixed)$/i.test(finding.status ?? ''))
    .map((finding, index) =>
      typeof finding === 'string'
        ? { id: `finding-${index + 1}`, summary: finding }
        : {
            id: finding.id ?? finding.code ?? `finding-${index + 1}`,
            severity: finding.severity ?? null,
            summary:
              finding.summary ??
              finding.finding ??
              finding.problem ??
              finding.title ??
              finding.description ??
              finding.detail ??
              JSON.stringify(finding),
            remedy: finding.remedy ?? finding.requiredRepair ?? finding.requiredChange ?? null,
          },
    );
}

export async function generateInspectionData({
  root,
  inventoryPath,
  publishedPath,
  collectionPath,
  output,
  jobRoots = [],
  inspectionRun,
  progressOverlayPaths = [],
  candidateInspectionRun,
  candidatePlanSha256,
  candidateIds = [],
  correctionIntakePath,
}) {
  const startedAt = new Date().toISOString();
  const tracked = new Map();
  const relative = (file) => slash(path.relative(root, path.resolve(root, file)));
  async function bind(file) {
    const absolute = path.resolve(root, file);
    if (!tracked.has(absolute))
      tracked.set(
        absolute,
        (async () => {
          const before = await fs.stat(absolute);
          const hash = createHash('sha256');
          for await (const bytes of createReadStream(absolute)) hash.update(bytes);
          const after = await fs.stat(absolute);
          return {
            path: relative(absolute),
            sha256: hash.digest('hex'),
            bytes: after.size,
            mtimeMs: after.mtimeMs,
            stableDuringRead: before.mtimeMs === after.mtimeMs && before.size === after.size,
          };
        })(),
      );
    return tracked.get(absolute);
  }
  const read = async (file, { preserveRaw = false } = {}) => {
    if (preserveRaw) {
      const absolute = path.resolve(root, file);
      const handle = await fs.open(absolute, 'r');
      try {
        const before = await handle.stat();
        const bytes = await handle.readFile();
        const after = await handle.stat();
        const binding = {
          path: relative(absolute),
          sha256: digest(bytes),
          bytes: bytes.length,
          mtimeMs: after.mtimeMs,
          stableDuringRead: before.mtimeMs === after.mtimeMs && before.size === after.size,
        };
        tracked.set(absolute, Promise.resolve(binding));
        return { value: JSON.parse(bytes), binding, rawBytes: bytes };
      } finally {
        await handle.close();
      }
    }
    const bytes = await fs.readFile(path.resolve(root, file));
    const binding = await bind(file);
    assert.equal(digest(bytes), binding.sha256, `Changed while reading: ${file}`);
    return { value: JSON.parse(bytes), binding };
  };
  const optionalRead = async (file) => {
    try {
      return await read(file);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  };
  const inventory = await read(inventoryPath);
  const published = await read(publishedPath);
  const collection = await read(collectionPath);
  const correctionIntake = correctionIntakePath ? await read(correctionIntakePath) : null;
  const corrections = new Set(correctionIntake?.value.lessons.map((row) => row.id) ?? []);
  if (correctionIntake) {
    assert.equal(
      corrections.size,
      correctionIntake.value.lessons.length,
      'Duplicate correction ID',
    );
    for (const id of corrections)
      assert(
        collection.value.lessons.some((row) => row.id === id),
        `Foreign correction ID: ${id}`,
      );
  }
  const prospectiveGate = await optionalRead(
    'build/video-delivery-20261107-v08/source-repair-kv-cache-attempt-01/source-gate.json',
  );
  if (prospectiveGate) {
    assert.equal(
      prospectiveGate.binding.sha256,
      '79239509ba06053a55c7ddeb0483ea6f3fca72b49f8ce19c81b0f667ba5f2418',
    );
    assert.equal(prospectiveGate.value.decisions.manuscriptAndQuiz, 'ACCEPT');
    assert(prospectiveGate.value.actualRead.wholeNarrationAndCurrentMetadata);
  }
  const endings = await optionalRead(
    'build/video-delivery-20261108-t7-closing-audit/applications/final-140-application-index-v1.json',
  );
  assert.equal(inventory.value.rows.length, 199, 'Inventory must cover all 199 lessons.');
  assert.equal(collection.value.lessons.length, 199, 'Collection must cover all 199 lessons.');
  const publishedRows = new Map(
    Object.values(published.value.videos).map((row) => [row.lessonId, row]),
  );
  const inventoryRows = new Map(inventory.value.rows.map((row) => [row.id, row]));
  assert.equal(inventoryRows.size, 199, 'Duplicate inventory lesson.');
  assert.equal(publishedRows.size, 199, 'Published manifest must cover all 199 lessons.');

  const discoveredRoots = new Set(jobRoots.map((directory) => path.resolve(root, directory)));
  for (const row of inventory.value.rows)
    for (const job of row.immutableJobs)
      discoveredRoots.add(path.dirname(path.resolve(root, job.directory)));
  for (const entry of await fs.readdir(path.join(root, 'build'), { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith('video-delivery-')) {
      const directory = path.join(root, 'build', entry.name, 'jobs');
      if ((await fs.stat(directory).catch(() => null))?.isDirectory())
        discoveredRoots.add(directory);
    }
  }
  const jobsById = new Map();
  const sourceDrift = [];
  for (const directory of [...discoveredRoots].sort()) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const jobDirectory = path.join(directory, entry.name);
      const plan = await optionalRead(path.join(jobDirectory, 'plan.json'));
      const job = await optionalRead(path.join(jobDirectory, 'job.json'));
      if (!plan || !job || !inventoryRows.has(plan.value.id)) continue;
      const id = plan.value.id;
      const manifest = await read(path.join(jobDirectory, 'current-source-manifest.json'));
      const ownSource = manifest.value.closure.files.filter(
        (file) =>
          file.path === manifest.value.lessonFile ||
          file.path === `videos/animations/${id}.mjs` ||
          file.path.startsWith(`videos/films/${id}/`) ||
          file.path.startsWith(`videos/stage/${id}/`),
      );
      const changed = [];
      for (const file of ownSource) {
        const current = await bind(file.path).catch((error) =>
          error.code === 'ENOENT' ? null : Promise.reject(error),
        );
        if (current?.sha256 !== file.sha256)
          changed.push({
            path: file.path,
            frozenSha256: file.sha256,
            currentSha256: current?.sha256 ?? null,
          });
      }
      let media = null;
      let verification = null;
      if (job.value.verification && /rendered/.test(job.value.state)) {
        verification = await read(job.value.verification.path);
        assert.equal(
          verification.binding.sha256,
          job.value.verification.sha256,
          `Verification changed: ${id}`,
        );
        const movie = await bind(verification.value.file);
        assert.equal(movie.sha256, verification.value.sha256, `Movie changed: ${id}`);
        assert.equal(movie.bytes, verification.value.bytes, `Movie length changed: ${id}`);
        const outputDirectory = path.dirname(path.resolve(root, verification.value.file));
        const posterName = (await fs.readdir(outputDirectory))
          .filter((name) => /^\d\d-.*\.png$/.test(name))
          .sort()[0];
        assert(posterName, `No representative poster: ${id}`);
        media = {};
        for (const [key, file, type] of [
          ['video', `${id}.mp4`, 'video/mp4'],
          ['poster', posterName, 'image/png'],
          ['vtt', `${id}.vtt`, 'text/vtt; charset=utf-8'],
          ['srt', `${id}.srt`, 'application/x-subrip; charset=utf-8'],
          ['chapters', `${id}.chapters.txt`, 'text/plain; charset=utf-8'],
        ]) {
          const binding = await bind(path.join(outputDirectory, file));
          const declared = verification.value.artifactSha256?.[file];
          if (declared)
            assert.equal(binding.sha256, declared, `Delivery artifact changed: ${id}/${file}`);
          media[key] = {
            path: `media/${id}/${binding.sha256}/${file}`,
            sha256: binding.sha256,
            bytes: binding.bytes,
            contentType: type,
            source: binding.path,
          };
        }
      }
      const record = {
        id,
        directory: relative(jobDirectory),
        plan: plan.binding,
        job: job.binding,
        createdAt: job.value.createdAt,
        finishedAt: job.value.finishedAt ?? null,
        state: job.value.state,
        runtimeVersion:
          manifest.value.renderEngine?.version ??
          manifest.value.runtimeInstallation?.version ??
          inventoryRows
            .get(id)
            .immutableJobs.find((item) => path.resolve(root, item.directory) === jobDirectory)
            ?.runtimeVersion ??
          'recorded in plan',
        fingerprint: manifest.value.fingerprint,
        verification: verification?.binding ?? null,
        duration: verification?.value.duration ?? null,
        media,
        changedSinceFreeze: changed,
      };
      if (!jobsById.has(id)) jobsById.set(id, []);
      jobsById.get(id).push(record);
    }
  }
  const sharedRun = inspectionRun
    ? await collectInspectionRun({
        directory: inspectionRun,
        read,
        bind,
        progressSnapshotPath: relative(path.join(output, 'inspection-progress-observed.json')),
        progressOverlayPaths,
      })
    : null;
  if (sharedRun)
    for (const job of sharedRun.jobs) {
      assert(inventoryRows.has(job.id), `Unknown shared inspection lesson: ${job.id}`);
      if (!jobsById.has(job.id)) jobsById.set(job.id, []);
      jobsById.get(job.id).push(job);
    }
  assert(
    !candidateInspectionRun || sharedRun,
    'A candidate run requires the primary inspection run',
  );
  const correctionRun = candidateInspectionRun
    ? await collectCandidateInspectionRun({
        directory: candidateInspectionRun,
        expectedPlanSha256: candidatePlanSha256,
        ids: candidateIds,
        primary: sharedRun,
        read,
        bind,
        progressSnapshotPath: relative(
          path.join(output, 'candidate-inspection-progress-observed.json'),
        ),
      })
    : null;
  if (correctionRun) for (const job of correctionRun.jobs) jobsById.get(job.id).push(job);

  const lessons = [];
  const assetManifest = { version: 1, lessons: [] };
  for (const [index, topic] of collection.value.lessons.entries()) {
    const row = inventoryRows.get(topic.id);
    assert(row, `Missing inventory lesson: ${topic.id}`);
    const historical = publishedRows.get(topic.id);
    assert(historical, `Missing published lesson: ${topic.id}`);
    const expected = [
      row.current.lesson,
      row.current.article,
      row.current.coverage,
      ...row.current.moduleClosure,
    ];
    const drift = [];
    const currentBindings = [];
    for (const before of expected) {
      const current = await bind(before.path).catch((error) =>
        error.code === 'ENOENT' ? null : Promise.reject(error),
      );
      if (current?.sha256 !== before.sha256)
        drift.push({
          path: before.path,
          inventorySha256: before.sha256,
          currentSha256: current?.sha256 ?? null,
        });
      if (current)
        currentBindings.push({ path: current.path, sha256: current.sha256, bytes: current.bytes });
    }
    if (drift.length) sourceDrift.push({ id: row.id, files: drift });
    const jobs = (jobsById.get(row.id) ?? []).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
    const selection = selectInspectionJobs(jobs);
    const candidate = selection.candidate;
    const latestJob = jobs[0] ?? null;
    const currentInspection = sharedRun ? selection.primary : null;
    const correctionInspection = selection.correction;
    const records = [];
    for (const record of row.allLocatedEncodedReviewRecords) {
      const current = await optionalRead(record.record.path);
      if (!current || current.binding.sha256 !== record.record.sha256) continue;
      records.push({
        ...record,
        inspectionPlanSha256:
          current.value.inspectionPlan?.sha256 ?? current.value.inspectionRun?.sha256,
        data: current.value,
      });
    }
    const exactReview = exactMovieReview(records, candidate?.media.video.sha256, {
      inspectionPlanSha256: candidate?.inspectionRun ? candidate.plan.sha256 : undefined,
    });
    const latestRecordedReview =
      records.find((review) => review.record.path === row.latestMovie?.review.path) ??
      [...records].sort((a, b) =>
        String(b.reviewedAt ?? '').localeCompare(String(a.reviewedAt ?? '')),
      )[0];
    const findingsSource = exactReview ?? latestRecordedReview ?? null;
    const flags = inspectionFlags({ ...row, allLocatedEncodedReviewRecords: records });
    if (flags.scriptReviewRecorded) {
      const peer = row.originalFullPeer.exactPreservedRecord;
      flags.scriptReviewRecorded = (await bind(peer.path)).sha256 === peer.sha256;
    }
    const ending = endings?.value.rows.find((item) => item.id === row.id) ?? null;
    const endingMatchesCurrent = ending
      ? (await bind(ending.file)).sha256 === ending.appliedSha256
      : false;
    const endingSpeechMatchesCurrent = ending
      ? parse(await fs.readFile(path.resolve(root, ending.file), 'utf8'))
          .scenes.at(-1)
          .beats.at(-1).say === ending.exactNewSay
      : false;
    const papers = [];
    for (const file of row.current.moduleClosure) {
      if (!file.path.endsWith('.mjs')) continue;
      const source = await fs.readFile(path.resolve(root, file.path), 'utf8').catch(() => '');
      if (
        /\bpaperFigure\s*\(/.test(source) &&
        /import[\s\S]*?paperFigure[\s\S]*?from\s*['"][^'"]*paper-figure\.mjs['"]/.test(source)
      )
        papers.push(await bind(file.path));
    }
    const lesson = {
      id: row.id,
      order: index + 1,
      title: row.title,
      group: topic.group,
      mode: row.mode,
      currentBindings: {
        lesson: currentBindings.find((record) => record.path === row.current.lesson.path),
        article: currentBindings.find((record) => record.path === row.current.article.path),
        coverage: currentBindings.find((record) => record.path === row.current.coverage.path),
        moduleFilesSha256: digest(
          JSON.stringify(
            currentBindings.filter((record) =>
              row.current.moduleClosure.some((file) => file.path === record.path),
            ),
          ),
        ),
        moduleFiles: currentBindings.filter((record) =>
          row.current.moduleClosure.some((file) => file.path === record.path),
        ),
      },
      inspected: flags,
      prospectiveFullSourcePeers:
        prospectiveGate?.value.lesson === row.id
          ? [
              {
                record: prospectiveGate.binding,
                decisions: prospectiveGate.value.decisions,
                actualRead: prospectiveGate.value.actualRead,
                scope:
                  'Genuine prospective complete manuscript/article/quiz/source read at its recorded epoch. The original missing peer remains missing. Later nonspoken repair and new movie gates are separate.',
              },
            ]
          : [],
      originalFullScriptPeer: row.originalFullPeer?.exactPreservedRecord ?? null,
      historicalEncodedReview: records.map(({ data, ...record }) => record),
      mechanical: {
        recorded: flags.mechanicalMigrationRecorded,
        records: row.mechanical.records.map((item) => item.record),
        createsEncodedReview: false,
      },
      sourceDriftSinceInventory: drift,
      jobs,
      latestJob,
      currentInspection,
      correctionInspection,
      sourceCorrection: corrections.has(row.id)
        ? {
            record: correctionIntake.binding,
            status: correctionInspection?.media
              ? 'Corrected exact-current movie available; manual inspection pending'
              : candidate?.changedSinceFreeze.length
                ? 'Primary source changed; corrected render pending'
                : 'Layout correction requested; corrected render pending',
            createsReview: false,
          }
        : null,
      candidate,
      renderStatus:
        currentInspection && !candidate?.inspectionRun
          ? `New run ${currentInspection.state}${candidate ? '; prior export available' : ''}`
          : pendingStatus(candidate, exactReview, latestJob),
      exactCandidateReview: exactReview
        ? {
            record: exactReview.record,
            movieSha256: candidate.media.video.sha256,
            recommendation: exactReview.recommendation,
            reviewedAt: exactReview.reviewedAt,
            scope: exactReview.scope,
            scores: exactReview.data.scores ?? null,
          }
        : null,
      findings:
        findingsSource?.recommendation === 'REWORK'
          ? findFindings(findingsSource?.data, row.id)
          : [],
      findingsMovieSha256: findingsSource?.movieSha256 ?? null,
      findingsScope: exactReview
        ? 'Selected candidate movie'
        : findingsSource
          ? 'Historical reviewed movie. Source repairs may exist; replacement acceptance is not established.'
          : 'No located encoded review.',
      pendingGates: row.pendingGates,
      inventoryReadinessClass: row.readinessClass,
      t7: {
        plan: row.T7Closing,
        recordedApplications: row.T7Applied,
        finalApplicationIndex: endings?.binding ?? null,
        sourceOnlyApplicationRecorded: Boolean(ending),
        appliedBytesMatchCurrent: endingMatchesCurrent,
        appliedEndingSpeechMatchesCurrent: endingSpeechMatchesCurrent,
        audioOrMovieRenewalImplied: false,
        liveEndingChangedSinceInventory: drift.some(
          (item) => item.path === row.current.lesson.path,
        ),
      },
      paperUse: {
        sourceIntegrated: papers.length > 0,
        sourceRecords: papers,
        scope: `Prepared paperFigure import/call scan: ${papers.length} source module(s). This is static source evidence, not a claim of personal viewing or of paper use in every available export. Article citations and paper-themed scene names do not count as inserted paper figures.`,
      },
      playback: candidate
        ? {
            kind: 'exact-candidate',
            url: candidate.media.video.path,
            captions: candidate.media.vtt.path,
            poster: candidate.media.poster.path,
            movieSha256: candidate.media.video.sha256,
            currentSourceExact: candidate.changedSinceFreeze.length === 0,
            review: exactReview?.recommendation ?? 'MISSING',
            cohort: sharedRun && !candidate.inspectionRun ? 'prior-export' : 'current-candidate',
          }
        : {
            kind: 'historical-published',
            url: historical.url,
            captions: historical.captions,
            poster: historical.poster,
            movieSha256: historical.sha256,
            currentSourceExact: false,
            review: 'Historical published fallback; no new candidate implied',
          },
      historicalPublished: {
        ...historical,
        scope:
          'Historical manifest entry. Its public URL was read from the committed availability manifest; this generator does not newly verify remote delivery.',
      },
    };
    if (lesson.sourceCorrection) lesson.renderStatus += `; ${lesson.sourceCorrection.status}`;
    lessons.push(lesson);
    if (candidate)
      assetManifest.lessons.push({
        id: row.id,
        movieSha256: candidate.media.video.sha256,
        ...candidate.media,
      });
  }
  const inputDriftDuringGeneration = [];
  const inputs = await Promise.all(tracked.values());
  for (const record of inputs) {
    const current = await fs.stat(path.resolve(root, record.path));
    if (
      !record.stableDuringRead ||
      current.mtimeMs !== record.mtimeMs ||
      current.size !== record.bytes
    )
      inputDriftDuringGeneration.push(record.path);
  }
  const latestCompleted = lessons
    .filter((row) => row.candidate)
    .sort((a, b) => String(b.candidate.finishedAt).localeCompare(String(a.candidate.finishedAt)))
    .map((row) => row.id);
  const firstEight = inventory.value.largeArtifactChecks.map((record) => ({
    id: record.path.split('/output/')[1]?.split('/')[0],
    movieSha256: record.sha256,
    path: record.path,
  }));
  const data = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    interval: { startedAt, finishedAt: new Date().toISOString() },
    inventory: inventory.binding,
    publishedManifest: published.binding,
    collection: collection.binding,
    sharedInspectionRun: sharedRun?.record ?? null,
    candidateInspectionRun: correctionRun?.record ?? null,
    correctionIntake: correctionIntake?.binding ?? null,
    summary: {
      lessons: lessons.length,
      scriptReviewsRecorded: lessons.filter((row) => row.inspected.scriptReviewRecorded).length,
      encodedVisualReviewsRecorded: lessons.filter(
        (row) => row.inspected.encodedVisualReviewRecorded,
      ).length,
      noEncodedVisualReviewLocated: lessons.filter(
        (row) => !row.inspected.encodedVisualReviewRecorded,
      ).length,
      completedCandidateMovies: latestCompleted.length,
      renderPending: lessons.filter((row) => !row.candidate).length,
      exactCandidatePOST: lessons.filter(
        (row) => row.exactCandidateReview?.recommendation === 'POST',
      ).length,
      exactCandidateREWORK: lessons.filter(
        (row) => row.exactCandidateReview?.recommendation === 'REWORK',
      ).length,
      exactCandidateScopedAccepted: lessons.filter(
        (row) => row.exactCandidateReview?.recommendation === 'ACCEPTED_SCOPED_ENCODED',
      ).length,
      candidateReviewMissing: lessons.filter((row) => row.candidate && !row.exactCandidateReview)
        .length,
      candidateMatchesCurrentSource: lessons.filter(
        (row) => row.candidate && !row.candidate.changedSinceFreeze.length,
      ).length,
      sourceChangedSinceInventory: sourceDrift.length,
      inputsChangedWhileGenerating: inputDriftDuringGeneration.length,
      preparedPaperFigureSource: lessons.filter((row) => row.paperUse.sourceIntegrated).length,
      newRunComplete: sharedRun?.jobs.filter((job) => job.state === 'complete').length ?? null,
      newRunPending: sharedRun?.jobs.filter((job) => job.state !== 'complete').length ?? null,
      newRunManualUnrevisited:
        sharedRun?.jobs.filter((job) => job.directionReview === 'unrevisited').length ?? null,
      newRunEncodedPOST: sharedRun
        ? lessons.filter(
            (row) =>
              row.candidate?.inspectionRun && row.exactCandidateReview?.recommendation === 'POST',
          ).length
        : null,
      newRunEncodedREWORK: sharedRun
        ? lessons.filter(
            (row) =>
              row.candidate?.inspectionRun && row.exactCandidateReview?.recommendation === 'REWORK',
          ).length
        : null,
      newRunEncodedReviewMissing: sharedRun
        ? lessons.filter((row) => row.candidate?.inspectionRun && !row.exactCandidateReview).length
        : null,
      sourceOnlyEndingApplications: lessons.filter((row) => row.t7.sourceOnlyApplicationRecorded)
        .length,
      appliedEndingSpeechMatchesCurrent: lessons.filter(
        (row) => row.t7.appliedEndingSpeechMatchesCurrent,
      ).length,
      appliedEndingRawBytesMatchCurrent: lessons.filter((row) => row.t7.appliedBytesMatchCurrent)
        .length,
    },
    latestCompleted,
    firstEightInventoryExports: firstEight,
    recordedScriptRevisitedIds: lessons
      .filter((row) => row.inspected.scriptReviewRecorded)
      .map((row) => row.id),
    encodedVisuallyRevisitedIds: lessons
      .filter((row) => row.inspected.encodedVisualReviewRecorded)
      .map((row) => row.id),
    noEncodedRevisitLocatedIds: lessons
      .filter((row) => !row.inspected.encodedVisualReviewRecorded)
      .map((row) => row.id),
    sourceDrift,
    inputDriftDuringGeneration,
    limits: [
      'This is an evidence index, not a new personal review or a score reassignment.',
      'A recorded source/script review, mechanical parity, an available movie and exact encoded acceptance are separate states.',
      'POST applies only to the hash named by that review. It does not establish continuous listening, Apple playback or publication.',
      'Known findings refer to the specified movie. A source repair does not close a film finding until replacement evidence exists.',
      'Snapshot drift is explicit. Regenerate into a new output directory after the coordinated source freeze.',
    ],
    lessons,
  };
  const chunked = assetManifest.lessons.flatMap((row) =>
    Object.entries(row)
      .filter(([, value]) => value?.bytes > GALLERY_UPLOAD_LIMITS.chunkBytes)
      .map(([kind, asset]) => ({ id: row.id, kind, bytes: asset.bytes, path: asset.path })),
  );
  assetManifest.inspectionScope =
    'Exact locally hashed candidate assets only. Historical published fallbacks use their existing labeled public URLs. No upload performed.';
  return {
    data,
    assetManifest,
    inputs,
    progressSnapshot: sharedRun?.observedProgress ?? null,
    progressOverlaySnapshots: sharedRun?.observedOverlays ?? [],
    candidateProgressSnapshot: correctionRun?.observedProgress ?? null,
    compatibility: {
      privateGalleryManifestVersion: 1,
      directRequestMaximumBytes: 40 * 1024 * 1024,
      chunkRequestBytes: GALLERY_UPLOAD_LIMITS.chunkBytes,
      maximumObjectBytes: GALLERY_UPLOAD_LIMITS.objectBytes,
      requiresChunkedUpload: chunked,
      exceedsMaximumObjectBytes: chunked.filter(
        (asset) => asset.bytes > GALLERY_UPLOAD_LIMITS.objectBytes,
      ),
      scope:
        'Local chunked transport contract. Hosted Site/proxy/R2 verification remains separate.',
      uploadPerformed: false,
    },
  };
}
