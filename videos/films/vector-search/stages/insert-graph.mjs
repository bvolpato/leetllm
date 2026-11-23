import { distance } from '../arithmetic.mjs';
import { POINTS } from '../fixtures.mjs';
import { detailText } from '../defaults.mjs';
export function drawInsertGraph(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (i) =>
    currentBeat < i
      ? 0
      : currentBeat > i
        ? 1
        : api.focus.progress('insert-graph-b' + (i + 1), api.phase(progress, 0.08, 0.7));
  if (currentBeat === 3) {
    const count = api.focus.progress('raise-query-capacity', 0) > 0 ? 12 : 6;
    api.focus.target('query-capacity', () => {
      detailText(ctx, api, 'Request: 12 results', 960, 345, 48, themeColors.ink, 'center');
      for (let i = 0; i < 12; i++) {
        const x = 300 + (i % 6) * 230;
        const y = 460 + Math.floor(i / 6) * 165;
        api.rect(ctx, x, y, 162, 113, themeColors.panel, i < count ? themeColors.cyan : themeColors.muted, 5);
        detailText(ctx, api, String(i + 1), x + 81, y + 75, 42, i < count ? themeColors.cyan : themeColors.muted, 'center');
      }
      detailText(ctx, api, 'Retained capacity    ' + count + ' / 12', 960, 952, 43, themeColors.yellow, 'center');
    });
    return;
  }
  const target = 'insert-graph-mechanism';
  api.focus.target(target, () => {
    const G = {
        x: 6,
        y: 3,
      },
      layers = [[POINTS[4], POINTS[5]], [POINTS[4], POINTS[0], POINTS[5]], POINTS],
      x = (v) => 260 + v * 135;
    detailText(
      ctx,
      api,
      'G samples top layer 1 · existing maximum is 2',
      960,
      270,
      35,
      themeColors.yellow,
      'center',
    );
    layers.forEach((rows, layer) => {
      const y = 400 + layer * 225;
      api.line(ctx, 210, y, 1660, y, themeColors.muted, 2);
      detailText(ctx, api, 'layer ' + (2 - layer), 160, y - 65, 30, themeColors.muted);
      rows.forEach((pt) => {
        api.circle(ctx, x(pt.x), y, 13, pt.id === 'A' ? themeColors.green : themeColors.blue);
        detailText(ctx, api, pt.id, x(pt.x), y + 65, 31, themeColors.blue, 'center');
      });
      if (layer > 0 && currentBeat > 0) {
        api.circle(ctx, x(G.x), y - 75, 15, themeColors.yellow);
        detailText(ctx, api, 'G', x(G.x) + 35, y - 75, 31, themeColors.yellow);
      }
    });
    if (currentBeat === 0)
      detailText(
        ctx,
        api,
        'P(level ≥ ℓ) = M⁻ℓ · sampled populations vary',
        960,
        1020,
        30,
        themeColors.muted,
        'center',
      );
    else {
      api.line(ctx, x(G.x), 550, x(POINTS[0].x), 625, themeColors.green, 4);
      const candidates = POINTS.map((pt) => ({
          ...pt,
          d2: distance(pt, G),
        })).sort((a, b) => a.d2 - b.d2),
        selected = [];
      for (const pt of candidates)
        if (selected.every((other) => distance(pt, G) < distance(pt, other))) selected.push(pt);
      const show = currentBeat === 1 ? selected.slice(0, 1 + Math.floor(cue(1))) : selected;
      show.forEach((pt) => api.line(ctx, x(G.x), 775, x(pt.x), 850, themeColors.green, 4));
      detailText(
        ctx,
        api,
        currentBeat === 1
          ? 'Navigate above G · wire only layers G occupies'
          : 'Diverse first-pass neighbors: ' + selected.map((p) => p.id).join(', '),
        960,
        1020,
        30,
        themeColors.green,
        'center',
      );
    }
  });
}
export default {
  id: 'insert-graph',
  draw: drawInsertGraph,
  cues: ['insert-graph-b1', 'insert-graph-b2', 'insert-graph-b3', 'query-capacity', 'raise-query-capacity'],
};
