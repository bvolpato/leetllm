import { cueProgress, done } from '../construction.mjs';
import { inputStrip, pieces, prefixBracket } from '../conversation.mjs';
import { instructionF as focus, instructionT as text } from '../defaults.mjs';

export function drawShift(ctx, scene, state, api) {
  const { C } = api;
  const located = done(state, 'shift-header', 1);
  const target = done(state, 'shift-ending', 2)
    ? 9
    : done(state, 'shift-happy', 2)
      ? 8
      : done(state, 'shift-is', 2)
        ? 7
        : 6;
  const predictor = target - 1;
  focus(ctx, api, 'input-strip', () => {
    inputStrip(ctx, api);
    api.line(ctx, pieces[target].left + 10, 355, pieces[target].right - 10, 355, C.green, 5);
    if (located) {
      prefixBracket(ctx, api, predictor, 1, 457);
      text(ctx, api, 'Input visible to this prediction', pieces[0].left, 514, 32, C.yellow);
    }
  });
  focus(ctx, api, 'next-pair', () => {
    text(ctx, api, 'Last input in the prefix', 490, 644, 35, C.muted, 'center');
    text(ctx, api, 'Observed next token', 1390, 644, 35, C.green, 'center');
    text(ctx, api, located ? pieces[predictor].token : '?', 490, 786, 88, C.yellow, 'center');
    api.arrow(ctx, 750, 750, 1140, 750, C.yellow, 6);
    text(ctx, api, pieces[target].token, 1390, 786, 88, C.ink, 'center');
    text(
      ctx,
      api,
      located ? 'position ' + predictor : 'Which position?',
      490,
      862,
      34,
      C.yellow,
      'center',
    );
    text(ctx, api, 'position ' + target, 1390, 862, 34, C.green, 'center');
  });
  if (cueProgress(state, 'shift-contract', 3) > 0) {
    focus(ctx, api, 'shift-contract', () =>
      text(
        ctx,
        api,
        'Internal shift   ·   pass labels aligned with the input IDs',
        960,
        987,
        36,
        C.ink,
        'center',
      ),
    );
  }
}
export default {
  id: 'shift',
  draw: drawShift,
  cues: [
    'shift-question',
    'shift-header',
    'shift-is',
    'shift-happy',
    'shift-ending',
    'shift-contract',
  ],
};
