import { capacityFixture, deliveryState, metrics } from './arithmetic.mjs';
import {
  alternateServerTimes,
  outputs,
  prompt,
  replyBTimes,
  sceneIds,
  tokenTimes,
} from './fixtures.mjs';
import { sampleModel, synthesisState } from './model.mjs';
import assert from 'node:assert/strict';
export function validateBaselineModel() {
  const m = metrics(0, tokenTimes);
  assert.deepEqual(m.gaps, [35, 37, 36]);
  assert.deepEqual(deliveryState(400).buffer, ['T3']);
  assert.deepEqual(deliveryState(440).buffer, ['T3', 'T4']);
  assert.deepEqual(deliveryState(470).buffer, []);
  assert.equal(deliveryState(470).events.at(-1).ids.length, 2);
  assert.equal(m.ttft, 320);
  assert.equal(m.tpot, 36);
  assert(Math.abs(m.decodeTps - 27.77777777777778) < 1e-10);
  assert.equal(metrics(0, []).ttft, null);
  assert.equal(metrics(0, [320]).decodeTps, null);
  assert.equal(metrics(0, [320, 320]).decodeTps, null);
  assert.throws(() => metrics(0, [4, 3]), /Invalid/);
  for (const id of sceneIds)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.25, 0.549999, 0.55, 0.75, 0.999999]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert.equal(s.step, beat);
        if (id === 'decode') {
          assert.deepEqual(s.cached, [...prompt, ...outputs.slice(0, s.consumed)]);
          assert(s.emitted === s.consumed || s.emitted === s.consumed + 1);
          assert.equal(s.prediction, outputs[s.emitted - 1]);
        }
        if (id === 'delivery')
          assert.deepEqual(
            s.planned.flatMap((event) => event.ids),
            ['T1', 'T2', 'T3', 'T4'],
          );
        if (id === 'first-clock')
          assert.equal(
            s.serverTtft,
            s.spans.reduce((sum, span) => sum + span.duration, 0),
          );
        if (id === 'roofline') assert.equal(s.intensity, s.rows);
      }
  assert.equal(
    sampleModel('first-clock', {
      beat: 1,
      beatP: 0.9,
    }).serverTtft,
    250,
  );
  assert.equal(
    sampleModel('first-clock', {
      beat: 2,
      beatP: 0.9,
    }).clientTtft,
    380,
  );
  assert.equal(
    sampleModel('first-clock', {
      beat: 0,
      beatP: 0.12,
    }).constructionClock,
    0,
  );
  assert.equal(
    sampleModel('first-clock', {
      beat: 1,
      beatP: 0.12,
    }).serverFirst,
    320,
  );
  assert.equal(
    sampleModel('first-clock', {
      beat: 2,
      beatP: 0.12,
    }).serverFirst,
    250,
  );
  for (const beat of [0, 1, 2])
    for (let i = 0; i <= 100; i++) {
      const trace = sampleModel('first-clock', {
        beat,
        beatP: i / 100,
      });
      assert(
        Math.abs(trace.spans.reduce((sum, span) => sum + span.duration, 0) - trace.serverFirst) <
          1e-9,
      );
      assert(trace.constructionClock <= trace.serverFirst);
      assert(Math.abs(trace.clientTtft - (trace.clientFirst - trace.clientSend)) < 1e-9);
    }
  assert.equal(
    sampleModel('delivery', {
      beat: 2,
      beatP: 0.9,
    }).lastIntervalAverage,
    42.5,
  );
  assert.equal(1000 / ((10 + 100) / 2) === (1000 / 10 + 1000 / 100) / 2, false);
  assert.equal(
    sampleModel('decode', {
      beat: 0,
      beatP: 0.55,
    }).consumed,
    1,
  );
  assert.equal(
    sampleModel('decode', {
      beat: 0,
      beatP: 1,
    }).consumed,
    1,
  );
  assert.equal(
    sampleModel('roofline', {
      beat: 1,
      beatP: 1,
    }).rows,
    32,
  );
  assert.equal(
    sampleModel('roofline', {
      beat: 1,
      beatP: 1,
    }).roof,
    200,
  );
  assert.equal(synthesisState(0, 7.2125 / 19.73).cached, 4);
  assert.equal(synthesisState(0, 10.5 / 19.73).cached, 7);
  for (const beat of [0, 1, 2])
    for (let i = 0; i <= 100; i++) {
      const s = synthesisState(beat, i / 100);
      assert.equal(s.cached, s.promptCount + Math.max(0, s.generated - 1));
      assert(s.server.every((token, index) => token.time === tokenTimes[index]));
      assert(
        s.client.every((token) => token.time >= tokenTimes[Number(token.id.slice(1)) - 1] + 30),
      );
      if (beat > 0) assert.equal(s.cached, 7);
    }
  assert.deepEqual(
    synthesisState(1, 1).client.map((token) => token.time),
    [350, 385, 470, 470],
  );
  assert.equal(synthesisState(2, 0).clientTtft, 380);
  return true;
}
export function validateModel() {
  validateBaselineModel();
  const b = metrics(0, replyBTimes);
  assert.equal(b.endToEndTps, metrics(0, tokenTimes).endToEndTps);
  assert.deepEqual(b.gaps, [116, 116, 116]);
  const client = deliveryState(470).events;
  for (const [times, expected] of [
    [tokenTimes, [37, 78]],
    [alternateServerTimes, [83, 32]],
  ]) {
    for (const { time, ids } of client)
      for (const id of ids) assert(time >= times[Number(id.slice(1)) - 1] + 30);
    assert.deepEqual([times[2] - times[1], client.at(-1).time - times[2]], expected);
  }
  const last = sampleModel('decode', { beat: 2, beatP: 1 });
  assert.equal(last.emitted, 4);
  assert.equal(last.cached.length, 7);
  assert.equal(last.prediction, '.');
  assert(!last.cached.includes(last.prediction));
  const f = capacityFixture();
  assert.equal(f.perToken, 65536);
  assert.equal(f.small, 11811160064);
  assert.equal(f.large, 15032385536);
  assert(f.small <= f.pool && f.large > f.pool);
  assert.deepEqual(f.kvOnly.counts, [53, 107]);
  assert.deepEqual(
    [
      Math.floor(f.hybrid.pool / (f.hybrid.recurrent + f.hybrid.kv)),
      Math.floor(f.hybrid.pool / (f.hybrid.recurrent + f.hybrid.kv / 2)),
    ],
    [53, 55],
  );
  assert.deepEqual(metrics(0, [410, 454, 495, 542]).gaps, [44, 41, 47]);
  assert.equal(metrics(0, [410, 454, 495, 542]).tpot, 44);
  assert.equal(f.perToken * 4096, 268435456);
  assert.equal(Math.ceil(120 / 16) * 16 - 120, 8);
  return true;
}
