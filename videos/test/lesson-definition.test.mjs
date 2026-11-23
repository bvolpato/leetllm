import assert from 'node:assert/strict';
import test from 'node:test';
import { fadeIn, rect } from 'vizmatic/stage';
import {
  defineCanvasLesson,
  defineStageLesson,
  operationProgress,
  resultAfter,
} from '../lib/lesson-definition.mjs';
import { compileStageLesson, estimatedTimeline } from '../lib/stage-lesson.mjs';
import { sampleNarrationCues } from '../lib/narration-cues.mjs';

const scene = (id, cue = 'answer') => ({
  id,
  title: id,
  visual: 'A supplied value reaches its completed result.',
  beats: [
    {
      say: 'The supplied value now becomes the completed answer.',
      hold: 0.4,
      visual_cues: [{ id: cue, phrase: 'completed answer', targets: ['result'] }],
    },
  ],
});
const narration = { id: 'example', title: 'Example', scenes: [scene('first'), scene('second')] };

test('Canvas definitions dispatch to the named scene with the existing draw arguments', () => {
  const calls = [];
  const definitions = narration.scenes.map(({ id }) => ({
    id,
    cues: ['answer'],
    draw(...args) {
      calls.push({ id, args });
      return id;
    },
  }));
  const model = () => 42;
  const definition = defineCanvasLesson({
    id: 'example',
    scenes: definitions,
    validateModel: model,
  });
  definition.validate(narration);
  const args = [{ canvas: 'context' }, narration.scenes[1], { beat: 0 }, { painter: 'audited' }];
  const { draw } = definition;
  assert.equal(draw(...args), 'second');
  assert.deepEqual(calls, [{ id: 'second', args }]);
  assert.equal(definition.validateModel(), 42);
  assert(Object.isFrozen(definition.scenes));
  assert(Object.isFrozen(definition.scenes[0].cues));
  definitions.reverse();
  assert.deepEqual(
    definition.scenes.map((entry) => entry.id),
    ['first', 'second'],
  );
  assert.throws(() => draw({}, { id: 'unwritten' }, {}, {}), /unknown scene unwritten/);
});

test('scene definitions reject duplicate identities and narration mismatches before rendering', () => {
  const draw = () => {};
  assert.throws(() => defineCanvasLesson({ id: 'example', scenes: [] }), /nonempty ordered array/);
  assert.throws(
    () =>
      defineCanvasLesson({
        id: 'example',
        scenes: [
          { id: 'first', draw },
          { id: 'first', draw },
        ],
      }),
    /duplicate scene first/,
  );
  assert.throws(
    () => defineCanvasLesson({ id: 'example', scenes: [{ id: 'first' }] }),
    /draw must be a function/,
  );
  assert.throws(
    () =>
      defineCanvasLesson({
        id: 'example',
        scenes: [{ id: 'first', draw, cues: ['answer', 'answer'] }],
      }),
    /duplicate cue answer/,
  );
  const definition = defineCanvasLesson({
    id: 'example',
    scenes: [
      { id: 'first', draw, cues: ['answer'] },
      { id: 'second', draw },
    ],
  });
  assert.throws(
    () => definition.validate({ ...narration, id: 'different' }),
    /narration belongs to different/,
  );
  assert.throws(
    () => definition.validate({ ...narration, scenes: [...narration.scenes].reverse() }),
    /scene order differs/,
  );
  assert.throws(
    () => definition.validate({ ...narration, scenes: [scene('first', 'other'), scene('second')] }),
    /unknown narration cue answer/,
  );
});

test('operation progress never grants a result before the exact completed cue boundary', () => {
  const cue = {
    id: 'answer',
    phrase: 'answer',
    targets: ['result'],
    start: 1,
    end: 2,
    linger: 0.4,
  };
  for (const [time, progress, complete] of [
    [0.99, 0, false],
    [1, 0, false],
    [1.98, 0.98, false],
    [1.999999, 0.9999990000000001, false],
    [2, 1, true],
    [2.5, 1, true],
  ]) {
    const state = { cues: sampleNarrationCues([cue], time) };
    assert(Math.abs(operationProgress(state, 'answer') - progress) < 1e-12);
    assert.equal(resultAfter(state, 'answer'), complete);
  }
  assert.equal(
    resultAfter({ cues: { answer: { phase: 'during', progress: 1 } } }, 'answer'),
    false,
  );
  assert.throws(() => resultAfter({}, 'answer'), /Unknown narration cue answer/);
  assert.throws(
    () => operationProgress({ cues: { answer: { phase: 'during', progress: NaN } } }, 'answer'),
    /operation progress must be finite/,
  );
  assert.throws(
    () => resultAfter({ cues: { answer: { phase: 'settled', progress: 1 } } }, 'answer'),
    /invalid cue phase settled/,
  );
});

test('Stage composition uses the existing SceneClock and completes on measured cue ends', async () => {
  const calls = [];
  const definition = defineStageLesson({
    id: 'example',
    scenes: narration.scenes.map(({ id }) => ({
      id,
      cues: ['answer'],
      build(stage, clock, metadata) {
        calls.push({ id, clockId: clock.id, title: metadata.title, start: clock.start });
        if (id === 'first') {
          const answer = rect(100, 100, { fill: '#c8102e', stroke: null });
          clock.after('answer', () => stage.play(fadeIn(answer), { duration: 0.02 }));
        } else {
          clock.cue('answer');
        }
      },
    })),
  });
  const timeline = estimatedTimeline(narration);
  const { compiled } = await compileStageLesson(definition, narration, timeline);
  assert.deepEqual(
    calls.map((call) => [call.id, call.clockId, call.title]),
    [
      ['first', 'first', 'first'],
      ['second', 'second', 'second'],
    ],
  );
  assert.equal(calls[0].start, 0);
  assert.equal(calls[1].start, timeline.scenes[0].duration);
  const end = timeline.scenes[0].visualCues.find((cue) => cue.id === 'answer').end;
  assert(!compiled.svg(end - 0.01).includes('rgb(200,16,46)'));
  assert(compiled.svg(end + 0.03).includes('rgb(200,16,46)'));
  assert.equal(compiled.duration, timeline.duration);
});
