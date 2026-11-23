import test from 'node:test';
import assert from 'node:assert/strict';
import { voiceWorksheet, voiceReconcile, voiceLateAck } from '../animations/voice-agents.mjs';

test('confirmed audio retains only complete aligned chunks, including exact boundaries', () => {
  const { freshText, freshChunks } = voiceWorksheet();
  assert.equal(voiceReconcile(freshText, freshChunks, 299).retained, '');
  assert.equal(voiceReconcile(freshText, freshChunks, 300).retained, 'Lookup is ready.');
  assert.equal(voiceReconcile(freshText, freshChunks, 460).endChar, 16);
  assert.equal(voiceReconcile(freshText, freshChunks, 700).retained, freshText);
  assert.throws(
    () =>
      voiceReconcile(
        'OK',
        [
          { text: '', endChar: 0, endMs: 100 },
          { text: 'OK', endChar: 2, endMs: 200 },
        ],
        100,
      ),
    /empty chunk/,
  );
  assert.throws(
    () => voiceReconcile('OK', [{ text: 'OK', endChar: 2.0, endMs: 200 }], 200.5),
    /cursor/,
  );
});

test('late cancelled or wrong-identity acknowledgements cannot extend or cancel a fresh reply', () => {
  const cancelled = { session: 'Alex', response: 7, cursor: 460, received: 700, cancelled: true };
  const fresh = { session: 'Alex', response: 8, cursor: 0, received: 300, cancelled: false };
  assert.deepEqual(voiceLateAck(cancelled, { session: 'Alex', response: 7, cursor: 700 }), {
    ...cancelled,
    accepted: false,
  });
  assert.deepEqual(voiceLateAck(fresh, { session: 'Alex', response: 7, cursor: 300 }), {
    ...fresh,
    accepted: false,
  });
  assert.deepEqual(voiceLateAck(fresh, { session: 'Other', response: 8, cursor: 300 }), {
    ...fresh,
    accepted: false,
  });
  assert.deepEqual(voiceLateAck(fresh, { session: 'Alex', response: 8, cursor: 300 }), {
    ...fresh,
    cursor: 300,
    accepted: true,
  });
  assert.equal(fresh.cursor, 0);
  assert.equal(fresh.cancelled, false);
});

import { draw } from '../animations/voice-agents.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const lesson = await readLesson(
  new URL('../lessons/voice-agents.lesson.yaml', import.meta.url),
  root,
);
function painted(sceneId, beat, activeCue, complete) {
  const scene = lesson.scenes.find((s) => s.id === sceneId),
    labels = [];
  const activeIndex = scene.beats[beat].visual_cues.findIndex((c) => c.id === activeCue);
  const cues = Object.fromEntries(
    scene.beats.flatMap((b, i) =>
      (b.visual_cues ?? []).map((c, j) => {
        const past = i < beat || (i === beat && j < activeIndex);
        return [c.id, { phase: past ? 'after' : 'before', progress: past ? 1 : 0 }];
      }),
    ),
  );
  cues[activeCue] = { phase: complete ? 'after' : 'during', progress: complete ? 1 : 0.99 };
  const api = {
    C: {
      ink: 'ink',
      muted: 'muted',
      panel: 'panel',
      blue: 'blue',
      cyan: 'cyan',
      green: 'green',
      yellow: 'yellow',
      pink: 'pink',
      bg: 'bg',
    },
    focus: { target: (_id, fn) => fn() },
    text: (_ctx, value) => labels.push(value),
    rect() {},
    line() {},
    circle() {},
  };
  draw({}, scene, { beat, beatP: 0.5, cues }, api);
  return labels;
}

test('fresh prediction and wrong-response verdict wait for separate completed clauses', () => {
  assert(
    !painted('fresh-interruption', 1, 'va-fresh-interruption-1-0', false).includes(
      '“Lookup is ready.”',
    ),
  );
  assert(
    painted('fresh-interruption', 1, 'va-fresh-interruption-1-0', true).includes(
      '“Lookup is ready.”',
    ),
  );
  assert(
    !painted('fresh-interruption', 2, 'va-fresh-interruption-2-1', false).some((x) =>
      String(x).includes('REJECT'),
    ),
  );
  assert(
    painted('fresh-interruption', 2, 'va-fresh-interruption-2-1', true).some((x) =>
      String(x).includes('REJECT'),
    ),
  );
});
