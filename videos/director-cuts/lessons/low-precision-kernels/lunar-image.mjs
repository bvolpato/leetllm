// A synthetic monochrome test image. Both readers operate on these exact samples.
export const size = 256;
const pixels = new Uint8Array(size * size);
const radius = size * 0.485;

function hash(x, y) {
  let n = Math.imul(x, 1597334677) ^ Math.imul(y, 3812015801);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 0x100000000;
}

const smooth = x => x * x * (3 - 2 * x);
function noise(x, y) {
  const i = Math.floor(x), j = Math.floor(y);
  const u = smooth(x - i), v = smooth(y - j);
  const a = hash(i, j) * (1 - u) + hash(i + 1, j) * u;
  const b = hash(i, j + 1) * (1 - u) + hash(i + 1, j + 1) * u;
  return a * (1 - v) + b * v;
}

// Build the crater relief once in image space. The light catches the raised lip
// on the opposite side from the lit inner wall.
const relief = new Float32Array(size * size);
const dust = new Float32Array(size * size);
function crater(cx, cy, r) {
  const squeeze = Math.sqrt(Math.max(0.25, 1 - cx * cx - cy * cy));
  const angle = Math.atan2(cy, cx), c = Math.cos(angle), s = Math.sin(angle);
  const px = size / 2 + radius * cx, py = size / 2 + radius * cy;
  const extent = radius * r * 1.55;
  for (let y = Math.max(0, Math.floor(py - extent)); y < Math.min(size, py + extent); y++) {
    for (let x = Math.max(0, Math.floor(px - extent)); x < Math.min(size, px + extent); x++) {
      const dx = (x + 0.5 - px) / (r * radius), dy = (y + 0.5 - py) / (r * radius);
      const d = Math.hypot((dx * c + dy * s) / squeeze, -dx * s + dy * c);
      if (d > 1.5) continue;
      const wall = Math.max(0, 1 - d * d);
      const lip = Math.exp(-(((d - 0.98) / 0.13) ** 2));
      const peak = Math.exp(-((d / 0.15) ** 2));
      const at = y * size + x;
      relief[at] += r * (-0.27 * Math.min(0.8, wall) + 0.095 * lip + 0.08 * peak);
      dust[at] += 24 * lip + 9 * peak;
    }
  }
}
const feature = {x: 0.32, y: -0.28, r: 0.14};
crater(feature.x, feature.y, feature.r);
for (let i = 0; i < 740; i++) {
  const angle = 2 * Math.PI * hash(i, 50), d = Math.sqrt(hash(i, 28));
  const x = Math.cos(angle) * d, y = Math.sin(angle) * d;
  const r = 0.008 + 0.095 * hash(i, 30) ** 5;
  if (Math.hypot(x - feature.x, y - feature.y) > feature.r + r) crater(x, y, r);
}
const seas = [
  [-0.40, -0.28, 0.39, 0.26, 58], [0.02, -0.48, 0.30, 0.25, 62],
  [0.31, -0.09, 0.22, 0.17, 62], [-0.31, 0.10, 0.34, 0.23, 42],
  [0.62, 0.15, 0.12, 0.18, 52], [-0.14, 0.48, 0.13, 0.15, 35],
];
for (let row = 0; row < size; row++) {
  for (let col = 0; col < size; col++) {
    const x = (col + 0.5 - size / 2) / radius, y = (row + 0.5 - size / 2) / radius;
    if (x * x + y * y >= 1) continue;
    const i = row * size + col, z = Math.sqrt(1 - x * x - y * y);
    const roughX = radius * (relief[i + 1] - relief[i - 1]) / 2;
    const roughY = radius * (relief[i + size] - relief[i - size]) / 2;
    const nx = x / z - roughX, ny = y / z - roughY;
    const light = Math.max(0, (0.37 * nx - 0.38 * ny + 0.85) / Math.hypot(nx, ny, 1));
    const warp = noise(6 * x, 6 * y) - 0.5;
    let maria = 0;
    for (const [sx, sy, rx, ry, depth] of seas) {
      const dist = Math.hypot((x - sx) / rx, (y - sy) / ry) + warp * 0.6;
      maria = Math.max(maria, depth * smooth(Math.max(0, Math.min(1, (1.15 - dist) * 3))));
    }
    const grain = 29 * noise(x * 15, y * 15) + 18 * noise(x * 55, y * 55) + 10 * hash(col, row);
    const intensity = 6 + (176 + grain + dust[i] - maria) * light ** 0.66;
    // Even-valued input keeps the half-gain output exact in the displayed grayscale raster.
    pixels[i] = 2 * Math.round(Math.min(254, intensity) / 2);
  }
}

// Pin the readout to an actual illuminated sample on the featured crater.
let nearest = Infinity, probe = -1;
for (let i = 0; i < pixels.length; i++) {
  if (pixels[i] !== 192) continue;
  const x = ((i % size) + 0.5 - size / 2) / radius;
  const y = (Math.floor(i / size) + 0.5 - size / 2) / radius;
  const distance = Math.hypot(x - feature.x - feature.r, y - feature.y);
  if (distance < nearest) {
    nearest = distance;
    probe = i;
  }
}
export const sample = {index: probe, col: probe % size, row: Math.floor(probe / size)};
export const input = pixels;
