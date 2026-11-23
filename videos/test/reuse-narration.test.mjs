import assert from 'node:assert/strict';
import test from 'node:test';
import { courseNarrator } from '../lib/course-speech.mjs';
import { createHash } from 'node:crypto';
import { reusableSpeech, verifyPreparedNarration } from '../reuse-narration.mjs';

test('reuses the same narrated text across a uv metadata-only adapter change and rejects changed synthesis inputs', () => {
  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
  const original = Buffer.from(
    '# /// script\n# dependencies = ["edge-tts==7.3.1"]\n# ///\nprint("same speech code")\n',
  );
  const adapterBytes = Buffer.from(
    original.toString().replace('# ///\n', '# [tool.uv]\n# exclude-newer = "P7D"\n# ///\n'),
  );
  const say = 'The cat sat beside the door.',
    { voice, rate, provider } = courseNarrator;
  const baseline = { provider, voice, rate, ttsAdapter: { sha256: hash(original) } };
  const sound = {
    key: hash(JSON.stringify({ text: say, voice, rate, provider, adapterHash: hash(original) })),
    words: say.split(' ').map((text) => ({ text })),
  };
  const args = { say, sound, baseline, voice, rate, adapterBytes };
  assert.equal(reusableSpeech(args), true);
  assert.equal(reusableSpeech({ ...args, say: 'The dog sat beside the door.' }), false);
  assert.equal(reusableSpeech({ ...args, voice: 'another voice' }), false);
  assert.equal(reusableSpeech({ ...args, rate: '+10%' }), false);
  assert.equal(
    reusableSpeech({
      ...args,
      adapterBytes: Buffer.concat([adapterBytes, Buffer.from('changed code')]),
    }),
    false,
  );
  assert.equal(
    reusableSpeech({ ...args, sound: { ...sound, words: [{ text: 'truncated' }] } }),
    false,
  );
});

test('a failed video render can reuse a completed audio phase only with exact timeline and sound hashes', () => {
  const timeline = {
    id: 'example',
    scenes: [{ sounds: [{ key: 'speech', audioHash: 'audio-hash', boundariesHash: 'word-hash' }] }],
  };
  const bytes = Buffer.from(JSON.stringify(timeline)),
    timelineHash = createHash('sha256').update(bytes).digest('hex');
  const audio = {
    status: 'complete',
    evidence: {
      timeline: timelineHash,
      files: { 'timeline.json': timelineHash },
      sounds: [{ key: 'speech', audio: 'audio-hash', boundaries: 'word-hash' }],
    },
  };
  const batch = {
    status: 'failed',
    lessons: [{ id: 'example', phases: { audio, render: { status: 'failed' } } }],
  };
  assert.deepEqual(verifyPreparedNarration(batch, 'example', bytes), timeline);
  const changed = structuredClone(batch);
  changed.lessons[0].phases.audio.status = 'running';
  assert.throws(
    () => verifyPreparedNarration(changed, 'example', bytes),
    /completed, matching timeline/,
  );
  assert.throws(
    () =>
      verifyPreparedNarration(
        batch,
        'example',
        Buffer.from(JSON.stringify({ ...timeline, id: 'another' })),
      ),
    /matching timeline/,
  );
  const corrupt = structuredClone(batch);
  corrupt.lessons[0].phases.audio.evidence.sounds[0].boundaries = 'changed';
  assert.throws(() => verifyPreparedNarration(corrupt, 'example', bytes), /speech hashes differ/);
});
