#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? null : args[index + 1];
};
const reviewerNumber = Number(option('--reviewer'));
const reviewer = `curator-${reviewerNumber}`;
const rubricPath = path.join(here, 'publication-rubric.json');
const rubricBytes = await readFile(rubricPath);
const rubric = JSON.parse(rubricBytes.toString('utf8'));
const rubricSha256 = createHash('sha256').update(rubricBytes).digest('hex');
const scope = option('--scope');
if (!Number.isInteger(reviewerNumber) || reviewerNumber < 1 || reviewerNumber > 5 || !scope)
  throw new Error(
    'Use --reviewer 1..5 --scope "review method and progress" and pipe JSON rows on stdin.',
  );

let body = '';
for await (const chunk of process.stdin) body += chunk;
const payload = JSON.parse(body);
if (payload.rubricSha256 && payload.rubricSha256 !== rubricSha256)
  throw new Error('Batch rubric hash is stale.');
const incoming = Array.isArray(payload) ? payload : (payload.lessons ?? payload.rows);
if (!Array.isArray(incoming) || !incoming.length)
  throw new Error('Batch must be a non-empty array of lesson rows.');

const dimensions = new Map(rubric.dimensions.map((dimension) => [dimension.id, dimension]));
const file = path.join(
  repo,
  `build/video-youtube-curation-20261021/reviews-${reviewerNumber}.json`,
);
let report;
try {
  report = JSON.parse(await readFile(file, 'utf8'));
  if (report.reviewer !== reviewer || report.rubricSha256 !== rubricSha256)
    throw new Error(`Existing report header mismatch: ${file}`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  report = { version: 1, reviewer, rubricSha256, scope, lessons: [] };
}

const byId = new Map(report.lessons.map((row) => [row.id, row]));
for (const row of incoming) {
  if (!row.id || byId.has(row.id)) {
    const previous = byId.get(row.id);
    if (previous && JSON.stringify(previous) === JSON.stringify(row)) continue;
    throw new Error(`Missing or duplicate lesson row: ${row.id}`);
  }
  const materialPath = path.join(
    repo,
    `build/video-youtube-curation-20261021/materials/${row.id}/material.json`,
  );
  const material = JSON.parse(await readFile(materialPath, 'utf8'));
  if (
    row.movieSha256 !== material.movieSha256 ||
    row.sourceFingerprint !== material.sourceFingerprint ||
    material.qualityReview?.movieSha256 !== material.movieSha256
  )
    throw new Error(`Stale movie/source evidence: ${row.id}`);
  const scenes = material.script.map((scene) => scene.id);
  if (JSON.stringify(row.reviewedScenes) !== JSON.stringify(scenes))
    throw new Error(`Scene coverage/order mismatch: ${row.id}`);
  const scoreRows = Object.entries(row.scores ?? {});
  if (scoreRows.length !== dimensions.size) throw new Error(`Missing rubric scores: ${row.id}`);
  let total = 0;
  let floors = true;
  for (const [id, score] of scoreRows) {
    const dimension = dimensions.get(id);
    if (!dimension || !Number.isInteger(score) || score < 0 || score > dimension.maximum)
      throw new Error(`Invalid ${id} score: ${row.id}`);
    total += score;
    if (score < dimension.minimum) floors = false;
  }
  const keep =
    total >= rubric.minimumScore &&
    floors &&
    material.qualityScore >= rubric.minimumQualityScore &&
    !row.blockers?.length;
  if (row.decision !== (keep ? 'keep' : 'skip'))
    throw new Error(`Cutoff mismatch for ${row.id}: total=${total}`);
  if (
    !Array.isArray(row.visualEvidence) ||
    row.visualEvidence.length < (keep ? 2 : 1) ||
    !row.reason?.trim()
  )
    throw new Error(`Missing explanation or scene evidence: ${row.id}`);
  for (const evidence of row.visualEvidence)
    if (!scenes.includes(evidence.scene) || !evidence.explanation?.trim())
      throw new Error(`Invalid scene evidence: ${row.id}`);
  if (row.decision === 'skip' && !row.revisitCondition?.trim())
    throw new Error(`Missing revisit condition: ${row.id}`);
  if (row.decision === 'keep' && row.revisitCondition != null)
    throw new Error(`Unexpected revisit condition: ${row.id}`);
  if (!Array.isArray(row.blockers) || !Array.isArray(row.viewedImages))
    throw new Error(`Missing blocker or viewed-image list: ${row.id}`);
  const expectedOverviews = new Set([
    path.join(repo, 'build/video-youtube-curation-20261021/materials', row.id, 'scenes.png'),
    path.join(repo, 'build/video-youtube-curation-20261021/materials', row.id, 'motion.png'),
  ]);
  const encodedFrames = path.join(
    repo,
    'build/video-complete-curriculum',
    row.id,
    'encoded-review/frames',
  );
  const materialNativeFrames = new Set(
    (material.qualityReview.viewedImages ?? [])
      .filter((image) => /\/sample-\d+\.png$/.test(image.path))
      .map((image) => image.path),
  );
  const names = new Set();
  for (const image of row.viewedImages) {
    const imagePath = path.resolve(repo, image.path);
    const isOverview = expectedOverviews.has(imagePath);
    const isNativeFrame =
      /\/sample-\d+\.png$/.test(image.path) &&
      (imagePath.startsWith(`${encodedFrames}${path.sep}`) || materialNativeFrames.has(image.path));
    if (!isOverview && !isNativeFrame)
      throw new Error(`Viewed image is not evidence for ${row.id}: ${image.path}`);
    const bytes = await readFile(imagePath);
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== image.sha256) throw new Error(`Viewed image hash mismatch: ${image.path}`);
    names.add(path.basename(image.path));
  }
  if (!names.has('scenes.png') || !names.has('motion.png'))
    throw new Error(`Both scene and motion overviews must be recorded: ${row.id}`);
  const borderline =
    (total >= rubric.minimumScore - 5 && total <= rubric.minimumScore + 5) ||
    (row.scores.visualLearningGain >= 27 && row.scores.visualLearningGain <= 33);
  if (
    (keep || borderline) &&
    !row.viewedImages.some((image) => /sample-\d+\.png$/.test(image.path))
  )
    throw new Error(`Native frame evidence required for keep/borderline: ${row.id}`);
  report.lessons.push(row);
  byId.set(row.id, row);
}

report.scope = scope;
const temp = `${file}.${process.pid}.tmp`;
await writeFile(temp, `${JSON.stringify(report, null, 2)}\n`);
await rename(temp, file);
console.log(
  JSON.stringify({
    reviewer,
    lessons: report.lessons.length,
    incoming: incoming.length,
    report: path.relative(repo, file),
  }),
);
