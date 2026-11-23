import { cueAt } from '../cue-clock.mjs';
import { drawCard } from '../defaults.mjs';

export function drawScratchpadCompute(ctx, scene, state, api) {
  api.focus.target('scratchpad-compute-mechanism', () => {
    const { C, text, line } = api;
    const pass = cueAt(state, 'scratch-pass', 0, 0.25, 0.37);
    const proposed = cueAt(state, 'scratch-token', 0, 0.38, 0.52).done;
    const append = cueAt(state, 'scratch-append', 0, 0.53, 0.66);
    const next = cueAt(state, 'scratch-read', 0, 0.67, 0.86);
    text(ctx, 'Retained prefix', 170, 289, 38, C.muted);
    ['6', '−', '4', '='].forEach((symbol, i) =>
      drawCard(ctx, api, symbol, 170 + 143 * i, 350, 118, 100, C.blue, 52),
    );
    line(ctx, 170, 487, append.done ? 860 : 723, 487, C.blue, 3);
    if (pass.started && (!append.started || next.started))
      api.arrow(ctx, append.done ? 801 : 646, 499, 645, 569, C.blue, 3);
    text(ctx, 'Decoder layers', 169, 650, 40, C.ink);
    for (let i = 0; i < 3; i++) {
      const active = pass.progress >= (i + 1) / 3 || next.started;
      drawCard(
        ctx,
        api,
        String(i + 1),
        587 + 186 * i,
        583,
        115,
        100,
        active ? C.cyan : C.muted,
        40,
      );
      if (i < 2) line(ctx, 719 + 186 * i, 633, 754 + 186 * i, 633, C.muted, 3);
    }
    if (!append.started) text(ctx, 'Proposed token', 1485, 533, 36, C.muted, 'center');
    if (proposed) {
      const x = 1426 + (742 - 1426) * append.progress,
        y = 583 + (350 - 583) * append.progress;
      drawCard(ctx, api, '2', x, y, 118, 100, C.yellow, 52);
    }
    if (next.done) {
      api.arrow(ctx, 1151, 633, 1334, 633, C.cyan, 3);
      drawCard(ctx, api, 'Next token?', 1345, 583, 280, 100, C.blue, 35);
    }
    const beat = state.beat ?? 0;
    text(
      ctx,
      beat === 2
        ? 'Capacity under stated assumptions   ·   Task accuracy needs a separate evaluation'
        : beat === 1
          ? 'Cached prefix   +   one more pass for each new token'
          : next.done
            ? 'The next prediction can read the 2.'
            : 'One decoder pass proposes one token.',
      960,
      909,
      beat === 2 ? 34 : 40,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'scratchpad-compute',
  draw: drawScratchpadCompute,
  cues: [
    'scratch-pass',
    'scratch-token',
    'scratch-append',
    'scratch-read',
    'scratch-cache',
    'scratch-capacity',
  ],
};
