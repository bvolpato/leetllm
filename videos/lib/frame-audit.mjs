const VISIBLE_ALPHA = 0.25;
const EPSILON = 0.5;
const PAINTED_SHAPE = Symbol.for('leetllm.video.painted-shape');

export const LAYOUT_AUDIT_RULES = Object.freeze([
  'visible-label-collisions',
  'scoped-label-containment',
  'scoped-shape-containment',
  'scoped-path-containment',
  'scoped-connector-containment',
  'filled-child-panel-boundaries',
  'glyph-ink-versus-visible-strokes',
  'later-opaque-shape-and-path-text-occlusion',
  'later-opaque-shape-and-path-image-occlusion',
  'painted-node-connector-attachments',
  'canvas-and-stroke-bounds',
  'finite-shape-path-connector-geometry',
  'tracked-animation-canvas-paint',
]);

function boundsOf(item, stroke = false) {
  let bounds;
  if (item.points?.length) {
    const xs = item.points.map((point) => point.x),
      ys = item.points.map((point) => point.y);
    bounds = {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  } else bounds = { x: item.x, y: item.y, width: item.width, height: item.height };
  const pad = stroke ? (item.strokeWidth ?? 0) / 2 : 0;
  return {
    x: bounds.x - pad,
    y: bounds.y - pad,
    width: bounds.width + pad * 2,
    height: bounds.height + pad * 2,
  };
}

function polygon(item) {
  return (
    item.points ?? [
      { x: item.x, y: item.y },
      { x: item.x + item.width, y: item.y },
      { x: item.x + item.width, y: item.y + item.height },
      { x: item.x, y: item.y + item.height },
    ]
  );
}

function inside(point, shape) {
  if (shape.kind === 'circle' && shape.axisX && shape.axisY) {
    const dx = point.x - shape.center.x,
      dy = point.y - shape.center.y;
    const det = shape.axisX.x * shape.axisY.y - shape.axisX.y * shape.axisY.x;
    if (!det) return false;
    const u = (dx * shape.axisY.y - dy * shape.axisY.x) / det;
    const v = (dy * shape.axisX.x - dx * shape.axisX.y) / det;
    return u * u + v * v <= 1 + 1e-6;
  }
  const points = polygon(shape);
  if (shape.kind === 'path') {
    let winding = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
      if (a.y <= point.y && b.y > point.y && cross > 0) winding++;
      if (a.y > point.y && b.y <= point.y && cross < 0) winding--;
    }
    return winding !== 0;
  }
  let sign = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
    if (Math.abs(cross) <= 1e-6) continue;
    const next = Math.sign(cross);
    if (sign && sign !== next) return false;
    sign = next;
  }
  return true;
}

function paintedInside(point, item, minimumAlpha = VISIBLE_ALPHA) {
  if (!inside(point, item) || (item.clip && !inside(point, item.clip))) return false;
  if (!item.raster) return true;
  const mask = item.raster,
    dx = point.x - mask.origin.x,
    dy = point.y - mask.origin.y;
  const determinant = mask.axisX.x * mask.axisY.y - mask.axisX.y * mask.axisY.x;
  if (!determinant) return false;
  const x = Math.floor((dx * mask.axisY.y - dy * mask.axisY.x) / determinant);
  const y = Math.floor((dy * mask.axisX.x - dx * mask.axisX.y) / determinant);
  return (
    x >= 0 &&
    y >= 0 &&
    x < mask.width &&
    y < mask.height &&
    (mask.data[y * mask.width + x] / 255) * mask.opacity >= minimumAlpha
  );
}

function intersection(a, b) {
  const x = Math.max(a.x, b.x),
    y = Math.max(a.y, b.y);
  return {
    x,
    y,
    width: Math.min(a.x + a.width, b.x + b.width) - x,
    height: Math.min(a.y + a.height, b.y + b.height) - y,
  };
}

function contained(inner, outer, tolerance = EPSILON) {
  return (
    inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    inner.x + inner.width <= outer.x + outer.width + tolerance &&
    inner.y + inner.height <= outer.y + outer.height + tolerance
  );
}

