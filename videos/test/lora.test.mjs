import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXAMPLE,
  FACTORS,
  matvec,
  matmul,
  forward,
  learningSteps,
  adapterGradients,
  nf4Block,
  doraRow,
  policyRequest,
  rectangularExample,
  projectionBudget,
  rotatedPlane,
} from '../animations/lora.mjs';

const close = (actual, expected) => {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) < 1e-10));
};

test('the rendered thin forward and merged matrix produce the same response at each scale', () => {
  for (const scale of [0, 0.5, 1, 2, 4]) {
    const example = forward(scale);
    close(matvec(example.merged, EXAMPLE.x), example.output);
    close(example.output, [4 + 0.5 * scale, 10 + scale]);
  }
  assert.deepEqual(forward(2).merged, [
    [2, 1],
    [5, 2],
  ]);
  close(forward(2).output, [5, 12]);
});

test('the rank-two construction equals the sum of its two rank-one components', () => {
  const update = matmul(FACTORS.B, FACTORS.A);
  for (const x of [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [2, -1, 0.5],
  ]) {
    const coordinates = matvec(FACTORS.A, x);
    close(
      matvec(update, x),
      FACTORS.B.map((row) => row[0] * coordinates[0] + row[1] * coordinates[1]),
    );
  }
  const [[a, b, c], [d, e, f], [g, h, i]] = update;
  assert.ok(Math.abs(a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)) < 1e-12);
  assert.notEqual(a * e - b * d, 0);
});

test('zero B preserves the initial response while B learns before A in the shown SGD example', () => {
  const steps = learningSteps();
  assert.equal(steps[0].output, 0);
  assert.equal(Math.abs(steps[0].gradA), 0);
  assert.equal(steps[0].gradB, -1);
  assert.equal(steps[1].a, 1);
  assert.equal(steps[1].b, 0.1);
  assert.notEqual(steps[1].gradA, 0);
  assert.ok(steps[1].loss < steps[0].loss);
  for (const { a, b, gradA, gradB } of steps) {
    const loss = (left, right) => (left * right - 1) ** 2 / 2;
    const epsilon = 1e-5;
    assert.ok(
      Math.abs((loss(a + epsilon, b) - loss(a - epsilon, b)) / (2 * epsilon) - gradA) < 1e-9,
    );
    assert.ok(
      Math.abs((loss(a, b + epsilon) - loss(a, b - epsilon)) / (2 * epsilon) - gradB) < 1e-9,
    );
  }
});

test('the adapter chain rule preserves null inputs and reversed no-op initialization', () => {
  const usual = adapterGradients({ A: [[2]], B: [[0]], x: [3], g: [-4], scale: 0.5 });
  close(usual.gradA.flat(), [0]);
  close(usual.gradB.flat(), [-12]);
  const nullInput = adapterGradients({ A: [[1, -1]], B: [[0]], x: [1, 1], g: [2] });
  close(nullInput.gradA.flat(), [0, 0]);
  close(nullInput.gradB.flat(), [0]);
  const reversed = adapterGradients({ A: [[0, 0]], B: [[2]], x: [3, 1], g: [-1] });
  close(reversed.gradA.flat(), [-6, -2]);
  close(reversed.gradB.flat(), [0]);
});

test('the NF4 lookup uses a finite asymmetric codebook and handles an all-zero block', () => {
  const block = nf4Block([-0.2, 0, 0.2, 2]);
  assert.deepEqual(block.codes, [6, 7, 8, 15]);
  close(block.decoded, [-0.1821, 0, 0.15916, 2]);
  assert.deepEqual(nf4Block([0, 0]).codes, [7, 7]);
  close(nf4Block([0, 0]).decoded, [0, 0]);
});

test('equal DoRA forward values preserve distinct full and detached-norm gradients', () => {
  const v = [5, 12],
    magnitude = 13,
    x = [1, 0];
  const result = doraRow(v, magnitude, x);
  close(result.weight, v);
  assert.equal(result.output, 5);
  close(result.full, [144 / 169, -60 / 169]);
  close(result.detached, [1, 0]);
  for (let i = 0; i < v.length; i++) {
    const plus = [...v],
      minus = [...v],
      epsilon = 1e-4;
    plus[i] += epsilon;
    minus[i] -= epsilon;
    const derivative =
      (doraRow(plus, magnitude, x).output - doraRow(minus, magnitude, x).output) / (2 * epsilon);
    assert.ok(Math.abs(derivative - result.full[i]) < 1e-9);
  }
  assert.throws(() => doraRow([0, 0], 1, x));
});

