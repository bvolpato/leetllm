import { longContextModel } from '../construction.mjs';
import { contextText, footer, modelTarget } from '../defaults.mjs';
export function drawEvidenceRoute(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = longContextModel('evidence-route', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    contextText(
      ctx,
      api,
      'Keep D1 and its version attached to the evidence',
      960,
      270,
      38,
      themeColors.cyan,
    );
    const route = currentBeat === 0 ? 0 : currentBeat === 1 ? 1 : 2,
      ys = [420, 625, 830],
      names = ['bounded full packet', 'retrieved or chunked evidence', 'complete count population'];
    ys.forEach((y, i) => {
      contextText(
        ctx,
        api,
        names[i],
        430,
        y + 10,
        32,
        i === route ? themeColors.ink : themeColors.muted,
      );
      const x = 780 + 760 * progress;
      if (i !== route || x - 110 > 720)
        api.line(
          ctx,
          720,
          y,
          i === route ? x - 110 : 1600,
          y,
          i === route ? themeColors.yellow : themeColors.muted,
          3,
        );
      if (i === route && x + 110 < 1600) api.line(ctx, x + 110, y, 1600, y, themeColors.yellow, 3);
    });
    const x = 780 + 760 * progress,
      y = ys[route];
    modelTarget(ctx, api, 'evidence-route', () => {
      api.rect(ctx, x - 95, y - 52, 190, 104, themeColors.panel, themeColors.yellow, 4);
      contextText(ctx, api, 'D1 · source', x, y + 12, 31, themeColors.yellow);
    });
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'A ranking buffer cannot certify an exact population'
        : 'Source identity survives the route · stale or omitted evidence remains a separate failure',
    );
  }
}
export default {
  id: 'evidence-route',
  draw: drawEvidenceRoute,
  cues: ['evidence-route-0', 'evidence-route-1', 'evidence-route-2'],
};
