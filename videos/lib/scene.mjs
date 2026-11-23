import { createCanvas, ImageData } from '@napi-rs/canvas';
import { Resvg } from '@resvg/resvg-js';
import { lessonFont } from './fonts.mjs';
import { paintCanvasImage } from './canvas-image.mjs';
export { prepareCanvasImage } from './canvas-image.mjs';
import {
  arcSwap,
  pointAlongPath,
  smoothstep,
  tracePolyline,
  renderMathSvg,
  createCanvasComponents,
  createTeachingCanvas,
  createFocusDirector,
  mergeFocusRegions,
  interpolateCamera,
  projectWorldPoint,
  createPolylineMorph,
  morphPolyline,
} from 'vizmatic';

// Shared with Vizmatic's midnight look, so legacy canvas scenes and stage films match.
export const C = Object.freeze({
  bg: '#0b0c10',
  panel: '#15171d',
  ink: '#f2efe6',
  muted: '#a5a7ad',
  cyan: '#5cc4f0',
  blue: '#7fa8ff',
  yellow: '#ffd75e',
  pink: '#ff8fc0',
  green: '#8fe08a',
  red: '#ff6b6b',
});

export const clamp = (t, min = 0, max = 1) => Math.max(min, Math.min(max, t));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = smoothstep;
export const phase = (p, start, end) => ease((p - start) / (end - start));

class ByteLru {
  constructor(limit, dispose) {
    this.limit = limit;
    this.dispose = dispose;
    this.items = new Map();
    this.bytes = 0;
    this.evictions = 0;
  }
  get(key) {
    const entry = this.items.get(key);
    if (!entry) return;
    this.items.delete(key);
    this.items.set(key, entry);
    return entry.value;
  }
  set(key, value, bytes) {
    bytes += key.length * 2 + 256;
    if (bytes > this.limit) return false;
    while (this.bytes + bytes > this.limit) {
      const [oldKey, old] = this.items.entries().next().value;
      this.items.delete(oldKey);
      this.bytes -= old.bytes;
      this.evictions++;
      this.dispose?.(old.value);
    }
    this.items.set(key, { value, bytes });
    this.bytes += bytes;
    return true;
  }
  stats() {
    return {
      entries: this.items.size,
      bytes: this.bytes,
      limit: this.limit,
      evictions: this.evictions,
    };
  }
}

function releaseMath(asset) {
  asset.image.width = 1;
  asset.image.height = 1;
}
const mathImages = new ByteLru(16 * 1024 * 1024, releaseMath);
const textMasks = new ByteLru(4 * 1024 * 1024);
export function drawingCacheStats() {
  return { math: mathImages.stats(), text: textMasks.stats() };
}
let audit;
let labelScopes = [];
let paintOrder = 0;
const PAINTED_SHAPE = Symbol.for('leetllm.video.painted-shape');

function colorAlpha(color) {
  if (typeof color !== 'string') return 1;
  const value = color.trim().toLowerCase();
  if (value === 'transparent') return 0;
  if (/^#[\da-f]{4}$/.test(value)) return Number.parseInt(value[4], 16) / 15;
  if (/^#[\da-f]{8}$/.test(value)) return Number.parseInt(value.slice(7), 16) / 255;
  const alpha =
    value.match(/\/\s*([\d.]+%?)\s*\)$/)?.[1] ??
    value.match(/^(?:rgba|hsla)\([^)]*,\s*([\d.]+%?)\s*\)$/)?.[1];
  return alpha === undefined
    ? 1
    : clamp(Number.parseFloat(alpha) / (alpha.endsWith('%') ? 100 : 1));
}

function paintedAlpha(ctx, color) {
  return ctx.globalAlpha * colorAlpha(color);
}

function projectPoint(ctx) {
  const m = ctx.getTransform();
  const { width, height } = ctx.canvas;
  return (point) => ({
    x: ((m.a * point.x + m.c * point.y + m.e) * 1920) / width,
    y: ((m.b * point.x + m.d * point.y + m.f) * 1080) / height,
  });
}

function transformPoint(ctx, point) {
  return projectPoint(ctx)(point);
}

function transformScale(ctx) {
  const m = ctx.getTransform(),
    sx = 1920 / ctx.canvas.width,
    sy = 1080 / ctx.canvas.height;
  return Math.max(Math.hypot(m.a * sx, m.b * sy), Math.hypot(m.c * sx, m.d * sy));
}

function shapeBounds(shape) {
  if (shape.r !== undefined)
    return { x: shape.x - shape.r, y: shape.y - shape.r, width: shape.r * 2, height: shape.r * 2 };
  return { x: shape.x, y: shape.y, width: shape.width ?? shape.w, height: shape.height ?? shape.h };
}

