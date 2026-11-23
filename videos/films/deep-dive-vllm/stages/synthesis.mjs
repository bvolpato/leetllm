import { vvProgress } from '../construction.mjs';
import { firstTokenRuler } from '../first-token.mjs';
import { tokenCell } from '../defaults.mjs';

const durations = [20, 80, 40, 10];

export function drawSynthesis(ctx, scene, state, api) {
  const { C } = api;
  const p = (id, beat) => vvProgress(state, 'synthesis-' + id, beat);
  const elapsed = durations.reduce(
    (sum, duration, i) => sum + duration * p(['input', 'queue', 'prefill', 'deliver'][i], 0),
    0,
  );
  const first = p('first-attempt', 1) > 0;
  const second = p('second-attempt', 1) > 0;
  const handed = p('handoff', 2) > 0;
  api.focus.target('synthesis-clock', () => {
    api.text(ctx, 'R1   ·   arrival to first token', 125, 269, 43, C.ink);
    api.text(ctx, 'Illustrative request trace', 1795, 266, 29, C.muted, 'right');
    firstTokenRuler(ctx, api, durations, elapsed, 390);
  });
  if (state.beat === 0 && p('question', 0) > 0)
    api.focus.target('synthesis-question', () =>
      api.text(
        ctx,
        'Which interval would you investigate first?',
        960,
        810,
        45,
        C.yellow,
        'center',
      ),
    );
  if (state.beat >= 1) {
    api.focus.target('synthesis-attempts', () => {
      api.text(
        ctx,
        'Engine core   ·   R1 asks for all 5 remaining prompt positions',
        145,
        675,
        35,
        C.ink,
      );
      for (const [i, visible] of [first, second].entries()) {
        if (!visible) continue;
        const y = 724 + i * 101;
        api.text(ctx, i === 0 ? '20 ms' : '100 ms', 160, y + 50, 33, C.ink);
        tokenCell(api, '5 of 5 inputs fit', 365, y, 410, 72, C.blue);
        tokenCell(
          api,
          i === 0 ? '2 blocks needed / 1 free' : '2 blocks needed / 2 free',
          815,
          y,
          570,
          72,
          i === 0 ? C.yellow : C.green,
        );
        api.text(
          ctx,
          i === 0 ? 'Wait' : 'Issue work',
          1460,
          y + 51,
          36,
          i === 0 ? C.yellow : C.green,
        );
      }
    });
  }
  if (handed)
    api.focus.target('synthesis-handoff', () =>
      api.text(
        ctx,
        'Worker receives   R1   /   5 inputs   /   table [12, 73, 90]',
        960,
        1008,
        39,
        C.cyan,
        'center',
      ),
    );
}

export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'synthesis-input',
    'synthesis-queue',
    'synthesis-prefill',
    'synthesis-deliver',
    'synthesis-question',
    'synthesis-first-attempt',
    'synthesis-second-attempt',
    'synthesis-handoff',
  ],
};
