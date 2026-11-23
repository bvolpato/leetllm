import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
const {
  draw,
  moeScalarGate,
  moePacked,
  moeCapacity,
  moeFresh,
  moeSelection,
  moeServing,
  moeChoice,
  moeBalance,
  moeZ,
  moeValidatedRoute,
  moeWire,
  moeReplica,
} = await import(process.env.MOE_ANIMATION ?? '../animations/moe.mjs');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
const lesson = await readRepositoryLesson('videos/lessons/moe.lesson.yaml');
function fixture(id) {
  const scene = lesson.scenes.find((s) => s.id === id),
    sounds = scene.beats.map((b, beatIndex) => {
      const ws = b.say.trim().split(/\s+/);
      return {
        beatIndex,
        duration: ws.length / 2.5,
        words: ws.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
      };
    }),
    timing = makeSceneTimeline(
      scene,
      sounds.map((s) => s.duration),
      30,
    );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing, sounds);
  return { scene, timing };
}
function paint(id, time) {
  const { scene, timing } = fixture(id),
    c = createCanvas(1920, 1080);
  return drawFrame(
    c.getContext('2d'),
    lesson,
    scene,
    frameState(timing, time, 0, lesson.scenes.length),
    draw,
  );
}
const labels = (a) => a.labels.filter((x) => x.alpha >= 0.25).map((x) => x.text);
function ticketFields(frame, label) {
  const contains = (box, { center }) =>
    center.x >= box.x &&
    center.x <= box.x + box.width &&
    center.y >= box.y &&
    center.y <= box.y + box.height;
  const ticket = frame.shapes.findLast((shape) => shape.kind === 'rect' && contains(shape, label));
  assert.ok(ticket, label.text + ' needs a visible ticket');
  return frame.labels
    .filter((field) => field.alpha >= 0.25 && contains(ticket, field))
    .sort((a, b) => a.x - b.x)
    .map((field) => field.text);
}
function atCue(id, cue, offset) {
  const { timing } = fixture(id);
  return paint(id, timing.visualCues.find((x) => x.id === 'mo-' + cue).end + offset);
}

