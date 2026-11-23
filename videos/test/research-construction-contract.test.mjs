import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  draw,
  researchConstructionModel,
  validateResearchConstruction,
} from '../animations/capstone-reproducible-research-study.mjs';

const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(
  new URL('../lessons/capstone-reproducible-research-study.lesson.yaml', import.meta.url).pathname,
  root,
);
registerLessonFonts();
function fixture(id) {
  const scene = lesson.scenes.find((s) => s.id === id),
    sounds = scene.beats.map((b, beatIndex) => {
      const words = b.say.trim().split(/\s+/);
      return {
        beatIndex,
        duration: words.length / 2.5,
        words: words.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
      };
    });
  const timeline = makeSceneTimeline(
    scene,
    sounds.map((s) => s.duration),
    30,
  );
  timeline.visualCues = resolveSceneCues(scene, timeline, sounds);
  timeline.cueTiming = 'estimated-lexical-words';
  const canvas = createCanvas(1920, 1080);
  return {
    timeline,
    paint(time) {
      const state = frameState(timeline, time, lesson.scenes.indexOf(scene), lesson.scenes.length);
      const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
      return {
        state,
        audit,
        labels: audit.labels.map((l) => l.text),
        model: researchConstructionModel(id, state),
      };
    },
    cue(beat, sentence) {
      return timeline.visualCues.find((c) => c.id === `rsx-${id}-b${beat}-s${sentence}`);
    },
  };
}
test('the actual bootstrap data and paired covariance retain their distinct numerical contracts', () => {
  assert(validateResearchConstruction());
  const report = researchConstructionModel('reported-bootstrap', { beat: 2, beatP: 1 });
  assert.equal(report.count, 10000);
  assert(Math.abs(report.low - 0.06111111111111111) < 1e-14);
  assert.equal(report.high, 0.225);
  const cov = researchConstructionModel('covariance', { beat: 2, beatP: 1 });
  assert.equal(cov.paired, 2 * cov.independent);
  assert.equal(cov.cov, -0.15625);
});
test('the whole fresh question stays neutral and each completed answer clause gates its own predicate', () => {
  const f = fixture('fresh-interpretation'),
    question = f.timeline.beats[0];
  for (const time of [
    question.start + 0.01,
    question.end - 0.01,
    question.end + 0.8,
    question.until - 0.01,
  ]) {
    const a = f.paint(time);
    assert(!a.labels.includes('PASS stated rule'));
    assert(a.labels.includes('Draft: competent final policies'));
    assert(!a.model.reportRepaired);
  }
  const early = f.cue(1, 0),
    final = f.cue(1, 1);
  assert.equal(
    f.paint(early.end - 1 / 300).labels.filter((x) => x === 'PASS stated rule').length,
    0,
  );
  assert.equal(
    f.paint(early.end + 1 / 300).labels.filter((x) => x === 'PASS stated rule').length,
    1,
  );
  assert.equal(
    f.paint(final.end - 1 / 300).labels.filter((x) => x === 'PASS stated rule').length,
    1,
  );
  assert.equal(
    f.paint(final.end + 1 / 300).labels.filter((x) => x === 'PASS stated rule').length,
    2,
  );
});
test('the report repair changes the displayed assertions and preserves every supplied number', () => {
  const f = fixture('fresh-interpretation'),
    cue = f.cue(2, 1),
    before = f.paint(cue.end - 1 / 300),
    after = f.paint(cue.end + 1 / 300);
  assert(before.labels.includes('Draft: competent final policies'));
  assert(!after.labels.includes('Draft: competent final policies'));
  assert(after.labels.includes('Mean-and-positive-interval rule passes'));
  assert.deepEqual(before.model.input, after.model.input);
  assert.equal(after.model.strongerPass, false);
});
test('the actual study update keeps its transition and uses alpha.35 when next value changes', () => {
  const f = fixture('actual-update'),
    cue = f.cue(1, 2),
    before = f.paint(cue.end - 1 / 300),
    after = f.paint(cue.end + 1 / 300);
  assert.equal(before.model.next, 0);
  assert.equal(after.model.next, 0.4);
  assert.deepEqual([before.model.start, before.model.action, before.model.successor], [1, 1, 0]);
  assert.deepEqual([after.model.start, after.model.action, after.model.successor], [1, 1, 0]);
  assert(Math.abs(before.model.updated + 0.0408333333333333) < 1e-12);
  assert(Math.abs(after.model.updated - 0.0921666666666667) < 1e-12);
  assert(before.labels.some((x) => x.includes('−0.040833') || x.includes('-0.040833')));
  assert(!after.labels.some((x) => x.includes('+0.092167')));
  assert(after.labels.includes('.400000'));
  const answer = f.cue(1, 3);
  assert(!f.paint(answer.end - 1 / 300).labels.some((x) => x.includes('+0.092167')));
  assert(f.paint(answer.end + 1 / 300).labels.some((x) => x.includes('+0.092167')));
});
test('covariance, marginal variances and mean variances wait for their separate completed claims', () => {
  const f = fixture('covariance'),
    cov = f.cue(1, 1),
    marginal = f.cue(1, 2),
    means = f.cue(1, 3);
  assert(!f.paint(0.1).labels.some((x) => x.includes('Var sparse =')));
  const a = f.paint(cov.end + 1 / 300);
  assert(a.labels.includes('Covariance = −.15625'));
  assert(!a.labels.some((x) => x.includes('Var sparse =')));
  assert(!a.labels.some((x) => x.includes('Independent mean variance')));
  assert(!f.paint(marginal.end - 1 / 300).labels.some((x) => x.includes('Var sparse =')));
  assert(f.paint(marginal.end + 1 / 300).labels.includes('Var sparse = Var shaped = .15625'));
  assert(!f.paint(means.end - 1 / 300).labels.some((x) => x.includes('Independent mean variance')));
  const end = f.paint(means.end + 1 / 300);
  assert(end.labels.includes('Independent mean variance .0625'));
  assert(end.labels.includes('Paired mean variance .125'));
});
test('the telescoping formula precedes the completed-path numeric payoff', () => {
  const f = fixture('telescoping'),
    formula = f.cue(1, 1),
    payoff = f.cue(1, 2),
    a = f.paint(formula.end + 1 / 300);
  assert(a.labels.includes('−Φ(start) + γᵀ Φ(end)'));
  assert(!a.labels.some((x) => x.includes('Completed direct path and detour:')));
  assert(
    !f
      .paint(payoff.end - 1 / 300)
      .labels.some((x) => x.includes('Completed direct path and detour:')),
  );
  assert(
    f
      .paint(payoff.end + 1 / 300)
      .labels.includes('Completed direct path and detour: −(−1) + 0 = +1'),
  );
});
test('reported endpoints remain pending until the complete numeric clause ends', () => {
  const f = fixture('reported-bootstrap'),
    cue = f.cue(1, 2),
    before = f.paint(cue.end - 1 / 300),
    after = f.paint(cue.end + 1 / 300);
  assert(!before.labels.includes('hi 0.225000'));
  assert(after.labels.includes('hi 0.225000'));
  assert(after.labels.includes('499.95'));
  assert(after.labels.includes('9499.05'));
});
test('arbitrary-time sampling is deterministic after later states have been visited', () => {
  const f = fixture('fresh-interpretation'),
    times = [2, 30, 80, 12, 2, 80].map((t) => Math.min(t, f.timeline.duration - 0.2));
  const a = f.paint(times[0]),
    b = f.paint(times[4]);
  assert.deepEqual(a.model, b.model);
  assert.deepEqual(a.labels, b.labels);
});
