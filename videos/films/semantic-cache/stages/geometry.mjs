import {
  drawSemanticText,
  withSemanticConstructionFrame,
  withSemanticLegacyFrame,
} from '../defaults.mjs';
export function paintGeometry(ctx, scene, state, api, themeColors, c, t, s, currentBeat) {
  drawSemanticText(
    ctx,
    api,
    themeColors,
    'Normalized vectors · displayed with equal coordinate scales',
    140,
    265,
    29,
    themeColors.muted,
  );
  const axes = t.axes({
    x: 160,
    y: 350,
    width: 760,
    height: 470,
    xDomain: [0, 1.1],
    yDomain: [0, 0.68],
    equalUnits: true,
    xLabel: 'coordinate 1',
    yLabel: 'coordinate 2',
    xTicks: [0, 0.5, 1],
    yTicks: [0, 0.5],
  });
  const origin = axes.point(0, 0),
    stored = axes.point(1, 0),
    point = axes.point(...s.vector);
  api.focus.target('stored-vector', () =>
    api.line(ctx, origin.x, origin.y, stored.x, stored.y, themeColors.blue, 5),
  );
  api.focus.target('query-vector', () =>
    api.line(ctx, origin.x, origin.y, point.x, point.y, themeColors.yellow, 5),
  );
  api.focus.target('query-vector', () => api.circle(ctx, point.x, point.y, 10, themeColors.yellow));
  drawSemanticText(
    ctx,
    api,
    themeColors,
    'Stored policy direction',
    350,
    970,
    28,
    themeColors.blue,
  );
  api.focus.target('similarity-readout', () =>
    drawSemanticText(
      ctx,
      api,
      themeColors,
      `Similarity ${s.similarity.toFixed(4)}`,
      1110,
      420,
      33,
      themeColors.yellow,
    ),
  );
  api.focus.target('distance-readout', () =>
    drawSemanticText(
      ctx,
      api,
      themeColors,
      `Distance ${s.distance.toFixed(4)}`,
      1110,
      520,
      33,
      themeColors.cyan,
    ),
  );
  drawSemanticText(
    ctx,
    api,
    themeColors,
    currentBeat === 0
      ? 'Paraphrase · same required field'
      : s.settled
        ? 'Restore-key question · different field'
        : 'Moving toward the exception question',
    1110,
    655,
    27,
    currentBeat ? themeColors.pink : themeColors.green,
  );
  const scoreX = (value) => 1140 + ((value - 0.99) / 0.01) * 550;
  api.line(ctx, scoreX(0.99), 720, scoreX(1), 720, themeColors.muted, 2);
  [0.99, 0.995, 1].forEach((value) =>
    drawSemanticText(
      ctx,
      api,
      themeColors,
      value.toFixed(3),
      scoreX(value),
      775,
      24,
      themeColors.muted,
      'center',
    ),
  );
  api.focus.target('similarity-readout', () =>
    api.circle(ctx, scoreX(s.similarity), 720, 10, themeColors.yellow),
  );
  api.focus.target('distance-readout', () =>
    api.math(
      ctx,
      String.raw`d_{\cos}=1-\frac{u\cdot v}{\lVert u\rVert\lVert v\rVert}`,
      1280,
      840,
      41,
      themeColors.yellow,
      'center',
    ),
  );
}
export function drawGeometry(ctx, scene, state, api) {
  if (withSemanticConstructionFrame(ctx, scene, state, api, paintGeometry)) return;
  withSemanticLegacyFrame(ctx, scene, state, api, paintGeometry);
}
export default {
  id: 'geometry',
  draw: drawGeometry,
  cues: ['stored-direction', 'unit-similarity', 'rotate-question', 'distance-definition'],
};
