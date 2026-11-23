import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { Path2D } from '@napi-rs/canvas';
import { DOMParser } from '@xmldom/xmldom';

const directory = fileURLToPath(new URL('../assets/concepts/', import.meta.url));
export const conceptCatalog = JSON.parse(readFileSync(join(directory, 'manifest.json'), 'utf8'));
const entries = new Map(conceptCatalog.icons.map((icon) => [icon.id, icon]));
const parsed = new Map();
const attributes = new Set([
  'xmlns',
  'viewBox',
  'role',
  'width',
  'height',
  'id',
  'data-part',
  'd',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'points',
  'fill',
  'stroke',
  'stroke-width',
  'fill-opacity',
  'stroke-opacity',
  'opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'fill-rule',
]);
const clamp = (n) => Math.max(0, Math.min(1, n));
const number = (node, name, fallback = 0) => {
  const value = node.hasAttribute(name) ? Number(node.getAttribute(name)) : fallback;
  if (!Number.isFinite(value)) throw new Error(`Invalid SVG ${name}`);
  return value;
};
const point = (x, y) => ({ x, y });
const midpoint = (a, b) => point((a.x + b.x) / 2, (a.y + b.y) / 2);
function distance(p, a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    squared = dx * dx + dy * dy;
  const t = squared ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / squared) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

function quadratic(a, b, c, output, depth = 0) {
  if (depth === 12 || distance(b, a, c) <= 0.025) {
    output.push(c);
    return;
  }
  const ab = midpoint(a, b),
    bc = midpoint(b, c),
    middle = midpoint(ab, bc);
  quadratic(a, ab, middle, output, depth + 1);
  quadratic(middle, bc, c, output, depth + 1);
}
function cubic(a, b, c, d, output, depth = 0) {
  if (depth === 12 || Math.max(distance(b, a, d), distance(c, a, d)) <= 0.025) {
    output.push(d);
    return;
  }
  const ab = midpoint(a, b),
    bc = midpoint(b, c),
    cd = midpoint(c, d);
  const abc = midpoint(ab, bc),
    bcd = midpoint(bc, cd),
    middle = midpoint(abc, bcd);
  cubic(a, ab, abc, middle, output, depth + 1);
  cubic(middle, bcd, cd, d, output, depth + 1);
}

