import { ASSISTANT_TARGETS } from '../fixtures.mjs';
import { done } from '../construction.mjs';
import { inputStrip, pieces } from '../conversation.mjs';
import { instructionF as focus, instructionT as text } from '../defaults.mjs';

export function drawObjectiveChoice(ctx, scene, state, api) {
  const { C } = api;
  const all = done(state, 'objective-full', 1);
  const empty = done(state, 'objective-empty', 2);
  const active = pieces.map((_, i) => !empty && i > 0 && (all || ASSISTANT_TARGETS[i]));
  const count = active.filter(Boolean).length;
  focus(ctx, api, 'input-strip', () => inputStrip(ctx, api));
  focus(ctx, api, 'scored-pieces', () => {
    text(ctx, api, 'Terms in the loss', pieces[0].left, 505, 34);
    for (const [i, { x, token }] of pieces.entries()) {
      if (active[i]) {
        api.line(ctx, x, 529, x, 567, C.green, 3);
        text(ctx, api, token, x, 632, token.startsWith('<') ? 29 : 34, C.green, 'center');
      } else {
        text(ctx, api, '·', x, 628, 38, C.muted, 'center');
      }
    }
  });
  focus(ctx, api, 'loss-divisor', () => {
    text(
      ctx,
      api,
      empty ? 'No eligible targets' : 'Sum of selected token losses',
      510,
      798,
      45,
      C.ink,
      'center',
    );
    api.line(ctx, 146, 829, 874, 829, C.muted, 3);
    text(ctx, api, count + ' scored targets', 510, 914, 52, empty ? C.pink : C.green, 'center');
    text(
      ctx,
      api,
      empty ? 'Reject this row' : all ? 'Full transcript' : 'Assistant replies',
      1320,
      840,
      53,
      empty ? C.pink : C.ink,
      'center',
    );
    text(
      ctx,
      api,
      empty ? 'The mean needs a positive count' : '17 input positions',
      1320,
      917,
      33,
      C.muted,
      'center',
    );
  });
}
export default {
  id: 'objective-choice',
  draw: drawObjectiveChoice,
  cues: ['objective-mean', 'objective-full', 'objective-empty'],
};
