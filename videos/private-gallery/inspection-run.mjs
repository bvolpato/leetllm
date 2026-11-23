import assert from 'node:assert/strict';
import path from 'node:path';

export function inspectionProgressRows(plan, progress) {
  assert.equal(plan.kind, 'leetllm.inspection-collection');
  assert.equal(progress.kind, 'leetllm.inspection-progress');
  assert.equal(plan.lessons.length, progress.lessons.length, 'Inspection progress omits lessons');
  const byId = new Map(progress.lessons.map((row) => [row.id, row]));
  assert.equal(byId.size, progress.lessons.length, 'Duplicate progress lesson');
  assert.equal(
    new Set(plan.lessons.map((row) => row.id)).size,
    plan.lessons.length,
    'Duplicate planned lesson',
  );
  const statuses = new Set([
    'pending',
    'audio',
    'audio-ready',
    'rendering',
    'complete',
    'failed',
    'interrupted',
  ]);
  return plan.lessons.map((entry) => {
    const row = byId.get(entry.id);
    assert(row && statuses.has(row.status), `Unknown inspection state: ${entry.id}`);
    if (row.status === 'complete')
      assert(
        row.delivery?.movie && row.delivery?.receipt,
        `Complete inspection has no delivery: ${entry.id}`,
      );
    return { entry, progress: row };
  });
}

