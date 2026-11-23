import { shards } from '../model.mjs';
import { drawOriginalText } from '../defaults.mjs';
export function drawCapacity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.92),
    whole = (currentBeat + phaseForBeat(currentBeat)) / 3;
  const result = shards();
  {
    api.focus.target('capacity-per-device-inventory-includes-the-state-around-the-shar', () =>
      drawOriginalText(
        ctx,
        api,
        'Per-device inventory includes the state around the shard',
        960,
        285,
        37,
        themeColors.ink,
        'center',
      ),
    );
    const labels = ['Weights', 'KV state', 'Activations', 'Workspace'],
      values = [4, 2, 1, 1],
      cols = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow];
    [0, 1].forEach((gpu) => {
      let y = 820;
      values.forEach((value, i) => {
        const h = value * 54;
        api.focus.target('device-inventory', () =>
          api.rect(ctx, 390 + gpu * 820, y - h, 360, h, cols[i]),
        );
        api.focus.target('capacity-readout', () =>
          drawOriginalText(
            ctx,
            api,
            labels[i] + ' ' + value,
            570 + gpu * 820,
            y - h / 2 + 10,
            29,
            themeColors.bg,
            'center',
          ),
        );
        y -= h;
      });
      api.focus.target('capacity-readout-2', () =>
        drawOriginalText(
          ctx,
          api,
          'GPU ' + gpu + ' total: 8 units',
          570 + gpu * 820,
          900,
          32,
          themeColors.ink,
          'center',
        ),
      );
    });
    api.focus.target('capacity-authored-ledger-8-total-weight-units-shard-into-4-per-d', () =>
      drawOriginalText(
        ctx,
        api,
        '8 weight units split evenly across two GPUs',
        960,
        350,
        30,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'capacity',
  draw: drawCapacity,
  cues: [
    'per-device-state',
    'inventory-sharding',
    'sharded-weights',
    'total-device-state',
    'interconnect-workload',
    'training-state',
  ],
};