test('the changed policy request can cross its score threshold while failing regression approval', () => {
  const changed = policyRequest();
  close([changed.base, changed.z, changed.correction, changed.output], [-1, 1.5, 1.5, 0.5]);
  assert.equal(changed.escalate, true);
  assert.equal(changed.deploy, false);
  const nullRequest = policyRequest([1, 2]);
  close([nullRequest.z, nullRequest.correction, nullRequest.output], [0, 0, 1]);
});

test('the visible rank-one coefficient and marker use the exact displayed input coordinates', async () => {
  const { createCanvas } = await import('@napi-rs/canvas');
  const { drawFrame } = await import('../lib/scene.mjs');
  const { draw } = await import('../animations/lora.mjs');
  const canvas = createCanvas(960, 540);
  for (const beatP of [0.2, 0.35, 0.4, 0.45, 0.6, 0.65, 0.75, 0.8]) {
    const frame = drawFrame(
      canvas.getContext('2d'),
      { title: 'LoRA' },
      { id: 'rank-one', title: 'One direction' },
      {
        beat: 1,
        beatP,
        t: 10 + beatP * 10,
        duration: 30,
        p: 0.5,
        opacity: 1,
        sceneIndex: 3,
        sceneCount: 14,
      },
      draw,
    );
    const xLabel = frame.labels.find((label) => label.text.startsWith('x = ['));
    const x = xLabel.text.slice(5, -1).split(',').map(Number);
    const c = x[0] - x[1] + 0.5 * x[2];
    const displayed = frame.labels.find((label) => label.text.startsWith('c = '));
    assert.equal(Number(displayed.text.slice(4).replace('−', '-')), Number(c.toFixed(2)));
    const marker = frame.shapes.find((shape) => shape.kind === 'circle' && shape.width === 22);
    assert.ok(marker);
    assert.ok(Math.abs(marker.x + 11 - (650 + 116 * (1 - 0.62 * 0.3) * c)) < 1e-8);
    assert.ok(Math.abs(marker.y + 11 - (640 + 116 * (0.27 + 0.35 * 0.3 - 0.2) * c)) < 1e-8);
  }
});

test('the dense correction label stays readable throughout its construction', async () => {
  const { createCanvas } = await import('@napi-rs/canvas');
  const { drawFrame } = await import('../lib/scene.mjs');
  const { draw } = await import('../animations/lora.mjs');
  const canvas = createCanvas(960, 540);
  for (const beat of [0, 1, 2])
    for (const beatP of [0.1, 0.5, 0.9]) {
      const frame = drawFrame(
        canvas.getContext('2d'),
        { title: 'LoRA' },
        { id: 'dense-update', title: 'Learn a correction' },
        {
          beat,
          beatP,
          t: 10 + beatP * 10,
          duration: 30,
          p: 0.5,
          opacity: 1,
          sceneIndex: 2,
          sceneCount: 14,
        },
        draw,
      );
      const label = frame.labels.find((item) => item.text === 'trainable correction');
      const coversLabel = frame.shapes.some(
        (shape) =>
          shape.fillAlpha >= 0.9 &&
          shape.order > label.order &&
          shape.x < label.x + label.width &&
          shape.x + shape.width > label.x &&
          shape.y < label.y + label.height &&
          shape.y + shape.height > label.y,
      );
      assert.equal(
        coversLabel,
        false,
        `a later filled shape covers the subtitle in beat ${beat}, progress ${beatP}`,
      );
    }
});

test('rectangular factors preserve the output shape and dense merge across partial edits', () => {
  for (const progress of [0, 0.2, 0.5, 1]) {
    const f = rectangularExample(progress);
    assert.equal(f.A.length, 2);
    assert.equal(f.A[0].length, 4);
    assert.equal(f.B.length, 3);
    assert.equal(f.B[0].length, 2);
    close(matvec(f.merged, f.x), f.output);
    close(f.output, [1.375 - 0.09 * progress, -0.875, 1 + 0.105 * progress]);
  }
});