function transformBounds(shape, project) {
  const b = shapeBounds(shape);
  const points = [
    [b.x, b.y],
    [b.x + b.width, b.y],
    [b.x, b.y + b.height],
    [b.x + b.width, b.y + b.height],
  ].map(([x, y]) => project({ x, y }));
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function geometry(ctx, shape) {
  const project = projectPoint(ctx);
  if (shape.r !== undefined) {
    const origin = project(shape);
    const edgeX = project({ x: shape.x + shape.r, y: shape.y });
    const edgeY = project({ x: shape.x, y: shape.y + shape.r });
    const axisX = { x: edgeX.x - origin.x, y: edgeX.y - origin.y };
    const axisY = { x: edgeY.x - origin.x, y: edgeY.y - origin.y };
    const rx = Math.hypot(axisX.x, axisY.x),
      ry = Math.hypot(axisX.y, axisY.y);
    return {
      kind: 'circle',
      center: origin,
      axisX,
      axisY,
      x: origin.x - rx,
      y: origin.y - ry,
      width: rx * 2,
      height: ry * 2,
      points: Array.from({ length: 64 }, (_, i) => {
        const angle = (i / 64) * Math.PI * 2;
        return {
          x: origin.x + Math.cos(angle) * axisX.x + Math.sin(angle) * axisY.x,
          y: origin.y + Math.cos(angle) * axisX.y + Math.sin(angle) * axisY.y,
        };
      }),
    };
  }
  const b = shapeBounds(shape),
    radius = Math.min(shape.radius ?? 0, b.width / 2, b.height / 2);
  const corners = [
    [b.x + b.width - radius, b.y + radius, -Math.PI / 2],
    [b.x + b.width - radius, b.y + b.height - radius, 0],
    [b.x + radius, b.y + b.height - radius, Math.PI / 2],
    [b.x + radius, b.y + radius, Math.PI],
  ];
  const points =
    radius > 0
      ? corners.flatMap(([x, y, angle]) =>
          Array.from({ length: 9 }, (_, i) =>
            project({
              x: x + radius * Math.cos(angle + ((i / 8) * Math.PI) / 2),
              y: y + radius * Math.sin(angle + ((i / 8) * Math.PI) / 2),
            }),
          ),
        )
      : [
          [b.x, b.y],
          [b.x + b.width, b.y],
          [b.x + b.width, b.y + b.height],
          [b.x, b.y + b.height],
        ].map(([x, y]) => project({ x, y }));
  return {
    kind: 'rect',
    ...transformBounds(b, project),
    center: project(center(b)),
    points,
  };
}

function scopeMembership(labels = false) {
  return labelScopes
    .filter((group) => labels || group.kind === 'container')
    .map((group) => group.index);
}

function scope(ctx, bounds, draw, { padding = 10, id, allowOverlap = false } = {}, kind) {
  if (!audit) return draw();
  const b = shapeBounds(bounds),
    index = audit.groups.length;
  const group = {
    index,
    id: id ?? `group-${index}`,
    kind,
    ...transformBounds(b, projectPoint(ctx)),
    content: geometry(ctx, {
      x: b.x + padding,
      y: b.y + padding,
      width: Math.max(0, b.width - 2 * padding),
      height: Math.max(0, b.height - 2 * padding),
    }),
    alpha: ctx.globalAlpha,
    allowOverlap,
    parents: scopeMembership(),
  };
  audit.groups.push(group);
  labelScopes.push(group);
  try {
    return draw();
  } finally {
    labelScopes.pop();
  }
}

export function groupBounds(...shapes) {
  const members = shapes.flat(),
    boxes = members.map(shapeBounds);
  if (!boxes.length) throw new Error('groupBounds requires at least one shape');
  const x = Math.min(...boxes.map((b) => b.x)),
    y = Math.min(...boxes.map((b) => b.y));
  const bounds = {
    x,
    y,
    width: Math.max(...boxes.map((b) => b.x + b.width)) - x,
    height: Math.max(...boxes.map((b) => b.y + b.height)) - y,
  };
  Object.defineProperty(bounds, 'memberRefs', { value: members });
  return bounds;
}

function center(shape) {
  if (shape.width === undefined && shape.w === undefined && shape.r === undefined) return shape;
  const b = shapeBounds(shape);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

export function anchor(shape, toward, gap = 0) {
  const origin = center(shape),
    target = center(toward);
  const dx = target.x - origin.x,
    dy = target.y - origin.y,
    length = Math.hypot(dx, dy);
  if (!length) return { x: origin.x, y: origin.y };
  const b = shapeBounds(shape);
  let ratio =
    shape.r !== undefined
      ? shape.r / length
      : Math.min(
          dx === 0 ? Infinity : b.width / 2 / Math.abs(dx),
          dy === 0 ? Infinity : b.height / 2 / Math.abs(dy),
        );
  if (shape.radius > 0) {
    const radius = Math.min(shape.radius, b.width / 2, b.height / 2);
    const roundedDistance = (value) =>
      Math.hypot(
        Math.max(0, Math.abs(dx * value) - (b.width / 2 - radius)),
        Math.max(0, Math.abs(dy * value) - (b.height / 2 - radius)),
      );
    if (roundedDistance(ratio) > radius + 1e-9) {
      let low = 0,
        high = ratio;
      for (let i = 0; i < 24; i++) {
        const next = (low + high) / 2;
        if (roundedDistance(next) <= radius) low = next;
        else high = next;
      }
      ratio = low;
    }
  }
  return { x: origin.x + dx * (ratio + gap / length), y: origin.y + dy * (ratio + gap / length) };
}

export function labelScope(ctx, bounds, draw, { padding = 10, id, allowOverlap = false } = {}) {
  return scope(ctx, bounds, draw, { padding, id, allowOverlap }, 'labels');
}

// A container protects every painted child, including animated paths and strokes.
// It does not clip the drawing: an escaping child remains visible and fails QA.
export function container(ctx, bounds, draw, options = {}) {
  return scope(ctx, bounds, draw, options, 'container');
}

function recordLabel(ctx, label) {
  if (!audit || !(label.alpha > 0) || !(label.width > 0) || !(label.height > 0)) return;
  const { mask, maskX, maskY, maskScale = 1, ...details } = label;
  if (mask) {
    const origin = transformPoint(ctx, { x: maskX, y: maskY });
    const dx = transformPoint(ctx, { x: maskX + 1 / maskScale, y: maskY });
    const dy = transformPoint(ctx, { x: maskX, y: maskY + 1 / maskScale });
    Object.defineProperty(details, 'ink', {
      value: {
        ...mask,
        origin,
        axisX: { x: dx.x - origin.x, y: dx.y - origin.y },
        axisY: { x: dy.x - origin.x, y: dy.y - origin.y },
      },
    });
  }
  label = {
    ...details,
    ...geometry(ctx, label),
    kind: label.kind,
    fontSize: label.fontSize * transformScale(ctx),
    order: paintOrder++,
    groups: scopeMembership(true),
  };
  if (details.ink) Object.defineProperty(label, 'ink', { value: details.ink });
  const group = labelScopes.at(-1);
  if (group) {
    label.group = group.index;
    const b = group.content,
      tolerance = 0.5;
    if (
      label.x < b.x - tolerance ||
      label.y < b.y - tolerance ||
      label.x + label.width > b.x + b.width + tolerance ||
      label.y + label.height > b.y + b.height + tolerance
    ) {
      audit.issues.push({
        type: 'label-overflow',
        group: group.id,
        text: label.text,
        bounds: { x: label.x, y: label.y, width: label.width, height: label.height },
        container: b,
      });
    }
    if (!group.allowOverlap)
      for (const other of audit.labels) {
        if (other.group !== group.index) continue;
        if (
          Math.min(label.x + label.width, other.x + other.width) - Math.max(label.x, other.x) >
            tolerance &&
          Math.min(label.y + label.height, other.y + other.height) - Math.max(label.y, other.y) >
            tolerance
        ) {
          audit.issues.push({
            type: 'label-overlap',
            group: group.id,
            text: label.text,
            other: other.text,
          });
        }
      }
  }
  audit.labels.push(label);
  if (label.x < 0 || label.y < 0 || label.x + label.width > 1920 || label.y + label.height > 1080) {
    const { ink, ...evidence } = label;
    audit.issues.push({ type: 'clipped-label', ...evidence });
  }
  return label;
}

function recordShape(ctx, shape, fill, stroke, strokeWidth) {
  if (!audit) return;
  const fillAlpha = fill ? paintedAlpha(ctx, fill) : 0,
    strokeAlpha = stroke ? paintedAlpha(ctx, stroke) : 0;
  if (!(Math.max(fillAlpha, strokeAlpha) > 0)) return;
  const item = {
    ...geometry(ctx, shape),
    id: `shape-${audit.shapes.length}`,
    alpha: Math.max(fillAlpha, strokeAlpha),
    fillAlpha,
    strokeAlpha,
    strokeWidth: strokeWidth * transformScale(ctx),
    order: paintOrder++,
    groups: scopeMembership(),
  };
  shape.auditId = audit.shapes.length;
  // Object.assign onto a prepaint descriptor carries this proof forward. A
  // numeric ID alone could accidentally refer to a shape from another frame.
  Object.defineProperty(shape, PAINTED_SHAPE, {
    value: item,
    enumerable: true,
    writable: true,
    configurable: true,
  });
  audit.shapes.push(item);
  return item;
}

function recordConnector(ctx, from, to, color, width, kind, attachments = {}) {
  const alpha = paintedAlpha(ctx, color);
  if (!audit || !(alpha > 0)) return;
  audit.connectors.push({
    kind,
    id: `connector-${audit.connectors.length}`,
    from: transformPoint(ctx, from),
    to: transformPoint(ctx, to),
    alpha,
    strokeWidth: width * transformScale(ctx),
    order: paintOrder++,
    groups: scopeMembership(),
    ...attachments,
  });
}

// TeX is compiled to vector glyph paths once, then rasterized at output resolution.
// Its baseline matches text(), including fractions and deep subscripts.
export function math(ctx, tex, x, y, size = 44, color = C.ink, align = 'left') {
  const transform = ctx.getTransform();
  const scale = Math.max(1, Math.hypot(transform.a, transform.b));
  const key = JSON.stringify([tex, size, color, scale]);
  let asset = mathImages.get(key);
  let cached = Boolean(asset);
  if (!asset) {
    const result = renderMathSvg(tex, { fontSize: size, color });
    const pixels = new Resvg(result.svg, { fitTo: { mode: 'zoom', value: scale } }).render();
    // Resvg's pixels getter copies its native buffer. Read it once per asset.
    const rgba = pixels.pixels;
    const image = createCanvas(pixels.width, pixels.height);
    image
      .getContext('2d')
      .putImageData(new ImageData(new Uint8ClampedArray(rgba), pixels.width, pixels.height), 0, 0);
    let left = pixels.width,
      right = -1,
      top = pixels.height,
      bottom = -1;
    for (let y = 0; y < pixels.height; y++)
      for (let x = 0; x < pixels.width; x++) {
        if (rgba[(y * pixels.width + x) * 4 + 3] < 24) continue;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    const ink =
      right < left
        ? { x: 0, y: 0, width: 0, height: 0 }
        : {
            x: left / scale,
            y: top / scale,
            width: (right - left + 1) / scale,
            height: (bottom - top + 1) / scale,
          };
    const data = new Uint8Array(pixels.width * pixels.height);
    for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4 + 3];
    asset = { ...result, image, ink, mask: { width: pixels.width, height: pixels.height, data } };
    cached = mathImages.set(key, asset, pixels.width * pixels.height * 5 + result.svg.length * 2);
  }
  const left = x - (align === 'center' ? asset.width / 2 : align === 'right' ? asset.width : 0);
  const top = y - asset.baseline;
  ctx.drawImage(asset.image, left, top, asset.width, asset.height);
  recordLabel(ctx, {
    kind: 'math',
    text: tex,
    x: left + asset.ink.x,
    y: top + asset.ink.y,
    width: asset.ink.width,
    height: asset.ink.height,
    mask: asset.mask,
    maskX: left,
    maskY: top,
    maskScale: scale,
    fontSize: size,
    alpha: paintedAlpha(ctx, color),
  });
  if (!cached) releaseMath(asset);
  return { width: asset.width, height: asset.height, baseline: asset.baseline };
}

// Opposite arcs let two labels exchange places without colliding at the midpoint.
export function swap(x1, y1, x2, y2, progress, lift = 80) {
  return arcSwap({ x: x1, y: y1 }, { x: x2, y: y2 }, progress, { lift });
}

export function trace(ctx, points, progress, color = C.cyan, width = 4) {
  const visible = tracePolyline(points, progress);
  if (!visible.length) return;
  path(ctx, visible, { color, width });
  return visible.at(-1);
}

export function path(
  ctx,
  points,
  { color = C.cyan, width = 4, clip, closed = false, fill, id } = {},
) {
  if (!points.length) return;
  ctx.save();
  if (clip) {
    const b = shapeBounds(clip);
    ctx.beginPath();
    if (clip.r !== undefined) ctx.arc(clip.x, clip.y, clip.r, 0, Math.PI * 2);
    else if (clip.radius) ctx.roundRect(b.x, b.y, b.width, b.height, clip.radius);
    else ctx.rect(b.x, b.y, b.width, b.height);
    ctx.clip();
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
  if (closed) ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (color && width > 0) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  if (audit) {
    const strokeAlpha = color && width > 0 ? paintedAlpha(ctx, color) : 0,
      fillAlpha = fill ? paintedAlpha(ctx, fill) : 0;
    if (Math.max(strokeAlpha, fillAlpha) > 0)
      audit.paths.push({
        kind: 'path',
        id: id ?? `path-${audit.paths.length}`,
        points: points.map((point) => transformPoint(ctx, point)),
        clip: clip ? geometry(ctx, clip) : undefined,
        closed,
        alpha: Math.max(strokeAlpha, fillAlpha),
        strokeAlpha,
        fillAlpha,
        strokeWidth: width * transformScale(ctx),
        order: paintOrder++,
        groups: scopeMembership(),
      });
  }
  ctx.restore();
  return points;
}

export function text(ctx, value, x, y, size = 36, color = C.ink, align = 'left', font = 'sans') {
  ctx.save();
  ctx.font = lessonFont(size, font);
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  for (const [i, row] of String(value).split('\n').entries()) {
    const baseline = y + i * size * 1.4;
    ctx.fillText(row, x, baseline);
    const metrics = ctx.measureText(row);
    let mask;
    if (audit && row && paintedAlpha(ctx, ctx.fillStyle) > 0) {
      const key = JSON.stringify([ctx.font, align, row]);
      mask = textMasks.get(key);
      if (!mask) {
        const width = Math.max(
          1,
          Math.ceil(metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) + 4,
        );
        const height = Math.max(
          1,
          Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) + 4,
        );
        const image = createCanvas(width, height),
          ink = image.getContext('2d');
        ink.font = ctx.font;
        ink.textAlign = align;
        ink.textBaseline = 'alphabetic';
        ink.fillStyle = '#fff';
        ink.fillText(row, metrics.actualBoundingBoxLeft + 2, metrics.actualBoundingBoxAscent + 2);
        const pixels = ink.getImageData(0, 0, width, height).data,
          data = new Uint8Array(width * height);
        for (let i = 0; i < data.length; i++) data[i] = pixels[i * 4 + 3];
        mask = { width, height, data };
        textMasks.set(key, mask, data.byteLength);
        image.width = 1;
        image.height = 1;
      }
    }
    const label = recordLabel(ctx, {
      kind: 'text',
      text: row,
      x: x - metrics.actualBoundingBoxLeft,
      y: baseline - metrics.actualBoundingBoxAscent,
      width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
      height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
      mask,
      maskX: x - metrics.actualBoundingBoxLeft - 2,
      maskY: baseline - metrics.actualBoundingBoxAscent - 2,
      fontSize: size,
      alpha: paintedAlpha(ctx, ctx.fillStyle),
    });
    if (
      label &&
      font !== 'mono' &&
      /_\w|\^[{\w]|\\(?:frac|hat|theta|nabla|partial|sum)\b/.test(row)
    ) {
      audit.issues.push({ type: 'unrendered-math', text: row });
    }
  }
  ctx.restore();
}

function strokeLine(ctx, x1, y1, x2, y2, color, width) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function line(ctx, x1, y1, x2, y2, color = C.muted, width = 3) {
  strokeLine(ctx, x1, y1, x2, y2, color, width);
  recordConnector(ctx, { x: x1, y: y1 }, { x: x2, y: y2 }, color, width, 'line');
}

export function arrow(ctx, x1, y1, x2, y2, color = C.cyan, width = 3) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  if (!length) return;
  const ux = (x2 - x1) / length,
    uy = (y2 - y1) / length;
  const shaftWidth = Math.min(width, length / 2);
  const headLength = Math.min(Math.max(13, width * 3) * Math.cos(0.45), length * 0.7);
  const halfHeadWidth = Math.max(headLength * Math.tan(0.45), shaftWidth);
  const base = { x: x2 - ux * headLength, y: y2 - uy * headLength };
  const head = [
    { x: x2, y: y2 },
    { x: base.x - uy * halfHeadWidth, y: base.y + ux * halfHeadWidth },
    { x: base.x + uy * halfHeadWidth, y: base.y - ux * halfHeadWidth },
  ];
  const dx = (ux * shaftWidth) / 2,
    dy = (uy * shaftWidth) / 2;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1 - dy, y1 + dx);
  ctx.lineTo(base.x - dy, base.y + dx);
  ctx.lineTo(head[1].x, head[1].y);
  ctx.lineTo(x2, y2);
  ctx.lineTo(head[2].x, head[2].y);
  ctx.lineTo(base.x + dy, base.y - dx);
  ctx.lineTo(x1 + dy, y1 - dx);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  recordConnector(ctx, { x: x1, y: y1 }, { x: x2, y: y2 }, color, shaftWidth, 'arrow', {
    head: head.map((point) => transformPoint(ctx, point)),
  });
}

export function connect(
  ctx,
  source,
  target,
  { color = C.cyan, width = 3, gap = 10, fromGap = gap, toGap = gap } = {},
) {
  const from = anchor(source, target, fromGap),
    to = anchor(target, source, toGap);
  arrow(ctx, from.x, from.y, to.x, to.y, color, width);
  if (audit && paintedAlpha(ctx, color) > 0 && Math.hypot(to.x - from.x, to.y - from.y) > 0) {
    const sourceEdge = transformPoint(ctx, anchor(source, target)),
      targetEdge = transformPoint(ctx, anchor(target, source));
    const transformedFrom = transformPoint(ctx, from),
      transformedTo = transformPoint(ctx, to);
    Object.assign(audit.connectors.at(-1), {
      kind: 'connect',
      source: geometry(ctx, source),
      target: geometry(ctx, target),
      sourceId: source.auditId,
      targetId: target.auditId,
      fromGap:
        Math.sign(fromGap) *
        Math.hypot(transformedFrom.x - sourceEdge.x, transformedFrom.y - sourceEdge.y),
      toGap:
        Math.sign(toGap) *
        Math.hypot(transformedTo.x - targetEdge.x, transformedTo.y - targetEdge.y),
    });
    const origin = transformPoint(ctx, { x: 0, y: 0 }),
      edgeX = transformPoint(ctx, { x: 1, y: 0 }),
      edgeY = transformPoint(ctx, { x: 0, y: 1 });
    Object.defineProperties(audit.connectors.at(-1), {
      sourceRef: { value: source },
      targetRef: { value: target },
      attachmentSpace: {
        value: {
          origin,
          axisX: { x: edgeX.x - origin.x, y: edgeX.y - origin.y },
          axisY: { x: edgeY.x - origin.x, y: edgeY.y - origin.y },
        },
      },
    });
  }
  return { from, to };
}

export function circle(ctx, x, y, r, fill = C.cyan, stroke, width = 3) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
  const shape = { x, y, r };
  recordShape(ctx, shape, fill, stroke, width);
  ctx.restore();
  return shape;
}

