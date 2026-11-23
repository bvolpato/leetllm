import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import {
  attention,
  dot,
  softmax,
  project,
  EXAMPLE,
  HEAD_INPUT,
  HEAD_MATRICES,
  headResults,
  draw,
  projectionConstruction,
  projectionConstructionFromCues,
  PROJECTION_CUE_IDS,
  scoreScaleSnapshot,
  learningRouteSnapshot,
} from '../animations/attention.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { findArrowheadOcclusions } from '../lib/arrowhead-occlusion.mjs';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { lexicalTokens } from '../lib/captions.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const near = (a, b, tolerance = 1e-12) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${a} differs from ${b}`);

test('the checked attention trace normalizes each query and preserves value coordinates', () => {
  const r = attention(EXAMPLE.Q, EXAMPLE.K, EXAMPLE.V);
  assert.deepEqual(
    r.scores.map((row) => row.map((x) => Number(x.toFixed(2)))),
    [
      [0.9, 0.75],
      [0.6, 1.05],
    ],
  );
  r.weights.forEach((row) =>
    near(
      row.reduce((a, b) => a + b),
      1,
    ),
  );
  near(r.weights[1][0], 1 / (1 + Math.exp(0.45 / Math.sqrt(2))));
  near(r.output[1][0], 1 + r.weights[1][0]);
  near(r.output[1][1], 2 - r.weights[1][0]);
  const causal = attention(EXAMPLE.Q, EXAMPLE.K, EXAMPLE.V, true);
  assert.deepEqual(causal.weights[0], [1, 0]);
  assert.deepEqual(causal.output[0], EXAMPLE.V[0]);
  assert.deepEqual(causal.output[1], r.output[1]);
  softmax([1000, 1001, 999]).forEach((v, i) => near(v, softmax([0, 1, -1])[i]));
});

test('two toy heads actually project shared states into distinct routing and content', () => {
  const heads = headResults();
  heads.forEach((head, i) => {
    assert.deepEqual(head.Q, project(HEAD_INPUT, HEAD_MATRICES[i].Q));
    assert.deepEqual(head.K, project(HEAD_INPUT, HEAD_MATRICES[i].K));
    assert.deepEqual(head.V, project(HEAD_INPUT, HEAD_MATRICES[i].V));
    head.output.forEach((out, row) =>
      out.forEach((x, d) =>
        near(
          x,
          dot(
            head.weights[row],
            head.V.map((v) => v[d]),
          ),
        ),
      ),
    );
  });
  assert.notDeepEqual(heads[0].weights[2], heads[1].weights[2]);
  assert.notDeepEqual(heads[0].V, heads[1].V);
});

test('the rendered output follows changing score weights and survives the equal-value transition', () => {
  const frame = (beat, beatP) => {
    const canvas = createCanvas(960, 540);
    return {
      audit: drawFrame(
        canvas.getContext('2d'),
        {},
        { id: 'learning-to-route', title: 'Learning to route' },
        { t: 2, duration: 12, beat, beatP, opacity: 1 },
        draw,
      ),
      canvas,
    };
  };
  const marker = ({ audit, canvas }) => {
    const label = audit.labels.find(
      (l) => /^\[1\.\d\d, 1\.\d\d\]$/.test(l.text) && l.fontSize > 40,
    );
    assert.ok(label, 'computed mixture output must remain visible');
    const [x, y] = label.text.match(/\d+\.\d+/g).map(Number);
    const expected = { x: 240 + x * 225, y: 840 - y * 225 };
    const arrow = audit.connectors.findLast(
      (s) => s.kind === 'arrow' && Math.hypot(s.to.x - expected.x, s.to.y - expected.y) < 2.3,
    );
    assert.ok(arrow, 'the weighted arrow must reach the computed output');
    const reference = audit.labels.find((l) => l.text === 'o' && l.fontSize === 26);
    assert.ok(reference, 'the output keeps its own reference beside the mathematical endpoint');
    const scale = canvas.width / 1920,
      left = Math.floor(reference.x * scale),
      top = Math.floor(reference.y * scale);
    const pixels = canvas
      .getContext('2d')
      .getImageData(
        left,
        top,
        Math.ceil(reference.width * scale),
        Math.ceil(reference.height * scale),
      ).data;
    let yellow = 0;
    for (let i = 0; i < pixels.length; i += 4)
      if (
        pixels[i] > pixels[i + 2] + 50 &&
        pixels[i + 1] > pixels[i + 2] + 30 &&
        pixels[i + 3] > 200
      )
        yellow++;
    assert.ok(yellow > 3, 'the output reference must be visibly painted');
    return arrow.to;
  };
  for (const p of [0.02, 0.4, 0.8, 0.98]) {
    const f = frame(0, p),
      label = f.audit.labels.find((l) => /^\[1\.\d\d, 1\.\d\d\]$/.test(l.text) && l.fontSize > 40);
    assert.ok(label);
    const values = label.text.match(/\d+\.\d+/g).map(Number),
      m = marker(f);
    near(m.x, 240 + values[0] * 225, 1.2);
    near(m.y, 840 - values[1] * 225, 1.2);
  }
  const a = marker(frame(0, 1)),
    b = marker(frame(1, 0));
  near(a.x, b.x);
  near(a.y, b.y);
  const equal = marker(frame(1, 0.4));
  for (const p of [0.5, 0.7, 0.9, 1]) {
    const m = marker(frame(1, p));
    near(m.x, equal.x);
    near(m.y, equal.y);
  }
});

test('the spoken original probability stays visible before the score-change demonstration', () => {
  const frame = (beat, beatP) =>
    drawFrame(
      createCanvas(960, 540).getContext('2d'),
      {},
      { id: 'softmax-mass', title: 'Softmax' },
      { t: 2, duration: 12, beat, beatP, opacity: 1 },
      draw,
    );
  for (const p of [0.2, 0.3, 0.4, 0.5]) assert.ok(frame(1, p).labels.some((l) => l.text === '58%'));
  assert.ok(
    frame(1, 0.8).labels.some((l) => /^\d+%$/.test(l.text) && Number.parseInt(l.text, 10) > 80),
  );
  const ribbon = (f) =>
    f.shapes
      .filter((s) => Math.abs(s.y - 740) < 0.01 && Math.abs(s.height - 70) < 0.01)
      .map((s) => s.width);
  assert.deepEqual(ribbon(frame(1, 1)), ribbon(frame(2, 0)));
  ribbon(frame(2, 1)).forEach((width, i) => near(width, ribbon(frame(1, 0))[i], 1e-9));
});

test('projection transfers stay painted and clear of product cards and output numerals', () => {
  registerLessonFonts();
  const cases = [
    [0, 0.3102171520064045],
    [1, 0.7492135806486604],
    [2, 0.11317519291226041],
    [2, 0.7490711631894826],
  ];
  const centers = [];
  for (const [beat, beatP] of [...cases, [0, 0.4], [0, 0.5]]) {
    const canvas = createCanvas(1920, 1080),
      ctx = canvas.getContext('2d');
    const audit = drawFrame(
      ctx,
      {},
      { id: 'three-projections', title: 'Construct each learned view from coordinates' },
      { beat, beatP, t: 4, duration: 41, opacity: 1 },
      draw,
    );
    assert.deepEqual(
      layoutIssues(audit),
      [],
      `Projection transfer at beat ${beat}, progress ${beatP}`,
    );
    const marker = audit.shapes.find(
      (shape) => shape.kind === 'circle' && shape.width >= 20 && shape.width <= 26,
    );
    assert(marker, 'The scalar transfer must retain its actual moving marker.');
    const center = { x: marker.x + marker.width / 2, y: marker.y + marker.height / 2 };
    centers.push(center);
    const pixel = ctx.getImageData(Math.round(center.x), Math.round(center.y), 1, 1).data;
    assert(
      pixel[1] > 100 && pixel[3] > 240,
      'The scalar marker must be visibly painted in the native frame.',
    );
    const model = projectionConstruction(beat, beatP);
    assert(
      audit.labels.some(
        (label) => label.text === 'Running sum ' + model.output[model.row][model.column].toFixed(2),
      ),
    );
  }
  assert(
    new Set(centers.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)).size > 3,
    'The transfer marker must travel through distinct visible positions.',
  );
  for (const beat of [0, 1, 2])
    assert.deepEqual(projectionConstruction(beat, 1).output, EXAMPLE[['Q', 'K', 'V'][beat]]);
});

test('each QKV row finishes with its spoken example before the next row starts', () => {
  for (const beat of [0, 1, 2]) {
    const [firstId, secondId] = PROJECTION_CUE_IDS[beat];
    const cues = {
      [firstId]: { phase: 'during', progress: 0.9 },
      [secondId]: directionCue('before'),
    };
    const firstRow = projectionConstructionFromCues(beat, 0.99, cues);
    assert.equal(firstRow.row, 0);
    assert.deepEqual(firstRow.output[1], [0, 0]);

    cues[firstId] = directionCue('after');
    const heldFirstRow = projectionConstructionFromCues(beat, 0.99, cues);
    assert.equal(heldFirstRow.coordinateComplete, true);
    assert.equal(heldFirstRow.row, 0);
    assert.deepEqual(heldFirstRow.output[0], EXAMPLE[['Q', 'K', 'V'][beat]][0]);
    assert.deepEqual(heldFirstRow.output[1], [0, 0]);

    cues[secondId] = { phase: 'during', progress: 0.5 };
    const secondRow = projectionConstructionFromCues(beat, 0, cues);
    assert.equal(secondRow.row, 1);
    assert.ok(secondRow.output[1].some((value) => value !== 0));
  }
});

test('a projection product stays unfinished on screen until its contribution reaches the accumulator', () => {
  const cues = {
    'three-projections-row-q-birds': { ...directionCue('during'), progress: 0.4 },
    'three-projections-row-q-sing': directionCue('before'),
  };
  const frame = directionFrame('three-projections', 0, cues);
  assert(frame.labels.some((label) => label.text === '1.00 × 1.00'));
  assert(!frame.labels.some((label) => label.text === '1.00 × 1.00 = 1.00'));
  assert(frame.labels.some((label) => label.text === 'Running sum 0.83'));
});

test('completed QKV coordinates keep the result clear of the arithmetic equals sign', () => {
  for (const beat of [0, 1, 2]) {
    const [firstId, secondId] = PROJECTION_CUE_IDS[beat];
    const frame = directionFrame('three-projections', beat, {
      [firstId]: directionCue('after'),
      [secondId]: directionCue('before'),
    });
    assert(frame.labels.some((label) => label.text.startsWith('Computed value ')));
    assert.deepEqual(layoutIssues(frame), [], `Completed QKV coordinate in beat ${beat + 1}`);
  }
});

test('parallel-head input particles clear the source cards as they enter the branch', () => {
  const frame = directionFrame('parallel-heads', 0, {
    'parallel-heads-shared-head-input-0-b1-1': {
      ...directionCue('during'),
      progress: 0.02,
      reveal: 0.02,
      strength: 0.02,
      active: true,
    },
  });
  const inputParticles = frame.shapes.filter(
    (shape) => shape.kind === 'circle' && shape.width === 18,
  );
  assert(inputParticles.length > 0, 'an input state should be entering the branch');
  assert(
    inputParticles.every((shape) => shape.x > 407.5),
    'the particles should begin outside their source cards',
  );
  assert.deepEqual(layoutIssues(frame), []);
});

test('QKV transfer particles stop before their destination triangles', () => {
  const [firstId, secondId] = PROJECTION_CUE_IDS[0];
  const frame = directionFrame('three-projections', 0, {
    [firstId]: directionCue('after'),
    [secondId]: { ...directionCue('during'), progress: 0.999, active: true },
  });
  assert(frame.connectors.filter((connector) => connector.kind === 'arrow').length >= 2);
  assert.deepEqual(findArrowheadOcclusions(frame), []);
});

test('parallel-head particles stop before both head-entry triangles', () => {
  const frame = directionFrame('parallel-heads', 0, {
    'parallel-heads-shared-head-input-0-b1-1': {
      ...directionCue('during'),
      progress: 0.88,
      reveal: 0.88,
      strength: 1,
      active: true,
    },
  });
  assert(frame.connectors.filter((connector) => connector.kind === 'arrow').length >= 2);
  assert.deepEqual(findArrowheadOcclusions(frame), []);
});

test('scaling holds the widened population fixed while dividing by its square-root width', () => {
  assert.deepEqual(scoreScaleSnapshot(1, 1), scoreScaleSnapshot(2, 0));
  for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
    const s = scoreScaleSnapshot(2, progress);
    assert.equal(s.width, 64);
    near(s.sigma, 8 / s.divisor);
  }
  near(scoreScaleSnapshot(2, 1).sigma, 1);
});

const directionCue = (phase) => ({
  phase,
  progress: phase === 'before' ? 0 : 1,
  reveal: phase === 'before' ? 0 : 1,
  active: false,
  strength: 0,
  targets: [],
});
const directionFrame = (id, beat, cues) => {
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Attention mechanism' },
    { beat, beatP: 0.95, t: 10, duration: 12, opacity: 1, cueTiming: 'provider-words', cues },
    draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return frame;
};

test('the softmax return caption follows the same spoken construction as the shares', () => {
  const cues = {
    'softmax-common-shift': directionCue('after'),
    'softmax-return': directionCue('before'),
  };
  const before = directionFrame('softmax-mass', 2, cues);
  assert(before.labels.some((l) => l.text === 'Subtract one shared maximum: same shares'));
  assert(!before.labels.some((l) => l.text === '42%'));
  cues['softmax-return'] = { ...directionCue('during'), progress: 0.5 };
  assert(
    directionFrame('softmax-mass', 2, cues).labels.some(
      (l) => l.text === 'Restoring the original shares',
    ),
  );
  cues['softmax-return'] = directionCue('after');
  const held = directionFrame('softmax-mass', 2, cues);
  assert(held.labels.some((l) => l.text === 'Original shares restored'));
  assert(held.labels.some((l) => l.text === '42%'));
  assert(held.labels.some((l) => l.text === '58%'));
});

test('the toy scaling bridge waits for its clause and retains the sixty-four-coordinate example', () => {
  const cues = {
    'scale-the-scores-scaled-dot-rule-b3-1': directionCue('after'),
    'scale-toy-rule': directionCue('before'),
  };
  const before = directionFrame('scale-the-scores', 2, cues);
  assert(!before.labels.some((l) => l.text === String.raw`\frac{q\cdot k}{\sqrt{2}}`));
  cues['scale-toy-rule'] = directionCue('after');
  const held = directionFrame('scale-the-scores', 2, cues);
  assert(
    held.labels.some((l) => l.text === String.raw`\frac{q\cdot k}{\sqrt{2}}` && l.alpha === 1),
  );
  assert(
    held.labels.some((l) => l.text === String.raw`\frac{q\cdot k}{\sqrt{64}}=\frac{q\cdot k}{8}`),
  );
  assert(held.labels.some((l) => l.text === '64'));
});

test('the opening adds a second source before showing the copy-or-blend prediction', () => {
  const cues = Object.fromEntries(
    ['intro-verb-context', 'intro-read', 'intro-prediction'].map((id) => [
      id,
      directionCue('before'),
    ]),
  );
  const render = () => {
    const canvas = createCanvas(1920, 1080),
      frame = drawFrame(
        canvas.getContext('2d'),
        {},
        { id: 'subject-intro', title: 'Does attention choose one source?' },
        {
          beat: 1,
          beatP: 0.95,
          t: 10,
          duration: 12,
          opacity: 1,
          cueTiming: 'provider-words',
          cues,
        },
        draw,
      );
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
    return { canvas, frame };
  };
  let { frame, canvas: initialCanvas } = render();
  assert(!frame.labels.some((label) => label.text === 'Copy one value, or blend several?'));
  assert(!frame.targets.some((target) => target.id === 'intro-prediction'));

  cues['intro-verb-context'] = directionCue('after');
  cues['intro-read'] = directionCue('after');
  const { canvas: sourceCanvas } = render();
  const sourcePixel = (canvas) => canvas.getContext('2d').getImageData(903, 497, 1, 1).data;
  const beforeSource = sourcePixel(initialCanvas),
    afterSource = sourcePixel(sourceCanvas);
  assert(
    afterSource[1] > beforeSource[1] + 20 && afterSource[2] > beforeSource[2] + 30,
    'the second possible source should paint a cyan route to the active word',
  );
  frame = render().frame;
  assert(!frame.labels.some((label) => label.text === 'Copy one value, or blend several?'));

  cues['intro-prediction'] = directionCue('after');
  frame = render().frame;
  assert(frame.labels.some((label) => label.text === 'one source'));
  assert(frame.labels.some((label) => label.text === 'several sources'));
  assert(frame.labels.some((label) => label.text === 'Copy one value, or blend several?'));
});

test('the quadratic grid enlarges the first example, then separates axis doubling from the sixty-four-score result', () => {
  const cues = {
    'context-and-cost-four-token-pairs': directionCue('before'),
    'context-and-cost-sixteen-entries': directionCue('before'),
    'context-and-cost-doubling-pairs': directionCue('before'),
    'context-and-cost-eight-by-eight': directionCue('before'),
    'context-and-cost-sixty-four-entries': directionCue('before'),
  };
  let frame = directionFrame('context-and-cost', 0, cues);
  assert(
    !frame.labels.some((label) =>
      ['16 scores', '64 scores', '8 queries', '8 keys'].includes(label.text),
    ),
  );
  assert(!frame.labels.some((label) => label.text === String.raw`2n\times2n=4n^2`));

  cues['context-and-cost-four-token-pairs'] = directionCue('after');
  frame = directionFrame('context-and-cost', 0, cues);
  assert(frame.labels.some((label) => label.text === '4 queries'));
  assert(frame.labels.some((label) => label.text === '4 keys'));
  assert(
    !frame.labels.some((label) =>
      ['16 scores', '64 scores', '8 queries', '8 keys'].includes(label.text),
    ),
  );
  const firstGrid = frame.targets.find((target) => target.id === 'query-key-pairs');
  assert(
    firstGrid && firstGrid.width >= 380,
    'the initial four-by-four example should use the center of the canvas',
  );

  cues['context-and-cost-sixteen-entries'] = directionCue('after');
  frame = directionFrame('context-and-cost', 0, cues);
  assert(frame.labels.some((label) => label.text === '16 scores'));

  cues['context-and-cost-doubling-pairs'] = { ...directionCue('during'), progress: 0.55 };
  frame = directionFrame('context-and-cost', 1, cues);
  assert(frame.labels.some((label) => label.text === '16 scores'));
  assert(!frame.labels.some((label) => ['64 scores', '8 queries', '8 keys'].includes(label.text)));
  assert(!frame.labels.some((label) => label.text === String.raw`2n\times2n=4n^2`));

  cues['context-and-cost-doubling-pairs'] = directionCue('after');
  cues['context-and-cost-eight-by-eight'] = directionCue('after');
  frame = directionFrame('context-and-cost', 1, cues);
  assert(frame.labels.some((label) => label.text === '8 queries'));
  assert(frame.labels.some((label) => label.text === '8 keys'));
  assert(!frame.labels.some((label) => label.text === '64 scores'));

  cues['context-and-cost-sixty-four-entries'] = directionCue('after');
  frame = directionFrame('context-and-cost', 1, cues);
  assert(frame.labels.some((label) => label.text === '64 scores'));
  assert(frame.labels.some((label) => label.text === '8 queries'));
  assert(frame.labels.some((label) => label.text === '8 keys'));
  assert(frame.labels.some((label) => label.text === String.raw`2n\times2n=4n^2`));
  const expanded = frame.targets.find((target) => target.id === 'query-key-pairs');
  assert(
    expanded && expanded.width >= 1100 && expanded.height >= 630,
    'the final scene should show the compact sixteen-score grid beside the expanded grid',
  );
});

test('parallel head matrices stay separate and their identified outputs fit below the panels', () => {
  const projectionCues = Object.fromEntries(
    [
      'parallel-heads-shared-head-input-0-b1-1',
      'parallel-heads-projections',
      'parallel-heads-query-head-1',
      'parallel-heads-query-head-2',
    ].map((id) => [id, directionCue('after')]),
  );
  const firstPass = directionFrame('parallel-heads', 0, projectionCues);
  for (const h of [0, 1]) {
    const q = firstPass.targets.find((target) => target.id === `head-query-matrix-${h}`);
    const k = firstPass.targets.find((target) => target.id === `head-key-matrix-${h}`);
    assert(q && k);
    assert(q.x + q.width < k.x, `head ${h + 1} query/key matrices must not overlap`);
    assert(firstPass.targets.some((target) => target.id === `head-query-result-${h}`));
  }

  const mergeCues = Object.fromEntries(
    ['parallel-heads-head-source-shares-0-b2-1', 'heads-value-output'].map((id) => [
      id,
      directionCue('after'),
    ]),
  );
  const merged = directionFrame('parallel-heads', 2, mergeCues);
  const panels = merged.shapes.filter(
    (shape) => shape.kind === 'rect' && shape.width === 490 && shape.height === 565,
  );
  const concat = merged.targets.find((target) => target.id === 'concatenated-head-outputs');
  assert.equal(panels.length, 2);
  assert(concat);
  assert(concat.y >= Math.max(...panels.map((panel) => panel.y + panel.height)));
  assert(concat.y + concat.height < 1080);
  const outputs = headResults()
    .map((head) => head.output[2])
    .flat()
    .map((value) => value.toFixed(2));
  assert(merged.labels.some((label) => label.text === `concat [${outputs.join(', ')}]`));
});

test('parallel-head targets are fully readable from the measured spoken cue onset', async () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const lesson = await readLesson(resolve(root, 'videos/lessons/attention.lesson.yaml'), root);
  const scene = lesson.scenes.find((item) => item.id === 'parallel-heads');
  const sounds = scene.beats.map((beat, beatIndex) => {
    const words = lexicalTokens(beat.say).map((text, index) => ({
      text,
      start: index * 0.1,
      end: index * 0.1 + 0.08,
    }));
    return { beatIndex, words, duration: words.length * 0.1 + 0.5 };
  });
  const timing = makeSceneTimeline(
    scene,
    sounds.map((sound) => sound.duration),
  );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing, sounds);
  timing.cueTiming = 'provider-words';

  const cueTargets = new Map([
    [
      'parallel-heads-projections',
      ['head-query-matrix-0', 'head-key-matrix-0', 'head-query-matrix-1', 'head-key-matrix-1'],
    ],
    ['parallel-heads-query-head-1', ['head-query-result-0']],
    ['parallel-heads-query-head-2', ['head-query-result-1']],
  ]);
  const beat = scene.beats[0];
  const sourceWords = lexicalTokens(beat.say);
  const render = (time) => {
    const state = frameState(timing, time, 0, 1);
    const canvas = createCanvas(1920, 1080);
    const frame = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
    return { frame, state };
  };

  for (const [cueId, targetIds] of cueTargets) {
    const cue = timing.visualCues.find((item) => item.id === cueId);
    assert(cue, `${cueId} must resolve against the spoken phrase`);
    const phrase = lexicalTokens(cue.phrase);
    const firstWord = sourceWords.findIndex((word, index) =>
      phrase.every((token, offset) => sourceWords[index + offset] === token),
    );
    assert(firstWord >= 0, `${cueId} phrase must occur in the narration`);
    assert.equal(
      cue.start,
      timing.beats[0].start + firstWord * 0.1,
      `${cueId} begins with the first measured word of its phrase`,
    );

    const before = render(cue.start - 1 / 30);
    assert.equal(before.state.cues[cueId].phase, 'before');
    for (const targetId of targetIds) {
      assert(
        !before.frame.targets.some((target) => target.id === targetId && target.alpha > 0),
        `${targetId} stays hidden before its spoken phrase`,
      );
    }

    for (const time of [cue.start + 1 / 30, (cue.start + cue.end) / 2]) {
      const { frame, state } = render(time);
      assert.equal(state.cues[cueId].phase, 'during');
      assert(state.cues[cueId].active, `${cueId} is active while the phrase is spoken`);
      for (const targetId of targetIds) {
        const target = frame.targets.find((item) => item.id === targetId);
        assert(
          target && target.alpha >= 0.98 && target.marks > 0,
          `${targetId} must be fully painted from the spoken callout onset`,
        );
      }
    }
  }
});

test('the output projection distinguishes its partial accumulator from the completed coordinate', () => {
  const cues = { 'combine-heads-construction-0': { ...directionCue('during'), progress: 0.7 } };
  const partial = directionFrame('combine-heads', 0, cues);
  assert(partial.labels.some((l) => /^Running coordinate 1: 0\.38$/.test(l.text)));
  assert(!partial.labels.some((l) => /^Completed coordinate/.test(l.text)));
  cues['combine-heads-construction-0'] = directionCue('after');
  const held = directionFrame('combine-heads', 0, cues);
  assert(held.labels.some((l) => l.text === 'Completed coordinate 1: 0.47'));
  assert(!held.labels.some((l) => /^Running coordinate/.test(l.text)));
});

test('the dot-product prediction keeps each answer until its spoken result clause', () => {
  const cues = {
    'dot-score-birds': directionCue('before'),
    'dot-score-sing': directionCue('before'),
  };
  assert(
    !directionFrame('dot-geometry', 0, cues).labels.some((l) => ['0.60', '1.05'].includes(l.text)),
  );
  const before = directionFrame('dot-geometry', 2, cues);
  assert(!before.labels.some((l) => ['0.60', '1.05'].includes(l.text)));
  cues['dot-score-birds'] = directionCue('after');
  const first = directionFrame('dot-geometry', 2, cues);
  assert(first.labels.some((l) => l.text === '0.60'));
  assert(!first.labels.some((l) => l.text === '1.05'));
  cues['dot-score-sing'] = directionCue('after');
  assert(directionFrame('dot-geometry', 2, cues).labels.some((l) => l.text === '1.05'));
});

test('the actual mask trace blocks the logit, then evaluates its exponential, then normalizes', () => {
  const cues = Object.fromEntries(
    ['mask-block-score', 'mask-zero-exp', 'causal-mask-causal-weights-b2-1'].map((id) => [
      id,
      directionCue('before'),
    ]),
  );
  const before = directionFrame('causal-mask', 1, cues);
  assert(!before.labels.some((l) => l.text === '−∞'));
  assert(!before.targets.some((t) => t.id === 'causal-weights'));
  cues['mask-block-score'] = directionCue('after');
  const blocked = directionFrame('causal-mask', 1, cues);
  assert(blocked.labels.some((l) => l.text === '−∞'));
  assert(!blocked.labels.some((l) => l.x > 1000 && l.y > 500 && l.text === '0.00'));
  cues['mask-zero-exp'] = directionCue('after');
  const zero = directionFrame('causal-mask', 1, cues);
  assert(zero.labels.some((l) => l.x > 1000 && l.y > 500 && l.text === '0.00'));
  assert(!zero.targets.some((t) => t.id === 'causal-weights'));
  cues['causal-mask-causal-weights-b2-1'] = directionCue('after');
  const normalized = directionFrame('causal-mask', 1, cues);
  assert(
    normalized.targets.some(
      (t) => t.id === 'causal-weights' && t.alpha === 1 && t.markCounts.labels > 0,
    ),
  );
  const row = normalized.labels.filter((l) => l.x > 1100 && l.y > 820 && l.y < 960);
  assert(row.some((l) => l.text === '1.00'));
  assert(row.some((l) => l.text === '0.00'));
  assert(normalized.labels.some((l) => l.text === 'Birds query: Birds 100% · sing 0%'));
  assert(!normalized.labels.some((l) => l.text.startsWith('sing keeps')));
});

test('identical-value construction waits for its clause and stays fixed while the controls move', () => {
  const cues = {
    'routing-equal-values': directionCue('before'),
    'routing-change-controls': directionCue('before'),
  };
  const before = directionFrame('learning-to-route', 1, cues);
  assert(before.labels.some((l) => l.text === 'Birds value [2.00, 1.00]'));
  assert(!before.labels.some((l) => l.text === '[1.50, 1.50]'));
  cues['routing-equal-values'] = directionCue('after');
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    cues['routing-change-controls'] = { ...directionCue('during'), progress };
    const frame = directionFrame('learning-to-route', 1, cues);
    assert(frame.labels.some((l) => l.text === '[1.50, 1.50]'));
    const point = frame.connectors.findLast(
      (c) =>
        c.kind === 'arrow' &&
        Math.hypot(c.to.x - (240 + 1.5 * 225), c.to.y - (840 - 1.5 * 225)) < 1e-8,
    );
    assert(point, 'the mathematical endpoint stays fixed while routing weights change');
  }
});

test('approaching and equal source values leave the actual mixture triangle clear of stacked discs', () => {
  for (const equal of [0.85, 0.95, 0.99, 1])
    for (const controls of [0, 0.25, 0.5, 0.75, 1]) {
      const cues = {
        'routing-equal-values': { ...directionCue('during'), progress: equal },
        'routing-change-controls': { ...directionCue('during'), progress: controls },
      };
      const model = learningRouteSnapshot(1, 0.95, cues),
        endpoint = {
          x: 240 + 225 * model.output[0],
          y: 840 - 225 * model.output[1],
        };
      const canvas = createCanvas(1920, 1080),
        frame = drawFrame(
          canvas.getContext('2d'),
          {},
          { id: 'learning-to-route', title: 'Learning to route' },
          { beat: 1, beatP: 0.95, t: 20, duration: 35, opacity: 1, cues },
          draw,
        );
      assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
      const arrow = frame.connectors.findLast(
        (c) => c.kind === 'arrow' && Math.hypot(c.to.x - endpoint.x, c.to.y - endpoint.y) < 1e-8,
      );
      assert(arrow, 'the exact computed mixture remains the weighted arrow endpoint');
      assert.equal(arrow.head.length, 3);
      const stacked = frame.shapes.filter(
        (s) =>
          s.kind === 'circle' &&
          s.fillAlpha >= 0.25 &&
          Math.hypot(s.center.x - endpoint.x, s.center.y - endpoint.y) < s.width / 2 + 16,
      );
      assert.deepEqual(
        stacked,
        [],
        'source/output discs must stay clear of the whole triangle, regardless of paint order',
      );
      for (const [i, name] of ['Birds', 'sing'].entries()) {
        const source = { x: 240 + 225 * model.values[i][0], y: 840 - 225 * model.values[i][1] };
        const reference = frame.labels.find((l) => l.text === name && l.fontSize === 24);
        assert(reference?.alpha >= 0.25, 'both named source references remain visibly present');
        assert(
          frame.connectors.some(
            (c) =>
              c.kind === 'line' &&
              Math.hypot(c.from.x - source.x, c.from.y - source.y) < 1e-8 &&
              Math.hypot(c.to.x - source.x, c.to.y - source.y) >= 30,
          ),
          'each source reference connects to its true mathematical coordinate',
        );
      }
      const a = arrow.head[0],
        b = arrow.head[1],
        c = arrow.head[2];
      const pixel = canvas
        .getContext('2d')
        .getImageData(
          Math.round((a.x + b.x + c.x) / 3),
          Math.round((a.y + b.y + c.y) / 3),
          1,
          1,
        ).data;
      assert(
        pixel[1] > 100 && pixel[2] > pixel[0] + 30,
        'the triangle itself retains actual cyan paint',
      );
    }
});

test('the active output cue highlights its reference without painting over the triangle interior', () => {
  const cues = Object.fromEntries(
    [
      ['routing-raise-score', 0.9819121447028423],
      ['learning-to-route-contextual-mixture-point-b1-1', 0.9661835748792269],
    ].map(([id, progress]) => [
      id,
      {
        id,
        phase: 'during',
        progress,
        reveal: 1,
        active: true,
        strength: 1,
        color: 'yellow',
        targets:
          id === 'routing-raise-score'
            ? ['source-weight-ribbon', 'contextual-mixture-point']
            : ['contextual-mixture-point'],
      },
    ]),
  );
  const canvas = createCanvas(1920, 1080),
    frame = drawFrame(
      canvas.getContext('2d'),
      {},
      { id: 'learning-to-route', title: 'Learning to route' },
      { beat: 0, beatP: 0.3283082077051926, t: 110 / 30, duration: 1046 / 30, opacity: 1, cues },
      draw,
    );
  const model = learningRouteSnapshot(0, 0.3283082077051926, cues);
  const arrow = frame.connectors.findLast(
    (c) =>
      c.kind === 'arrow' &&
      Math.hypot(c.to.x - (240 + 225 * model.output[0]), c.to.y - (840 - 225 * model.output[1])) <
        1e-8,
  );
  assert(arrow);
  for (const weights of [
    [1 / 3, 1 / 3, 1 / 3],
    [0.2, 0.4, 0.4],
    [0.5, 0.25, 0.25],
  ]) {
    const point = arrow.head.reduce(
      (p, v, i) => ({ x: p.x + weights[i] * v.x, y: p.y + weights[i] * v.y }),
      { x: 0, y: 0 },
    );
    const pixel = canvas
      .getContext('2d')
      .getImageData(Math.round(point.x), Math.round(point.y), 1, 1).data;
    assert(
      pixel[1] > pixel[0] + 20 && pixel[2] > pixel[0] + 30,
      'the active focus frame must leave cyan paint across the actual triangle interior',
    );
  }
});
