import { cueAmount } from '../construction.mjs';
import { card, target, text } from '../defaults.mjs';

export function drawEvidenceFailure(ctx, scene, state, api) {
  const { C } = api,
    beat = state.beat ?? 0;
  if (beat < 2) {
    const source = cueAmount(state, 0, 'policy-open', 0.4, 0.65);
    const trace = cueAmount(state, 1, 'policy-trace', 0.2, 0.47);
    text(ctx, api, 'Free-tier requests are …', 160, 326, 58, C.ink);
    target(ctx, api, 'policy-model', () => {
      text(ctx, api, 'Model completion', 160, 469, 35, C.muted);
      card(ctx, api, 'unlimited', 160, 508, 690, 99, C.blue, 46);
      api.rect(ctx, 160, 647, 690, 49, C.panel, C.muted, 2);
      api.rect(ctx, 160, 647, 690 * 0.75, 49, C.blue);
      text(ctx, api, '75% of next-token probability', 160, 756, 32, C.blue);
    });
    target(ctx, api, 'policy-document', () => {
      text(ctx, api, 'Current policy, v2', 1050, 469, 35, C.muted);
      card(
        ctx,
        api,
        source === 1 ? '60 requests per minute' : 'Open policy',
        1050,
        508,
        710,
        99,
        C.green,
        43,
      );
    });
    if (beat === 1)
      target(ctx, api, 'policy-trace', () => {
        text(ctx, api, 'Application trace', 1050, 686, 33, C.ink);
        if (trace > 0) {
          text(ctx, api, 'Retrieved passage', 1050, 755, 34, C.muted);
          card(ctx, api, 'v1', 1430, 699, 150, 72, C.pink, 40);
        }
        if (trace === 1)
          text(ctx, api, 'Check which version reached the prompt.', 160, 917, 42, C.yellow);
      });
    return;
  }

  const showB = cueAmount(state, 2, 'retries-change', 0.46, 0.68) > 0;
  const answerA = cueAmount(state, 2, 'retries-first', 0.19, 0.37) === 1;
  const answerB = cueAmount(state, 3, 'retries-second', 0.03, 0.29) === 1;
  function program(x, initial, operation, answer, result, color) {
    const lines = ['retries = ' + initial, 'retries ' + operation, 'print(retries)'];
    for (const [i, line] of lines.entries())
      text(ctx, api, line, x, 363 + i * 84, 48, i < 2 ? color : C.ink);
    api.line(ctx, x, 579, x + 595, 579, C.muted, 2);
    text(ctx, api, 'Python prints', x, 671, 35, C.muted);
    text(
      ctx,
      api,
      answer ? String(result) : '?',
      x + 514,
      683,
      61,
      answer ? C.green : C.muted,
      'center',
    );
  }
  target(ctx, api, 'retries-original', () => {
    program(210, 3, '-= 1', answerA, 2, C.blue);
    if (answerA) text(ctx, api, 'Supplied completion   2', 210, 817, 38, C.ink);
  });
  target(ctx, api, 'retries-new', () => {
    text(ctx, api, 'Changed program', 1025, 260, 32, C.muted);
    if (showB) program(1025, 7, '+= 2', answerB, 9, C.yellow);
    if (answerB) text(ctx, api, 'Model completion   ?', 1025, 817, 38, C.ink);
  });
}

export default {
  id: 'evidence-failure',
  draw: drawEvidenceFailure,
  cues: [
    'policy-prediction',
    'policy-open',
    'policy-trace',
    'retries-first',
    'retries-change',
    'retries-second',
  ],
};