/** Adapter for the shared all-199 renderer. Technical completion creates no review. */
export async function collectInspectionRun({
  directory,
  read,
  bind,
  progressSnapshotPath,
  progressOverlayPaths = [],
  strictDelivery = false,
}) {
  const plan = await read(path.join(directory, 'inspection.json'));
  const progress = await read(path.join(directory, 'progress.json'), { preserveRaw: true });
  const progressSnapshot = progressSnapshotPath
    ? { ...progress.binding, path: progressSnapshotPath, observedAtPath: progress.binding.path }
    : progress.binding;
  const rows = inspectionProgressRows(plan.value, progress.value);
  assert.equal(rows.length, 199, 'A shared inspection run must cover all 199 lessons');
  const selected = new Map(
    rows.map((row) => [
      row.entry.id,
      { ...row, ledger: progressSnapshot, updatedAt: progress.value.updatedAt, observations: [] },
    ]),
  );
  const overlays = [];
  const observedOverlays = [];
  for (const [index, file] of progressOverlayPaths.entries()) {
    const overlay = await read(file, { preserveRaw: true });
    assert.equal(overlay.value.version, 1);
    assert.equal(overlay.value.kind, 'leetllm.inspection-progress');
    assert.equal(
      overlay.value.inspectionPlan?.sha256,
      plan.binding.sha256,
      'Foreign overlay inspection plan',
    );
    assert.equal(
      path.resolve(overlay.value.inspectionPlan.path),
      path.resolve(directory, 'inspection.json'),
      'Foreign overlay inspection path',
    );
    const parent = await read(overlay.value.parentProgress.path);
    assert.equal(
      parent.binding.sha256,
      overlay.value.parentProgress.sha256,
      'Overlay parent progress changed',
    );
    if (overlay.value.parentProgress.bytes !== undefined)
      assert.equal(parent.binding.bytes, overlay.value.parentProgress.bytes);
    inspectionProgressRows(plan.value, parent.value);
    const ids = overlay.value.supplementalSelection;
    assert(
      Array.isArray(ids) && ids.length > 0 && new Set(ids).size === ids.length,
      'Invalid overlay selection',
    );
    assert.equal(
      overlay.value.lessons.length,
      ids.length,
      'Overlay selection differs from its rows',
    );
    assert.equal(
      new Set(overlay.value.lessons.map((row) => row.id)).size,
      ids.length,
      'Duplicate overlay lesson',
    );
    const name = `inspection-progress-overlay-${String(index + 1).padStart(2, '0')}-observed.json`;
    const snapshot = progressSnapshotPath
      ? {
          ...overlay.binding,
          path: path.join(path.dirname(progressSnapshotPath), name),
          observedAtPath: overlay.binding.path,
        }
      : overlay.binding;
    const applied = [];
    for (const state of overlay.value.lessons) {
      const previous = selected.get(state.id);
      assert(
        ids.includes(state.id) && previous?.entry.mode === 'stage',
        `Overlay is not a selected Stage lesson: ${state.id}`,
      );
      assert.equal(state.directionReview, 'unrevisited', 'Overlay cannot grant manual review');
      if (state.status !== 'complete') continue;
      assert(
        state.delivery?.movie && state.delivery?.receipt,
        `Complete overlay has no delivery: ${state.id}`,
      );
      selected.set(state.id, {
        entry: previous.entry,
        progress: state,
        ledger: snapshot,
        updatedAt: overlay.value.updatedAt,
        overlay: true,
        observations: [
          ...previous.observations,
          {
            ledger: previous.ledger,
            id: state.id,
            status: previous.progress.status,
            error: previous.progress.error ?? null,
            attempts: previous.progress.attempts ?? [],
          },
          {
            ledger: parent.binding,
            id: state.id,
            status: parent.value.lessons.find((row) => row.id === state.id).status,
            error: parent.value.lessons.find((row) => row.id === state.id).error ?? null,
            attempts: parent.value.lessons.find((row) => row.id === state.id).attempts ?? [],
          },
        ],
      });
      applied.push(state.id);
    }
    overlays.push({
      record: overlay.binding,
      snapshot,
      parent: parent.binding,
      selection: ids,
      completedSelection: applied,
    });
    if (overlay.rawBytes) observedOverlays.push({ name, bytes: overlay.rawBytes });
  }
  const jobs = [];
  for (const {
    entry,
    progress: state,
    ledger,
    updatedAt,
    overlay,
    observations,
  } of selected.values()) {
    const manifest = entry.sourceManifest;
    const own = manifest.closure.files.filter(
      (file) =>
        file.path === manifest.lessonFile ||
        file.path === manifest.moduleFile ||
        file.path.startsWith(`videos/films/${entry.id}/`),
    );
    const changed = [];
    for (const file of own) {
      const actual = await bind(file.path).catch((error) =>
        error.code === 'ENOENT' ? null : Promise.reject(error),
      );
      if (actual?.sha256 !== file.sha256)
        changed.push({
          path: file.path,
          frozenSha256: file.sha256,
          currentSha256: actual?.sha256 ?? null,
        });
    }
    let media = null;
    let verification = null;
    let overlayChecks = null;
    let artifactChecks = null;
    if (state.status === 'complete') {
      const delivery = state.delivery;
      verification = await read(delivery.receipt.path);
      assert.equal(verification.binding.sha256, delivery.receipt.sha256);
      assert.equal(delivery.fullDecode, 'passed');
      assert.equal(verification.value.fullDecode, 'passed');
      assert.equal(delivery.sourceFingerprint, manifest.fingerprint);
      assert.equal(verification.value.fingerprint, manifest.fingerprint);
      const movie = await bind(delivery.movie.path);
      assert.equal(movie.sha256, delivery.movie.sha256);
      assert.equal(movie.sha256, verification.value.sha256);
      assert.equal(movie.bytes, delivery.movie.bytes);
      const output = path.dirname(delivery.movie.path);
      const artifacts = verification.value.artifactSha256;
      if (overlay || strictDelivery) {
        if (strictDelivery) {
          assert.equal(verification.value.id, entry.id, 'Foreign candidate receipt ID');
          assert.equal(movie.bytes, verification.value.bytes, 'Candidate receipt length changed');
          assert.equal(
            path.resolve(delivery.movie.path),
            path.resolve(entry.output, entry.id, `${entry.id}.mp4`),
            'Foreign candidate output',
          );
          assert.deepEqual(
            delivery.runtime,
            plan.value.runtime.provenance,
            'Foreign delivery runtime',
          );
          assert.deepEqual(
            verification.value.renderEngine,
            plan.value.runtime.provenance,
            'Foreign receipt runtime',
          );
        }
        for (const [name, expected] of Object.entries(artifacts)) {
          const file = path.resolve(output, name);
          const relative = path.relative(output, file);
          assert(
            relative &&
              relative !== '..' &&
              !relative.startsWith(`..${path.sep}`) &&
              !path.isAbsolute(relative),
            'Overlay artifact escapes output',
          );
          assert.equal(
            (await bind(file)).sha256,
            expected,
            `Overlay artifact changed: ${entry.id}/${name}`,
          );
        }
        let filmCheck = null;
        if (entry.mode === 'stage') {
          filmCheck = await read(path.join(output, 'film-check.json'));
          assert.equal(filmCheck.value.id, entry.id);
          assert.equal(filmCheck.value.sourceFingerprint, manifest.fingerprint);
          assert.equal(filmCheck.value.videoSha256, movie.sha256);
          assert.equal(filmCheck.value.errors, 0, 'Overlay Stage film check has errors');
        }
        artifactChecks = {
          artifactHashes: Object.keys(artifacts).length,
          filmCheck: filmCheck?.binding ?? null,
        };
        if (overlay) overlayChecks = artifactChecks;
      }
      const poster = [
        'poster.jpg',
        ...Object.keys(artifacts)
          .filter((name) => /^\d\d-.*\.png$/.test(name))
          .sort(),
        'overview.png',
      ].find((name) => artifacts[name]);
      assert(poster, `No actual inspection poster: ${entry.id}`);
      media = {};
      for (const [kind, file, contentType] of [
        ['video', `${entry.id}.mp4`, 'video/mp4'],
        ['poster', poster, poster.endsWith('.jpg') ? 'image/jpeg' : 'image/png'],
        ['vtt', `${entry.id}.vtt`, 'text/vtt; charset=utf-8'],
        ['srt', `${entry.id}.srt`, 'application/x-subrip; charset=utf-8'],
        ['chapters', `${entry.id}.chapters.txt`, 'text/plain; charset=utf-8'],
      ]) {
        const fileRecord = await bind(path.join(output, file));
        assert.equal(
          fileRecord.sha256,
          kind === 'video' ? movie.sha256 : artifacts[file],
          `Inspection artifact changed: ${entry.id}/${file}`,
        );
        media[kind] = {
          path: `media/${entry.id}/${fileRecord.sha256}/${file}`,
          source: fileRecord.path,
          sha256: fileRecord.sha256,
          bytes: fileRecord.bytes,
          contentType,
        };
      }
    }
    jobs.push({
      id: entry.id,
      directory,
      plan: plan.binding,
      job: ledger,
      createdAt: plan.value.createdAt,
      finishedAt: state.attempts?.at(-1)?.finishedAt ?? updatedAt,
      state: state.status,
      runtimeVersion: plan.value.runtime.version,
      fingerprint: manifest.fingerprint,
      verification: verification?.binding ?? null,
      duration: verification?.value.duration ?? null,
      media,
      changedSinceFreeze: changed,
      inspectionRun: true,
      directionReview: state.directionReview ?? 'unrevisited',
      error: state.error ?? null,
      progressObservations: observations,
      overlayChecks,
      artifactChecks,
    });
  }
  return {
    record: {
      plan: plan.binding,
      progress: progress.binding,
      progressSnapshot,
      progressOverlays: overlays,
      runtime: plan.value.runtime,
      sourceFreeze: {
        authority: plan.value.sourceFreeze.authority,
        sha256: plan.value.sourceFreeze.sha256,
      },
      status: progress.value.status,
    },
    jobs,
    observedProgress: progress.rawBytes ?? null,
    observedOverlays,
  };
}
