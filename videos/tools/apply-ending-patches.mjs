#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import YAML from 'yaml';

export const sha256 = (value) => createHash('sha256').update(value).digest('hex');

// This prepares bytes only. Review, source-owner holds and application are separate gates.
export function prepareEndingPatch(raw, plan) {
  assert.equal(sha256(raw), plan.narration.sha256, `${plan.id}: narration changed`);
  const before = YAML.parse(raw);
  const { sceneIndex, sceneId, beatIndex, field } = plan.target;
  assert.equal(field, 'say');
  assert.equal(sceneIndex, before.scenes.length - 1, `${plan.id}: expected closing scene`);
  const scene = before.scenes[sceneIndex];
  assert.equal(scene.id, sceneId);
  assert.equal(beatIndex, scene.beats.length - 1, `${plan.id}: expected final beat`);
  assert.equal(scene.beats[beatIndex].say, plan.oldSay);
  assert.notEqual(plan.newSay, plan.oldSay);
  const expected = structuredClone(before);
  expected.scenes[sceneIndex].beats[beatIndex].say = plan.newSay;
  const cuePatches = plan.cuePhrasePatches ?? [];
  for (const patch of cuePatches) {
    assert.equal(patch.sceneIndex, sceneIndex);
    assert.equal(patch.beatIndex, beatIndex);
    const cue = expected.scenes[sceneIndex].beats[beatIndex].visual_cues[patch.cueIndex];
    assert.equal(cue.id, patch.cueId);
    assert.equal(cue.phrase, patch.old);
    assert.equal(
      patch.old,
      plan.oldSay,
      'Only an explicitly reviewed full closing phrase may change',
    );
    assert.equal(patch.new, plan.newSay);
    cue.phrase = patch.new;
  }
  const patches = plan.rawPatches ?? [plan.rawPatch];
  assert.equal(patches.length, 1 + cuePatches.length);
  let candidate = raw;
  let rightEdge = raw.length;
  for (const patch of [...patches].sort((a, b) => b.offset - a.offset)) {
    assert(Number.isInteger(patch.offset) && patch.offset >= 0);
    assert(patch.offset + patch.old.length <= rightEdge, 'Overlapping raw patches');
    assert.equal(patch.oldOccurrences, 1);
    assert.equal(raw.split(patch.old).length - 1, 1, 'Raw anchor must be unique');
    assert.equal(candidate.slice(patch.offset, patch.offset + patch.old.length), patch.old);
    candidate =
      candidate.slice(0, patch.offset) +
      patch.new +
      candidate.slice(patch.offset + patch.old.length);
    rightEdge = patch.offset;
  }
  assert.deepEqual(
    YAML.parse(candidate),
    expected,
    `${plan.id}: an unapproved parsed field changed`,
  );
  const afterSha256 = plan.expectedAfterSha256 ?? plan.rawPatch.expectedAfterSha256;
  assert.equal(sha256(candidate), afterSha256, `${plan.id}: unexpected result bytes`);
  let inverse = candidate;
  for (const patch of [...patches].sort(
    (a, b) => (b.afterOffset ?? b.offset) - (a.afterOffset ?? a.offset),
  )) {
    const offset = patch.afterOffset ?? patch.offset;
    assert.equal(inverse.slice(offset, offset + patch.new.length), patch.new);
    inverse = inverse.slice(0, offset) + patch.old + inverse.slice(offset + patch.new.length);
  }
  assert.equal(inverse, raw, `${plan.id}: inverse failed`);
  return { candidate, beforeSha256: sha256(raw), afterSha256, rawPatches: patches.length };
}

function repositoryFile(root, name) {
  assert(typeof name === 'string' && !path.isAbsolute(name));
  const result = path.resolve(root, name);
  assert(
    !path.relative(root, result).startsWith('..') && result !== root,
    'Path escapes repository',
  );
  return result;
}

async function verifiedFile(root, record) {
  assert(/^[a-f0-9]{64}$/.test(record.sha256));
  const file = repositoryFile(root, record.path);
  assert.equal(await fs.realpath(file), file, `Symlink input is not supported: ${record.path}`);
  const bytes = await fs.readFile(file);
  assert.equal(sha256(bytes), record.sha256, `${record.path}: binding changed`);
  return bytes;
}

