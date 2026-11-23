import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
const m = await import(
  process.env.SANDBOX_ANIMATION_PATH
    ? pathToFileURL(process.env.SANDBOX_ANIMATION_PATH)
    : new URL('../animations/design-agent-sandbox-platform.mjs', import.meta.url)
);
registerLessonFonts();
const lesson = parse(
  fs.readFileSync(
    new URL('../lessons/design-agent-sandbox-platform.lesson.yaml', import.meta.url),
    'utf8',
  ),
);
function paint(id, beat, changes = {}) {
  const scene = lesson.scenes.find((x) => x.id === id),
    cues = {};
  scene.beats.forEach((b, i) =>
    (b.visual_cues ?? []).forEach((c) => {
      const phase = changes[c.id] ?? (i < beat ? 'after' : 'before');
      cues[c.id] = {
        ...c,
        phase,
        progress: phase === 'after' ? 1 : 0,
        reveal: phase === 'after' ? 1 : 0,
        active: false,
        strength: 0,
      };
    }),
  );
  const canvas = createCanvas(1920, 1080),
    audit = drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      { beat, beatP: 0.8, t: 1, duration: 60, opacity: 1, cues, cueTiming: 'provider-words' },
      m.draw,
    );
  audit.noticePixels = canvas.getContext('2d').getImageData(1440, 455, 280, 70).data;
  return audit;
}
const texts = (f) => f.labels.map((x) => x.text);
test('completed page supply changes the guest state and clears the handler pending state', () => {
  const f = texts(paint('fault-handler', 0, { 'sp-fault-handler-file': 'after' }));
  assert(f.includes('page 2 resident'));
  assert(f.includes('page supplied'));
  assert(!f.includes('missing page 2'));
  assert(!f.includes('page supply pending'));
});
test('creator exit closes its actual descriptor while the inherited reference retains the VM', () => {
  const f = texts(paint('reference-retirement', 1));
  assert(f.includes('references: 1'));
  assert(f.includes('closed'));
  assert(f.includes('live reference'));
  assert(!f.includes('references: 0'));
});
test('fresh disposal changes main owner status while B and the immutable base remain', () => {
  const held = texts(paint('fresh-generation', 0));
  assert(!held.some((x) => x.includes('= 20 KiB') || x.includes('= 12 KiB') || x === 'DISPOSED'));
  const f = texts(
    paint('fresh-generation', 2, {
      'sp-fresh-generation-close': 'after',
      'sp-fresh-generation-dispose': 'after',
      'sp-fresh-generation-base': 'after',
    }),
  );
  assert(f.includes('DISPOSED'));
  assert(!f.includes('CANCELLED'));
  assert(f.includes('remaining refs: 0'));
  assert(f.some((x) => x.includes('= 12 KiB')));
});
test('matching retirement is a distinct state before disposal and wrong-generation notices stay pending', () => {
  const wrong = texts(paint('state-machine', 2, { 'sp-state-machine-wrong': 'after' }));
  assert(wrong.includes('cancelled'));
  const retired = texts(
    paint('state-machine', 2, {
      'sp-state-machine-wrong': 'after',
      'sp-state-machine-retired': 'after',
    }),
  );
  assert(retired.includes('retired'));
  assert(retired.includes('99 retained'));
  assert(!retired.includes('Matching retirement → dispose; B still reads 20'));
});
test('shared-quota introduction does not disclose the later sixty-thousand worked premise', () => {
  const f = texts(paint('group-budget', 0, { 'sp-group-budget-shared': 'after' }));
  assert(!f.some((x) => x.includes('60000')));
  const after = texts(paint('group-budget', 1, { 'sp-group-budget-spend': 'after' }));
  assert(after.includes('Thread A spent 60000 μs'));
  assert(after.includes('Group remaining 40000 μs'));
});
test('acknowledgement completion retains positive time on the one-deadline clock', () => {
  const f = texts(
    paint('bounded-ack', 1, { 'sp-bounded-ack-parse': 'after', 'sp-bounded-ack-payload': 'after' }),
  );
  assert(f.some((x) => x.includes('remaining 0.96 s')));
  assert(f.includes('PAYLOAD remains unread after the delimiter'));
});

test('each fresh notice and retirement verdict waits for its own completed clause', () => {
  const before = paint('fresh-generation', 1),
    after = paint('fresh-generation', 1, { 'sp-fresh-generation-wrong': 'after' }),
    pink = (f) => {
      let n = 0;
      for (let i = 0; i < f.noticePixels.length; i += 4)
        if (
          f.noticePixels[i] === 255 &&
          f.noticePixels[i + 1] === 143 &&
          f.noticePixels[i + 2] === 192
        )
          n++;
      return n;
    };
  assert.equal(pink(before), 0);
  assert(pink(after) > 0);
  assert(
    !texts(before).some((x) => x.includes('cannot close a remaining') || x === 'Capacity HELD'),
  );
  const held = texts(
    paint('fresh-generation', 1, {
      'sp-fresh-generation-wrong': 'after',
      'sp-fresh-generation-held': 'after',
    }),
  );
  assert(held.includes('RETIRED'));
  assert(held.includes('Capacity HELD'));
});
test('established retirement persists into the next beat before the final reference closes', () => {
  const before = texts(paint('fresh-generation', 2));
  assert(before.includes('RETIRED'));
  assert(!before.includes('CANCELLED'));
  assert(before.includes('remaining refs: 1'));
  assert(!before.includes('DISPOSED'));
});

test('overlay deletion and output persist through retirement until the fresh upper/work transition completes', () => {
  const deletion = { 'sp-overlay-whiteout-copy': 'after', 'sp-overlay-whiteout-whiteout': 'after' };
  for (const [beat, changes] of [
    [1, deletion],
    [2, {}],
    [2, { 'sp-overlay-whiteout-fresh': 'during' }],
  ]) {
    const f = texts(paint('overlay-whiteout', beat, changes));
    assert(f.includes('whiteout config.txt'));
    assert(f.includes('config.txt absent'));
    assert(f.includes('output.csv'));
    assert(f.includes('output.csv visible'));
    assert(!f.includes('config.txt = A bytes'));
    assert(!f.includes('config.txt = clean'));
  }
  const fresh = texts(paint('overlay-whiteout', 2, { 'sp-overlay-whiteout-fresh': 'after' }));
  assert(fresh.includes('config.txt = clean'));
  assert(fresh.includes('clean lower bytes'));
  assert(!fresh.includes('whiteout config.txt'));
  assert(!fresh.includes('config.txt absent'));
  assert(!fresh.includes('output.csv'));
  assert(!fresh.includes('output.csv visible'));
});
