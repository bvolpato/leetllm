import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { C, drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { findLabelCollisions } from '../lib/label-collisions.mjs';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import { findArrowheadOcclusions } from '../lib/arrowhead-occlusion.mjs';

const animation = await import(
  process.env.REWARD_ANIMATION
    ? pathToFileURL(process.env.REWARD_ANIMATION).href
    : new URL('../animations/reward-modeling.mjs', import.meta.url).href
);
registerLessonFonts();

test('the scored candidate keeps its actual answer glyphs clear of the toy-head formula', async () => {
  const lesson = await readLesson(
    new URL('../lessons/reward-modeling.lesson.yaml', import.meta.url),
    new URL('../../', import.meta.url).pathname,
  );
  const index = lesson.scenes.findIndex((scene) => scene.id === 'rlhf-and-dpo'),
    scene = lesson.scenes[index];
  const measured = (await loadMeasuredTimeline('reward-modeling')).scenes[0];
  const timings = [
    { ...measured, cueTiming: 'provider-words', visualCues: resolveSceneCues(scene, measured) },
    makeSceneTimeline(
      scene,
      scene.beats.map((beat) => beat.say.trim().split(/\s+/).length / 2.5),
      30,
    ),
  ];
  const canvas = createCanvas(1920, 1080);
  for (const timing of timings) {
    const beat = timing.beats[2];
    const samples = [0.12, 0.5, 0.88].map(
      (progress) => beat.start + progress * (beat.until - beat.start),
    );
    for (const time of samples) {
      const frame = drawFrame(
        canvas.getContext('2d'),
        lesson,
        scene,
        frameState(timing, time, index, lesson.scenes.length),
        animation.draw,
      );
      assert.deepEqual(
        findLabelCollisions(frame.labels),
        [],
        `Candidate glyphs at ${time}s (${timing.cueTiming})`,
      );
    }
  }
  const claimed = render('rlhf-and-dpo', 2, ['final-shortcut-score']);
  assert(claimed.text.includes('I will request approval afterward.'));
  assert(claimed.text.includes('Toy head: evidence 0 × 1 + length 2 × 1 = 2'));
  assert.deepEqual(
    findLabelCollisions(claimed.frame.labels),
    [],
    'The scored, unrevised candidate must keep both real labels legible',
  );
});

test('the shared-weight receipt agrees with the painted current weight throughout measured and estimated updates', async () => {
  const lesson = await readLesson(
    new URL('../lessons/reward-modeling.lesson.yaml', import.meta.url),
    new URL('../../', import.meta.url).pathname,
  );
  const index = lesson.scenes.findIndex((scene) => scene.id === 'score-gradients'),
    scene = lesson.scenes[index];
  const measured = (await loadMeasuredTimeline('reward-modeling')).scenes.find(
    (scene) => scene.id === 'score-gradients',
  );
  const cue = resolveSceneCues(scene, measured).find((cue) => cue.id === 'shared-update');
  const estimated = makeSceneTimeline(
    scene,
    scene.beats.map((beat) => beat.say.trim().split(/\s+/).length / 2.5),
    30,
  );
  const samples = [
    [
      { ...measured, cueTiming: 'provider-words', visualCues: resolveSceneCues(scene, measured) },
      [
        cue.start - 1 / 30,
        ...[0.25, 0.5, 0.75].map((p) => cue.start + p * (cue.end - cue.start)),
        cue.end + 0.1,
        358.9 - measured.start,
      ],
    ],
    [
      estimated,
      [0.25, 0.4, 0.5, 0.7, 0.9].map(
        (p) => estimated.beats[2].start + p * estimated.beats[2].duration,
      ),
    ],
  ];
  const canvas = createCanvas(1920, 1080);
  let changingStates = 0,
    completedReceipts = 0;
  for (const [timing, times] of samples)
    for (const time of times) {
      const frame = drawFrame(
        canvas.getContext('2d'),
        lesson,
        scene,
        frameState(timing, time, index, lesson.scenes.length),
        animation.draw,
      );
      assert.deepEqual(
        [...frame.issues, ...layoutIssues(frame), ...findLabelCollisions(frame.labels)],
        [],
      );
      const text = frame.labels.map((label) => label.text);
      const weight = Number(
        text.find((label) => /^w\\approx/.test(label)).replace('w\\approx', ''),
      );
      const score = (name) =>
        Number(
          frame.labels
            .find((label) => label.x > 1100 && label.text.trim().startsWith(name))
            .text.trim()
            .split(/\s+/)
            .at(-1)
            .replace('−', '-'),
        );
      assert(
        Math.abs(score('chosen') - weight) <= 0.001,
        `The chosen feature is 1, so its score must match the current weight at ${time}`,
      );
      assert(
        Math.abs(score('rejected') - 2 * weight) <= 0.0011,
        `The rejected feature is 2 at ${time}`,
      );
      const receipt = text.find((label) => label.startsWith('w = −1 − 0.1 × 0.269 ≈ '));
      if (receipt) {
        const result = Number(receipt.split('≈ ')[1]);
        assert(
          Math.abs(-1 - 0.1 * 0.269 - result) <= 0.00051,
          `The completed subtraction must equal its displayed result at ${time}: ${receipt}`,
        );
        assert.equal(result, weight);
        completedReceipts++;
      }
      if (weight < -1 && weight > -1.027) {
        assert.equal(
          receipt,
          undefined,
          'The full-step equation must wait while the current weight is moving',
        );
        assert(text.includes('CURRENT SHARED-WEIGHT STATE'));
        changingStates++;
      }
    }
  assert(
    changingStates > 2 && completedReceipts > 0,
    'The native regression must exercise intermediate and completed updates',
  );
});

function render(id, beat, after = [], during = {}) {
  const cueIds =
    id === 'transformer-score-head'
      ? [
          'head-a-first',
          'head-a-second',
          'head-a-sum',
          'head-b-first',
          'head-b-second',
          'head-b-sum',
        ]
      : id === 'likelihood-isnt-preference'
        ? [
            'likelihood-first-piece',
            'likelihood-second-piece',
            'likelihood-third-piece',
            'likelihood-product-result',
            'likelihood-rule-choice',
          ]
        : ['final-shortcut-score', 'final-rule-check', 'final-stop', 'final-revise', 'final-pass'];
  const cues = Object.fromEntries(
    cueIds.map((cue) => [
      cue,
      {
        phase: after.includes(cue) ? 'after' : cue in during ? 'during' : 'before',
        progress: after.includes(cue) ? 1 : (during[cue] ?? 0),
        targets: [],
      },
    ]),
  );
  const canvas = createCanvas(1920, 1080);
  const frame = drawFrame(
    canvas.getContext('2d'),
    {},
    { id, title: '' },
    { beat, beatP: 0.99, p: 0.99, t: 10, duration: 20, opacity: 1, cues },
    animation.draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return { text: frame.labels.map((label) => label.text), canvas, frame };
}

test('likelihood arrows advance toward pending probabilities with clear painted triangle heads', () => {
  const ids = ['likelihood-first-piece', 'likelihood-second-piece', 'likelihood-third-piece'];
  const arrival = render('likelihood-isnt-preference', 0, [], { [ids[0]]: 0.984962406015039 });
  assert.deepEqual(
    findArrowheadOcclusions(arrival.frame),
    [],
    'The recorded first-piece arrival must leave both full triangles clear',
  );
  for (const [index, id] of ids.entries())
    for (const progress of [0.1, 0.5, 0.9, 0.97, 0.995]) {
      const { frame, canvas } = render('likelihood-isnt-preference', 0, ids.slice(0, index), {
        [id]: progress,
      });
      const arrows = frame.connectors.filter((arrow) => arrow.kind === 'arrow');
      assert.equal(arrows.length, 2, 'Both answer branches must retain their transfer arrow');
      assert.deepEqual(
        findArrowheadOcclusions(frame),
        [],
        `${id}/${progress}: the whole triangle must remain clear`,
      );
      assert.equal(
        frame.labels.filter((label) => label.text === 'P pending').length,
        2 * (3 - index),
      );
      for (const arrow of arrows) {
        assert(
          Math.abs(arrow.to.x - arrow.from.x - 58 * progress) < 1e-8,
          'The arrow front must follow the narrated token progress',
        );
        const yellow = C.yellow
          .slice(1)
          .match(/../g)
          .map((channel) => parseInt(channel, 16));
        const middle = arrow.head.reduce((p, v) => ({ x: p.x + v.x / 3, y: p.y + v.y / 3 }), {
          x: 0,
          y: 0,
        });
        const pixels = canvas
          .getContext('2d')
          .getImageData(Math.round(middle.x) - 1, Math.round(middle.y) - 1, 3, 3).data;
        assert(
          Array.from({ length: 9 }, (_, pixel) => pixel * 4).some(
            (offset) =>
              pixels[offset + 3] === 255 &&
              yellow.every((channel, index) => Math.abs(pixels[offset + index] - channel) <= 2),
          ),
          'The native triangle must remain visibly yellow',
        );
      }
    }
});

test('the toy conditional branches fit one normalized distribution at every shared prefix', () => {
  const { context, answers } = animation.LIKELIHOOD_FIXTURE;
  const distributions = new Map();
  for (const answer of answers) {
    assert.equal(answer.pieces.length, answer.probabilities.length);
    for (const [index, piece] of answer.pieces.entries()) {
      const prefix = JSON.stringify([context, ...answer.pieces.slice(0, index)]);
      const probability = answer.probabilities[index];
      assert.ok(Number.isFinite(probability) && probability >= 0 && probability <= 1);
      if (!distributions.has(prefix)) distributions.set(prefix, new Map());
      const branches = distributions.get(prefix);
      if (branches.has(piece))
        assert.equal(
          branches.get(piece),
          probability,
          'The same continuation after the same prefix must have one probability',
        );
      branches.set(piece, probability);
    }
  }
  for (const [prefix, branches] of distributions) {
    const mass = [...branches.values()].reduce((sum, probability) => sum + probability, 0);
    assert.ok(
      mass <= 1 + Number.EPSILON,
      `Mutually exclusive continuations after ${prefix} have total probability ${mass}`,
    );
  }
  assert.equal(distributions.get(JSON.stringify([context])).size, 2);
});

test('the toy likelihood constructs conditional products and withholds the ranking through the prediction', () => {
  const id = 'likelihood-isnt-preference';
  const initial = render(id, 0);
  assert.ok(initial.text.includes('Sequence probability pending'));
  const first = render(id, 0, ['likelihood-first-piece']);
  assert.ok(first.text.includes('0.25 = 0.25'));
  assert.ok(first.text.includes('0.50 = 0.50'));
  const second = render(id, 0, ['likelihood-first-piece', 'likelihood-second-piece']);
  assert.ok(second.text.includes('0.25 × 0.80 = 0.20'));
  assert.ok(second.text.includes('0.50 × 0.80 = 0.40'));
  const question = render(id, 0, [
    'likelihood-first-piece',
    'likelihood-second-piece',
    'likelihood-third-piece',
  ]);
  assert.ok(question.text.includes('0.25 × 0.80 × 0.50 = ?'));
  assert.ok(!question.text.some((text) => text.startsWith('WRITER LIKELIHOOD:')));
  const multiplying = render(id, 1, [], { 'likelihood-product-result': 0.5 });
  assert.ok(multiplying.text.includes('0.50 × 0.80 × 0.50 = ?'));
  const result = render(id, 1, ['likelihood-product-result']);
  assert.ok(result.text.includes('0.25 × 0.80 × 0.50 = 0.10'));
  assert.ok(result.text.includes('0.50 × 0.80 × 0.50 = 0.20'));
  assert.ok(result.text.includes('WRITER LIKELIHOOD: B > A'));
  assert.ok(!result.text.includes('APPROVAL RULE: A > B'));
  const held = render(id, 1, ['likelihood-product-result', 'likelihood-rule-choice']);
  assert.ok(held.text.includes('APPROVAL RULE: A > B'));
  const { answers } = animation.likelihoodConstruction({ beat: 1 });
  assert.equal(answers[0].pieces.join(' '), 'Request a review ticket. Wait for approval.');
  assert.equal(answers[1].pieces.join(' '), 'Sure. Admin access is enabled now.');
  assert.equal(answers[0].product, 0.1);
  assert.equal(answers[1].product, 2 * answers[0].product);
  assert.notDeepEqual(initial.canvas.toBuffer('image/png'), second.canvas.toBuffer('image/png'));
  assert.notDeepEqual(question.canvas.toBuffer('image/png'), held.canvas.toBuffer('image/png'));
});

test('the native scalar head earns each product before revealing the actual sum', () => {
  const initial = render('transformer-score-head', 2);
  assert.ok(initial.text.includes('Sum pending'));
  assert.ok(!initial.text.some((text) => text.includes('= 1.80')));
  const first = render('transformer-score-head', 2, ['head-a-first']);
  assert.ok(first.text.includes('1.00'));
  assert.ok(first.text.includes('Product pending'));
  const products = render('transformer-score-head', 2, ['head-a-first', 'head-a-second']);
  assert.ok(products.text.includes('0.80'));
  assert.ok(products.text.includes('Sum pending'));
  const adding = render('transformer-score-head', 2, ['head-a-first', 'head-a-second'], {
    'head-a-sum': 0.5,
  });
  assert.ok(adding.text.includes('Sum pending'));
  const complete = render('transformer-score-head', 2, [
    'head-a-first',
    'head-a-second',
    'head-a-sum',
  ]);
  assert.ok(complete.text.includes('1.00 + 0.80 = 1.80'));
  const second = render('transformer-score-head', 3, [
    'head-b-first',
    'head-b-second',
    'head-b-sum',
  ]);
  assert.ok(second.text.includes('0.50 + 0.20 = 0.70'));
  assert.ok(second.text.some((text) => text.includes('retained A = 1.80')));
  assert.notDeepEqual(initial.canvas.toBuffer('image/png'), complete.canvas.toBuffer('image/png'));
});

test('the native ending keeps the independent check pending, fails the violating answer and tests the revision', () => {
  const initial = render('rlhf-and-dpo', 2);
  assert.ok(initial.text.includes('Admin enabled now.'));
  assert.ok(initial.text.includes('FRESH CANDIDATE D'));
  assert.ok(!initial.text.some((text) => text.startsWith('FAIL:') || text.includes('check: PASS')));
  const checking = render('rlhf-and-dpo', 2, ['final-shortcut-score'], { 'final-rule-check': 0.5 });
  assert.ok(checking.text.includes('Checking approval before access…'));
  assert.ok(!checking.text.some((text) => text.startsWith('FAIL:')));
  const scored = render('rlhf-and-dpo', 2, ['final-shortcut-score']);
  assert.ok(scored.text.includes('Toy head: evidence 0 × 1 + length 2 × 1 = 2'));
  assert.ok(scored.text.includes('Same toy head: review-first A = 1 < verbose D = 2'));
  assert.ok(!scored.text.some((text) => text.startsWith('FAIL:')));
  const failed = render('rlhf-and-dpo', 2, [
    'final-shortcut-score',
    'final-rule-check',
    'final-stop',
  ]);
  assert.ok(failed.text.includes('FAIL: access granted while ticket is pending'));
  assert.ok(failed.text.includes('OPTIMIZATION TRIAL STOPPED'));
  const revision = render('rlhf-and-dpo', 2, [
    'final-shortcut-score',
    'final-rule-check',
    'final-stop',
    'final-revise',
  ]);
  assert.ok(revision.text.includes('Keep access blocked until approval.'));
  assert.ok(revision.text.includes('Independent check: pending'));
  const testing = render(
    'rlhf-and-dpo',
    2,
    ['final-shortcut-score', 'final-rule-check', 'final-stop', 'final-revise'],
    { 'final-pass': 0.5 },
  );
  assert.ok(testing.text.includes('Independent check: pending'));
  const held = render('rlhf-and-dpo', 2, [
    'final-shortcut-score',
    'final-rule-check',
    'final-stop',
    'final-revise',
    'final-pass',
  ]);
  assert.ok(held.text.includes('Independent check: PASS'));
  assert.ok(held.text.includes('P7-42 pending · access BLOCKED · rule preserved'));
  assert.ok(!held.text.includes('Admin enabled now.'));
});

test('approval depends on the supplied ticket state and actual grant action', () => {
  const { approvalRuleCheck: check, FINAL_RULE_FIXTURE: f } = animation;
  assert.equal(check(f.verbose, f.ticket).passes, false);
  assert.equal(check(f.revised, f.ticket).passes, true);
  assert.equal(check(f.verbose, { ...f.ticket, status: 'approved' }).passes, true);
  const state = animation.finalRuleConstruction({ beat: 2, beatP: 0, p: 0 });
  assert.equal(state.reward, 2);
  assert.equal(state.reviewReward, 1);
});

test('the scored-answer transfer stays inside the gap between painted panels', () => {
  for (const progress of [0.0036, 0.05, 0.5, 0.95, 0.999]) {
    const canvas = createCanvas(1920, 1080);
    const frame = drawFrame(
      canvas.getContext('2d'),
      {},
      { id: 'policy-and-judge', title: '' },
      {
        beat: 0,
        beatP: 0.8,
        p: 0.8,
        opacity: 1,
        cues: {
          'score-answer-a': { phase: 'during', progress, targets: [] },
          'policy-write': { phase: 'after', progress: 1, targets: [] },
        },
      },
      animation.draw,
    );
    assert.deepEqual(
      [...frame.issues, ...layoutIssues(frame)],
      [],
      `transfer progress ${progress}`,
    );
  }
});

test('calibration accumulates the fixed four outcomes before displaying their mean', () => {
  const { calibrationConstruction: model } = animation;
  const cues = (build, average) => ({
    cues: {
      'calibration-build': { phase: 'during', progress: build },
      'calibration-average': { phase: average ? 'after' : 'before', progress: average },
    },
  });
  const halfway = model(cues(0.4, 0));
  assert.equal(halfway.count, 1);
  assert.equal(halfway.average, 0);
  assert.equal(halfway.forecasts[0].sum, 0.0625);
  const complete = model(cues(1, 1));
  assert.equal(complete.count, 4);
  assert.equal(complete.forecasts[0].brier, 0.1875);
  assert.ok(Math.abs(complete.forecasts[1].brier - 0.2451) < 1e-12);
});