export function rect(ctx, x, y, w, h, fill = C.panel, stroke, radius = 14) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
  const shape = { x, y, width: w, height: h, radius };
  recordShape(ctx, shape, fill, stroke, 2);
  ctx.restore();
  return shape;
}

/** Draw a prepared image and retain its transformed bounds and pixel opacity. */
export function image(ctx, asset, options) {
  const { source, destination, opacity, alpha, maximumAlpha } = paintCanvasImage(
    ctx,
    asset,
    options,
  );
  const shape = { ...destination, radius: 0 };
  ctx.save();
  try {
    ctx.globalAlpha *= (opacity * maximumAlpha) / 255;
    const item = recordShape(ctx, shape, '#ffffff', undefined, 0);
    if (item) {
      item.image = { sha256: asset.sha256, ...(asset.id ? { id: asset.id } : {}) };
      const scaleX = destination.width / source.width,
        scaleY = destination.height / source.height;
      const origin = transformPoint(ctx, {
        x: destination.x - source.x * scaleX,
        y: destination.y - source.y * scaleY,
      });
      const edgeX = transformPoint(ctx, {
        x: destination.x + (1 - source.x) * scaleX,
        y: destination.y - source.y * scaleY,
      });
      const edgeY = transformPoint(ctx, {
        x: destination.x - source.x * scaleX,
        y: destination.y + (1 - source.y) * scaleY,
      });
      Object.defineProperty(item, 'raster', {
        value: {
          width: asset.width,
          height: asset.height,
          data: alpha,
          origin,
          axisX: { x: edgeX.x - origin.x, y: edgeX.y - origin.y },
          axisY: { x: edgeY.x - origin.x, y: edgeY.y - origin.y },
          opacity: (ctx.globalAlpha * 255) / maximumAlpha,
        },
      });
    }
  } finally {
    ctx.restore();
  }
  return shape;
}

