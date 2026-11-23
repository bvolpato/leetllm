import { arithmeticEvaluation } from '../arithmetic.mjs';
import { spokenProgress } from '../drawing.mjs';

export function drawEvaluate(ctx, scene, state, api) {
  const { C } = api;
  const p = spokenProgress(api, state);
  const fitted = state.beat > 0 || api.phase(state.beatP, 0.18, 0.76) >= 0.5;
  const trainingCase = arithmeticEvaluation().training;
  const answer = fitted ? trainingCase.policyAnswer : trainingCase.initialPolicyAnswer;
  const result = arithmeticEvaluation(answer);
  const compared = p('evaluate-b1-2', 0, 0.18, 0.32) > 0;
  const worker = p('evaluate-b2-1', 1, 0.08, 0.34);
  const slots = p('evaluate-b2-2', 1, 0.49, 0.73);
  api.focus.target('training-outcome', () => {
    api.text(ctx, 'Training prompt', 170, 303, 36, C.muted);
    api.text(ctx, '14 × 12 = ' + trainingCase.expected, 170, 420, 54, C.ink);
    api.text(
      ctx,
      'Toy policy ' + (fitted ? 'after' : 'before') + ' training',
      170,
      532,
      31,
      C.muted,
    );
    api.text(ctx, String(answer), 170, 662, 82, C.blue);
    api.text(ctx, 'Verifier reward: ' + result.training.reward + ' / 1', 170, 774, 36, C.ink);
  });
  if (compared)
    api.focus.target('held-out-outcomes', () => {
      api.text(ctx, 'New inputs   ·   same policy output', 714, 303, 38, C.ink);
      result.heldOut.forEach((test, i) => {
        const yy = 415 + i * 205;
        const [workers, perWorker] = test.factors;
        const emphasis = i ? slots : worker;
        api.focus.target(i ? 'missing-slots' : 'missing-worker', () => {
          for (let w = 0; w < 14; w++)
            for (let s = 0; s < 12; s++) {
              const retained = w < workers && s < perWorker;
              const x = 726 + w * 25,
                y = yy - 37 + s * 11;
              api.circle(
                ctx,
                x,
                y,
                3.8,
                retained ? C.blue : C.panel,
                retained ? undefined : emphasis > 0 ? C.yellow : C.muted,
                1,
              );
            }
          api.text(ctx, workers + ' × ' + perWorker + ' = ' + test.expected, 1150, yy, 45, C.ink);
          if (emphasis > 0)
            api.text(
              ctx,
              '−' + (trainingCase.expected - test.expected) + ' slots',
              1630,
              yy,
              31,
              C.yellow,
            );
        });
        api.text(
          ctx,
          'Policy answer ' + test.policyAnswer + ' · reward ' + test.reward,
          1150,
          yy + 77,
          32,
          C.red,
        );
      });
      api.text(
        ctx,
        'Held-out accuracy: ' +
          result.heldOut.filter((row) => row.reward === 1).length +
          ' / ' +
          result.heldOut.length,
        714,
        836,
        37,
        C.ink,
      );
    });
  if (state.beat >= 2)
    api.focus.target('evaluation-choice', () => {
      api.text(
        ctx,
        'Test on reserved prompts. Audit the checker and the written steps separately.',
        960,
        959,
        34,
        C.cyan,
        'center',
      );
    });
}
export default {
  id: 'evaluate',
  draw: drawEvaluate,
  cues: ['evaluate-b1-1', 'evaluate-b1-2', 'evaluate-b2-1', 'evaluate-b2-2', 'evaluate-b3-1'],
};
