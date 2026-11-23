import { sampleOriginalModel } from '../construction.mjs';
import { drawCard, drawText } from '../defaults.mjs';
export function drawConcurrency(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleOriginalModel('concurrency', state);
  {
    const mappings = [
      {
        kind: 'network-wait',
        label: 'Network waits',
        choices: modelState.choices.networkWait,
        color: modelState.focus === 'network-wait' ? themeColors.cyan : themeColors.muted,
        y: 325,
      },
      {
        kind: 'python-compute',
        label: 'Pure Python compute',
        choices: modelState.choices.pythonCompute,
        color: modelState.focus === 'python-compute' ? themeColors.green : themeColors.muted,
        y: 555,
      },
    ];
    mappings.forEach((row) => {
      const source = api.focus.target('concurrency-work-' + row.kind, () =>
        drawCard(ctx, api, row.label, 260, row.y, 520, row.color, 112, 34),
      );
      const result = api.focus.target('concurrency-tools-' + row.kind, () =>
        drawCard(ctx, api, row.choices.join('  ·  '), 1120, row.y, 600, row.color, 112, 31),
      );
      teaching.transfer({
        source: {
          shape: source,
          opacity: 1,
        },
        target: {
          shape: result,
          opacity: 1,
        },
        progress: 1,
        color: row.color,
        particle: {
          radius: 8,
          fill: row.color,
        },
      });
    });
    api.focus.reveal('concurrency-beat-2-focus-1', () => {
      const input = api.focus.target('concurrency-serialized-input', () =>
        drawCard(ctx, api, modelState.serialization.input, 160, 800, 430, themeColors.cyan, 92, 27),
      );
      const worker = api.focus.target('concurrency-worker-result', () =>
        drawCard(
          ctx,
          api,
          modelState.exchangeProgress < 0.5 ? 'worker: x²' : 'worker: 7² = 49',
          740,
          800,
          420,
          themeColors.green,
          92,
          30,
        ),
      );
      const output = api.focus.target('concurrency-serialized-result', () =>
        drawCard(
          ctx,
          api,
          modelState.exchangeProgress < 0.5 ? 'result pending' : modelState.serialization.output,
          1320,
          800,
          440,
          themeColors.yellow,
          92,
          26,
        ),
      );
      api.connect(ctx, input, worker, {
        color: themeColors.cyan,
        width: 3,
      });
      api.connect(ctx, worker, output, {
        color: themeColors.yellow,
        width: 3,
      });
    });
    api.focus.reveal('concurrency-parent-merge', () =>
      api.focus.target('concurrency-parent-record', () =>
        drawText(
          ctx,
          api,
          'parent records["t7"] = ' + modelState.serialization.result,
          960,
          975,
          32,
          themeColors.green,
          'center',
        ),
      ),
    );
  }
}
export default {
  id: 'concurrency',
  draw: drawConcurrency,
  cues: [
    'concurrency-network-waits',
    'concurrency-beat-1-focus-1',
    'concurrency-beat-2-focus-1',
    'concurrency-parent-merge',
  ],
};
