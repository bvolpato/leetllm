import { GiB, hardware } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawOriginalBar,
  drawOriginalCard,
  drawOriginalEquation,
  drawOriginalText,
} from '../defaults.mjs';
export function drawPartition(ctx, scene, state, api) {
  const { C: themeColors } = api;
  let directed = state;
  if (state.cues) {
    const b = state.beat;
    let u = null,
      k = 1;
    {
      u = api.focus.progress(['device-weights', 'runtime-reserve', 'kv-pool'][b], 0);
      k = 0.45;
    }
    if (u !== null)
      directed = {
        ...state,
        beatP: 0.15 + 0.6 * k * u,
      };
  }
  const modelState = sampleModel('partition', directed),
    currentBeat = modelState.step;
  {
    api.focus.target('partition-authored-device-budget-32-gi-b', () =>
      drawOriginalText(ctx, api, 'Authored device budget: 32 GiB', 140, 280, 36, themeColors.ink),
    );
    const remaining =
      hardware.total - modelState.weights - modelState.runtime - modelState.allocatedPool;
    drawOriginalBar(
      ctx,
      api,
      [
        {
          value: modelState.weights,
          color: themeColors.blue,
        },
        {
          value: modelState.runtime,
          color: themeColors.yellow,
        },
        {
          value: modelState.allocatedPool,
          color: themeColors.green,
        },
        {
          value: remaining,
          color: themeColors.panel,
        },
      ],
      140,
      440,
      1610,
      145,
      hardware.total,
    );
    [
      ['Weights', modelState.weights, themeColors.blue],
      ['Runtime reserve', modelState.runtime, themeColors.yellow],
      ['KV pool', modelState.allocatedPool, themeColors.green],
    ].forEach(([label, bytes, color], i) =>
      api.focus.target('partition-readout', () =>
        drawOriginalCard(
          ctx,
          api,
          `${label}\n${bytes / GiB} GiB`,
          140 + i * 565,
          700,
          480,
          color,
          115,
        ),
      ),
    );
    api.focus.target('partition-equation', () =>
      drawOriginalEquation(
        ctx,
        api,
        String.raw`M_{\mathrm{KV}}=M_{\mathrm{total}}-M_{\mathrm{weights}}-M_{\mathrm{runtime}}`,
        960,
        945,
        39,
      ),
    );
  }
}
export default {
  id: 'partition',
  draw: drawPartition,
  cues: [
    'device-weights',
    'shared-allocation',
    'runtime-reserve',
    'runtime-peaks',
    'kv-pool',
    'available-state-budget',
  ],
};