test('grouped-query target counts use the narrower key and value output dimensions', () => {
  const tiny = projectionBudget(16, 32, 8, 2);
  assert.deepEqual(
    tiny.map((row) => row.count),
    [64, 48, 48, 64, 96, 96, 96],
  );
  assert.equal(tiny[0].count + tiny[2].count, 112);
  assert.equal(
    tiny.reduce((n, row) => n + row.count, 0),
    512,
  );
  const large = projectionBudget();
  assert.equal(large[0].count + large[2].count, 262144);
  assert.equal(
    large.reduce((n, row) => n + row.count, 0),
    1249280,
  );
});

test('the prescribed plane rotation preserves independent directions and reaches the same target', () => {
  const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0),
    start = rotatedPlane(0);
  for (let i = 0; i <= 40; i++) {
    const p = rotatedPlane(i / 40);
    assert.ok(Math.abs(Math.hypot(...p.second) - Math.hypot(...start.second)) < 1e-12);
    assert.ok(Math.abs(dot(p.first, p.second) - dot(start.first, start.second)) < 1e-12);
    assert.ok(dot(p.first, p.first) * dot(p.second, p.second) - dot(p.first, p.second) ** 2 > 1);
  }
  const end = rotatedPlane(1);
  close(
    end.first.map((v, i) => end.c1 * v + end.c2 * end.second[i]),
    end.target,
  );
});

test('the fresh policy prediction withholds computed outputs and the independent evaluation verdict', async () => {
  const { createCanvas } = await import('@napi-rs/canvas');
  const { drawFrame } = await import('../lib/scene.mjs');
  const { draw } = await import('../animations/lora.mjs');
  const canvas = createCanvas(1920, 1080);
  const frame = (beat, beatP) =>
    drawFrame(
      canvas.getContext('2d'),
      { title: 'LoRA' },
      { id: 'fresh-policy', title: 'Predict the new request' },
      { beat, beatP, t: 1, duration: 60, p: 0.5, opacity: 1, sceneIndex: 34, sceneCount: 35 },
      draw,
    );
  for (const p of [0.02, 0.5, 0.98]) {
    const labels = frame(0, p).labels.map((label) => label.text);
    assert.equal(labels.includes('0.5'), false);
    assert.equal(
      labels.some((text) => text.includes('19/20') || text.includes('18/20') || text === 'HOLD'),
      false,
    );
    assert.equal(labels.filter((text) => text === '?').length, 5);
  }
  assert.equal(
    frame(1, 0.3).labels.some((label) => label.text === '0.5'),
    false,
  );
  assert.equal(
    frame(1, 0.95).labels.some((label) => label.text === '0.5'),
    true,
  );
  assert.equal(
    frame(2, 0.02).labels.some((label) => label.text.startsWith('HOLD')),
    false,
  );
  assert.equal(
    frame(2, 0.98).labels.some((label) => label.text.startsWith('HOLD')),
    true,
  );
});

test('factorization constructs one entry during its explanation and repeats across the matrix in the next beat', async () => {
  const { createCanvas } = await import('@napi-rs/canvas');
  const { drawFrame } = await import('../lib/scene.mjs');
  const { draw } = await import('../animations/lora.mjs');
  const canvas = createCanvas(1920, 1080);
  const render = (beat, beatP) =>
    drawFrame(
      canvas.getContext('2d'),
      { title: 'LoRA' },
      { id: 'factorization', title: 'Build the update from thin factors' },
      { beat, beatP, t: 12 + beatP * 10, duration: 36, p: 0.5, opacity: 1 },
      draw,
    );
  const entries = (frame) =>
    frame.labels.filter(
      (label) =>
        label.kind === 'text' &&
        label.x > 1285 &&
        label.x < 1570 &&
        label.y > 365 &&
        label.y < 650 &&
        /^[-−]?\d/.test(label.text),
    );
  for (const beatP of [0.2, 0.4, 0.5, 0.7, 0.9, 0.99]) {
    const frame = render(1, beatP);
    assert.equal(
      frame.labels.find((label) => label.text.startsWith('entry (')).text,
      'entry (1, 1)',
    );
    assert.ok(
      entries(frame).length <= 1,
      'the single-entry explanation must keep the other update entries hidden',
    );
  }
  assert.deepEqual(
    entries(render(1, 0.99)).map((label) => Number(label.text)),
    [1],
  );
  assert.deepEqual(
    entries(render(2, 0.99)).map((label) => Number(label.text.replace('−', '-'))),
    matmul(FACTORS.B, FACTORS.A).flat(),
  );
});
