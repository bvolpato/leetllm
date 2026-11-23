import {
  bar,
  drawText,
  equation,
  note,
  pill,
  rectangle,
  withPretrainingMainFrame,
} from '../defaults.mjs';
import { documentSample } from '../arithmetic.mjs';

function drawCappedPage(ctx, api, C, P, D, beg) {
  const tile = 100;
  const pageLength = 900;
  const cap = 300;
  const trimmed = Math.floor(P('trim') * ((pageLength - cap) / tile)) * tile;
  const sample = documentSample(0.9, [tile, pageLength - trimmed]);
  const left = 487;
  const pitch = 116;
  drawText(ctx, api, C, 'Each tile holds 100 tokens', 960, 275, 37, C.ink);
  for (const [row, name] of ['9 programs', '1 page'].entries()) {
    const y = 370 + row * 218;
    const color = row === 0 ? C.pink : C.blue;
    drawText(ctx, api, C, name, left - 44, y + 74, 42, color, 'right');
    const keptTiles = sample.tokens[row] / tile;
    for (let i = 0; i < pageLength / tile; i++) {
      const gap = row === 0 ? 13 : 3;
      rectangle(
        ctx,
        api,
        C,
        left + i * pitch,
        y,
        pitch - gap,
        116,
        i < keptTiles ? color : C.panel,
      );
    }
    drawText(ctx, api, C, sample.tokens[row] + ' tokens', 1570, y + 72, 36, color, 'left');
  }
  if (D('cap')) {
    const x = left + (cap / tile) * pitch;
    api.line(ctx, x, 563, x, 725, C.yellow, 5);
    drawText(ctx, api, C, 'Page cap: ' + cap, x, 773, 36, C.yellow);
  }
  if (D('delivered')) {
    const [code, prose] = sample.tokens;
    drawText(
      ctx,
      api,
      C,
      code + ' / ' + (code + prose) + ' = ' + Math.round(sample.shares[0] * 100) + '% code tokens',
      960,
      905,
      56,
      C.yellow,
    );
  } else if (!beg('cap')) {
    drawText(ctx, api, C, 'Half the tokens from each source', 960, 905, 43, C.ink);
  }
}

export function paintPretrainingMainExposureSchedule(
  ctx,
  scene,
  state,
  api,
  C,
  c,
  b,
  p,
  cue,
  P,
  D,
  beg,
) {
  if (b === 0) {
    drawText(ctx, api, C, 'Whole-document sampler: .8 code / .2 prose', 960, 290, 35, C.blue);
    bar(ctx, api, C, 300, 470, 1200, 80 * P('mass'), 260, C.pink, 'Code: .8×100');
    bar(ctx, api, C, 300, 650, 1200, 180 * P('mass'), 260, C.blue, 'Prose: .2×900');
    if (D('share'))
      equation(ctx, api, C, '\\mathrm{code\\ share}=80/(80+180)=30.8\\%', 960, 860, 44, C.yellow);
    note(ctx, api, C, 'Source probability is multiplied by retained document length');
  } else if (b === 1) {
    if (beg('example')) return drawCappedPage(ctx, api, C, P, D, beg);
    drawText(ctx, api, C, 'Target: half code tokens, half prose tokens', 960, 300, 40, C.ink);
    equation(ctx, api, C, 'w_i=q_i/L_i', 960, 445, 55, C.cyan);
    pill(ctx, api, C, 'Code weight: 0.5 / 100', 480, 620, 610, C.pink);
    pill(ctx, api, C, 'Prose weight: 0.5 / 900', 1400, 620, 710, C.blue);
    if (D('inverse'))
      drawText(ctx, api, C, 'Normalize → 90% code document draws', 960, 810, 40, C.yellow);
  } else {
    const colors = [C.blue, C.yellow, C.pink, C.cyan];
    const sources = ['General web', 'Math & reasoning', 'Code', 'Multilingual'];
    if (beg('mix'))
      [50, 25, 17, 8].forEach((n, i) => {
        const y = 380 + i * 68;
        drawText(ctx, api, C, sources[i], 610, y + 28, 31, colors[i], 'right');
        rectangle(ctx, api, C, 650, y, n * 15, 33, colors[i]);
        drawText(ctx, api, C, n + '%', 680 + n * 15, y + 28, 34, colors[i], 'left');
      });
    drawText(ctx, api, C, 'Reported Llama 3 token mix', 960, 312, 38, C.ink);
    const copies = Math.floor(P('repeat') * 7);
    for (let i = 0; i < copies; i++) {
      rectangle(ctx, api, C, 290 + i * 190, 735, 160, 85, C.panel, C.pink);
      drawText(ctx, api, C, '100B', 370 + i * 190, 790, 27, C.pink);
    }
    if (D('repeat'))
      drawText(
        ctx,
        api,
        C,
        '700B presentations / 100B inventory = 7 token-weighted passes',
        960,
        925,
        32,
        C.yellow,
      );
    if (D('repeat')) note(ctx, api, C, 'Individual programs can appear more or less often.');
  }
}
export function drawExposureScheduleStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainExposureSchedule);
}
export default {
  id: 'exposure-schedule',
  draw: drawExposureScheduleStage,
  cues: [
    'pt-exposure-schedule-mass',
    'pt-exposure-schedule-share',
    'pt-exposure-schedule-inverse',
    'pt-exposure-schedule-example',
    'pt-exposure-schedule-cap',
    'pt-exposure-schedule-trim',
    'pt-exposure-schedule-delivered',
    'pt-exposure-schedule-mix',
    'pt-exposure-schedule-repeat',
  ],
};
