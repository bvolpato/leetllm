import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawTradeoff(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('tradeoff', state);
  {
    const left = api.focus.target('tradeoff-in-process-contract', () =>
      card(ctx, api, 'in-process contract', 230, 330, 630, themeColors.cyan, 104, 34),
    );
    const right = api.focus.target('tradeoff-separate-adapter-service', () =>
      card(ctx, api, 'separate adapter service', 1060, 330, 630, themeColors.yellow, 104, 34),
    );
    const facts = [
      ['network hop', 'none added', 'added boundary'],
      ['deployment', 'shared release', 'independent'],
      ['resource isolation', 'shared process', 'separate budget'],
      ['consider split when', 'measured constraint', 'justifies its cost'],
    ];
    teaching.grid({
      x: 230,
      y: 490,
      width: 1460,
      height: 350,
      rows: 4,
      columns: 3,
      labels: facts,
      fill: themeColors.panel,
      stroke: themeColors.muted,
      textColor: themeColors.ink,
      fontSize: 27,
      highlights: [
        {
          row: 0,
          column: 1,
          fill: '#63deec2b',
          stroke: themeColors.cyan,
        },
        {
          row: 1,
          column: 2,
          fill: '#f4d4772b',
          stroke: themeColors.yellow,
        },
      ],
    });
    text(
      ctx,
      api,
      'Locate the wait before choosing the boundary',
      960,
      945,
      31,
      themeColors.yellow,
      'center',
    );
  }
}
export default {
  id: 'tradeoff',
  draw: drawTradeoff,
  cues: ['tradeoff-beat-1-focus-1', 'tradeoff-beat-1-focus-2', 'tradeoff-beat-2-focus-1'],
};
