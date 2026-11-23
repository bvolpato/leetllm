import { xy } from './fixtures.mjs';
import { mix, plotTicks, visibleLineSegments } from './arithmetic.mjs';
import { lessonFont } from '../../lib/fonts.mjs';
export function originalText(ctx, api, text, x, y, size = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, text, x, y, size, color, align);
}
export function originalMath(ctx, api, text, x, y, size = 40, color = api.C.ink, align = 'left') {
  return api.math(ctx, text, x, y, size, color, align);
}
export function originalFocus(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function originalPlot(
  ctx,
  api,
  xd = [0, 10],
  yd = [-0.5, 5.5],
  x = 220,
  y = 325,
  width = 970,
  height = 535,
) {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain: xd,
    yDomain: yd,
    xTicks: xd[0] < 0 ? [-4, -2, 0, 2, 4] : [0, 2, 4, 6, 8, 10],
    yTicks: yd[0] < -1 ? [-2, 0, 2] : [0, 2, 4],
    xLabel: 'coordinate 1',
    yLabel: 'coordinate 2',
    fontSize: 25,
    equalUnits: true,
  });
}
export function originalPoint(
  ctx,
  api,
  ids,
  labelOffsets,
  q,
  i,
  value = xy[i],
  color = api.C.muted,
  opacity = 1,
) {
  return api.components.fade(opacity, () => {
    const at = q.point(...value);
    api.circle(ctx, at.x, at.y, 10, color);
    originalText(
      ctx,
      api,
      ids[i],
      at.x + labelOffsets[i][0],
      at.y + labelOffsets[i][1],
      25,
      color,
      'center',
    );
  });
}
export function originalLine(
  ctx,
  api,
  labelExclusions,
  q,
  a,
  z,
  progress = 1,
  color = api.C.cyan,
  width = 3,
) {
  if (progress > 0) {
    const start = q.point(...a),
      end = q.point(mix(a[0], z[0], progress), mix(a[1], z[1], progress));
    for (const segment of visibleLineSegments(start, end, labelExclusions))
      api.path(ctx, segment, {
        color,
        width,
        clip: q.bounds,
      });
  }
}
export function originalEquation(ctx, api, text, y, color = api.C.ink, size = 35) {
  return originalMath(ctx, api, text, 1515, y, size, color, 'center');
}
export function originalFooter(ctx, api, text, color = api.C.muted) {
  return originalText(ctx, api, text, 960, 1015, 29, color, 'center');
}
export function extensionText(
  ctx,
  api,
  labelBoxes,
  v,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'center',
) {
  const text = String(v);
  ctx.save();
  ctx.font = lessonFont(size);
  const width = ctx.measureText(text).width;
  ctx.restore();
  labelBoxes.push({
    x: x - (align === 'center' ? width / 2 : align === 'right' ? width : 0) - 5,
    y: y - size - 5,
    width: width + 10,
    height: size + 10,
  });
  return api.text(ctx, text, x, y, size, color, align);
}
export function extensionMath(ctx, api, v, x, y, size = 38, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function extensionNote(ctx, api, labelBoxes, v) {
  return extensionText(ctx, api, labelBoxes, v, 960, 1015, 27, api.C.muted);
}
export function extensionAxes(
  ctx,
  api,
  xd = [0, 10],
  yd = [-0.5, 5.5],
  x = 170,
  y = 320,
  width = 1000,
  height = 550,
) {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain: xd,
    yDomain: yd,
    xTicks: plotTicks(xd),
    yTicks: plotTicks(yd),
    xLabel: 'coordinate 1',
    yLabel: 'coordinate 2',
    fontSize: 25,
    equalUnits: true,
  });
}
export function extensionDots(
  ctx,
  api,
  styleSceneId,
  colors,
  ids,
  labelBoxes,
  q,
  points,
  names = ids,
  assignments = null,
) {
  return points.forEach((p, i) => {
    const at = q.point(...p),
      color = assignments ? colors[assignments[i]] : api.C.cyan;
    api.circle(ctx, at.x, at.y, 10, color);
    extensionText(
      ctx,
      api,
      labelBoxes,
      names[i],
      at.x + (styleSceneId === 'metric-choice' ? 18 : -18),
      at.y +
        (styleSceneId === 'fresh-seed-repair' || (styleSceneId === 'initialization' && i === 3)
          ? 55
          : -25),
      25,
      color,
      styleSceneId === 'metric-choice' ? 'left' : 'right',
    );
  });
}
export function extensionSegment(
  ctx,
  api,
  pendingSegments,
  q,
  a,
  z,
  color = api.C.cyan,
  width = 4,
  p = 1,
) {
  if (p > 0)
    pendingSegments.push({
      q,
      a: q.point(...a),
      z: q.point(...a.map((v, i) => mix(v, z[i], p))),
      color,
      width,
    });
}
export function extensionRing(ctx, api, q, p, color = api.C.yellow) {
  const a = q.point(...p);
  api.circle(ctx, a.x, a.y, 18, 'transparent', color, 4);
}
export function extensionRows(ctx, api, labelBoxes, values, x = 1300, y = 395, gap = 80) {
  return values.forEach((v, i) =>
    extensionText(
      ctx,
      api,
      labelBoxes,
      v,
      x,
      y + i * gap,
      30,
      i === values.length - 1 ? api.C.yellow : api.C.ink,
    ),
  );
}
export function scaleText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function scaleMath(ctx, api, v, x, y, size = 36, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
