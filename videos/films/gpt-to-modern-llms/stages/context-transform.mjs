import { phraseEnded } from '../arithmetic.mjs';
import { attention, tokens, values } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { card, math, text } from '../defaults.mjs';
export function drawContextTransform(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const modelState = sampleModel('context-transform', state);
  {
    text(
      ctx,
      api,
      'Supplied attention weights · a two-dimensional teaching calculation',
      960,
      305,
      27,
      themeColors.muted,
      'center',
    );
    const partial = modelState.attention.fractions.findIndex((value) => value > 0 && value < 1),
      active =
        modelState.beat !== 1
          ? -1
          : partial >= 0
            ? partial
            : [0, 2, 1, 3].filter((i) => modelState.attention.fractions[i] === 1).at(-1);
    api.focus.target('attention-values-table', () =>
      teaching.grid({
        x: 180,
        y: 380,
        width: 680,
        height: 370,
        rows: 5,
        columns: 3,
        labels: [
          ['Token', 'Value vector', 'Weight'],
          ...tokens.map((token, i) => [
            token,
            `[${values[i].join(', ')}]`,
            attention[i].toFixed(1),
          ]),
        ],
        fontSize: 25,
        fill: themeColors.panel,
        stroke: themeColors.cyan,
        textColor: themeColors.ink,
        highlights:
          active >= 0
            ? [0, 1, 2].map((column) => ({
                row: active + 1,
                column,
                fill: '#ef9ac820',
                stroke: themeColors.pink,
              }))
            : [],
      }),
    );
    const plot = teaching.axes({
      x: 1080,
      y: 420,
      width: 500,
      height: 350,
      xDomain: [0, 1],
      yDomain: [0, 1],
      xTicks: [0, 0.5, 1],
      yTicks: [0, 0.5, 1],
      xLabel: 'coordinate 1',
      yLabel: 'coordinate 2',
      fontSize: 22,
    });
    const origin = plot.point(0, 0),
      point = plot.point(...modelState.attention.vector);
    api.focus.target('context-vector-arrow', () =>
      api.arrow(ctx, origin.x, origin.y, point.x, point.y, themeColors.yellow, 6),
    );
    api.circle(ctx, point.x, point.y, 11, themeColors.yellow);
    if (active >= 0) {
      const contribution = modelState.attention.contributions[active],
        base = plot.point(...modelState.attention.vector.map((v, i) => v - contribution[i]));
      api.focus.target('active-attention-addition', () =>
        api.arrow(ctx, base.x, base.y, point.x, point.y, themeColors.pink, 7),
      );
      text(
        ctx,
        api,
        `${tokens[active]} · current addition [${contribution.map((v) => v.toFixed(2)).join(', ')}]`,
        520,
        805,
        26,
        themeColors.pink,
        'center',
      );
      text(
        ctx,
        api,
        tokens[active],
        (base.x + point.x) / 2 + 50,
        (base.y + point.y) / 2 - 24,
        28,
        themeColors.pink,
      );
    }
    const showVector = state.beat === 2 && phraseEnded(state, 'use-sum', 0.27);
    api.focus.target('context-vector-result', () =>
      card(
        ctx,
        api,
        `h = [${showVector ? modelState.attention.vector.map((x) => x.toFixed(2)).join(', ') : '?, ?'}] · ${modelState.attention.admitted}/4 terms complete`,
        970,
        865,
        760,
        86,
        themeColors.green,
        27,
      ),
    );
    math(ctx, api, String.raw`h=\sum_j a_jv_j`, 520, 865, 44);
  }
}
export default {
  id: 'context-transform',
  draw: drawContextTransform,
  cues: ['value-rows', 'add-guide', 'add-stale', 'add-label', 'use-sum'],
};