test('retained scalar gate has the actual local task gradient while a normalized sole gate is flat', () => {
  const a = moeScalarGate(0.75),
    n = moeScalarGate(0.75, true);
  near(a.output, 1.5);
  near(a.loss, 0.125);
  near(a.gradient, 3 / 16);
  near(n.output, 2);
  near(n.loss, 0.5);
  near(n.gradient, 0);
  const z = Math.log(3),
    e = 1e-5,
    loss = (x) => moeScalarGate(1 / (1 + Math.exp(-x))).loss;
  assert.ok(Math.abs((loss(z + e) - loss(z - e)) / (2 * e) - a.gradient) < 1e-8);
});
test('packed tuples preserve inverse identity, weights and numerical scatter-add on changed vectors', () => {
  const a = moePacked();
  assert.deepEqual(
    a.packed.map((x) => x.token),
    [1, 2, 0, 0, 2],
  );
  assert.deepEqual(
    a.groups.map((x) => x.length),
    [2, 1, 2],
  );
  a.outputs.flat().forEach((x, i) =>
    near(
      x,
      [
        [-0.625, -1.25],
        [6, 8],
        [5.5, 6.6],
      ].flat()[i],
    ),
  );
  const changed = moePacked(undefined, [
    [2, 4],
    [6, 8],
    [10, 12],
  ]);
  changed.outputs.flat().forEach((x, i) => near(x, 2 * a.outputs.flat()[i]));
});
test('capacity ceiling counts assignments, including a single-input fresh repair', () => {
  assert.equal(moeCapacity(4096, 2, 32, 1, [400]).totalOverflow, 144);
  const b = moeCapacity(4096, 2, 32, 1.2, [400]);
  assert.equal(b.slots, 308);
  assert.equal(b.totalOverflow, 92);
  const old = moeFresh(),
    fixed = moeFresh(1.5);
  assert.deepEqual(old.routes, fixed.routes);
  assert.deepEqual(old.loads, [5, 3, 2, 2]);
  assert.equal(old.slots, 3);
  assert.equal(old.totalOverflow, 2);
  assert.equal(fixed.slots, 5);
  assert.equal(fixed.totalOverflow, 0);
  assert.throws(() => moeCapacity(6, 2, 4, NaN, [5]));
});
test('selection-only bias never enters the returned value weights', () => {
  const a = moeSelection();
  assert.deepEqual(a.ids, [2, 0]);
  assert.deepEqual(a.weights, [0.4, 0.6]);
  assert.notDeepEqual(a.weights, a.wrongWeights);
  assert.deepEqual(moeSelection(undefined, [0, 0, 0]).ids, [0, 1]);
});
test('equal expert-choice buckets retain their actual uncovered token', () => {
  const f = moeChoice();
  assert.deepEqual(f.loads, [2, 2, 2]);
  assert.deepEqual(f.coverage, [2, 1, 2, 1, 0]);
});
test('feasible balance counterexample and common-shift z-loss remain distinct', () => {
  const f = moeBalance();
  near(f.sum, 0.4005);
  near(f.score, 1.602);
  near(moeBalance([0.5, 0.5, 0], [0.3, 0.3, 0.4]).score, 0.9);
  const a = moeZ(),
    b = moeZ(3);
  a.p.forEach((p, i) => near(p, b.p[i]));
  near(a.loss, 0);
  near(b.partition, 3);
  near(b.loss, 9);
});
test('the serving counterfactual changes only latency eligibility', () => {
  const a = moeServing(60),
    b = moeServing(50);
  assert.deepEqual(
    a.map((x) => x.accepted),
    [false, true],
  );
  assert.deepEqual(
    b.map((x) => x.accepted),
    [false, false],
  );
  assert.deepEqual(
    a.map(({ checks, accepted, ...x }) => x),
    b.map(({ checks, accepted, ...x }) => x),
  );
});
test('fresh prediction paints loads but no derived capacity or overflow verdict', () => {
  const { timing } = fixture('fresh-route'),
    t = timing.beats[0].until - 0.1,
    frame = paint('fresh-route', t),
    visible = labels(frame);
  assert.deepEqual(
    visible.filter((x) => x.startsWith('load ')),
    ['load 5', 'load 3', 'load 2', 'load 2'],
  );
  assert(!frame.targets.some((target) => target.id === 'queue-cutoff'));
  assert(!visible.some((x) => /\d+ slots|overflow|dropped|returns$|= 3$/.test(x)));
});
test('fresh repair retains the original routes and withholds the fit geometry until its complete consequence clause', () => {
  const before = atCue('fresh-route', 'fresh-fit', -1 / 30),
    after = atCue('fresh-route', 'fresh-fit', 0.6);
  assert(!labels(before).some((x) => x.includes('0 overflow')));
  assert(labels(after).some((x) => x.includes('0 overflow')));
  const seats = (frame) =>
    frame.labels
      .filter((label) => label.alpha >= 0.25 && /^t\d+$/.test(label.text))
      .map(({ text, center }) => ({ text, ...center }));
  const routes = seats(before);
  assert.deepEqual(
    routes.map((r) => r.text),
    ['t0', 't1', 't2', 't3', 't4', 't0', 't1', 't5', 't2', 't3', 't4', 't5'],
  );
  assert.deepEqual(seats(after), routes);
  const firstQueue = routes.filter((r) => Math.abs(r.y - routes[0].y) < 5);
  const admitted = (frame) => {
    const cutoff = frame.connectors.find(
      ({ from, to }) => from.x === to.x && from.y < routes[0].y && to.y > routes.at(-1).y,
    );
    assert.ok(cutoff, 'the cutoff must span the four queues');
    return firstQueue.filter((r) => r.x < cutoff.from.x).map((r) => r.text);
  };
  assert.deepEqual(admitted(before), ['t0', 't1', 't2']);
  assert.deepEqual(admitted(after), ['t0', 't1', 't2', 't3', 't4']);
});
test('the inherited capacity scene withholds its overflow label until the complete overflow clause', () => {
  const { timing } = fixture('capacity-limit'),
    q = timing.visualCues.find((x) => x.id === 'overflow-assignments');
  assert(!labels(paint('capacity-limit', q.end - 1 / 30)).includes('4 overflow'));
  assert(labels(paint('capacity-limit', q.end + 0.1)).includes('4 overflow'));
});

