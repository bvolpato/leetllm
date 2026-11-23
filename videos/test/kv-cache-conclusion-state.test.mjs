import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { conclusionSnapshot, draw } from '../animations/kv-cache.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();

const cueIds = [
  'position-four-result',
  'append-today',
  'a-emits-eos',
  'gpu-work-completes',
  'a-releases-block-two',
  'c-claims-block-two',
];
const before = { phase: 'before', progress: 0 };
const after = { phase: 'after', progress: 1 };
const cues = (overrides) => Object.fromEntries(cueIds.map((id) => [id, overrides?.[id] ?? before]));

async function fixture() {
  const lesson = await readLesson(path.join(root, 'videos/lessons/kv-cache.lesson.yaml'), root);
  const scene = lesson.scenes.find((item) => item.id === 'conclusion');
  const paint = (beat, cueOverrides = {}) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      { beat, beatP: 0.5, p: 0.5, t: 1, duration: 2, opacity: 1, cues: cues(cueOverrides) },
      draw,
    );
  return paint;
}

test('the conclusion maps today to physical block 2 and gates reuse on GPU completion', () => {
  const unmapped = conclusionSnapshot(1, 0.9, cues());
  const mapped = conclusionSnapshot(1, 0.1, cues({ 'position-four-result': after }));
  assert.equal(unmapped.mapped, false);
  assert.deepEqual([mapped.logical, mapped.physical, mapped.offset], [1, 2, 0]);
  assert.equal(mapped.appended, false);
  assert.throws(
    () => conclusionSnapshot(1, 0.9, cues({ 'append-today': after })),
    /cannot be appended before/,
  );

  const eos = conclusionSnapshot(2, 0.9, cues({ 'a-emits-eos': after }));
  assert.equal(eos.privateBlockOwner, 'A');
  assert.equal(eos.released, false);
  const released = conclusionSnapshot(
    2,
    0.9,
    cues({
      'a-emits-eos': after,
      'gpu-work-completes': after,
      'a-releases-block-two': after,
    }),
  );
  assert.equal(released.privateBlockOwner, 'free');
  assert.equal(released.sharedBlockOwners, 'B');
  assert.throws(
    () =>
      conclusionSnapshot(
        2,
        0.9,
        cues({
          'a-releases-block-two': after,
        }),
      ),
    /cannot be reused before its GPU work completes/,
  );

  const admitted = conclusionSnapshot(
    2,
    0.9,
    cues({
      'a-emits-eos': after,
      'gpu-work-completes': after,
      'a-releases-block-two': after,
      'c-claims-block-two': after,
    }),
  );
  assert.equal(admitted.privateBlockOwner, 'C');
  assert.equal(admitted.sharedBlockOwners, 'B');
});

test('the rendered conclusion shows the mapped token and separate page ownership changes', async () => {
  const paint = await fixture();
  const address = paint(1, { 'position-four-result': after });
  const addressText = address.labels.map((label) => label.text);
  assert(addressText.some((text) => text.includes('\\lfloor4/4\\rfloor=1')));
  assert(!addressText.some((text) => text.includes('\\lfloor4/4\\rfloor=?')));
  assert.equal(
    address.labels.filter((label) => label.text === 'today').length,
    1,
    'today stays out of physical block 2 until its append cue',
  );
  const mapped = paint(1, { 'position-four-result': after, 'append-today': after });
  const tokenCount = mapped.labels.filter((label) => label.text === 'today').length;
  assert(tokenCount >= 2, 'today should appear in both the request positions and physical block 2');

  const waiting = paint(2, { 'a-emits-eos': after });
  const waitingText = waiting.labels.map((label) => label.text);
  assert(waitingText.includes('EOS emitted'));
  assert(waitingText.includes('A emitted EOS · its cache is still in use'));

  const available = paint(2, {
    'a-emits-eos': after,
    'gpu-work-completes': after,
    'a-releases-block-two': after,
  });
  const availableText = available.labels.map((label) => label.text);
  assert(availableText.includes('Owner: free'));
  assert(availableText.includes('A released block 2 · B keeps shared block 7'));

  const claimed = paint(2, {
    'a-emits-eos': after,
    'gpu-work-completes': after,
    'a-releases-block-two': after,
    'c-claims-block-two': after,
  });
  const claimedText = claimed.labels.map((label) => label.text);
  assert(claimedText.includes('Owner: C'));
  assert(claimedText.includes('C claims block 2 · B keeps shared block 7'));
});