function polygonContains(points, outer, padding = 0) {
  const boundary = polygon(outer);
  let area = 0;
  for (let i = 0; i < boundary.length; i++)
    area +=
      boundary[i].x * boundary[(i + 1) % boundary.length].y -
      boundary[(i + 1) % boundary.length].x * boundary[i].y;
  const sign = area >= 0 ? 1 : -1;
  return points.every((point) =>
    boundary.every((a, i) => {
      const b = boundary[(i + 1) % boundary.length],
        dx = b.x - a.x,
        dy = b.y - a.y;
      return (
        (sign * (dx * (point.y - a.y) - dy * (point.x - a.x))) / Math.hypot(dx, dy) >=
        padding - EPSILON
      );
    }),
  );
}

function at(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// Restrict a segment to a convex rectangle, rounded rectangle, or sampled ellipse.
function segmentInterval(a, b, shape) {
  const points = polygon(shape),
    dx = b.x - a.x,
    dy = b.y - a.y;
  let area = 0,
    from = 0,
    to = 1;
  for (let i = 0; i < points.length; i++)
    area +=
      points[i].x * points[(i + 1) % points.length].y -
      points[(i + 1) % points.length].x * points[i].y;
  const sign = area >= 0 ? 1 : -1;
  for (let i = 0; i < points.length; i++) {
    const p = points[i],
      q = points[(i + 1) % points.length];
    const ex = q.x - p.x,
      ey = q.y - p.y;
    const start = sign * (ex * (a.y - p.y) - ey * (a.x - p.x));
    const rate = sign * (ex * dy - ey * dx);
    if (Math.abs(rate) < 1e-9) {
      if (start < -1e-6) return null;
      else continue;
    }
    const t = -start / rate;
    if (rate > 0) from = Math.max(from, t);
    else to = Math.min(to, t);
    if (from > to) return null;
  }
  return [Math.max(0, from), Math.min(1, to)];
}

function segments(item) {
  const points = item.points ?? [item.from, item.to];
  if (!points?.length) return [];
  const result = points.slice(1).map((point, i) => [points[i], point]);
  if (item.closed && points.length > 2) result.push([points.at(-1), points[0]]);
  if (item.head?.length)
    for (let i = 0; i < item.head.length; i++)
      result.push([item.head[i], item.head[(i + 1) % item.head.length]]);
  return result;
}

function clipPolygon(subject, clip) {
  const boundary = polygon(clip);
  let area = 0;
  for (let i = 0; i < boundary.length; i++)
    area +=
      boundary[i].x * boundary[(i + 1) % boundary.length].y -
      boundary[(i + 1) % boundary.length].x * boundary[i].y;
  const sign = area >= 0 ? 1 : -1;
  let points = subject;
  for (let i = 0; i < boundary.length && points.length; i++) {
    const a = boundary[i],
      b = boundary[(i + 1) % boundary.length],
      input = points;
    const distance = (point) =>
      sign * ((b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x));
    points = [];
    let previous = input.at(-1),
      before = distance(previous);
    for (const point of input) {
      const next = distance(point);
      if (next >= 0 !== before >= 0) points.push(at(previous, point, before / (before - next)));
      if (next >= 0) points.push(point);
      previous = point;
      before = next;
    }
  }
  return points;
}

function strokeEnvelope(a, b, radius) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x),
    outer = radius / Math.cos(Math.PI / 16);
  const arc = (center, start) =>
    Array.from({ length: 9 }, (_, i) => ({
      x: center.x + outer * Math.cos(start + (i * Math.PI) / 8),
      y: center.y + outer * Math.sin(start + (i * Math.PI) / 8),
    }));
  return [...arc(a, angle + Math.PI / 2), ...arc(b, angle - Math.PI / 2)];
}

