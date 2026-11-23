import test from 'node:test';
import { courseNarrator, speechKey } from '../lib/course-speech.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { stringify } from 'yaml';
import { makeSceneTimeline } from '../lib/lesson.mjs';
import { renewedFixture, preparedNarration } from '../tools/renew-measured-fixture.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const wordEvents = [
  { text: 'Move', start: 0.02, end: 0.2 },
  { text: 'right', start: 0.21, end: 0.4 },
];

function inputs() {
  const lesson = {
    id: 'example',
    scenes: [{ id: 'move', beats: [{ say: 'Move right.', hold: 0.2 }] }],
  };
  const scene = {
    ...makeSceneTimeline(lesson.scenes[0], [0.5], 30),
    sounds: [
      {
        beatIndex: 0,
        duration: 0.5,
        words: structuredClone(wordEvents),
        boundariesHash: 'old-word-hash',
      },
    ],
  };
  const previous = {
    lessonId: 'example',
    scenes: [
      {
        ...structuredClone(scene),
        sounds: [
          {
            beatIndex: 0,
            duration: 0.5,
            boundariesSha256: 'old-word-hash',
            words: wordEvents.map(({ text, start, end }) => [text, start, end]),
            provenance: { originalProvider: 'retained' },
          },
        ],
      },
    ],
  };
  return {
    lesson,
    timeline: { scenes: [scene] },
    sceneIds: ['move'],
    provenance: { timelineSha256: 'current-timeline' },
    previous,
  };
}

test('unchanged provider word, duration and provenance records are retained without mutating inputs', () => {
  const input = inputs(),
    before = structuredClone(input),
    result = renewedFixture(input);
  assert.deepEqual(result.scenes[0].sounds[0], input.previous.scenes[0].sounds[0]);
  assert.deepEqual(result.renewal.retained, [{ scene: 'move', beat: 0 }]);
  assert.deepEqual(input, before);
  input.timeline.scenes[0].sounds[0].words[0].start = 0.04;
  assert.throws(() => renewedFixture(input), /different provider words/);
});

test('changed narration uses the new provider timing and stale matching-prefix narration is refused', () => {
  const input = inputs();
  input.previous.scenes[0].beats[0].say = 'Move left.';
  const result = renewedFixture(input);
  assert.equal(result.scenes[0].sounds[0].boundariesSha256, 'old-word-hash');
  assert.equal(result.renewal.changed[0].previousSay, 'Move left.');
  input.timeline.scenes[0].beats[0].say = 'Move right. An old ending.';
  assert.throws(() => renewedFixture(input));
});

test('an unchanged sentence cannot silently acquire a different measured duration or provider hash', () => {
  const input = inputs();
  input.timeline.scenes[0].sounds[0].duration = 0.6;
  assert.throws(() => renewedFixture(input), /different measured duration/);
  input.timeline.scenes[0].sounds[0].duration = 0.5;
  input.timeline.scenes[0].sounds[0].boundariesHash = 'different';
  assert.throws(() => renewedFixture(input));
});

test('prepared input requires a real matching media duration and rejects changed provider bytes and unprepared records', async (t) => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'measured-renewal-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'videos/lessons'), { recursive: true });
  const { lesson } = inputs();
  await fs.writeFile(path.join(root, 'videos/lessons/example.lesson.yaml'), stringify(lesson));
  const adapter = Buffer.from('# synthetic provider contract fixture\n');
  await fs.writeFile(path.join(root, 'videos/tts.py'), adapter);
  const samples = 8000,
    wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF');
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(16000, 24);
  wav.writeUInt32LE(32000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(samples * 2, 40);
  const audio = path.join(root, 'sound.wav'),
    boundaries = path.join(root, 'words.json');
  await fs.writeFile(audio, wav);
  const providerBytes = Buffer.from(JSON.stringify({ words: wordEvents }));
  await fs.writeFile(boundaries, providerBytes);
  const key = speechKey(lesson.scenes[0].beats[0].say, courseNarrator, sha(adapter));
  const sound = {
    sceneIndex: 0,
    beatIndex: 0,
    duration: 0.5,
    key,
    audio,
    boundaries,
    audioHash: sha(wav),
    boundariesHash: sha(providerBytes),
  };
  const timeline = {
    id: 'example',
    ttsAdapter: { path: 'videos/tts.py', sha256: sha(adapter) },
    scenes: [
      {
        ...makeSceneTimeline(lesson.scenes[0], [0.5], 30),
        sounds: [{ ...sound, words: wordEvents }],
      },
    ],
  };
  const timelineFile = path.join(root, 'timeline.json'),
    timelineBytes = Buffer.from(JSON.stringify(timeline));
  await fs.writeFile(timelineFile, timelineBytes);
  const index = {
    version: 1,
    kind: 'leetllm.inspection-audio-index',
    repository: root,
    lessons: [
      {
        id: 'example',
        status: 'prepared',
        audio: {
          timeline: { path: timelineFile, sha256: sha(timelineBytes), bytes: timelineBytes.length },
          ttsAdapter: timeline.ttsAdapter,
          sounds: [sound],
        },
      },
    ],
  };
  const indexFile = path.join(root, 'audio-index.json');
  await fs.writeFile(indexFile, JSON.stringify(index));
  const prepared = await preparedNarration(indexFile, 'example', root, ['move']);
  assert.equal(prepared.provenance.evidence.length, 1);
  assert.equal(prepared.provenance.preparedRecordSha256, sha(JSON.stringify(index.lessons[0])));
  index.updatedAt = 'later unrelated collection progress';
  await fs.writeFile(indexFile, JSON.stringify(index));
  assert.equal(
    (await preparedNarration(indexFile, 'example', root, ['move'])).provenance.preparedRecordSha256,
    prepared.provenance.preparedRecordSha256,
  );
  await fs.appendFile(boundaries, ' ');
  await assert.rejects(preparedNarration(indexFile, 'example', root, ['move']));
  await fs.writeFile(boundaries, providerBytes);
  index.lessons[0].status = 'audio';
  await fs.writeFile(indexFile, JSON.stringify(index));
  await assert.rejects(preparedNarration(indexFile, 'example', root, ['move']), /not prepared/);
});
