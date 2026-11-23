import { createCanvas } from '@napi-rs/canvas';

export const PAINTED_TEXT_SCOPE =
  'Fill-text glyphs rasterized independently at their paint-time font, alignment, baseline, affine transform and pixel phase. Bounds come from complete raster masks, not native actualBoundingBoxRight. Coordinates are normalized to 1920x1080. Later occlusion and encoded pixels require separate checks. Unsupported paint operations are reported explicitly.';

const TEXT_PROPERTIES = [
  'font',
  'textAlign',
  'textBaseline',
  'direction',
  'fontKerning',
  'fontStretch',
  'fontVariantCaps',
  'letterSpacing',
  'wordSpacing',
  'textRendering',
];
const MAX_RASTER_PIXELS = 4 * 1024 * 1024;

function rasterBounds(pixels, width, height) {
  let left = width,
    top = height,
    right = -1,
    bottom = -1;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] === 0) continue;
    const pixel = (index - 3) / 4,
      x = pixel % width,
      y = Math.floor(pixel / width);
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  return right < left ? null : { left, top, right, bottom };
}

function rasterize(text, state, matrix, fractionX, fractionY, advance, size) {
  const align =
    state.textAlign === 'start'
      ? state.direction === 'rtl'
        ? 'right'
        : 'left'
      : state.textAlign === 'end'
        ? state.direction === 'rtl'
          ? 'left'
          : 'right'
        : state.textAlign;
  const shift = align === 'center' ? -advance / 2 : align === 'right' ? -advance : 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    const padding = size * 2 * 2 ** attempt;
    const corners = [
      [shift - padding, -padding],
      [shift + advance + padding, -padding],
      [shift - padding, padding],
      [shift + advance + padding, padding],
    ].map(([x, y]) => ({
      x: matrix.a * x + matrix.c * y + fractionX,
      y: matrix.b * x + matrix.d * y + fractionY,
    }));
    const left = Math.floor(Math.min(...corners.map((point) => point.x)));
    const top = Math.floor(Math.min(...corners.map((point) => point.y)));
    const width = Math.max(1, Math.ceil(Math.max(...corners.map((point) => point.x))) - left);
    const height = Math.max(1, Math.ceil(Math.max(...corners.map((point) => point.y))) - top);
    if (!Number.isSafeInteger(width * height) || width * height > MAX_RASTER_PIXELS) {
      return { unsupported: 'text raster exceeds the audit pixel budget' };
    }
    const canvas = createCanvas(width, height),
      ink = canvas.getContext('2d');
    for (const property of TEXT_PROPERTIES)
      if (state[property] !== undefined) ink[property] = state[property];
    ink.fillStyle = '#fff';
    ink.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, fractionX - left, fractionY - top);
    ink.fillText(text, 0, 0);
    const pixels = ink.getImageData(0, 0, width, height).data;
    canvas.width = 1;
    canvas.height = 1;
    const bounds = rasterBounds(pixels, width, height);
    if (!bounds) return null;
    if (
      bounds.left === 0 ||
      bounds.top === 0 ||
      bounds.right === width - 1 ||
      bounds.bottom === height - 1
    )
      continue;
    const croppedWidth = bounds.right - bounds.left + 1,
      croppedHeight = bounds.bottom - bounds.top + 1;
    const data = new Uint8Array(croppedWidth * croppedHeight);
    for (let y = 0; y < croppedHeight; y++)
      for (let x = 0; x < croppedWidth; x++) {
        data[y * croppedWidth + x] = pixels[((bounds.top + y) * width + bounds.left + x) * 4 + 3];
      }
    return {
      width: croppedWidth,
      height: croppedHeight,
      data,
      offsetX: left + bounds.left,
      offsetY: top + bounds.top,
    };
  }
  return { unsupported: 'text glyphs reach the audit raster boundary' };
}

