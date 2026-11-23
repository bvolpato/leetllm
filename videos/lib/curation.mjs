import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { parse } from 'yaml';
import { loadImage } from '@napi-rs/canvas';
import { currentSourceFingerprint } from './source-fingerprint.mjs';

export const reviewDigest = (value) =>
  createHash('sha256')
    .update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value))
    .digest('hex');
const inside = (parent, file) => {
  const relative = path.relative(parent, file);
  return (
    relative === '' ||
    (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  );
};
const rubricIdentity = 'videos/curation-rubric.json';
const imageReferenceFields = [
  'viewedImagePaths',
  'viewedImagePath',
  'imagePaths',
  'viewedImages',
  'imagePath',
  'image',
];
const validBlocker = (blocker) =>
  typeof blocker === 'string'
    ? Boolean(blocker.trim())
    : Boolean(
        blocker &&
        typeof blocker === 'object' &&
        !Array.isArray(blocker) &&
        typeof blocker.reason === 'string' &&
        blocker.reason.trim() &&
        typeof blocker.detail === 'string' &&
        blocker.detail.trim(),
      );

function firstSceneMatch(reference, sceneIds) {
  if (typeof reference !== 'string') return reference;
  if (!Array.isArray(sceneIds)) return reference;
  return sceneIds.find((id) => reference === id || reference.startsWith(`${id}/`)) ?? reference;
}

function imageReferenceList(value) {
  const values = Array.isArray(value) ? value : [value];
  if (!values.length)
    return { paths: [], issue: 'Transformation image references must not be empty' };
  const paths = [];
  for (const entry of values) {
    const imagePath =
      typeof entry === 'string'
        ? entry
        : entry && typeof entry === 'object' && !Array.isArray(entry)
          ? entry.path
          : undefined;
    if (typeof imagePath !== 'string' || !imagePath.trim())
      return { paths: [], issue: 'Transformation image references must contain non-empty paths' };
    paths.push(imagePath);
  }
  return { paths };
}

export function normalizeReview(row, { sceneIds } = {}) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
  const sourceTransformations = row.inspectedTransformations ?? row.meaningfulTransformations;
  const reviewedScenes = Array.isArray(row.reviewedScenes)
    ? row.reviewedScenes.map((scene) => {
        if (typeof scene === 'string') return { id: scene };
        if (!scene || typeof scene !== 'object' || Array.isArray(scene)) return scene;
        return { ...scene, mechanism: scene.mechanism ?? scene.visualMechanism };
      })
    : row.reviewedScenes;
  const inspectedTransformations = Array.isArray(sourceTransformations)
    ? sourceTransformations.map((item) => {
        if (typeof item === 'string') {
          const separator = item.indexOf(':');
          if (separator > 0) {
            const candidate = firstSceneMatch(item.slice(0, separator).trim(), sceneIds);
            if (Array.isArray(sceneIds) && sceneIds.includes(candidate))
              return { sceneId: candidate, mechanism: item.slice(separator + 1).trim() };
          }
          return { sceneId: undefined, mechanism: item.trim() };
        }
        if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
        const explicitField = imageReferenceFields.find((field) => Object.hasOwn(item, field));
        const ref = explicitField ? imageReferenceList(item[explicitField]) : null;
        const {
          sceneId: rawSceneId,
          scene,
          mechanism: rawMechanism,
          visualMechanism,
          transformation,
          description,
          ...details
        } = item;
        return {
          ...details,
          ...(explicitField ? { [explicitField]: item[explicitField] } : {}),
          sceneId: firstSceneMatch(rawSceneId ?? scene, sceneIds),
          mechanism: rawMechanism ?? visualMechanism ?? transformation ?? description,
          _hasExplicitImageReference: Boolean(explicitField),
          _imageReferencePaths: ref?.paths,
          _imageReferenceIssue: ref?.issue,
        };
      })
    : sourceTransformations;
  return {
    ...row,
    dimensionScores: row.dimensionScores ?? row.scores ?? {},
    reviewedScenes,
    inspectedTransformations,
  };
}

