#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const equals = args.find((value) => value.startsWith(`${name}=`));
  if (equals) return equals.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const hashFile = async (file) => sha256(await readFile(file));
const posix = (value) => value.split(path.sep).join('/');
const rubricPath = path.join(here, 'publication-rubric.json');
const rubric = JSON.parse(await readFile(rubricPath, 'utf8'));
const rubricSha256 = await hashFile(rubricPath);
const inputRoot = path.resolve(repo, option('--input', 'build/video-complete-curriculum'));
const selectionPath = path.resolve(repo, option('--selection', ''));
const outputRoot = path.resolve(repo, option('--output', 'build/youtube-gallery'));
const assetBase = option('--asset-base-url', '');
const assetManifestPath = option('--asset-manifest', '');
const themeStudyPath = option('--theme-study', '');

if (!args.includes('--selection') && !args.some((value) => value.startsWith('--selection='))) {
  throw new Error('Pass --selection <canonical-selection.json>.');
}
if (!(await stat(selectionPath).catch(() => null)))
  throw new Error(`Missing selection file: ${selectionPath}`);

const selection = JSON.parse(await readFile(selectionPath, 'utf8'));
const receipts = JSON.parse(await readFile(path.join(inputRoot, 'manifest.json'), 'utf8'));
const quality = JSON.parse(
  await readFile(path.join(here, 'reviews/complete-curriculum.json'), 'utf8'),
);
const collection = JSON.parse(
  await readFile(path.join(here, 'collections/complete-curriculum.json'), 'utf8'),
).lessons;
const qualityById = new Map(quality.lessons.map((lesson) => [lesson.id, lesson]));
const collectionById = new Map(collection.map((lesson) => [lesson.id, lesson]));
const assetPrefix = assetBase || posix(path.relative(outputRoot, inputRoot));
const assetManifest = assetManifestPath
  ? JSON.parse(await readFile(path.resolve(repo, assetManifestPath), 'utf8'))
  : null;
const assetRows = assetManifest?.lessons
  ? new Map(assetManifest.lessons.map((lesson) => [lesson.id, lesson]))
  : assetManifest?.assets
    ? new Map(Object.entries(assetManifest.assets))
    : null;

if (selection.version !== 1) throw new Error('Selection version must be 1.');
if (selection.rubricSha256 !== rubricSha256)
  throw new Error(`Rubric mismatch: selection ${selection.rubricSha256}; current ${rubricSha256}`);
if (!Array.isArray(selection.lessons)) throw new Error('Selection must contain a lessons array.');
if (assetManifest && assetManifest.version !== 1)
  throw new Error('Asset manifest version must be 1.');
if (receipts.length !== 199 || selection.lessons.length !== receipts.length) {
  throw new Error(
    `Expected exactly ${receipts.length} decisions for the current ${receipts.length}-lesson curriculum.`,
  );
}
if (assetRows && assetRows.size !== receipts.length)
  throw new Error('Asset manifest does not cover every current lesson.');

const receiptById = new Map(receipts.map((receipt) => [receipt.id, receipt]));
const seen = new Set();
const lessons = [];
const hashPath = async (image) => {
  if (!image || typeof image.path !== 'string' || !/^[a-f0-9]{64}$/.test(image.sha256 ?? '')) {
    throw new Error('Each viewed image needs a path and SHA-256.');
  }
  const imagePath = path.resolve(repo, image.path);
  const digest = await hashFile(imagePath).catch(() => null);
  if (digest !== image.sha256) throw new Error(`Viewed image changed or is missing: ${image.path}`);
};

