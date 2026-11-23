import assert from 'node:assert/strict';
import test from 'node:test';
import {
  draw,
  releaseAction,
  scoreWords,
} from '../animations/bitter-lesson-compute-over-heuristics.mjs';

test('promotion evidence, route and numeric validation preserve the actual branch order', () => {
  assert.equal(releaseAction('latency', NaN, new Set()), 'latency');
  assert.equal(releaseAction('unknown', 0.99, new Set()), 'human_review_unknown_route');
  assert.equal(releaseAction('promote', NaN, new Set()), 'request_evidence');
  for (const value of [NaN, Infinity, true, '0.98', -0.1, 1.01]) {
    assert.equal(
      releaseAction('promote', value, new Set(['eval_report'])),
      'human_review_invalid_score',
    );
  }
  assert.equal(
    releaseAction('promote', 0.949, new Set(['eval_report'])),
    'human_review_failed_gate',
  );
  assert.equal(releaseAction('promote', 0.95, new Set(['eval_report'])), 'promote');
});

test('positive evidence on two routes does not let label order decide the queue', () => {
  const result = scoreWords('timeout password');
  assert.deepEqual(result.scores, { latency: 1, quality: 0, access: 1 });
  assert.equal(result.route, 'manual_review');
});

test('removing the report holds a neutral prediction until the completed spoken answer', () => {
  const paint = (answer) => {
    const labels = [];
    const cues = {
      'earned-transfer-b2': { phase: 'after', progress: 1 },
      'earned-evidence-verdict': answer,
    };
    const api = {
      C: {
        ink: 'ink',
        panel: 'panel',
        cyan: 'cyan',
        muted: 'muted',
        green: 'green',
        yellow: 'yellow',
        pink: 'pink',
      },
      text: (_ctx, text, _x, _y, _size, color) => labels.push({ text, color }),
      rect() {},
      focus: {
        target: (_id, render) => render(),
        progress: (id, fallback) =>
          cues[id]?.phase === 'after' ? 1 : (cues[id]?.progress ?? fallback),
      },
    };
    draw({}, { id: 'earned-transfer' }, { beat: 1, beatP: 0.6, cues }, api);
    return labels;
  };
  for (const progress of [0, 0.3, 0.99]) {
    const labels = paint({ phase: progress ? 'during' : 'before', progress });
    assert(labels.some((label) => label.text === 'Report marker removed'));
    assert(!labels.some((label) => label.text === 'REQUEST EVIDENCE'));
    assert(
      labels.some(
        (label) => label.text === 'Predict the permitted next action' && label.color === 'ink',
      ),
    );
  }
  const result = paint({ phase: 'after', progress: 1 });
  assert(result.some((label) => label.text === 'REQUEST EVIDENCE' && label.color === 'yellow'));
});
