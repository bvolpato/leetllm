import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { prepareEndingPatch, applyEndingPatches, sha256 } from '../tools/apply-ending-patches.mjs';

function fixture(id = 'example', withCue = false) {
  const oldSay = 'The worked result remains.';
  const newSay = oldSay + ' Next, apply it to the new subject.';
  const raw = `id: ${id}\nscenes:\n  - id: closing\n    beats:\n      - say: ${JSON.stringify(oldSay)}\n        hold: 0.8\n${withCue ? `        visual_cues:\n          - id: close\n            phrase: ${JSON.stringify(oldSay)}\n            targets: [result]\n` : ''}`;
  const scalar = (field, value) => `${field}: ${JSON.stringify(value)}`;
  const makePatch = (field) => {
    const old = scalar(field, oldSay),
      next = scalar(field, newSay);
    return { offset: raw.indexOf(old), old, new: next, oldOccurrences: 1 };
  };
  const patches = [makePatch('say'), ...(withCue ? [makePatch('phrase')] : [])];
  let candidate = raw;
  for (const p of [...patches].sort((a, b) => b.offset - a.offset))
    candidate = candidate.slice(0, p.offset) + p.new + candidate.slice(p.offset + p.old.length);
  for (const p of patches)
    p.afterOffset =
      p.offset +
      patches
        .filter((q) => q.offset < p.offset)
        .reduce((n, q) => n + q.new.length - q.old.length, 0);
  return {
    raw,
    candidate,
    plan: {
      id,
      narration: { path: `videos/lessons/${id}.lesson.yaml`, sha256: sha256(raw) },
      target: { sceneIndex: 0, sceneId: 'closing', beatIndex: 0, field: 'say' },
      oldSay,
      newSay,
      rawPatches: patches,
      expectedAfterSha256: sha256(candidate),
      ...(withCue
        ? {
            cuePhrasePatches: [
              {
                sceneIndex: 0,
                beatIndex: 0,
                cueIndex: 0,
                cueId: 'close',
                old: oldSay,
                new: newSay,
              },
            ],
          }
        : {}),
      paintedNextTitle: {
        source: {
          path: `videos/films/${id}/stages/closing.mjs`,
          sha256: sha256('export default {};\n'),
        },
      },
    },
  };
}

test('a reviewed final say changes alone and its exact inverse recovers every source byte', () => {
  const f = fixture();
  const result = prepareEndingPatch(f.raw, f.plan);
  assert.equal(result.candidate, f.candidate);
  assert.equal(result.beforeSha256, sha256(f.raw));
  assert.throws(() => prepareEndingPatch(f.raw + '\n', f.plan), /narration changed/);
});

test('a raw patch that also changes a hold is rejected even with a matching expected digest', () => {
  const f = fixture(),
    p = structuredClone(f.plan);
  const old = f.raw.slice(p.rawPatches[0].offset),
    next = old.replace(p.oldSay, p.newSay).replace('hold: 0.8', 'hold: 4');
  p.rawPatches = [{ offset: f.raw.indexOf(old), old, new: next, oldOccurrences: 1 }];
  p.expectedAfterSha256 = sha256(f.raw.slice(0, p.rawPatches[0].offset) + next);
  assert.throws(() => prepareEndingPatch(f.raw, p), /unapproved parsed field/);
});

test('an explicit full closing cue phrase changes with the say, preserving its identity and targets', () => {
  const f = fixture('cue-example', true);
  assert.equal(prepareEndingPatch(f.raw, f.plan).candidate, f.candidate);
  const p = structuredClone(f.plan);
  p.cuePhrasePatches[0].cueId = 'unrelated';
  assert.throws(() => prepareEndingPatch(f.raw, p));
});

async function repository(ids) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ending-patches-'));
  const write = async (file, bytes) => {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.writeFile(path.join(root, file), bytes);
    return { path: file, sha256: sha256(bytes) };
  };
  const plans = [];
  for (const id of ids) {
    const f = fixture(id);
    await write(f.plan.narration.path, f.raw);
    await write(f.plan.paintedNextTitle.source.path, 'export default {};\n');
    const article = await write(`web/${id}.md`, 'The next mechanism.\n');
    f.plan.canonicalNext = {
      article: { ...article, support: [{ quote: 'The next mechanism.', offset: 0, line: 1 }] },
    };
    plans.push(f.plan);
  }
  const batch = await write('build/plan.json', JSON.stringify({ plans }));
  const peer = await write(
    'build/peer.json',
    JSON.stringify({
      plan: batch,
      decision: 'accept-all-scoped-proposals',
      findings: [],
      rows: ids.map((id) => ({ id, decision: 'accept-scoped-proposal' })),
    }),
  );
  const holds = await write(
    'build/holds.json',
    JSON.stringify({
      subjects: ids.map((id) => ({ id, ownerConfirmed: true, noActiveWriter: true })),
      coordinator: { clearSubjectIds: ids },
    }),
  );
  const protectedFile = await write('videos/existing-review.json', '{"historical":true}\n');
  return {
    root,
    plans,
    archiveDirectory: path.join(root, 'build/application'),
    authorization: {
      plan: batch,
      reviewedPlan: batch,
      peer,
      subjectIds: ids,
      ownerHolds: holds,
      protectedFiles: [protectedFile],
    },
  };
}

test('all subjects validate before any source or archive write', async () => {
  const f = await repository(['first', 'second']);
  try {
    const first = await fs.readFile(path.join(f.root, f.plans[0].narration.path));
    await fs.appendFile(path.join(f.root, f.plans[1].narration.path), '# another writer\n');
    await assert.rejects(applyEndingPatches({ ...f, apply: true }), /binding changed/);
    assert.deepEqual(await fs.readFile(path.join(f.root, f.plans[0].narration.path)), first);
    await assert.rejects(fs.stat(f.archiveDirectory), { code: 'ENOENT' });
  } finally {
    await fs.rm(f.root, { recursive: true, force: true });
  }
});

test('application archives the exact before bytes, preserves authority files and refuses archive reuse', async () => {
  const f = await repository(['example']);
  try {
    const original = await fs.readFile(path.join(f.root, f.plans[0].narration.path));
    const dry = await applyEndingPatches(f);
    assert.equal(dry.productionChanged, false);
    const result = await applyEndingPatches({ ...f, apply: true });
    assert.deepEqual(result.applied, ['example']);
    assert.deepEqual(
      await fs.readFile(path.join(f.archiveDirectory, 'before', f.plans[0].narration.path)),
      original,
    );
    assert.equal(
      sha256(await fs.readFile(path.join(f.root, f.plans[0].narration.path))),
      f.plans[0].expectedAfterSha256,
    );
    assert.equal(
      await fs.readFile(path.join(f.root, 'videos/existing-review.json'), 'utf8'),
      '{"historical":true}\n',
    );
    await fs.writeFile(path.join(f.root, f.plans[0].narration.path), original);
    await assert.rejects(applyEndingPatches({ ...f, apply: true }), { code: 'EEXIST' });
  } finally {
    await fs.rm(f.root, { recursive: true, force: true });
  }
});
