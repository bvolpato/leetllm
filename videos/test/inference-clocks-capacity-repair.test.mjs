import test from 'node:test';
import assert from 'node:assert/strict';
import {
  quantizedCapacityFrame,
  inferenceCapacityAnswerVisible,
  capacityFixture,
  draw,
} from '../animations/inference-clocks.mjs';
const cue = (phase, progress = 0.99) => ({ phase, progress }),
  after = (id) => [id, cue('after', 1)];
function paint(id, state) {
  const labels = [],
    rectangles = [],
    noop = () => {};
  const api = {
    C: {
      ink: '#fff',
      muted: '#aaa',
      panel: '#222',
      bg: '#000',
      blue: '#acf',
      green: '#afa',
      yellow: '#ff8',
      pink: '#faf',
      red: '#f88',
    },
    clamp: (v) => Math.max(0, Math.min(1, v)),
    text: (_, s) => labels.push(String(s)),
    math: (_, s) => labels.push(String(s)),
    rect: (_, x, y, width, height) => rectangles.push({ x, y, width, height }),
    line: noop,
    circle: noop,
    arrow: noop,
    components: {},
    teaching: {},
    focus: { target: (_, f) => f() },
  };
  draw({}, { id }, state, api);
  return { labels, rectangles };
}
test('capacity answer remains absent throughout the question and its separate inspection hold', () => {
  for (const b of [1, 2]) {
    const state = { beat: b, beatP: 0.99, cues: { 'ic-capacity-answer': cue('during') } };
    assert.equal(inferenceCapacityAnswerVisible(state), false);
    assert(
      !paint('earned-transfer', state).labels.some((s) =>
        s.includes('Smaller state, smaller reservations'),
      ),
    );
  }
  const state = { beat: 2, beatP: 0.2, cues: { 'ic-capacity-answer': cue('after') } };
  assert.equal(inferenceCapacityAnswerVisible(state), true);
  assert(
    paint('earned-transfer', state).labels.some((s) =>
      s.includes('Smaller state, smaller reservations'),
    ),
  );
});
test('the raw value-width construction precedes any whole-user capacity answer', () => {
  const state = { beat: 0, beatP: 0.99, cues: { 'ic-one-byte-row': cue('during', 0.5) } },
    f = quantizedCapacityFrame(state),
    result = paint('quantize-capacity', state);
  assert.equal(f.oneByteChunks, 4);
  assert(
    !result.labels.some((s) => /53 whole users|107 whole users|= 53 users|= 107 users/.test(s)),
  );
  assert(result.labels.includes('4 of 8 one-byte chunks constructed'));
});
test('budget subtraction and whole allocation counts follow separate completed inputs', () => {
  const ids = [
      'ic-cap-device',
      'ic-cap-weights',
      'ic-cap-reserve',
      'ic-cap-pool',
      'ic-cap-positions',
    ],
    cues = Object.fromEntries(ids.map(after));
  cues['ic-cap-53'] = cue('during', 0.5);
  cues['ic-cap-107'] = cue('before', 0);
  const state = { beat: 1, beatP: 0.99, cues },
    f = quantizedCapacityFrame(state),
    painted = paint('quantize-capacity', state);
  assert(f.device && f.weights && f.reserve && f.pool && f.positions);
  assert.equal(f.twoUsers, 26);
  assert.equal(f.oneUsers, 0);
  assert.equal(f.twoResult, false);
  assert.equal(painted.rectangles.filter((r) => r.y === 665 && r.width < 100).length, 26);
  assert.equal(painted.rectangles.filter((r) => r.y === 870 && r.width < 100).length, 0);
  assert(painted.labels.includes('80 − 54 − 8 = 18 GB dedicated to growing KV'));
  assert(!painted.labels.some((s) => s.includes('= 53 users')));
});
test('both raw precisions fit complete requests against the same fixed pool', () => {
  const f = capacityFixture(),
    per = f.kvOnly.perUser;
  assert.equal(per, 5120 * 65536);
  assert.equal(per / 2, 167772160);
  for (const [bytes, count] of [
    [per, 53],
    [per / 2, 107],
  ]) {
    assert(count * bytes <= f.kvOnly.pool);
    assert((count + 1) * bytes > f.kvOnly.pool);
  }
  const state = {
      beat: 1,
      beatP: 0.2,
      cues: Object.fromEntries(
        [
          'ic-cap-device',
          'ic-cap-weights',
          'ic-cap-reserve',
          'ic-cap-pool',
          'ic-cap-positions',
          'ic-cap-53',
          'ic-cap-107',
        ].map(after),
      ),
    },
    result = paint('quantize-capacity', state);
  assert.equal(result.rectangles.filter((r) => r.y === 665 && r.width < 100).length, 53);
  assert.equal(result.rectangles.filter((r) => r.y === 870 && r.width < 100).length, 107);
  assert.equal(
    result.rectangles.filter((r) => [665, 870].includes(r.y) && r.width === 1440).length,
    2,
  );
});
