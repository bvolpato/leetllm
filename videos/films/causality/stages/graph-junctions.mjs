import { junctionPathOpen } from '../model.mjs';
import { code, dag, focusProgress, footer, label, node } from '../defaults.mjs';
export function drawGraphJunctions(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1,
    cueProgress = (i) => q('graph-junctions-' + i);
  api.focus.target('cau-graph-junctions-mechanism', () => {
    const kind =
        currentBeat === 0
          ? 'chain'
          : currentBeat === 1
            ? q('collider-shape') > 0
              ? 'collider'
              : 'fork'
            : 'collider',
      conditioned =
        kind === 'chain'
          ? done('condition-mediator')
          : kind === 'fork'
            ? done('condition-fork')
            : done('condition-collider'),
      open = junctionPathOpen(kind, conditioned);
    let nodes, edges;
    if (kind === 'chain') {
      nodes = [
        node(ctx, api, 'a', 'assignment A', 180, 490, themeColors.cyan),
        node(ctx, api, 'm', 'mediator M', 785, 490, themeColors.yellow),
        node(ctx, api, 'y', 'resolution Y', 1390, 490, themeColors.pink),
      ];
      edges = [
        {
          from: 'a',
          to: 'm',
          progress: cueProgress(0),
          color: themeColors.cyan,
        },
        {
          from: 'm',
          to: 'y',
          progress: cueProgress(0),
          color: themeColors.yellow,
        },
      ];
    } else if (kind === 'fork') {
      nodes = [
        node(ctx, api, 'c', 'common cause C', 785, 300, themeColors.yellow),
        node(ctx, api, 'a', 'assignment A', 180, 650, themeColors.cyan),
        node(ctx, api, 'y', 'resolution Y', 1390, 650, themeColors.pink),
      ];
      edges = [
        {
          from: 'c',
          to: 'a',
          progress: 1,
          color: themeColors.yellow,
        },
        {
          from: 'c',
          to: 'y',
          progress: 1,
          color: themeColors.yellow,
        },
      ];
    } else {
      nodes = [
        node(ctx, api, 'a', 'assignment A', 180, 340, themeColors.cyan),
        node(ctx, api, 'y', 'resolution Y', 1390, 340, themeColors.pink),
        node(ctx, api, 'k', 'common effect K', 785, 680, themeColors.yellow),
      ];
      edges = [
        {
          from: 'a',
          to: 'k',
          progress: 1,
          color: themeColors.cyan,
        },
        {
          from: 'y',
          to: 'k',
          progress: 1,
          color: themeColors.pink,
        },
      ];
    }
    dag(
      ctx,
      api,
      nodes,
      edges.map((e) => ({
        ...e,
        color: open ? e.color : themeColors.muted,
      })),
    );
    label(ctx, api, kind.toUpperCase(), 960, 255, themeColors.ink, 35);
    const n = nodes.find(
      (n) =>
        n.id ===
        {
          chain: 'm',
          fork: 'c',
          collider: 'k',
        }[kind],
    );
    if (conditioned)
      api.rect(ctx, n.x - 18, n.y - 18, n.width + 36, n.height + 36, null, themeColors.green, 15);
    label(
      ctx,
      api,
      conditioned
        ? 'Conditioned on ' +
            {
              chain: 'M',
              fork: 'C',
              collider: 'K',
            }[kind]
        : 'No junction conditioned',
      960,
      855,
      themeColors.yellow,
      31,
    );
    label(
      ctx,
      api,
      open ? 'This path is open' : 'This path is blocked',
      960,
      920,
      open ? themeColors.pink : themeColors.green,
      35,
    );
    if (currentBeat === 2 && done('cancel-paths'))
      code(
        ctx,
        api,
        'Possible contributions: +δ + (−δ) = 0',
        960,
        960,
        31,
        themeColors.yellow,
        'center',
      );
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'An open path permits dependence; cancellation can still yield zero association.'
        : 'A mediator, a common cause and a common effect have different conditioning rules.',
    );
  });
}
export default {
  id: 'graph-junctions',
  draw: drawGraphJunctions,
  cues: [
    'cau-graph-junctions-0',
    'cau-condition-mediator',
    'cau-graph-junctions-1',
    'cau-condition-fork',
    'cau-condition-collider',
    'cau-collider-shape',
    'cau-graph-junctions-2',
    'cau-cancel-paths',
  ],
};