function visibleGeometry(item) {
  const padding =
    (item.strokeAlpha ?? item.alpha ?? 1) >= VISIBLE_ALPHA ? (item.strokeWidth ?? 0) / 2 : 0;
  if (!item.clip) return { points: polygon(item), padding };
  const points = [];
  if ((item.fillAlpha ?? 0) >= VISIBLE_ALPHA) points.push(...clipPolygon(item.points, item.clip));
  if (padding > 0)
    for (const [a, b] of segments(item)) {
      points.push(...clipPolygon(strokeEnvelope(a, b, padding), item.clip));
    }
  return points.length ? { points, padding: 0 } : null;
}

function inkAt(label, point, radius = 0) {
  if (!label.ink) return inside(point, label);
  const mask = label.ink,
    dx = point.x - mask.origin.x,
    dy = point.y - mask.origin.y;
  const det = mask.axisX.x * mask.axisY.y - mask.axisX.y * mask.axisY.x;
  if (!det) return false;
  const x = (dx * mask.axisY.y - dy * mask.axisY.x) / det;
  const y = (dy * mask.axisX.x - dx * mask.axisX.y) / det;
  const rx = Math.min(8, Math.ceil(radius / Math.hypot(mask.axisX.x, mask.axisX.y)));
  const ry = Math.min(8, Math.ceil(radius / Math.hypot(mask.axisY.x, mask.axisY.y)));
  for (let yy = Math.floor(y) - ry; yy <= Math.floor(y) + ry; yy++)
    for (let xx = Math.floor(x) - rx; xx <= Math.floor(x) + rx; xx++) {
      if (
        xx >= 0 &&
        yy >= 0 &&
        xx < mask.width &&
        yy < mask.height &&
        mask.data[yy * mask.width + xx] >= 64
      )
        return true;
    }
  return false;
}

function covered(point, order, shapes) {
  return shapes.some(
    (shape) =>
      (shape.fillAlpha ?? 0) >= 0.98 && shape.order > order && paintedInside(point, shape, 0.98),
  );
}

function capCollision(label, item, center, radius, shapes) {
  const overlap = intersection(label, {
    x: center.x - radius,
    y: center.y - radius,
    width: radius * 2,
    height: radius * 2,
  });
  if (overlap.width <= 0 || overlap.height <= 0) return null;
  const step = 1;
  let inkArea = 0,
    first;
  for (let y = overlap.y + step / 2; y < overlap.y + overlap.height; y += step)
    for (let x = overlap.x + step / 2; x < overlap.x + overlap.width; x += step) {
      const point = { x, y };
      if (
        Math.hypot(x - center.x, y - center.y) > radius ||
        (item.clip && !inside(point, item.clip))
      )
        continue;
      if (
        covered(point, item.order, shapes) ||
        covered(point, label.order, shapes) ||
        !inkAt(label, point)
      )
        continue;
      inkArea += step * step;
      first ??= point;
    }
  return inkArea >= 3 ? { inkArea, point: first } : null;
}

function prepareStroke(item, type) {
  const radius = Math.max(0.5, (item.strokeWidth ?? 1) / 2);
  const edges = segments(item);
  let left = Infinity,
    right = -Infinity,
    top = Infinity,
    bottom = -Infinity;
  for (const p of [...(item.points ?? [item.from, item.to]), ...(item.head ?? [])]) {
    if (!Number.isFinite(p?.x) || !Number.isFinite(p?.y)) continue;
    left = Math.min(left, p.x);
    right = Math.max(right, p.x);
    top = Math.min(top, p.y);
    bottom = Math.max(bottom, p.y);
  }
  return { item, type, radius, edges, left, right, top, bottom };
}

