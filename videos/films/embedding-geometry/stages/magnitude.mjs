import { cosine, dot, l2 } from '../arithmetic.mjs';
import { PASSAGES, QUERY } from '../fixtures.mjs';
import { TRACKS } from '../construction.mjs';
import { magnitudeScale } from '../model.mjs';
import { plane, text, vectorLine } from '../defaults.mjs';
function drawComplete(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  return false;
}
export function drawMagnitude(ctx, scene, state, api) {
  if (drawComplete(ctx, scene, state, api)) return;
  const { C: themeColors, components } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const card = (
    label,
    x,
    y,
    width,
    height = 82,
    color = themeColors.cyan,
    opacity = 1,
    fontSize = 27,
  ) =>
    components.card({
      id: `${'magnitude'}-${String(label).slice(0, 15)}-${x}-${y}`,
      label,
      x,
      y,
      width,
      height,
      fill: themeColors.panel,
      stroke: color,
      textColor: color,
      radius: 14,
      padding: 10,
      fontSize,
      opacity,
    });
  const snapshot = TRACKS['magnitude'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    const graph = plane(ctx, api, {
      domain: [-1, 11],
      yDomain: [-1, 4],
    });
    vectorLine(ctx, api, graph, QUERY, themeColors.cyan);
    const scale = magnitudeScale(beat, progress);
    const scaled = PASSAGES[0].vector.map((value) => value * scale);
    vectorLine(ctx, api, graph, PASSAGES[0].vector, themeColors.green + '55', 1, 2);
    api.focus.target('stretched-passage-a', () =>
      vectorLine(ctx, api, graph, scaled, themeColors.green, 1, 6),
    );
    text(ctx, api, `A scale · ${scale.toFixed(1)}×`, 960, 300, 34, themeColors.ink, 'center');
    const currentDot = dot(QUERY, scaled);
    const currentCos = cosine(QUERY, scaled);
    const currentDistance = l2(QUERY, scaled);
    api.focus.target('magnitude-dot-score', () =>
      card(`Dot product · ${currentDot.toFixed(2)}`, 1250, 430, 430, 82, themeColors.yellow, 1, 26),
    );
    api.focus.target('magnitude-cosine-score', () =>
      card(`Cosine · ${currentCos.toFixed(3)}`, 1250, 555, 430, 82, themeColors.green, 1, 27),
    );
    api.focus.target('magnitude-distance-score', () =>
      card(`L2 gap · ${currentDistance.toFixed(2)}`, 1250, 680, 430, 82, themeColors.pink, 1, 27),
    );
    text(
      ctx,
      api,
      scale < 10 ? 'Stretch A along its fixed ray' : 'Same ray · current 10×',
      960,
      920,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'magnitude',
  draw: drawMagnitude,
  cues: [
    'magnitude-stretched-passage-a-b1-1',
    'magnitude-magnitude-cosine-score-b2-1',
    'magnitude-magnitude-dot-score-b2-2',
    'magnitude-magnitude-distance-score-b3-1',
  ],
};
