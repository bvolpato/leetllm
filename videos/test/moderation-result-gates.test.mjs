import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw } from '../animations/design-real-time-content-moderation-system.mjs';
import { contracts } from './fixtures/result-contracts/moderation.mjs';
const id = 'design-real-time-content-moderation-system',
  lesson = await readLesson(
    new URL('../lessons/' + id + '.lesson.yaml', import.meta.url).pathname,
    new URL('../..', import.meta.url).pathname,
  );
registerLessonFonts();
function paint(c, p, active = false, receiver) {
  const scene = lesson.scenes.find((s) => s.id === c.scene),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((q) => [
          q.id,
          {
            ...q,
            phase: i <= c.beat ? 'after' : 'before',
            progress: i <= c.beat ? 1 : 0,
            strength: 0,
            active: false,
          },
        ]),
      ),
    );
  for (const id of c.reset ?? [])
    cues[id] = { phase: 'before', progress: 0, strength: 0, active: false };
  cues[c.cue] = {
    ...cues[c.cue],
    phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
    progress: p,
    strength: active ? 1 : 0,
    active,
  };
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    {
      t: 35,
      duration: 100,
      opacity: 1,
      beat: c.beat,
      beatP: c.beatP ?? 0.75,
      cueTiming: 'explicit-test-cues',
      cues,
    },
    receiver ?? draw,
  );
}
for (const c of contracts)
  test(`${c.scene}: ${c.cue} waits for its complete clause`, () => {
    for (const p of [0, 0.01, 0.5, 0.999])
      assert.equal(c.has(paint(c, p)), false, `${c.cue} at ${p}`);
    assert.equal(c.has(paint(c, 1)), true);
  });
test('the fresh total and route are both earned after the full clause', () => {
  const a = paint(
    contracts.find((c) => c.cue === 'fresh-moderation-result'),
    1,
  );
  assert(a.labels.some((l) => l.text === '0.243 + 0.418 = 0.661'));
  assert(a.labels.some((l) => l.text === 'Keep pending for review'));
});
test('the arriving supplied score retains its actual axis coordinate', () => {
  for (const beatP of [0.2, 0.22, 0.25]) {
    const points = [],
      c = { scene: 'categories', beat: 0, beatP, cue: 'categories-beat-1-focus-1' },
      a = paint(c, 0.5, false, (ctx, s, state, api) =>
        draw(ctx, s, state, {
          ...api,
          circle(ctx, x, y, r, ...rest) {
            points.push({ x, y, r });
            return api.circle(ctx, x, y, r, ...rest);
          },
        }),
      );
    assert(a.labels.some((l) => l.text === '0.96'));
    const marker = points.find((p) => p.r === 10 && p.y === 469);
    assert(marker);
    assert(Math.abs(marker.x - (630 + 560 * 0.96)) < 1e-9);
  }
});
test('active result clauses retain genuine painted focus geometry', () => {
  for (const c of contracts)
    assert(!paint(c, 0.5, true).issues.some((i) => i.type === 'missing-focus-target'), c.cue);
});