for (const decision of selection.lessons) {
  const receipt = receiptById.get(decision.id);
  if (!receipt || seen.has(decision.id))
    throw new Error(`Unknown or duplicate lesson decision: ${decision.id}`);
  seen.add(decision.id);
  if (
    decision.movieSha256 !== receipt.sha256 ||
    decision.sourceFingerprint !== receipt.fingerprint
  ) {
    throw new Error(`Stale source or movie evidence for ${decision.id}`);
  }
  const oldReview = qualityById.get(decision.id);
  const meta = collectionById.get(decision.id);
  if (
    !oldReview ||
    !meta ||
    oldReview.total !== decision.qualityScore ||
    oldReview.movieSha256 !== receipt.sha256
  ) {
    throw new Error(`Stale quality review for ${decision.id}`);
  }
  const material = JSON.parse(
    await readFile(
      path.join(
        repo,
        `build/video-youtube-curation-20261021/materials/${decision.id}/material.json`,
      ),
      'utf8',
    ),
  );
  if (
    material.movieSha256 !== receipt.sha256 ||
    material.qualityReview?.movieSha256 !== receipt.sha256
  ) {
    throw new Error(`Material evidence is not bound to the current movie for ${decision.id}`);
  }
  if (
    !Number.isInteger(decision.qualityScore) ||
    decision.qualityScore < 0 ||
    decision.qualityScore > 100
  )
    throw new Error(`Invalid existing quality score for ${decision.id}`);
  const scores = decision.scores ?? {};
  if (Object.keys(scores).length !== rubric.dimensions.length)
    throw new Error(`Selection scores must match the rubric dimensions for ${decision.id}`);
  let total = 0;
  let meetsDimensionFloors = true;
  for (const dimension of rubric.dimensions) {
    const score = scores[dimension.id];
    if (!Number.isInteger(score) || score < 0 || score > dimension.maximum) {
      throw new Error(`Invalid ${dimension.id} score for ${decision.id}`);
    }
    total += score;
    if (score < dimension.minimum) meetsDimensionFloors = false;
  }
  if (!Array.isArray(decision.blockers))
    throw new Error(`Missing or invalid blockers list for ${decision.id}`);
  const hasBlockers = decision.blockers.length > 0;
  const expectedDecision =
    total >= rubric.minimumScore &&
    meetsDimensionFloors &&
    decision.qualityScore >= rubric.minimumQualityScore &&
    !hasBlockers
      ? 'keep'
      : 'skip';
  if (decision.decision !== expectedDecision)
    throw new Error(
      `Decision does not follow cutoff for ${decision.id}: expected ${expectedDecision}`,
    );
  if (typeof decision.reason !== 'string' || decision.reason.trim().length < 30)
    throw new Error(`Missing topic-specific reason for ${decision.id}`);
  if (!Array.isArray(decision.reviewedScenes) || !Array.isArray(decision.visualEvidence))
    throw new Error(`Missing scene evidence for ${decision.id}`);

  const timeline = JSON.parse(
    await readFile(path.join(inputRoot, decision.id, 'timeline.json'), 'utf8'),
  );
  const sceneIds = timeline.scenes.map((scene) => scene.id);
  if (JSON.stringify(decision.reviewedScenes) !== JSON.stringify(sceneIds))
    throw new Error(`Incomplete or out-of-order scene review for ${decision.id}`);
  const minimumEvidence = decision.decision === 'keep' ? 2 : 1;
  if (decision.visualEvidence.length < minimumEvidence)
    throw new Error(`Too little visual evidence for ${decision.id}`);
  for (const evidence of decision.visualEvidence) {
    if (
      !sceneIds.includes(evidence.scene) ||
      typeof evidence.explanation !== 'string' ||
      evidence.explanation.trim().length < 20
    ) {
      throw new Error(`Invalid visual evidence for ${decision.id}`);
    }
  }
  const materialDirectory = posix(
    path.join('build/video-youtube-curation-20261021/materials', decision.id),
  );
  const expectedOverviews = new Set([
    `${materialDirectory}/scenes.png`,
    `${materialDirectory}/motion.png`,
  ]);
  const nativeFramesDirectory = posix(
    path.relative(repo, path.join(inputRoot, decision.id, 'encoded-review/frames')),
  );
  const materialNativeFrames = new Set(
    (material.qualityReview.viewedImages ?? [])
      .filter((image) => /\/sample-\d+\.png$/.test(image.path))
      .map((image) => image.path),
  );
  for (const image of decision.viewedImages ?? []) {
    const isOverview = expectedOverviews.has(image.path);
    const isNativeFrame =
      /\/sample-\d+\.png$/.test(image.path) &&
      (image.path.startsWith(`${nativeFramesDirectory}/`) || materialNativeFrames.has(image.path));
    if (!isOverview && !isNativeFrame)
      throw new Error(`Viewed image is not evidence for ${decision.id}: ${image.path}`);
    await hashPath(image);
  }
  if (
    !Array.isArray(decision.viewedImages) ||
    !decision.viewedImages.some((image) => image.path === `${materialDirectory}/scenes.png`) ||
    !decision.viewedImages.some((image) => image.path === `${materialDirectory}/motion.png`)
  ) {
    throw new Error(
      `Both encoded scene and motion overview hashes are required for ${decision.id}`,
    );
  }
  const borderline =
    (total >= rubric.minimumScore - 5 && total <= rubric.minimumScore + 5) ||
    (scores.visualLearningGain >= 27 && scores.visualLearningGain <= 33);
  if (
    (decision.decision === 'keep' || borderline) &&
    !decision.viewedImages.some((image) => /sample-\d+\.png$/.test(image.path))
  ) {
    throw new Error(`A keep or borderline decision needs a viewed native frame: ${decision.id}`);
  }
  if (
    decision.decision === 'skip' &&
    (typeof decision.revisitCondition !== 'string' || decision.revisitCondition.trim().length < 20)
  ) {
    throw new Error(`A skipped lesson needs a specific revisit condition: ${decision.id}`);
  }
  if (decision.decision === 'keep' && decision.revisitCondition != null)
    throw new Error(`Kept lesson has a revisit condition: ${decision.id}`);

  const media = assetRows?.get(decision.id);
  if (assetRows) {
    if (!media || media.movieSha256 !== receipt.sha256 || media.video?.sha256 !== receipt.sha256) {
      throw new Error(`Asset manifest movie mismatch for ${decision.id}`);
    }
    for (const kind of ['video', 'poster', 'vtt', 'srt', 'chapters']) {
      if (
        !media[kind]?.path ||
        !/^[a-f0-9]{64}$/.test(media[kind].sha256 ?? '') ||
        !Number.isInteger(media[kind].bytes) ||
        media[kind].bytes < 0
      ) {
        throw new Error(`Asset manifest is missing a valid ${kind} record for ${decision.id}`);
      }
    }
  }
  const fallback = (file) => `${decision.id}/${file}`;
  const assetUrl = (kind) => {
    const extension = {
      video: 'mp4',
      poster: 'png',
      vtt: 'vtt',
      srt: 'srt',
      chapters: 'chapters.txt',
    }[kind];
    const relative =
      media?.[kind]?.path ??
      fallback(kind === 'poster' ? 'overview.png' : `${decision.id}.${extension}`);
    return joinAssetUrl(assetPrefix, relative);
  };
  const posterPath = media?.poster?.path ?? fallback('overview.png');
  const localMedia = path.join(inputRoot, decision.id, `${decision.id}.mp4`);
  if (!media && (await hashFile(localMedia)) !== receipt.sha256)
    throw new Error(`Current MP4 bytes do not match manifest: ${decision.id}`);
  if (media && assetManifestPath) {
    for (const kind of ['video', 'poster', 'vtt', 'srt', 'chapters']) {
      const localPath = path.resolve(
        repo,
        media[kind].source ??
          path.join(inputRoot, decision.id, `${decision.id}.${kind === 'video' ? 'mp4' : kind}`),
      );
      const bytes = await readFile(localPath).catch(() => null);
      if (!bytes || sha256(bytes) !== media[kind].sha256 || bytes.byteLength !== media[kind].bytes)
        throw new Error(`Asset bytes changed for ${decision.id} ${kind}`);
    }
  }

  lessons.push({
    id: decision.id,
    title: receipt.title,
    group: meta.group,
    durationSeconds: receipt.duration,
    qualityScore: decision.qualityScore,
    selectionScore: total,
    scores,
    decision: decision.decision,
    reason: decision.reason,
    visualEvidence: decision.visualEvidence,
    blockers: decision.blockers ?? [],
    revisitCondition: decision.revisitCondition ?? null,
    scenes: timeline.scenes.map((scene) => ({
      id: scene.id,
      title: scene.title,
      start: scene.start,
      duration: scene.duration,
    })),
    movieSha256: receipt.sha256,
    sourceFingerprint: receipt.fingerprint,
    videoUrl: assetUrl('video'),
    posterUrl: joinAssetUrl(assetPrefix, posterPath),
    vttUrl: assetUrl('vtt'),
    srtUrl: assetUrl('srt'),
    chaptersUrl: assetUrl('chapters'),
    reviewMetadata: {
      reviewers: decision.reviewers ?? decision.reviewerEvidence ?? [],
      viewedImages: decision.viewedImages ?? [],
      reviewedScenes: decision.reviewedScenes,
    },
  });
}
if (seen.size !== receiptById.size)
  throw new Error('Selection omitted one or more current lessons.');
