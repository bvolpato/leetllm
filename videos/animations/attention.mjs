import assert from 'node:assert/strict';
import { smoothstep } from 'vizmatic';

export const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
export function softmax(scores) {
  const m = Math.max(...scores),
    exps = scores.map((s) => Math.exp(s - m));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / total);
}
export const project = (rows, matrix) =>
  rows.map((row) =>
    matrix[0].map((_, j) =>
      dot(
        row,
        matrix.map((r) => r[j]),
      ),
    ),
  );
export function attention(Q, K, V, causal = false) {
  const scores = Q.map((q) => K.map((k) => dot(q, k)));
  const logits = scores.map((row, i) =>
    row.map((s, j) => (causal && j > i ? -Infinity : s / Math.sqrt(Q[0].length))),
  );
  const weights = logits.map(softmax);
  const output = weights.map((row) =>
    V[0].map((_, d) =>
      dot(
        row,
        V.map((v) => v[d]),
      ),
    ),
  );
  return { scores, logits, weights, output };
}
export const EXAMPLE = Object.freeze({
  Q: [
    [1, 0.5],
    [0.5, 1],
  ],
  K: [
    [0.8, 0.2],
    [0.3, 0.9],
  ],
  V: [
    [2, 1],
    [1, 2],
  ],
});
export const OUTPUT_MATRIX = [
  [0.4, 0.1],
  [-0.1, 0.5],
  [0.3, -0.2],
  [0.2, 0.4],
];
export const PROJECTION_CUE_IDS = [
  ['three-projections-row-q-birds', 'three-projections-row-q-sing'],
  ['three-projections-row-k-birds', 'three-projections-row-k-sing'],
  ['three-projections-row-v-birds', 'three-projections-row-v-sing'],
];
const clamp01 = (value) => Math.max(0, Math.min(1, value));
export function linearConstruction(input, weights, progress) {
  const terms = input.length * weights[0].length * weights.length;
  const clock = Math.max(0, Math.min(1, progress)) * terms;
  const output = input.map((row, i) =>
    weights[0].map((_, j) =>
      row.reduce((sum, value, k) => {
        const index = (i * weights[0].length + j) * weights.length + k;
        return sum + value * weights[k][j] * Math.max(0, Math.min(1, clock - index));
      }, 0),
    ),
  );
  const index = Math.min(terms - 1, Math.max(0, Math.ceil(clock) - 1));
  return {
    output,
    row: Math.floor(index / (weights[0].length * weights.length)),
    column: Math.floor(index / weights.length) % weights[0].length,
    inner: index % weights.length,
    termProgress: Math.max(0, Math.min(1, clock - index)),
    complete: clock === terms,
  };
}
export function projectionConstruction(beat, progress) {
  const name = ['Q', 'K', 'V'][beat],
    weights = EXAMPLE[name];
  const amount = smoothstep(clamp01(progress));
  return {
    name,
    weights,
    progress: amount,
    ...linearConstruction(
      [
        [1, 0],
        [0, 1],
      ],
      weights,
      amount,
    ),
  };
}
export function projectionProgressFromCues(beat, fallback, cues) {
  const [firstId, secondId] = PROJECTION_CUE_IDS[beat];
  const first = cues?.[firstId],
    second = cues?.[secondId];
  if (second && second.phase !== 'before') return 0.5 + 0.5 * clamp01(second.progress ?? 0);
  if (first) return 0.5 * clamp01(first.progress ?? (first.phase === 'after' ? 1 : 0));
  return clamp01(fallback);
}
export function projectionConstructionFromCues(beat, fallback, cues) {
  const [firstId, secondId] = PROJECTION_CUE_IDS[beat];
  const current = projectionConstruction(beat, projectionProgressFromCues(beat, fallback, cues));
  const first = cues?.[firstId],
    second = cues?.[secondId];
  if (first?.phase === 'after' && (!second || second.phase === 'before')) {
    return { ...current, row: 0, column: 1, inner: 1, termProgress: 1, coordinateComplete: true };
  }
  return current;
}
export function transferRead() {
  const input = [1, 3],
    query = project([input], EXAMPLE.Q)[0];
  return { input, query, ...attention([query], EXAMPLE.K, EXAMPLE.V) };
}
export function weightedReadState(weights, values, firstProgress, secondProgress) {
  const progress = [firstProgress, secondProgress].map((value) => Math.max(0, Math.min(1, value)));
  const contributions = values.map((vector, i) => vector.map((value) => value * weights[i]));
  return {
    contributions,
    partial: values[0].map((_, d) =>
      contributions.reduce((sum, vector, i) => sum + vector[d] * progress[i], 0),
    ),
    complete: progress.every((value) => value === 1),
  };
}
export const HEAD_INPUT = [
  [1, 0],
  [0, 1],
  [1, 1],
];
export const HEAD_MATRICES = [
  {
    Q: [
      [1, 0],
      [0, 1],
    ],
    K: [
      [1, 0.2],
      [0.1, 1],
    ],
    V: [
      [2, 0],
      [0, 1],
    ],
  },
  {
    Q: [
      [0.2, 1],
      [1, -0.4],
    ],
    K: [
      [1, -0.4],
      [0.2, 0.8],
    ],
    V: [
      [0.5, 1],
      [1, -0.5],
    ],
  },
];
export function headResults() {
  return HEAD_MATRICES.map((m) => {
    const Q = project(HEAD_INPUT, m.Q),
      K = project(HEAD_INPUT, m.K),
      V = project(HEAD_INPUT, m.V);
    return { Q, K, V, ...attention(Q, K, V) };
  });
}
const fixed = (n) => (Math.abs(n) < 0.0005 ? '0.00' : n.toFixed(2));
const vectorString = (v) => `[${v.map(fixed).join(', ')}]`;

const INTRO_WORDS = ['Birds', 'in', 'the', 'garden', 'sing', 'softly', 'at', 'dawn.'];
export function introTokenSnapshot(beat, progress, cues) {
  const measured = INTRO_WORDS.some((_, i) => cues?.['intro-word-' + i]);
  const count =
    beat > 0
      ? INTRO_WORDS.length
      : measured
        ? INTRO_WORDS.filter(
            (_, i) => cues['intro-word-' + i]?.phase !== 'before' && cues['intro-word-' + i],
          ).length
        : Math.max(0, Math.min(8, Math.floor(((progress - 0.08) / 0.36) * 8)));
  return { count, words: INTRO_WORDS.slice(0, count) };
}

export function scoreScaleSnapshot(beat, progress) {
  const width = beat === 0 ? 4 : beat === 1 ? Math.round(4 + 60 * smoothstep(progress)) : 64;
  const divisor = beat < 2 ? 1 : 1 + 7 * smoothstep(progress);
  return { width, divisor, sigma: Math.sqrt(width) / divisor };
}

export function learningRouteSnapshot(beat, progress, cues) {
  const p = Math.max(0, Math.min(1, progress));
  const phase = (start, end) => smoothstep((p - start) / (end - start));
  const result = attention(EXAMPLE.Q, EXAMPLE.K, EXAMPLE.V);
  const cueProgress = (id, fallback) => cues?.[id]?.progress ?? fallback;
  const scoreShift =
    beat === 0
      ? 2.6 * cueProgress('routing-raise-score', phase(0.08, 0.88))
      : 2.6 *
        (beat > 1
          ? 1
          : Math.cos(cueProgress('routing-change-controls', phase(0.38, 0.95)) * Math.PI * 2));
  const weights = softmax([result.logits[1][0] + scoreShift, result.logits[1][1]]);
  const equal =
    beat < 1 ? 0 : beat > 1 ? 1 : cueProgress('routing-equal-values', phase(0.04, 0.34));
  const values = EXAMPLE.V.map((value) =>
    value.map((coordinate) => coordinate + (1.5 - coordinate) * equal),
  );
  const output = [0, 1].map((d) =>
    dot(
      weights,
      values.map((value) => value[d]),
    ),
  );
  const identical = values[0].every((coordinate, d) => coordinate === values[1][d]);
  const caption =
    beat < 1
      ? 'Move the shares. Follow the mixture.'
      : identical
        ? 'Identical values: every routing choice gives the same output'
        : 'Equalizing source values: the mixture still follows the weights';
  return { weights, values, output, equal, identical, caption };
}