// This gate checks the evidence contract. Editorial judgment is supplied by the reviewer.
export function publicationGate(
  input,
  rubric,
  {
    sceneIds,
    imageEvidence = false,
    movieBound = false,
    sourceCurrent = false,
    requireCurrentRender = false,
    renderCurrent = false,
    articleCurrent = true,
    registeredViewedImages = [],
  } = {},
) {
  const row = normalizeReview(input, { sceneIds }),
    issues = [];
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return {
      decision: 'QUARANTINE',
      reviewStatus: 'needs-verification',
      issues: ['Review must be an object'],
      evidenceIssues: ['Review must be an object'],
      inspectedTransformations: [],
    };
  }
  if (!Array.isArray(rubric?.dimensions)) issues.push('Rubric dimensions must be an array');
  if (row.rubric !== rubricIdentity) issues.push('Review rubric identity is missing or incorrect');
  const enumValues = rubric?.sceneJudgmentEnums ?? {};
  const validEnum = (values) =>
    Array.isArray(values) &&
    values.length > 0 &&
    values.every((value) => typeof value === 'string' && value.trim()) &&
    new Set(values).size === values.length;
  if (!validEnum(enumValues.visualGrade))
    issues.push('Rubric visualGrade enum must be a non-empty list of unique strings');
  if (!validEnum(enumValues.density))
    issues.push('Rubric density enum must be a non-empty list of unique strings');
  const visualGrades = new Set(validEnum(enumValues.visualGrade) ? enumValues.visualGrade : []);
  const sceneDensities = new Set(validEnum(enumValues.density) ? enumValues.density : []);
  for (const dimension of Array.isArray(rubric?.dimensions) ? rubric.dimensions : []) {
    const score = row.dimensionScores[dimension.id];
    if (!Number.isInteger(score) || score < 0 || score > dimension.maximum)
      issues.push(`Invalid ${dimension.id} score`);
  }
  const dimensions = Array.isArray(rubric?.dimensions) ? rubric.dimensions : [];
  const total = dimensions.reduce((sum, d) => sum + (row.dimensionScores[d.id] ?? 0), 0);
  if (total !== row.overallScore) issues.push('Dimension scores do not sum to the stated total');
  if (!Array.isArray(row.blockers) || row.blockers.some((blocker) => !validBlocker(blocker)))
    issues.push('Blockers must be an array of non-empty strings or reason/detail objects');
  if (!Array.isArray(row.reviewedScenes)) issues.push('Reviewed scenes must be an array');
  const reviewedScenes = Array.isArray(row.reviewedScenes) ? row.reviewedScenes : [];
  const scenes = new Map();
  for (const scene of reviewedScenes) {
    if (
      !scene ||
      typeof scene !== 'object' ||
      Array.isArray(scene) ||
      typeof scene.id !== 'string' ||
      !scene.id.trim()
    ) {
      issues.push('Reviewed scene entries must be objects with an id');
      continue;
    }
    if (scenes.has(scene.id)) issues.push(`Duplicate scene review: ${scene.id}`);
    scenes.set(scene.id, scene);
    if (typeof scene.mechanism !== 'string' || !scene.mechanism.trim())
      issues.push(`Scene mechanism is missing: ${scene.id}`);
    if (!visualGrades.has(scene.visualGrade))
      issues.push(`Invalid visual grade for scene ${scene.id}`);
    if (!sceneDensities.has(scene.density))
      issues.push(`Invalid density judgment for scene ${scene.id}`);
    const deficiencyRemedy =
      scene.deficiencyRemedy ??
      [scene.deficiency, scene.remedy]
        .filter((value) => typeof value === 'string' && value.trim())
        .join(' ');
    if (typeof deficiencyRemedy !== 'string' || !deficiencyRemedy.trim())
      issues.push(`Scene deficiency or remedy is missing: ${scene.id}`);
  }
  if (!sceneIds?.length || sceneIds.some((id) => !scenes.has(id)))
    issues.push('Not every authored scene has a review');
  if (!imageEvidence)
    issues.push('Registered scene sheets and native frame evidence are incomplete');
  if (!movieBound) issues.push('Review does not match the exact playing movie');
  if (!sourceCurrent) issues.push('Reviewed authored source differs from current source');
  if (requireCurrentRender && !renderCurrent)
    issues.push('Current regenerated render fingerprint is required');
  if (requireCurrentRender && !articleCurrent)
    issues.push('Current canonical article differs from the reviewed render source');
  if (
    typeof row.reason !== 'string' ||
    !row.reason.trim() ||
    typeof row.reviewer !== 'string' ||
    !row.reviewer.trim()
  )
    issues.push('Editorial reason or reviewer is missing');
  if (!['POST', 'REWORK', 'QUARANTINE'].includes(row.recommendation))
    issues.push('Unknown editorial recommendation');

  const hasTransformationField =
    Object.hasOwn(input, 'inspectedTransformations') ||
    Object.hasOwn(input, 'meaningfulTransformations');
  if (
    !Array.isArray(row.inspectedTransformations) &&
    (hasTransformationField || row.recommendation === 'POST')
  )
    issues.push('Inspected transformations must be an array');
  const sourceTransformations = Array.isArray(row.inspectedTransformations)
    ? row.inspectedTransformations
    : [];
  const viewedPaths = new Set(
    Array.isArray(row.viewedImages)
      ? row.viewedImages
          .filter((image) => image && typeof image.path === 'string')
          .map((image) => image.path)
      : [],
  );
  const boundImages = (Array.isArray(registeredViewedImages) ? registeredViewedImages : []).filter(
    (image) =>
      image &&
      typeof image === 'object' &&
      typeof image.path === 'string' &&
      typeof image.relative === 'string' &&
      viewedPaths.has(image.path),
  );
  const registeredByReference = new Map();
  for (const image of boundImages) {
    registeredByReference.set(image.path, image.path);
    registeredByReference.set(image.relative, image.path);
    if (typeof image.canonicalPath === 'string')
      registeredByReference.set(image.canonicalPath, image.path);
  }
  const transformations = [],
    transformationIssues = [];
  for (const transformation of sourceTransformations) {
    if (!transformation || typeof transformation !== 'object' || Array.isArray(transformation)) {
      issues.push('Inspected transformation entries must be objects');
      continue;
    }
    const sceneId = transformation.sceneId;
    const mechanism =
      typeof transformation.mechanism === 'string' ? transformation.mechanism.trim() : '';
    if (typeof sceneId !== 'string' || !sceneIds?.includes(sceneId) || !mechanism)
      transformationIssues.push(
        'Transformation must name an authored scene and a specific mechanism',
      );
    if (transformation._imageReferenceIssue)
      transformationIssues.push(transformation._imageReferenceIssue);
    let viewedImagePaths = [];
    let evidenceBinding = 'unbound';
    if (transformation._hasExplicitImageReference) {
      if (!transformation._imageReferenceIssue) {
        const references = transformation._imageReferencePaths ?? [];
        const resolved = references.map((reference) => registeredByReference.get(reference));
        if (resolved.some((reference) => !reference))
          transformationIssues.push(
            'Transformation references an image that was not personally viewed and registered',
          );
        else {
          viewedImagePaths = [...new Set(resolved)];
          evidenceBinding = 'explicit-viewed-image-reference';
        }
      }
    } else if (typeof sceneId === 'string') {
      const sheet = boundImages.find((image) => image.relative === `scenes/${sceneId}.png`);
      if (sheet) {
        viewedImagePaths = [sheet.path];
        evidenceBinding = 'inferred-from-viewed-scene-sheet';
      } else
        transformationIssues.push(
          `No personally viewed registered scene sheet supports transformation ${sceneId}`,
        );
    }
    const {
      _hasExplicitImageReference,
      _imageReferencePaths,
      _imageReferenceIssue,
      ...publicTransformation
    } = transformation;
    transformations.push({
      ...publicTransformation,
      sceneId,
      mechanism,
      viewedImagePaths,
      evidenceBinding,
    });
  }
  const evidenceIssues = [
    ...issues,
    ...(row.recommendation === 'POST' ? transformationIssues : []),
  ];
  if (row.recommendation === 'POST') {
    issues.push(...transformationIssues);
    if (total < rubric.acceptance.minimumScore)
      issues.push('Score is below the publication cutoff');
    for (const d of dimensions)
      if (row.dimensionScores[d.id] < d.minimumForPost)
        issues.push(`${d.id} misses its publication floor`);
    if (Array.isArray(row.blockers) && row.blockers.length) issues.push('Material blockers remain');
    if (sceneIds?.some((id) => scenes.get(id)?.visualGrade === 'weak'))
      issues.push('A main explanation scene is weak');
    if (sceneIds?.some((id) => scenes.get(id)?.density === 'text-dominant'))
      issues.push('A main explanation scene is dominated by text');
    const uniqueTransformations = new Set(
      transformations
        .filter((t) => sceneIds?.includes(t.sceneId) && t.mechanism && t.viewedImagePaths.length)
        .map((t) => `${t.sceneId}\0${t.mechanism.toLocaleLowerCase().replace(/\s+/g, ' ')}`),
    );
    if (uniqueTransformations.size < 2) {
      const message = 'Two distinct inspected causal transformations are required';
      issues.push(message);
      evidenceIssues.push(message);
    }
  }
  return {
    decision: row.recommendation === 'POST' && issues.length === 0 ? 'POST' : 'QUARANTINE',
    reviewStatus: evidenceIssues.length ? 'needs-verification' : 'reviewed',
    issues,
    evidenceIssues,
    row: { ...row, inspectedTransformations: transformations },
    inspectedTransformations: transformations,
  };
}

