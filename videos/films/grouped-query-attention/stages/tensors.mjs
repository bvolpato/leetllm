import { TRACKS } from '../construction.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawTensors(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const snap = {
    ...TRACKS['tensors'].sample({
      beat,
      beatP: progress,
    }).snapshot,
  };
  void state.cues;
  {
    const kvHeads = snap.kvHeads;
    api.focus.target('tensors-query-tensor-all-heads-remain-distinct', () =>
      card(
        ctx,
        api,
        'tensors',
        'Query tensor · all heads remain distinct',
        270,
        380,
        600,
        78,
        themeColors.cyan,
        1,
        25,
      ),
    );
    api.focus.target('tensors-equation', () =>
      equation(
        ctx,
        api,
        String.raw`Q\in\mathbb{R}^{1\times8\times3\times4}`,
        570,
        505,
        38,
        themeColors.ink,
      ),
    );
    const archColor = snap.active === 'MHA' ? themeColors.blue : themeColors.green;
    api.focus.target('tensors-readout', () =>
      card(
        ctx,
        api,
        'tensors',
        `${snap.active === 'formula' ? 'Grouped K and V' : `${snap.active} key and value cache`}`,
        1040,
        380,
        590,
        78,
        archColor,
        1,
        26,
      ),
    );
    api.focus.target('tensors-equation-2', () =>
      equation(
        ctx,
        api,
        String.raw`K,V\in\mathbb{R}^{1\times${kvHeads}\times3\times4}`,
        1320,
        505,
        37,
        themeColors.ink,
      ),
    );
    api.focus.target('tensors-readout-2', () =>
      card(
        ctx,
        api,
        'tensors',
        `${kvHeads} stored KV heads per position`,
        1060,
        590,
        530,
        68,
        archColor,
        1,
        26,
      ),
    );
    teaching.grid({
      x: 1080,
      y: 680,
      width: 490,
      height: 96,
      rows: 1,
      columns: kvHeads,
      fill: themeColors.panel,
      stroke: themeColors.border,
      lineWidth: 2,
      labels: [
        Array.from(
          {
            length: kvHeads,
          },
          () => '',
        ),
      ],
      highlights: Array.from(
        {
          length: kvHeads,
        },
        (_, column) => ({
          row: 0,
          column,
          fill: archColor,
          opacity: 0.7,
        }),
      ),
      fontSize: 24,
      textColor: themeColors.ink,
    });
    api.focus.target('tensors-readout', () => {
      for (let layer = 0; layer < 2; layer++)
        for (let kind = 0; kind < 2; kind++) {
          const x = 290 + kind * 255,
            y = 625 + layer * 95;
          for (let pos = 0; pos < 3; pos++)
            for (let coord = 0; coord < 4; coord++)
              api.rect(
                ctx,
                x + coord * 38,
                y + pos * 23,
                34,
                19,
                themeColors.panel,
                kind ? themeColors.green : themeColors.blue,
                1,
              );
          text(
            ctx,
            api,
            (kind ? 'V' : 'K') + ' · L' + layer,
            x + 70,
            y + 88,
            24,
            kind ? themeColors.green : themeColors.blue,
            'center',
          );
        }
    });
    api.focus.target('tensors-equation-3', () =>
      equation(
        ctx,
        api,
        String.raw`\text{bytes}=2\,L\,B\,T\,H_{kv}\,d\,b`,
        960,
        850,
        38,
        themeColors.yellow,
      ),
    );
    api.focus.target('tensors-k-and-v-layers-requests-tokens-heads-width-bytes-value', () =>
      text(
        ctx,
        api,
        'K and V · layers · requests · tokens · heads · width · bytes/value',
        960,
        920,
        24,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'tensors',
  draw: drawTensors,
  cues: [
    'tensor-shape',
    'mha-shape',
    'gqa-shape',
    'query-shape',
    'payload-formula',
    'dimension-product',
  ],
};
