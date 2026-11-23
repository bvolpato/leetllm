import { cueAt } from '../cue-clock.mjs';
import { PRUNING_BRANCHES } from '../fixtures.mjs';
import { drawCard } from '../defaults.mjs';

const branches = [PRUNING_BRANCHES.branchA, PRUNING_BRANCHES.branchB];
export function drawFrontierControl(ctx, scene, state, api) {
  api.focus.target('frontier-control-mechanism', () => {
    const { C, text, line } = api,
      beat = state.beat ?? 0;
    const stack = beat === 1 || beat === 2,
      beam = beat === 3;
    const entered = stack
      ? [
          cueAt(state, 'frontier-push-a', 1, 0.25, 0.46),
          cueAt(state, 'frontier-push-b', 1, 0.47, 0.64),
        ]
      : [
          cueAt(state, 'frontier-first', 0, 0.31, 0.42),
          cueAt(state, 'frontier-second', 0, 0.43, 0.55),
        ];
    const pick = stack
      ? cueAt(state, 'frontier-lifo', 2, 0, 0.16)
      : cueAt(state, 'frontier-fifo', 0, 0.69, 0.82);
    const chosen = stack ? 1 : 0;
    text(ctx, beam ? 'Two proposals' : stack ? 'Stack' : 'Queue', 160, 295, 51, C.ink);
    text(ctx, beam ? 'One place in the beam' : 'Next to expand', 1210, 295, 45, C.cyan);
    line(ctx, 160, 337, 900, 337, C.muted, 2);
    line(ctx, 1210, 337, 1770, 337, C.cyan, 2);
    for (const [i, branch] of branches.entries()) {
      const settledY = stack ? 660 - i * 209 : 451 + i * 209;
      const move = !beam && chosen === i ? pick.progress : 0;
      const arrived = beam ? 1 : entered[i].progress;
      if (arrived <= 0) continue;
      const x = 164 + 1050 * move;
      const fromY = settledY + 75 * (1 - arrived);
      const y = fromY + (451 - fromY) * move;
      drawCard(
        ctx,
        api,
        branch.label + '\n' + branch.remaining.join('    '),
        x,
        y,
        570,
        150,
        i ? C.cyan : C.blue,
        39,
      );
    }
    const note = beam
      ? 'Rank the two before choosing.'
      : stack && beat === 1
        ? 'Which one comes off the top?'
        : stack
          ? 'Last in, first out'
          : 'First in, first out';
    text(ctx, note, 960, 953, 42, C.yellow, 'center');
  });
}
export default {
  id: 'frontier-control',
  draw: drawFrontierControl,
  cues: [
    'frontier-first',
    'frontier-second',
    'frontier-fifo',
    'frontier-push-a',
    'frontier-push-b',
    'frontier-lifo',
    'frontier-beam',
  ],
};