function strokeCollision(label, stroke, shapes) {
  const { item, radius, edges } = stroke;
  const target = {
    x: label.x - radius,
    y: label.y - radius,
    width: label.width + radius * 2,
    height: label.height + radius * 2,
  };
  if (
    target.x > stroke.right ||
    target.x + target.width < stroke.left ||
    target.y > stroke.bottom ||
    target.y + target.height < stroke.top
  )
    return null;
  let inkLength = 0,
    first;
  for (const [a, b] of edges) {
    if (![a?.x, a?.y, b?.x, b?.y].every(Number.isFinite)) continue;
    const range = segmentInterval(a, b, target);
    if (!range) continue;
    const length = Math.hypot(b.x - a.x, b.y - a.y) * (range[1] - range[0]);
    const count = Math.max(1, Math.ceil(length / 1.5));
    for (let i = 0; i < count; i++) {
      const point = at(a, b, range[0] + ((range[1] - range[0]) * (i + 0.5)) / count);
      if (item.clip) {
        const dx = b.x - a.x,
          dy = b.y - a.y,
          segmentLength = Math.hypot(dx, dy);
        const steps = Math.max(1, Math.ceil(radius * 2));
        let hit;
        for (let offset = 0; offset <= steps; offset++) {
          const distance = -radius + (radius * 2 * offset) / steps;
          const sample = {
            x: point.x - (dy / segmentLength) * distance,
            y: point.y + (dx / segmentLength) * distance,
          };
          if (
            inside(sample, item.clip) &&
            !covered(sample, item.order, shapes) &&
            !covered(sample, label.order, shapes) &&
            inkAt(label, sample)
          ) {
            hit = sample;
            break;
          }
        }
        if (hit) {
          inkLength += length / count;
          first ??= hit;
        }
        continue;
      }
      if (covered(point, item.order, shapes) || covered(point, label.order, shapes)) continue;
      if (inkAt(label, point, radius)) {
        inkLength += length / count;
        first ??= point;
      }
    }
  }
  if (inkLength >= 3) return { inkLength, point: first };
  // Round caps and joins paint along the tangent beyond the segment endpoints.
  // Sampling only perpendicular offsets misses those pixels after clipping.
  const points = item.points ?? [item.from, item.to];
  for (const point of points) {
    if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) continue;
    const cap = capCollision(label, item, point, radius, shapes);
    if (cap) return { inkLength, ...cap };
  }
  return null;
}

function hiddenInk(label, shape) {
  const overlap = intersection(label, boundsOf(shape));
  if (overlap.width <= 3 || overlap.height <= 3) return null;
  let hidden = 0,
    ink = 0,
    first;
  const step = 3;
  for (let y = label.y + step / 2; y < label.y + label.height; y += step)
    for (let x = label.x + step / 2; x < label.x + label.width; x += step) {
      const point = { x, y };
      if (!inkAt(label, point)) continue;
      ink++;
      if (paintedInside(point, shape, 0.98)) {
        hidden++;
        first ??= point;
      }
    }
  return hidden >= 3 && hidden >= ink * 0.08
    ? { coveredInkFraction: hidden / ink, point: first }
    : null;
}

function hiddenImage(image, shape) {
  const overlap = intersection(image, boundsOf(shape));
  if (overlap.width <= 3 || overlap.height <= 3) return null;
  // Bound the audit cost for a full-page scan while sampling intrinsic alpha.
  const step = Math.max(3, Math.sqrt((image.width * image.height) / 4096));
  let visible = 0,
    hidden = 0,
    first;
  for (let y = image.y + step / 2; y < image.y + image.height; y += step) {
    for (let x = image.x + step / 2; x < image.x + image.width; x += step) {
      const point = { x, y };
      if (!paintedInside(point, image)) continue;
      visible++;
      if (paintedInside(point, shape, 0.98)) {
        hidden++;
        first ??= point;
      }
    }
  }
  return hidden >= 3 && hidden >= visible * 0.08
    ? { coveredImageFraction: hidden / visible, point: first }
    : null;
}

