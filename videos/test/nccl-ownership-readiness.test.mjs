import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sampleModel,
  ringTraffic,
  overlapTime,
  byteOffset,
  transposeExchange,
  dependencyTrace,
  draw,
} from '../animations/deep-dive-nccl.mjs';
test('ring traffic keeps sent and received separate and handles a single rank', () => {
  assert.deepEqual(ringTraffic(4, 256), {
    chunk: 64,
    phase: 192,
    sent: 384,
    received: 384,
    rounds: 6,
  });
  assert.equal(ringTraffic(1, 7).sent, 0);
  assert.throws(() => ringTraffic(0, 7));
  assert.equal(byteOffset(3, 2, 4), 24);
  assert.deepEqual(
    transposeExchange([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]),
    [
      [1, 4, 7],
      [2, 5, 8],
      [3, 6, 9],
    ],
  );
});
test('exposed communication and independent input/output dependencies stay distinct', () => {
  assert.deepEqual(overlapTime(10, 5, 4), { exposed: 1, total: 11 });
  assert.deepEqual(overlapTime(10, 4, 1), { exposed: 3, total: 13 });
  assert.throws(() => overlapTime(3, 4, 4));
  assert.deepEqual(dependencyTrace(4, 3, 7, 5), {
    inputReady: false,
    outputReady: false,
    first: 'input',
  });
  assert.deepEqual(dependencyTrace(4, 4, 8, 8), {
    inputReady: true,
    outputReady: true,
    first: null,
  });
  assert.equal(sampleModel('cost', { beat: 3, beatP: 0.5 }).b, 3);
});
function capture(beat, progress) {
  const labels = [],
    traces = [];
  const api = {
    C: new Proxy({}, { get: (_, key) => String(key) }),
    focus: { target: (_, fn) => fn() },
    text: (_, text) => labels.push(text),
    math() {},
    rect() {},
    line() {},
    teaching: {
      timeline(options) {
        traces.push(options);
        return { point: (t) => t * 100, lanes: { consumer: { bounds: { y: 700, height: 60 } } } };
      },
    },
  };
  draw({}, { id: 'fresh-first-event' }, { beat, beatP: progress }, api);
  return { labels, trace: traces[0] };
}
test('fresh trace holds the answer and updates actual read/write timestamps on repaired reveal', () => {
  const question = capture(0, 1);
  assert(!question.labels.some((s) => s.startsWith('First boundary:')));
  assert(question.labels.includes('Predict the first repair and earliest legal consumer time'));
  for (const p of [0, 0.5, 0.999]) {
    const intermediate = capture(1, p);
    assert.equal(intermediate.trace.intervals.find((x) => x.id === 'comm').start, 3);
    assert.equal(intermediate.trace.intervals.find((x) => x.id === 'comm').end, 7);
  }
  const answer = capture(1, 1);
  assert.deepEqual(
    answer.trace.intervals.find((x) => x.id === 'comm'),
    { id: 'comm', lane: 'comm', start: 4, end: 8, label: 'repaired replay 4→8 ms', color: 'cyan' },
  );
  assert(answer.labels.includes('read 8 ms'));
});
