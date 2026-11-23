import { TRACKS } from '../arithmetic.mjs';
import { drawCard, drawEquation, drawText, withFocus } from '../defaults.mjs';
export function drawSearchLattice(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const reveal = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const track = TRACKS['search-lattice'];
  const snapshot = track?.sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    drawText(
      ctx,
      api,
      `Width ${snapshot.width} · expansion ${snapshot.step} of the same search tree`,
      960,
      278,
      34,
      themeColors.ink,
      'center',
    );
    const root = drawCard(
      ctx,
      api,
      'search-lattice',
      'Mia · start',
      105,
      590,
      200,
      62,
      themeColors.yellow,
      27,
      0.92,
    );
    const columnX = [360, 665, 970, 1275];
    const nodeWidth = 250;
    const nodeHeight = 62;
    const layerHistories = snapshot.history;
    const firstLayer = layerHistories[0];
    const firstRows = firstLayer.expansions;
    const firstY = 600 - ((firstRows.length - 1) * 82) / 2;
    drawText(ctx, api, 'frontier', columnX[0] + nodeWidth / 2, 350, 26, themeColors.cyan, 'center');
    drawText(ctx, api, 'expand 2', columnX[1] + nodeWidth / 2, 350, 26, themeColors.cyan, 'center');
    if (snapshot.step >= 3)
      drawText(
        ctx,
        api,
        'expand 3',
        columnX[2] + nodeWidth / 2,
        350,
        26,
        themeColors.cyan,
        'center',
      );
    if (snapshot.step >= 4)
      drawText(
        ctx,
        api,
        'expand 4',
        columnX[3] + nodeWidth / 2,
        350,
        26,
        themeColors.cyan,
        'center',
      );
    let parentNodes = new Map();
    withFocus(ctx, api, 'search-lattice-simulation-27', () =>
      firstRows.forEach((candidate, index) => {
        const opacity = candidate.status === 'active' ? 0.82 : 0.2;
        const color = candidate.status === 'active' ? themeColors.green : themeColors.muted;
        const shape = drawCard(
          ctx,
          api,
          'search-lattice',
          `${candidate.token} · p=${candidate.probability.toFixed(3)}`,
          columnX[0],
          firstY + index * 82,
          nodeWidth,
          nodeHeight,
          color,
          24,
          opacity,
        );
        teaching.transfer({
          source: {
            shape: root,
            opacity: 0.92,
          },
          target: {
            shape,
            opacity,
          },
          progress: 1,
          color,
          gap: 12,
        });
        if (candidate.status === 'active')
          parentNodes.set(candidate.text, {
            shape,
            opacity,
          });
      }),
    );
    withFocus(ctx, api, 'search-lattice-simulation-29', () =>
      layerHistories.slice(1).forEach((row, layerIndex) => {
        const isCurrent = row.step === snapshot.step;
        const rows = row.expansions;
        const yStart = 600 - ((rows.length - 1) * 76) / 2;
        const nextParents = new Map();
        rows.forEach((candidate, index) => {
          const targetOpacity = isCurrent
            ? reveal(index * 0.035, Math.min(0.9, 0.58 + index * 0.035))
            : candidate.status === 'active'
              ? 0.72
              : candidate.status === 'complete'
                ? 0.32
                : 0.14;
          const color =
            candidate.status === 'active'
              ? themeColors.green
              : candidate.status === 'complete'
                ? themeColors.cyan
                : themeColors.muted;
          const token = candidate.token === 'EOS' ? 'EOS' : candidate.token;
          const label = `${token} ${candidate.conditionalProbability.toFixed(2)}/${candidate.probability.toFixed(3)}`;
          const shape = drawCard(
            ctx,
            api,
            'search-lattice',
            label,
            columnX[layerIndex + 1],
            yStart + index * 76,
            nodeWidth,
            nodeHeight,
            color,
            23,
            targetOpacity,
          );
          const sourceNode = parentNodes.get(candidate.parent);
          if (sourceNode) {
            teaching.transfer({
              source: {
                shape: sourceNode.shape,
                opacity: sourceNode.opacity,
              },
              target: {
                shape,
                opacity: targetOpacity,
              },
              color,
              gap: 12,
            });
          }
          if (candidate.status === 'active')
            nextParents.set(candidate.text, {
              shape,
              opacity: targetOpacity,
            });
        });
        parentNodes = nextParents;
      }),
    );
    drawEquation(
      ctx,
      api,
      String.raw`P(y_{1:t})=\prod_{j=1}^{t}p(y_j\mid y_{<j},x)`,
      960,
      948,
      40,
      themeColors.cyan,
      'center',
    );
  }
}
export default {
  id: 'search-lattice',
  draw: drawSearchLattice,
  cues: [
    'search-lattice-beat-1-focus-1',
    'search-lattice-beat-2-focus-1',
    'search-lattice-beat-3-focus-1',
    'search-lattice-beat-3-focus-2',
  ],
};
