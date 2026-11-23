import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gaussianEvidenceState,
  binaryInformationState,
  freeBitsState,
  freshCollisionState,
} from '../animations/vae.mjs';
const close = (a, b) => assert(Math.abs(a - b) < 1e-12, `${a} != ${b}`);

test('the constructed ELBO gap closes against fixed evidence rather than prior matching', () => {
  const start = gaussianEvidenceState(0),
    end = gaussianEvidenceState(1);
  close(start.priorKL, 0);
  assert(start.gap > 0.17);
  close(end.gap, 0);
  assert(end.priorKL > 0.1);
  let previous = start.gap;
  for (let i = 0; i <= 100; i++) {
    const f = gaussianEvidenceState(i / 100);
    close(f.elbo + f.gap, f.logEvidence);
    close(f.logEvidence, start.logEvidence);
    close(f.elbo, f.expectedLogLikelihood - f.priorKL);
    assert(f.gap <= previous + 1e-12);
    previous = f.gap;
  }
});

test('moving joint mass can erase identity while preserving the aggregate prior', () => {
  const first = binaryInformationState(0),
    last = binaryInformationState(1);
  close(first.mutualInformation, Math.log(2));
  close(last.mutualInformation, 0);
  for (let i = 0; i <= 100; i++) {
    const f = binaryInformationState(i / 100);
    for (let axis = 0; axis < 2; axis++) close(f.joint[0][axis] + f.joint[1][axis], 0.5);
    for (const row of f.joint) close(row[0] + row[1], 0.5);
    close(f.averageKL, f.mutualInformation + f.aggregateKL);
  }
});

test('free-bits order changes both the charged loss and the example gradients', () => {
  const mixed = freeBitsState([0.2, 2.2], 1);
  close(mixed.groupCharge, 1.2);
  close(mixed.exampleCharge, 1.6);
  assert.deepEqual(mixed.groupGradients, [0.5, 0.5]);
  assert.deepEqual(mixed.exampleGradients, [0, 0.5]);
  const under = freeBitsState([0.2, 0.4], 1);
  assert.deepEqual(under.groupGradients, [0, 0]);
  close(under.groupCharge, 1);
});

test('the fresh arrangement collision withholds code, decode and errors until separate results', () => {
  const cue = (p) => ({ phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during', progress: p });
  for (const p of [0, 0.2, 0.8, 1]) {
    const held = freshCollisionState(0, p);
    assert(!held.codeReady && !held.decodeReady && !held.errorReady);
    const reveal = freshCollisionState(1, p, {
      'vae-fresh-collision-code': cue(p),
      'vae-fresh-collision-decoded': cue(0),
    });
    assert.equal(reveal.codeReady, p === 1);
    assert.equal(reveal.decodeReady, false);
  }
  const f = freshCollisionState(2, 1);
  f.codes.forEach((z) => {
    close(z[0], 0.7);
    close(z[1], 0.3);
  });
  f.outputs[0].forEach((v, i) => close(v, f.outputs[1][i]));
  close(f.mse[0], 0.01322896);
  close(f.mse[1], 0.00682896);
});

test('the fresh-case interpretation waits for its actual decode clause', async () => {
  const [{ createCanvas }, { drawFrame }, { registerLessonFonts }, { draw }] = await Promise.all([
    import('@napi-rs/canvas'),
    import('../lib/scene.mjs'),
    import('../lib/fonts.mjs'),
    import('../animations/vae.mjs'),
  ]);
  registerLessonFonts();
  const cue = (p) => ({
    phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
    progress: p,
    reveal: p,
  });
  const render = (progress) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id: 'fresh-collision', title: 'Predict a new pair before decoding it' },
      {
        beat: 1,
        beatP: 0.5,
        t: 10,
        duration: 30,
        opacity: 1,
        cues: {
          'vae-fresh-collision-code': cue(1),
          'vae-fresh-collision-decoded': cue(progress),
          'vae-fresh-collision-1-build': cue(0.5),
        },
      },
      draw,
    ).labels.map((x) => x.text);
  assert(!render(0).some((x) => x.includes('cannot recover')));
  assert(render(1).some((x) => x.includes('cannot recover')));
});
