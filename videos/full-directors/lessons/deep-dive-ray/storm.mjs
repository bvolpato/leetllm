import { createCanvas } from '@napi-rs/canvas';
import assert from 'node:assert/strict';

const tileWidth = 168;
const rows = 120;
const imageWidth = 2 * tileWidth;
const mix = (a, b, p) => a + (b - a) * p;
const clamp = (t) => Math.min(1, Math.max(0, t));
const smooth = (t) => clamp(t) ** 2 * (3 - 2 * clamp(t));

function hash(x, y) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function noise(x, y) {
  const i = Math.floor(x),
    j = Math.floor(y);
  const u = smooth(x - i),
    v = smooth(y - j);
  return mix(mix(hash(i, j), hash(i + 1, j), u), mix(hash(i, j + 1), hash(i + 1, j + 1), u), v);
}

function cloudPixel(x, y) {
  const dx = (x - 172) / 53;
  const dy = (y - 58 + dx * 5) / 47;
  const r = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const twist = angle + 3.1 * Math.log(1 + 1.8 * r);
  const u = r * Math.cos(twist);
  const v = r * Math.sin(twist);
  const rough = noise(4 * u - 13, 4 * v + 8);
  const detail = noise(15 * u, 15 * v) * 0.52 + noise(35 * u, 35 * v) * 0.28 + hash(x, y) * 0.2;
  const band = Math.max(0, Math.cos(3 * twist + 1.8 * (rough - 0.5) + 0.6 * Math.sin(twist)));
  const spiral = band ** 2.3 * Math.exp(-0.92 * r) * (0.8 + 0.9 * rough);
  const canopy = 0.75 * Math.exp(-1.55 * r * r) + 0.35 * Math.exp(-7 * (r - 0.37) ** 2);
  const wisps = 0.43 * noise(2 * u + 4, 4 * v + 9) + 0.32 * rough;
  const eye = smooth((r + 0.035 * (rough - 0.5) - 0.098) / 0.12);
  const density = (canopy + spiral + wisps - 0.39 + 0.28 * (detail - 0.55)) * eye;
  return Math.round(63 * clamp(0.055 + 0.72 * density + 0.045 * detail));
}

const original = Uint8Array.from({ length: imageWidth * rows }, (_, i) =>
  cloudPixel(i % imageWidth, Math.floor(i / imageWidth)),
);

function encodeTile(offset) {
  const packed = [];
  for (let y = 0; y < rows; y++) {
    const scan = [];
    for (let x = 0; x < tileWidth; x++) {
      const ink = original[y * imageWidth + offset + x];
      if (scan.length && scan.at(-1) === ink) scan[scan.length - 2]++;
      else scan.push(1, ink);
    }
    packed.push(scan);
  }
  return packed;
}

function decode(packed) {
  const data = new Uint8Array(rows * tileWidth);
  let pos = 0;
  for (const scan of packed) {
    for (let i = 0; i < scan.length; i += 2) {
      data.fill(scan[i + 1], pos, pos + scan[i]);
      pos += scan[i];
    }
  }
  return data;
}

function stitch(west, east) {
  const image = new Uint8Array(rows * imageWidth);
  for (let y = 0; y < rows; y++) {
    image.set(west.subarray(y * tileWidth, (y + 1) * tileWidth), y * imageWidth);
    image.set(east.subarray(y * tileWidth, (y + 1) * tileWidth), y * imageWidth + tileWidth);
  }
  return image;
}

export const east = decode(encodeTile(tileWidth));
export const west = decode(encodeTile(0));
const joined = stitch(west, east);
const paletteStops = [
  [0, [17, 24, 60]],
  [8, [34, 41, 89]],
  [16, [60, 82, 144]],
  [23, [135, 168, 195]],
  [29, [228, 200, 179]],
  [34, [237, 148, 107]],
  [41, [203, 87, 71]],
  [47, [253, 164, 106]],
  [54, [255, 220, 166]],
  [63, [255, 248, 229]],
];
const palette = Array.from({ length: 64 }, (_, k) => {
  const hi = paletteStops.findIndex(([stop]) => k <= stop);
  const [b, to] = paletteStops[hi];
  const [a, from] = paletteStops[Math.max(0, hi - 1)];
  return from.map((v, i) => Math.round(mix(v, to[i], (k - a) / (b - a || 1))));
});

function rasterize(data, w) {
  const canvas = createCanvas(w, rows),
    ctx = canvas.getContext('2d');
  const rgba = ctx.createImageData(w, rows);
  data.forEach((k, i) => rgba.data.set([...palette[k], 255], 4 * i));
  ctx.putImageData(rgba, 0, 0);
  return canvas;
}

export const tiles = [rasterize(west, tileWidth), rasterize(east, tileWidth)];
export const storm = rasterize(joined, imageWidth);
export const tileRows = rows;
export function checkStorm() {
  assert.deepEqual(joined, original);
  assert.notDeepEqual(stitch(east, west), original);
}