function authoredPlan(plan) {
  const copy = structuredClone(plan);
  delete copy.paintedNextTitle.source;
  delete copy.paintedNextTitle.status; // Closing-code inspection prose is provenance, not a speech patch.
  return copy;
}

async function writeJson(file, value) {
  await fs.writeFile(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
}

export async function applyEndingPatches({ root, authorization, archiveDirectory, apply = false }) {
  root = await fs.realpath(root);
  for (const record of authorization.preconditions ?? []) await verifiedFile(root, record);
  const batch = JSON.parse(await verifiedFile(root, authorization.plan));
  const reviewed = JSON.parse(await verifiedFile(root, authorization.reviewedPlan));
  const peer = JSON.parse(await verifiedFile(root, authorization.peer));
  assert.deepEqual(peer.plan, authorization.reviewedPlan);
  assert(peer.decision.startsWith('accept-'));
  assert.deepEqual(peer.findings, []);
  assert.deepEqual(
    batch.plans.map((p) => p.id),
    authorization.subjectIds,
  );
  assert.deepEqual(
    reviewed.plans.map((p) => p.id),
    authorization.subjectIds,
  );
  assert.equal(new Set(authorization.subjectIds).size, batch.plans.length);
  const holds = JSON.parse(await verifiedFile(root, authorization.ownerHolds));
  const prepared = [];
  for (const plan of batch.plans) {
    assert.equal(plan.narration.path, `videos/lessons/${plan.id}.lesson.yaml`);
    const accepted = reviewed.plans.find((p) => p.id === plan.id);
    assert.deepEqual(
      authoredPlan(plan),
      authoredPlan(accepted),
      `${plan.id}: not the reviewed authored patch`,
    );
    assert.equal(peer.rows.find((row) => row.id === plan.id)?.decision, 'accept-scoped-proposal');
    const hold = holds.subjects.find((row) => row.id === plan.id);
    assert(hold?.noActiveWriter && hold?.ownerConfirmed, `${plan.id}: source-owner hold missing`);
    assert(
      holds.coordinator.clearSubjectIds.includes(plan.id),
      `${plan.id}: live-plan clearance missing`,
    );
    if (
      JSON.stringify(plan.paintedNextTitle.source) !==
      JSON.stringify(accepted.paintedNextTitle.source)
    ) {
      const lineage = authorization.sourceLineage?.find((row) => row.id === plan.id);
      assert(lineage, plan.id + ': structural lineage missing');
      assert.deepEqual(lineage.before, accepted.paintedNextTitle.source);
      assert.deepEqual(lineage.after, plan.paintedNextTitle.source);
      await verifiedFile(root, lineage.provenance);
    }
    let source = plan.paintedNextTitle.source;
    const override = authorization.sourceOverrides?.find((row) => row.id === plan.id);
    if (override) {
      assert.deepEqual(source, override.before);
      await verifiedFile(root, override.provenance);
      source = override.after;
    }
    await verifiedFile(root, source);
    const article = (await verifiedFile(root, plan.canonicalNext.article)).toString('utf8');
    for (const support of plan.canonicalNext.article.support) {
      assert.equal(
        article.slice(support.offset, support.offset + support.quote.length),
        support.quote,
      );
      assert.equal(article.slice(0, support.offset).split('\n').length, support.line);
    }
    const raw = (await verifiedFile(root, plan.narration)).toString('utf8');
    prepared.push({ plan, source, raw, ...prepareEndingPatch(raw, plan) });
  }
  const protectedFiles = authorization.protectedFiles ?? [];
  for (const record of protectedFiles) await verifiedFile(root, record);
  const summary = prepared.map(({ plan, beforeSha256, afterSha256, rawPatches }) => ({
    id: plan.id,
    path: plan.narration.path,
    target: plan.target,
    beforeSha256,
    afterSha256,
    rawPatches,
  }));
  if (!apply) return { mode: 'read-only', prepared: summary, productionChanged: false };

  const archive = path.resolve(archiveDirectory);
  const relativeArchive = path.relative(root, archive);
  assert(
    relativeArchive.startsWith(`build${path.sep}`) || relativeArchive.startsWith(`..${path.sep}`),
    'Archive must be outside product sources',
  );
  assert.equal(
    await fs.realpath(path.dirname(archive)),
    path.dirname(archive),
    'Archive parent must exist without symlinks',
  );
  await fs.mkdir(archive); // Existing archives are immutable and never reused.
  assert.equal(await fs.realpath(archive), archive, 'Symlink archive is not supported');
  const archiveInputs = [
    authorization.plan,
    authorization.reviewedPlan,
    authorization.peer,
    authorization.ownerHolds,
    ...(authorization.preconditions ?? []),
    ...(authorization.sourceOverrides ?? []).map((row) => row.provenance),
    ...(authorization.sourceLineage ?? []).map((row) => row.provenance),
    ...protectedFiles,
  ];
  for (const { plan, source } of prepared) archiveInputs.push(plan.narration, source);
  const seen = new Set();
  for (const record of archiveInputs) {
    if (seen.has(record.path)) continue;
    seen.add(record.path);
    const bytes = await verifiedFile(root, record);
    const file = path.join(archive, 'before', record.path);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, bytes, { flag: 'wx' });
  }
  await writeJson(path.join(archive, 'prepared.json'), { authorization, prepared: summary });
  const applied = [];
  try {
    for (const item of prepared) {
      const file = repositoryFile(root, item.plan.narration.path);
      assert.equal(
        await fs.readFile(file, 'utf8'),
        item.raw,
        `${item.plan.id}: changed after preparation`,
      );
      const temporary = `${file}.ending-${randomUUID()}.tmp`;
      try {
        const stat = await fs.stat(file);
        await fs.writeFile(temporary, item.candidate, { flag: 'wx', mode: stat.mode });
        assert.equal(
          await fs.readFile(file, 'utf8'),
          item.raw,
          `${item.plan.id}: concurrent source change`,
        );
        await fs.rename(temporary, file);
      } finally {
        await fs.rm(temporary, { force: true });
      }
      applied.push(item.plan.id);
    }
    for (const item of prepared)
      assert.equal(
        sha256(await fs.readFile(repositoryFile(root, item.plan.narration.path))),
        item.afterSha256,
      );
    for (const record of protectedFiles) await verifiedFile(root, record);
  } catch (error) {
    await writeJson(path.join(archive, 'incomplete.json'), {
      applied,
      error: error.stack,
      prepared: summary,
    });
    throw new Error(
      `Ending application stopped. Preserve ${archive}; applied: ${applied.join(', ')}`,
      { cause: error },
    );
  }
  const result = {
    mode: 'applied-source-only',
    applied,
    prepared: summary,
    protectedFilesUnchanged: protectedFiles.length,
    archive,
    timing:
      'All changed beats require new real TTS/provider-word timings. No old timed audio or movie approval is renewed.',
    gates: [
      'Fresh current coverage/script/source authority',
      'Actual-provider timing and cue resolution',
      'Native final-scene and prior-result checks',
      'Separate frozen render/admission and independent encoded review',
    ],
  };
  await writeJson(path.join(archive, 'applied.json'), result);
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(
      'node videos/tools/apply-ending-patches.mjs --authorization JSON --archive NEW_BUILD_DIRECTORY [--root REPOSITORY] [--apply]',
    );
    return;
  }
  for (let i = 0; i < args.length; i++) {
    if (['--authorization', '--archive', '--root'].includes(args[i]))
      assert(args[++i] && !args[i].startsWith('--'));
    else assert.equal(args[i], '--apply', `Unknown option ${args[i]}`);
  }
  const value = (flag, fallback) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback);
  assert(value('--authorization') && value('--archive'));
  const root = path.resolve(value('--root', fileURLToPath(new URL('../../', import.meta.url))));
  const authorization = JSON.parse(await fs.readFile(value('--authorization'), 'utf8'));
  const result = await applyEndingPatches({
    root,
    authorization,
    archiveDirectory: value('--archive'),
    apply: args.includes('--apply'),
  });
  console.log(JSON.stringify(result, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  main().catch((error) => {
    console.error(error.stack);
    process.exitCode = 1;
  });
