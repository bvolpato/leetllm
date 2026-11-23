import { createCanvas } from '@napi-rs/canvas';

export const TEXT_INK_RULE = 'native-fillText-zero-discernible-ink';
export const TEXT_INK_SCOPE =
  'Native fillText at paint time only. Math, SVG, drawImage, strokeText, later occlusion, reading quality, and encoded-video contrast are outside this rule.';

const mirroredMethods = new Set([
  'save',
  'restore',
  'reset',
  'resetTransform',
  'setTransform',
  'transform',
  'translate',
  'scale',
  'rotate',
  'beginPath',
  'closePath',
  'rect',
  'roundRect',
  'arc',
  'arcTo',
  'ellipse',
  'moveTo',
  'lineTo',
  'bezierCurveTo',
  'quadraticCurveTo',
  'clip',
]);
const textProperties = [
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
  'globalAlpha',
];

function fillAlpha(style) {
  if (typeof style !== 'string') return null;
  const color = style.trim().toLowerCase();
  if (color === 'transparent') return 0;
  if (/^#[\da-f]{4}$/.test(color)) return parseInt(color.slice(-1), 16) / 15;
  if (/^#[\da-f]{8}$/.test(color)) return parseInt(color.slice(-2), 16) / 255;
  const alpha =
    color.match(/\/\s*([\d.]+%?)\s*\)$/)?.[1] ??
    color.match(/^(?:rgba|hsla)\([^)]*,\s*([\d.]+%?)\s*\)$/)?.[1];
  return alpha === undefined
    ? 1
    : Math.max(0, Math.min(1, parseFloat(alpha) / (alpha.endsWith('%') ? 100 : 1)));
}

