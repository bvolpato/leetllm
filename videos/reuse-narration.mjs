#!/usr/bin/env node
import { courseNarrator, speechKey } from './lib/course-speech.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { hasOnlyUvReleaseAgeMetadataChanged } from './lib/review-coverage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const normalize = (text) => (text.toLocaleLowerCase('en').match(/[\p{L}\p{N}]+/gu) ?? []).join('|');

export function reusableSpeech({ say, sound, baseline, voice, rate, adapterBytes }) {
  if (
    baseline.provider !== courseNarrator.provider ||
    baseline.voice !== voice ||
    baseline.rate !== rate
  )
    return false;
  const adapterHash = hash(adapterBytes),
    oldHash = baseline.ttsAdapter?.sha256;
  if (adapterHash !== oldHash && !hasOnlyUvReleaseAgeMetadataChanged(adapterBytes, oldHash))
    return false;
  const expectedKey = speechKey(say, { ...courseNarrator, voice, rate }, oldHash);
  return (
    sound.key === expectedKey &&
    normalize(say) === normalize((sound.words ?? []).map((word) => word.text).join(' '))
  );
}

export function verifyPreparedNarration(batch, id, timelineBytes) {
  const phase = batch.lessons?.find((lesson) => lesson.id === id)?.phases?.audio;
  const evidence = phase?.evidence,
    timeline = JSON.parse(timelineBytes);
  if (
    phase?.status !== 'complete' ||
    timeline.id !== id ||
    evidence?.timeline !== hash(timelineBytes) ||
    evidence.files?.['timeline.json'] !== hash(timelineBytes)
  )
    throw Error(`${id}: prepared narration lacks a completed, matching timeline receipt`);
  const sounds = timeline.scenes.flatMap((scene) => scene.sounds);
  if (
    !sounds.length ||
    sounds.some(
      (sound) =>
        !evidence.sounds?.some(
          (row) =>
            row.key === sound.key &&
            row.audio === sound.audioHash &&
            row.boundaries === sound.boundariesHash,
        ),
    )
  ) {
    throw Error(`${id}: prepared speech hashes differ from the audio-phase receipt`);
  }
  return timeline;
}