function expectedAnchor(shape, toward, gap) {
  const a = shape.center ?? { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
  const b = toward.center ?? { x: toward.x + toward.width / 2, y: toward.y + toward.height / 2 };
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (!length) return a;
  const far = { x: a.x + ((b.x - a.x) / length) * 10000, y: a.y + ((b.y - a.y) / length) * 10000 };
  const range = segmentInterval(a, far, shape);
  if (!range) return null;
  const edge = at(a, far, range[1]);
  return { x: edge.x + ((b.x - a.x) / length) * gap, y: edge.y + ((b.y - a.y) / length) * gap };
}

function toAttachmentSpace(point, space, vector = false) {
  const x = point.x - (vector ? 0 : space.origin.x),
    y = point.y - (vector ? 0 : space.origin.y);
  const det = space.axisX.x * space.axisY.y - space.axisX.y * space.axisY.x;
  return {
    x: (x * space.axisY.y - y * space.axisY.x) / det,
    y: (y * space.axisX.x - x * space.axisX.y) / det,
  };
}

function fromAttachmentSpace(point, space) {
  return {
    x: space.origin.x + point.x * space.axisX.x + point.y * space.axisY.x,
    y: space.origin.y + point.x * space.axisX.y + point.y * space.axisY.y,
  };
}

function attachmentBounds(shape, space) {
  if (shape.kind === 'circle') {
    const center = toAttachmentSpace(shape.center, space),
      axisX = toAttachmentSpace(shape.axisX, space, true),
      axisY = toAttachmentSpace(shape.axisY, space, true);
    const rx = Math.hypot(axisX.x, axisY.x),
      ry = Math.hypot(axisX.y, axisY.y);
    return { x: center.x - rx, y: center.y - ry, width: rx * 2, height: ry * 2 };
  }
  return boundsOf({ points: polygon(shape).map((point) => toAttachmentSpace(point, space)) });
}

function resolveAttachment(ref, audit, space, seen = new Set()) {
  if (!ref || seen.has(ref)) return { reason: 'missing or cyclic painted node reference' };
  if (ref.memberRefs) {
    seen.add(ref);
    const members = ref.memberRefs.map((member) =>
      resolveAttachment(member, audit, space, new Set(seen)),
    );
    const missing = members.findIndex((member) => !member.shape);
    if (missing >= 0)
      return {
        reason: 'group member has no visible painted node',
        member: missing,
        detail: members[missing].reason,
      };
    if (!members.length) return { reason: 'group has no painted members' };
    const boxes = members.map(
      (member) => member.localBounds ?? attachmentBounds(member.shape, space),
    );
    const x = Math.min(...boxes.map((box) => box.x)),
      y = Math.min(...boxes.map((box) => box.y));
    const width = Math.max(...boxes.map((box) => box.x + box.width)) - x;
    const height = Math.max(...boxes.map((box) => box.y + box.height)) - y;
    const localBounds = { x, y, width, height };
    const points = polygon(localBounds).map((point) => fromAttachmentSpace(point, space));
    return {
      shape: {
        kind: 'rect',
        ...boundsOf({ points }),
        points,
        center: fromAttachmentSpace({ x: x + width / 2, y: y + height / 2 }, space),
      },
      localBounds,
      memberIds: members.flatMap((member) => member.memberIds ?? [member.id]),
    };
  }
  const shape = Number.isInteger(ref.auditId) ? audit.shapes?.[ref.auditId] : undefined;
  if (!shape || ref[PAINTED_SHAPE] !== shape)
    return { reason: 'node was not painted in this frame', nodeId: ref.auditId };
  if ((shape.alpha ?? 1) < VISIBLE_ALPHA)
    return { reason: 'painted node is not visible', nodeId: ref.auditId, alpha: shape.alpha };
  return { shape, id: ref.auditId };
}

function sameBounds(a, b, tolerance = 1.5) {
  return (
    a.kind === b.kind &&
    ['x', 'y', 'width', 'height'].every((key) => Math.abs(a[key] - b[key]) <= tolerance)
  );
}

export function layoutIssues(audit) {
  const issues = [...(audit.issues ?? [])];
  const labels = (audit.labels ?? []).filter((label) => (label.alpha ?? 1) >= VISIBLE_ALPHA);
  const shapes = (audit.shapes ?? []).filter((shape) => (shape.alpha ?? 1) >= VISIBLE_ALPHA);
  const paths = (audit.paths ?? []).filter((path) => (path.alpha ?? 1) >= VISIBLE_ALPHA);
  const connectors = (audit.connectors ?? []).filter(
    (connector) => (connector.alpha ?? 1) >= VISIBLE_ALPHA,
  );
  const fills = [...shapes, ...paths.filter((path) => (path.fillAlpha ?? 0) >= VISIBLE_ALPHA)];
  const strokes = [];
  if (labels.length) {
    for (const shape of shapes) {
      if ((shape.strokeAlpha ?? 0) < VISIBLE_ALPHA) continue;
      strokes.push(prepareStroke({ ...shape, closed: true }, 'label-shape-border'));
    }
    for (const item of [...paths, ...connectors]) {
      if ((item.strokeAlpha ?? item.alpha ?? 1) < VISIBLE_ALPHA) continue;
      strokes.push(prepareStroke(item, item.from ? 'label-connector' : 'label-path'));
    }
  }
  for (const [index, label] of labels.entries()) {
    for (const other of labels.slice(index + 1)) {
      if (
        label.group !== undefined &&
        label.group === other.group &&
        audit.groups?.[label.group]?.allowOverlap
      )
        continue;
      const overlap = intersection(label, other),
        area = Math.min(label.width * label.height, other.width * other.height);
      if (overlap.width > 3 && overlap.height > 3 && overlap.width * overlap.height > area * 0.12) {
        issues.push({
          type: 'label-collision',
          text: label.text,
          other: other.text,
          bounds: [label, other].map(({ x, y, width, height }) => ({ x, y, width, height })),
        });
      }
    }
    for (const fill of fills) {
      if ((fill.fillAlpha ?? 0) >= 0.98 && fill.order > label.order) {
        const hidden = hiddenInk(label, fill);
        if (hidden)
          issues.push({
            type: 'label-occluded',
            text: label.text,
            id: fill.id,
            shapeOrder: fill.order,
            labelOrder: label.order,
            ...hidden,
          });
      }
    }
    for (const stroke of strokes) {
      const collision = strokeCollision(label, stroke, fills);
      if (collision)
        issues.push({ type: stroke.type, text: label.text, id: stroke.item.id, ...collision });
    }
  }
  for (const image of shapes.filter((shape) => shape.raster)) {
    for (const fill of fills) {
      if ((fill.fillAlpha ?? 0) < 0.98 || fill.order <= image.order) continue;
      const hidden = hiddenImage(image, fill);
      if (hidden)
        issues.push({
          type: 'image-occluded',
          id: image.id,
          by: fill.id,
          image: image.image,
          ...hidden,
        });
    }
  }
  for (const shape of shapes) {
    const bounds = boundsOf(shape, (shape.strokeAlpha ?? 0) >= VISIBLE_ALPHA);
    if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) {
      issues.push({ type: 'invalid-shape', id: shape.id, bounds });
    } else if (!contained(bounds, { x: 0, y: 0, width: 1920, height: 1080 })) {
      issues.push({ type: 'clipped-shape', id: shape.id, bounds });
    }
    // A small filled object crossing a card edge while fully fitting along the
    // other axis is a likely escaped child, including older unscoped scenes.
    if ((shape.fillAlpha ?? 0) >= VISIBLE_ALPHA)
      for (const panel of shapes) {
        if (
          panel.kind !== 'rect' ||
          panel === shape ||
          (panel.fillAlpha ?? 0) < 0.98 ||
          (panel.strokeAlpha ?? 0) < VISIBLE_ALPHA ||
          panel.order >= shape.order
        )
          continue;
        const panelBounds = boundsOf(panel),
          area = shape.width * shape.height,
          overlap = intersection(shape, panelBounds);
        const fitsX =
          bounds.x >= panelBounds.x && bounds.x + bounds.width <= panelBounds.x + panelBounds.width;
        const fitsY =
          bounds.y >= panelBounds.y &&
          bounds.y + bounds.height <= panelBounds.y + panelBounds.height;
        if (!(area > 0) || area >= panel.width * panel.height * 0.35 || (!fitsX && !fitsY))
          continue;
        if (
          overlap.width <= 3 ||
          overlap.height <= 3 ||
          overlap.width * overlap.height < area * 0.2 ||
          contained(bounds, panelBounds, 2)
        )
          continue;
        issues.push({
          type: 'shape-crosses-panel',
          id: shape.id,
          parent: panel.id,
          bounds,
          container: panelBounds,
        });
      }
  }
  for (const [kind, items] of [
    ['shape', shapes],
    ['path', paths],
    ['connector', connectors],
    ['label', labels],
  ])
    for (const item of items) {
      let visible;
      if (kind === 'path') {
        if (!item.points?.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))) {
          issues.push({ type: 'invalid-path', id: item.id });
          continue;
        }
        visible = visibleGeometry(item);
      } else if (kind === 'connector')
        visible = {
          points: [item.from, item.to, ...(item.head ?? [])],
          padding: (item.strokeWidth ?? 0) / 2,
        };
      else
        visible = {
          points: polygon(item),
          padding:
            kind === 'shape' && (item.strokeAlpha ?? 0) >= VISIBLE_ALPHA
              ? (item.strokeWidth ?? 0) / 2
              : 0,
        };
      if (!visible) continue;
      const bounds = boundsOf({ points: visible.points, strokeWidth: visible.padding * 2 }, true);
      for (const index of item.groups ?? []) {
        const group = audit.groups?.[index];
        if (
          !group ||
          (group.kind !== 'container' && !(kind === 'label' && group.kind === 'labels')) ||
          (group.alpha ?? 1) < VISIBLE_ALPHA
        )
          continue;
        if (
          !polygonContains(visible.points, group.content, visible.padding) &&
          !issues.some(
            (issue) =>
              issue.type === `${kind}-overflow` &&
              issue.group === group.id &&
              issue.text === item.text &&
              issue.id === item.id,
          )
        ) {
          issues.push({
            type: `${kind}-overflow`,
            id: item.id,
            text: item.text,
            group: group.id,
            bounds,
            container: group.content,
          });
        }
      }
      if (
        (kind === 'path' || kind === 'connector') &&
        !contained(bounds, { x: 0, y: 0, width: 1920, height: 1080 })
      )
        issues.push({ type: `clipped-${kind}`, id: item.id, bounds });
    }
  for (const connector of connectors) {
    if (
      ![connector.from?.x, connector.from?.y, connector.to?.x, connector.to?.y].every(
        Number.isFinite,
      )
    ) {
      issues.push({ type: 'invalid-connector', id: connector.id, connector });
      continue;
    }
    if (connector.kind !== 'connect') continue;
    const space = connector.attachmentSpace;
    if (!space || Math.abs(space.axisX.x * space.axisY.y - space.axisX.y * space.axisY.x) < 1e-9) {
      issues.push({
        type: 'missing-attachment',
        id: connector.id,
        reason: 'missing or singular attachment coordinate space',
      });
      continue;
    }
    const resolvedSource = resolveAttachment(connector.sourceRef, audit, space),
      resolvedTarget = resolveAttachment(connector.targetRef, audit, space);
    let missing = false;
    for (const [end, resolved] of [
      ['from', resolvedSource],
      ['to', resolvedTarget],
    ]) {
      if (!resolved.shape) {
        issues.push({ type: 'missing-attachment', id: connector.id, end, ...resolved });
        missing = true;
      }
    }
    if (missing) continue;
    const source = resolvedSource.shape,
      target = resolvedTarget.shape;
    connector.sourceId = resolvedSource.id;
    connector.targetId = resolvedTarget.id;
    if (resolvedSource.memberIds) connector.sourceMemberIds = resolvedSource.memberIds;
    if (resolvedTarget.memberIds) connector.targetMemberIds = resolvedTarget.memberIds;
    for (const [end, declared, resolved] of [
      ['from', connector.source, resolvedSource],
      ['to', connector.target, resolvedTarget],
    ]) {
      const declaredLocal = resolved.localBounds ? attachmentBounds(declared, space) : undefined;
      const scale = Math.max(
        Math.hypot(space.axisX.x, space.axisX.y),
        Math.hypot(space.axisY.x, space.axisY.y),
      );
      const matching = resolved.localBounds
        ? sameBounds(
            { kind: 'rect', ...declaredLocal },
            { kind: 'rect', ...resolved.localBounds },
            1.5 / scale,
          )
        : sameBounds(declared, resolved.shape);
      if (!matching)
        issues.push({
          type: resolved.memberIds ? 'stale-group-geometry' : 'stale-attachment-geometry',
          id: connector.id,
          end,
          nodeId: resolved.id,
          memberIds: resolved.memberIds,
          declaredBounds: boundsOf(declared),
          paintedBounds: boundsOf(resolved.shape),
          ...(resolved.localBounds
            ? { declaredLocalBounds: declaredLocal, paintedLocalBounds: resolved.localBounds }
            : {}),
        });
    }
    for (const [end, shape, toward, gap] of [
      ['from', source, target, connector.fromGap],
      ['to', target, source, connector.toGap],
    ]) {
      const expected = expectedAnchor(shape, toward, gap ?? 0),
        actual = connector[end];
      const distance = expected
        ? Math.hypot(actual.x - expected.x, actual.y - expected.y)
        : Infinity;
      if (distance > Math.max(1.5, (connector.strokeWidth ?? 0) / 4))
        issues.push({
          type: 'disconnected-attachment',
          id: connector.id,
          end,
          sourceId: connector.sourceId,
          targetId: connector.targetId,
          actual,
          expected,
          distance,
        });
    }
  }
  return issues;
}

