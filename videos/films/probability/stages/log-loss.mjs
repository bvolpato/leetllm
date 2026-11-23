import { probSoftmax } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { detailText, focusTarget, rectangle } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawLogLoss(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const { C: themeColors, teaching: teaching } = api,
    E = (beat, id) => cueProgress(state, id, beat);
  {
    if (currentBeat === 0) {
      const q = E(0, 'surprise-curve'),
        plot = teaching.axes({
          x: 300,
          y: 400,
          width: 1270,
          height: 480,
          xDomain: [0, 1],
          yDomain: [0, 7],
          xTicks: [0.01, 0.5, 0.9, 1],
          yTicks: [0, 2, 4, 6],
          xLabel: 'probability on the observed target',
          yLabel: 'negative natural log (nats)',
          fontSize: 26,
        });
      teaching.curve({
        plot,
        points: sampleFunction((x) => -Math.log(x), 0.001, 1, 200),
        color: themeColors.cyan,
        width: 4,
        progress: q,
      });
      focusTarget(ctx, api, 'loss-receipt', () => {
        if (q > 0.8)
          detailText(
            ctx,
            api,
            'p=.90 → .105 nats; p=.01 → 4.605 nats',
            960,
            1000,
            34,
            themeColors.yellow,
          );
        else
          detailText(
            ctx,
            api,
            'A confident miss incurs a large target loss',
            960,
            1000,
            33,
            themeColors.yellow,
          );
      });
    } else if (currentBeat === 1) {
      detailText(ctx, api, 'Bar height = loss in nats for the observed token', 960, 259, 39, themeColors.ink);
      const models = [
          [0.6, 0.5, 0.7, 0.4],
          [0.25, 0.25, 0.25, 0.25],
          [0.99, 0.99, 0.99, 0.001],
        ],
        labels = ['moderate', 'unsure', 'confident'];
      models.forEach((m, i) => {
        const x = 350 + i * 600,
          count = i === 2
            ? Math.floor(3 * E(1, 'three-hits')) + Math.floor(E(1, 'loss-models'))
            : Math.floor(4 * E(1, ['moderate-loss', 'unsure-loss'][i]));
        detailText(
          ctx,
          api,
          labels[i],
          x,
          350,
          32,
          [themeColors.blue, themeColors.cyan, themeColors.pink][i],
        );
        api.line(ctx, x - 148, 853, x + 150, 853, themeColors.muted, 2);
        m.forEach((v, j) => {
          const loss = -Math.log(v);
          rectangle(
            ctx,
            api,
            x - 130 + j * 70,
            850 - loss * 50 * (j < count ? 1 : 0),
            55,
            loss * 50 * (j < count ? 1 : 0),
            [themeColors.blue, themeColors.cyan, themeColors.pink][i],
          );
          if (i < 2 || j < count)
            detailText(ctx, api, String(v), x - 102 + j * 70, 910, 25, themeColors.muted);
        });
        focusTarget(ctx, api, 'loss-receipt', () =>
          detailText(
            ctx,
            api,
            count === 4 && (i < 2 || E(1, 'loss-mean') === 1)
              ? 'mean ' + (m.reduce((a, v) => a - Math.log(v), 0) / 4).toFixed(3) + ' nats'
              : 'Scored ' + count + '/4 outcomes',
            x,
            1010,
            31,
            themeColors.yellow,
          ),
        );
      });
    } else {
      detailText(
        ctx,
        api,
        'Library input contracts and token masks matter',
        960,
        320,
        38,
        themeColors.ink,
      );
      const logits = [2, 1, 0],
        prob = probSoftmax(logits),
        q = E(2, 'loss-library'),
        twice = probSoftmax(prob);
      teaching.bars({
        x: 250,
        y: 440,
        width: 700,
        height: 380,
        values: prob,
        labels: ['A', 'target B', 'C'],
        colors: [themeColors.blue, themeColors.pink, themeColors.cyan],
        max: 1,
        showValues: true,
        format: (v) => v.toFixed(3),
        fontSize: 29,
      });
      ctx.save();
      try {
        ctx.globalAlpha *= q;
        teaching.bars({
          x: 1130,
          y: 440,
          width: 570,
          height: 380,
          values: twice,
          labels: ['A', 'B', 'C'],
          colors: [themeColors.blue, themeColors.pink, themeColors.cyan],
          max: 1,
          showValues: true,
          format: (v) => v.toFixed(3),
          fontSize: 29,
        });
      } finally {
        ctx.restore();
      }
      focusTarget(ctx, api, 'loss-receipt', () => {
        detailText(ctx, api, 'softmax of logits', 600, 390, 31, themeColors.blue);
        detailText(ctx, api, 'softmax applied twice', 1420, 390, 31, themeColors.pink);
        detailText(
          ctx,
          api,
          'Same target · different objective input · test the deployed reduction and mask',
          960,
          1010,
          29,
          themeColors.yellow,
        );
      });
    }
  }
  return;
}
export default {
  id: 'log-loss',
  draw: drawLogLoss,
  cues: ['surprise-curve', 'three-hits', 'loss-models', 'loss-mean', 'moderate-loss', 'unsure-loss', 'loss-library'],
};
