import { weightedClickExpectation } from '../model.mjs';
import { bar, cueProgress, cueVisible, footer, rankingText } from '../defaults.mjs';
export function drawClickModel(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('click-model-mechanism', () => {
    rankingText(ctx, api, 'Authored click mechanism · C = O×R', 150, 270, 35);
    const rows = [
      {
        position: 1,
        p: 0.8,
        r: 0.5,
      },
      {
        position: 3,
        p: 0.2,
        r: 0.5,
      },
    ];
    rows.forEach((row, i) => {
      const x = 170 + i * 850;
      rankingText(ctx, api, 'Position' + row.position, x, 370, 33, themeColors.blue);
      bar(ctx, api, x, 435, 650, 110, row.p, 1, themeColors.blue);
      rankingText(
        ctx,
        api,
        'Examined ' + row.p + ' × relevant ' + row.r,
        x,
        600,
        30,
        themeColors.cyan,
      );
      if (currentBeat > 0 || cueVisible(ctx, api, 'click-independence')) {
        const cells = 20,
          examination = row.p * cells,
          clicks = examination * row.r;
        for (let j = 0; j < cells; j++)
          api.rect(
            ctx,
            x + (j % 10) * 60,
            665 + Math.floor(j / 10) * 70,
            45,
            45,
            j < clicks
              ? themeColors.yellow
              : j < examination
                ? themeColors.blue
                : themeColors.panel,
            j < examination ? undefined : themeColors.muted,
            0,
          );
      }
      if (currentBeat > 1 || (currentBeat === 1 && cueProgress(ctx, api, 'click-raw') === 1))
        rankingText(
          ctx,
          api,
          'Expected clicks ' + (row.p * row.r).toFixed(2),
          x,
          865,
          32,
          themeColors.yellow,
        );
      if (currentBeat === 1 && cueVisible(ctx, api, 'click-inverse')) {
        const value = weightedClickExpectation(
          row.p,
          row.r,
          cueProgress(ctx, api, 'click-inverse'),
        );
        bar(ctx, api, x, 900, 650, 30, value.weighted, 0.5, themeColors.green);
        if (cueProgress(ctx, api, 'click-inverse') === 1)
          rankingText(
            ctx,
            api,
            '× ' + value.weight.toFixed(2) + ' = ' + value.weighted.toFixed(2),
            x,
            970,
            32,
            themeColors.green,
          );
      }
      if (currentBeat === 2) {
        const value = weightedClickExpectation(
          row.p,
          row.r,
          cueProgress(ctx, api, 'click-clip'),
          2,
        );
        bar(
          ctx,
          api,
          x,
          900,
          650,
          30,
          value.weighted,
          0.5,
          i ? themeColors.pink : themeColors.green,
        );
        if (cueProgress(ctx, api, 'click-clip') === 1)
          rankingText(
            ctx,
            api,
            'min(1/p, 2) = ' + value.weight.toFixed(2) + ' → ' + value.weighted.toFixed(2),
            x,
            970,
            30,
            i ? themeColors.pink : themeColors.green,
          );
      }
    });
    footer(
      ctx,
      api,
      currentBeat === 0
        ? '20 equal probability units per position · yellow = click · blue = examined without click.'
        : 'Expectations over the specified toy mechanism; a finite log need not equal them.',
    );
  });
}
export default {
  id: 'click-model',
  draw: drawClickModel,
  cues: [
    'click-product',
    'click-independence',
    'click-raw',
    'click-inverse',
    'click-clip',
    'click-bias',
  ],
};
