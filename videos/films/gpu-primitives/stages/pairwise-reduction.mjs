import { REDUCTION } from '../fixtures.mjs';
import { card, link, text } from '../defaults.mjs';
import { number } from '../score-trace.mjs';
export function drawPairwiseReduction(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.06, 0.94);
  {
    const levels = [
      1,
      currentBeat > 0 ? 1 : api.focus.progress('reduction-neighbor-pairs', phaseForBeat(0)),
      currentBeat < 1
        ? 0
        : currentBeat > 1
          ? 1
          : api.focus.progress('reduction-partial-pairs', api.phase(progress, 0.05, 0.45)),
      currentBeat < 1
        ? 0
        : currentBeat > 1
          ? 1
          : api.focus.progress('reduction-final-add', api.phase(progress, 0.55, 0.95)),
    ];
    const nodes = REDUCTION.map((values, level) =>
      values.map((value, index) => {
        const spacing = 1600 / values.length,
          cx = 160 + (index + 0.5) * spacing;
        return api.focus.target('reduction-level-' + level, () =>
          card(
            ctx,
            api,
            level === 0 || levels[level] >= 1 ? number(value) : '·',
            cx - 60,
            335 + level * 145,
            120,
            level === 3 ? themeColors.green : level ? themeColors.cyan : themeColors.blue,
            levels[level],
            75,
            34,
          ),
        );
      }),
    );
    nodes.slice(1).forEach((parents, level) =>
      parents.forEach((parent, index) => {
        link(ctx, api, nodes[level][2 * index], parent, levels[level + 1]);
        link(ctx, api, nodes[level][2 * index + 1], parent, levels[level + 1]);
      }),
    );
    components.fade(phaseForBeat(2), () =>
      api.focus.target('reduction-counts', () =>
        text(
          ctx,
          api,
          'Three dependency stages   ·   Seven additions   ·   Final score ' + REDUCTION.at(-1)[0],
          960,
          940,
          34,
          themeColors.yellow,
        ),
      ),
    );
  }
}
export default {
  id: 'pairwise-reduction',
  draw: drawPairwiseReduction,
  cues: [
    'reduction-neighbor-pairs',
    'reduction-parallel-partials',
    'reduction-partial-pairs',
    'reduction-final-add',
    'reduction-tree-depth',
    'reduction-work',
  ],
};
