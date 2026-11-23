import { sentence } from '../construction.mjs';
import { constructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionFoot,
  drawConstructionHead,
  drawConstructionText,
} from '../defaults.mjs';
export function drawKvByteModel(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = constructionModel('kv-byte-model', state),
    progress = (beat, n) => sentence(state, 'kv-byte-model', beat, n),
    done = (beat, n) => progress(beat, n) === 1;
  {
    drawConstructionHead(ctx, api, 'Same byte model, distinct live token slots');
    const factors = [
      ['K + V', 2],
      ['layers', 80],
      ['KV heads', 8],
      ['width', 128],
      ['bytes', 2],
    ];
    factors.forEach((v, i) => {
      drawConstructionBox(ctx, api, v[0], 160 + i * 340, 370, 290, 80, themeColors.blue, 29);
      drawConstructionText(ctx, api, v[1], 305 + i * 340, 560, 44, themeColors.cyan, 'center');
    });
    if (done(0, 3))
      drawConstructionText(
        ctx,
        api,
        '2 × 80 × 8 × 128 × 2 = 327,680 bytes/token',
        960,
        690,
        39,
        themeColors.green,
        'center',
      );
    if (currentBeat) {
      let lines = [];
      if (done(1, 0)) lines.push('327,680 / 1,024 = 320 KiB per token');
      if (done(1, 2)) lines.push('16,384 × 327,680 / 1,024³ = 5 GiB');
      if (done(1, 4)) lines.push('12,288 + 8 × 4,096 = 45,056 slots → 13.75 GiB');
      lines.forEach((v, i) =>
        drawConstructionText(ctx, api, v, 960, 785 + i * 80, 34, themeColors.yellow, 'center'),
      );
    } else drawConstructionFoot(ctx, api, 'Use KV heads; query-head count can be larger.');
  }
}
export default {
  id: 'kv-byte-model',
  draw: drawKvByteModel,
  cues: [
    'ra-kv-byte-model-0-0',
    'ra-kv-byte-model-0-1',
    'ra-kv-byte-model-0-2',
    'ra-kv-byte-model-0-3',
    'ra-kv-byte-model-1-0',
    'ra-kv-byte-model-1-1',
    'ra-kv-byte-model-1-2',
    'ra-kv-byte-model-1-3',
    'ra-kv-byte-model-1-4',
    'ra-kv-byte-model-1-5',
  ],
};
