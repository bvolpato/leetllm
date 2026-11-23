// Original raster specimens for the drill's sample IDs. Each image stays fixed across reads.
import { createCanvas, Path2D } from '@napi-rs/canvas';

const silhouettes = {
  pullover:
    'M32 15 L42 11 Q50 18 58 11 L68 15 80 23 91 60 78 66 65 40 68 84 Q51 90 32 84 L35 40 22 66 9 60 20 23 Z',
  shirt:
    'M32 16 L41 13 Q49 20 59 13 L68 16 89 32 78 49 66 43 69 83 Q52 86 31 83 L33 43 22 49 11 32 Z',
  jeans: 'M28 12 Q50 16 72 12 L76 86 55 88 49 45 43 88 22 85 Z',
  skirt: 'M34 19 Q48 21 65 18 L81 77 Q60 85 48 80 31 84 17 77 Z',
  tote: 'M18 37 L80 36 86 80 Q62 88 16 82 Z',
  shoe: 'M15 25 L33 23 38 31 43 18 51 21 53 43 Q57 53 69 58 L82 60 Q94 62 94 72 Q82 81 46 79 L9 75 10 61 14 52 Z',
  coat: 'M32 15 L43 11 50 16 57 11 69 16 78 23 88 62 76 67 66 42 72 84 Q51 92 27 84 L34 42 23 67 11 63 21 25 Z',
  hat: 'M20 53 Q19 17 45 15 Q69 10 77 40 L81 54 Q98 58 92 66 Q56 79 8 65 Q4 59 20 53 Z',
};

const designs = [
  [42, 'pullover', '#983c30'],
  [17, 'jeans', '#496e80'],
  [63, 'tote', '#ba8640'],
  [8, 'skirt', '#536b54'],
  [91, 'hat', '#b89065'],
  [34, 'shirt', '#748497'],
  [76, 'coat', '#5e7060'],
  [12, 'shirt', '#bd8851'],
  [85, 'jeans', '#424b62'],
  [24, 'tote', '#995c60'],
  [57, 'skirt', '#465b76'],
  [19, 'pullover', '#62765c'],
  [55, 'shoe', '#334766'],
  [28, 'skirt', '#a97649'],
  [70, 'coat', '#797d92'],
  [16, 'hat', '#957764'],
  [82, 'shirt', '#677f70'],
  [39, 'tote', '#5e7896'],
  [61, 'jeans', '#716376'],
  [20, 'shoe', '#925b42'],
  [45, 'tote', '#54807a'],
  [93, 'pullover', '#7b6483'],
  [11, 'skirt', '#a49257'],
  [52, 'coat', '#946556'],
];
const catalog = new Map(designs.map(([id, shape, dye]) => [id, { shape, dye }]));
const cache = new Map();
const light = '#f6e5c8';
const dark = '#293545';

function paint(ctx, path, fill) {
  ctx.fillStyle = fill;
  ctx.fill(new Path2D(path));
}

function sew(ctx, path, ink, width) {
  ctx.strokeStyle = ink;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke(new Path2D(path));
}

