import { AGENT_DAG } from './fixtures.mjs';
export function cueAmount(state, id) {
  return state.cues?.[id]?.progress ?? 0;
}
export function cueDone(state, id) {
  const cue = state.cues?.[id];
  return cue?.phase === 'after' || (cue?.phase === undefined && cue?.progress === 1);
}

export function drawLoopText(ctx, api, s, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawLoopEquation(ctx, api, s, x, y, size = 42, color = api.C.cyan) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function drawLoopCard(ctx, api, label, x, y, w = 380, color = api.C.cyan, h = 100) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: 32,
    baselineOffset: 32 * (label.includes('\n') ? -0.36 : 0.34),
    padding: 12,
  });
}
export function drawLoopFooter(ctx, api, s) {
  return drawLoopText(ctx, api, s, 960, 950, 28, api.C.muted, 'center');
}
export function drawFocusTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawCenteredText(ctx, api, s, x, y, n = 30, c = api.C.ink) {
  return api.text(ctx, String(s), x, y, n, c, 'center');
}
export function drawLeftText(ctx, api, s, x, y, n = 30, c = api.C.ink) {
  return api.text(ctx, String(s), x, y, n, c, 'left');
}
export function drawEquation(ctx, api, s, x, y, n = 40, c = api.C.cyan) {
  return api.math(ctx, s, x, y, n, c, 'center');
}
export function drawLine(ctx, api, x1, y1, x2, y2, c = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, c, w);
}
export function drawArrow(ctx, api, x1, y1, x2, y2, c = api.C.cyan) {
  return api.arrow(ctx, x1, y1, x2, y2, c, 4);
}
export function drawBox(ctx, api, s, x, y, w = 340, h = 86, c = api.C.blue) {
  api.rect(ctx, x, y, w, h, api.C.panel, c, 2, 10);
  drawCenteredText(ctx, api, s, x + w / 2, y + h / 2 + 10, 29, c);
  return {
    x,
    y,
    width: w,
    height: h,
  };
}
export function drawFooter(ctx, api, s) {
  return drawCenteredText(ctx, api, s, 960, 1005, 26, api.C.muted);
}
export function drawSegments(
  ctx,
  api,
  values,
  x,
  y,
  { w = 1150, h = 64, max = 1, colors = [] } = {},
) {
  let at = x;
  values.forEach((v, i) => {
    const width = (w * v) / max;
    api.rect(ctx, at, y, width, h, colors[i] ?? api.C.blue);
    at += width;
  });
}
export function drawDependencyGraph(
  ctx,
  api,
  statuses = {},
  receipts = {},
  highlight,
  omitEffect = false,
) {
  const coords = {
    ci: [190, 370],
    diff: [190, 570],
    health: [190, 770],
    decision: [820, 570],
    effect: [1440, 570],
  };
  for (const [id, parents] of Object.entries(AGENT_DAG))
    if (!(omitEffect && id === 'effect'))
      for (const p of parents) {
        const [a, z] = [coords[p], coords[id]];
        drawLine(
          ctx,
          api,
          a[0] + 300,
          a[1] + 43,
          z[0],
          z[1] + 43,
          statuses[p] ? api.C.green : api.C.muted,
          3,
        );
      }
  for (const [id, [x, y]] of Object.entries(coords)) {
    if (omitEffect && id === 'effect') continue;
    const c = statuses[id] ? api.C.green : id === highlight ? api.C.yellow : api.C.muted;
    drawBox(
      ctx,
      api,
      id + (receipts[id] && id !== 'decision' ? ' · ' + receipts[id] : ''),
      x,
      y,
      300,
      86,
      c,
    );
    if (id === 'decision' && receipts[id])
      drawCenteredText(ctx, api, receipts[id], x + 150, y + 135, 25, api.C.yellow);
  }
  return coords;
}