test('finite typed routing rejects malformed counts, invalid coordinates and overflowing projections', () => {
  const m = [
      [-0.65, 0],
      [-1.77, 0],
      [-1.35, 0],
      [-3, 0],
    ],
    r = moeValidatedRoute([1, 0], m, 2);
  assert.deepEqual(r.selected, [0, 2]);
  for (const k of [true, 1.5, 0, 5]) assert.throws(() => moeValidatedRoute([1, 0], m, k));
  assert.throws(() => moeValidatedRoute([1], [[NaN]], 1));
  assert.throws(() => moeValidatedRoute([1e308], [[1e308]], 1));
  near(
    r.weights.reduce((a, b) => a + b, 0),
    1,
  );
});
test('coalesced protocol conserves the exact weighted output and halves this payload', () => {
  const f = moeWire();
  assert.deepEqual(f.separate, f.destinationCombined);
  near(f.separate[0], 2);
  near(f.separate[1], 1.8);
  assert.equal(f.assignmentBytes, 32768);
  assert.equal(f.coalescedBytes, 16384);
  const x = moeWire(
    [0.2, 0.8],
    [
      [2, 5],
      [1, -1],
    ],
  );
  assert.deepEqual(x.separate, x.destinationCombined);
});
test('a physical replica preserves every matrix value and computed output', () => {
  const f = moeReplica([2, 3, 4, 5]);
  assert.deepEqual(f.weights, f.copy);
  assert.notEqual(f.weights, f.copy);
  assert.deepEqual(f.originalOutput, [2, 3, 4, 5]);
  assert.deepEqual(f.copyOutput, f.originalOutput);
});
test('tuple permutation uses a collision-free corridor while retaining all identities', () => {
  const { timing } = fixture('pack-permutation'),
    q = timing.visualCues.find((x) => x.id === 'group-tickets');
  const packed = ['E0 t1 ×1', 'E0 t2 ×0.4', 'E1 t0 ×0.75', 'E2 t0 ×0.25', 'E2 t2 ×0.6'];
  const steps = Math.ceil((q.end - q.start) * 60);
  for (let i = 0; i <= steps; i++) {
    const time = q.start + i / 60;
    const frame = paint('pack-permutation', time);
    const issues = [...frame.issues, ...layoutIssues(frame)];
    assert.deepEqual(issues, [], JSON.stringify({ time, issues }));
    const tickets = frame.labels
      .filter((label) => label.alpha >= 0.25 && label.text.startsWith('×'))
      .sort((a, b) => a.y - b.y)
      .map((gate) => ticketFields(frame, gate).join(' '));
    assert.deepEqual([...tickets].sort(), packed);
    if (i === 0)
      assert.deepEqual(tickets, [
        'E2 t0 ×0.25',
        'E0 t1 ×1',
        'E2 t2 ×0.6',
        'E1 t0 ×0.75',
        'E0 t2 ×0.4',
      ]);
    if (i === steps) assert.deepEqual(tickets, packed);
  }
});
test('scaled checkpoint gate segments occupy 2.5 times the normalized extent on the same scale', () => {
  const a = atCue('checkpoint-contract', 'checkpoint-scale', 0.6),
    width = (y) =>
      a.shapes
        .filter((s) => Math.abs(s.y - y) < 1 && s.height === 75)
        .reduce((n, s) => n + s.width, 0);
  near(width(855), 2.5 * width(700));
  assert(width(700) > 0);
});