export function createPaintedTextCapture(context, { cacheBytes = 4 * 1024 * 1024 } = {}) {
  if (
    !context?.canvas ||
    typeof context.fillText !== 'function' ||
    typeof context.getTransform !== 'function'
  ) {
    throw new TypeError('Painted text capture requires a canvas 2d context');
  }
  if (!Number.isSafeInteger(cacheBytes) || cacheBytes < 0)
    throw new RangeError('Text cache bytes must be nonnegative');
  const labels = [],
    issues = [],
    methods = new Map(),
    cache = new Map(),
    colors = new Map();
  const colorCanvas = createCanvas(1, 1),
    colorContext = colorCanvas.getContext('2d');
  const clipStates = [];
  let clipped = false,
    bytes = 0,
    hits = 0,
    misses = 0,
    evictions = 0;

  function colorAlpha(color) {
    if (colors.has(color)) return colors.get(color);
    colorContext.clearRect(0, 0, 1, 1);
    colorContext.fillStyle = color;
    colorContext.fillRect(0, 0, 1, 1);
    const alpha = colorContext.getImageData(0, 0, 1, 1).data[3] / 255;
    if (colors.size === 256) colors.delete(colors.keys().next().value);
    colors.set(color, alpha);
    return alpha;
  }

  function unsupported(method, reason, text) {
    issues.push({
      type: 'painted-text-unsupported',
      method,
      reason,
      ...(typeof text === 'string' ? { text } : {}),
    });
  }

  function capture(args) {
    const [text, x, y] = args;
    if (typeof text !== 'string') return unsupported('fillText', 'non-string paint argument', text);
    if (!text.trim() || context.globalAlpha === 0) return;
    if (args.length > 3 && args[3] !== undefined)
      return unsupported('fillText', 'maxWidth is not audited', text);
    if (clipped) return unsupported('fillText', 'active clipping is not audited', text);
    if (typeof context.fillStyle !== 'string')
      return unsupported('fillText', 'gradient or pattern text is not audited', text);
    if (context.globalCompositeOperation !== 'source-over')
      return unsupported('fillText', 'text compositing is not audited', text);
    if (context.filter && context.filter !== 'none')
      return unsupported('fillText', 'filtered text is not audited', text);
    if (
      (context.shadowBlur || context.shadowOffsetX || context.shadowOffsetY) &&
      colorAlpha(context.shadowColor) > 0
    ) {
      return unsupported('fillText', 'text shadows are not audited', text);
    }
    const alpha = context.globalAlpha * colorAlpha(context.fillStyle);
    if (alpha === 0) return;
    const state = Object.fromEntries(
      TEXT_PROPERTIES.map((property) => [property, context[property]]),
    );
    const size = Number(state.font.match(/(?:^|\s)(\d+(?:\.\d+)?)px(?:\s|\/|$)/)?.[1]);
    const matrix = context.getTransform();
    const anchorX = matrix.a * x + matrix.c * y + matrix.e;
    const anchorY = matrix.b * x + matrix.d * y + matrix.f;
    const advance = context.measureText(text).width;
    if (
      !(size > 0) ||
      ![anchorX, anchorY, advance, matrix.a, matrix.b, matrix.c, matrix.d].every(Number.isFinite)
    ) {
      return unsupported('fillText', 'font size or paint geometry is not finite', text);
    }
    const integerX = Math.floor(anchorX),
      integerY = Math.floor(anchorY);
    const fractionX = anchorX - integerX,
      fractionY = anchorY - integerY;
    const key = JSON.stringify([
      text,
      state,
      matrix.a,
      matrix.b,
      matrix.c,
      matrix.d,
      fractionX,
      fractionY,
    ]);
    let mask;
    if (cache.has(key)) {
      const item = cache.get(key);
      mask = item.mask;
      hits++;
      cache.delete(key);
      cache.set(key, item);
    } else {
      misses++;
      mask = rasterize(text, state, matrix, fractionX, fractionY, advance, size);
      const cost = (mask?.data?.byteLength ?? 0) + key.length * 2 + 128;
      if (cost <= cacheBytes) {
        while (bytes + cost > cacheBytes) {
          const [oldKey, old] = cache.entries().next().value;
          cache.delete(oldKey);
          bytes -= old.bytes;
          evictions++;
        }
        cache.set(key, { mask, bytes: cost });
        bytes += cost;
      }
    }
    if (!mask) return;
    if (mask.unsupported) return unsupported('fillText', mask.unsupported, text);
    const sx = 1920 / context.canvas.width,
      sy = 1080 / context.canvas.height;
    const origin = { x: (integerX + mask.offsetX) * sx, y: (integerY + mask.offsetY) * sy };
    const label = {
      kind: 'text',
      id: `painted-text-${labels.length}`,
      text,
      x: origin.x,
      y: origin.y,
      width: mask.width * sx,
      height: mask.height * sy,
      alpha,
      fontSize:
        size *
        Math.max(
          Math.hypot(matrix.a * sx, matrix.b * sy),
          Math.hypot(matrix.c * sx, matrix.d * sy),
        ),
    };
    Object.defineProperty(label, 'ink', {
      value: {
        width: mask.width,
        height: mask.height,
        data: mask.data,
        origin,
        axisX: { x: sx, y: 0 },
        axisY: { x: 0, y: sy },
      },
    });
    labels.push(label);
    if (
      label.x < 0 ||
      label.y < 0 ||
      label.x + label.width > 1920 ||
      label.y + label.height > 1080
    ) {
      unsupported('fillText', 'glyphs extend beyond the canvas', text);
    }
  }

  const proxy = new Proxy(context, {
    get(target, property) {
      const value = Reflect.get(target, property, target);
      if (typeof value !== 'function') return value;
      if (!methods.has(property))
        methods.set(property, (...args) => {
          const result = value.apply(target, args);
          if (property === 'fillText') capture(args);
          else if (property === 'strokeText')
            unsupported('strokeText', 'stroke text is not audited', args[0]);
          else if (property === 'save') clipStates.push(clipped);
          else if (property === 'restore' && clipStates.length) clipped = clipStates.pop();
          else if (property === 'clip') clipped = true;
          else if (property === 'reset') {
            clipped = false;
            clipStates.length = 0;
          }
          return result;
        });
      return methods.get(property);
    },
    set(target, property, value) {
      return Reflect.set(target, property, value, target);
    },
  });
  return {
    context: proxy,
    labels,
    issues,
    reset() {
      labels.length = 0;
      issues.length = 0;
    },
    cacheStats() {
      return {
        entries: cache.size,
        bytes,
        limit: cacheBytes,
        hits,
        misses,
        evictions,
        colorEntries: colors.size,
      };
    },
  };
}
