import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawTopology(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('topology', state),
    currentBeat = modelState.b,
    result = (name) => state.cues?.['dep-result-' + name]?.phase === 'after';
  {
    text(
      ctx,
      api,
      modelState.hybrid
        ? 'Hybrid: RDMA rail, then local NVLink forward'
        : 'Direct: one flat logical domain',
      960,
      285,
      39,
      themeColors.yellow,
      'center',
    );
    api.focus.target('topology-panel-topology', () =>
      components.panel({
        x: 140,
        y: 380,
        width: 700,
        height: 390,
        fill: 'transparent',
        stroke: themeColors.blue,
      }),
    );
    components.panel({
      x: 1080,
      y: 380,
      width: 700,
      height: 390,
      fill: 'transparent',
      stroke: themeColors.pink,
    });
    const r0 = api.focus.target('topology-rank-0', () =>
      card(ctx, api, 'Rank 0', 210, 470, 230, themeColors.blue),
    );
    card(ctx, api, 'Rank 1', 530, 620, 230, themeColors.blue);
    const r2 = api.focus.target('topology-rank-2', () =>
        card(ctx, api, 'Rank 2', 1140, 470, 230, themeColors.pink),
      ),
      r3 = api.focus.target('topology-rank-3', () =>
        card(ctx, api, 'Rank 3', 1460, 620, 230, themeColors.pink),
      );
    const link = (id, from, to, progress, color) =>
      api.focus.target(id, () =>
        teaching.transfer({
          source: {
            shape: from,
            opacity: 1,
          },
          target: {
            shape: to,
            opacity: 1,
          },
          progress,
          color,
          particle: {
            radius: 7,
            fill: color,
          },
          margin: 3,
        }),
      );
    if (modelState.hybrid) {
      if (state.cues?.['topology-direct-domain']?.active)
        link('topology-direct-link', r0, r3, 1, themeColors.muted);
      link('topology-rail-link', r0, r2, modelState.railProgress, themeColors.cyan);
      link('topology-local-link', r2, r3, modelState.localProgress, themeColors.pink);
    } else link('topology-direct-link', r0, r3, modelState.directProgress, themeColors.cyan);
    text(ctx, api, 'Node A', 490, 425, 32, themeColors.blue, 'center');
    text(ctx, api, 'Node B', 1430, 425, 32, themeColors.pink, 'center');
    if (currentBeat === 2)
      api.focus.target('topology-byte-ledger', () => {
        text(
          ctx,
          api,
          `Supplied payload: logical ${(modelState.logical / 2 ** 20).toFixed(1)} MiB · remote ${(modelState.remote / 2 ** 20).toFixed(1)} MiB`,
          960,
          850,
          34,
          themeColors.cyan,
          'center',
        );
        text(
          ctx,
          api,
          result('topology-rates')
            ? `Supplied 1 ms interval: logical ${modelState.logicalRate.toFixed(2)} GB/s · remote ${modelState.remoteRate.toFixed(2)} GB/s`
            : 'Supplied 1 ms interval · byte-rate conversion pending',
          960,
          965,
          32,
          result('topology-rates') ? themeColors.green : themeColors.muted,
          'center',
        );
      });
    else
      text(
        ctx,
        api,
        'Logical rank identity survives either physical path',
        960,
        980,
        34,
        themeColors.muted,
        'center',
      );
  }
}
export default {
  id: 'topology',
  draw: drawTopology,
  cues: [
    'topology-direct-domain',
    'topology-rail-hop',
    'topology-beat-1-focus-1',
    'topology-beat-1-focus-2',
    'topology-beat-2-focus-1',
    'topology-beat-2-focus-2',
    'topology-beat-3-focus-1',
    'topology-beat-3-focus-2',
    'dep-result-topology-rates',
  ],
};
