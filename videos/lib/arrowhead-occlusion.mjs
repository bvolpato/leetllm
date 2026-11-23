export const ARROWHEAD_OCCLUSION_RULE = Object.freeze({
  minimumArrowAlpha: 0.25,
  minimumFillAlpha: 0.25,
  minimumStrokeAlpha: 0.25,
});
export const ARROWHEAD_RING_OCCLUSION_SCOPE =
  'Positive-area overlap between registered triangular arrow heads and later-painted visible circle strokes whose fill is transparent or below the fill threshold. Circle axes and the registered max-axis-scaled stroke width recover the local annulus under nonsingular affine transforms. Ring contact tolerance uses 32 floating-point epsilons scaled by world-coordinate/axis magnitude and inverse normalized determinant to account for recorder subtraction and affine conditioning. Geometry whose normalized contact uncertainty reaches one fails explicitly. Missing stroke alpha means no registered stroke; visible strokes require finite positive width and a finite triangular head. Filled-node borders, clipping, other shapes, later repainting and final encoded pixels remain outside this ring diagnostic.';
export const ARROWHEAD_OCCLUSION_SCOPE =
  'Registered arrow or connect endpoints inside later-painted filled circles, using effective paint alpha, paint order and affine circle axes. Normalized ellipse-boundary differences within 32 floating-point epsilons are treated as contact. Partial filled-head overlaps with an uncovered endpoint, other occluder shapes, later repainting and final encoded pixels require separate inspection. ' +
  ARROWHEAD_RING_OCCLUSION_SCOPE;

const finitePoint = (point) => point && Number.isFinite(point.x) && Number.isFinite(point.y);

function insideCircle(point, shape) {
  if (!finitePoint(shape.center) || !finitePoint(shape.axisX) || !finitePoint(shape.axisY)) {
    throw new Error('A painted circle needs its center and affine axes');
  }
  const { axisX: a, axisY: b, center } = shape,
    determinant = a.x * b.y - a.y * b.x;
  if (Math.abs(determinant) < 1e-12) return false;
  const dx = point.x - center.x,
    dy = point.y - center.y;
  const u = (dx * b.y - dy * b.x) / determinant,
    v = (dy * a.x - dx * a.y) / determinant;
  return 1 - (u * u + v * v) > 32 * Number.EPSILON;
}

const cross = (a, b) => a.x * b.y - a.y * b.x;
const squared = (point) => point.x * point.x + point.y * point.y;
const apart = (a, b, epsilon) => b - a > epsilon * Math.max(1, Math.abs(a), Math.abs(b));

function triangleRadialRange(points) {
  const area = cross(
    { x: points[1].x - points[0].x, y: points[1].y - points[0].y },
    { x: points[2].x - points[0].x, y: points[2].y - points[0].y },
  );
  if (!Number.isFinite(area))
    throw new Error('Ring overlap requires finite normalized triangle calculations');
  if (area === 0) return null;
  const sides = points.map((point, i) => cross(point, points[(i + 1) % 3]));
  let minimum =
    sides.every((value) => value >= 0) || sides.every((value) => value <= 0) ? 0 : Infinity;
  for (const [i, a] of points.entries()) {
    const b = points[(i + 1) % 3],
      dx = b.x - a.x,
      dy = b.y - a.y,
      length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / length)) : 0;
    minimum = Math.min(minimum, squared({ x: a.x + t * dx, y: a.y + t * dy }));
  }
  const maximum = Math.max(...points.map(squared));
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum))
    throw new Error('Ring overlap requires finite normalized triangle calculations');
  return { minimumSquared: minimum, maximumSquared: maximum };
}

function ringHeadOverlap(arrow, circle) {
  if (!Array.isArray(arrow.head) || arrow.head.length !== 3 || !arrow.head.every(finitePoint)) {
    throw new Error('Ring overlap requires a registered finite triangular arrow head');
  }
  if (!finitePoint(circle.center) || !finitePoint(circle.axisX) || !finitePoint(circle.axisY)) {
    throw new Error('A painted ring needs its center and affine axes');
  }
  if (!Number.isFinite(circle.strokeWidth) || circle.strokeWidth <= 0)
    throw new Error('A painted ring needs positive registered stroke width');
  const scale = Math.max(
    Math.hypot(circle.axisX.x, circle.axisX.y),
    Math.hypot(circle.axisY.x, circle.axisY.y),
  );
  if (!Number.isFinite(scale) || scale <= 0)
    throw new Error('Ring overlap requires finite positive affine circle scale');
  const a = { x: circle.axisX.x / scale, y: circle.axisX.y / scale },
    b = { x: circle.axisY.x / scale, y: circle.axisY.y / scale };
  const determinant = cross(a, b);
  if (!Number.isFinite(determinant) || Math.abs(determinant) <= 32 * Number.EPSILON) {
    throw new Error('Ring overlap requires nonsingular affine circle axes');
  }
  const points = arrow.head.map((point) => {
    const dx = (point.x - circle.center.x) / scale,
      dy = (point.y - circle.center.y) / scale;
    return { x: (dx * b.y - dy * b.x) / determinant, y: (dy * a.x - dx * a.y) / determinant };
  });
  if (!points.every(finitePoint))
    throw new Error('Ring overlap requires finite circle-normalized head coordinates');
  const range = triangleRadialRange(points);
  if (!range) return null;
  // Both values use the same max-column transform scale recorded by scene.mjs.
  const halfWidth = circle.strokeWidth / scale / 2,
    inner = Math.max(0, 1 - halfWidth),
    outer = 1 + halfWidth;
  if (!Number.isFinite(outer * outer))
    throw new Error('Ring overlap requires finite normalized stroke calculations');
  // Recorded axes subtract two world points; the inverse map amplifies that rounding.
  const magnitude = Math.max(
    ...[circle.center, ...arrow.head].flatMap((p) => [Math.abs(p.x), Math.abs(p.y)]),
  );
  const epsilon = (32 * Number.EPSILON * Math.max(1, magnitude / scale)) / Math.abs(determinant);
  if (!Number.isFinite(epsilon) || epsilon >= 1)
    throw new Error('Ring overlap cannot resolve ill-conditioned normalized contact');
  if (
    !apart(inner * inner, range.maximumSquared, epsilon) ||
    !apart(range.minimumSquared, outer * outer, epsilon)
  )
    return null;
  return {
    ...range,
    normalizedInnerRadius: inner,
    normalizedOuterRadius: outer,
    normalizedContactEpsilon: epsilon,
  };
}

