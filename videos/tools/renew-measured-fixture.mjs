#!/usr/bin/env node
import { courseNarrator, speechKey } from '../lib/course-speech.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { timedWordTokens } from '../lib/captions.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const exec = promisify(execFile);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const words = (sound) =>
  sound.words.map((word) => (Array.isArray(word) ? word : [word.text, word.start, word.end]));
const data = (bytes) => JSON.parse(bytes.toString('utf8'));

async function verifiedFile(record) {
  const bytes = await fs.readFile(record.path);
  assert.equal(hash(bytes), record.sha256, record.path);
  if (record.bytes !== undefined) assert.equal(bytes.length, record.bytes, record.path);
  return bytes;
}

/** New data must be an explicitly prepared inspection record, with real media and provider words. */
export async function preparedNarration(indexPath, lessonId, root, sceneIds) {
  const indexBytes = await fs.readFile(indexPath),
    index = data(indexBytes);
  assert.equal(index.version, 1);
  assert.equal(index.kind, 'leetllm.inspection-audio-index');
  const entry = index.lessons.find((entry) => entry.id === lessonId);
  assert.equal(entry?.status, 'prepared', `${lessonId}: actual audio is not prepared`);
  const lessonFile = `videos/lessons/${lessonId}.lesson.yaml`;
  const source = await fs.readFile(path.join(root, lessonFile));
  assert.deepEqual(
    await fs.readFile(path.join(index.repository, lessonFile)),
    source,
    'prepared lesson differs from current authored source',
  );
  const lesson = parse(source.toString('utf8'));
  assert.equal(lesson.id, lessonId);
  const timeline = data(await verifiedFile(entry.audio.timeline));
  assert.equal(timeline.id, lessonId);
  assert.deepEqual(timeline.ttsAdapter, entry.audio.ttsAdapter);
  assert.equal(
    hash(await fs.readFile(path.join(index.repository, timeline.ttsAdapter.path))),
    timeline.ttsAdapter.sha256,
  );
  const selected = sceneIds ?? lesson.scenes.map((scene) => scene.id);
  assert.equal(new Set(selected).size, selected.length);
  const evidence = [];
  for (const id of selected) {
    const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === id);
    assert(sceneIndex >= 0, `Unknown scene: ${id}`);
    const authored = lesson.scenes[sceneIndex],
      timing = timeline.scenes[sceneIndex];
    assert.equal(timing.id, id);
    assert.equal(timing.beats.length, authored.beats.length);
    for (const [beatIndex, beat] of authored.beats.entries()) {
      assert.equal(timing.beats[beatIndex].say, beat.say, `${id}/${beatIndex}: stale narration`);
      const sound = timing.sounds.find((sound) => sound.beatIndex === beatIndex);
      assert(sound, `Missing provider sound: ${id}/${beatIndex}`);
      const bound = entry.audio.sounds.find(
        (sound) => sound.sceneIndex === sceneIndex && sound.beatIndex === beatIndex,
      );
      assert(bound, `Missing prepared sound record: ${id}/${beatIndex}`);
      for (const key of ['key', 'audio', 'boundaries', 'audioHash', 'boundariesHash', 'duration'])
        assert.deepEqual(sound[key], bound[key], `${id}/${beatIndex}: ${key}`);
      const expectedKey = speechKey(beat.say, courseNarrator, timeline.ttsAdapter.sha256);
      assert.equal(sound.key, expectedKey, `${id}/${beatIndex}: speech identity`);
      await verifiedFile({ path: sound.audio, sha256: sound.audioHash });
      const provider = data(
        await verifiedFile({ path: sound.boundaries, sha256: sound.boundariesHash }),
      );
      assert.deepEqual(
        sound.words,
        provider.words,
        'timeline words differ from provider boundary bytes',
      );
      const { stdout } = await exec('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        sound.audio,
      ]);
      assert(
        Math.abs(Number(stdout.trim()) - sound.duration) < 0.000001,
        'provider audio duration differs from measured media',
      );
      timedWordTokens(sound.words, beat.say);
      assert(
        sound.words.every(
          (word) =>
            Number.isFinite(word.start) &&
            Number.isFinite(word.end) &&
            word.start >= 0 &&
            word.end >= word.start &&
            word.end <= sound.duration + 0.2,
        ),
      );
      evidence.push({
        scene: id,
        beat: beatIndex,
        key: sound.key,
        audioSha256: sound.audioHash,
        boundariesSha256: sound.boundariesHash,
        duration: sound.duration,
      });
    }
    resolveSceneCues(authored, timing);
  }
  return {
    lesson,
    timeline,
    sceneIds: selected,
    provenance: {
      preparedRecordSha256: hash(JSON.stringify(entry)),
      planSha256: index.planSha256,
      timelineSha256: entry.audio.timeline.sha256,
      sourceFingerprint: entry.audio.sourceFingerprint,
      ttsAdapter: timeline.ttsAdapter,
      evidence,
    },
  };
}

