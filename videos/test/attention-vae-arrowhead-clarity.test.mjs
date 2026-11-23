import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const runtime = process.env.LEETLLM_VIDEO_TEST_RUNTIME;
const require = createRequire(
  runtime
    ? path.join(runtime, 'test-loader.cjs')
    : fileURLToPath(new URL('../package.json', import.meta.url)),
);
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const moduleUrl = (file) =>
  runtime
    ? pathToFileURL(path.join(runtime, file)).href
    : new URL('../' + file, import.meta.url).href;
const [{ drawFrame }, { layoutIssues }, { findArrowheadOcclusions }, attention, vae] =
  await Promise.all([
    import(moduleUrl('lib/scene.mjs')),
    import(moduleUrl('lib/frame-audit.mjs')),
    import(moduleUrl('lib/arrowhead-occlusion.mjs')),
    import(moduleUrl('animations/attention.mjs')),
    import(moduleUrl('animations/vae.mjs')),
  ]);

registerLessonFonts();

const cue = (progress) => ({
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  progress,
  reveal: progress,
  active: false,
  strength: 0,
  targets: [],
});
const activeCue = (id, progress, targets) => ({
  ...cue(progress),
  id,
  active: true,
  strength: 1,
  targets,
  start: 0,
  end: 1,
});
const close = (actual, expected) =>
  assert(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const samePoint = (actual, expected) => {
  close(actual.x, expected.x);
  close(actual.y, expected.y);
};

function render(animation, sceneId, beat, beatP, cues, captureAxes = false) {
  const scene = { id: sceneId, title: sceneId },
    lesson = { id: sceneId, title: sceneId, scenes: [scene] };
  const canvas = createCanvas(1920, 1080),
    context = canvas.getContext('2d');
  const state = { beat, beatP, t: 12, duration: 50, opacity: 1, cues };
  let plot;
  const draw = captureAxes
    ? (ctx, currentScene, currentState, api) =>
        animation.draw(ctx, currentScene, currentState, {
          ...api,
          teaching: { ...api.teaching, axes: (options) => (plot = api.teaching.axes(options)) },
        })
    : animation.draw;
  const audit = drawFrame(context, lesson, scene, state, draw);
  assert.deepEqual([...audit.issues, ...layoutIssues(audit)], [], `${sceneId} frame layout`);
  return { audit, canvas, plot };
}

function assertVisibleComputedEndpoint(frame, expected, expectedHead, description) {
  const marker = frame.audit.shapes.find(
    (shape) =>
      shape.kind === 'circle' &&
      Math.abs(shape.width - 16) < 1e-8 &&
      Math.hypot(shape.center.x - expected.x, shape.center.y - expected.y) < 1e-8,
  );
  assert(marker, `${description}: the computed-point marker remains at the mathematical result`);
  assert(marker.fillAlpha >= 0.25, `${description}: the compact endpoint marker remains visible`);
  assert.equal(
    marker.strokeAlpha,
    0,
    `${description}: the endpoint marker has no ring stroke to cover the tip`,
  );

  const arrow = frame.audit.connectors.find(
    (connector) =>
      connector.kind === 'arrow' &&
      Math.hypot(connector.to.x - expected.x, connector.to.y - expected.y) < 1e-8,
  );
  assert(arrow, `${description}: a mathematical arrow still reaches the computed point`);
  assert(
    marker.order < arrow.order,
    `${description}: the triangle lands visibly over the small endpoint marker`,
  );
  assert.equal(arrow.head.length, 3, `${description}: the triangular arrowhead remains present`);
  arrow.head.forEach((point, index) => samePoint(point, expectedHead[index]));
  assert.deepEqual(
    findArrowheadOcclusions(frame.audit),
    [],
    `${description}: no later filled marker or ring hides the arrow tip`,
  );
  return arrow;
}

function assertClearConnectorTips(frame, endpoints, description) {
  const connectors = frame.audit.connectors.filter((connector) => connector.kind === 'connect');
  assert.equal(
    connectors.length,
    endpoints.length,
    `${description}: each route still connects its original objects`,
  );
  connectors.forEach((connector, index) => {
    samePoint(connector.to, endpoints[index]);
    assert.equal(
      connector.head.length,
      3,
      `${description}: route ${index + 1} keeps its triangular arrowhead`,
    );
    samePoint(connector.head[0], connector.to);
  });
  assert.deepEqual(
    findArrowheadOcclusions(frame.audit),
    [],
    `${description}: moving particles clear every arrowhead`,
  );
}

test('a partial value mixture keeps the second contribution triangle visible at its running endpoint', () => {
  const cues = {
    'value-mixture-first-weighted-value-b1-1': cue(1),
    'value-mixture-add-weighted-values': cue(0.5),
  };
  const frame = render(attention, 'value-mixture', 0, 0.6, cues);
  const weights = attention.attention(attention.EXAMPLE.Q, attention.EXAMPLE.K, attention.EXAMPLE.V)
    .weights[1];
  const mixture = attention.weightedReadState(weights, attention.EXAMPLE.V, 1, 0.5);
  assertVisibleComputedEndpoint(
    frame,
    { x: 240 + mixture.partial[0] * 225, y: 840 - mixture.partial[1] * 225 },
    [
      { x: 494.6262987171862, y: 615 },
      { x: 494.4215909370297, y: 629.9986030924464 },
      { x: 482.7502409113231, y: 624.1629280795931 },
    ],
    'partial mixture',
  );
});

test('the learned routing mixture keeps its cyan contribution triangle visible at the current result', () => {
  const progress = 0.49612403100774133;
  const cues = { 'routing-raise-score': cue(progress) };
  const frame = render(attention, 'learning-to-route', 0, 0.1708542713567805, cues);
  const mixture = attention.learningRouteSnapshot(0, 0.1708542713567805, cues);
  const expected = { x: 240 + mixture.output[0] * 225, y: 840 - mixture.output[1] * 225 };
  const arrow = frame.audit.connectors.find(
    (connector) =>
      connector.kind === 'arrow' &&
      Math.hypot(connector.to.x - expected.x, connector.to.y - expected.y) < 1e-8,
  );
  assert(arrow, 'the routing arrow reaches the actual computed result');
  [
    { x: 628.2291929145659, y: 553.2291929145658 },
    { x: 628.0244851344091, y: 568.2277960070122 },
    { x: 616.3531351087026, y: 562.392120994159 },
  ].forEach((point, index) => samePoint(arrow.head[index], point));
  assert(
    frame.audit.labels.some((label) => label.text === 'o' && label.alpha >= 0.25),
    'the mathematical output retains a visible separate reference',
  );
  assert(
    !frame.audit.shapes.some(
      (shape) =>
        shape.kind === 'circle' &&
        shape.fillAlpha >= 0.25 &&
        Math.hypot(shape.center.x - expected.x, shape.center.y - expected.y) < shape.width / 2 + 16,
    ),
    'source and output discs stay clear of the actual triangle',
  );
  assert.deepEqual(findArrowheadOcclusions(frame.audit), []);
});

test('the completed attention read keeps the final contribution triangle visible at its output', () => {
  const frame = render(attention, 'complete-read', 1, 0.7832581297650503, {
    'complete-read-transfer-1': cue(1),
  });
  const output = attention.transferRead().output[0];
  assertVisibleComputedEndpoint(
    frame,
    { x: 370 + output[0] * 210, y: 970 - output[1] * 210 },
    [
      { x: 642.9457581360291, y: 612.9457581360291 },
      { x: 642.7001087998412, y: 630.9440818469648 },
      { x: 628.6944887689933, y: 623.9412718315409 },
    ],
    'complete read',
  );
});

test('the VAE prior sample marker preserves the triangular arrow tip at the same latent coordinate', () => {
  const cues = {
    'prior-sample-point-b3-1': cue(0.06294573643410309),
    'prior-decoded-output-b3-2': activeCue('prior-decoded-output-b3-2', 0.99, [
      'prior-decoder',
      'prior-decoded-output',
    ]),
  };
  const frame = render(vae, 'sampling', 2, 0.1842125830402499, cues, true);
  const sample = vae.reparameterizationFrame(2, 0.1842125830402499, cues).sample;
  const latent = vae.priorDecodeFrame(0, sample).latent;
  assert(frame.plot, 'the native latent axes render for the sample plot');
  const expected = frame.plot.point(...latent);
  const decoderArrow = frame.audit.connectors.find(
    (connector) =>
      connector.kind === 'arrow' &&
      Math.abs(connector.to.x - 1180) < 1e-8 &&
      Math.abs(connector.to.y - 530) < 1e-8,
  );
  assert(decoderArrow, 'the prior sample still points into the decoder');
  const enteringSample = frame.audit.shapes.find(
    (shape) => shape.kind === 'circle' && Math.abs(shape.width - 16) < 1e-8 && shape.center.x > 900,
  );
  assert(enteringSample, 'the decoded-sample particle remains visible');
  assert(
    Math.hypot(
      enteringSample.center.x - decoderArrow.to.x,
      enteringSample.center.y - decoderArrow.to.y,
    ) > 16,
    'the moving sample clears the decoder arrow triangle as it enters the decoder',
  );
  assertVisibleComputedEndpoint(
    frame,
    expected,
    [
      { x: 705.8333333333334, y: 539.1666666666666 },
      { x: 700.8961557320202, y: 553.3308566305542 },
      { x: 691.6691433694458, y: 544.1038442679798 },
    ],
    'VAE prior sample',
  );
});

test('Attention token-state particles leave both destination triangles visible', () => {
  const frame = render(attention, 'token-vectors', 0, 0.7998803917171263, {
    'token-vectors-token-state-0-b1-1': activeCue(
      'token-vectors-token-state-0-b1-1',
      0.7429718875502008,
      ['token-state-0', 'token-state-1'],
    ),
  });
  assertClearConnectorTips(
    frame,
    [
      { x: 773.5, y: 430 },
      { x: 773.5, y: 690 },
    ],
    'token-vector transfer',
  );
});

test('Attention grouped-query routes keep their triangle tips clear as four query heads share one KV head', () => {
  const frame = render(attention, 'grouped-query-cache', 0, 0.95, {
    'grouped-query-cache-sharing': activeCue('grouped-query-cache-sharing', 0.94, [
      'grouped-query-cache-storage',
    ]),
  });
  const arrows = frame.audit.connectors.filter(
    (connector) => connector.kind === 'arrow' && connector.from.y === 620 && connector.to.y === 698,
  );
  assert.equal(arrows.length, 4, 'each query head keeps its own route to the shared cache');
  arrows.forEach((arrow, index) => {
    samePoint(
      arrow.to,
      [
        { x: 720, y: 698 },
        { x: 880, y: 698 },
        { x: 1040, y: 698 },
        { x: 1200, y: 698 },
      ][index],
    );
    assert.equal(arrow.head.length, 3, 'each route retains a triangular arrowhead');
  });
  assert.deepEqual(
    findArrowheadOcclusions(frame.audit),
    [],
    'moving particles clear every cache arrowhead',
  );
});

test('VAE bottleneck contributions keep the short arrow triangle readable', () => {
  const frame = render(vae, 'bottleneck', 0, 0.37692771603342806, {
    'center-add': activeCue('center-add', 0.1777777777777778, ['regional-code']),
  });
  assertClearConnectorTips(frame, [{ x: 808, y: 437.5492957746479 }], 'bottleneck contribution');
});

test('VAE code-swap particle clears the decoder-sensitivity arrowhead', () => {
  const frame = render(vae, 'collapse', 1, 0.07958191037979945, {
    'decoder-ignore': cue(1),
    'collapsed-swap': activeCue('collapsed-swap', 0.9870222222222235, ['collapse-probes']),
  });
  assertClearConnectorTips(frame, [{ x: 1068, y: 312.5 }], 'decoder probe swap');
});

test('VAE gradient-routing particles leave all three destination triangles visible', () => {
  const frame = render(vae, 'codes', 1, 0.3913097224797577, {
    'vq-reconstruction-path': activeCue('vq-reconstruction-path', 0.9680808080808079, [
      'vq-reconstruction-route',
    ]),
    'vq-codebook-path': cue(0),
    'vq-commitment-path': cue(0),
  });
  assertClearConnectorTips(
    frame,
    [
      { x: 838, y: 422.5 },
      { x: 838, y: 632.5 },
      { x: 838, y: 842.5 },
    ],
    'codebook gradient routes',
  );
});