export function findArrowheadRingOcclusions(audit, rule = ARROWHEAD_OCCLUSION_RULE) {
  if (!Array.isArray(audit?.connectors) || !Array.isArray(audit?.shapes))
    throw new Error('Painted connectors and shapes are required');
  const minimumStrokeAlpha = rule.minimumStrokeAlpha ?? ARROWHEAD_OCCLUSION_RULE.minimumStrokeAlpha;
  for (const value of [rule.minimumArrowAlpha, rule.minimumFillAlpha, minimumStrokeAlpha]) {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new Error('Paint alpha thresholds must be between zero and one');
  }
  const candidates = [];
  for (const arrow of audit.connectors) {
    if (arrow.kind !== 'arrow' && arrow.kind !== 'connect') continue;
    if (
      !Number.isFinite(arrow.alpha) ||
      !Number.isFinite(arrow.order) ||
      !finitePoint(arrow.from) ||
      !finitePoint(arrow.to)
    ) {
      throw new Error('A painted arrow needs alpha, paint order and finite endpoints');
    }
    if (
      arrow.alpha <= 0 ||
      arrow.alpha < rule.minimumArrowAlpha ||
      (arrow.from.x === arrow.to.x && arrow.from.y === arrow.to.y)
    )
      continue;
    for (const circle of audit.shapes) {
      if (circle.kind !== 'circle') continue;
      const strokeAlpha = circle.strokeAlpha ?? 0;
      if (
        !Number.isFinite(circle.fillAlpha) ||
        !Number.isFinite(strokeAlpha) ||
        !Number.isFinite(circle.order)
      ) {
        throw new Error('A painted circle needs fill alpha, stroke alpha and paint order');
      }
      if (
        strokeAlpha <= 0 ||
        strokeAlpha < minimumStrokeAlpha ||
        circle.order <= arrow.order ||
        (circle.fillAlpha > 0 && circle.fillAlpha >= rule.minimumFillAlpha)
      )
        continue;
      const overlap = ringHeadOverlap(arrow, circle);
      if (overlap)
        candidates.push({
          type: 'arrowhead-overlapped-by-circle-stroke',
          arrowId: arrow.id,
          circleId: circle.id,
          arrowOrder: arrow.order,
          circleOrder: circle.order,
          arrowAlpha: arrow.alpha,
          strokeAlpha,
          fillAlpha: circle.fillAlpha,
          strokeWidth: circle.strokeWidth,
          head: arrow.head.map((point) => ({ ...point })),
          circle: {
            center: { ...circle.center },
            axisX: { ...circle.axisX },
            axisY: { ...circle.axisY },
          },
          overlap,
        });
    }
  }
  return candidates;
}

export function findArrowheadOcclusions(audit, rule = ARROWHEAD_OCCLUSION_RULE) {
  if (!Array.isArray(audit?.connectors) || !Array.isArray(audit?.shapes))
    throw new Error('Painted connectors and shapes are required');
  for (const value of [rule.minimumArrowAlpha, rule.minimumFillAlpha]) {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new Error('Paint alpha thresholds must be between zero and one');
  }
  const candidates = [];
  for (const arrow of audit.connectors) {
    if (arrow.kind !== 'arrow' && arrow.kind !== 'connect') continue;
    if (
      !Number.isFinite(arrow.alpha) ||
      !Number.isFinite(arrow.order) ||
      !finitePoint(arrow.from) ||
      !finitePoint(arrow.to)
    ) {
      throw new Error('A painted arrow needs alpha, paint order and finite endpoints');
    }
    if (
      arrow.alpha <= 0 ||
      arrow.alpha < rule.minimumArrowAlpha ||
      (arrow.from.x === arrow.to.x && arrow.from.y === arrow.to.y)
    )
      continue;
    for (const circle of audit.shapes) {
      if (circle.kind !== 'circle') continue;
      if (!Number.isFinite(circle.fillAlpha) || !Number.isFinite(circle.order))
        throw new Error('A painted circle needs fill alpha and paint order');
      if (
        circle.fillAlpha <= 0 ||
        circle.fillAlpha < rule.minimumFillAlpha ||
        circle.order <= arrow.order ||
        !insideCircle(arrow.to, circle)
      )
        continue;
      candidates.push({
        type: 'arrowhead-covered-by-circle',
        arrowId: arrow.id,
        circleId: circle.id,
        arrowOrder: arrow.order,
        circleOrder: circle.order,
        arrowAlpha: arrow.alpha,
        fillAlpha: circle.fillAlpha,
        endpoint: { ...arrow.to },
        circle: {
          center: { ...circle.center },
          axisX: { ...circle.axisX },
          axisY: { ...circle.axisY },
        },
      });
    }
  }
  return [...candidates, ...findArrowheadRingOcclusions(audit, rule)];
}
