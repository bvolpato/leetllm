import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame, C } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { binomialMass } from '../films/estimation/model.mjs';
import {
  weeklySample,
  weeklyQueue,
  wilson,
  scoreStatistic,
  introFrame,
  scoreFrame,
  bootstrapFrame,
  bootstrapSamples,
  priorFrame,
  decisionFrame,
  designFrame,
  draw,
  validateModel,
} from '../animations/estimation.mjs';
registerLessonFonts();
const cue = (id, progress, targets) => ({
  [id]: {
    progress,
    active: progress > 0 && progress < 1,
    strength: progress > 0 && progress < 1 ? 1 : 0,
    phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
    targets,
    color: 'yellow',
  },
});
const state = (beat, cues) => ({ beat, beatP: 0.5, cues, t: 8, duration: 20, opacity: 1 });
function render(id, s) {
  const canvas = createCanvas(1920, 1080),
    frame = drawFrame(canvas.getContext('2d'), {}, { id, title: 'Estimation' }, s, draw);
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return { ...frame, canvas };
}
function colorPixels(canvas, region, color) {
  const rgb = color
    .slice(1)
    .match(/../g)
    .slice(0, 3)
    .map((v) => parseInt(v, 16));
  const data = canvas.getContext('2d').getImageData(...region).data;
  let n = 0;
  for (let i = 0; i < data.length; i += 4)
    if (rgb.every((v, j) => Math.abs(data[i + j] - v) < 10)) n++;
  return n;
}

test('the uniform distinct-ID toy audit retains outcomes and the sample estimate waits for completed review', () => {
  assert.equal(validateModel(), true);
  assert.equal(new Set(weeklySample.map((r) => r.id)).size, 400);
  assert.deepEqual(
    [5, 100, 400].map((n) => weeklySample.slice(0, n).filter((r) => r.specialist).length),
    [1, 16, 64],
  );
  const opening = introFrame(state(0, {}));
  const beforeExpansion = introFrame(
    state(1, { ...cue('sample-draw', 0, []), ...cue('sample-label', 0, []) }),
  );
  for (const frame of [opening, beforeExpansion]) {
    assert.deepEqual([frame.drawn, frame.labeled, frame.k], [5, 5, 1]);
  }
  const partial = introFrame(
    state(1, {
      ...cue('sample-draw', 1, []),
      ...cue('sample-label', 0.5, []),
      ...cue('sample-fraction', 0, []),
    }),
  );
  assert.equal(partial.drawn, 100);
  assert.equal(partial.labeled, 5 + Math.floor(95 / 2));
  assert.equal(partial.estimate, null);
  const held = introFrame(state(2, {}));
  assert.deepEqual([held.drawn, held.labeled, held.k, held.estimate], [100, 100, 16, 0.16]);
});

test('Wilson endpoints invert the actual candidate score, including both binary boundaries', () => {
  for (const [k, n] of [
    [16, 100],
    [0, 10],
    [10, 10],
    [64, 400],
  ]) {
    const v = wilson(k, n);
    for (let i = 1; i < 1000; i++) {
      const p = i / 1000;
      assert.equal(scoreStatistic(k, n, p) <= 1.96, p >= v.low && p <= v.high);
    }
  }
  assert.equal(wilson(0, 10).low, 0);
  assert.equal(wilson(10, 10).high, 1);
  assert(Math.abs(scoreStatistic(16, 100, wilson(16, 100).low) - 1.96) < 1e-10);
  assert.throws(() => wilson(2, 0), RangeError);
});

test('the candidate construction withholds endpoint values until its projection payoff', () => {
  const middle = render(
    'score-interval',
    state(1, cue('candidate-sweep', 0.5, ['candidate-score'])),
  );
  assert(middle.labels.some((l) => l.text.includes('ACCEPT')));
  assert(!middle.labels.some((l) => l.text.startsWith('Wilson ')));
  const partial = render(
    'score-interval',
    state(2, {
      ...cue('score-project', 1, []),
      ...cue('score-endpoints', 0.5, ['wilson-interval']),
    }),
  );
  assert(partial.labels.some((l) => l.text === 'accepted candidates → interval'));
  const held = render(
    'score-interval',
    state(2, { ...cue('score-project', 1, []), ...cue('score-endpoints', 1, []) }),
  );
  assert(held.labels.some((l) => l.text === 'Wilson 10.1% – 24.4%'));
  const f = scoreFrame(state(1, cue('candidate-sweep', 0.5, [])));
  assert(f.fits);
  assert(f.acceptedHigh <= f.interval.high);
});

