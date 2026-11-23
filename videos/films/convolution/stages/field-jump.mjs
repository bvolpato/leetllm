import { IMAGE } from '../fixtures.mjs';
import { cueClock } from '../footprint.mjs';
import { fieldTrace } from '../model.mjs';
import { text } from '../defaults.mjs';

const trace = fieldTrace();
const channels = [3, 16, 32, 32, 64];
const pitch = 78;
const pixelX = 114;

function bracket(ctx, api, start, width, y, color, markCenter = true) {
  const left = pixelX + start * pitch + 3;
  const right = left + width * pitch - 6;
  api.line(ctx, left, y, right, y, color, 5);
  for (let i = 0; i <= width; i++) {
    const x = api.lerp(left, right, i / width);
    const height = i === 0 || i === width ? 20 : 8;
    api.line(ctx, x, y - height, x, y, color, 3);
  }
  if (markCenter) api.circle(ctx, (left + right) / 2, y, 10, color);
}

export function drawFieldJump(ctx, scene, state, api) {
  const cue = cueClock(scene, state, api);
  const { C } = api;
  const pool = cue('field-pool');
  const pooledNeighbor = cue('field-pooled-neighbor');
  const last = cue('field-last');
  const parent = pooledNeighbor > 0 ? trace[2] : pool > 0 ? trace[1] : trace[0];
  const second = pooledNeighbor > 0 ? pooledNeighbor : pool > 0 ? pool : cue('field-neighbor');
  const third = pooledNeighbor > 0 ? last : pool > 0 ? 0 : cue('field-third');
  const union = pooledNeighbor > 0 ? cue('field-ten') : pool > 0 ? cue('field-six') : cue('field-five');
  const receiving = pooledNeighbor > 0 ? trace[3] : pool > 0 ? trace[2] : trace[1];

  api.focus.target('field-windows', () => {
    text(ctx, api, 'One row of the panel', pixelX, 300, 38);
    for (let i = 0; i < trace[3].field + trace[3].jump; i++) {
      const bright = IMAGE[0][Math.min(i, IMAGE[0].length - 1)];
      api.rect(ctx, pixelX + i * pitch + 3, 344, pitch - 6, pitch - 6,
        bright ? '#cbd2d4' : '#42515a', C.muted, 3);
    }
    bracket(ctx, api, 0, parent.field, 488, C.yellow);
    if (second > 0)
      bracket(ctx, api, parent.jump * api.ease(second), parent.field, 562, C.cyan);
    if (third > 0)
      bracket(ctx, api, parent.jump * (1 + api.ease(third)), parent.field, 636, C.pink);
    if (union === 1) {
      bracket(ctx, api, 0, receiving.field, 724, C.green, false);
      text(ctx, api, receiving.field + ' pixels across', pixelX + receiving.field * pitch / 2,
        794, 43, C.green, 'center');
    }
  });

  const rows = [cue('field-three'), cue('field-five'), cue('field-six'), cue('field-ten')];
  const channelCue = cue('field-channels');
  api.focus.target('field-table', () => {
    const columns = [1100, 1380, 1490, 1610, 1774];
    const labels = ['Layer', 'Field', 'Jump', 'Map side', 'Channels'];
    labels.forEach((label, i) => {
      if (i < 4 || channelCue > 0)
        text(ctx, api, label, columns[i], 300, 30, C.muted, i === 0 ? 'left' : 'center');
    });
    const input = { field: 1, jump: 1, size: trace[0].size + trace[0].kernel - 1 };
    [input, ...trace].forEach((row, i) => {
      if (i > 0 && rows[i - 1] < 1) return;
      const pooled = i === 3;
      const y = 400 + i * 89;
      const name = i === 0 ? 'Input' : row.kernel + ' × ' + row.kernel + (pooled ? ' pool' : ' conv');
      text(ctx, api, name, columns[0], y, 34);
      text(ctx, api, row.field, columns[1], y, 38, C.yellow, 'center');
      if (!pooled || cue('field-pooled-jump') === 1)
        text(ctx, api, row.jump, columns[2], y, 38, C.cyan, 'center');
      const comparingPool = channelCue > 0 && (pooled || i === 2);
      text(ctx, api, row.size, columns[3], y, 36, comparingPool ? C.green : C.ink, 'center');
      if (channelCue > 0)
        text(ctx, api, channels[i], columns[4], y, 36, comparingPool ? C.green : C.ink, 'center');
    });
  });
  if (cue('field-growth') > 0)
    api.focus.target('field-rule', () => {
      text(ctx, api, 'New field = old field + (kernel width − 1) × dilation × old jump',
        pixelX, 910, 37);
      if (cue('field-spacing') > 0)
        text(ctx, api, 'New jump = old jump × stride', pixelX, 995, 37, C.cyan);
    });
}

export default {
  id: 'field-jump',
  draw: drawFieldJump,
  cues: [
    'field-three', 'field-neighbor', 'field-third', 'field-five', 'field-pool', 'field-six',
    'field-pooled-neighbor', 'field-pooled-jump', 'field-last', 'field-ten',
    'field-growth', 'field-spacing', 'field-channels',
  ],
};
