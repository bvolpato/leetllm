import { TRACKS } from '../construction.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawTradeoff(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const snap = {
    ...TRACKS['tradeoff'].sample({
      beat,
      beatP: progress,
    }).snapshot,
  };
  if (state.cues && true) snap.pooled = api.focus.progress('pool-projections', 0) > 0;
  {
    api.focus.target('tradeoff-mean-pool-grouped-k-and-v-weight-slices', () =>
      card(
        ctx,
        api,
        'tradeoff',
        'Mean-pool grouped K and V weight slices',
        230,
        390,
        610,
        82,
        themeColors.blue,
        snap.pooled ? 1 : 0.45,
        25,
      ),
    );
    const sourceHeads = [1, 3, 3, 5];
    sourceHeads.forEach((value, index) =>
      api.focus.target('tradeoff-readout', () =>
        card(
          ctx,
          api,
          'tradeoff',
          `${value}`,
          250 + index * 115,
          530,
          96,
          76,
          themeColors.cyan,
          snap.pooled ? 1 : 0.35,
          29,
        ),
      ),
    );
    const pooledValue = sourceHeads.reduce((sum, value) => sum + value, 0) / sourceHeads.length;
    api.focus.target('tradeoff-readout-2', () =>
      card(
        ctx,
        api,
        'tradeoff',
        `Average · ${pooledValue}`,
        780,
        530,
        210,
        76,
        themeColors.yellow,
        snap.pooled ? 1 : 0.4,
        27,
      ),
    );
    api.focus.target('tradeoff-equation', () =>
      equation(ctx, api, String.raw`(1+3+3+5)/4=3`, 880, 690, 34, themeColors.yellow),
    );
    const gates = [
      {
        id: 'Parity',
        x: 1190,
        color: themeColors.cyan,
      },
      {
        id: 'Held-out quality',
        x: 1190,
        color: themeColors.green,
      },
      {
        id: 'Serving profile',
        x: 1190,
        color: themeColors.pink,
      },
    ];
    gates.forEach((gate, index) => {
      const shown =
        snap.gates.includes(gate.id.toLowerCase().replace(' ', '-')) ||
        (gate.id === 'Held-out quality' && snap.gates.includes('quality')) ||
        (gate.id === 'Parity' && snap.gates.includes('parity')) ||
        (gate.id === 'Serving profile' && snap.gates.includes('serving'));
      api.focus.target('conversion-gate-' + index, () =>
        card(
          ctx,
          api,
          'tradeoff',
          gate.id,
          gate.x,
          400 + index * 135,
          430,
          82,
          gate.color,
          shown ? 1 : 0.36,
          25,
        ),
      );
      if (shown)
        api.focus.target('tradeoff-readout-4', () =>
          text(
            ctx,
            api,
            index === 0
              ? 'cached vs full-prefix output'
              : index === 1
                ? 'task score and regression slices'
                : 'memory · latency · tokens/second',
            1405,
            520 + index * 135,
            24,
            themeColors.muted,
            'center',
          ),
        );
    });
    api.focus.target('tradeoff-a-small-arithmetic-example-for-pooling-projection-slice', () =>
      text(
        ctx,
        api,
        'Projection slices · supplied values',
        520,
        805,
        24,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'tradeoff',
  draw: drawTradeoff,
  cues: [
    'pool-projections',
    'conversion-check',
    'lower-payload',
    'serving-performance',
    'quality-gate',
    'serving-gates',
  ],
};