if (assetRows && assetRows.size !== seen.size)
  throw new Error('Asset manifest contains unknown lessons.');

lessons.sort(
  (a, b) =>
    receipts.findIndex((receipt) => receipt.id === a.id) -
    receipts.findIndex((receipt) => receipt.id === b.id),
);
const output = path.resolve(outputRoot);
await mkdir(output, { recursive: true });
for (const file of ['template.html', 'styles.css', 'app.js'])
  await copyFile(
    path.join(here, 'gallery', file),
    path.join(output, file === 'template.html' ? 'index.html' : file),
  );
await copyFile(path.join(here, 'assets/leetllm-mark.svg'), path.join(output, 'leetllm-mark.svg'));
const data = {
  version: 1,
  title: 'LeetLLM video lessons',
  rubric: { ...rubric, sha256: rubricSha256 },
  scope: selection.scope ?? rubric.scope,
  reviewers: selection.reviewers ?? [],
  lessons,
};
await writeFile(path.join(output, 'gallery-data.json'), `${JSON.stringify(data)}\n`);
const csvRows = [
  [
    'decision',
    'id',
    'title',
    'curriculum area',
    'video fit / 100',
    'production quality / 100',
    'duration seconds',
    'reason',
    'visual evidence',
    'revisit condition',
  ],
  ...lessons.map((lesson) => [
    lesson.decision,
    lesson.id,
    lesson.title,
    lesson.group,
    lesson.selectionScore,
    lesson.qualityScore,
    lesson.durationSeconds,
    lesson.reason,
    lesson.visualEvidence.map((item) => `${item.scene}: ${item.explanation}`).join(' | '),
    lesson.revisitCondition ?? '',
  ]),
];
await writeFile(
  path.join(output, 'selection.csv'),
  csvRows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\r\n') + '\r\n',
);
if (themeStudyPath) {
  const themeRoot = path.resolve(repo, themeStudyPath);
  const themeStudy = JSON.parse(await readFile(path.join(themeRoot, 'study.json'), 'utf8'));
  if (
    themeStudy.version !== 1 ||
    themeStudy.palettes.length !== 3 ||
    themeStudy.samples.length !== 9
  ) {
    throw new Error('Theme study must include three palettes and nine actual-model frame samples.');
  }
  const themeOutput = path.join(output, 'themes');
  await mkdir(themeOutput, { recursive: true });
  for (const sample of themeStudy.samples) {
    const source = path.join(themeRoot, sample.file);
    if ((await hashFile(source)) !== sample.sha256)
      throw new Error(`Theme sample changed: ${sample.file}`);
    await copyFile(source, path.join(themeOutput, sample.file));
  }
  const themePage = await readFile(path.join(here, 'gallery/background.html'), 'utf8');
  const byLesson = new Map();
  for (const sample of themeStudy.samples) {
    const rows = byLesson.get(sample.id) ?? [];
    rows.push(sample);
    byLesson.set(sample.id, rows);
  }
  const paletteById = new Map(themeStudy.palettes.map((palette) => [palette.id, palette]));
  const sections = (
    await Promise.all(
      [...byLesson.entries()].map(async ([id, samples]) => {
        const material = JSON.parse(
          await readFile(
            path.join(repo, `build/video-youtube-curation-20261021/materials/${id}/material.json`),
            'utf8',
          ),
        );
        const scene =
          material.script.find((item) => item.id === samples[0].scene)?.title ?? samples[0].scene;
        const variants = samples
          .map((sample) => {
            const palette = paletteById.get(sample.palette);
            return `<figure class="theme-frame"><img src="themes/${escapeHtml(sample.file)}" loading="lazy" alt="${escapeHtml(palette.title)} palette for ${escapeHtml(material.title)}, scene ${escapeHtml(scene)}"><figcaption><strong>${escapeHtml(palette.title)}</strong><span>${escapeHtml(sample.time.toFixed(1))}s · ${escapeHtml(scene)}</span></figcaption></figure>`;
          })
          .join('');
        return `<section class="theme-lesson"><div><p class="eyebrow">${escapeHtml(material.title)} · ${escapeHtml(scene)}</p><h2>Same scene, three palettes</h2><p>All three stills come from the same animation model, scene, beat, and narration time.</p></div><div class="theme-frames">${variants}</div></section>`;
      }),
    )
  ).join('');
  const contrastRows = themeStudy.palettes
    .map((palette) => {
      const contrast = palette.contrast;
      return `<tr><th scope="row">${escapeHtml(palette.title)}</th><td>${contrast.ink.onBackground.toFixed(1)}:1</td><td>${contrast.muted.onBackground.toFixed(1)}:1</td><td>${contrast.cyan.onBackground.toFixed(1)}:1</td></tr>`;
    })
    .join('');
  const details = `<section class="selection-note theme-takeaway"><div class="note-mark" aria-hidden="true">✳</div><div><h2>Recommendation: keep navy for this edition</h2><p>Navy already supports the course's cool glow, grids, and bright explanatory marks. Charcoal is a credible future default: it removes the blue cast while preserving the current dark-board treatment and existing accent colors. Warm paper feels closer to a printed workbook, though its contrast and palette require review across math, icons, diagrams, and every scene before remastering.</p><div class="theme-pros"><div><strong>Current navy</strong><p>Pros: established look, strong separation between board and glowing accents, high measured contrast in these samples. Cons: the blue cast can feel uniform across a long playlist.</p></div><div><strong>Neutral charcoal</strong><p>Pros: quieter neutral base, keeps bright curves and labels clear, small palette migration. Cons: remains a dark canvas and changes the visual identity less than a light treatment.</p></div><div><strong>Warm paper</strong><p>Pros: familiar printed-page appearance. Cons: this prototype leaves the clustering lesson’s axes and labels in lighter blue-gray because Vizmatic’s teaching.axes defaults are not recolored by the local palette remap. That default remains readable on charcoal; paper needs those component defaults and the full palette checked across plots, math, icons, fine lines, and transitions.</p></div></div><p class="study-limit">These are nine representative still frames, not remastered videos or a full palette/accessibility audit. Contrast values below compare selected foreground colors with each background color. They do not certify all text, thin lines, or motion in the videos.</p><div class="table-scroll"><table><caption>Measured sample-color contrast against background</caption><thead><tr><th>Palette</th><th>Primary ink</th><th>Muted labels</th><th>Cyan accent</th></tr></thead><tbody>${contrastRows}</tbody></table></div></div></section>`;
  const html = themePage
    .replace('{{THEME_SCOPE}}', escapeHtml(themeStudy.scope))
    .replace('{{THEME_SECTIONS}}', sections)
    .replace('{{THEME_DETAILS}}', details);
  await writeFile(path.join(output, 'background.html'), html);
  const indexPath = path.join(output, 'index.html');
  const index = await readFile(indexPath, 'utf8');
  await writeFile(
    indexPath,
    index.replace(
      '{{THEME_LINK}}',
      '<a class="header-link" href="background.html">Background study</a>',
    ),
  );
} else {
  const indexPath = path.join(output, 'index.html');
  const index = await readFile(indexPath, 'utf8');
  await writeFile(indexPath, index.replace('{{THEME_LINK}}', ''));
}
console.log(
  JSON.stringify({
    output,
    lessons: lessons.length,
    kept: lessons.filter((item) => item.decision === 'keep').length,
    skipped: lessons.filter((item) => item.decision === 'skip').length,
    rubricSha256,
  }),
);

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function joinAssetUrl(base, assetPath) {
  if (/^(?:[a-z]+:)?\/\//i.test(assetPath)) return assetPath;
  if (assetPath.startsWith('/')) return assetPath;
  const cleanPath = assetPath.replace(/^\.\//, '').replace(/^\/+/, '');
  if (!base) return cleanPath;
  if (base === '/') return `/${cleanPath}`;
  return `${base.replace(/\/+$/, '')}/${cleanPath}`;
}