export class FrameAudit {
  constructor(scene, fps) {
    this.scene = scene;
    this.fps = fps;
    this.frames = 0;
    this.labels = 0;
    this.shapes = 0;
    this.connectors = 0;
    this.paths = 0;
    this.issueFrames = 0;
    this.issues = new Map();
    this.smallestBodyLabel = null;
  }

  observe(frame, audit) {
    if (frame !== this.frames)
      throw new Error(`${this.scene}: layout audit skipped frame ${this.frames}`);
    this.frames++;
    this.labels += audit.labels?.length ?? 0;
    this.shapes += audit.shapes?.length ?? 0;
    this.connectors += audit.connectors?.length ?? 0;
    this.paths += audit.paths?.length ?? 0;
    for (const label of audit.labels ?? []) {
      const size = label.fontSize ?? label.size;
      if (
        label.y >= 200 &&
        Number.isFinite(size) &&
        (!this.smallestBodyLabel || size < this.smallestBodyLabel.size)
      ) {
        this.smallestBodyLabel = { text: label.text, size, frame, time: frame / this.fps };
      }
    }
    if (audit.issues?.length) this.issueFrames++;
    for (const issue of audit.issues ?? []) {
      const key = JSON.stringify([
        issue.type,
        issue.text,
        issue.other,
        issue.scope ?? issue.group,
        issue.id,
        issue.parent,
        issue.end,
      ]);
      const previous = this.issues.get(key);
      if (previous) {
        previous.lastFrame = frame;
        previous.lastTime = frame / this.fps;
        previous.occurrences++;
      } else {
        this.issues.set(key, {
          ...issue,
          firstFrame: frame,
          lastFrame: frame,
          firstTime: frame / this.fps,
          lastTime: frame / this.fps,
          occurrences: 1,
        });
      }
    }
  }

  finish(expectedFrames) {
    if (this.frames !== expectedFrames)
      throw new Error(`${this.scene}: audited ${this.frames}/${expectedFrames} frames`);
    return {
      scene: this.scene,
      fps: this.fps,
      frames: this.frames,
      ruleCoverage: [...LAYOUT_AUDIT_RULES],
      labelInstances: this.labels,
      shapeInstances: this.shapes,
      connectorInstances: this.connectors,
      pathInstances: this.paths,
      smallestBodyLabel: this.smallestBodyLabel,
      issueFrames: this.issueFrames,
      issues: [...this.issues.values()],
      passed: this.issueFrames === 0,
    };
  }
}
