import { reservation } from '../arithmetic.mjs';
import { sceneClock } from '../clock.mjs';
import { GiB, pool } from '../fixtures.mjs';

const prompt = reservation(4096, 0);
const full = reservation(4096, 1024);
const promptGiB = prompt.bytes / GiB;
const answerGiB = (full.bytes - prompt.bytes) / GiB;
const freeGiB = (pool - 31 * prompt.bytes) / GiB;

export function drawIntro(ctx, scene, state, api) {
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const { C, focus } = api;
  const clock = sceneClock(scene, state);
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const rect = (x, y, w, h, fill, stroke) => api.rect(ctx, x, y, w, h, fill, stroke, 0);

  const left = 180,
    scale = 1360,
    edge = left + scale;
  const freeStart = edge - freeGiB * scale;
  const poolY = 390,
    height = 160;
  const place = clock.progress('prompt');
  const retry = clock.progress('retry');
  const release = clock.after('release');
  const x = api.lerp(freeStart, left, retry);
  const y = api.lerp(680, poolY, place);
  const promptWidth = scale * promptGiB;
  const answerX = x + promptWidth;

  focus.target('pool-edge', () => {
    label('KV cache', left, 310, 55);
    label('Last 1 GiB', left + 290, 310, 36, C.muted);
    label(pool / GiB + ' GiB limit', edge, 310, 38, C.yellow, 'center');
    rect(left, poolY, scale, height, C.panel, C.muted);
    if (!release) {
      rect(left, poolY, freeStart - left, height, C.green);
      label('Another conversation', (left + freeStart) / 2, poolY + 73, 45, C.bg, 'center');
      label(promptGiB + ' GiB in use', (left + freeStart) / 2, poolY + 125, 35, C.bg, 'center');
    }
    if (place === 0)
      label(freeGiB + ' GiB free', freeStart + promptWidth / 2, poolY + 99, 51, C.ink, 'center');
    api.line(ctx, edge, poolY - 40, edge, poolY + height + 40, C.yellow, 6);
  });

  focus.target('patch-footprint', () => {
    rect(x, y, promptWidth, height, C.cyan);
    label('“Explain this patch”', x + promptWidth / 2, y + 71, 51, C.bg, 'center');
    label(
      prompt.prompt.toLocaleString('en-US') + ' tokens  ·  ' + promptGiB + ' GiB',
      x + promptWidth / 2,
      y + 128,
      35,
      C.bg,
      'center',
    );
  });

  focus.target('answer-block', () => {
    const progress = clock.progress('reserve');
    if (progress > 0) {
      const width = scale * answerGiB;
      rect(answerX, poolY, width * progress, height, C.yellow);
      if (clock.after('reserve'))
        label('Answer', answerX + width / 2, poolY + 72, 35, C.bg, 'center');
      if (clock.after('excess'))
        label(answerGiB + ' GiB', answerX + width / 2, poolY + 122, 31, C.bg, 'center');
    }
  });

  focus.target('patch-terms', () => {
    if (clock.progress('promise') > 0)
      label(
        'Answer allowance   ' + full.output.toLocaleString('en-US') + ' tokens',
        left,
        736,
        44,
        C.yellow,
      );
  });
  focus.target('patch-status', () => {
    if (clock.after('admit')) label('Ready to start', left, 900, 60, C.green);
    else if (release) label('One conversation finished', left, 900, 55, C.green);
    else if (clock.after('queue')) label('Waiting for space', left, 900, 60, C.pink);
  });
}
export default { id: 'intro', draw: drawIntro };