/** Retain unchanged provider measurements exactly; a changed SAY must use freshly verified words. */
export function renewedFixture({ lesson, timeline, sceneIds, provenance, previous }) {
  if (previous?.lessonId) assert.equal(previous.lessonId, lesson.id);
  const retained = [],
    changed = [];
  const scenes = sceneIds.map((id) => {
    const authored = lesson.scenes.find((scene) => scene.id === id),
      current = timeline.scenes.find((scene) => scene.id === id);
    assert(authored && current, id);
    assert.equal(current.beats.length, authored.beats.length);
    const old = previous?.scenes.find((scene) => scene.id === id);
    const sounds = current.sounds.map((sound, index) => {
      const beatIndex = sound.beatIndex ?? index,
        prior = old?.sounds.find((sound, index) => (sound.beatIndex ?? index) === beatIndex);
      assert.equal(current.beats[beatIndex].say, authored.beats[beatIndex].say);
      if (prior && old.beats[beatIndex].say === authored.beats[beatIndex].say) {
        assert.deepEqual(
          words(prior),
          words(sound),
          `${id}/${beatIndex}: unchanged narration has different provider words`,
        );
        assert.equal(
          prior.duration,
          sound.duration,
          `${id}/${beatIndex}: unchanged narration has different measured duration`,
        );
        if (prior.boundariesSha256) assert.equal(prior.boundariesSha256, sound.boundariesHash);
        retained.push({ scene: id, beat: beatIndex });
        return structuredClone(prior);
      }
      changed.push({ scene: id, beat: beatIndex, previousSay: old?.beats[beatIndex]?.say ?? null });
      return {
        beatIndex,
        duration: sound.duration,
        boundariesSha256: sound.boundariesHash,
        words: words(sound),
        provenance: {
          key: sound.key,
          audioSha256: sound.audioHash,
          boundariesSha256: sound.boundariesHash,
        },
      };
    });
    return {
      id,
      fps: current.fps,
      frames: current.frames,
      duration: current.duration,
      start: current.start,
      provenance: {
        timelineSha256: provenance.timelineSha256,
        ...(old?.provenance ? { prior: old.provenance } : {}),
      },
      beats: current.beats.map(({ say, start, end, duration, until }) => ({
        say,
        start,
        end,
        duration,
        until,
      })),
      sounds,
    };
  });
  return {
    version: 1,
    lessonId: lesson.id,
    scope:
      'Actual provider words and measured sound durations for current-source unit regressions. Unchanged sound records are retained exactly; changed narration uses hash-verified prepared inspection audio. No movie, source-quality or publication approval.',
    wordFields: ['text', 'start', 'end'],
    renewal: { ...provenance, retained, changed },
    scenes,
  };
}

async function main() {
  const args = process.argv.slice(2),
    option = (name) => {
      const index = args.indexOf(name);
      return index < 0 ? undefined : args[index + 1];
    };
  const lessonId = option('--lesson'),
    indexPath = option('--audio-index');
  assert(/^[a-z][a-z0-9-]*$/.test(lessonId ?? ''), '--lesson ID is required');
  assert(indexPath, '--audio-index FILE is required');
  const root = fileURLToPath(new URL('../../', import.meta.url)),
    output = path.join(root, `videos/test/fixtures/measured-narration/${lessonId}.json`);
  let previous, previousSha256;
  const previousFile = option('--previous') ?? output;
  try {
    const bytes = await fs.readFile(previousFile);
    previous = data(bytes);
    previousSha256 = hash(bytes);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const sceneIds = option('--scenes')?.split(',') ?? previous?.scenes.map((scene) => scene.id);
  assert(sceneIds?.length, '--scenes is required for a new fixture');
  const prepared = await preparedNarration(path.resolve(indexPath), lessonId, root, sceneIds);
  const fixture = renewedFixture({ ...prepared, previous });
  fixture.renewal.previousFixtureSha256 = previousSha256 ?? null;
  await fs.writeFile(output, JSON.stringify(fixture, null, 2) + '\n');
  console.log(
    JSON.stringify({
      lessonId,
      output,
      retained: fixture.renewal.retained.length,
      measuredNewOrChanged: fixture.renewal.changed.length,
      timelineSha256: fixture.renewal.timelineSha256,
    }),
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
