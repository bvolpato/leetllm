import { autogradTrace, sampleOriginalModel } from '../construction.mjs';
import { drawOriginalCard, drawOriginalEquation, drawOriginalText } from '../defaults.mjs';
export function drawAutograd(ctx, scene, state, api) {
  return api.focus.target('pt-autograd-mechanism', () => {
    const { C: themeColors, teaching: teaching } = api,
      modelState = sampleOriginalModel('autograd', state),
      currentBeat = modelState.b;
    {
      const trace = autogradTrace(currentBeat, state.beatP ?? 0);
      const plot = api.focus.target('autograd-axes-autograd', () =>
        teaching.axes({
          x: 170,
          y: 350,
          width: 630,
          height: 390,
          xDomain: [0, 5],
          yDomain: [0, 25],
          xTicks: [0, 3, 5],
          yTicks: [0, 9, 25],
          color: themeColors.muted,
          fontSize: 25,
        }),
      );
      api.focus.target('autograd-curve-autograd', () =>
        teaching.curve({
          plot,
          points: Array.from(
            {
              length: 101,
            },
            (_, i) => ({
              x: i / 20,
              y: (i / 20) ** 2,
            }),
          ),
          color: themeColors.blue,
          width: 4,
        }),
      );
      teaching.curve({
        plot,
        points: [
          {
            x: 1.5,
            y: 0,
          },
          {
            x: 5,
            y: 21,
          },
        ],
        color: themeColors.yellow,
        width: 3,
      });
      teaching.scatter({
        plot,
        points: [
          {
            x: 3,
            y: 9,
            color: themeColors.green,
            radius: 10,
          },
        ],
      });
      drawOriginalText(
        ctx,
        api,
        'Forward: x = 3 → L = 9',
        485,
        285,
        35,
        themeColors.blue,
        'center',
      );
      const original = drawOriginalCard(ctx, api, 'Tensor x', 970, 330, 330, themeColors.blue, 85);
      const storage = drawOriginalCard(
        ctx,
        api,
        'Storage S1\nValue ' + trace.storage + ' · v' + trace.version,
        970,
        570,
        currentBeat === 2 ? 370 : 800,
        trace.version ? themeColors.pink : themeColors.cyan,
        125,
      );
      api.connect(ctx, original, storage, {
        color: themeColors.blue,
        gap: 20,
      });
      if (trace.alias) {
        const alias = api.focus.target('autograd-detached-alias', () =>
          drawOriginalCard(ctx, api, 'Detached alias', 1435, 330, 335, themeColors.pink, 85),
        );
        api.connect(ctx, alias, storage, {
          color: themeColors.pink,
          gap: 20,
        });
      }
      if (currentBeat === 2 && trace.clone !== null) {
        const clone = drawOriginalCard(
            ctx,
            api,
            'Independent clone',
            1435,
            330,
            335,
            themeColors.green,
            85,
          ),
          own = drawOriginalCard(
            ctx,
            api,
            'Storage S2\nValue ' + trace.clone,
            1420,
            570,
            370,
            themeColors.green,
            125,
          );
        api.connect(ctx, clone, own, {
          color: themeColors.green,
          gap: 20,
        });
      }
      if (trace.write)
        teaching.changeCue(
          {
            x: 950,
            y: 550,
            width: currentBeat === 2 ? 850 : 840,
            height: 170,
            from: 3,
            to: 4,
            progress: 1,
            emphasis: trace.checked ? 0.2 : 0.7,
            color: themeColors.pink,
          },
          () =>
            drawOriginalText(
              ctx,
              api,
              currentBeat === 2 ? 'Write reaches S2 only' : 'Alias write reaches the same S1 bytes',
              1370,
              765,
              29,
              themeColors.pink,
              'center',
            ),
        );
      api.focus.target('autograd-saved-for-backward-x-3-version-0', () =>
        drawOriginalCard(
          ctx,
          api,
          'Saved for backward: x = 3 · version 0',
          170,
          830,
          690,
          themeColors.blue,
          90,
        ),
      );
      const verdict = !trace.checked
        ? 'Backward check pending'
        : trace.valid
          ? 'Saved/current version 0 = 0 → gradient 6'
          : 'Saved 0 ≠ current 1 → backward rejected';
      drawOriginalCard(
        ctx,
        api,
        verdict,
        970,
        835,
        830,
        trace.checked ? (trace.valid ? themeColors.green : themeColors.pink) : themeColors.muted,
        110,
      );
      drawOriginalEquation(ctx, api, String.raw`L=x^2,\quad L'(3)=6`, 485, 1010, 39);
      drawOriginalText(
        ctx,
        api,
        currentBeat === 2
          ? 'Clone owns distinct bytes; the original forward remains valid'
          : 'Detachment changes gradient history; storage identity remains S1',
        1370,
        1010,
        26,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'autograd',
  draw: drawAutograd,
  cues: [
    'autograd-beat-1-focus-1',
    'autograd-beat-1-focus-2',
    'pt-autograd-0',
    'autograd-beat-2-focus-1',
    'autograd-beat-2-focus-2',
    'pt-autograd-1',
    'autograd-beat-3-focus-1',
    'autograd-beat-3-focus-2',
    'pt-autograd-2',
  ],
};
