import { cache } from '../model.mjs';
import { cueProgress } from '../worksheet.mjs';

const groups = 16;
const first = 385,
  pitch = 79,
  tile = 70;
const tokens = groups * 1024;
const capped = cache(tokens, 4, true),
  reserved = cache(tokens, 4, false);

export function drawRetention(ctx, scene, state, api) {
  const { C, focus } = api,
    p = cueProgress(scene, state, api);
  const text = (value, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);
  const windowX = first + (groups - 1) * pitch;
  const fill = p('reserve-earlier');
  const measured = p('read-totals') > 0;
  focus.target('mask', () => {
    text('One log   /   16,384 positions', 125, 265, 37);
    text('Each column holds 1,024 positions', 125, 321, 30, C.muted);
    text('Last query can read', windowX + tile, 302, 28, C.yellow, 'right');
    api.line(ctx, windowX, 334, windowX + tile, 334, C.yellow, 4);
    api.line(ctx, windowX, 334, windowX, 352, C.yellow, 4);
    api.line(ctx, windowX + tile, 334, windowX + tile, 352, C.yellow, 4);
    for (let i = 0; i < groups; i++) {
      const x = first + pitch * i;
      api.rect(ctx, x, 369, tile, 42, i === groups - 1 ? C.yellow : C.panel, C.muted, 3);
    }
    text('Sliding window', 125, 404, 31, C.yellow);
  });
  function bufferRow(label, y, stored) {
    text(label, 125, y + 59, 36);
    for (const [j, kind] of ['K', 'V'].entries()) {
      text(kind, first - 18, y + 33 + 46 * j, 29, C.muted, 'right');
      for (let i = 0; i < groups; i++) {
        const kept = stored(i);
        api.rect(
          ctx,
          first + i * pitch,
          y + j * 46,
          tile,
          39,
          kept ? C.cyan : C.panel,
          kept ? C.cyan : C.muted,
          3,
        );
      }
    }
  }
  focus.target('capped-pages', () =>
    bufferRow('Capped', 468, (i) => i === groups - 1 && p('keep-pair') > 0),
  );
  focus.target('full-pages', () => {
    if (state.beat >= 1) {
      bufferRow('Full buffer', 641, (i) => i === groups - 1 || i < Math.ceil(fill * (groups - 1)));
    }
  });
  focus.target('cache-totals', () => {
    if (state.beat === 0) {
      text('Capped storage keeps the last K and V tile for each sliding layer.', 125, 821, 36);
      text('Eight full-attention layers also keep the whole log.', 125, 912, 33, C.green);
    } else if (!measured) {
      text(
        p('count-extra') === 1
          ? '15 extra K tiles + 15 extra V tiles per sliding layer and log'
          : 'How many extra K tiles and V tiles does the lower layout reserve?',
        125,
        866,
        38,
        C.yellow,
      );
    } else {
      text('Across 4 logs', 125, 842, 32, C.muted);
      text('40 sliding layers', 550, 842, 32, C.muted);
      text('+ 8 full layers', 1000, 842, 32, C.muted);
      text('Raw cache', 1515, 842, 32, C.muted);
      for (const [i, row] of [capped, reserved].entries()) {
        const y = 908 + i * 64;
        text(i ? 'Full buffer' : 'Capped', 125, y, 35);
        text(row.sliding.toFixed(3) + ' GB', 550, y, 35, C.cyan);
        text(row.full.toFixed(3) + ' GB', 1000, y, 35, C.green);
        text(row.total.toFixed(3) + ' GB', 1515, y, 38, i ? C.pink : C.ink);
      }
    }
  });
}
export default {
  id: 'retention',
  draw: drawRetention,
  cues: [
    'last-query',
    'keep-pair',
    'full-attention',
    'ask-reserve',
    'reserve-earlier',
    'count-extra',
    'read-totals',
  ],
};