test('bootstrap keeps one original identity in duplicate draws and deposits only completed resamples', () => {
  const duplicated = render(
    'resampling',
    state(0, { ...cue('bootstrap-duplicate', 1, []), ...cue('bootstrap-complete', 0, []) }),
  );
  const id = weeklySample[bootstrapSamples[0][0]].id;
  assert.equal(bootstrapSamples[0][0], bootstrapSamples[0][1]);
  assert.equal(
    duplicated.labels.filter((l) => l.text === id).length,
    3,
    'the original card and both actual draws must retain the same ID',
  );
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const f = bootstrapFrame(state(1, cue('bootstrap-histogram', p, [])));
    assert.equal(
      f.bins.reduce((sum, n) => sum + n, 0),
      f.completedResamples,
    );
    const expected = bootstrapSamples
      .slice(0, f.completedResamples)
      .map((ids) => ids.filter((i) => weeklySample[i].specialist).length);
    for (let successes = 0; successes < 35; successes++)
      assert.equal(f.bins[successes], expected.filter((k) => k === successes).length);
  }
});

test('the prior mode is computed from separate fixed prior terms and actual growing observed counts', () => {
  const small = priorFrame(state(0, cue('prior-terms', 1, []))),
    large = priorFrame(state(1, cue('prior-data', 1, [])));
  assert.deepEqual([small.k, small.n, small.map], [1, 5, 2 / 7]);
  assert.deepEqual([large.k, large.n, large.map], [16, 100, 17 / 102]);
  assert(Math.abs(large.map - large.mle) < Math.abs(small.map - small.mle));
  assert.notEqual(large.map, 18 / 104, 'the mode must stay distinct from the posterior mean');
});

test('weighted slice contributions use the actual shares and rates while the original queue remains separate', () => {
  const f = designFrame(state(2, {}));
  assert.deepEqual(f.contributions, [84, 50, 42]);
  assert.equal(f.total / 1000, 0.176);
  assert.equal(weeklyQueue.specialist / weeklyQueue.size, 0.18);
  const native = render(
    'sample-design',
    state(1, {
      ...cue('weight-routine', 1, []),
      ...cue('weight-billing', 1, []),
      ...cue('weight-account', 1, []),
      ...cue('weighted-total', 1, []),
    }),
  );
  const bars = native.shapes.filter((s) => s.kind === 'rect' && s.height === 75);
  assert.deepEqual(
    bars.map((s) => s.width).sort((a, b) => b - a),
    [336, 200, 168],
  );
  const equation = native.labels.find((l) => l.kind === 'math' && l.text.includes('84')).text;
  const terms = equation.match(
    /^\\frac\{([\d+]+)\}\{(\d+)\}=\\frac\{(\d+)\}\{(\d+)\}=([\d.]+)\\%$/,
  );
  assert(
    terms,
    'the painted sum must be divided by the message denominator before equating it with a rate',
  );
  const left =
    terms[1]
      .split('+')
      .map(Number)
      .reduce((a, n) => a + n, 0) / Number(terms[2]);
  assert.equal(left, Number(terms[3]) / Number(terms[4]));
  assert(Math.abs(left - Number(terms[5]) / 100) < 1e-12);
  const biased = render(
    'sample-design',
    state(0, { ...cue('biased-selection', 1, []), ...cue('biased-precision', 1, []) }),
  );
  assert(
    !biased.labels.some((l) => l.text.includes('17.6')),
    'the queue-wide answer must wait for the weighted construction',
  );
  const repaired = render('sample-design', state(2, cue('design-repair', 1, [])));
  assert(repaired.labels.some((l) => l.text === 'new plan · all three categories eligible'));
  assert(repaired.labels.some((l) => l.text === 'old sample · 400 routine labels'));
});

