import { forecastChapterState } from '../model.mjs';
import {
  drawForecastChapterBox,
  drawForecastChapterHead,
  drawForecastChapterLine,
  drawForecastChapterNote,
  drawForecastChapterText,
} from '../defaults.mjs';
export function drawForecastContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = forecastChapterState(state),
    currentBeat = f.b,
    progress = f.p;
  api.focus.target('forecast-contract-operation', () => {
    if (currentBeat === 0) {
      drawForecastChapterHead(ctx, api, 'FC-A · standard tier · UTC days · authored contract');
      drawForecastChapterBox(ctx, api, 'Issue Sunday 08:00', 360, 420, 420, 80, themeColors.yellow);
      const count = Math.ceil(7 * f.progress('forecast-horizon'));
      for (let i = 0; i < 7; i++) {
        const x = 620 + i * 155;
        if (i < count) {
          api.rect(ctx, x, 380, 125, 150, themeColors.panel, themeColors.cyan, 2);
          drawForecastChapterText(
            ctx,
            api,
            'h' + (i + 1),
            x + 62,
            425,
            30,
            themeColors.cyan,
            'center',
          );
          drawForecastChapterText(
            ctx,
            api,
            ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
            x + 62,
            475,
            25,
            themeColors.ink,
            'center',
          );
          drawForecastChapterText(
            ctx,
            api,
            i === 2 ? 'C = 140' : 'C = 150',
            x + 62,
            590,
            26,
            themeColors.yellow,
            'center',
          );
        }
      }
      drawForecastChapterNote(
        ctx,
        api,
        'Requested volume · business timezone and lead time must be declared for a real facility.',
      );
    } else if (currentBeat === 1) {
      drawForecastChapterHead(ctx, api, 'Separate dependency constructions · supplied schematic');
      const rq = f.progress('forecast-recursive');
      drawForecastChapterBox(ctx, api, 'Observed history', 300, 420, 340, 80, themeColors.blue);
      drawForecastChapterBox(ctx, api, 'f: next step', 800, 420, 320, 80, themeColors.cyan);
      api.arrow(ctx, 470, 420, 640, 420, themeColors.cyan, 3);
      if (rq > 0) {
        const x = api.lerp(1000, 1190, rq);
        api.circle(ctx, x, 420, 20, themeColors.yellow);
        drawForecastChapterBox(ctx, api, 'prediction 1', 1400, 420, 350, 80, themeColors.yellow);
        api.path(
          ctx,
          [
            {
              x: 1400,
              y: 460,
            },
            {
              x: 1400,
              y: 570,
            },
            {
              x: 800,
              y: 570,
            },
            {
              x: 800,
              y: 460,
            },
          ],
          {
            color: themeColors.yellow,
            width: 3,
          },
        );
        drawForecastChapterText(
          ctx,
          api,
          'Earlier forecast becomes next input',
          1100,
          625,
          30,
          themeColors.yellow,
          'center',
        );
      }
      if (f.started('forecast-direct')) {
        drawForecastChapterBox(ctx, api, 'Same history', 300, 760, 340, 80, themeColors.blue);
        ['f₁→h1', 'f₂→h2', 'f₃→h3'].forEach((v, i) => {
          drawForecastChapterBox(ctx, api, v, 800 + i * 360, 760, 290, 80, themeColors.cyan);
          api.path(
            ctx,
            [
              {
                x: 470,
                y: 760,
              },
              {
                x: 550,
                y: 760,
              },
              {
                x: 550,
                y: 850,
              },
              {
                x: 800 + i * 360,
                y: 850,
              },
              {
                x: 800 + i * 360,
                y: 805,
              },
            ],
            {
              color: themeColors.muted,
              width: 2,
            },
          );
        });
      }
      if (f.started('forecast-joint'))
        drawForecastChapterBox(
          ctx,
          api,
          'Joint model → [h1,h2,…,h7]',
          1000,
          920,
          950,
          75,
          themeColors.green,
        );
      drawForecastChapterNote(
        ctx,
        api,
        'No guaranteed winner · feedback and estimation tradeoffs differ.',
      );
    } else {
      drawForecastChapterHead(
        ctx,
        api,
        'One fitted calendar model · seven independent future rows',
      );
      for (let i = 0; i < 7; i++) {
        const x = 290 + i * 230;
        drawForecastChapterText(
          ctx,
          api,
          'x(h' + (i + 1) + ')',
          x,
          420,
          29,
          themeColors.blue,
          'center',
        );
        drawForecastChapterLine(ctx, api, x, 450, x, 600, themeColors.muted);
        api.circle(ctx, x, 650, 18, themeColors.cyan);
        drawForecastChapterText(ctx, api, 'ŷ' + (i + 1), x, 720, 32, themeColors.cyan, 'center');
      }
      drawForecastChapterLine(ctx, api, 220, 560, 1750, 560, themeColors.cyan, 3);
      drawForecastChapterText(
        ctx,
        api,
        'same learned w · no predicted-target feedback',
        960,
        850,
        33,
        themeColors.yellow,
        'center',
      );
      drawForecastChapterNote(
        ctx,
        api,
        'Fixture:weekday,trend,campaigns,noise,surges · no weather or monthly-season evidence.',
      );
    }
  });
}
export default {
  id: 'forecast-contract',
  draw: drawForecastContract,
  cues: [
    'forecast-contract-0',
    'forecast-horizon',
    'forecast-contract-1',
    'forecast-recursive',
    'forecast-direct',
    'forecast-joint',
    'forecast-contract-2',
  ],
};