export function validateCompleteAssignment(assignment, collection, collectionSha256) {
  if (!Array.isArray(collection?.lessons) || !collection.lessons.length)
    throw Error('Canonical collection must have lessons');
  const expectedIds = collection.lessons.map((row) => row.id);
  if (
    expectedIds.some((id) => typeof id !== 'string' || !id) ||
    new Set(expectedIds).size !== expectedIds.length
  ) {
    throw Error('Canonical collection has invalid or duplicate lesson IDs');
  }
  if (assignment.status !== undefined && assignment.status !== 'ready')
    throw Error(`Curation assignment is not ready: ${assignment.status}`);
  for (const field of ['pendingIds', 'pending']) {
    if (
      assignment[field] !== undefined &&
      (!Array.isArray(assignment[field]) || assignment[field].length)
    ) {
      throw Error(`Curation assignment still has ${field}`);
    }
  }
  const actualIds = assignment.lessons.map((row) => row.id);
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds))
    throw Error('Curation assignment does not contain the complete canonical lesson order');
  if (
    assignment.readyIds !== undefined &&
    JSON.stringify(assignment.readyIds) !== JSON.stringify(expectedIds)
  ) {
    throw Error('Curation assignment ready IDs do not match the complete canonical collection');
  }
  if (assignment.collection !== undefined) {
    const binding = assignment.collection;
    if (
      !binding ||
      binding.id !== collection.id ||
      binding.version !== collection.version ||
      binding.sha256 !== collectionSha256 ||
      typeof binding.path !== 'string' ||
      !binding.path.trim()
    )
      throw Error('Curation assignment collection binding is stale or invalid');
  }
}

