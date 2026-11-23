export const AGGREGATE_OCCLUSION_RULE = 'aggregate-later-fill-glyph-occlusion';

function bounds(item) {
  if (!item.points?.length) return item;
  const xs = item.points.map((point) => point.x),
    ys = item.points.map((point) => point.y);
  const x = Math.min(...xs),
    y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

function overlaps(a, b) {
  return (
    Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x) &&
    Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y)
  );
}

function inside(point, item) {
  if (item.kind === 'circle' && item.axisX && item.axisY) {
    const dx = point.x - item.center.x,
      dy = point.y - item.center.y;
    const det = item.axisX.x * item.axisY.y - item.axisX.y * item.axisY.x;
    if (!det) return false;
    const u = (dx * item.axisY.y - dy * item.axisY.x) / det;
    const v = (dy * item.axisX.x - dx * item.axisX.y) / det;
    return u * u + v * v <= 1;
  }
  if (!item.points?.length)
    return (
      point.x >= item.x &&
      point.x <= item.x + item.width &&
      point.y >= item.y &&
      point.y <= item.y + item.height
    );
  let winding = 0;
  for (let i = 0; i < item.points.length; i++) {
    const a = item.points[i],
      b = item.points[(i + 1) % item.points.length];
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
    if (a.y <= point.y && b.y > point.y && cross > 0) winding++;
    if (a.y > point.y && b.y <= point.y && cross < 0) winding--;
  }
  return winding !== 0;
}

function glyphInk(label, point) {
  const mask = label.ink;
  if (!mask) throw new Error(`Aggregate occlusion requires glyph ink: ${label.text}`);
  const dx = point.x - mask.origin.x,
    dy = point.y - mask.origin.y;
  const det = mask.axisX.x * mask.axisY.y - mask.axisX.y * mask.axisY.x;
  if (!Number.isFinite(det) || !det) throw new Error(`Invalid glyph transform: ${label.text}`);
  const x = Math.floor((dx * mask.axisY.y - dy * mask.axisY.x) / det);
  const y = Math.floor((dy * mask.axisX.x - dx * mask.axisX.y) / det);
  return (
    x >= 0 && y >= 0 && x < mask.width && y < mask.height && mask.data[y * mask.width + x] >= 64
  );
}

// Use the renderer's paint order, opaque-fill cutoff and glyph sampling policy.
// A sample covered by several fills contributes once to the union.
export function aggregateOcclusion(audit) {
  const fills = [...(audit.shapes ?? []), ...(audit.paths ?? [])]
    .filter((item) => (item.fillAlpha ?? 0) >= 0.98)
    .map((item) => ({ item, bounds: bounds(item) }));
  const findings = [];
  for (const label of audit.labels ?? []) {
    if ((label.alpha ?? 1) < 0.25) continue;
    const candidates = fills.filter(
      (fill) =>
        fill.item.order > label.order &&
        overlaps(label, fill.bounds) &&
        (!fill.item.clip || overlaps(label, bounds(fill.item.clip))),
    );
    if (!candidates.length) continue;
    const counts = candidates.map(() => 0);
    let inkSamples = 0,
      hiddenSamples = 0,
      first;
    for (let y = label.y + 1.5; y < label.y + label.height; y += 3) {
      for (let x = label.x + 1.5; x < label.x + label.width; x += 3) {
        const point = { x, y };
        if (!glyphInk(label, point)) continue;
        inkSamples++;
        let hidden = false;
        candidates.forEach(({ item, bounds: b }, i) => {
          if (point.x < b.x || point.x > b.x + b.width || point.y < b.y || point.y > b.y + b.height)
            return;
          if (inside(point, item) && (!item.clip || inside(point, item.clip))) {
            counts[i]++;
            hidden = true;
          }
        });
        if (hidden) {
          hiddenSamples++;
          first ??= point;
        }
      }
    }
    if (hiddenSamples >= 3 && hiddenSamples >= inkSamples * 0.08)
      findings.push({
        type: AGGREGATE_OCCLUSION_RULE,
        text: label.text,
        labelOrder: label.order,
        coveredInkFraction: hiddenSamples / inkSamples,
        inkSamples,
        hiddenSamples,
        point: first,
        fills: candidates.flatMap(({ item }, i) =>
          counts[i]
            ? [{ id: item.id, order: item.order, coveredInkFraction: counts[i] / inkSamples }]
            : [],
        ),
      });
  }
  return findings;
}
