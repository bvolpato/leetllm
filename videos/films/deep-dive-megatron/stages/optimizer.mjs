import { sampleModel } from '../model.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawOptimizer(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('optimizer', state),
    currentBeat = modelState.b;
  const complete = (id) => !state.cues || api.focus.progress(id, 0) >= 1;
  {
    const storage =
        currentBeat === 2
          ? {
              ...modelState,
              d: 4,
              sharded: 3,
              total: 9,
            }
          : modelState,
      totalReady =
        currentBeat === 2 ||
        complete(currentBeat === 0 ? 'mg-optimizer-first-total' : 'mg-optimizer-increased-total');
    text(
      ctx,
      api,
      `Actual optimizer group size d = ${storage.d}`,
      960,
      285,
      39,
      themeColors.yellow,
      'center',
    );
    const alloc = api.focus.target(
      'optimizer-id-replicated-label-bf16-parameters-fp32-main-gradients-value-s-repl',
      () => {
        if (totalReady)
          return teaching.allocation({
            x: 230,
            y: currentBeat === 2 ? 350 : 380,
            width: 1430,
            height: currentBeat === 2 ? 300 : 400,
            capacity: 18,
            parts: [
              {
                id: 'replicated',
                label: 'BF16 parameters + FP32 main gradients',
                value: storage.replicated,
                color: themeColors.blue,
              },
              {
                id: 'owned',
                label: 'Master weight + Adam moments / d',
                value: storage.sharded,
                color: themeColors.pink,
              },
            ],
            unit: 'bytes/parameter',
            fontSize: 29,
            color: themeColors.ink,
            trackColor: themeColors.panel,
            format: (v) => v.toFixed(2),
          });
        const x = 230,
          y = currentBeat === 2 ? 350 : 380,
          w = 1430,
          barWidth = w - 6,
          amount = api.focus.progress(
            currentBeat === 0 ? 'mg-optimizer-first-total' : 'mg-optimizer-increased-total',
            0,
          ),
          from = currentBeat === 0 ? 12 : 6,
          slice = from + (storage.sharded - from) * amount;
        text(
          ctx,
          api,
          'Allocation construction · completed total pending',
          x,
          y + 29,
          29,
          themeColors.muted,
          'left',
        );
        api.rect(ctx, x + 1, y + 50.3, w - 2, 56, themeColors.panel, themeColors.muted, 0);
        api.rect(ctx, x + 3, y + 52.3, (barWidth * 6) / 18, 52, themeColors.blue, undefined, 0);
        api.rect(
          ctx,
          x + 3 + (barWidth * 6) / 18,
          y + 52.3,
          (barWidth * slice) / 18,
          52,
          themeColors.pink,
          undefined,
          0,
        );
        text(
          ctx,
          api,
          'Replicated input: 6 bytes/parameter',
          x,
          y + 154,
          29,
          themeColors.blue,
          'left',
        );
        text(
          ctx,
          api,
          'Shardable input: 12 bytes/parameter · target slice 12 / ' + storage.d,
          x,
          y + 202,
          29,
          themeColors.pink,
          'left',
        );
        return {
          used: storage.total,
        };
      },
    );
    text(
      ctx,
      api,
      totalReady
        ? `Persistent total ${alloc.used.toFixed(2)} bytes per assigned parameter`
        : 'Persistent total: pending',
      960,
      currentBeat === 2 ? 710 : 845,
      38,
      totalReady ? themeColors.green : themeColors.muted,
      'center',
    );
    if (currentBeat === 2) {
      text(
        ctx,
        api,
        'Separate loss example · two replicas with unequal valid-token counts',
        960,
        790,
        30,
        themeColors.cyan,
        'center',
      );
      modelState.tokenGradients.forEach((values, i) =>
        api.focus.target('optimizer-replica-token-gradients', () =>
          card(
            ctx,
            api,
            `Replica ${i}: token gradients [${values.join(', ')}]`,
            210 + i * 870,
            835,
            750,
            i ? themeColors.pink : themeColors.blue,
            75,
          ),
        ),
      );
      api.focus.target('optimizer-math-ext-rank-mean-rac-2-qquad-ext-token-mean-rac', () =>
        complete('optimizer-beat-3-focus-2')
          ? equation(
              ctx,
              api,
              String.raw`\text{rank mean}=\frac{${modelState.localMeans.join('+')}}2=${modelState.wrongGradient}\qquad\text{token mean}=\frac{${modelState.tokenGradients.flat().join('+')}}{${modelState.tokenCount}}=${modelState.tokenGradient}`,
              960,
              985,
              36,
            )
          : text(
              ctx,
              api,
              'Rank-mean and token-mean comparison: pending',
              960,
              985,
              31,
              themeColors.muted,
              'center',
            ),
      );
    } else
      text(
        ctx,
        api,
        'Excludes activations, gathered tensors and communication workspace',
        960,
        975,
        31,
        themeColors.muted,
        'center',
      );
  }
}
export default {
  id: 'optimizer',
  draw: drawOptimizer,
  cues: [
    'mg-optimizer-first-total',
    'optimizer-beat-1-focus-1',
    'mg-optimizer-increased-total',
    'optimizer-beat-2-focus-1',
    'optimizer-beat-3-focus-1',
    'optimizer-beat-3-focus-2',
  ],
};
