import { Path2D } from '@napi-rs/canvas';
import { readFileSync } from 'node:fs';

export const BRAND_INTRO_SECONDS = 4;
export function lessonIntro(_lesson, fps) {
  return {
    id: 'leetllm-intro',
    start: 0,
    duration: BRAND_INTRO_SECONDS,
    frames: Math.round(BRAND_INTRO_SECONDS * fps),
    fps,
  };
}

const svg = readFileSync(new URL('../assets/leetllm-mark.svg', import.meta.url), 'utf8');
const paths = [...svg.matchAll(/<path d="([^"]+)"/g)].map((match) => new Path2D(match[1]));
const terminals = [...svg.matchAll(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)].map(
  ([, x, y, r]) => ({ x: Number(x), y: Number(y), r: Number(r) }),
);
const purple = svg.match(/stroke="([^"]+)"/)[1];
const clamp = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};

export function drawBrandMark(ctx, x, y, size, progress = 1, color = purple) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.65;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [index, path] of paths.entries()) {
    const p = clamp(progress * 1.35 - index * 0.035);
    if (p > 0) ctx.stroke(p === 1 ? path : new Path2D(path).trim(0, p));
  }
  if (progress > 0.72) {
    ctx.globalAlpha *= smooth((progress - 0.72) / 0.28);
    for (const point of terminals) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawBrandLockup(ctx, { x, y, size = 32, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  drawBrandMark(ctx, x, y, size, 1, '#9295ff');
  ctx.fillStyle = '#a5a7ad';
  ctx.font = `500 ${size * 0.72}px "Lesson Sans"`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('LeetLLM', x + size + 13, y + size * 0.78);
  ctx.restore();
}

export function drawBrandIntro(ctx, time) {
  const { width, height } = ctx.canvas;
  ctx.save();
  ctx.scale(width / 1920, height / 1080);
  ctx.fillStyle = '#0b0c10';
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.fillStyle = '#0b0c10';
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.globalAlpha = smooth(time / 0.25) * (1 - smooth((time - 3.45) / 0.55));

  const reveal = smooth((time - 0.18) / 1.35);
  const word = smooth((time - 0.72) / 0.72);
  ctx.font = '600 112px "Lesson Sans"';
  const wordWidth = ctx.measureText('LeetLLM').width;
  const iconSize = 228,
    gap = 52;
  const left = (1920 - iconSize - gap - wordWidth) / 2;
  const top = 392;
  ctx.save();
  ctx.globalAlpha *= smooth(time / 0.6);
  ctx.fillStyle = '#15171d';
  ctx.strokeStyle = '#34363f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(left - 16, top - 16, 260, 260, 56);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawBrandMark(ctx, left, top, iconSize, reveal, '#9698ff');

  ctx.save();
  ctx.globalAlpha *= word;
  const wordX = left + iconSize + gap;
  ctx.fillStyle = '#f2efe6';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('LeetLLM', wordX, top + 148 + (1 - word) * 12);
  ctx.restore();

  // A single signal follows the circuit branch and settles at its terminal.
  const signal = clamp((time - 1.48) / 0.6);
  const signalAlpha = smooth((time - 1.45) / 0.15) * (1 - smooth((time - 2.35) / 0.35));
  ctx.save();
  ctx.globalAlpha *= signalAlpha;
  const signalX = left + ((12 + 8 * signal) * iconSize) / 24;
  const signalY = top + (8 * iconSize) / 24;
  const halo = ctx.createRadialGradient(signalX, signalY, 0, signalX, signalY, 25);
  halo.addColorStop(0, '#8fe6ff');
  halo.addColorStop(1, '#8fe6ff00');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(signalX, signalY, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e1fbff';
  ctx.beginPath();
  ctx.arc(signalX, signalY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
  return { labels: [], shapes: [], connectors: [], issues: [] };
}
