#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { parse } from 'yaml';
const require = createRequire(path.resolve('videos/package.json'));
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const args = process.argv.slice(2);
const option = (key, fallback) => (args.includes(key) ? args[args.indexOf(key) + 1] : fallback);
const base = option('--output', 'build/video-youtube-curation-20261021'),
  root = option('--input', 'build/video-complete-curriculum');
fs.mkdirSync(base, { recursive: true });
const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest = JSON.parse(fs.readFileSync(`${root}/manifest.json`));
const quality = JSON.parse(fs.readFileSync('videos/reviews/complete-curriculum.json'));
const collection = JSON.parse(
  fs.readFileSync('videos/collections/complete-curriculum.json'),
).lessons;
const assignments = Array.from({ length: 5 }, () => []);
for (const [index, manifestReceipt] of manifest.entries()) {
  const id = manifestReceipt.id,
    dir = `${root}/${id}`,
    timelineFile = `${dir}/timeline.json`,
    receiptFile = `${dir}/verification.json`;
  const timeline = JSON.parse(fs.readFileSync(timelineFile)),
    receipt = JSON.parse(fs.readFileSync(receiptFile));
  const lessonFile = `videos/lessons/${id}.lesson.yaml`,
    animationFile = `videos/animations/${id}.mjs`;
  const lesson = fs.existsSync(lessonFile) ? parse(fs.readFileSync(lessonFile, 'utf8')) : null;
  const encoded = JSON.parse(fs.readFileSync(`${dir}/encoded-review/verification.json`));
  const review = quality.lessons.find((r) => r.id === id),
    meta = collection.find((r) => r.id === id);
  if (
    receipt.id !== id ||
    manifestReceipt.sha256 !== receipt.sha256 ||
    manifestReceipt.fingerprint !== receipt.fingerprint
  )
    throw Error('Manifest differs from receipt ' + id);
  if (!review || review.movieSha256 !== receipt.sha256)
    throw Error('Review movie hash differs from receipt ' + id);
  if (!receipt.fingerprint || review.sourceFingerprint !== receipt.fingerprint)
    throw Error('Review source fingerprint differs from receipt ' + id);
  if (hash(`${dir}/${id}.mp4`) !== receipt.sha256)
    throw Error('Movie hash differs from receipt ' + id);
  if (encoded.videoSha256 !== receipt.sha256)
    throw Error('Encoded movie hash differs from receipt ' + id);
  const timelineSha256 = hash(timelineFile);
  if (receipt.artifactSha256?.['timeline.json'] !== timelineSha256)
    throw Error('Timeline hash differs from receipt ' + id);
  if (timeline.id !== id) throw Error('Timeline identity differs from receipt ' + id);
  const script = timeline.scenes.map((scene) => {
    if (
      !scene.id ||
      !scene.beats?.length ||
      scene.beats.some((beat) => typeof beat.say !== 'string' || !beat.say.trim())
    )
      throw Error('Missing encoded narration ' + id + '/' + scene.id);
    return {
      id: scene.id,
      title: scene.title ?? scene.id,
      beats: scene.beats.map((beat) => beat.say),
    };
  });
  const narration = (scenes) =>
    scenes.map((scene) => ({ id: scene.id, beats: scene.beats.map((beat) => beat.say) }));
  const currentAuthoredSource = {
    lesson: lesson ? { path: lessonFile, sha256: hash(lessonFile) } : null,
    animation: fs.existsSync(animationFile)
      ? { path: animationFile, sha256: hash(animationFile) }
      : null,
    narrationMatchesTimeline: lesson
      ? JSON.stringify(narration(lesson.scenes)) === JSON.stringify(narration(timeline.scenes))
      : null,
  };
  const out = `${base}/materials/${id}`;
  fs.mkdirSync(out, { recursive: true });
  const sampleFor = (scene, beat, phase) =>
    encoded.samples.find((sample) =>
      sample.targets.some(
        (target) => target.scene === scene && target.beat === beat && target.phase === phase,
      ),
    );
  const entry = (sample) => {
    const file = `${dir}/encoded-review/${sample.image}`,
      sha256 = hash(file);
    if (encoded.artifactSha256[sample.image] !== sha256) throw Error('Changed encoded frame');
    return { path: file, sha256, time: sample.time, frame: sample.frame };
  };
  const scenes = timeline.scenes.map((scene, i) => ({
    scene: scene.id,
    title: script[i].title,
    sample: sampleFor(scene.id, Math.min(1, scene.beats.length - 1), 'middle'),
  }));
  if (scenes.some((s) => !s.sample)) throw Error('Missing scene overview ' + id);
  const overview = createCanvas(1280, Math.ceil(scenes.length / 2) * 390),
    ctx = overview.getContext('2d');
  ctx.fillStyle = '#101319';
  ctx.fillRect(0, 0, overview.width, overview.height);
  for (const [i, row] of scenes.entries()) {
    const x = (i % 2) * 640,
      y = Math.floor(i / 2) * 390;
    ctx.fillStyle = '#f2f4f8';
    ctx.font = '16px sans-serif';
    ctx.fillText(`${i + 1}. ${row.title}`, x + 12, y + 22, 615);
    ctx.drawImage(await loadImage(entry(row.sample).path), x, y + 30, 640, 360);
  }
  fs.writeFileSync(`${out}/scenes.png`, await overview.encode('png'));
  const motions = timeline.scenes.flatMap((scene) =>
    scene.beats.flatMap((beat, i) => (beat.motion_check ? [{ scene: scene.id, beat: i }] : [])),
  );
  if (!motions.length)
    for (const i of [
      ...new Set([Math.min(1, timeline.scenes.length - 1), Math.floor(timeline.scenes.length / 2)]),
    ])
      motions.push({
        scene: timeline.scenes[i].id,
        beat: Math.min(1, timeline.scenes[i].beats.length - 1),
      });
  const strips = motions.map((m) => ({
    ...m,
    samples: ['early', 'middle', 'late'].map((phase) => sampleFor(m.scene, m.beat, phase)),
  }));
  if (strips.some((s) => s.samples.some((s) => !s))) throw Error('Missing motion strip ' + id);
  const temporal = createCanvas(1536, strips.length * 318),
    tc = temporal.getContext('2d');
  tc.fillStyle = '#101319';
  tc.fillRect(0, 0, temporal.width, temporal.height);
  for (const [i, row] of strips.entries()) {
    tc.fillStyle = '#f2f4f8';
    tc.font = '16px sans-serif';
    tc.fillText(`${row.scene}, beat ${row.beat + 1}: early / middle / late`, 12, i * 318 + 22);
    for (const [j, s] of row.samples.entries())
      tc.drawImage(await loadImage(entry(s).path), j * 512, i * 318 + 30, 512, 288);
  }
  fs.writeFileSync(`${out}/motion.png`, await temporal.encode('png'));
  const material = {
    id,
    title: receipt.title,
    group: meta.group,
    source: receipt.source,
    movieSha256: receipt.sha256,
    sourceFingerprint: receipt.fingerprint,
    qualityScore: review.total,
    qualityReview: review,
    script,
    scriptSource: { path: timelineFile, sha256: timelineSha256 },
    currentAuthoredSource,
    sceneOverview: { path: `${out}/scenes.png`, sha256: hash(`${out}/scenes.png`) },
    motionOverview: { path: `${out}/motion.png`, sha256: hash(`${out}/motion.png`) },
    native: scenes.map((s) => ({ scene: s.scene, ...entry(s.sample) })),
    declaredMotionChecks: timeline.scenes.reduce(
      (n, s) => n + s.beats.filter((b) => b.motion_check).length,
      0,
    ),
  };
  fs.writeFileSync(`${out}/material.json`, JSON.stringify(material, null, 2) + '\n');
  assignments[index % 5].push({
    id,
    title: receipt.title,
    group: meta.group,
    material: `${out}/material.json`,
  });
}
for (const [i, rows] of assignments.entries())
  fs.writeFileSync(`${base}/assignment-${i + 1}.json`, JSON.stringify(rows, null, 2) + '\n');
console.log(
  JSON.stringify({ lessons: manifest.length, assignments: assignments.map((a) => a.length) }),
);
