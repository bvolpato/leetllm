import { QUANTIZATION_FIXTURE } from '../fixtures.mjs';
import { TRACKS } from '../construction.mjs';
import { quantizationFrame, quantizationProgress } from '../model.mjs';
import { plane, text, vectorLine } from '../defaults.mjs';
function drawComplete(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  return false;
}
export function drawQuantization(ctx, scene, state, api) {
  if (drawComplete(ctx, scene, state, api)) return;
  const { C: themeColors, components, teaching } = api;
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
      id: `${'quantization'}-${String(label).slice(0, 15)}-${x}-${y}`,
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
  const reached = (id, fallback) =>
    state.cues?.[id] ? state.cues[id].phase !== 'before' : fallback;
  const snapshot = TRACKS['quantization'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    const quantizeProgress = quantizationProgress(beat, progress);
    const rows = quantizationFrame(quantizeProgress);
    text(ctx, api, snapshot.label, 960, 300, 35, themeColors.ink, 'center');
    const graph = plane(ctx, api, {
      x: 180,
      y: 390,
      width: 800,
      height: 440,
      domain: [0, 1.2],
      yDomain: [-0.1, 0.55],
    });
    for (let x = 0; x <= 1.2 + 1e-8; x += 0.2) {
      api.path(ctx, [graph.point(x, 0), graph.point(x, 0.4)], {
        color: themeColors.muted + '44',
        width: 1,
        clip: graph.bounds,
      });
    }
    for (let y = 0; y <= 0.4 + 1e-8; y += 0.2) {
      api.path(ctx, [graph.point(0, y), graph.point(1.2, y)], {
        color: themeColors.muted + '44',
        width: 1,
        clip: graph.bounds,
      });
    }
    api.focus.target('quantized-query', () =>
      vectorLine(ctx, api, graph, QUANTIZATION_FIXTURE.query, themeColors.cyan, 1, 3),
    );
    rows.forEach((row, index) => {
      const y = 420 + index * 190,
        color = index === 0 ? themeColors.green : themeColors.pink;
      const original = graph.point(...row.vector),
        current = graph.point(...row.current);
      api.circle(ctx, original.x, original.y, 8, themeColors.bg, color, 2);
      api.path(ctx, [original, current], {
        color,
        width: 3,
      });
      api.focus.target('quantized-endpoint-' + index, () =>
        vectorLine(ctx, api, graph, row.current, color, 1, index === 0 ? 5 : 3),
      );
      api.focus.target('quantized-code-' + index, () =>
        card(
          `Passage ${index + 1} · [${row.current.map((value) => value.toFixed(3)).join(', ')}]`,
          1100,
          y,
          650,
          76,
          color,
          1,
          27,
        ),
      );
      teaching.changeCue(
        {
          x: 1100,
          y: y + 85,
          width: 650,
          height: 70,
          from: row.exactCosine,
          to: row.currentCosine,
          progress: 1,
          emphasis: quantizeProgress > 0 && quantizeProgress < 1 ? 1 : 0,
          color: themeColors.yellow,
          restColor: color,
        },
        (cue) =>
          api.focus.target('quantized-cosine-' + index, () =>
            text(
              ctx,
              api,
              `Current cosine ${cue.value.toFixed(3)}`,
              1425,
              y + 125,
              30,
              cue.color,
              'center',
            ),
          ),
      );
    });
    text(
      ctx,
      api,
      'Query direction · 0.2 coordinate grid',
      560,
      965,
      27,
      themeColors.cyan,
      'center',
    );
    if (reached('quantization-merged-coordinate-tie-b3-1', snapshot.stage >= 2)) {
      const tied = api.focus.target('merged-coordinate-tie', () =>
        card('Both endpoints → [1.0, 0.2] · tie', 1095, 830, 670, 78, themeColors.yellow, 1, 27),
      );
      text(
        ctx,
        api,
        'Recheck exact ranking on held-out queries.',
        1425,
        985,
        25,
        themeColors.muted,
        'center',
      );
      void tied;
    }
  }
}
export default {
  id: 'quantization',
  draw: drawQuantization,
  cues: [
    'quantization-quantized-endpoint-0-b1-1',
    'quantization-quantized-endpoint-0-b2-1',
    'quantization-merged-coordinate-tie-b3-1',
  ],
};
