import { math } from '../defaults.mjs';
export function drawShared(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    F = components.fade;
  {
    const words = ['The', 'dog', 'chased', 'the', 'cat'],
      nodes = [0, 1, 2, 3, 4].map((i) => ({
        id: 'time-' + i,
        focusTarget:
          i === 0 ? 'unrolled-cell-0' : i === 4 ? 'unrolled-cell-4' : 'unrolled-cell-' + i,
        label: 'same RNN cell',
        x: 110 + i * 350,
        y: 505,
        width: 250,
        height: 112,
        color: themeColors.cyan,
        fontSize: 30,
      }));
    words.forEach((word, i) => {
      components.card({
        label: word,
        x: 150 + i * 350,
        y: 395,
        width: 170,
        height: 70,
        fill: themeColors.panel,
        stroke: i === 1 ? themeColors.blue : themeColors.cyan,
        textColor: themeColors.ink,
        fontSize: 30,
        padding: 10,
      });
      api.focus.target('state-width', () =>
        api.focus.target('prefix-summary', () =>
          components.card({
            label: 'h' + ['₁', '₂', '₃', '₄', '₅'][i],
            x: 125 + i * 350,
            y: 650,
            width: 220,
            height: 68,
            fill: themeColors.panel,
            stroke: themeColors.yellow,
            textColor: themeColors.yellow,
            fontSize: 29,
            padding: 8,
          }),
        ),
      );
    });
    teaching.flowGraph({
      nodes,
      edges: nodes.slice(0, -1).map((node, i) => ({
        from: node.id,
        to: nodes[i + 1].id,
        progress: 1,
      })),
    });
    api.focus.target('shared-parameter-set', () =>
      components.card({
        label: 'one learned parameter set · reused at every word',
        x: 480,
        y: 742,
        width: 960,
        height: 82,
        fill: themeColors.panel,
        stroke: themeColors.yellow,
        textColor: themeColors.yellow,
        fontSize: 30,
        padding: 12,
      }),
    );
    api.focus.target('input-weight-map', () =>
      math(
        ctx,
        api,
        String.raw`W_{xh}\in\mathbb R^{d_h\times d_x}`,
        505,
        870,
        34,
        themeColors.blue,
        'center',
      ),
    );
    api.focus.target('recurrent-weight-map', () =>
      math(
        ctx,
        api,
        String.raw`W_{hh}\in\mathbb R^{d_h\times d_h}`,
        1415,
        870,
        34,
        themeColors.cyan,
        'center',
      ),
    );
    api.focus.target('recurrent-weight-shapes', () =>
      math(
        ctx,
        api,
        String.raw`h_t=\tanh(W_{xh}x_t+W_{hh}h_{t-1}+b_h)`,
        960,
        960,
        41,
        themeColors.ink,
        'center',
      ),
    );
  }
}
export default {
  id: 'shared',
  draw: drawShared,
  cues: [
    'vector-state',
    'input-matrix',
    'recurrent-matrix',
    'unroll-cell',
    'shared-parameters',
    'fixed-width-state',
    'compressed-prefix',
  ],
};
