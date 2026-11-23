// The approved short's two-over, two-under cloth. Each source keeps its dye.
import { createCanvas } from '@napi-rs/canvas';
import { line, lerp as mix } from './atelier.mjs';

const dyes = {
  checklist: { rgb: [55, 87, 137] },
  FAQ: { rgb: [214, 159, 49] },
  key: { rgb: [187, 59, 64] },
};
const art = new Map();
const linen = [242, 227, 195];
function cached(key, width, height, paint) {
  if (!art.has(key)) {
    const canvas = createCanvas(width, height);
    paint(canvas.getContext('2d'));
    art.set(key, canvas);
  }
  return art.get(key);
}
const clothW = 802,
  clothH = 520,
  margin = 26;

function wovenCloth(refs) {
  const key = refs.map((ref) => ref.id).join('.');
  return cached('cloth.' + key, clothW + 2 * margin, clothH + 2 * margin, (c) => {
    const colors = refs.map((ref) => dyes[ref.id].rgb);
    const sett =
      colors.length === 3
        ? [
            [0, 40],
            [1, 7],
            [0, 10],
            [-1, 22],
            [2, 34],
            [-1, 5],
            [2, 9],
            [-1, 22],
            [0, 10],
            [1, 7],
            [0, 40],
          ]
        : [
            [0, 35],
            [-1, 12],
            [1, 8],
            [-1, 25],
            [1, 20],
            [-1, 25],
            [1, 8],
            [-1, 12],
            [0, 35],
          ];
    const loop = sett.flatMap(([dye, width]) => Array(width).fill(colors[dye] ?? linen));
    const data = c.createImageData(clothW, clothH);
    for (let y = 0; y < clothH; y++) {
      const weft = loop[(y + 62) % loop.length];
      const pick = Math.floor(y / 3);
      for (let x = 0; x < clothW; x++) {
        const i = 4 * (clothW * y + x);
        const warp = loop[(x + 13 + Math.round(1.5 * Math.sin(y / 60))) % loop.length];
        const onTop = (Math.floor(x / 3) + pick) % 4 < 2;
        const cross = onTop ? x % 3 : y % 3;
        const light = [0.9, 1.055, 1][cross] + 0.02 * Math.sin(x / 32 + y / 85);
        const warpShare = onTop ? 0.9 : 0.1;
        for (let channel = 0; channel < 3; channel++) {
          data.data[i + channel] = mix(weft[channel], warp[channel], warpShare) * light;
        }
        data.data[i + 3] = 255;
      }
    }
    c.putImageData(data, margin, margin);
    for (let x = 1; x < clothW; x += 3) {
      const rgb = loop[(x + 13) % loop.length];
      const color = 'rgb(' + rgb.join(',') + ')';
      const len = 9 + 7 * Math.sin(x * 0.61) + 3 * Math.cos(x * 0.089);
      line(c, x + margin, margin, x + margin - 2, margin - len * 0.6, color, 2);
      line(
        c,
        x + margin,
        clothH + margin - 1,
        x + margin + 2 * Math.sin(x),
        clothH + margin + len,
        color,
        2,
      );
    }
    for (let y = 0; y < clothH; y += 3) {
      const color = 'rgb(' + loop[(y + 62) % loop.length].join(',') + ')';
      const len = 4 + 3 * Math.cos(y);
      line(c, margin - len, margin + y, margin + 1, margin + y, color, 2);
      line(c, clothW + margin - 1, margin + y, clothW + margin + len, margin + y + 1, color, 2);
    }
  });
}

export function cloth(c, refs, x, y, w, h) {
  c.drawImage(wovenCloth(refs), x - 12, y - 8, w + 24, h + 16);
}
