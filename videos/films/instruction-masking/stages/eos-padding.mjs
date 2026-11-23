import { done } from '../construction.mjs';
import { instructionF as focus, instructionT as text } from '../defaults.mjs';

const pieces = ['<A>', 'Open', 'ticket', 'EOS', 'PAD', 'PAD'];
const ids = [2, 3, 4, 5, 5, 5];
const valid = [true, true, true, true, false, false];
const selected = [false, true, true, true, false, false];

export function drawEosPadding(ctx, scene, state, api) {
  const { C } = api;
  const idRule = done(state, 'padding-erase', 0);
  const repaired = done(state, 'padding-keep', 2);
  const showFlags = (state.beat ?? 0) > 0;
  const center = (i) => 495 + i * 234;
  focus(ctx, api, 'ending-slots', () => {
    text(ctx, api, 'Piece', 110, 318, 33, C.muted);
    text(ctx, api, 'Input ID', 110, 434, 33, C.muted);
    for (const [i, piece] of pieces.entries()) {
      text(ctx, api, piece, center(i), 318, 52, C.ink, 'center');
      text(ctx, api, ids[i], center(i), 434, 55, C.ink, 'center');
    }
    api.line(ctx, center(3) - 56, 459, center(5) + 56, 459, C.yellow, 4);
  });
  if (showFlags) {
    focus(ctx, api, 'position-flags', () => {
      for (const [r, [label, bits]] of [
        ['Valid position', valid],
        ['Reply target', selected],
      ].entries()) {
        const y = 545 + r * 78;
        text(ctx, api, label, 110, y, 31, C.muted);
        for (const [i, bit] of bits.entries())
          text(ctx, api, bit ? '1' : '0', center(i), y, 37, bit ? C.ink : C.muted, 'center');
      }
    });
  }
  focus(ctx, api, 'label-row', () => {
    text(ctx, api, 'Label', 110, 775, 36, C.muted);
    for (const [i, id] of ids.entries()) {
      const keep = valid[i] && selected[i] && !(idRule && !repaired && id === 5);
      const unresolved = !idRule && id === 5;
      text(
        ctx,
        api,
        unresolved ? '?' : keep ? id : '−100',
        center(i),
        775,
        54,
        unresolved ? C.yellow : keep ? C.green : C.muted,
        'center',
      );
    }
    const note = repaired
      ? 'Keep a target when its position is valid and its reply span includes it.'
      : showFlags
        ? 'Which of the three fives belongs in the loss?'
        : 'Erase every label whose input ID equals 5';
    text(ctx, api, note, 960, 941, 40, repaired ? C.green : C.yellow, 'center');
  });
}
export default {
  id: 'eos-padding',
  draw: drawEosPadding,
  cues: ['padding-erase', 'padding-question', 'padding-keep'],
};