async function main(args) {
  const value = (flag, fallback) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback);
  if (args.includes('--help')) {
    console.log(
      'node videos/reuse-narration.mjs --collection FILE --output DIR [--input build/video-worldclass-current-20261023] [--prepared] [--apply]',
    );
    return;
  }
  const collection = JSON.parse(
    await fs.readFile(
      path.resolve(root, value('--collection', 'videos/collections/complete-curriculum.json')),
      'utf8',
    ),
  );
  const input = path.resolve(root, value('--input', 'build/video-worldclass-current-20261023'));
  const output = path.resolve(root, value('--output', 'build/video-visual-teaching-20261023'));
  if (!output.startsWith(path.join(root, 'build') + path.sep))
    throw Error('Narration reuse output must be inside build/');
  const cache = path.join(output, '.audio-cache'),
    apply = args.includes('--apply');
  const adapterBytes = await fs.readFile(path.join(root, courseNarrator.ttsScript)),
    adapterHash = hash(adapterBytes);
  const rows = [];
  if (apply) await fs.mkdir(cache, { recursive: true });
  for (const { id } of collection.lessons) {
    const folder = path.join(input, id);
    let sourceKind = 'encoded-movie',
      sourceReceiptBytes,
      timelineBytes;
    try {
      sourceReceiptBytes = await fs.readFile(path.join(folder, 'verification.json'));
      timelineBytes = await fs.readFile(path.join(folder, 'timeline.json'));
      const receipt = JSON.parse(sourceReceiptBytes);
      if (receipt.id !== id || hash(timelineBytes) !== receipt.artifactSha256['timeline.json'])
        throw Error(`${id}: baseline timeline hash changed`);
    } catch (error) {
      if (error.code !== 'ENOENT' || !args.includes('--prepared')) throw error;
      sourceReceiptBytes = await fs.readFile(path.join(input, 'batch-receipt.json'));
      timelineBytes = await fs.readFile(path.join(input, 'previews', id, 'timeline.json'));
      verifyPreparedNarration(JSON.parse(sourceReceiptBytes), id, timelineBytes);
      sourceKind = 'completed-audio-phase';
    }
    const timeline = JSON.parse(timelineBytes),
      lesson = parse(
        await fs.readFile(path.join(root, 'videos/lessons', `${id}.lesson.yaml`), 'utf8'),
      );
    const { voice, rate } = courseNarrator;
    for (const scene of lesson.scenes) {
      for (const [beatIndex, beat] of scene.beats.entries()) {
        const oldScene = timeline.scenes.find((row) => row.id === scene.id);
        const oldIndex = oldScene?.beats.findIndex((row) => row.say === beat.say) ?? -1;
        const sound = oldScene?.sounds.find((row) => row.beatIndex === oldIndex);
        const key = speechKey(beat.say, courseNarrator, adapterHash);
        const row = {
          id,
          scene: scene.id,
          beat: beatIndex,
          key,
          action: 'synthesis-required',
          sourceKind,
          sourceReceiptSha256: hash(sourceReceiptBytes),
        };
        if (
          !sound ||
          !reusableSpeech({ say: beat.say, sound, baseline: timeline, voice, rate, adapterBytes })
        ) {
          rows.push(row);
          continue;
        }
        const audio = await fs.readFile(sound.audio),
          boundaries = await fs.readFile(sound.boundaries);
        if (hash(audio) !== sound.audioHash || hash(boundaries) !== sound.boundariesHash)
          throw Error(`${id}/${scene.id}/${beatIndex}: baseline speech hash changed`);
        const events = JSON.parse(boundaries).words;
        if (JSON.stringify(events) !== JSON.stringify(sound.words))
          throw Error(`${id}/${scene.id}/${beatIndex}: speech timing changed`);
        const exists = await Promise.all(
          ['mp3', 'json'].map((ext) =>
            fs.access(path.join(cache, `${key}.${ext}`)).then(
              () => true,
              () => false,
            ),
          ),
        );
        Object.assign(row, {
          sourceAudio: sound.audio,
          sourceBoundaries: sound.boundaries,
          audioSha256: sound.audioHash,
          boundariesSha256: sound.boundariesHash,
          sourceTimelineSha256: hash(timelineBytes),
          sourceAdapterSha256: timeline.ttsAdapter.sha256,
          currentAdapterSha256: adapterHash,
          compatibility:
            adapterHash === timeline.ttsAdapter.sha256
              ? 'same-adapter'
              : 'uv-release-age-metadata-only',
        });
        if (exists.some(Boolean)) {
          row.action = exists.every(Boolean)
            ? 'preserved-existing'
            : 'partial-cache-needs-synthesis';
          if (exists.every(Boolean))
            Object.assign(row, {
              existingAudioSha256: hash(await fs.readFile(path.join(cache, `${key}.mp3`))),
              existingBoundariesSha256: hash(await fs.readFile(path.join(cache, `${key}.json`))),
            });
          rows.push(row);
          continue;
        }
        row.action = apply ? 'copied' : 'would-copy';
        if (apply) {
          await fs.copyFile(sound.audio, path.join(cache, `${key}.mp3`), 1);
          await fs.copyFile(sound.boundaries, path.join(cache, `${key}.json`), 1);
          await fs
            .writeFile(path.join(cache, `${key}.txt`), beat.say, { flag: 'wx' })
            .catch((error) => {
              if (error.code !== 'EEXIST') throw error;
            });
          if (
            hash(await fs.readFile(path.join(cache, `${key}.mp3`))) !== sound.audioHash ||
            hash(await fs.readFile(path.join(cache, `${key}.json`))) !== sound.boundariesHash
          )
            throw Error(`${id}: copied speech changed`);
        }
        rows.push(row);
      }
    }
  }
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    apply,
    input,
    output,
    scope:
      'Exact transcript, voice and rate reuse with movie or completed-audio-phase receipt bindings and audio/timing hashes. Adapter bytes must match or differ only by the verified uv release-age metadata. Existing cache files are preserved. No synthesized audio is relabeled as a fresh provider call.',
    summary: rows.reduce(
      (counts, row) => ({ ...counts, [row.action]: (counts[row.action] ?? 0) + 1 }),
      {},
    ),
    beats: rows,
  };
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(
    path.join(output, apply ? 'narration-reuse.json' : 'narration-reuse-plan.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report.summary));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