const details = {
  pullover(ctx) {
    for (const y of [28, 40, 52, 64, 76]) {
      paint(
        ctx,
        `M0 ${y} Q34 ${y - 5} 50 ${y - 1} T100 ${y - 3} L100 ${y + 3} Q72 ${y + 7} 52 ${y + 5} T0 ${y + 7}Z`,
        light,
      );
    }
    sew(ctx, 'M39 11 Q50 29 61 11 M30 83 Q48 89 69 83 M8 57 L23 64 M78 63 L91 57', dark, 4);
    sew(ctx, 'M33 19 Q30 28 35 39 M66 19 Q70 28 65 39', '#603c39', 1.2);
  },
  shirt(ctx) {
    sew(ctx, 'M39 13 Q49 32 61 13 M12 31 L23 46 M90 32 L79 46 M32 80 Q53 84 68 80', light, 2.5);
    paint(ctx, 'M51 37 L62 36 62 49 57 51 52 49 Z', '#ffffff60');
  },
  jeans(ctx) {
    sew(
      ctx,
      'M25 20 Q51 24 74 20 M30 22 Q33 34 26 36 M68 22 Q67 31 74 34 M49 22 Q56 39 49 42 M48 42 L38 88 M50 42 L61 88 M21 81 L44 84 M55 84 L75 81',
      '#e5cda5',
      1.7,
    );
    paint(ctx, 'M28 12 L73 11 72 18 Q50 22 27 17Z', '#354250');
    sew(ctx, 'M37 12 L37 20 M62 12 L63 20', light, 2);
  },
  skirt(ctx) {
    sew(
      ctx,
      'M31 27 Q48 30 68 26 M41 31 L31 76 M50 32 L48 78 M58 30 L66 78 M15 74 Q36 81 46 77 Q61 82 83 74',
      '#302c3980',
      3,
    );
    sew(ctx, 'M35 30 L22 73 M53 31 L56 78', '#ffedc177', 2);
  },
  tote(ctx) {
    sew(ctx, 'M22 43 L20 78 Q49 84 81 78 L77 40 M32 40 L32 48 M64 39 L65 48', light, 2);
    paint(ctx, 'M35 54 L64 53 63 70 Q47 73 36 69 Z', '#ffffff38');
  },
  shoe(ctx) {
    paint(ctx, 'M13 25 L35 21 39 32 35 37 13 33Z', '#152538');
    paint(ctx, 'M12 53 Q26 47 35 50 L55 68 45 72 18 64Z', '#7c94a7');
    paint(ctx, 'M64 57 Q71 59 83 59 Q94 62 96 69 L83 72 58 69Z', light);
    paint(ctx, 'M8 65 Q41 72 63 70 Q85 71 94 65 L96 75 Q86 84 8 77Z', '#eddeb8');
    sew(ctx, 'M8 73 Q68 82 95 71', '#9b4639', 2);
    sew(ctx, 'M41 33 L50 31 M43 39 L53 37 M45 45 L56 43 M48 51 L60 49 M53 56 L65 55', light, 2.9);
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(26, 44, 7, 0, Math.PI * 2);
    ctx.fill();
    paint(ctx, 'M26 39 L28 42 32 43 29 46 30 50 26 48 22 50 23 46 20 43 24 42Z', '#a84c39');
  },
  coat(ctx) {
    paint(ctx, 'M43 11 L48 17 48 48 34 26 40 24 36 21Z', '#d4c2a3');
    paint(ctx, 'M57 11 L64 20 59 24 63 26 48 48 51 20Z', '#b8a892');
    sew(ctx, 'M48 48 L46 87 M31 65 L42 60 M56 60 L67 65', dark, 2);
    for (const y of [49, 60, 71]) {
      ctx.fillStyle = light;
      ctx.fillRect(50, y, 2.7, 2.7);
    }
  },
  hat(ctx) {
    paint(ctx, 'M16 46 Q48 55 80 45 L82 54 Q50 65 18 55Z', dark);
    sew(ctx, 'M9 63 Q50 75 91 61 M28 29 Q37 19 51 21', '#edddbd', 2);
  },
};

export function specimen(id) {
  if (cache.has(id)) return cache.get(id);
  const { shape, dye } = catalog.get(id);
  const size = 72;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.scale(size / 100, size / 100);
  const ground = ctx.createLinearGradient(0, 0, 94, 100);
  ground.addColorStop(0, '#f3eadd');
  ground.addColorStop(1, '#d8c9b7');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, 100, 100);

  const outline = new Path2D(silhouettes[shape]);
  ctx.save();
  ctx.translate(1.5, 2.5);
  ctx.fillStyle = '#74685a58';
  ctx.fill(outline);
  ctx.restore();
  if (shape === 'tote') {
    sew(ctx, 'M31 42 Q28 14 44 14 Q59 14 58 39 M39 40 Q35 13 53 14 Q69 14 66 39', dark, 3.5);
  }
  ctx.fillStyle = dye;
  ctx.fill(outline);
  ctx.save();
  ctx.clip(outline);
  details[shape](ctx);
  const fold = ctx.createLinearGradient(17, 25, 76, 41);
  fold.addColorStop(0, '#24283b35');
  fold.addColorStop(0.22, '#fff1d927');
  fold.addColorStop(0.36, '#20203b20');
  fold.addColorStop(0.64, '#fff6e416');
  fold.addColorStop(1, '#161a3030');
  ctx.fillStyle = fold;
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();

  // A fixed pixel texture survives the close-up and gives both reads identical bytes.
  const bitmap = ctx.getImageData(0, 0, size, size);
  let seed = id;
  for (let i = 0; i < bitmap.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const pixel = i / 4;
    const grain = 6 * (seed / 4294967296 - 0.5) + ((pixel + Math.floor(pixel / size)) % 2 ? 2 : -2);
    for (let j = 0; j < 3; j++) bitmap.data[i + j] += grain;
  }
  ctx.putImageData(bitmap, 0, 0);
  cache.set(id, canvas);
  return canvas;
}
