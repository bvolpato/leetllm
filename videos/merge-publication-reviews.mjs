#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (key, fallback) => (args.includes(key) ? args[args.indexOf(key) + 1] : fallback);
const reviews = resolve(root, option('--reviews', 'build/video-youtube-curation-20261021'));
const input = resolve(root, option('--input', 'build/video-complete-curriculum'));
const output = resolve(root, option('--output', 'videos/reviews/youtube-selection.json'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = async (file) => JSON.parse(await readFile(file, 'utf8'));
const rubricBytes = await readFile(join(root, 'videos/publication-rubric.json'));
const rubric = JSON.parse(rubricBytes),
  rubricSha256 = sha256(rubricBytes);
const receipts = await json(join(input, 'manifest.json'));
const merged = {
  version: 1,
  rubricSha256,
  scope:
    'Editorial selection of the current videos. Reviewers read every complete script and existing quality rationale, viewed every scene overview and sampled motion strip, and inspected native encoded frames for every keep and borderline decision. Animation source was inspected where needed. Existing automated frame and production audits remain separate evidence. This review does not claim continuous playback, complete audible listening, or predict audience size.',
  reviewers: [],
  lessons: [],
};
const byId = new Map();
for (let shard = 1; shard <= 5; shard++) {
  const file = join(reviews, `reviews-${shard}.json`),
    bytes = await readFile(file),
    report = JSON.parse(bytes);
  const assignment = await json(join(reviews, `assignment-${shard}.json`));
  if (
    report.version !== 1 ||
    report.rubricSha256 !== rubricSha256 ||
    report.lessons?.length !== assignment.length
  )
    throw new Error(`Incomplete or stale report ${shard}`);
  const assigned = new Set(assignment.map((row) => row.id));
  merged.reviewers.push({ id: report.reviewer, scope: report.scope, reportSha256: sha256(bytes) });
  for (const row of report.lessons) {
    if (!assigned.delete(row.id) || byId.has(row.id))
      throw new Error(`Unknown or duplicate review: ${row.id}`);
    const material = await json(join(reviews, 'materials', row.id, 'material.json'));
    const receipt = receipts.find((item) => item.id === row.id);
    if (
      !receipt ||
      row.movieSha256 !== receipt.sha256 ||
      row.sourceFingerprint !== receipt.fingerprint ||
      material.movieSha256 !== receipt.sha256 ||
      material.sourceFingerprint !== receipt.fingerprint
    )
      throw new Error(`Stale video/source evidence: ${row.id}`);
    if (
      JSON.stringify(row.reviewedScenes) !==
      JSON.stringify(material.script.map((scene) => scene.id))
    )
      throw new Error(`Incomplete scene review: ${row.id}`);
    if (Object.keys(row.scores ?? {}).length !== rubric.dimensions.length)
      throw new Error(`Incomplete scores: ${row.id}`);
    let total = 0,
      floors = true;
    for (const dimension of rubric.dimensions) {
      const score = row.scores[dimension.id];
      if (!Number.isInteger(score) || score < 0 || score > dimension.maximum)
        throw new Error(`Invalid score: ${row.id}/${dimension.id}`);
      total += score;
      floors &&= score >= dimension.minimum;
    }
    if (!Array.isArray(row.blockers)) throw new Error(`Missing blocker review: ${row.id}`);
    const keep =
      total >= rubric.minimumScore &&
      floors &&
      material.qualityScore >= rubric.minimumQualityScore &&
      row.blockers.length === 0;
    if (row.decision !== (keep ? 'keep' : 'skip')) throw new Error(`Cutoff mismatch: ${row.id}`);
    const viewed = new Map((row.viewedImages ?? []).map((image) => [image.path, image.sha256]));
    for (const overview of [material.sceneOverview, material.motionOverview])
      if (viewed.get(overview.path) !== overview.sha256)
        throw new Error(`Missing current overview evidence: ${row.id}`);
    const borderline =
      (total >= 77 && total <= 87) ||
      (row.scores.visualLearningGain >= 27 && row.scores.visualLearningGain <= 33);
    const encoded = await json(join(input, row.id, 'encoded-review/verification.json'));
    if (encoded.videoSha256 !== receipt.sha256)
      throw new Error(`Stale encoded evidence: ${row.id}`);
    const nativeImages = Object.entries(encoded.artifactSha256)
      .filter(([file]) => /^frames\/sample-\d+\.png$/.test(file))
      .map(([file, sha256]) => ({
        path: relative(root, join(input, row.id, 'encoded-review', file)),
        sha256,
      }));
    if (
      (keep || borderline) &&
      !nativeImages.some((image) => viewed.get(image.path) === image.sha256)
    )
      throw new Error(`Missing native encoded evidence: ${row.id}`);
    const allowedImages = new Map(
      [material.sceneOverview, material.motionOverview, ...nativeImages].map((image) => [
        image.path,
        image.sha256,
      ]),
    );
    for (const image of row.viewedImages) {
      if (
        allowedImages.get(image.path) !== image.sha256 ||
        sha256(await readFile(resolve(root, image.path))) !== image.sha256
      )
        throw new Error(`Changed or foreign image evidence: ${row.id}/${image.path}`);
    }
    if (
      !row.reason?.trim() ||
      row.visualEvidence?.length < (keep ? 2 : 1) ||
      (!keep && !row.revisitCondition?.trim())
    )
      throw new Error(`Missing decision rationale: ${row.id}`);
    for (const evidence of row.visualEvidence)
      if (!row.reviewedScenes.includes(evidence.scene) || !evidence.explanation?.trim())
        throw new Error(`Invalid scene evidence: ${row.id}`);
    byId.set(row.id, {
      ...row,
      title: receipt.title,
      group: material.group,
      qualityScore: material.qualityScore,
      selectionScore: total,
      reviewers: [...new Set([report.reviewer, ...(row.reviewers ?? [])])],
    });
  }
}
if (byId.size !== receipts.length || receipts.length !== 199)
  throw new Error('Expected exactly 199 decisions.');
merged.lessons = receipts.map((receipt) => byId.get(receipt.id));
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(merged, null, 2) + '\n');
const summary = Object.fromEntries(
  ['keep', 'skip'].map((decision) => [
    decision,
    {
      lessons: merged.lessons.filter((row) => row.decision === decision).length,
      seconds: merged.lessons
        .filter((row) => row.decision === decision)
        .reduce((sum, row) => sum + receipts.find((receipt) => receipt.id === row.id).duration, 0),
    },
  ]),
);
console.log(
  JSON.stringify({
    output,
    summary,
    blockers: merged.lessons
      .filter((row) => row.blockers.length)
      .map((row) => ({ id: row.id, blockers: row.blockers })),
  }),
);
