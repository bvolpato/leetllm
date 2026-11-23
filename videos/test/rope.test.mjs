import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import {
  draw,
  rotatePair,
  rotaryScore,
  softmax,
  cachePositionFrame,
  rotateHead,
  pairingTrace,
  cacheFixture,
  permissionMask,
  frequencySchedules,
  toBfloat16,
  freshPositionFrame,
} from '../animations/rope.mjs';

test('a shifted cached key keeps its token position while an incorrect phase index changes the score', () => {
  const reference = cachePositionFrame(),
    shifted = cachePositionFrame(1);
  const wrong = cachePositionFrame(1, 1),
    restored = cachePositionFrame(1, 1, 1);
  assert.equal(shifted.queryPosition, 13);
  assert.equal(shifted.keyPosition, 11);
  assert.ok(Math.abs(shifted.score - reference.score) < 1e-12);
  assert.equal(wrong.keyPosition, 11);
  assert.equal(wrong.keyPhasePosition, 3);
  assert.equal(wrong.relativePhase, -5);
  assert.ok(Math.abs(wrong.score - shifted.score) > 0.2);
  assert.deepEqual(restored, shifted);
});

test('the rotary simulation preserves norms and relative scores for non-unit content', () => {
  const q = [0.8, 0.6, -1.4, 0.3],
    k = [0.7, 0.5, 0.2, -0.9],
    frequencies = [0.5, 0.05];
  for (const angle of [-20, -1.5, 0, 1, 51]) {
    const rotated = rotatePair(q.slice(0, 2), angle);
    assert.ok(Math.abs(rotated[0] ** 2 + rotated[1] ** 2 - 1) < 1e-12);
  }
  const baseline = rotaryScore(q, k, 5, 3, frequencies);
  for (const shift of [-200, -1, 0, 100, 10000]) {
    assert.ok(Math.abs(rotaryScore(q, k, 5 + shift, 3 + shift, frequencies) - baseline) < 1e-11);
  }
  const relativeKey = frequencies.flatMap((frequency, pair) =>
    rotatePair(k.slice(pair * 2, pair * 2 + 2), -2 * frequency),
  );
  const relativeScore = q.reduce((total, value, i) => total + value * relativeKey[i], 0);
  assert.ok(Math.abs(relativeScore - baseline) < 1e-12);
});

test('single-pair phase wrapping and multi-pair sums use the actual angles', () => {
  const unit = [1, 0],
    frequencies = [0.5, 0.05];
  const trough = rotaryScore(unit, unit, 0, 6, [0.5]);
  const rising = rotaryScore(unit, unit, 0, 8, [0.5]);
  assert.ok(rising > trough);
  for (const distance of [0, 2, 5.25, 8, 12]) {
    const computed = rotaryScore([...unit, ...unit], [...unit, ...unit], 0, distance, frequencies);
    assert.ok(Math.abs(computed - Math.cos(distance * 0.5) - Math.cos(distance * 0.05)) < 1e-12);
  }
});

