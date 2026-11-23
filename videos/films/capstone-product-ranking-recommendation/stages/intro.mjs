import { catalog } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('intro', state);
  {
    api.focus.target('query', () =>
      text(ctx, api, 'Search: label printer', 960, 285, 40, themeColors.ink, 'center'),
    );
    catalog.forEach((row, i) => {
      const x = 150 + i * 335,
        y = 420;
      const shape = api.focus.target(row.ok ? 'permitted-products' : 'blocked-products', () =>
        card(
          ctx,
          api,
          row.id + ' · ' + row.match.toFixed(2),
          x,
          y,
          280,
          row.ok ? themeColors.cyan : themeColors.pink,
        ),
      );
      api.focus.target('eligibility-reasons', () =>
        text(
          ctx,
          api,
          row.ok ? 'Eligible' : row.id === 'P8' ? 'Policy block' : 'Wrong region',
          x + 140,
          y - 35,
          26,
          row.ok ? themeColors.green : themeColors.pink,
          'center',
        ),
      );
      if (row.ok) {
        const target = api.focus.target('ranking-pool', () =>
          card(ctx, api, 'Ranking pool', x, y + 320, 280, themeColors.green),
        );
        teaching.transfer({
          source: {
            shape,
            opacity: 1,
          },
          target: {
            shape: target,
            opacity: 1,
          },
          color: themeColors.green,
          progress: modelState.q,
          particle: {
            radius: 8,
            fill: themeColors.yellow,
          },
        });
      } else {
        api.line(ctx, x + 80, y + 260, x + 200, y + 260, themeColors.pink, 5);
      }
    });
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-b1-1', 'intro-b1-2', 'intro-b1-3', 'intro-b2-1', 'intro-b2-2'],
};
