import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { draw, completeFrame } from '../animations/softmax.mjs';
const Y = createRequire(import.meta.url)('yaml'),
  lesson = Y.parse(
    fs.readFileSync(new URL('../lessons/softmax.lesson.yaml', import.meta.url), 'utf8'),
  );
const during = { phase: 'during', progress: 0.99 },
  after = { phase: 'after', progress: 1 };
function paint(id, beat, overrides = {}) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          { phase: i < beat ? 'after' : 'before', progress: i < beat ? 1 : 0 },
        ]),
      ),
    );
  Object.assign(cues, overrides);
  const labels = [],
    rects = [],
    api = {
      C: new Proxy({}, { get: (_, k) => String(k) }),
      text: (_c, s) => labels.push(String(s)),
      math: (_c, s) => labels.push(String(s)),
      rect: (_c, ...args) => rects.push(args),
      line() {},
      arrow() {},
      circle() {},
      focus: { target: (_id, fn) => fn() },
      teaching: { bars() {}, axes: () => ({ point: (x, y) => ({ x, y }) }), curve() {} },
    };
  draw({}, scene, { beat, beatP: 0.5, cues }, api);
  return { labels, rects };
}
test('fresh completed mean and empty decision are withheld through their last word', () => {
  assert.equal(
    completeFrame('earned-transfer', { beat: 1, cues: { 'fresh-mean-repair': during } }).freshStage,
    0,
  );
  assert.equal(
    completeFrame('earned-transfer', { beat: 1, cues: { 'fresh-mean-repair': after } }).freshStage,
    3,
  );
  assert(
    !paint('earned-transfer', 2, { 'fresh-empty': during }).labels.some((s) =>
      s.includes('SKIP UPDATE'),
    ),
  );
  assert(
    paint('earned-transfer', 2, { 'fresh-empty': after }).labels.some((s) =>
      s.includes('SKIP UPDATE'),
    ),
  );
});
test('the supervised second row prints its actual half-logit operand', () => {
  const p = paint('token-reduction', 0);
  assert(p.labels.includes('[0.5, 0, 2]'));
  assert(!p.labels.includes('[1, 0, 2]'));
});
test('teacher contribution is independent from the earlier completed mean', () => {
  const p = paint('teacher-forcing', 1, {
    'teacher-loss-mean': after,
    'teacher-token-losses': after,
  });
  assert(!p.labels.some((s) => s.includes('87.6%')));
  assert(!p.rects.some((r) => r[1] === 935));
  const q = paint('teacher-forcing', 1, {
    'teacher-loss-mean': after,
    'teacher-token-losses': after,
    'teacher-first-contribution': after,
  });
  assert(q.labels.some((s) => s.includes('87.6%')));
});
test('matching entropy result waits for the complete result phrase', () => {
  assert(
    !paint('entropy-reference', 1, { 'entropy-match': during }).labels.some((s) =>
      s.includes('cross-entropy ='),
    ),
  );
  assert(
    paint('entropy-reference', 1, { 'entropy-match': after }).labels.some((s) =>
      s.includes('cross-entropy = 0.693147'),
    ),
  );
});
test('changed loss input does not display the new objective before its completed clause', () => {
  const p = paint('loss-input-contract', 1, {
    'api-extra-softmax': after,
    'api-extra-result': during,
  });
  assert(!p.labels.some((s) => /^loss 1\./.test(s)));
  const q = paint('loss-input-contract', 1, {
    'api-extra-softmax': after,
    'api-extra-result': after,
  });
  assert(q.labels.some((s) => /^loss 1\./.test(s)));
});
