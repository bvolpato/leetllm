import { DASHBOARD } from '../fixtures.mjs';
import { TRACKS, chartEvidence } from '../model.mjs';
import { drawOriginalCard, text as drawOriginalText } from '../defaults.mjs';
export function drawRouteChoice(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress2 = api.clamp(state.beatP ?? 0);
  const transfer = (from, to, color = themeColors.cyan, progress = progress2, opacity = 1) => {
    if (progress < 0.25) return;
    teaching.transfer({
      source: {
        shape: from,
        opacity,
      },
      target: {
        shape: to,
        opacity,
      },
      progress,
      color,
      particle: {
        radius: 8,
        fill: themeColors.yellow,
      },
      gap: 12,
    });
  };
  const snapshot = TRACKS['route-choice'].sample({
    beat,
    beatP: progress2,
  }).snapshot;
  const lineSeries = DASHBOARD.series.map((series) => ({
    ...series,
    color: themeColors[series.tone],
  }));
  const evidence = chartEvidence();
  {
    drawOriginalText(
      ctx,
      api,
      'Preserve each request and choose its output contract',
      960,
      278,
      35,
      themeColors.ink,
      'center',
    );
    const cases = [
      {
        prompt: 'Find similar dashboards',
        route: 'Pooled embedding search',
        color: themeColors.blue,
        cue: 'route-similarity-request',
      },
      {
        prompt: 'Explain the chart spike',
        route: 'Image tokens + language decoder',
        color: themeColors.green,
        cue: 'route-chart-explanation',
      },
      {
        prompt: 'Locate a small badge',
        route: 'Grounding model + region output',
        color: themeColors.yellow,
        cue: 'route-localized-badge',
      },
    ];
    cases.forEach((item, i) => {
      const visible = state.cues ? api.focus.visible(item.cue) : i <= beat;
      if (!visible) return;
      const y = 365 + i * 160;
      const request = api.focus.target('route-choice-request-' + i, () =>
        drawOriginalCard(ctx, api, item.prompt, 190, y, 620, 100, item.color, 29),
      );
      const path = api.focus.target('route-choice-output-' + i, () =>
        drawOriginalCard(ctx, api, item.route, 1110, y, 620, 100, item.color, 27),
      );
      transfer(request, path, item.color, 1);
    });
    if (state.cues ? api.focus.visible('route-ocr-labels') : beat > 0)
      api.focus.target('route-choice-ocr', () =>
        drawOriginalCard(
          ctx,
          api,
          'Tiny printed label → OCR text output',
          350,
          900,
          1220,
          75,
          themeColors.pink,
          28,
        ),
      );
  }
}
export default {
  id: 'route-choice',
  draw: drawRouteChoice,
  cues: [
    'route-similarity-request',
    'route-chart-explanation',
    'route-localized-badge',
    'route-ocr-labels',
    'route-system-composition',
  ],
};