export const api = Object.freeze({
  C,
  clamp,
  lerp,
  ease,
  phase,
  swap,
  trace,
  path,
  pointAlongPath,
  tracePolyline,
  text,
  math,
  image,
  line,
  arrow,
  circle,
  rect,
  anchor,
  groupBounds,
  connect,
  labelScope,
  container,
  interpolateCamera,
  projectWorldPoint,
  createPolylineMorph,
  morphPolyline,
});

function focusBounds(marks) {
  const boxes = marks
    .filter((mark) => mark.alpha > 0)
    .map((mark) => {
      if ([mark.x, mark.y, mark.width, mark.height].every(Number.isFinite)) return mark;
      const points = mark.points ?? [mark.from, mark.to, ...(mark.head ?? [])].filter(Boolean);
      if (!points.length) return null;
      const pad = (mark.strokeWidth ?? 0) / 2,
        xs = points.map((p) => p.x),
        ys = points.map((p) => p.y);
      const box = {
        x: Math.min(...xs) - pad,
        y: Math.min(...ys) - pad,
        width: Math.max(...xs) - Math.min(...xs) + pad * 2,
        height: Math.max(...ys) - Math.min(...ys) + pad * 2,
      };
      if (!mark.clip) return box;
      const x = Math.max(box.x, mark.clip.x),
        y = Math.max(box.y, mark.clip.y);
      return {
        x,
        y,
        width: Math.min(box.x + box.width, mark.clip.x + mark.clip.width) - x,
        height: Math.min(box.y + box.height, mark.clip.y + mark.clip.height) - y,
      };
    })
    .filter((box) => box && box.width > 0 && box.height > 0);
  if (!boxes.length) return null;
  const x = Math.min(...boxes.map((box) => box.x)),
    y = Math.min(...boxes.map((box) => box.y));
  return {
    x,
    y,
    width: Math.max(...boxes.map((box) => box.x + box.width)) - x,
    height: Math.max(...boxes.map((box) => box.y + box.height)) - y,
  };
}

