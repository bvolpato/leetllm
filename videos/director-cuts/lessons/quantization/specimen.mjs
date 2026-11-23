// A two-level bitmap. All filter responses use the samples in this array.
import { createCanvas, Path2D } from '@napi-rs/canvas';

export const width = 144;
export const height = 88;
const designWidth = 192;
const designHeight = 116;

function wing(ctx) {
  function shape(path, ink) {
    ctx.fillStyle = ink;
    ctx.fill(new Path2D(path));
  }
  function vein(path, thickness = 1.4) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.stroke(new Path2D(path));
  }
  function oval(x, y, rx, ry, angle, ink) {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  const pale = 'white';
  const dark = 'black';
  // Hindwing, with a scalloped margin and a nested eyespot.
  shape('M94 44 C78 39 43 37 25 51 C25 66 30 82 40 88 Q44 92 49 91 Q53 99 60 96 Q67 105 74 99 Q80 101 84 92 C93 81 95 62 94 44Z', pale);
  vein('M28 62 C35 80 43 87 48 84 Q53 93 60 90 Q67 97 73 93 Q81 96 87 78', 2.1);
  vein('M91 50 Q82 69 72 91');
  vein('M88 54 Q74 63 49 88');
  oval(58, 72, 12, 9, -0.23, dark);
  oval(58, 72, 8.3, 5.6, -0.23, pale);
  oval(58, 72, 4.6, 3.3, -0.23, dark);

  // Forewing and the transverse bands that give the edge filter detail to find.
  shape('M95 42 C79 36 52 16 11 8 Q6 7 9 15 C13 27 12 38 17 46 Q17 52 22 53 Q23 60 29 60 Q31 66 37 64 Q43 71 50 66 Q58 72 66 65 C77 65 85 59 95 54Z', pale);
  vein('M12 16 C19 27 17 40 23 43 Q24 49 29 49 Q32 57 37 54 Q44 61 49 57 Q55 63 63 58 Q76 60 92 50', 2.5);
  vein('M93 45 Q73 38 22 15', 1.6);
  vein('M91 47 Q72 47 38 60');
  vein('M91 50 Q82 52 63 63');
  shape('M21 21 Q34 22 42 30 Q33 28 23 28Z', dark);
  oval(57, 42, 10.2, 7.8, 0.32, dark);
  oval(57, 42, 7.1, 5.1, 0.32, pale);
  oval(57, 42, 3.5, 2.2, 0.32, dark);
  for (const [x, y] of [[23, 37], [28, 43], [35, 48], [43, 51], [54, 54]]) {
    oval(x, y, 1.7, 2.6, -0.4, dark);
  }
  // Each antenna has a shaft and a row of fine branches.
  shape('M95 39 C94 29 88 20 80 12 Q89 17 96 34Z', pale);
  ctx.strokeStyle = pale;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const x = 82 + i * 2;
    const y = 14 + i * 2.6;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x - 4, y + 2.5);
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + 2, y - 4.5);
    ctx.stroke();
  }
}

function makeBitmap() {
  const canvas = createCanvas(designWidth * 3, designHeight * 3);
  const ctx = canvas.getContext('2d');
  ctx.scale(3, 3);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, designWidth, designHeight);
  wing(ctx);
  ctx.save();
  ctx.translate(designWidth, 0);
  ctx.scale(-1, 1);
  wing(ctx);
  ctx.restore();
  function ellipse(x, y, rx, ry, ink) {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ellipse(96, 65, 3.8, 22, 'white');
  for (let y = 60; y <= 80; y += 5) {
    ctx.fillStyle = 'black';
    ctx.fillRect(92.9, y, 6.2, 1.3);
  }
  ellipse(96, 47, 6, 11, 'black');
  ellipse(96, 46, 4.6, 10, 'white');
  ellipse(96, 36, 3.7, 4, 'white');
  const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  return Uint8Array.from({ length: width * height }, (_, i) => {
    const x = Math.floor(((i % width) + 0.5) * canvas.width / width);
    const y = Math.floor((Math.floor(i / width) + 0.5) * canvas.height / height);
    return Number(rgba[(y * canvas.width + x) * 4] >= 128);
  });
}

export const pixels = makeBitmap();

export function response(weights) {
  return Float64Array.from(pixels, (left, i) => {
    const right = i % width === width - 1 ? left : pixels[i + 1];
    return left * weights[0] + right * weights[1];
  });
}

// Find the outside rim of the left forewing eyespot, traversing from dark to light.
const eyeY = Math.floor(42 * height / designHeight);
const eyeX = Array.from({ length: 8 }, (_, k) => Math.floor(64 * width / designWidth) + k - 3)
  .filter(x => pixels[eyeY * width + x] === 0 && pixels[eyeY * width + x + 1] === 1)
  .at(-1);
export const sample = { x: eyeX, y: eyeY, index: eyeY * width + eyeX };
