import { FEATURE_TIME_CUES, base, candidate } from './fixtures.mjs';
import { digest } from './arithmetic.mjs';
import { featureAt, featureImpact, featureWindowState } from './features.mjs';
import { decide, sampleModel } from './model.mjs';
import assert from 'node:assert/strict';
import { checkReceipt, correctedReceipt, offlineReceipt } from './evaluation.mjs';
export function validateModel() {
  const offline = checkReceipt(offlineReceipt);
  assert.equal(offline.cap, 713);
  assert.equal(offlineReceipt.candidate.tokens - offline.cap, 77);
  assert.equal(offline.growth.toFixed(1), '27.4');
  assert.equal(checkReceipt(offlineReceipt, 714).pass, false);
  assert.equal(checkReceipt(offlineReceipt, 713).pass, true);
  const corrected = checkReceipt(correctedReceipt);
  assert.equal(corrected.cap, 575);
  assert.equal(corrected.growth.toFixed(1), '12.0');
  assert.equal(corrected.pass, true);
  assert.notEqual(digest(base), digest(candidate));
  assert.deepEqual(featureImpact(0).offline, [3, 4]);
  assert.deepEqual(featureImpact(1).offline, [0.6, 0.8]);
  assert.equal(featureImpact(1).offlineScore, 0.7);
  assert.equal(featureImpact(1).onlineScore, 3.5);
  assert.deepEqual(
    sampleModel('intro', {
      beat: 1,
      beatP: 0,
    }).features.offline,
    [0.6, 0.8],
  );
  assert.throws(() => featureImpact(1.1), RangeError);
  assert.equal(featureAt(12, 24), 5);
  assert.equal(featureAt(12, 1), null);
  assert.equal(featureAt(14, 24), 9);
  assert.equal(
    decide({
      latency: 910,
      quality: 0.79,
    }),
    'ROLLBACK',
  );
  assert.equal(
    decide({
      latency: 800,
      quality: 0.79,
    }),
    'REVIEW',
  );
  assert.equal(
    decide({
      latency: 800,
      quality: 0.85,
    }),
    'CONTINUE',
  );
  assert.equal(
    decide({
      latency: null,
      quality: 0.85,
    }),
    'ROLLBACK',
  );
  const v = sampleModel('vectors', {
    beat: 1,
    beatP: 0.99,
  });
  assert.equal(v.winner, 'B');
  const b = sampleModel('budget', {
    beat: 1,
    beatP: 0.99,
  });
  assert(Math.abs(b.increase - 790 / 620 + 1) < 1e-12);
  assert(!b.pass);
  assert(
    !sampleModel('controller', {
      beat: 1,
      beatP: 0.5,
    }).applies,
  );
  for (const beatP of [0, 0.1, 0.4, 0.8, 0.99]) {
    const current = sampleModel('budget', {
      beat: 1,
      beatP,
    });
    assert.deepEqual([current.tokens, current.quality, current.latency], [790, 0.87, 970]);
    assert(!current.pass);
  }
  for (const beatP of [0, 0.25, 0.75, 1])
    assert.deepEqual(
      featureWindowState({
        beat: 0,
        beatP,
      }),
      {
        hour: 12,
        ttl: 24,
        value: 5,
      },
    );
  const at = (seconds) =>
    featureWindowState({
      beat: 1,
      beatP: seconds / FEATURE_TIME_CUES.duration,
    });
  assert.deepEqual(at(9.224), {
    hour: 12,
    ttl: 24,
    value: 5,
  });
  const mid = at((FEATURE_TIME_CUES.tightenStart + FEATURE_TIME_CUES.tightenEnd) / 2);
  assert(Math.abs(mid.ttl - 12.5) < 1e-12);
  assert.equal(mid.value, 5);
  assert.deepEqual(at(10.438), {
    hour: 12,
    ttl: 1,
    value: null,
  });
  assert.deepEqual(at(20), {
    hour: 12,
    ttl: 1,
    value: null,
  });
  for (let i = 0; i <= 100; i++) {
    const current = at((i * FEATURE_TIME_CUES.duration) / 100);
    assert.equal(current.value, featureAt(current.hour, current.ttl));
  }
  for (const seconds of [0, 4, 11.89])
    assert.deepEqual(
      sampleModel('intro', {
        beat: 0,
        beatP: seconds / 21.266,
      }).features.offline,
      [3, 4],
    );
  assert.deepEqual(
    sampleModel('intro', {
      beat: 0,
      beatP: 14.11 / 21.266,
    }).features.offline,
    [0.6, 0.8],
  );
  assert.equal(
    sampleModel('vectors', {
      beat: 1,
      beatP: 0.69 / 22.466,
    }).winner,
    'A',
  );
  assert.equal(
    sampleModel('vectors', {
      beat: 1,
      beatP: 4.71 / 22.466,
    }).winner,
    'B',
  );
  for (let i = 0; i <= 100; i++) {
    const frame = sampleModel('vectors', {
      beat: 1,
      beatP: i / 100,
    });
    assert.deepEqual(frame.scores, [frame.a[0], frame.z[0]]);
  }
  return true;
}
