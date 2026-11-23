import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
const anim = await import(process.env.EDGE_ANIMATION ?? '../animations/edge-specialization.mjs');
const root = process.cwd().endsWith('/videos') ? process.cwd().slice(0, -7) : process.cwd();
const lesson = await readLesson(root + '/videos/lessons/edge-specialization.lesson.yaml', root);
const { createCanvas } = createRequire(root + '/videos/package.json')('@napi-rs/canvas');
registerLessonFonts();
function paint(id, cueId, offset = 1 / 30) {
  const scene = lesson.scenes.find((s) => s.id === id);
  const sounds = scene.beats.map((b, beatIndex) => {
    const words = b.say.trim().split(/\s+/);
    return {
      beatIndex,
      duration: words.length / 2.5,
      words: words.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
    };
  });
  const timeline = makeSceneTimeline(
    scene,
    sounds.map((x) => x.duration),
    30,
  );
  timeline.sounds = sounds;
  timeline.visualCues = resolveSceneCues(scene, timeline, sounds);
  const cue = timeline.visualCues.find((c) => c.id === cueId);
  assert(cue, cueId);
  const state = frameState(
    timeline,
    cue.end + offset,
    lesson.scenes.indexOf(scene),
    lesson.scenes.length,
  );
  const audit = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    state,
    anim.draw,
  );
  assert.deepEqual(audit.issues, []);
  return { labels: audit.labels.map((l) => l.text), state, audit };
}

test('the complete duty cycle conserves durations while changing only idle power', () => {
  const a = anim.edgeDevice(),
    b = anim.edgeDevice(0.9);
  assert.deepEqual(a.seconds, [300, 500, 20800]);
  assert.equal(
    a.seconds.reduce((a, b) => a + b),
    21600,
  );
  assert.deepEqual(a.seconds, b.seconds);
  assert.deepEqual(a.wh.slice(0, 2), b.wh.slice(0, 2));
  assert.equal(a.payload, 1.2e9);
  assert.equal(a.ceiling, 30);
  assert.equal(a.margin, 176);
  assert.equal(a.fits, false);
  assert.equal(b.fits, true);
  assert(Math.abs(a.total - 6.666666666666667) < 1e-12);
  assert(Math.abs(b.total - 6.088888888888889) < 1e-12);
});
test('the exact soft-loss gradient retains the temperature chain rule and squared scaling', () => {
  for (const tau of [1, 3, 100]) {
    const g = anim.edgeGradients(tau);
    assert(Math.abs(g.g.reduce((a, b) => a + b)) < 1e-12);
    for (let i = 0; i < 3; i++) assert(Math.abs(g.scaled[i] - g.g[i] * tau * tau) < 1e-12);
  }
  assert(anim.edgeGradients(100).scaled[0] < -0.233333);
  assert(anim.edgeGradients(100).scaled[0] > -0.236);
  const l = anim.edgeLoss();
  assert(Math.abs(l.total - (0.2 * l.hard + 0.8 * l.soft + 0.2 * l.hidden)) < 1e-12);
  assert.equal(l.total.toFixed(4), '0.2109');
});
test('the pure router excludes invalid scores before the supported-local branch', () => {
  for (const score of [true, false, NaN, Infinity, -0.1, 1.1, '0.9'])
    assert.equal(
      anim.edgeRoute({
        score,
        supported: true,
        data: 'public',
        approval: true,
        redaction: true,
        online: true,
      }),
      'local review',
    );
  assert.equal(
    anim.edgeRoute({ score: 0.8, supported: true, data: 'restricted', online: false }),
    'local answer',
  );
  for (const key of ['approval', 'redaction', 'online'])
    assert.equal(
      anim.edgeRoute({
        score: 0.79,
        data: 'public',
        approval: true,
        redaction: true,
        online: true,
        [key]: false,
      }),
      'local review',
    );
});
test('the same clamped numerical row drives both logits and selected class', () => {
  assert.deepEqual(anim.edgeNumeric([2, -0.5, -2]), {
    clamped: [1, -0.5, -1],
    logits: [0.5, -0.5],
    class: 0,
  });
  assert.deepEqual(
    anim.edgeNumeric([-0.5, -0.2, 0.1]).logits.map((x) => Math.round(x * 10) / 10),
    [0.6, -0.6],
  );
});
test('the fresh prediction contains input quantities without any derived decision', () => {
  const p = paint('fresh-device', 'edge-fresh-device-payload', -5).labels;
  assert(!p.some((x) => /30 steps|1,872 MiB resident|6\.67 Wh|6\.09 Wh|> 6.5 Wh/.test(x)));
});
test('a completed repair total never claims the mathematically false inequality', () => {
  const p = paint('fresh-device', 'edge-fresh-device-repair-total').labels;
  assert(p.includes('6.09 Wh total'));
  assert(!p.some((x) => x.includes('6.09 Wh >')));
  const end = paint('fresh-device', 'edge-fresh-device-repair-pass').labels;
  assert(end.includes('6.09 Wh ≤ 6.5 Wh'));
});
test('a battery repair changes the main energy representation and retains all phase operands', () => {
  const a = paint('fresh-device', 'edge-fresh-device-energy'),
    b = paint('fresh-device', 'edge-fresh-device-repair-total');
  assert(a.labels.includes('idle 5.778 Wh'));
  assert(b.labels.includes('idle 5.200 Wh'));
  assert(b.labels.includes('prefill 0.333 Wh'));
  assert(b.labels.includes('decode 0.556 Wh'));
});
test('shared weights retain both actual intermediate states after two applications', () => {
  assert.deepEqual(anim.edgeSharedWeight([4, 8]).states, [
    [4, 8],
    [2, 4],
    [1, 2],
  ]);
  const p = paint('small-architecture', 'edge-small-architecture-twice').labels;
  assert(p.includes('x₁ = [1, 2]'));
  assert(p.includes('x₂ = [0.5, 1]'));
  assert(p.some((x) => x.includes('W = 0.5 I')));
});
test('the recorded export result and shape rejection wait for their own complete clauses', () => {
  const a = paint('cpu-export', 'edge-cpu-export-logits', -1).labels;
  assert(!a.includes('class 0'));
  const b = paint('cpu-export', 'edge-cpu-export-logits').labels;
  assert(b.includes('class 0') && b.includes('class 1'));
  const r = paint('cpu-export', 'edge-cpu-export-reject').labels;
  assert(r.filter((x) => x === 'REJECT').length === 2);
  assert(!r.includes('ACCEPT'));
});
test('the model source validator preserves the original signed-update and graph contracts', () =>
  assert.equal(anim.validateModel(), true));

test('a first total and its derived durations wait for distinct completed clauses', () => {
  const before = paint('fresh-device', 'edge-fresh-device-payload', -1).labels;
  assert(!before.some((x) => x.includes('500 s') || x.includes('20800 s')));
  const sum = paint('fresh-device', 'edge-fresh-device-energy').labels;
  assert(sum.includes('6.67 Wh total'));
  assert(!sum.some((x) => x.includes('> 6.5')));
  assert(paint('fresh-device', 'edge-fresh-device-hold').labels.includes('6.67 Wh > 6.5 Wh'));
});
