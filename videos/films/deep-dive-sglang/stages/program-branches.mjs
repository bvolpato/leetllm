import { phase } from '../arithmetic.mjs';
import { sgProgress } from '../construction.mjs';
import { arrow, box, cells, footer, title } from '../defaults.mjs';
export function drawProgramBranches(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('program-branches-mechanism', () => {
    title(ctx, api, 'One common prompt · separate branch histories');
    cells(ctx, api, ['system', 'role', 'ticket'], 470, 350, 980, 76, themeColors.cyan);
    const fork = sgProgress(state, 'fork', q),
      join = sgProgress(state, 'join', q),
      left = 525,
      right = 1395;
    [
      [left, 'candidate A', 'feature'],
      [right, 'candidate B', 'theme request'],
    ].forEach(([x, name, v]) => {
      arrow(ctx, api, 960, 435, 960 + (x - 960) * fork, 535, themeColors.cyan);
      box(ctx, api, name, x - 300, 550, 600, 95, themeColors.blue);
      box(
        ctx,
        api,
        fork >= 1 ? v : 'independent state pending',
        x - 300,
        680,
        600,
        90,
        themeColors.green,
      );
      if (join > 0) arrow(ctx, api, x, 785, x + (960 - x) * join, 865, themeColors.green);
    });
    if (join > 0)
      box(ctx, api, 'join · named results remain separate', 560, 870, 800, 80, themeColors.green);
    footer(
      ctx,
      api,
      currentBeat === 0
        ? 'Each branch keeps its own answer'
        : 'One completed program can make several model calls',
    );
  });
}
export default {
  id: 'program-branches',
  draw: drawProgramBranches,
  cues: ['sg-program-branches-beat-0', 'sg-fork', 'sg-join', 'sg-program-branches-beat-1'],
};