// Skia resolves SVG arcs, relative commands and smooth controls before flattening.
function contours(native) {
  const canonical = native.toSVGString();
  const tokens = canonical.match(/[MLQCZ]|[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi) ?? [];
  if (canonical.replace(/[MLQCZ\s,]|[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi, ''))
    throw new Error('Unsupported normalized SVG path');
  const result = [];
  let current,
    index = 0;
  const next = () => {
    const x = Number(tokens[index++]),
      y = Number(tokens[index++]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Invalid SVG path coordinate');
    return point(x, y);
  };
  while (index < tokens.length) {
    const command = tokens[index++];
    if (command === 'M') {
      current = { points: [next()], closed: false };
      result.push(current);
    } else if (!current) throw new Error('SVG path must begin with a move');
    else if (command === 'L') current.points.push(next());
    else if (command === 'Q') {
      const b = next(),
        c = next();
      quadratic(current.points.at(-1), b, c, current.points);
    } else if (command === 'C') {
      const b = next(),
        c = next(),
        d = next();
      cubic(current.points.at(-1), b, c, d, current.points);
    } else if (command === 'Z') current.closed = true;
    else throw new Error(`Unsupported normalized command: ${command}`);
  }
  return result.filter((contour) => contour.points.length > 1);
}

function geometry(node) {
  const path = new Path2D(),
    name = node.localName;
  if (name === 'path') return new Path2D(node.getAttribute('d'));
  if (name === 'circle' || name === 'ellipse') {
    const rx = number(node, name === 'circle' ? 'r' : 'rx'),
      ry = number(node, name === 'circle' ? 'r' : 'ry');
    if (rx <= 0 || ry <= 0) throw new Error('SVG radii must be positive');
    path.ellipse(number(node, 'cx'), number(node, 'cy'), rx, ry, 0, 0, Math.PI * 2);
    path.closePath();
  } else if (name === 'rect') {
    const x = number(node, 'x'),
      y = number(node, 'y'),
      w = number(node, 'width'),
      h = number(node, 'height');
    if (w <= 0 || h <= 0) throw new Error('SVG rectangles must have positive dimensions');
    const rx = Math.min(w / 2, number(node, 'rx', number(node, 'ry'))),
      ry = Math.min(h / 2, number(node, 'ry', rx));
    if (rx < 0 || ry < 0) throw new Error('Invalid SVG corner radius');
    if (rx && ry)
      return new Path2D(
        `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`,
      );
    path.rect(x, y, w, h);
  } else if (name === 'line') {
    path.moveTo(number(node, 'x1'), number(node, 'y1'));
    path.lineTo(number(node, 'x2'), number(node, 'y2'));
  } else if (name === 'polyline' || name === 'polygon') {
    const values = node
      .getAttribute('points')
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (values.length < 4 || values.length % 2 || values.some((n) => !Number.isFinite(n)))
      throw new Error('Invalid SVG polygon points');
    path.moveTo(values[0], values[1]);
    for (let i = 2; i < values.length; i += 2) path.lineTo(values[i], values[i + 1]);
    if (name === 'polygon') path.closePath();
  } else throw new Error(`Unsupported concept SVG element: ${name}`);
  return path;
}

export function parseConceptSvg(svg) {
  if (/<!DOCTYPE|<!ENTITY/i.test(svg)) throw new Error('Concept SVG must be self-contained');
  const document = new DOMParser({
    onError: (level, message) => {
      throw new Error(`Invalid concept SVG: ${message}`);
    },
  }).parseFromString(svg, 'image/svg+xml');
  const root = document.documentElement;
  if (root.localName !== 'svg') throw new Error('Concept SVG needs an svg root');
  const viewBox = (root.getAttribute('viewBox') ?? '')
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (
    viewBox.length !== 4 ||
    viewBox.some((n) => !Number.isFinite(n)) ||
    viewBox[2] <= 0 ||
    viewBox[3] <= 0
  )
    throw new Error('Concept SVG needs a finite viewBox');
  const shapes = [];
  function visit(node, inherited) {
    if (node.nodeType !== 1) return;
    if (['title', 'desc'].includes(node.localName)) return;
    for (const attribute of Array.from(node.attributes)) {
      if (!attributes.has(attribute.name) && !attribute.name.startsWith('aria-'))
        throw new Error(`Unsupported SVG attribute: ${attribute.name}`);
    }
    if (
      ['svg', 'g'].includes(node.localName) &&
      node.hasAttribute('opacity') &&
      number(node, 'opacity') !== 1
    )
      throw new Error('Concept groups need per-shape opacity');
    const style = { ...inherited, opacity: inherited.opacity * number(node, 'opacity', 1) };
    for (const [attribute, key] of [
      ['fill', 'fill'],
      ['stroke', 'stroke'],
      ['stroke-width', 'width'],
      ['fill-opacity', 'fillOpacity'],
      ['stroke-opacity', 'strokeOpacity'],
    ]) {
      if (node.hasAttribute(attribute))
        style[key] = ['fill', 'stroke'].includes(attribute)
          ? node.getAttribute(attribute)
          : number(node, attribute);
    }
    for (const color of [style.fill, style.stroke])
      if (color !== 'none' && !/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(color))
        throw new Error(`Unsupported SVG color: ${color}`);
    for (const key of ['opacity', 'fillOpacity', 'strokeOpacity'])
      if (style[key] < 0 || style[key] > 1) throw new Error(`Invalid SVG ${key}`);
    if (style.width < 0) throw new Error('SVG stroke width must be nonnegative');
    for (const key of ['stroke-linecap', 'stroke-linejoin'])
      if (node.hasAttribute(key) && node.getAttribute(key) !== 'round')
        throw new Error(`Concept SVG ${key} must be round`);
    if (node.hasAttribute('fill-rule') && node.getAttribute('fill-rule') !== 'nonzero')
      throw new Error('Unsupported SVG fill rule');
    if (node.localName === 'svg' || node.localName === 'g') {
      for (const child of Array.from(node.childNodes)) visit(child, style);
    } else {
      const paths = contours(geometry(node));
      if (style.fill !== 'none' && paths.length > 1)
        throw new Error('Filled SVG paths need a single contour');
      shapes.push({
        part: node.getAttribute('data-part') || `part-${shapes.length}`,
        paths,
        ...style,
      });
    }
  }
  visit(root, {
    fill: '#000000',
    stroke: 'none',
    width: 1,
    opacity: 1,
    fillOpacity: 1,
    strokeOpacity: 1,
  });
  if (!shapes.length) throw new Error('Concept SVG contains no geometry');
  return { viewBox, shapes };
}

export function conceptSourceFiles() {
  return [
    'lib/concepts.mjs',
    'assets/concepts/manifest.json',
    ...readdirSync(directory)
      .filter((file) => file.endsWith('.svg'))
      .sort()
      .map((file) => `assets/concepts/${file}`),
  ];
}

function asset(id) {
  if (!entries.has(id)) throw new Error(`Unknown concept icon: ${id}`);
  if (!parsed.has(id))
    parsed.set(id, parseConceptSvg(readFileSync(join(directory, entries.get(id).file), 'utf8')));
  return parsed.get(id);
}

export function drawConcept(ctx, api, id, x, y, size = 80, options = {}) {
  if (Object.hasOwn(options, 'progress'))
    throw new Error(
      'Concept objects use complete geometry; animate their position or state instead of tracing the icon',
    );
  const {
    label,
    labelPosition = 'below',
    labelSize = 24,
    labelColor = api.C.ink,
    labelGap = 12,
    opacity = 1,
    parts = {},
    theme = 'dark',
  } = options;
  if (typeof label !== 'string' || !label.trim() || label.includes('\n'))
    throw new Error('A concept object requires a visible single-line label');
  if (!['below', 'right'].includes(labelPosition))
    throw new Error('Concept labelPosition must be below or right');
  if (
    ![x, y, size, opacity, labelSize, labelGap].every(Number.isFinite) ||
    size <= 0 ||
    labelSize <= 0 ||
    labelGap < 0
  )
    throw new Error('Concept object geometry must be finite and positive');
  if (!['dark', 'light'].includes(theme)) throw new Error(`Unknown concept theme: ${theme}`);
  const icon = asset(id),
    [vx, vy, width, height] = icon.viewBox;
  const scale = size / Math.max(width, height);
  ctx.save();
  ctx.font = `500 ${labelSize}px "Lesson Sans"`;
  const metrics = ctx.measureText(label);
  ctx.restore();
  const textWidth =
    Math.max(metrics.width, metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) + 4;
  const textHeight =
    Math.max(labelSize, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) + 4;
  const below = labelPosition === 'below';
  const labelX = below ? x + size / 2 : x + size + labelGap;
  const labelY = below
    ? y + size + labelGap + metrics.actualBoundingBoxAscent + 2
    : y + size / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
  const bounds = below
    ? {
        x: x + size / 2 - Math.max(size, textWidth) / 2,
        y,
        width: Math.max(size, textWidth),
        height: size + labelGap + textHeight,
      }
    : {
        x,
        y: y + size / 2 - Math.max(size, textHeight) / 2,
        width: size + labelGap + textWidth,
        height: Math.max(size, textHeight),
      };
  const colors = new Map(
    Object.entries(conceptCatalog.paletteVariants?.[theme] ?? {}).map(([source, target]) => [
      source.toLowerCase(),
      target,
    ]),
  );
  const color = (value) => colors.get(value.toLowerCase()) ?? value;
  const alpha = clamp(opacity);
  return api.components.panel(
    {
      ...bounds,
      fill: null,
      radius: 0,
      padding: 0,
      id: `concept-object:${id}:${label}`,
      opacity: alpha,
    },
    () => {
      api.text(ctx, label, labelX, labelY, labelSize, labelColor, below ? 'center' : 'left');
      api.container(
        ctx,
        { x, y, width: size, height: size },
        () => {
          ctx.save();
          ctx.translate(x + (size - width * scale) / 2, y + (size - height * scale) / 2);
          ctx.scale(scale, scale);
          ctx.translate(-vx, -vy);
          try {
            for (const shape of icon.shapes) {
              const part = parts[shape.part] ?? 1;
              if (!Number.isFinite(part))
                throw new Error(`Invalid concept part opacity: ${shape.part}`);
              for (const contour of shape.paths) {
                if (shape.fill !== 'none' && shape.fillOpacity > 0) {
                  ctx.save();
                  ctx.globalAlpha *= shape.opacity * shape.fillOpacity * clamp(part);
                  api.path(ctx, contour.points, {
                    closed: contour.closed,
                    fill: color(shape.fill),
                    width: 0,
                    color: undefined,
                    id: `${id}:${shape.part}:fill`,
                  });
                  ctx.restore();
                }
                if (shape.stroke !== 'none' && shape.width > 0 && shape.strokeOpacity > 0) {
                  ctx.save();
                  ctx.globalAlpha *= shape.opacity * shape.strokeOpacity * clamp(part);
                  api.path(ctx, contour.points, {
                    closed: contour.closed,
                    color: color(shape.stroke),
                    width: shape.width,
                    id: `${id}:${shape.part}:stroke`,
                  });
                  ctx.restore();
                }
              }
            }
          } finally {
            ctx.restore();
          }
        },
        { padding: 0, id: `concept:${id}` },
      );
    },
  );
}
