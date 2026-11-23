import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionPanel,
  drawConstructionText,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawReaderBeforeRanking(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('reader-before-ranking', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'reader-before-ranking', () => {
    drawConstructionPanel(ctx, api, 100, 300, 1170, 650, themeColors.blue);
    drawConstructionText(
      ctx,
      api,
      'Trusted retrieval boundary · A / Alice',
      135,
      345,
      29,
      themeColors.blue,
    );
    modelState.documents.forEach((r, i) => {
      const y = 415 + i * 155,
        permitted = r.tenant === 'A' && r.reader === 'Alice';
      drawConstructionBox(
        ctx,
        api,
        r.id + ' · ' + r.score.toFixed(2) + '\n' + r.tenant + ' / reader ' + r.reader,
        150,
        y,
        630,
        115,
        permitted ? themeColors.cyan : themeColors.muted,
        29,
      );
      if (!modelState.wrong && modelState.filterReady)
        drawConstructionCenter(
          ctx,
          api,
          permitted ? 'PERMITTED' : 'stays inside boundary',
          1020,
          y + 68,
          permitted ? 30 : 25,
          permitted ? themeColors.green : themeColors.muted,
        );
    });
    if (currentBeat === 0) {
      if (modelState.filterReady) {
        drawConstructionArrow(ctx, api, 1310, 615, 1390, 615, themeColors.green);
        drawConstructionBox(
          ctx,
          api,
          'Alice receives\nA-public · 0.80',
          1430,
          515,
          380,
          190,
          themeColors.green,
          31,
        );
      }
    } else if (currentBeat === 1) {
      drawConstructionCenter(
        ctx,
        api,
        'Explicit restart: broad top 1 first',
        960,
        270,
        29,
        themeColors.yellow,
      );
      drawConstructionBox(
        ctx,
        api,
        'global top 1\nB-secret · 0.99',
        1370,
        395,
        460,
        135,
        themeColors.pink,
        31,
      );
      if (modelState.empty)
        drawConstructionBox(
          ctx,
          api,
          'then reader filter\nno authorized result',
          1370,
          655,
          460,
          160,
          themeColors.pink,
          30,
        );
    } else {
      drawConstructionBox(
        ctx,
        api,
        'Actual service role',
        1370,
        380,
        460,
        120,
        themeColors.yellow,
        30,
      );
      drawConstructionBox(
        ctx,
        api,
        'RLS policy applies?\nCheck bypass / owner',
        1370,
        650,
        460,
        150,
        themeColors.yellow,
        29,
      );
    }
    drawConstructionFoot(
      ctx,
      api,
      'Forbidden IDs, scores and text remain inside the trusted operation',
    );
  });
}
export default {
  id: 'reader-before-ranking',
  draw: drawReaderBeforeRanking,
  cues: [
    'mt-reader-before-ranking-b0',
    'mt-reader-before-ranking-s0-0',
    'mt-reader-before-ranking-s0-1',
    'mt-reader-before-ranking-s0-2',
    'mt-reader-before-ranking-s0-3',
    'mt-reader-before-ranking-b1',
    'mt-reader-before-ranking-s1-0',
    'mt-reader-before-ranking-s1-2',
    'mt-reader-before-ranking-b2',
  ],
};
