import { distance } from '../arithmetic.mjs';
import { QUERY } from '../fixtures.mjs';
import { retainedTrace } from '../model.mjs';
import { text } from '../defaults.mjs';
import { corpus, passage } from '../neighborhood.mjs';
import { cueProgress } from '../construction.mjs';
export function drawGreedyHops(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api, beat = state.beat ?? 0;
  {
    if (beat === 2) {
      const stopped = retainedTrace(1).at(-1);
      text(
        ctx,
        api,
        'A separate three-node counterexample',
        960,
        290,
        32,
        themeColors.muted,
        'center',
      );
      teaching.flowGraph({
        nodes: [
          {
            id: 'entry',
            label: 'E · score 1.0',
            x: 160,
            y: 450,
            width: 400,
            height: 110,
            color: themeColors.yellow,
            focusTarget: 'graph-hop',
          },
          {
            id: 'bridge',
            label: 'M · score 2.0',
            x: 760,
            y: 450,
            width: 400,
            height: 110,
            color: themeColors.pink,
            focusTarget: 'graph-hop',
          },
          {
            id: 'hidden',
            label: 'H · unscored',
            x: 1360,
            y: 450,
            width: 400,
            height: 110,
            color: themeColors.green,
            focusTarget: 'graph-hop',
          },
        ],
        edges: [
          {
            from: 'entry',
            to: 'bridge',
            color: themeColors.pink,
          },
          {
            from: 'bridge',
            to: 'hidden',
            color: themeColors.muted,
          },
        ],
      });
      text(ctx, api, 'Retained', 360, 625, 30, themeColors.yellow, 'center');
      text(ctx, api, 'Worse neighbor · reject', 960, 625, 30, themeColors.pink, 'center');
      text(ctx, api, 'Beyond the bridge', 1560, 625, 30, themeColors.green, 'center');
      api.focus.target('distance-ledger', () => {
        text(ctx, api, '2.0 > 1.0 → stop at E', 960, 740, 42, themeColors.yellow, 'center');
        text(
          ctx,
          api,
          `Distances evaluated: ${stopped.comparisons}/3 · H requires first expanding M`,
          960,
          835,
          30,
          themeColors.cyan,
          'center',
        );
      });
      return;
    }
    const nodes = ['E', 'C', 'A'].map(passage);
    const hops = ['hop-to-c', 'hop-to-a'].map((cue) => cueProgress(state, cue));
    const completed = hops.filter((p) => p === 1).length;
    const route = hops.map((p, i) => [nodes[i], nodes[i + 1], p]);
    api.focus.target('graph-hop', () => {
      corpus(ctx, api, { scanned: nodes.slice(0, completed + 1).map((p) => p.id), route });
      text(ctx, api, 'Distance to query (squared)', 1220, 308, 34, themeColors.muted);
      nodes.slice(0, completed + 1).forEach((n, i) => {
        text(ctx, api, n.id, 1275, 467 + i * 145, 52, themeColors.ink);
        text(ctx, api, distance(n, QUERY).toFixed(2), 1690, 467 + i * 145, 52, themeColors.cyan, 'right');
      });
    });
    api.focus.target('distance-ledger', () => text(ctx, api,
      'Distinct passage distances scored     ' + (completed + 1) + ' / 6',
      960, 985, 41, themeColors.yellow, 'center'));
  }
}
export default {
  id: 'greedy-hops',
  draw: drawGreedyHops,
  cues: ['greedy-hops-b1-1', 'hop-to-c', 'hop-to-a', 'greedy-hops-b3-1'],
};