test('the fixed-sample staffing decision precedes a genuinely covered census and a computed capacity payoff', () => {
  const planned = decisionFrame(state(0, cue('planned-audit', 1, [])));
  assert.equal(planned.reviewed, 400);
  assert.equal(planned.auditKnown, false);
  assert.equal(planned.choice, null);
  const chosen = decisionFrame(
    state(1, { ...cue('final-interval', 1, []), ...cue('staffing-choice', 1, []) }),
  );
  assert.equal(chosen.choice, 'Regular staffing');
  assert(chosen.interval.high < 0.2);
  assert.equal(chosen.outcome, null);
  const decision = render(
    'report',
    state(1, { ...cue('final-interval', 1, []), ...cue('staffing-choice', 1, []) }),
  );
  assert(
    colorPixels(decision.canvas, [1410, 565, 220, 40], C.green) > 100,
    'the close-up must paint the actual upper edge',
  );
  assert.equal(
    colorPixels(decision.canvas, [1635, 565, 18, 40], C.green),
    0,
    'the magnified interval must visibly stop before the staffing threshold',
  );
  assert(
    colorPixels(decision.canvas, [1655, 520, 10, 130], C.pink) > 300,
    'the same threshold must remain painted in the close-up',
  );
  const partial = render(
    'report',
    state(2, { ...cue('week-outcome', 0.5, ['week-outcome']), ...cue('capacity-payoff', 0, []) }),
  );
  assert(partial.labels.some((l) => l.text === 'Full toy week · outcome covered'));
  assert(!partial.labels.some((l) => l.text.includes('18,000')));
  assert.equal(colorPixels(partial.canvas, [280, 565, 1080, 120], C.yellow), 0);
  const held = render(
    'report',
    state(2, { ...cue('week-outcome', 1, []), ...cue('capacity-payoff', 1, []) }),
  );
  assert(held.labels.some((l) => l.text.includes('18,000 specialist cases')));
  assert(held.labels.some((l) => l.text === '2,000 cases of spare capacity in this toy week'));
  assert(colorPixels(held.canvas, [280, 565, 1080, 120], C.yellow) > 80000);
});

test('population captions and bootstrap counters name the evidence currently drawn', () => {
  const before = render('target-and-missing', state(0, cue('target-flagged-comparison', 0, [])));
  const after = render('target-and-missing', state(0, cue('target-flagged-comparison', 1, [])));
  for (const frame of [before, after])
    assert(frame.labels.some((l) => l.text === 'Estimand: unknown specialist share'));
  assert(!before.labels.some((l) => l.text.includes('abuse among flags')));
  assert(after.labels.some((l) => l.text.includes('Separate article example: abuse among flags')));
  for (const p of [0.02, 0.5, 0.99]) {
    const frame = render('cluster-evidence', { ...state(1, {}), beatP: p });
    const owners = frame.labels.filter((l) => /^G\d+$/.test(l.text));
    const positives = owners.filter((l) => l.text === 'G1' || l.text === 'G2').length;
    assert(
      frame.labels.some((l) =>
        l.text.startsWith(
          `Shown redraw: ${positives} positive campaign copies out of ${owners.length}`,
        ),
      ),
    );
    if (owners.length < 2) assert(!frame.labels.some((l) => l.text.startsWith('G2 appears twice')));
  }
  const drawn = render(
    'resampling',
    state(0, { ...cue('bootstrap-duplicate', 1, []), ...cue('bootstrap-complete', 1, []) }),
  );
  assert(drawn.labels.some((l) => l.text === '0 deposited resamples'));
  assert(drawn.labels.some((l) => l.text.startsWith('100 draws')));
});

test('the likelihood curve reaches unit mass at the all-positive boundary', () => {
  assert.deepEqual(binomialMass(10, 1), [...Array(10).fill(0), 1]);
  const nearBoundary = binomialMass(100, 0.99999);
  assert(Math.abs(nearBoundary.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
  assert(Math.abs(nearBoundary[100] - 0.99999 ** 100) < 1e-12);
});
