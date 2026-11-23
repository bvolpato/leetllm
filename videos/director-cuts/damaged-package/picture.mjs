import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const work = process.env.DIRECTOR_WORK;
const packageRoot = process.env.DIRECTOR_MODULES ?? process.env.COURSE_VIDEOS;
const req = createRequire(join(packageRoot, 'node_modules-entry.cjs'));
const { createCanvas, loadImage, GlobalFonts } = req('@napi-rs/canvas');
const { renderRgbaVideo } = await import(pathToFileURL(req.resolve('vizmatic')).href);
const fontDir = join(dirname(dirname(req.resolve('vizmatic'))), 'assets/fonts');
for (const [file, family] of [
  ['SourceSerif4-24pt-Regular.ttf', 'Package Serif'],
  ['Inter-Regular.ttf', 'Package Sans'],
  ['JetBrainsMono-Regular.ttf', 'Package Mono'],
]) {
  if (!GlobalFonts.registerFromPath(join(fontDir, file), family)) throw Error(file);
}
const parts = JSON.parse(await readFile(join(here, 'edit.json')));
const picture = await loadImage(join(work, 'source-frame.png'));
const frame = createCanvas(1920, 1080);
const ctx = frame.getContext('2d');
const ink = '#f4eee0',
  muted = '#a5afa9',
  cyan = '#70d7e8',
  amber = '#f1c873',
  pink = '#f1a3b8';
const canvasBg = '#0a0f13';
const smooth = (t) => {
  const a = Math.min(1, Math.max(0, t));
  return a * a * (3 - 2 * a);
};
function text(copy, x, y, size, family = 'Package Sans', color = ink) {
  ctx.fillStyle = color;
  ctx.font = size + 'px "' + family + '"';
  ctx.fillText(copy, x, y);
}
function line(x1, y1, x2, y2, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function specialist(t) {
  const zoom = 1 + 0.18 * smooth(t / 3.6);
  const x = 120,
    y = 228,
    w = 1180,
    h = 604;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(
    picture,
    998,
    243,
    858,
    440,
    x - (zoom - 1) * w * 0.25,
    y - (zoom - 1) * h * 0.34,
    w * zoom,
    h * zoom,
  );
  ctx.restore();
  text('The mailer', 120, 147, 76, 'Package Serif');
  text('Specialist inspection', 1340, 500, 45, 'Package Serif', amber);
  text('Visible split', 1340, 571, 33, 'Package Sans', muted);
}
function carton(t) {
  const changed = smooth((t - 343.75) / 1.59),
    value = 0.12 + 0.18 * changed;
  const x = 120,
    y = 229,
    w = 1070,
    h = 556;
  ctx.drawImage(picture, 62, 243, 859, 440, x, y, w, h);
  text('The dark carton', 120, 147, 76, 'Package Serif');
  const yMark = 550,
    lo = 1275,
    width = 445,
    tt = lo + (0.2 / 0.4) * width,
    at = lo + (value / 0.4) * width;
  text('Reported brightness', lo, 310, 42);
  text(value.toFixed(2), lo, 446, 108, 'Package Mono', cyan);
  line(lo, yMark, lo + width, yMark, 3, '#52616a');
  line(tt, yMark - 22, tt, yMark + 22, 3, amber);
  line(lo, yMark, at, yMark, 9, cyan);
  ctx.fillStyle = cyan;
  ctx.beginPath();
  ctx.arc(at, yMark, 10, 0, Math.PI * 2);
  ctx.fill();
  text('Minimum 0.20', tt - 92, yMark + 78, 33, 'Package Sans', amber);
  if (t >= 337.3) {
    ctx.globalAlpha = smooth((t - 337.3) / 0.38);
    text('Human review', 120, 856, 31, 'Package Sans', muted);
    text('Unusable image', 120, 921, 55, 'Package Serif', pink);
    ctx.globalAlpha = 1;
  }
  if (t < 342 || t >= 354.17) {
    const passed = t >= 354.17;
    ctx.globalAlpha = passed ? smooth((t - 354.17) / 0.4) : 1 - smooth((t - 341.4) / 0.6);
    text('Router', 1275, 763, 31, 'Package Sans', muted);
    text(
      passed ? 'Priority review' : 'Request a retake',
      1275,
      830,
      54,
      'Package Serif',
      passed ? amber : ink,
    );
    ctx.globalAlpha = 1;
  }
}
let total = 0;
const sequence = parts.slice(1).map((chunk) => {
  const outputStart = total;
  total += chunk.end - chunk.start;
  return { ...chunk, outputStart };
});
let count = 0;
await renderRgbaVideo(
  (f) => {
    const i = Math.round((f.time * 30) / 1000);
    if (i !== count++) throw Error('frame timing');
    const part = sequence.findLast((s) => s.outputStart <= i);
    const local = (i - part.outputStart) / 30,
      source = part.start / 30 + local;
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, 1920, 1080);
    if (part.part === 'specialist') specialist(local);
    else carton(source);
    return frame.data();
  },
  {
    duration: (total * 1000) / 30,
    fps: 30,
    width: 1920,
    height: 1080,
    threads: 2,
    outputPath: join(work, 'redrawn-body.mp4'),
  },
);
if (count !== total) throw Error('incorrect frame count');