test('routing remains normalized for large logits and a hard-masked future key', () => {
  const weights = softmax([1002, 1001, 1000, -Infinity]);
  assert.ok(weights.every(Number.isFinite));
  assert.ok(Math.abs(weights.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert.equal(weights[3], 0);
  assert.ok(weights[0] > weights[1] && weights[1] > weights[2]);
});

test('the revealed cosine ends at its moving probe throughout the distance sweep', () => {
  const lesson = { id: 'rope', title: 'RoPE' },
    scene = { id: 'phase-wrap', title: 'A rotating score can rise again' };
  const canvas = createCanvas(960, 540);
  for (const beat of [0, 1])
    for (const beatP of [0.13, 0.3, 0.52, 0.76, 0.94]) {
      const audit = drawFrame(
        canvas.getContext('2d'),
        lesson,
        scene,
        { beat, beatP, opacity: 1, p: 0, sceneIndex: 0, sceneCount: 1 },
        draw,
      );
      const curve = audit.paths.find((path) => path.points[0]?.x === 890);
      assert.ok(curve, 'the plotted cosine must be recorded');
      const endpoint = curve.points.at(-1);
      const marker = audit.shapes.find(
        (shape) => shape.kind === 'circle' && shape.width === 22 && shape.x >= 879,
      );
      assert.ok(marker, 'the plotted probe must be recorded');
      assert.ok(
        Math.hypot(endpoint.x - marker.center.x, endpoint.y - marker.center.y) < 1e-8,
        `curve and probe separated at beat ${beat}, progress ${beatP}`,
      );
    }
});

test('token and output cards stay separated throughout the row permutation', () => {
  const canvas = createCanvas(960, 540);
  for (let step = 0; step <= 1000; step++) {
    const audit = drawFrame(
      canvas.getContext('2d'),
      { id: 'rope', title: 'RoPE' },
      { id: 'permutation', title: 'Content follows its token' },
      { beat: 1, beatP: step / 1000, opacity: 1, p: 0, sceneIndex: 0, sceneCount: 1 },
      draw,
    );
    assert.deepEqual(audit.issues, [], `layout at progress ${step / 1000}`);
    const cards = audit.shapes.filter(
      (shape) =>
        (Math.abs(shape.width - 290) < 0.01 && Math.abs(shape.height - 78) < 0.01) ||
        (Math.abs(shape.width - 330) < 0.01 && Math.abs(shape.height - 82) < 0.01),
    );
    assert.equal(cards.length, 6);
    for (let i = 0; i < cards.length; i++)
      for (let j = i + 1; j < cards.length; j++) {
        const a = cards[i],
          b = cards[j];
        const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        assert.ok(width <= 0 || height <= 0, `cards ${i}/${j} overlap at progress ${step / 1000}`);
      }
  }
});

test('partial rotation preserves the suffix while a complete layout conversion preserves scores', () => {
  const vector = [1, 2, 3, 4, 5, 6, 7, 8],
    rotated = rotateHead(vector, 7, [1, 0.01]);
  assert.deepEqual(rotated.slice(4), vector.slice(4));
  const trace = pairingTrace();
  assert(Math.abs(trace.adjacent - trace.converted) < 1e-12);
  assert(Math.abs(trace.adjacent - trace.wrong) > 0.5);
  assert.throws(() => rotateHead([1, 2], 0, [1, 2]), /contract/);
});

test('the supplied cached layer agrees prefix by prefix and exposes future access under an absent chunk mask', () => {
  const fixture = cacheFixture();
  fixture.full.forEach((row, i) =>
    row.forEach((v, j) => assert(Math.abs(v - fixture.incremental[i][j]) < 1e-12)),
  );
  assert.deepEqual(permissionMask([801, 802], [800, 801, 802]), [
    [true, true, false],
    [true, true, true],
  ]);
  assert.equal(fixture.full[1][2], 0);
  assert(fixture.unmasked[1][2] > 0.1);
  assert(fixture.reset.some((v, i) => Math.abs(v - fixture.full[2][i]) > 0.01));
  assert(fixture.mixed.some((v, i) => Math.abs(v - fixture.repaired[i]) > 0.01));
});

test('uniform interpolation of positions equals uniform frequency scaling, while invalid NTK width is rejected', () => {
  const q = [0.8, 0.6, 0.3, 0.7, 1, 0.2, -0.4, 0.9],
    k = [0.2, -0.3, 0.4, 1, 0.5, -0.6, 0.8, 0.2],
    model = frequencySchedules(4);
  const positions = rotaryScore(q, k, 51 / 4, 47 / 4, model.original),
    frequencies = rotaryScore(q, k, 51, 47, model.pi);
  assert(Math.abs(positions - frequencies) < 1e-12);
  assert.deepEqual(frequencySchedules(1).yarn, frequencySchedules(1).original);
  assert.throws(() => frequencySchedules(4, 2), /width above two/);
});

test('casting indices first loses a distinction that a later cosine cannot restore', () => {
  assert.equal(toBfloat16(4096), toBfloat16(4097));
  assert.equal(Math.cos(toBfloat16(4096)), Math.cos(toBfloat16(4097)));
  assert(Math.abs(Math.cos(4096) - Math.cos(4097)) > 0.1);
});

test('the fresh key keeps logical identity through a wrong storage phase and a separately completed repair', () => {
  const question = freshPositionFrame({ beat: 0, beatP: 1 });
  assert.equal(question.phaseKnown, false);
  assert.equal(question.scoreKnown, false);
  const reference = freshPositionFrame({ beat: 1, beatP: 1 });
  assert.equal(reference.queryPosition, 61);
  assert.equal(reference.keyPosition, 58);
  assert(Math.abs(reference.score - Math.cos(1.2)) < 1e-12);
  const wrong = freshPositionFrame({
    beat: 2,
    beatP: 0,
    cues: {
      'rp-fresh-position-contract-2-0': { phase: 'after', progress: 1 },
      'rp-fresh-position-contract-2-1': { phase: 'before', progress: 0 },
    },
  });
  assert.equal(wrong.keyPosition, 18);
  assert.equal(wrong.phaseIndex, 2);
  assert.equal(wrong.relativePhase, -7.6000000000000005);
  assert(wrong.scoreKnown);
  const repaired = freshPositionFrame({ beat: 2, beatP: 1 });
  assert.equal(repaired.keyPosition, 18);
  assert.equal(repaired.phaseIndex, 18);
  assert(repaired.repaired);
  assert(Math.abs(repaired.score - Math.cos(1.2)) < 1e-12);
});

test('legacy cache geometry uses the same integer indices shown to the viewer at every transition', () => {
  for (let i = 0; i <= 100; i++) {
    const frame = cachePositionFrame(i / 100, 0.63, 0.17);
    assert(Number.isInteger(frame.queryPosition));
    assert(Number.isInteger(frame.keyPosition));
    assert(Number.isInteger(frame.keyPhasePosition));
    assert.equal(frame.relativePhase, (frame.keyPhasePosition - frame.queryPosition) * 0.5);
  }
});