export async function buildCuration({
  root,
  assignment,
  reviewFiles,
  rubric,
  requireCurrentRender = false,
  requireComplete = false,
}) {
  if (!Array.isArray(assignment?.lessons))
    throw Error('Curation assignment lessons must be an array');
  const assigned = new Set();
  for (const entry of assignment.lessons) {
    if (!entry || typeof entry.id !== 'string' || !entry.id)
      throw Error('Malformed curation assignment row');
    if (assigned.has(entry.id)) throw Error(`Duplicate curation assignment: ${entry.id}`);
    assigned.add(entry.id);
  }
  const collectionBytes =
    requireComplete || requireCurrentRender
      ? await fs.readFile(path.join(root, 'videos/collections/complete-curriculum.json'))
      : null;
  const collection = collectionBytes ? JSON.parse(collectionBytes) : null;
  if (requireComplete)
    validateCompleteAssignment(assignment, collection, reviewDigest(collectionBytes));
  const canonicalLessons = new Map(collection?.lessons.map((row) => [row.id, row]) ?? []);
  const reviews = new Map(),
    hashes = new Map();
  const hash = async (file) => {
    if (!hashes.has(file))
      hashes.set(
        file,
        (async () => {
          const h = createHash('sha256');
          await pipeline(createReadStream(file), h);
          return h.digest('hex');
        })(),
      );
    return hashes.get(file);
  };
  for (const relative of reviewFiles) {
    const report = JSON.parse(await fs.readFile(path.resolve(root, relative))),
      rows = Array.isArray(report) ? report : (report.reviews ?? report.lessons ?? []);
    if (!Array.isArray(rows)) throw Error(`Curation review rows must be an array: ${relative}`);
    for (const raw of rows) {
      if (
        !raw ||
        typeof raw !== 'object' ||
        Array.isArray(raw) ||
        typeof raw.id !== 'string' ||
        !raw.id
      )
        throw Error(`Malformed curation review row: ${relative}`);
      if (reviews.has(raw.id)) throw Error(`Duplicate curation review: ${raw.id}`);
      reviews.set(raw.id, {
        row: { ...raw, reviewer: raw.reviewer ?? report.reviewer },
        record: { path: relative, id: raw.id, sha256: reviewDigest(raw) },
      });
    }
  }
  for (const id of reviews.keys())
    if (!assigned.has(id)) throw Error(`Review is outside the collection: ${id}`);
  const lessons = [];
  for (const entry of assignment.lessons) {
    const found = reviews.get(entry.id),
      inputRow = found?.row;
    if (!inputRow) {
      lessons.push({
        ...entry,
        decision: 'QUARANTINE',
        reviewStatus: 'pending',
        score: null,
        reason: 'Individual visual-publication review is pending.',
        gateIssues: ['Review pending'],
      });
      continue;
    }
    const directory = path.resolve(root, entry.sourceDirectory),
      receipt = JSON.parse(await fs.readFile(path.join(directory, 'verification.json'))),
      encodedDirectory = path.join(directory, 'encoded-review'),
      encoded = JSON.parse(await fs.readFile(path.join(encodedDirectory, 'verification.json'))),
      encodedPhysicalRoot = await fs.realpath(encodedDirectory),
      markup = await fs.readFile(path.join(root, `videos/lessons/${entry.id}.lesson.yaml`)),
      lesson = parse(markup.toString()),
      current = {
        markup: reviewDigest(markup),
        animation: await hash(path.join(root, `videos/animations/${entry.id}.mjs`)),
      },
      movieSha256 = await hash(path.join(directory, `${entry.id}.mp4`)),
      imageIssues = [],
      registered = new Set(),
      registeredViewedImages = [];
    const sceneIds = lesson.scenes.map((scene) => scene.id),
      nativeSamples = new Map(),
      sampleFrames = new Set();
    if (!Array.isArray(encoded.samples))
      imageIssues.push('Encoded native sample registry is missing');
    for (const sample of Array.isArray(encoded.samples) ? encoded.samples : []) {
      if (
        !sample ||
        typeof sample !== 'object' ||
        !/^frames\/sample-\d+\.png$/.test(sample.image ?? '') ||
        !Number.isInteger(sample.frame) ||
        sample.frame < 0 ||
        !Number.isInteger(receipt.frameAudit?.frames) ||
        sample.frame >= receipt.frameAudit.frames ||
        !Number.isFinite(sample.time) ||
        !encoded.artifactSha256?.[sample.image]
      ) {
        imageIssues.push('Encoded native sample record is invalid or unregistered');
        continue;
      }
      if (nativeSamples.has(sample.image) || sampleFrames.has(sample.frame)) {
        imageIssues.push('Encoded native sample registry has duplicate images or frame numbers');
        continue;
      }
      nativeSamples.set(sample.image, sample);
      sampleFrames.add(sample.frame);
    }
    if (receipt.opening === 'lesson' || receipt.brandIntro?.duration !== 4)
      imageIssues.push('The verified four-second brand intro is missing');
    const requiredSheets = new Set(['leetllm-intro', ...sceneIds].map((id) => `scenes/${id}.png`));
    for (const file of Object.keys(encoded.artifactSha256 ?? {}))
      if (/^scenes\/.*\.png$/i.test(file)) requiredSheets.add(file);
    if (!Array.isArray(encoded.sceneSheets))
      imageIssues.push('Encoded scene-sheet registry is missing');
    for (const sheet of Array.isArray(encoded.sceneSheets) ? encoded.sceneSheets : []) {
      if (
        !sheet ||
        typeof sheet.scene !== 'string' ||
        sheet.image !== `scenes/${sheet.scene}.png` ||
        !encoded.artifactSha256?.[sheet.image]
      )
        imageIssues.push('Encoded scene-sheet record is invalid or unregistered');
      else requiredSheets.add(sheet.image);
    }
    if (!Array.isArray(inputRow.viewedImages)) imageIssues.push('Viewed images must be an array');
    for (const image of Array.isArray(inputRow.viewedImages) ? inputRow.viewedImages : []) {
      if (
        !image ||
        typeof image !== 'object' ||
        Array.isArray(image) ||
        typeof image.path !== 'string' ||
        typeof image.sha256 !== 'string'
      ) {
        imageIssues.push('Malformed viewed image record');
        continue;
      }
      let file;
      try {
        file = await fs.realpath(path.resolve(root, image.path));
      } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR')
          imageIssues.push(`Missing viewed image: ${image.path}`);
        else
          imageIssues.push(
            `Unable to resolve viewed image (${error.code ?? error.message}): ${image.path}`,
          );
        continue;
      }
      if (!inside(encodedPhysicalRoot, file)) {
        imageIssues.push(`Viewed image escapes encoded-review root: ${image.path}`);
        continue;
      }
      const relative = path.relative(encodedPhysicalRoot, file).split(path.sep).join('/');
      if (path.extname(image.path).toLowerCase() !== '.png') {
        imageIssues.push(`Viewed image is not a PNG: ${image.path}`);
        continue;
      }
      const expected = encoded.artifactSha256?.[relative];
      if (!expected) {
        imageIssues.push(`Viewed image is not registered in encoded-review: ${image.path}`);
        continue;
      }
      if (expected !== image.sha256) {
        imageIssues.push(
          `Viewed image checksum does not match encoded-review registry: ${image.path}`,
        );
        continue;
      }
      const header = Buffer.alloc(24);
      let handle;
      try {
        handle = await fs.open(file, 'r');
        const { size } = await handle.stat();
        const { bytesRead } = await handle.read(header, 0, header.length, 0);
        if (
          size < 33 ||
          bytesRead !== 24 ||
          header.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
          header.readUInt32BE(8) !== 13 ||
          header.toString('ascii', 12, 16) !== 'IHDR'
        ) {
          imageIssues.push(`Viewed image is not a PNG: ${image.path}`);
          continue;
        }
        if (relative.startsWith('frames/')) {
          if (!nativeSamples.has(relative)) {
            imageIssues.push(`Viewed frame is not an encoded native sample: ${image.path}`);
            continue;
          }
          if (header.readUInt32BE(16) !== 1920 || header.readUInt32BE(20) !== 1080) {
            imageIssues.push(`Viewed native frame is not 1920x1080: ${image.path}`);
            continue;
          }
          const decoded = await loadImage(file);
          if (decoded.width !== 1920 || decoded.height !== 1080) {
            imageIssues.push(`Decoded native frame is not 1920x1080: ${image.path}`);
            continue;
          }
        }
      } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR')
          imageIssues.push(`Missing viewed image: ${image.path}`);
        else
          imageIssues.push(
            `Unable to read viewed image (${error.code ?? error.message}): ${image.path}`,
          );
        continue;
      } finally {
        await handle?.close();
      }
      let actual;
      try {
        actual = await hash(file);
      } catch (error) {
        imageIssues.push(
          `Unable to hash viewed image (${error.code ?? error.message}): ${image.path}`,
        );
        continue;
      }
      if (actual !== expected) {
        imageIssues.push(`Viewed image bytes do not match encoded-review registry: ${image.path}`);
      } else {
        registered.add(relative);
        registeredViewedImages.push({ path: image.path, relative, canonicalPath: file });
      }
    }
    const missingSheets = [...requiredSheets].filter((file) => !registered.has(file)),
      native = [...registered].filter((file) => nativeSamples.has(file));
    if (missingSheets.length)
      imageIssues.push('Scene sheets not viewed: ' + missingSheets.join(', '));
    if (native.length < 3) imageIssues.push('Fewer than three registered native frames viewed');
    let articleCurrent = null,
      currentArticleSha256 = null;
    if (requireCurrentRender) {
      const canonical = canonicalLessons.get(entry.id),
        contentRoot = path.join(root, 'web/src/content');
      const article =
        canonical && typeof canonical.source === 'string'
          ? path.resolve(contentRoot, canonical.source)
          : null;
      articleCurrent = Boolean(
        article &&
        inside(contentRoot, article) &&
        lesson.source === canonical.source &&
        (entry.source === undefined || entry.source === canonical.source) &&
        receipt.source === canonical.source,
      );
      if (articleCurrent) {
        currentArticleSha256 = await hash(article);
        articleCurrent =
          currentArticleSha256 === receipt.sourceSha256 &&
          (!entry.sourceContext?.article ||
            currentArticleSha256 === entry.sourceContext.article.sha256);
      }
    }
    const sourceCurrent = ['animation', 'markup'].every(
        (key) =>
          current[key] === inputRow.authoredSourceSha256?.[key] &&
          current[key] === entry.authoredSourceSha256?.[key],
      ),
      renderFingerprintCurrent =
        (await currentSourceFingerprint(root, entry.id, receipt)) === inputRow.sourceFingerprint,
      movieBound =
        inputRow.movieSha256 === entry.movieSha256 &&
        movieSha256 === entry.movieSha256 &&
        receipt.sha256 === movieSha256 &&
        encoded.videoSha256 === movieSha256 &&
        inputRow.sourceFingerprint === entry.sourceFingerprint &&
        receipt.fingerprint === inputRow.sourceFingerprint,
      gate = publicationGate(inputRow, rubric, {
        sceneIds,
        imageEvidence: imageIssues.length === 0,
        movieBound,
        sourceCurrent,
        requireCurrentRender,
        renderCurrent: renderFingerprintCurrent,
        articleCurrent,
        registeredViewedImages,
      }),
      row = gate.row;
    lessons.push({
      ...entry,
      decision: gate.decision,
      reviewStatus: gate.reviewStatus,
      score: row.overallScore,
      recommendation: row.recommendation,
      reason: row.reason,
      dimensionScores: row.dimensionScores,
      blockers: row.blockers ?? [],
      gateIssues: [...gate.issues, ...imageIssues],
      rework: row.rework ?? row.redesign ?? null,
      reviewedScenes: row.reviewedScenes,
      inspectedTransformations: row.inspectedTransformations,
      viewedImages: row.viewedImages,
      reviewer: row.reviewer,
      provenance: found.record,
      evidence: {
        movieBound,
        sourceCurrent,
        renderFingerprintCurrent,
        articleCurrent,
        currentArticleSha256,
        reviewedRenderEngine: receipt.renderEngine,
        registeredSheets: requiredSheets.size - missingSheets.length,
        authoredScenes: sceneIds.length,
        nativeFrames: native.length,
        currentAuthoredSourceSha256: current,
      },
      limitations: row.limitations ??
        row.limits ?? [
          'Scene-sheet and selected native-frame review. Continuous playback and listening are separate checks.',
        ],
    });
  }
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    rubric: 'videos/curation-rubric.json',
    rubricSha256: reviewDigest(rubric),
    renderPolicy: requireCurrentRender
      ? 'current-regenerated-collection'
      : 'historical-reviewed-versions',
    scope: rubric.scope,
    summary: {
      total: lessons.length,
      reviewed: lessons.filter((r) => r.reviewStatus === 'reviewed').length,
      pending: lessons.filter((r) => r.reviewStatus === 'pending').length,
      needsVerification: lessons.filter((r) => r.reviewStatus === 'needs-verification').length,
      post: lessons.filter((r) => r.decision === 'POST').length,
      quarantine: lessons.filter((r) => r.decision === 'QUARANTINE').length,
    },
    lessons,
  };
}