export function createLessonPainter(ctx, state = {}) {
  let depth = 0;
  let director;
  function originalAlpha(name, args) {
    const chosen = (value, fallback) => (value === undefined ? fallback : value);
    let colors;
    if (name === 'image') return ctx.globalAlpha * (args[2]?.opacity ?? 1);
    if (name === 'text' || name === 'math') colors = [chosen(args[5], C.ink)];
    else if (name === 'line' || name === 'arrow')
      colors = [chosen(args[5], name === 'line' ? C.muted : C.cyan)];
    else if (name === 'circle') colors = [chosen(args[4], C.cyan), args[5]];
    else if (name === 'rect') colors = [chosen(args[5], C.panel), args[6]];
    else if (name === 'connect') colors = [args[3]?.color ?? C.cyan];
    else if (name === 'trace') colors = [chosen(args[3], C.cyan)];
    else {
      const style = args[2] ?? {};
      colors = [style.fill, (style.width ?? 4) > 0 ? chosen(style.color, C.cyan) : null];
    }
    return ctx.globalAlpha * Math.max(0, ...colors.map((color) => (color ? colorAlpha(color) : 0)));
  }
  const paintMethods = new Set([
    'stroke',
    'fill',
    'fillText',
    'strokeText',
    'fillRect',
    'strokeRect',
    'clearRect',
    'drawImage',
    'putImageData',
    'reset',
  ]);
  const primitives = new Set([
    'text',
    'math',
    'image',
    'line',
    'arrow',
    'circle',
    'rect',
    'path',
    'trace',
    'connect',
  ]);
  const methods = new Map();
  const report = (method) =>
    audit?.issues.push({
      type: 'untracked-paint',
      method,
      id: `raw-paint-${audit.issues.length}`,
      callsite: new Error().stack?.split('\n').slice(2, 5).join('\n'),
    });
  const canvas = new Proxy(ctx.canvas, {
    get(target, key) {
      if (key === 'getContext')
        return (kind) => {
          if (kind !== '2d') throw new Error('Lesson painters support only the audited 2d context');
          return guarded;
        };
      const value = Reflect.get(target, key, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, key) {
      report(`canvas.${String(key)}=`);
      // Resizing clears pixels and the complete drawing state. Keep the frame
      // intact so QA can report the bypass rather than corrupt later scenes.
      return true;
    },
    defineProperty(target, key) {
      report(`canvas.defineProperty(${String(key)})`);
      return false;
    },
  });
  const guarded = new Proxy(ctx, {
    get(target, key) {
      if (key === 'canvas') return canvas;
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      if (!methods.has(key))
        methods.set(key, (...args) => {
          if (depth === 0 && paintMethods.has(key)) report(key);
          return value.apply(target, args);
        });
      return methods.get(key);
    },
    set(target, key, value) {
      return Reflect.set(target, key, value, target);
    },
  });
  const guardedApi = Object.freeze(
    Object.fromEntries(
      Object.entries(api).map(([key, value]) => [
        key,
        primitives.has(key)
          ? (...args) => {
              depth++;
              try {
                return director
                  ? director.paint(() => value(...args), originalAlpha(key, args))
                  : value(...args);
              } finally {
                depth--;
              }
            }
          : value,
      ]),
    ),
  );
  function target(id, draw) {
    const kinds = ['labels', 'shapes', 'connectors', 'paths'];
    const starts = kinds.map((kind) => audit?.[kind].length ?? 0);
    const result = director.target(id, draw);
    if (audit) {
      const marks = kinds.flatMap((kind, index) => audit[kind].slice(starts[index]));
      const bounds = focusBounds(marks);
      if (bounds)
        audit.targets.push({
          id,
          ...bounds,
          alpha: Math.max(...marks.map((mark) => mark.alpha)),
          marks: marks.length,
          markCounts: {
            ...Object.fromEntries(
              kinds.map((kind, index) => [kind, audit[kind].length - starts[index]]),
            ),
            math: audit.labels.slice(starts[0]).filter((label) => label.kind === 'math').length,
          },
        });
    }
    return result;
  }
  const checkedPainter = {
    target,
    measureText: (value, size, font) => {
      guarded.save();
      try {
        guarded.font = lessonFont(size, font);
        return guarded.measureText(value).width;
      } finally {
        guarded.restore();
      }
    },
    rect: (...args) => guardedApi.rect(guarded, ...args),
    text: (...args) => guardedApi.text(guarded, ...args),
    circle: (...args) => guardedApi.circle(guarded, ...args),
    math: (...args) => guardedApi.math(guarded, ...args),
    image: (...args) => guardedApi.image(guarded, ...args),
    line: (...args) => guardedApi.line(guarded, ...args),
    arrow: (...args) => guardedApi.arrow(guarded, ...args),
    path: (...args) => guardedApi.path(guarded, ...args),
    connect: (...args) => guardedApi.connect(guarded, ...args),
    container: (bounds, draw, options) => guardedApi.container(guarded, bounds, draw, options),
    labelScope: (bounds, draw, options) => guardedApi.labelScope(guarded, bounds, draw, options),
    opacity: (alpha, draw) => {
      guarded.save();
      try {
        guarded.globalAlpha *= alpha;
        return draw();
      } finally {
        guarded.restore();
      }
    },
  };
  const cues =
    state.cues &&
    Object.fromEntries(
      Object.entries(state.cues).map(([id, cue]) => [
        id,
        { ...cue, color: C[cue.color] ?? cue.color },
      ]),
    );
  director = createFocusDirector(checkedPainter, {
    cues,
    strict: state.cueTiming === 'provider-words',
    minimumContextAlpha: 0.26,
  });
  const components = Object.freeze(createCanvasComponents(checkedPainter));
  const teaching = Object.freeze(createTeachingCanvas(checkedPainter));
  const focus = Object.freeze({
    target,
    cue: director.cue,
    progress: director.progress,
    reveal: director.reveal,
    visible: director.visible,
  });
  function finish() {
    if (!audit || !director.active || director.active.strength < 0.12) return;
    const cue = director.active;
    for (const id of cue.targets) {
      const parts = audit.targets.filter((part) => part.id === id);
      if (!parts.length)
        audit.issues.push({ type: 'missing-focus-target', cue: cue.id, target: id });
      for (const [index, part] of mergeFocusRegions(parts).entries())
        director.target(id, () =>
          teaching.focusFrame({
            bounds: part,
            strength: cue.strength,
            color: cue.color,
            clip: { x: 24, y: 24, width: 1872, height: 1032 },
            avoid: audit.labels.filter((label) => label.alpha > 0.1),
            id: `focus:${cue.id}:${id}:${index}`,
          }),
        );
    }
  }
  return {
    ctx: guarded,
    api: Object.freeze({ ...guardedApi, components, teaching, focus }),
    finish,
  };
}

export function wrap(ctx, value, maxWidth) {
  const lines = [];
  let row = '';
  for (const word of String(value).split(/\s+/)) {
    if (row && ctx.measureText(`${row} ${word}`).width > maxWidth) {
      lines.push(row);
      row = word;
    } else row += `${row ? ' ' : ''}${word}`;
  }
  if (row) lines.push(row);
  return lines;
}

export function drawFrame(ctx, lesson, scene, state, draw) {
  const previous = { audit, labelScopes, paintOrder };
  audit = {
    labels: [],
    shapes: [],
    connectors: [],
    paths: [],
    groups: [],
    targets: [],
    issues: [],
  };
  labelScopes = [];
  paintOrder = 0;
  const { width, height } = ctx.canvas;
  ctx.save();
  try {
    ctx.scale(width / 1920, height / 1080);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.save();
    try {
      const opening = scene.id != null && scene.id === lesson.scenes?.[0]?.id;
      ctx.globalAlpha =
        opening && state.t < 0.35
          ? 1
          : (state.opacity ??
            Math.min(ease(state.t / 0.35), ease((state.duration - state.t) / 0.3)));
      let headingSize = 56;
      do {
        ctx.font = lessonFont(headingSize, 'serif');
        if (ctx.measureText(scene.title).width <= 1720) break;
        headingSize -= 2;
      } while (headingSize > 36);
      text(ctx, scene.title, 100, 145, headingSize, C.ink, 'left', 'serif');
      const painter = createLessonPainter(ctx, state);
      draw(painter.ctx, scene, state, painter.api);
      painter.finish();
    } finally {
      ctx.restore();
    }
    return audit;
  } finally {
    ctx.restore();
    ({ audit, labelScopes, paintOrder } = previous);
  }
}