function pixelBounds(ctx, text, x, y, maxWidth) {
  const metrics = ctx.measureText(text),
    matrix = ctx.getTransform();
  const scale = maxWidth === undefined || metrics.width <= maxWidth ? 1 : maxWidth / metrics.width;
  const left = x - metrics.actualBoundingBoxLeft * scale,
    right = x + metrics.actualBoundingBoxRight * scale;
  const top = y - metrics.actualBoundingBoxAscent,
    bottom = y + metrics.actualBoundingBoxDescent;
  if (
    ![left, right, top, bottom, scale].every(Number.isFinite) ||
    right <= left ||
    bottom <= top ||
    scale <= 0
  )
    return null;
  const points = [
    [left, top],
    [right, top],
    [left, bottom],
    [right, bottom],
  ].map(([px, py]) => ({
    x: matrix.a * px + matrix.c * py + matrix.e,
    y: matrix.b * px + matrix.d * py + matrix.f,
  }));
  const x0 = Math.max(0, Math.floor(Math.min(...points.map((p) => p.x))) - 2);
  const y0 = Math.max(0, Math.floor(Math.min(...points.map((p) => p.y))) - 2);
  const x1 = Math.min(ctx.canvas.width, Math.ceil(Math.max(...points.map((p) => p.x))) + 2);
  const y1 = Math.min(ctx.canvas.height, Math.ceil(Math.max(...points.map((p) => p.y))) + 2);
  return x1 <= x0 || y1 <= y0 ? null : { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

function changedInk(before, after, minimumDelta) {
  let changedPixels = 0,
    peakDelta = 0;
  for (let i = 0; i < before.length; i += 4) {
    const oldAlpha = before[i + 3] / 255,
      newAlpha = after[i + 3] / 255;
    const delta = Math.max(
      Math.abs(after[i + 3] - before[i + 3]),
      Math.abs(after[i] * newAlpha - before[i] * oldAlpha),
      Math.abs(after[i + 1] * newAlpha - before[i + 1] * oldAlpha),
      Math.abs(after[i + 2] * newAlpha - before[i + 2] * oldAlpha),
    );
    if (delta >= minimumDelta) changedPixels++;
    peakDelta = Math.max(peakDelta, delta);
  }
  return { changedPixels, peakDelta };
}

/** Install before drawing/clipping. A separate context mirrors native state and clips;
 * no counterfactual paint or pixel restoration ever touches the real canvas. */
export function createTextInkAudit(
  native,
  { minimumOpacity = 0.25, minimumDelta = 6, minimumGlyphPixels = 3 } = {},
) {
  if (
    ![minimumOpacity, minimumDelta, minimumGlyphPixels].every(Number.isFinite) ||
    minimumOpacity < 0 ||
    minimumOpacity > 1 ||
    minimumDelta <= 0 ||
    minimumDelta > 255 ||
    minimumGlyphPixels < 1
  ) {
    throw new Error('Invalid text ink audit thresholds');
  }
  const width = native.canvas.width,
    height = native.canvas.height;
  const maskCanvas = createCanvas(width, height),
    mask = maskCanvas.getContext('2d');
  for (const key of textProperties) if (native[key] !== undefined) mask[key] = native[key];
  mask.setTransform(native.getTransform());
  let labels = [],
    metadata = {},
    previousMask = null;
  const methods = new Map();

  function expectedInk(text, args, bounds) {
    if (previousMask) mask.putImageData(previousMask.image, previousMask.x, previousMask.y);
    // putImageData ignores the mirrored clip and transform, clearing the previous probe exactly.
    const clear = mask.createImageData(bounds.width, bounds.height);
    mask.save();
    try {
      mask.fillStyle = '#fff';
      mask.globalAlpha = 1;
      mask.globalCompositeOperation = 'source-over';
      mask.shadowColor = 'transparent';
      mask.shadowBlur = 0;
      mask.shadowOffsetX = 0;
      mask.shadowOffsetY = 0;
      if ('filter' in mask) mask.filter = 'none';
      mask.fillText(text, ...args);
    } finally {
      mask.restore();
    }
    const pixels = mask.getImageData(bounds.x, bounds.y, bounds.width, bounds.height).data;
    previousMask = { image: clear, x: bounds.x, y: bounds.y };
    let count = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] >= 32) count++;
    return count;
  }

  function fillText(...args) {
    const [value, x, y, maxWidth] = args,
      text = String(value);
    const alpha = fillAlpha(native.fillStyle),
      opacity = alpha === null ? null : native.globalAlpha * alpha;
    const label = {
      ...metadata,
      text,
      font: native.font,
      foreground: typeof native.fillStyle === 'string' ? native.fillStyle : '[gradient/pattern]',
      opacity,
      textAlign: native.textAlign,
      textBaseline: native.textBaseline,
      order: labels.length,
    };
    labels.push(label);
    // Native Canvas stores global alpha in 8 bits, including .25 as 63/255.
    if (!text.trim() || opacity === null || opacity + 1 / 255 < minimumOpacity) {
      label.status = !text.trim() ? 'empty' : opacity === null ? 'unsupported-fill' : 'low-opacity';
      return native.fillText(...args);
    }
    const bounds = pixelBounds(native, text, x, y, maxWidth);
    if (!bounds) {
      label.status = 'outside-or-empty';
      return native.fillText(...args);
    }
    label.bounds = bounds;
    const before = native.getImageData(bounds.x, bounds.y, bounds.width, bounds.height).data;
    const result = native.fillText(...args);
    const after = native.getImageData(bounds.x, bounds.y, bounds.width, bounds.height).data;
    Object.assign(label, changedInk(before, after, minimumDelta));
    if (label.changedPixels > 0) label.status = 'visible';
    else {
      label.glyphPixels = expectedInk(text, args.slice(1), bounds);
      label.status =
        label.glyphPixels >= minimumGlyphPixels ? 'no-discernible-ink' : 'clipped-or-subpixel';
    }
    return result;
  }

  const ctx = new Proxy(native, {
    get(target, key) {
      if (key === 'fillText') return fillText;
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      if (!methods.has(key))
        methods.set(key, (...args) => {
          const result = value.apply(target, args);
          if (mirroredMethods.has(key)) mask[key](...args);
          return result;
        });
      return methods.get(key);
    },
    set(target, key, value) {
      const result = Reflect.set(target, key, value, target);
      if (key in mask) Reflect.set(mask, key, Reflect.get(target, key, target), mask);
      return result;
    },
  });
  return {
    ctx,
    beginFrame(context = {}) {
      if (native.canvas.width !== width || native.canvas.height !== height)
        throw new Error('Create a new text ink audit after resizing the canvas');
      labels = [];
      metadata = context;
    },
    finishFrame() {
      const issues = labels.filter((label) => label.status === 'no-discernible-ink');
      return {
        labels,
        issues,
        checkedLabels: labels.filter(
          (label) => label.status === 'visible' || label.status === 'no-discernible-ink',
        ).length,
        skippedLabels: labels.filter(
          (label) => label.status !== 'visible' && label.status !== 'no-discernible-ink',
        ).length,
        passed: issues.length === 0,
      };
    },
  };
}
