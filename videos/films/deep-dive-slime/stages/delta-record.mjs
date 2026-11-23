import { sampleSlimeChapter, slimeSentenceProgress } from '../construction.mjs';
import {
  drawSlimeNote,
  drawSlimeRow,
  drawSlimeRule,
  drawSlimeText,
  drawSlimeTitle,
} from '../defaults.mjs';
export function drawDeltaRecord(ctx, scene, state, api) {
  return api.focus.target('sl-delta-record-mechanism', () =>
    paintDeltaRecord(ctx, scene, state, api),
  );
}
function paintDeltaRecord(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('delta-record', state),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  const teaching = (beat, sentence) => slimeSentenceProgress('delta-record', state, beat, sentence);
  {
    drawSlimeTitle(
      ctx,
      api,
      currentBeat === 2
        ? 'Overwrite and XOR have different retry behavior'
        : currentBeat === 0
          ? 'Retain the baseline and identify the changed byte'
          : 'Inspect the changed byte, bit by bit',
    );
    if (currentBeat === 0) {
      drawSlimeText(ctx, api, 'baseline', 170, 470, 32, themeColors.blue);
      drawSlimeText(ctx, api, 'gathered', 170, 670, 32, themeColors.cyan);
      drawSlimeRow(ctx, api, [1, 2, 3, 4], 420, {
        x: 510,
        width: 280,
      });
      drawSlimeRow(ctx, api, [1, 2, 8, 4], 620, {
        x: 510,
        width: 280,
        colors: [
          themeColors.muted,
          themeColors.muted,
          teaching(0, 1) > 0 ? themeColors.yellow : themeColors.muted,
          themeColors.muted,
        ],
      });
      drawSlimeRule(
        ctx,
        api,
        teaching(0, 2) >= 1
          ? 'Index retains base + destination + encoding + tensor checksums'
          : 'Compare each gathered tensor byte with its saved baseline',
        900,
        themeColors.cyan,
        32,
      );
      drawSlimeNote(ctx, api, 'Compressed payload and version index describe a transfer artifact');
      return;
    }
    const labels = ['base 3', 'target 8', 'XOR 11'],
      rows = ['00000011', '00001000', '00001011'];
    rows.forEach((v, r) => {
      drawSlimeText(
        ctx,
        api,
        labels[r],
        170,
        440 + r * 155,
        32,
        r === 2 ? themeColors.yellow : themeColors.blue,
      );
      drawSlimeRow(
        ctx,
        api,
        [...v].map((c, i) =>
          currentBeat === 2 || (r === 2 ? modelState.xorReady : i < modelState.bits) ? c : '·',
        ),
        390 + r * 155,
        {
          x: 510,
          width: 145,
          color: r === 2 ? themeColors.yellow : themeColors.blue,
          size: 36,
        },
      );
    });
    if (currentBeat === 2) {
      const current = modelState.overwrite >= 1 ? 8 : 3;
      drawSlimeRule(
        ctx,
        api,
        `overwrite destination byte: ${current} → 8 → 8`,
        920,
        themeColors.green,
        35,
      );
    } else
      drawSlimeRule(
        ctx,
        api,
        modelState.xorReady
          ? modelState.first >= 1
            ? '3 XOR 11 = 8 · 8 XOR 11 = 3'
            : '0011 XOR 1000 = 1011 = 11'
          : 'Compare the gathered tensor against its retained baseline',
        920,
        themeColors.yellow,
        34,
      );
    drawSlimeNote(
      ctx,
      api,
      currentBeat === 2
        ? 'Integrity checksums and publisher authorization remain separate checks'
        : 'Index: base + destination + encoding + per-tensor checksum · payload: zstd',
    );
    return;
  }
}
export default {
  id: 'delta-record',
  draw: drawDeltaRecord,
  cues: [
    'sl-delta-record-b0-operation',
    'sl-delta-record-b0-s0',
    'sl-delta-record-b0-s1',
    'sl-delta-record-b0-s2',
    'sl-delta-record-b1-operation',
    'sl-delta-record-b1-s0',
    'sl-delta-record-b1-s1',
    'sl-delta-record-b1-s2',
    'sl-delta-record-b2-operation',
    'sl-delta-record-b2-s0',
    'sl-delta-record-b2-s1',
    'sl-delta-record-b2-s2',
    'sl-delta-record-b2-s3',
  ],
};
