import { phraseEnded, phraseProgress } from '../arithmetic.mjs';
import { text } from '../defaults.mjs';

export function drawAssistantTraining(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat;
  const stages = ['GPT-1', 'GPT-2', 'GPT-3', 'InstructGPT'];
  stages.forEach((s, i) => {
    const x = 260 + i * 445;
    text(ctx, api, s, x, 305, 40, i === Math.min(b, 3) ? C.yellow : C.muted);
    if (i === Math.min(b, 3)) api.line(ctx, x, 333, x + 127, 333, C.yellow, 3);
  });
  if (b < 3) {
    const demo = b === 2 && phraseProgress(state, 'add-demo', 0.1, 0.45) > 0;
    text(ctx, api, b === 0 ? 'Task adaptation' : 'Task input', 235, 462, 32, C.muted);
    api.focus.target('stage-input', () => {
      text(
        ctx,
        api,
        b === 0 ? 'Labeled training notes' : 'Classify this review note.',
        235,
        555,
        50,
      );
      if (demo) text(ctx, api, 'Stale guide → Docs', 235, 666, 46, C.blue);
      text(
        ctx,
        api,
        b === 0 ? 'Stale guide → Docs' : 'Old CLI flag in README → ?',
        235,
        802,
        47,
        C.ink,
      );
    });
    api.line(ctx, 1040, 453, 1040, 843, C.muted, 2);
    api.focus.target('stage-weights', () => {
      text(ctx, api, 'Parameters', 1135, 462, 32, C.muted);
      text(
        ctx,
        api,
        b === 0 ? 'Fine-tune on labels' : 'Fixed at inference',
        1135,
        637,
        47,
        b === 0 ? C.yellow : C.green,
      );
    });
    return;
  }
  api.text(ctx, 'RUN-842   /   auth_fixture_test.py:41', 200, 469, 46, C.blue, 'left', 'mono');
  api.focus.target('logged-fact', () =>
    text(ctx, api, 'expired auth fixture', 200, 582, 66, C.yellow),
  );
  api.line(ctx, 200, 638, 1700, 638, C.muted, 2);
  if (b === 3) {
    api.focus.target('ranked-answers', () => {
      text(ctx, api, 'A    Line 41 reports an expired fixture.', 230, 747, 44);
      text(ctx, api, 'B    The machine clock jumped.', 230, 842, 44);
      if (phraseEnded(state, 'prefer-report', 0.55))
        text(ctx, api, 'Preferred', 1450, 747, 36, C.green);
    });
    text(
      ctx,
      api,
      'Demonstrations  →  human comparisons  →  reward model  →  policy update',
      960,
      982,
      32,
      C.muted,
      'center',
    );
  } else {
    text(ctx, api, 'Cause proposed', 240, 740, 32, C.muted);
    text(ctx, api, 'Clock skew', 240, 840, 54);
    text(ctx, api, 'Evidence needed', 1050, 740, 32, C.muted);
    text(ctx, api, 'Clock and expiry times', 1050, 840, 49, C.cyan);
  }
}

export default {
  id: 'assistant-training',
  draw: drawAssistantTraining,
  cues: ['adapt-weights', 'zero-shot', 'add-demo', 'prefer-report', 'trace-claim'],
};
