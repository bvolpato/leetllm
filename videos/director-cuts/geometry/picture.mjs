import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';

const WIDTH = 1920,
  HEIGHT = 1080,
  FPS = 30;
const BLUE = '#89cfe2',
  INK = '#e8e6db',
  MUTED = '#8c9b99',
  RULE = '#173840';
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
const between = (t, a, b) => ease((t - a) / (b - a));
const mix = (a, b, u) => a + (b - a) * u;

export async function renderPicture({ script, timing, work, modules, stills = false }) {
  const require = createRequire(join(modules, '__director-resolver.cjs'));
  const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
  const { renderRgbaVideo } = await import(pathToFileURL(require.resolve('vizmatic')));
  const { projectToLine } = await import(pathToFileURL(require.resolve('vizmatic/stage')));
  const fontDir = join(dirname(dirname(require.resolve('vizmatic'))), 'assets/fonts');
  for (const [filename, family] of [
    ['SourceSerif4-24pt-Regular.ttf', 'Director Serif'],
    ['Inter-Regular.ttf', 'Director Sans'],
    ['JetBrainsMono-Regular.ttf', 'Director Mono'],
  ]) {
    assert(GlobalFonts.registerFromPath(join(fontDir, filename), family), filename);
  }
  const canvas = createCanvas(WIDTH, HEIGHT),
    ctx = canvas.getContext('2d');
  const beats = Object.fromEntries(timing.schedule.map((beat) => [beat.id, beat]));
  const at = (id, term) => {
    const b = beats[id];
    if (!term) return b.start;
    const word = b.words.find((w) => w.text.toLowerCase().replace(/[^a-z]/g, '') === term);
    assert(word, id + ' / ' + term);
    return b.start + word.start;
  };
  const vectors = script.guides.map((guide) => guide.vector);
  const norms = vectors.map((v) => v.map((n) => n / Math.hypot(...v)));
  const angleOf = (v) => Math.atan2(v[1], v[0]);
  const crossing = (angleOf(norms[0]) + angleOf(norms[1])) / 2;
  assert.deepEqual(
    vectors.map((v) => projectToLine(v, [0, 0], [1, 0]).signedDistance),
    [1, 4],
  );
  assert.deepEqual(
    norms.map((v) => v[0].toFixed(3)),
    ['0.981', '0.894'],
  );
  assert.deepEqual(
    norms.map((v) => v[1].toFixed(3)),
    ['0.196', '0.447'],
  );
  const paper = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  paper.addColorStop(0, '#152326');
  paper.addColorStop(0.67, '#10191c');
  paper.addColorStop(1, '#0a1114');

  function stroke(a, b, ink, width = 2, dash = []) {
    ctx.save();
    ctx.strokeStyle = ink;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();
    ctx.restore();
  }
  function dot(x, y, r, ink) {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
  }
  function text(str, x, y, size, ink = INK, face = 'Director Sans', align = 'left') {
    ctx.fillStyle = ink;
    ctx.textAlign = align;
    ctx.font = `${size}px "${face}"`;
    ctx.fillText(str, x, y);
  }
  function ghost(opacity, fn) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha *= clamp(opacity);
    fn();
    ctx.restore();
  }
  function arrow(a, b, ink, scale = 1) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      len = Math.hypot(dx, dy);
    if (len < 1) return;
    const x = dx / len,
      y = dy / len,
      h = 19 * scale;
    stroke(a, [b[0] - x * h * 0.7, b[1] - y * h * 0.7], ink, 6 * scale);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(...b);
    ctx.lineTo(b[0] - x * h - y * h * 0.4, b[1] - y * h + x * h * 0.4);
    ctx.lineTo(b[0] - x * h + y * h * 0.4, b[1] - y * h - x * h * 0.4);
    ctx.closePath();
    ctx.fill();
  }
  function draw(t) {
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const norm = between(t, at('normalize', 'slide'), at('normalize', 'long') + 0.32);
    const camera = between(t, at('normalize', 'long') + 0.38, at('macro') + 0.7);
    const circle = between(t, at('question', 'keep'), at('normalize') - 0.25);
    const close =
      between(t, at('macro'), at('macro', 'rotation') - 0.14) *
      (1 - between(t, at('predict'), at('predict') + 1.53));
    const turnStart = at('turn'),
      trade = at('turn', 'trade'),
      turnEnd = beats.turn.start + beats.turn.duration + 0.15;
    const angle =
      t <= trade
        ? mix(0, crossing, between(t, turnStart, trade))
        : mix(crossing, Math.PI / 2, between(t, trade, turnEnd));
    const unit = [Math.cos(angle), Math.sin(angle)],
      side = [Math.sin(angle), Math.cos(angle)];
    const scale0 = mix(283, 565, camera),
      scale = mix(scale0, 6100, close);
    const ox = mix(mix(282, 470, camera), 960 - 0.94 * 6100, close),
      oy = mix(mix(792, 812, camera), 652, close);
    const pt = (v) => [ox + scale * v[0], oy - scale * v[1]];
    const current = vectors.map((v, i) => v.map((n, j) => mix(n, norms[i][j], norm)));
    const readings = current.map((v) => projectToLine(v, [0, 0], unit));
    const O = pt([0, 0]);
    const rulerOp = between(t, 0, 0.7);
    const dropped = between(t, at('drop'), at('drop') + 1.35);
    const rulerLength = mix(4.45, 1.27, camera);
    const tickFace = 58 + close * 50;

    // Fixed-angle rays and the common one-unit arc keep the original positions legible.
    ghost((1 - close) * norm * 0.34, () =>
      current.forEach((_, i) => {
        const r = norms[i];
        stroke(O, pt(r.map((x) => x * 1.42)), script.guides[i].color, 2, [3, 10]);
      }),
    );
    ghost(circle * 0.82, () => {
      ctx.beginPath();
      ctx.arc(ox, oy, scale, -1.72, 0.12);
      ctx.strokeStyle = '#6c9494';
      ctx.lineWidth = 2.4;
      ctx.stroke();
    });

    // Build the instrument along the query direction. All its tick positions use data units.
    ghost(rulerOp, () => {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(-angle);
      const x0 = -0.13 * scale,
        x1 = rulerLength * scale;
      const face = ctx.createLinearGradient(0, 0, 0, tickFace);
      face.addColorStop(0, '#73b9c9');
      face.addColorStop(0.075, '#447d8b');
      face.addColorStop(0.09, '#385a63');
      face.addColorStop(0.6, '#304951');
      face.addColorStop(1, RULE);
      ctx.fillStyle = face;
      ctx.beginPath();
      ctx.roundRect(x0, 0, x1 - x0, tickFace, 7);
      ctx.fill();
      stroke([x0 + 3, 2], [x1 - 3, 2], BLUE, 2.5);
      const step = close > 0.35 ? 0.01 : 0.1;
      const major = step === 0.01 ? 5 : 10;
      for (let i = 0; i * step <= rulerLength + 0.0001; i++) {
        const x = i * step * scale,
          important = i % major === 0;
        stroke(
          [x, 3],
          [x, important ? tickFace * 0.55 : tickFace * 0.24],
          important ? '#bfd4d0' : '#8aa49e',
          important ? 2 : 1.4,
        );
        if (important && ((step === 0.01 && close > 0.8) || (step > 0.01 && close < 0.2))) {
          const value = step === 0.01 ? (i * step).toFixed(2) : String(i * step);
          ctx.save();
          ctx.translate(x, tickFace * 0.84);
          ctx.rotate(angle);
          text(value, 0, 0, close > 0.8 ? 25 : 21, '#dce2d5', 'Director Mono', 'center');
          ctx.restore();
        }
      }
      ctx.restore();
    });
    const ordinary = 1 - close;
    current.forEach((v, i) => {
      const guide = script.guides[i],
        tip = pt(v),
        foot = pt(readings[i].foot);
      const reach = dropped * between(t, i ? at('drop') + 0.35 : at('drop'), at('drop') + 1.65);
      ghost(reach, () => {
        const end = tip.map((coord, j) => mix(coord, foot[j], reach));
        stroke(tip, end, guide.color, 2.8, [7, 9]);
        if (reach > 0.97) {
          const sz = close > 0.5 ? 11 : 8;
          dot(...foot, sz + 3, '#162124');
          dot(...foot, sz, guide.color);
          if (close > 0.7) {
            const y = foot[1] - 80;
            stroke([foot[0], foot[1] - 14], [foot[0], y + 13], guide.color, 2);
            const labelX = foot[0] + (i ? -26 : 26),
              align = i ? 'right' : 'left';
            text(guide.name, labelX, y - 59, 49, guide.color, 'Director Serif', align);
            text(readings[i].signedDistance.toFixed(3), labelX, y, 51, INK, 'Director Mono', align);
          }
        }
      });
      arrow(O, tip, guide.color);
      ghost(ordinary, () => {
        const nameX = tip[0] + 32,
          nameY = tip[1] - (i ? 16 : 20);
        text(guide.name, nameX, nameY, 51, guide.color, 'Director Serif');
      });
    });
    dot(...O, 13, '#66868b');
    dot(...O, 9, '#d6e4e3');
    dot(...O, 4, '#24424a');
    ghost(ordinary, () => {
      const queryPos = pt(unit.map((v) => v * rulerLength));
      const nx = Math.min(WIDTH - 145, Math.max(70, queryPos[0] + side[0] * 32 + unit[0] * 22)),
        ny = queryPos[1] + side[1] * 37 - unit[1] * 9 - 3;
      text('Query', nx, ny, 34, BLUE, 'Director Sans');
      if (norm < 0.25) {
        for (let i = 0; i < 2; i++) {
          const t0 = i ? at('drop', 'four') : at('drop', 'one');
          const opacity =
            between(t, t0, t0 + 0.28) * (1 - between(t, at('normalize') - 0.5, at('normalize')));
          ghost(opacity, () => {
            const f = pt(readings[i].foot);
            text(
              String(i ? 4 : 1),
              f[0],
              f[1] + 117,
              51,
              script.guides[i].color,
              'Director Mono',
              'center',
            );
          });
        }
      }
      if (angle > 1.4) {
        const show = between(t, turnEnd - 0.16, turnEnd + 0.5);
        ghost(show, () =>
          readings.forEach((reading, i) => {
            const f = pt(reading.foot);
            text(
              reading.signedDistance.toFixed(3),
              f[0] - 27,
              f[1] + 14,
              39,
              script.guides[i].color,
              'Director Mono',
              'right',
            );
          }),
        );
      }
    });
    return canvas.data();
  }

  if (stills) {
    for (const key of ['ruler', 'drop', 'raw', 'normalize', 'macro', 'predict', 'turn', 'settle']) {
      const b = beats[key];
      draw(b.start + b.duration * 0.82);
      await writeFile(join(work, key + '.png'), canvas.toBuffer('image/png'));
    }
    return;
  }
  const movie = await renderRgbaVideo((frame) => draw(frame.index / FPS), {
    duration: (timing.frames * 1000) / FPS,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
    preset: 'veryfast',
    threads: 2,
    outputPath: join(work, 'body.mp4'),
  });
  assert.equal(movie.frameCount, timing.frames);
}