test('a common-logit shift marks the current partition pending until its complete result clause', () => {
  const { timing } = fixture('z-partition'),
    cue = timing.visualCues.find((x) => x.id === 'mo-z-shift');
  const during = labels(paint('z-partition', cue.end + 0.25));
  assert(during.includes('Current log partition pending'));
  assert(!during.includes('log partition = 0'));
  const before = labels(atCue('z-partition', 'z-shift', 0.1)),
    after = labels(atCue('z-partition', 'z-result', 0.1));
  assert(!before.includes('log partition = 0'));
  assert(!before.includes('z-loss = 0'));
  assert(before.includes('Current log partition pending'));
  assert(before.includes('Current z-loss pending'));
  assert(after.includes('log partition = 3'));
  assert(after.includes('z-loss = 9'));
});
test('both SwiGLU projection outputs reach the elementwise junction before the down projection', () => {
  const { timing } = fixture('expert-arithmetic'),
    a = paint('expert-arithmetic', timing.beats[1].until - 0.1),
    nearPoint = (p, x, y) => Math.hypot(p.x - x, p.y - y) < 1;
  assert(
    a.paths.some((p) => nearPoint(p.points[0], 940, 480) && nearPoint(p.points.at(-1), 1035, 600)),
  );
  assert(
    a.paths.some((p) => nearPoint(p.points[0], 770, 790) && nearPoint(p.points.at(-1), 1035, 690)),
  );
  assert(a.connectors.some((c) => nearPoint(c.from, 1110, 645) && nearPoint(c.to, 1250, 645)));
  assert.deepEqual([...a.issues, ...layoutIssues(a)], []);
});
test('completed exponential value widths stay true while opacity reveals them', () => {
  const a = atCue('router-contract', 'stable-shift', 0.25),
    b = atCue('router-contract', 'stable-shift', 0.6),
    bars = (x) => x.shapes.filter((s) => s.height === 38 && s.y >= 650 && s.y <= 845);
  const p = bars(a),
    q = bars(b);
  assert.equal(p.length, 4);
  assert.equal(q.length, 4);
  p.forEach((s, i) => near(s.width, 500 * Math.exp([-0.65, -1.77, -1.35, -3][i] + 0.65)));
  assert.deepEqual(
    p.map((s) => s.width),
    q.map((s) => s.width),
  );
  assert(p[0].alpha < q[0].alpha);
});
test('the completed 4096-token tile premise survives both later capacity beats', () => {
  const { timing } = fixture('capacity-arithmetic');
  for (const i of [1, 2]) {
    const a = paint('capacity-arithmetic', (timing.beats[i].start + timing.beats[i].until) / 2),
      tiles = a.shapes.filter(
        (s) =>
          s.width === 19 &&
          s.height === 19 &&
          s.x >= 200 &&
          s.x <= 1130 &&
          s.y >= 370 &&
          s.y <= 460,
      );
    assert.equal(tiles.length, 128);
  }
});
test('the scatter ledger preserves fractional coordinates instead of treating coordinate indices as precision', () => {
  const { timing } = fixture('scatter-combine');
  const at = (id) => paint('scatter-combine', timing.visualCues.find((q) => q.id === id).end + 0.1);
  const pending = labels(at('quarter-return'));
  assert(pending.some((x) => /t0 via E2\s+0\.25 × \[0\.5, 1\]/.test(x)));
  assert(pending.includes('[-0.75, -1.5]'));
  assert(pending.includes('[0.125, 0.25]'));
  assert(!pending.includes('[-0.625, -1.25]'));
  const delivered = at('add-zero');
  const sum = delivered.labels.find((l) => l.alpha >= 0.25 && l.text === '[-0.625, -1.25]');
  assert.ok(sum, 'both fractions must survive addition');
  assert.deepEqual(ticketFields(delivered, sum), ['t0', '[-0.625, -1.25]']);
});

test('the exact top-two readout waits for its result while the normalized geometry stays earned', () => {
  const scene = structuredClone(lesson.scenes.find((s) => s.id === 'top-two'));
  if (!scene.beats[1].visual_cues.some((c) => c.id === 'unit-gate-readout'))
    scene.beats[1].visual_cues.push({
      id: 'unit-gate-readout',
      phrase: 'with roughly two thirds assigned to the first expert',
      targets: ['selected-gate-blend'],
    });
  const sounds = scene.beats.map((b, beatIndex) => {
      const words = b.say.trim().split(/\s+/);
      return {
        beatIndex,
        duration: words.length / 2.5,
        words: words.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
      };
    }),
    timing = makeSceneTimeline(
      scene,
      sounds.map((s) => s.duration),
      30,
    );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing, sounds);
  timing.cueTiming = 'provider-words';
  const cue = timing.visualCues.find((c) => c.id === 'unit-gate-readout'),
    end = Math.ceil(cue.end * 30) / 30,
    at = (t) =>
      drawFrame(
        createCanvas(1920, 1080).getContext('2d'),
        lesson,
        scene,
        frameState(timing, t, 0, lesson.scenes.length),
        draw,
      ),
    before = at(end - 1 / 30),
    after = at(end),
    exact = (a) => labels(a).filter((s) => /^E1 ≈ .* · E3 ≈/.test(s));
  assert.deepEqual(
    exact(before),
    [],
    'exact final gate weights precede their complete result clause',
  );
  assert.deepEqual(exact(after), ['E1 ≈ 0.668188 · E3 ≈ 0.331812']);
  const bars = (a) =>
    a.shapes.filter((s) => s.y === 475 && s.height === 100).map(({ x, width }) => ({ x, width }));
  assert.equal(bars(before).length, 2);
  assert.deepEqual(bars(before), bars(after));
  near(
    bars(before).reduce((n, s) => n + s.width, 0),
    580,
  );
  assert(labels(before).includes('mass ≈ 1.000'));
});
