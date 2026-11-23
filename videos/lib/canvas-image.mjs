import { createHash } from 'node:crypto';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const PNG_PREFIX = 'data:image/png;base64,';
const MAX_BYTES = 16 * 1024 * 1024;
const MAX_PIXELS = 16 * 1024 * 1024;
const decodedImages = new WeakMap();

/** Decode an embedded Vizmatic ImageAsset once, before rendering any frames. */
export async function prepareCanvasImage(asset) {
  if (asset?.mediaType !== 'image/png' || !asset.src?.startsWith(PNG_PREFIX)) {
    throw new Error('Canvas images require a prepared, embedded PNG ImageAsset.');
  }
  const encoded = asset.src.slice(PNG_PREFIX.length);
  if (
    !encoded.length ||
    encoded.length > Math.ceil(MAX_BYTES / 3) * 4 ||
    encoded.length % 4 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
  ) {
    throw new Error('Canvas image has invalid or oversized base64 data.');
  }
  const bytes = Buffer.from(encoded, 'base64');
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (
    bytes.length < 33 ||
    bytes.length > MAX_BYTES ||
    !bytes.subarray(0, 8).equals(signature) ||
    bytes.readUInt32BE(8) !== 13 ||
    bytes.toString('ascii', 12, 16) !== 'IHDR'
  ) {
    throw new Error('Canvas image has an invalid PNG header.');
  }
  const width = bytes.readUInt32BE(16),
    height = bytes.readUInt32BE(20);
  if (!width || !height || width * height > MAX_PIXELS) {
    throw new Error(`Canvas images require positive dimensions and at most ${MAX_PIXELS} pixels.`);
  }
  if (asset.width !== width || asset.height !== height) {
    throw new Error('Canvas image dimensions differ from its ImageAsset declaration.');
  }
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (asset.sha256 !== sha256)
    throw new Error('Canvas image SHA-256 differs from its ImageAsset declaration.');
  const image = await loadImage(bytes);
  if (image.width !== width || image.height !== height) {
    throw new Error('Decoded Canvas image dimensions differ from the PNG header.');
  }
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const rgba = context.getImageData(0, 0, width, height).data;
  const alpha = new Uint8Array(width * height);
  let maximumAlpha = 0;
  for (let pixel = 0; pixel < alpha.length; pixel++) {
    alpha[pixel] = rgba[pixel * 4 + 3];
    maximumAlpha = Math.max(maximumAlpha, alpha[pixel]);
  }
  // Pixels remain private. Callers cannot change an already prepared asset.
  const prepared = Object.freeze({
    kind: 'leetllm.canvas-image',
    width,
    height,
    sha256,
    ...(asset.id ? { id: asset.id } : {}),
  });
  decodedImages.set(prepared, { image, alpha, maximumAlpha });
  return prepared;
}

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`Image ${name} must be positive and finite.`);
  return value;
}

/** Compute both source crop and destination bounds without clipping later paint. */
export function canvasImagePlacement(asset, options = {}) {
  if (!decodedImages.has(asset))
    throw new Error('Prepare Canvas images before painting with prepareCanvasImage().');
  const { x = 0, y = 0, crop, fit = 'contain', opacity = 1 } = options;
  if (![x, y, opacity].every(Number.isFinite) || opacity < 0 || opacity > 1) {
    throw new Error('Image position must be finite and opacity must be between zero and one.');
  }
  if (fit !== 'contain' && fit !== 'cover') throw new Error('Image fit must be contain or cover.');
  const source = crop ? { ...crop } : { x: 0, y: 0, width: asset.width, height: asset.height };
  positive(source.width, 'crop width');
  positive(source.height, 'crop height');
  if (
    ![source.x, source.y].every(Number.isFinite) ||
    source.x < 0 ||
    source.y < 0 ||
    source.x + source.width > asset.width ||
    source.y + source.height > asset.height
  ) {
    throw new Error('Image crop must stay within the intrinsic image pixels.');
  }
  const width = positive(
    options.width ??
      (options.height === undefined
        ? source.width
        : (options.height * source.width) / source.height),
    'width',
  );
  const height = positive(options.height ?? (width * source.height) / source.width, 'height');
  const scale = (fit === 'contain' ? Math.min : Math.max)(
    width / source.width,
    height / source.height,
  );
  if (fit === 'cover') {
    const croppedWidth = width / scale,
      croppedHeight = height / scale;
    source.x += (source.width - croppedWidth) / 2;
    source.y += (source.height - croppedHeight) / 2;
    source.width = croppedWidth;
    source.height = croppedHeight;
  }
  const destination =
    fit === 'cover'
      ? { x, y, width, height }
      : {
          x: x + (width - source.width * scale) / 2,
          y: y + (height - source.height * scale) / 2,
          width: source.width * scale,
          height: source.height * scale,
        };
  return { source, destination, opacity };
}

/** Internal bridge for scene.mjs; lesson authors use the audited api.image(). */
export function paintCanvasImage(ctx, asset, options) {
  const placement = canvasImagePlacement(asset, options);
  const decoded = decodedImages.get(asset);
  const { source: s, destination: d, opacity } = placement;
  ctx.save();
  try {
    ctx.globalAlpha *= opacity;
    ctx.drawImage(decoded.image, s.x, s.y, s.width, s.height, d.x, d.y, d.width, d.height);
  } finally {
    ctx.restore();
  }
  return { ...placement, alpha: decoded.alpha, maximumAlpha: decoded.maximumAlpha };
}