export function validateModel() {
  for (const name of ['Q', 'K', 'V'])
    assert.deepEqual(
      linearConstruction(
        [
          [1, 0],
          [0, 1],
        ],
        EXAMPLE[name],
        1,
      ).output,
      EXAMPLE[name],
    );
  assert.deepEqual(
    linearConstruction(
      [[2, -1]],
      [
        [3, 1],
        [4, -2],
      ],
      0.25,
    ).output,
    [[6, 0]],
  );
  assert.deepEqual(
    linearConstruction(
      [[2, -1]],
      [
        [3, 1],
        [4, -2],
      ],
      0.5,
    ).output,
    [[2, 0]],
  );
  assert.deepEqual(
    linearConstruction(
      [[2, -1]],
      [
        [3, 1],
        [4, -2],
      ],
      1,
    ).output,
    [[2, 4]],
  );
  assert.deepEqual(transferRead().query, [2.5, 3.5]);
  assert(transferRead().weights[0][1] > 0.7 && transferRead().weights[0][1] < 0.71);
  const result = attention(EXAMPLE.Q, EXAMPLE.K, EXAMPLE.V);
  const weights = result.weights[1],
    first = weightedReadState(weights, EXAMPLE.V, 1, 0),
    half = weightedReadState(weights, EXAMPLE.V, 1, 0.5);
  assert.deepEqual(weightedReadState(weights, EXAMPLE.V, 0, 0).partial, [0, 0]);
  assert.deepEqual(
    first.partial,
    EXAMPLE.V[0].map((value) => value * weights[0]),
  );
  assert.equal(first.complete, false);
  assert.deepEqual(
    half.partial,
    first.partial.map((value, d) => value + 0.5 * weights[1] * EXAMPLE.V[1][d]),
  );
  assert.deepEqual(weightedReadState(weights, EXAMPLE.V, 1, 1).partial, result.output[1]);
  assert(Math.abs(result.scores[1][0] - 0.6) < 1e-12);
  assert(Math.abs(result.scores[1][1] - 1.05) < 1e-12);
  for (const weights of result.weights)
    assert(Math.abs(weights.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  const causal = attention(EXAMPLE.Q, EXAMPLE.K, EXAMPLE.V, true);
  assert.deepEqual(causal.weights[0], [1, 0]);
  assert.deepEqual(causal.output[1], result.output[1]);
  for (const share of [0, 0.2, 0.7, 1]) {
    const mixture = [0, 1].map((d) => share * EXAMPLE.V[0][d] + (1 - share) * EXAMPLE.V[1][d]);
    assert(mixture.every((v) => v >= 1 && v <= 2));
    assert(Math.abs(share * 1.5 + (1 - share) * 1.5 - 1.5) < 1e-12);
  }
  assert.notDeepEqual(headResults()[0].weights, headResults()[1].weights);
  assert.deepEqual(
    introTokenSnapshot(
      0,
      1,
      Object.fromEntries(
        INTRO_WORDS.map((_, i) => ['intro-word-' + i, { phase: i < 5 ? 'after' : 'before' }]),
      ),
    ).words,
    INTRO_WORDS.slice(0, 5),
  );
  assert.deepEqual(introTokenSnapshot(1, 0).words, INTRO_WORDS);
  assert.deepEqual(scoreScaleSnapshot(1, 1), scoreScaleSnapshot(2, 0));
  assert.equal(scoreScaleSnapshot(2, 1).sigma, 1);
  const earlyRoute = learningRouteSnapshot(1, 0.12);
  assert.equal(earlyRoute.identical, false);
  assert.notDeepEqual(earlyRoute.values[0], earlyRoute.values[1]);
  assert.match(earlyRoute.caption, /^Equalizing/);
  assert.notEqual(earlyRoute.output[0], 1.5);
  for (const p of [0.34, 0.5, 0.7, 0.95, 1]) {
    const current = learningRouteSnapshot(1, p);
    assert.equal(current.identical, true);
    assert.deepEqual(current.values, [
      [1.5, 1.5],
      [1.5, 1.5],
    ]);
    assert(current.output.every((coordinate) => Math.abs(coordinate - 1.5) < 1e-12));
    assert.match(current.caption, /^Identical/);
  }
  assert.notDeepEqual(learningRouteSnapshot(1, 0.5).weights, learningRouteSnapshot(1, 0.7).weights);
  assert.deepEqual(learningRouteSnapshot(2, 0).output, learningRouteSnapshot(2, 1).output);
  return true;
}

export function draw(ctx, scene, state, api) {
  const { C, text, math, rect, circle, line, arrow, path, trace, clamp, phase, lerp } = api;
  const beat = state.beat ?? 0,
    p = clamp(state.beatP ?? 0);
  const progress = (step, from = 0.04, until = 0.88) =>
    beat > step ? 1 : beat < step ? 0 : phase(p, from, until);
  const narrated = (id, fallback) =>
    state.cues?.[id] ? api.focus.progress(id, fallback) : fallback;
  const started = (id, fallback) =>
    state.cues?.[id] ? state.cues[id].phase !== 'before' : fallback;
  const T = (s, x, y, size = 32, color = C.ink, align = 'left') =>
    text(ctx, s, x, y, size, color, align);
  const M = (s, x, y, size = 40, color = C.ink, align = 'left') =>
    math(ctx, s, x, y, size, color, align);
  const fade = (amount, draw) => api.components.fade(clamp(amount), draw);
  const calloutTarget = (id, fallback, draw) => {
    if (state.cues?.[id]) {
      if (started(id, false)) draw();
    } else fade(fallback, draw);
  };
  const tokenColors = [C.blue, C.cyan, C.pink];
  const card = (s, x, y, w = 250, h = 90, color = C.blue, font = 34) => {
    return api.components.card({
      label: s,
      x: x - w / 2,
      y: y - h / 2,
      width: w,
      height: h,
      fill: C.panel,
      stroke: color,
      radius: 16,
      padding: 12,
      id: s,
      fontSize: font,
      font: 'sans',
      textColor: color,
      baselineOffset: font * 0.32,
    });
  };
  const vecCard = (v, x, y, color, label) => {
    if (label) T(label, x, y - 65, 30, color, 'center');
    return card(vectorString(v), x, y, 285, 84, color, 30);
  };
  const movingDot = (route, amount, color, radius = 9) => {
    return api.components.particle({ points: route, progress: amount, radius, fill: color });
  };
  const movingDotBeforeTip = (route, amount, color, radius = 9) => {
    const distance = Math.hypot(route[1].x - route[0].x, route[1].y - route[0].y);
    const safeProgress = Math.max(0, 1 - (radius + 14) / distance);
    const progress = clamp(amount),
      particleProgress = Math.min(progress, safeProgress);
    const opacity = progress <= safeProgress ? 1 : clamp((1 - progress) / (1 - safeProgress));
    fade(opacity, () =>
      api.components.particle({ points: route, progress: particleProgress, radius, fill: color }),
    );
  };
  const curve = (points, amount, color, width = 4) => {
    trace(ctx, points, amount, color, width);
  };
  const ribbon = (weights, x, y, w = 1100, h = 70, colors = tokenColors) => {
    let left = x;
    weights.forEach((weight, i) => {
      if (weight > 0) rect(ctx, left, y, weight * w, h, colors[i], undefined, 0);
      const center = left + (weight * w) / 2;
      if (weight > 0.075)
        T(`${Math.round(weight * 100)}%`, center, y + h + 46, 31, colors[i], 'center');
      left += weight * w;
    });
  };
  const plane = ({ x = 240, y = 815, scale = 280, right = 900, top = 310 } = {}) => {
    arrow(ctx, x, y, right, y, C.muted, 2);
    arrow(ctx, x, y, x, top, C.muted, 2);
    M('1', x + scale, y + 47, 28, C.muted, 'center');
    M('1', x - 40, y - scale + 8, 28, C.muted, 'center');
    return (v) => ({ x: x + v[0] * scale, y: y - v[1] * scale });
  };
  const arrowVector = (origin, tip, color, amount = 1, width = 5) => {
    const end = { x: lerp(origin.x, tip.x, amount), y: lerp(origin.y, tip.y, amount) };
    if (Math.hypot(end.x - origin.x, end.y - origin.y) > 2)
      arrow(ctx, origin.x, origin.y, end.x, end.y, color, width);
  };
  const result = attention(EXAMPLE.Q, EXAMPLE.K, EXAMPLE.V);
  const matrix = (
    rows,
    x,
    y,
    color,
    reveal = 1,
    size = 112,
    label,
    labelSize = 40,
    cellFontSize = 28,
  ) => {
    if (label) M(label, x + (rows[0].length * size) / 2, y - 34, labelSize, color, 'center');
    const total = rows.length * rows[0].length;
    api.components.matrix({
      values: rows,
      x,
      y,
      cellSize: size,
      gap: 8,
      format: (value) => (value === -Infinity ? '−∞' : fixed(value)),
      style: {
        fill: C.panel,
        stroke: color,
        radius: 9,
        padding: 9,
        fontSize: cellFontSize,
        font: 'sans',
        textColor: color,
        baselineOffset: 12,
      },
      cellStyle: (_value, row, column) => ({
        opacity: phase(reveal * total - row * rows[0].length - column, 0, 0.7),
      }),
    });
  };

  if (scene.id === 'subject-intro') {
    const current = introTokenSnapshot(beat, p, state.cues);
    const xs = [185, 390, 595, 800, 1005, 1210, 1415, 1620];
    const route = Array.from({ length: 70 }, (_, i) => {
      const t = i / 69;
      return { x: lerp(1005, 185, t), y: 542.5 - Math.sin(t * Math.PI) * 205 };
    });
    const gardenRoute = Array.from({ length: 48 }, (_, i) => {
      const t = i / 47;
      return { x: lerp(1005, 800, t), y: 542.5 - Math.sin(t * Math.PI) * 45 };
    });
    const routeProgress = beat > 0 ? 1 : narrated('intro-verb-context', progress(0, 0.18, 0.72));
    if (routeProgress > 0) {
      curve(route, routeProgress, C.yellow, 5);
      movingDot([...route].reverse(), routeProgress, C.yellow, 13);
    }
    const sourceProgress = beat > 0 ? narrated('intro-read', phase(p, 0.04, 0.65)) : 0;
    if (sourceProgress > 0) {
      curve(gardenRoute, sourceProgress, C.cyan, 4);
      movingDot([...gardenRoute].reverse(), sourceProgress, C.cyan, 11);
    }
    xs.forEach((x, i) => {
      if (i >= current.count) card(`position ${i + 1}`, x, 590, 180, 95, C.muted, 23);
    });
    current.words.forEach((word, i) =>
      api.focus.target('context-token-' + i, () =>
        card(word, xs[i], 590, 180, 95, i === 0 ? C.blue : i === 4 ? C.yellow : C.muted, 30),
      ),
    );
    if (routeProgress > 0)
      api.focus.target('subject-action-labels', () => {
        T('subject', xs[0], 735, 25, C.blue, 'center');
        T('action', xs[4], 735, 25, C.yellow, 'center');
      });
    if (beat === 1) {
      const predictionProgress = narrated('intro-prediction', phase(p, 0.48, 0.9));
      if (predictionProgress > 0)
        fade(predictionProgress, () =>
          api.focus.target('intro-prediction', () => {
            card('one source', 650, 850, 280, 92, C.blue, 29);
            card('several sources', 1270, 850, 330, 92, C.cyan, 29);
            line(ctx, 790, 850, 900, 850, C.muted, 3);
            line(ctx, 1020, 850, 1105, 850, C.muted, 3);
            T('?', 960, 868, 62, C.yellow, 'center');
            T('Copy one value, or blend several?', 960, 1000, 38, C.ink, 'center');
          }),
        );
    }
  } else if (scene.id === 'token-vectors') {
    ['Birds', 'sing'].forEach((word, i) => {
      const y = 430 + i * 260;
      const a = card(word, 310, y, 250, 96, tokenColors[i]);
      fade(progress(0), () => {
        const b = api.focus.target('token-state-' + i, () =>
          vecCard(i ? [0, 1] : [1, 0], 930, y, tokenColors[i]),
        );
        const route = api.connect(ctx, a, b, { color: tokenColors[i], gap: 14 });
        movingDotBeforeTip([route.from, route.to], progress(0), tokenColors[i]);
      });
    });
    fade(progress(1), () => T('two coordinates per state', 930, 875, 32, C.muted, 'center'));
    api.focus.reveal('token-vectors-stacked-token-states-b3-1', () => {
      M('X=', 1310, 580, 48, C.ink);
      api.focus.target('stacked-token-states', () =>
        matrix(
          [
            [1, 0],
            [0, 1],
          ],
          1420,
          420,
          C.ink,
          1,
        ),
      );
    });
    T('Toy states chosen for a transparent calculation', 960, 980, 30, C.muted, 'center');
  } else if (scene.id === 'three-projections') {
    const cueIds = PROJECTION_CUE_IDS[beat];
    const current = projectionConstructionFromCues(beat, p, state.cues),
      color = [C.yellow, C.pink, C.green][beat];
    const input = [
        [1, 0],
        [0, 1],
      ],
      row = input[current.row],
      column = current.weights.map((r) => r[current.column]);
    const firstCue = state.cues?.[cueIds[0]],
      secondCue = state.cues?.[cueIds[1]];
    const operationStarted = state.cues
      ? [firstCue, secondCue].some((cue) => cue && cue.phase !== 'before')
      : p > 0.04;
    const rowChange = smoothstep(clamp((current.progress - 0.5) / 0.1));
    const focusY = 415 + 138 * rowChange;
    const zoom = 1 + 0.08 * Math.sin(Math.PI * current.progress);
    const selectedCell = (x, y, width, height, stroke) =>
      rect(ctx, x, y, width, height, 'transparent', stroke, 5, 7);
    T('same input states', 330, 210, 32, C.blue, 'center');
    T('one learned transform', 960, 210, 32, color, 'center');
    T('projected states', 1500, 210, 30, color, 'center');
    ctx.save();
    ctx.translate(350, 540);
    ctx.scale(1.02, zoom);
    ctx.translate(-350, -focusY);
    api.focus.target('projection-input', () => matrix(input, 190, 350, C.blue, 1, 130, 'X'));
    ['Birds', 'sing'].forEach((name, i) =>
      T(name, 110, 412 + i * 138, 29, tokenColors[i], 'right'),
    );
    if (operationStarted) {
      selectedCell(190, 350 + current.row * 138, 272, 130, C.yellow);
      selectedCell(190 + current.inner * 138, 350 + current.row * 138, 130, 130, C.yellow);
    }
    api.focus.target('projection-weight-' + current.name.toLowerCase(), () =>
      matrix(current.weights, 790, 350, color, 1, 130, `W_${current.name}`),
    );
    if (operationStarted)
      selectedCell(790 + current.column * 138, 350 + current.inner * 138, 130, 130, C.yellow);
    M('×', 610, 490, 55, C.muted, 'center');
    M('=', 1200, 490, 55, C.muted, 'center');
    api.focus.target('projected-state-' + current.name.toLowerCase(), () =>
      matrix(current.output, 1380, 350, color, current.progress, 130, current.name),
    );
    if (operationStarted) {
      selectedCell(1380, 350 + current.row * 138, 272, 130, C.yellow);
      selectedCell(790 + current.column * 138, 350, 130, 272, C.yellow);
    }
    const inputEdge = { x: 462, y: 415 + current.row * 138 },
      weightLeft = { x: 780, y: inputEdge.y };
    const weightRight = { x: 1070, y: inputEdge.y },
      outputEdge = { x: 1380, y: inputEdge.y };
    arrow(ctx, inputEdge.x, inputEdge.y, weightLeft.x, weightLeft.y, color, 4);
    arrow(ctx, weightRight.x, weightRight.y, outputEdge.x, outputEdge.y, color, 4);
    if (!current.complete && !current.coordinateComplete && operationStarted) {
      if (current.termProgress <= 0.5)
        movingDot([inputEdge, weightLeft], Math.min(0.9, current.termProgress * 2), color, 11);
      else
        movingDot(
          [weightRight, outputEdge],
          Math.min(0.9, (current.termProgress - 0.5) * 2),
          color,
          11,
        );
    }
    ctx.restore();

    if (operationStarted) {
      T(
        current.name === 'Q'
          ? 'query · what to find'
          : current.name === 'K'
            ? 'key · what a source offers'
            : 'value · content a source carries',
        960,
        810,
        32,
        color,
        'center',
      );
      const products = row.map((value, k) => value * column[k]);
      T(`${current.name} output coordinate ${current.column}`, 960, 846, 27, C.muted, 'center');
      const terms = [0, 1].map((k) => {
        const computed =
          current.coordinateComplete ||
          current.complete ||
          k < current.inner ||
          (k === current.inner && current.termProgress >= 0.999);
        return `${fixed(row[k])} × ${fixed(column[k])}${computed ? ' = ' + fixed(products[k]) : ''}`;
      });
      const termX = [475, 1035];
      terms.forEach((value, k) => {
        const active = k === current.inner;
        card(value, termX[k], 925, 500, 92, active ? color : C.muted, 32);
      });
      T('+', 755, 935, 54, C.ink, 'center');
      T('=', 1325, 935, 42, C.ink, 'center');
      T(
        (current.coordinateComplete ? 'Computed value ' : 'Running sum ') +
          fixed(current.output[current.row][current.column]),
        1530,
        935,
        31,
        color,
        'center',
      );
      M(
        String.raw`x_{${current.row},:}W_{${current.name},:,${current.column}}`,
        960,
        1038,
        33,
        C.ink,
        'center',
      );
    }
  } else if (scene.id === 'dot-geometry') {
    const P = plane({ x: 280, y: 810, scale: 390, right: 940, top: 290 }),
      origin = P([0, 0]);
    const q = EXAMPLE.Q[1],
      keys = EXAMPLE.K;
    api.focus.target('attention-query-arrow', () => arrowVector(origin, P(q), C.yellow));
    T('query: sing', 625, 345, 32, C.yellow);
    keys.forEach((k, i) => {
      const amount = beat === 0 ? phase(p, 0.08 + i * 0.3, 0.37 + i * 0.3) : 1;
      api.focus.target('attention-key-' + i, () =>
        arrowVector(origin, P(k), tokenColors[i], amount),
      );
      fade(amount, () =>
        T(i ? 'key: sing' : 'key: Birds', i ? 330 : 650, i ? 420 : 790, 30, tokenColors[i]),
      );
    });
    const focus = beat < 2 ? 0 : 1;
    if (beat >= 1) {
      const k = keys[focus],
        factor = dot(q, k) / dot(q, q),
        projected = q.map((x) => x * factor);
      const end = P(projected),
        key = P(k);
      const route = [key, end];
      api.focus.target('query-projection-segment', () => curve(route, progress(1), C.muted, 3));
      circle(ctx, end.x, end.y, 9, tokenColors[focus]);
    }
    M(String.raw`q=\begin{bmatrix}0.5&1.0\end{bmatrix}`, 1120, 345, 37, C.yellow);
    api.focus.target('first-dot-products', () =>
      M(String.raw`q\cdot k_1=0.5(0.8)+1.0(0.2)`, 1080, 515, 34, C.blue),
    );
    if (beat === 2 && started('dot-score-birds', p > 0.15))
      api.focus.target('first-dot-score', () => T('0.60', 1420, 585, 52, C.blue, 'center'));
    api.focus.target('second-dot-products', () =>
      M(String.raw`q\cdot k_2=0.5(0.3)+1.0(0.9)`, 1080, 710, 34, C.cyan),
    );
    if (beat === 2 && started('dot-score-sing', p > 0.5))
      api.focus.target('second-dot-score', () => T('1.05', 1420, 780, 52, C.cyan, 'center'));
    M(String.raw`q\cdot k=\|q\|\,\|k\|\cos\theta`, 960, 960, 40, C.ink, 'center');
  } else if (scene.id === 'scale-the-scores') {
    const cue =
      beat === 1
        ? 'scale-the-scores-score-distribution-b2-1'
        : 'scale-the-scores-scaled-dot-rule-b3-1';
    const { width, sigma } = scoreScaleSnapshot(beat, narrated(cue, phase(p, 0.08, 0.85)));
    const X = (x) => 890 + x * 32,
      Y = (y) => 750 - y * 540;
    arrow(ctx, 235, 750, 1535, 750, C.muted, 2);
    for (const value of [-16, -8, 0, 8, 16]) T(String(value), X(value), 798, 28, C.muted, 'center');
    const pts = Array.from({ length: 201 }, (_, i) => {
      const x = -19 + (i * 38) / 200;
      return { x: X(x), y: Y(Math.exp((-x * x) / (2 * sigma * sigma)) / sigma) };
    });
    api.focus.target('score-distribution', () =>
      path(ctx, pts, { color: beat === 2 ? C.green : C.yellow, width: 5 }),
    );
    T('score spread', 1670, 760, 28, C.muted, 'center');
    M(String.raw`d_k`, 350, 345, 45, C.yellow);
    api.focus.target('head-width', () => T(String(Math.round(width)), 480, 345, 43, C.yellow));
    M(String.raw`\sigma`, 1210, 345, 45, C.cyan);
    api.focus.target('score-standard-deviation', () => T(sigma.toFixed(2), 1330, 345, 43, C.cyan));
    api.focus.target('score-variance-rule', () =>
      M(String.raw`\operatorname{Var}(q\cdot k)=d_k`, 960, 885, 42, C.ink, 'center'),
    );
    T(
      'Schematic normal curves illustrate the independent-coordinate variance model',
      960,
      965,
      27,
      C.muted,
      'center',
    );
    if (beat === 2)
      api.focus.target('scaled-dot-rule', () =>
        M(
          String.raw`\frac{q\cdot k}{\sqrt{64}}=\frac{q\cdot k}{8}`,
          1640,
          480,
          40,
          C.green,
          'center',
        ),
      );
    if (beat === 2 && started('scale-toy-rule', p > 0.65))
      api.focus.target('toy-scaled-dot-rule', () => {
        T('Our toy: two coordinates', 1640, 600, 26, C.cyan, 'center');
        M(String.raw`\frac{q\cdot k}{\sqrt{2}}`, 1640, 680, 40, C.cyan, 'center');
      });
  } else if (scene.id === 'softmax-mass') {
    const original = result.logits[1];
    const returnProgress = narrated('softmax-return', phase(p, 0.78, 0.96));
    let scores = [...original];
    if (beat === 1) scores[1] += 2.1 * narrated('softmax-raise-score', phase(p, 0.57, 0.88));
    if (beat === 2) {
      scores[1] += 2.1 * (1 - returnProgress);
      const shift = Math.max(...scores) * narrated('softmax-common-shift', phase(p, 0.08, 0.5));
      scores = scores.map((x) => x - shift);
    }
    const weights = softmax(scores);
    scores.forEach((s, i) => {
      const x = 560 + i * 800;
      T(i ? 'sing key' : 'Birds key', x, 330, 34, tokenColors[i], 'center');
      api.focus.target('key-score-' + i, () => T(fixed(s), x, 435, 53, tokenColors[i], 'center'));
      fade(progress(0), () => {
        M(String.raw`e^{z}`, x, 530, 38, C.muted, 'center');
        api.focus.target('key-exponential-' + i, () =>
          T(Math.exp(s).toFixed(3), x, 620, 43, tokenColors[i], 'center'),
        );
      });
    });
    fade(progress(0, 0.38, 0.87), () => {
      api.focus.target('attention-shares', () => ribbon(weights, 410, 740));
      M(String.raw`\sum_j a_j=1`, 960, 940, 40, C.ink, 'center');
    });
    api.focus.target('attention-softmax-rule', () =>
      M(String.raw`a_j=\frac{e^{z_j}}{\sum_r e^{z_r}}`, 960, 490, 46, C.ink, 'center'),
    );
    if (beat === 2)
      T(
        returnProgress >= 1
          ? 'Original shares restored'
          : started('softmax-return', p >= 0.78)
            ? 'Restoring the original shares'
            : 'Subtract one shared maximum: same shares',
        960,
        245,
        32,
        C.green,
        'center',
      );
  } else if (scene.id === 'value-mixture' || scene.id === 'learning-to-route') {
    const learning = scene.id === 'learning-to-route';
    const learned = learning ? learningRouteSnapshot(beat, p, state.cues) : null;
    let weights = learned?.weights ?? result.weights[1];
    if (!learning && beat === 1) {
      const shift =
        Math.sin(
          narrated('value-mixture-first-weighted-value-b2-1', phase(p, 0.56, 0.96)) * Math.PI * 2,
        ) * 0.22;
      weights = [weights[0] + shift, weights[1] - shift];
    }
    const V = learned?.values ?? EXAMPLE.V;
    const output =
      learned?.output ??
      [0, 1].map((d) =>
        dot(
          weights,
          V.map((v) => v[d]),
        ),
      );
    const P = plane({ x: 240, y: 840, scale: 225, right: 905, top: 280 }),
      origin = P([0, 0]);
    const a = P(V[0]),
      b = P(V[1]);
    const contributionA = V[0].map((x) => x * weights[0]);
    const firstProgress = learning
      ? 1
      : api.focus.progress('value-mixture-first-weighted-value-b1-1', progress(0));
    const secondProgress = learning
      ? 1
      : api.focus.progress('value-mixture-add-weighted-values', progress(0, 0.5, 0.68));
    const read = weightedReadState(weights, V, firstProgress, secondProgress),
      out = P(read.partial);
    path(ctx, [a, b], { color: C.muted, width: 3 });
    api.focus.target('routing-source-values', () => {
      if (learning) {
        line(ctx, a.x, a.y, a.x + 30, a.y + 20, C.blue, 1.5);
        line(ctx, b.x, b.y, b.x - 30, b.y - 20, C.cyan, 1.5);
        T('Birds', a.x + 40, a.y + 30, 24, C.blue);
        T('sing', b.x - 40, b.y - 30, 24, C.cyan, 'right');
      } else {
        circle(ctx, a.x, a.y, 11, C.blue);
        circle(ctx, b.x, b.y, 11, C.cyan);
      }
      T(`Birds value ${vectorString(V[0])}`, 280, 260, 29, C.blue);
      T(`sing value ${vectorString(V[1])}`, 280, 310, 29, C.cyan);
    });
    if (Math.hypot(...read.partial) > 0.01) {
      if (learning) {
        line(ctx, out.x, out.y, out.x + 24, out.y - 24, C.yellow, 1.5);
        api.focus.target('contextual-mixture-point', () =>
          T('o', out.x + 35, out.y - 35, 26, C.yellow, 'center'),
        );
      } else
        api.focus.target('contextual-mixture-point', () => circle(ctx, out.x, out.y, 8, C.yellow));
    }
    api.focus.target('first-weighted-value', () =>
      arrowVector(origin, P(contributionA), C.blue, firstProgress),
    );
    if (learning || secondProgress > 0)
      api.focus.target('second-weighted-value', () =>
        arrowVector(P(contributionA), P(output), C.cyan, secondProgress),
      );
    T('source weights', 1400, 315, 32, C.muted, 'center');
    api.focus.target('source-weight-ribbon', () => ribbon(weights, 1100, 370, 610, 60));
    M(String.raw`o=a_1 v_1+a_2 v_2`, 1400, 590, 42, C.ink, 'center');
    T(
      read.complete ? 'Full contextual mixture' : 'Running weighted sum',
      1400,
      650,
      28,
      C.muted,
      'center',
    );
    api.focus.target('running-context-vector', () =>
      T(vectorString(read.partial), 1400, 725, 48, C.yellow, 'center'),
    );
    if (learning)
      M(String.raw`\frac{\partial o}{\partial z_j}=a_j(v_j-o)`, 1400, 865, 39, C.ink, 'center');
    else T('Dropout disabled', 1400, 865, 30, C.muted, 'center');
    T(learned?.caption ?? 'Move the shares. Follow the mixture.', 960, 985, 31, C.ink, 'center');
  } else if (scene.id === 'every-query') {
    const arrays = [result.scores, result.logits, result.weights, result.output];
    const titles = [String.raw`QK^T`, String.raw`\frac{QK^T}{\sqrt2}`, 'A', 'AV'];
    const xs = [250, 670, 1090, 1510];
    arrays.forEach((a, i) => {
      const normalization = narrated('every-query-attention-matrix-2-b2-1', progress(1));
      const amount =
        i === 0
          ? narrated('every-query-attention-matrix-0-b1-1', progress(0))
          : i < 3
            ? clamp(normalization * 2 - (i - 1))
            : narrated('every-query-attention-matrix-3-b3-1', progress(2));
      api.focus.target('attention-matrix-' + i, () =>
        matrix(
          a,
          xs[i],
          455,
          i === 3 ? C.green : i === 2 ? C.yellow : C.cyan,
          amount,
          105,
          titles[i],
        ),
      );
      if (i < 3) fade(amount, () => arrow(ctx, xs[i] + 239, 550, xs[i + 1] - 25, 550, C.muted, 3));
    });
    T('query rows', 285, 790, 30, C.muted);
    T('key columns', 285, 300, 30, C.muted);
    fade(progress(2), () => {
      api.focus.target('row-normalization-rule', () =>
        M(String.raw`A\mathbf1=\mathbf1`, 960, 850, 44, C.yellow, 'center'),
      );
      T('Each query owns its own distribution over sources', 960, 970, 34, C.ink, 'center');
    });
  } else if (scene.id === 'causal-mask') {
    const size = 112,
      x = 300,
      y = 370,
      count = 4;
    T('key position', 520, 285, 32, C.muted, 'center');
    T('query', 180, 585, 30, C.muted, 'center');
    for (let i = 0; i < count; i++) {
      T(String(i), x - 44, y + i * size + 63, 30, C.muted, 'center');
      T(String(i), x + i * size + 51, y - 32, 30, C.muted, 'center');
      for (let j = 0; j < count; j++) {
        const allowed = j <= i,
          amount = beat === 0 ? phase(p, i * 0.15, i * 0.15 + 0.25) : 1;
        fade(amount, () => {
          const b = api.focus.target('mask-cell-' + i + '-' + j, () =>
            rect(
              ctx,
              x + j * size,
              y + i * size,
              size - 8,
              size - 8,
              allowed ? '#194239' : C.panel,
              allowed ? C.green : C.muted,
              8,
            ),
          );
          api.container(
            ctx,
            b,
            () =>
              T(
                allowed ? '1' : '0',
                x + j * size + 52,
                y + i * size + 63,
                32,
                allowed ? C.green : C.muted,
                'center',
              ),
            { padding: 15 },
          );
        });
      }
    }
    if (beat === 0) M(String.raw`k_{\rm pos}\le q_{\rm pos}`, 1320, 500, 48, C.green, 'center');
    if (beat === 1) {
      const blocked = started('mask-block-score', p > 0.1),
        zero = started('mask-zero-exp', p > 0.4);
      const logits = [result.logits[0][0], blocked ? -Infinity : result.logits[0][1]];
      T('Birds query · Birds key / sing key', 1320, 280, 28, C.blue, 'center');
      api.focus.target('masked-logits', () => matrix([logits], 1150, 360, C.pink, 1, 135, 'z'));
      api.focus.target('masked-exponentials', () => {
        if (zero) matrix([logits.map(Math.exp)], 1150, 590, C.cyan, 1, 135, String.raw`e^z`);
        else M(String.raw`e^{z_j}`, 1320, 655, 48, C.cyan, 'center');
      });
      if (started('causal-mask-causal-weights-b2-1', p > 0.65))
        api.focus.target('causal-weights', () => {
          const weights = softmax(logits);
          matrix([weights], 1150, 820, C.yellow, 1, 135, 'A');
          T(
            `Birds query: Birds ${Math.round(weights[0] * 100)}% · sing ${Math.round(weights[1] * 100)}%`,
            1320,
            1030,
            29,
            C.cyan,
            'center',
          );
        });
    }
    if (beat === 2) {
      T('New query: absolute position 4', 1330, 380, 33, C.yellow, 'center');
      api.focus.target('absolute-cache-mask', () => {
        for (let key = 0; key < 5; key++) {
          const x = 1000 + key * 135;
          T('key ' + key, x + 55, 525, 27, C.muted, 'center');
          const cell = rect(ctx, x, 560, 110, 105, '#194239', C.green, 8);
          api.container(ctx, cell, () => T('1', x + 55, 626, 38, C.green, 'center'), {
            padding: 12,
          });
        }
      });
      M(String.raw`0,1,2,3,4\ \le\ 4`, 1330, 795, 38, C.green, 'center');
      T('All five keys are permitted', 1330, 900, 31, C.ink, 'center');
    }
    if (beat !== 1)
      T('Every active query needs at least one allowed key.', 960, 1000, 31, C.ink, 'center');
  } else if (scene.id === 'parallel-heads') {
    const heads = headResults();
    T('same input states', 265, 300, 30, C.blue, 'center');
    HEAD_INPUT.forEach((v, i) =>
      api.focus.target('shared-head-input-' + i, () =>
        vecCard(v, 265, 480 + i * 150, tokenColors[i], `position ${i}`),
      ),
    );
    const hub = { x: 560, y: 660 };
    const branchRailY = 390,
      branchRailX = 575;
    const branchCue = narrated('parallel-heads-shared-head-input-0-b1-1', phase(p, 0.08, 0.76));
    fade(branchCue, () => {
      line(ctx, 410, 480, 475, 480, C.blue, 3);
      line(ctx, 410, 630, 475, 630, C.cyan, 3);
      line(ctx, 410, 780, 475, 780, C.pink, 3);
      line(ctx, 475, 480, 475, 780, C.muted, 3);
      line(ctx, 475, 660, 547, 660, C.muted, 3);
      circle(ctx, hub.x, hub.y, 13, C.ink);
      line(ctx, hub.x + 8, hub.y - 6, branchRailX, branchRailY, C.muted, 4);
      line(ctx, branchRailX, branchRailY, 1270, branchRailY, C.muted, 4);
      arrow(ctx, branchRailX, branchRailY, 620, 425, C.muted, 4);
      arrow(ctx, 1270, branchRailY, 1280, 425, C.muted, 4);
    });
    const particleFade = clamp((0.96 - branchCue) / 0.22);
    if (branchCue > 0 && particleFade > 0)
      fade(particleFade, () => {
        HEAD_INPUT.forEach((_, i) => {
          const y = 480 + i * 150,
            inputProgress = clamp((branchCue - i * 0.13) / 0.5);
          const branchProgress = clamp((branchCue - 0.39 - i * 0.04) / 0.48);
          const inputRoute = [{ x: 422, y }, { x: 475, y }, hub];
          movingDot(inputRoute, inputProgress, tokenColors[i], 9);
          const headOne = [hub, { x: branchRailX, y: branchRailY }, { x: 620, y: 425 }];
          const headTwo = [
            hub,
            { x: branchRailX, y: branchRailY },
            { x: 1270, y: branchRailY },
            { x: 1280, y: 425 },
          ];
          movingDot(headOne, Math.min(0.88, branchProgress), tokenColors[i], 8);
          movingDot(headTwo, Math.min(0.88, branchProgress), tokenColors[i], 8);
        });
      });
    heads.forEach((head, h) => {
      const x = h ? 1510 : 850,
        color = h ? C.pink : C.cyan;
      const left = x - 245,
        panelTop = 425;
      rect(ctx, left, panelTop, 490, 565, '#101a2c', color, 3, 20);
      T(`HEAD ${h + 1}`, x, 460, 38, color, 'center');
      const query = head.Q[2],
        scores = head.logits[2],
        values = head.V;
      if (beat === 0) {
        const projectionCue = 'parallel-heads-projections';
        const queryCue = h === 0 ? 'parallel-heads-query-head-1' : 'parallel-heads-query-head-2';
        api.focus.target('head-query-matrix-' + h, () =>
          calloutTarget(projectionCue, phase(p, 0.2, 0.62), () =>
            matrix(HEAD_MATRICES[h].Q, x - 190, 560, color, 1, 88, `W_Q^{(${h + 1})}`, 25, 21),
          ),
        );
        api.focus.target('head-key-matrix-' + h, () =>
          calloutTarget(projectionCue, phase(p, 0.2, 0.62), () =>
            matrix(HEAD_MATRICES[h].K, x + 10, 560, color, 1, 88, `W_K^{(${h + 1})}`, 25, 21),
          ),
        );
        api.focus.target('head-query-result-' + h, () =>
          calloutTarget(queryCue, phase(p, h === 0 ? 0.58 : 0.72, h === 0 ? 0.82 : 0.96), () =>
            card(`q₂ = ${vectorString(query)}`, x, 850, 410, 82, color, 30),
          ),
        );
        T('same input row, two learned transforms', x, 940, 23, C.muted, 'center');
      } else if (beat === 1) {
        card(`q₂ = ${vectorString(query)}`, x, 565, 410, 78, color, 29);
        api.focus.target('head-score-row-' + h, () =>
          matrix([scores], x - 137, 735, color, 1, 90, 'q₂ · Kᵀ / √dₖ', 24),
        );
        api.focus.reveal('parallel-heads-head-source-shares-0-b2-1', () => {
          T('shares across positions 0, 1, 2', x, 850, 22, C.muted, 'center');
          api.focus.target('head-source-shares-' + h, () =>
            ribbon(head.weights[2], x - 210, 875, 420, 36),
          );
        });
      } else {
        api.focus.target('head-value-content-' + h, () => {
          matrix(values, x - 90, 535, C.green, 1, 88, `V^{(${h + 1})}`, 25, 24);
          for (let i = 0; i < 3; i++)
            T(`position ${i}`, x - 110, 587 + i * 88, 20, C.muted, 'right');
        });
        api.focus.reveal('parallel-heads-head-source-shares-0-b2-1', () => {
          T('same shares weight these values', x, 810, 22, C.muted, 'center');
          api.focus.target('head-source-shares-' + h, () =>
            ribbon(head.weights[2], x - 210, 824, 420, 26),
          );
        });
        if (started('heads-value-output', p > 0.5))
          api.focus.target('head-output-' + h, () =>
            card(`o${h + 1} = ${vectorString(head.output[2])}`, x, 950, 430, 76, color, 30),
          );
      }
    });
    if (beat === 2 && started('heads-value-output', p > 0.5)) {
      const outputs = heads.map((head) => head.output[2]).flat();
      const merge = api.focus.target('concatenated-head-outputs', () =>
        card(`concat ${vectorString(outputs)}`, 1180, 1025, 840, 60, C.yellow, 29),
      );
      arrow(ctx, 850, 990, 1010, merge.y, C.cyan, 4);
      arrow(ctx, 1510, 990, 1350, merge.y, C.pink, 4);
    }
  } else if (scene.id === 'combine-heads') {
    const values = headResults().flatMap((h) => h.output[2]);
    const current = linearConstruction(
      [values],
      OUTPUT_MATRIX,
      beat === 0 ? narrated('combine-heads-construction-0', smoothstep((p - 0.08) / 0.75)) : 1,
    );
    const projected = project([values], OUTPUT_MATRIX)[0];
    const amount =
      beat === 0
        ? 0
        : beat > 1
          ? 1
          : narrated('combine-heads-construction-1', phase(p, 0.12, 0.72));
    T('head 1', 390, 250, 30, C.cyan, 'center');
    T('head 2', 680, 250, 30, C.pink, 'center');
    values.forEach((value, i) =>
      api.focus.target('concatenated-coordinate-' + i, () =>
        card(fixed(value), 300 + i * 150, 350, 135, 90, i < 2 ? C.cyan : C.pink, 31),
      ),
    );
    M(String.raw`W^O`, 1040, 260, 40, C.yellow, 'center');
    matrix(OUTPUT_MATRIX, 940, 310, C.yellow, 1, 108);
    api.focus.target('projected-head-contribution', () =>
      matrix([current.output[0]], 1410, 420, C.green, 1, 130),
    );
    if (beat === 0) {
      const j = current.column;
      T('Build output coordinate ' + j, 480, 620, 33, C.green, 'center');
      values.forEach((value, i) =>
        card(
          fixed(value) + ' × ' + fixed(OUTPUT_MATRIX[i][j]),
          400 + i * 370,
          830,
          330,
          85,
          i === current.inner ? C.yellow : C.muted,
          29,
        ),
      );
      T(
        (current.complete ? 'Completed coordinate ' : 'Running coordinate ') +
          j +
          ': ' +
          fixed(current.output[0][j]),
        960,
        960,
        40,
        C.green,
        'center',
      );
    } else {
      [0, 1].forEach((j) => {
        const x = 350 + j * 800,
          y = 820,
          scale = 250;
        T('coordinate ' + j, x, y - 70, 30, C.muted);
        rect(ctx, x, y, scale, 64, C.blue, undefined, 0);
        rect(ctx, x + scale, y, projected[j] * scale * amount, 64, C.green, undefined, 0);
        T(
          '1 + ' + fixed(projected[j] * amount) + ' = ' + fixed(1 + projected[j] * amount),
          x,
          y + 120,
          32,
          C.ink,
        );
      });
      api.focus.target('residual-context-state', () =>
        T('old state + constructed head contribution', 960, 970, 32, C.ink, 'center'),
      );
      api.focus.target('fixed-projected-width', () =>
        T('4 head coordinates → 2 stream coordinates', 960, 1035, 29, C.muted, 'center'),
      );
    }
  } else if (scene.id === 'context-and-cost') {
    const firstCue = 'context-and-cost-four-token-pairs',
      sixteenCue = 'context-and-cost-sixteen-entries';
    const moveCue = 'context-and-cost-doubling-pairs';
    const axesCue = 'context-and-cost-eight-by-eight',
      countCue = 'context-and-cost-sixty-four-entries';
    const firstReveal = beat > 0 ? 1 : narrated(firstCue, phase(p, 0.02, 0.48));
    const move = beat > 0 ? narrated(moveCue, phase(p, 0.04, 0.58)) : 0;
    const sixteen = narrated(sixteenCue, firstReveal),
      axes = narrated(axesCue, move),
      count = narrated(countCue, phase(p, 0.68, 0.96));
    const grid = (originX, originY, count, size, color, amount = 1) => {
      for (let r = 0; r < count; r++)
        for (let c = 0; c < count; c++) {
          const index = r * count + c,
            alpha = phase(amount * count * count - index, 0, 1);
          fade(alpha, () =>
            rect(
              ctx,
              originX + c * size,
              originY + r * size,
              size - 5,
              size - 5,
              C.panel,
              color,
              3,
              3,
            ),
          );
        }
    };
    const leftX = lerp(770, 220, move),
      leftY = lerp(370, 390, move),
      leftSize = lerp(92, 68, move);
    const leftWidth = leftSize * 4;
    fade(firstReveal, () => {
      T('4 queries', leftX + leftWidth / 2, leftY - 38, 29, C.blue, 'center');
      T('4 keys', leftX - 74, leftY + leftWidth / 2, 28, C.blue, 'center');
    });
    grid(leftX, leftY, 4, leftSize, C.blue, firstReveal);
    if (sixteen > 0)
      api.focus.reveal(sixteenCue, () =>
        T('16 scores', leftX + leftWidth / 2, leftY + leftWidth + 78, 40, C.blue, 'center'),
      );
    if (move > 0) {
      const size = lerp(54, 78, move),
        rightX = lerp(1400, 750, move),
        rightY = lerp(370, 350, move);
      const gridCount = Math.min(8, Math.round(4 + 4 * move));
      grid(rightX, rightY, gridCount, size, C.cyan, move);
      fade(axes, () => {
        T('8 queries', rightX + size * 4, rightY - 38, 30, C.cyan, 'center');
        T('8 keys', rightX - 96, rightY + size * 4, 30, C.cyan, 'center');
      });
      if (move > 0.9 && count > 0)
        api.focus.reveal(countCue, () => {
          T('64 scores', rightX + size * 4, rightY + size * 8 + 54, 43, C.cyan, 'center');
          T('dense score entries', 1590, 530, 30, C.muted, 'center');
          M(String.raw`2n\times2n=4n^2`, 1590, 620, 45, C.yellow, 'center');
          T('Both query and key axes double.', 1650, 690, 27, C.ink, 'center');
        });
    }
    if (firstReveal > 0 || move > 0)
      api.focus.target('query-key-pairs', () => {
        if (firstReveal > 0)
          rect(
            ctx,
            leftX - 8,
            leftY - 8,
            leftWidth + 16,
            leftWidth + 16,
            'transparent',
            C.blue,
            3,
            10,
          );
        if (move > 0) {
          const size = lerp(54, 78, move),
            rightX = lerp(1400, 750, move),
            rightY = lerp(370, 350, move),
            count = Math.min(8, Math.floor(4 + 4 * move));
          rect(
            ctx,
            rightX - 8,
            rightY - 8,
            count * size + 16,
            count * size + 16,
            'transparent',
            C.cyan,
            3,
            10,
          );
        }
      });
  } else if (scene.id === 'decode-cache') {
    const scanCue = 'decode-cache-scan',
      repeatCue = 'decode-cache-next-query';
    const repeat = beat > 0 ? narrated(repeatCue, phase(p, 0.05, 0.82)) : 0;
    const scan = beat > 0 ? repeat : narrated(scanCue, phase(p, 0.05, 0.78));
    const count = 5 + (repeat > 0.6 ? 1 : 0),
      left = 250,
      step = 285,
      width = 205;
    const queryX = beat > 0 ? 1500 : 350;
    api.focus.target(beat > 0 ? 'decode-next-query' : 'decode-new-query', () => {
      T(beat > 0 ? 'next query qₜ₊₁' : 'new query qₜ', queryX, 335, 34, C.yellow, 'center');
      card(beat > 0 ? 'qₜ₊₁' : 'qₜ', queryX, 390, 165, 90, C.yellow, 36);
    });
    const laneY = 600;
    T('keys and values retained in the KV cache', 960, 490, 32, C.green, 'center');
    api.focus.target('decode-cache-lane', () => {
      for (let i = 0; i < count; i++) {
        const x = left + i * step,
          color = i === count - 1 && repeat > 0 ? C.yellow : C.green;
        card(`K${i}   V${i}`, x, laneY, width, 116, color, 32);
        T(`position ${i}`, x, laneY + 95, 22, C.muted, 'center');
        if (scan > 0) {
          const selected = Math.min(count - 1, Math.floor(scan * count));
          if (i === selected)
            rect(ctx, x - width / 2 - 5, laneY - 61, width + 10, 130, 'transparent', C.cyan, 4, 15);
        }
      }
    });
    const cacheEnd = left + (count - 1) * step + width / 2;
    const scanPath = [
      { x: left - width / 2, y: laneY - 70 },
      { x: cacheEnd, y: laneY - 70 },
    ];
    if (scan > 0) {
      curve(scanPath, scan, C.cyan, 4);
      movingDot(scanPath, scan, C.cyan, 10);
    }
    line(ctx, left - width / 2 - 20, 710, cacheEnd + 20, 710, C.green, 3);
    T(
      repeat > 0
        ? 'append kₜ, vₜ; read the longer cache again'
        : 'one query reads the full cached history',
      960,
      785,
      31,
      C.ink,
      'center',
    );
    if (repeat > 0) {
      T('The next decode step reads one more cached position.', 960, 860, 28, C.yellow, 'center');
      T(
        'Cache payload is persistent; repeated loads consume bandwidth.',
        960,
        930,
        27,
        C.muted,
        'center',
      );
    } else {
      T('One score row, followed by a weighted value read.', 960, 860, 28, C.muted, 'center');
    }
  } else if (scene.id === 'flashattention-tiles') {
    const cue = 'flashattention-tiles-sweep',
      updateCue = 'flashattention-tiles-online-state';
    const sweep = beat > 0 ? 1 : narrated(cue, phase(p, 0.03, 0.82)),
      update = beat > 0 ? narrated(updateCue, phase(p, 0.05, 0.95)) : 0;
    const n = 8,
      size = 55,
      x = 170,
      y = 390,
      visited = Math.floor(sweep * 8),
      step = Math.min(3, Math.floor(visited / 2));
    T('query rows', 390, 330, 30, C.blue, 'center');
    T('key columns', 390, 855, 30, C.cyan, 'center');
    api.focus.target('flash-pair-field', () => {
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++) {
          const visitedCell = beat > 0 || c < visited;
          rect(
            ctx,
            x + c * size,
            y + r * size,
            size - 4,
            size - 4,
            visitedCell ? '#173a47' : C.panel,
            visitedCell ? C.cyan : '#39506d',
            2,
            3,
          );
        }
      const tileX = x + step * 2 * size;
      rect(ctx, tileX - 4, y - 4, 2 * size - 1, 2 * size - 1, '#2a4b56cc', C.yellow, 5, 7);
    });
    T('conceptual dense QK pairs', 390, 930, 27, C.muted, 'center');
    Array.from({ length: 4 }, (_, i) => i).forEach((i) => {
      const color = i === step ? C.yellow : i < step ? C.cyan : C.muted;
      card(`K/V block ${i}`, 940, 420 + i * 115, 330, 76, color, 28);
    });
    T('stream each block through a small on-chip tile', 1380, 370, 28, C.ink, 'center');
    const stateY = [600, 735, 870],
      labels = [
        ['m', 'running maximum'],
        ['ℓ', 'softmax normalizer'],
        ['u', 'weighted value'],
      ];
    labels.forEach(([symbol, label], i) => {
      const color = update > 0 && Math.floor(update * 4) === i ? C.yellow : C.green;
      card(symbol, 1380, stateY[i], 102, 86, color, 38);
      T(label, 1470, stateY[i] + 9, 25, color, 'left');
      if (update > 0 && i <= Math.floor(update * 4)) {
        T('updated for the active block', 1470, stateY[i] + 45, 21, C.muted, 'left');
      }
    });
    T(
      'Dense arithmetic stays; quadratic HBM writes are avoided.',
      1390,
      1040,
      25,
      C.yellow,
      'center',
    );
  } else if (scene.id === 'grouped-query-cache') {
    const groupCue = 'grouped-query-cache-sharing',
      limitCue = 'grouped-query-cache-limit';
    const sharing = beat > 0 ? 1 : narrated(groupCue, phase(p, 0.05, 0.75));
    const limit = beat > 0 ? narrated(limitCue, phase(p, 0.05, 0.95)) : 0;
    const centerX = 960,
      qY = 380,
      kvY = 760;
    T('four query heads', centerX, 300, 34, C.cyan, 'center');
    for (let h = 0; h < 4; h++) {
      const x = 300 + h * 440,
        color = [C.blue, C.cyan, C.pink, C.yellow][h];
      const weights = softmax([1.15 - 0.35 * h, 0.28 + 0.22 * h, -0.3 + 0.43 * h]);
      card(`Q${h}`, x, qY, 220, 86, color, 36);
      T(`query ${h} distribution`, x, 485, 22, color, 'center');
      fade(sharing, () => {
        let left = x - 120;
        weights.forEach((weight, i) => {
          rect(ctx, left, 510, 240 * weight, 34, [C.blue, C.cyan, C.pink][i], undefined, 0);
          left += 240 * weight;
        });
      });
      if (sharing > 0) {
        const port = 720 + h * 160;
        arrow(ctx, x, 620, port, kvY - 62, color, 3.5);
        movingDotBeforeTip(
          [
            { x, y: 620 },
            { x: port, y: kvY - 62 },
          ],
          sharing,
          color,
          8,
        );
      }
    }
    api.focus.target('grouped-query-cache-storage', () =>
      card('one shared K/V head', centerX, kvY, 620, 112, C.green, 34),
    );
    if (beat > 0) {
      const comparison = () => {
        T('four separate KV heads', 520, 850, 25, C.muted, 'center');
        T('one shared KV head', 1385, 850, 25, C.green, 'center');
        for (let i = 0; i < 4; i++) card('K/V', 350 + i * 115, 905, 100, 64, C.muted, 24);
        card('K/V', 1385, 905, 100, 64, C.green, 24);
        T(
          '¼ raw KV payload at equal widths, precision, and length',
          centerX,
          990,
          31,
          C.yellow,
          'center',
        );
        T(
          'GQA needs a trained or uptrained checkpoint; runtime depends on kernel reuse.',
          centerX,
          1050,
          23,
          C.muted,
          'center',
        );
      };
      api.focus.reveal(limitCue, () => api.focus.target('grouped-query-cache-payload', comparison));
    }
  } else if (scene.id === 'complete-read') {
    const fresh = transferRead(),
      old = result.output[1],
      weights = fresh.weights[0];
    const reveal = beat === 0 ? phase(p, 0.35, 0.8) : 1;
    T('New state [1, 3] · same matrices and source values', 960, 260, 34, C.ink, 'center');
    api.focus.target('read-stage-0', () => matrix([fresh.input], 230, 350, C.blue, 1, 100, 'X'));
    api.focus.target('read-stage-1', () =>
      matrix([fresh.query], 680, 350, C.yellow, reveal, 100, 'Q'),
    );
    if (beat === 0) {
      M('q_0=1(1)+3(0.5)=2.5', 1350, 395, 34, C.yellow, 'center');
      M('q_1=1(0.5)+3(1)=3.5', 1350, 515, 34, C.yellow, 'center');
      T('Predict: which source gains share?', 960, 760, 40, C.ink, 'center');
      ribbon(result.weights[1], 440, 860, 1040, 60);
    } else {
      api.focus.target('read-stage-2', () =>
        T('scaled scores ' + vectorString(fresh.logits[0]), 1350, 380, 31, C.yellow, 'center'),
      );
      api.focus.target('read-stage-3', () => ribbon(weights, 1070, 460, 600, 60));
      const P = plane({ x: 370, y: 970, scale: 210, right: 990, top: 510 }),
        origin = P([0, 0]);
      EXAMPLE.V.forEach((v, i) => {
        arrowVector(origin, P(v), tokenColors[i], 1, 3);
        T('v' + i, P(v).x + 35, P(v).y, 25, tokenColors[i]);
      });
      const q = beat === 1 ? narrated('complete-read-transfer-1', phase(p, 0.28, 0.88)) : 1;
      const first = EXAMPLE.V[0].map((v) => v * weights[0]),
        second = EXAMPLE.V[1].map((v) => v * weights[1]);
      if (beat === 2 || q === 1)
        circle(ctx, P(fresh.output[0]).x, P(fresh.output[0]).y, 8, C.yellow);
      arrowVector(origin, P(first), C.blue, clamp(q * 2), 6);
      arrowVector(P(first), P(fresh.output[0]), C.cyan, clamp(q * 2 - 1), 6);
      api.focus.target('weighted-read-box', () =>
        T('weighted values → actual context', 1400, 690, 30, C.cyan, 'center'),
      );
      api.focus.target('weighted-read-rule', () =>
        M(weights.map((w, i) => fixed(w) + 'v_' + i).join('+'), 1400, 770, 36, C.cyan, 'center'),
      );
      const running = weightedReadState(weights, EXAMPLE.V, clamp(q * 2), clamp(q * 2 - 1));
      api.focus.target('read-stage-5', () =>
        vecCard(
          running.partial,
          1400,
          890,
          C.green,
          running.complete ? 'new context' : 'running context',
        ),
      );
      T('Previous ' + vectorString(old), 1400, 1020, 29, C.muted, 'center');
    }
  } else {
    throw new Error(`Unknown attention scene: ${scene.id}`);
  }
}
