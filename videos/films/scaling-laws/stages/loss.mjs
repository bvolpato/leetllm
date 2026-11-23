import { spoken } from '../cue.mjs';
import { scalingEvent } from '../construction.mjs';
import { band, curve, plot, point, text } from '../defaults.mjs';
export function drawLoss(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  api.focus.target('sl-loss-construction', () => {
    band(ctx, api, 'A fitted loss model for fresh training data');
    const curves = [
      {
        x: 280,
        name: 'Capacity penalty',
        col: themeColors.blue,
      },
      {
        x: 1110,
        name: 'Data penalty',
        col: themeColors.cyan,
      },
    ];
    api.focus.target('resource-penalties', () =>
      curves.forEach((a, i) => {
        const pl = plot(
          ctx,
          api,
          a.x,
          410,
          530,
          360,
          [1, 40],
          [0, 2.2],
          i ? 'Token presentations D' : 'Parameters N',
          a.name,
        );
        curve(
          ctx,
          api,
          pl,
          (x) => 2 / Math.sqrt(x),
          1,
          40,
          a.col,
          currentBeat === 0
            ? 0
            : currentBeat === 1
              ? spoken(scene, state, i ? 'loss-data' : 'loss-capacity').progress
              : 1,
        );
        if (currentBeat === 2) {
          const n = 5 + 5 * progress,
            count = i ? 100 / n : n;
          point(ctx, api, pl, count, 2 / Math.sqrt(count), a.col, 12);
        }
      }),
    );
    if (currentBeat === 0)
      api.focus.target('loss-model', () =>
        text(
          ctx,
          api,
          'Which split predicts the same held-out tokens better?',
          960,
          340,
          34,
          themeColors.ink,
          'center',
        ),
      );
    else {
      const terms = ['1', '+ 2 / √N', '+ 2 / √D'];
      api.focus.target('loss-model', () =>
        terms.forEach((v, i) => {
          const known =
            i === 0 ||
            spoken(scene, state, i === 1 ? 'loss-capacity' : 'loss-data').phase !== 'before';
          text(
            ctx,
            api,
            known ? v : '?',
            570 + i * 390,
            315,
            40,
            [themeColors.muted, themeColors.blue, themeColors.cyan][i],
            'center',
          );
        }),
      );
      if (currentBeat === 2) {
        const n = 5 + 5 * progress,
          d = 100 / n;
        text(
          ctx,
          api,
          `N ${n.toFixed(1)} · D ${d.toFixed(1)} · ND 100`,
          960,
          885,
          33,
          themeColors.yellow,
          'center',
        );
        text(
          ctx,
          api,
          `Parameter penalty ${(2 / Math.sqrt(n)).toFixed(3)} · data penalty ${(2 / Math.sqrt(d)).toFixed(3)}`,
          960,
          950,
          31,
          themeColors.ink,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'loss',
  draw: drawLoss,
  cues: ['sl-loss-0', 'sl-loss-1', 'sl-loss-2', 'loss-capacity', 'loss-data'],
};
