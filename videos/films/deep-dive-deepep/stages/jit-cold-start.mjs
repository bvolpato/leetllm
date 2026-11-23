import { chapterModel } from '../construction.mjs';
import {
  drawChapterBox,
  drawChapterGrid,
  drawChapterTarget,
  drawChapterText,
} from '../defaults.mjs';
export function drawJitColdStart(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('jit-cold-start', state),
    currentBeat = m.b,
    progress2 = m.p;
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65));
  drawChapterTarget(ctx, api, 'de-jit-cold-start-mechanism', () => {
    drawChapterText(
      ctx,
      api,
      'A specialization has more identity than its cache directory',
      960,
      275,
      35,
      themeColors.yellow,
      'center',
    );
    const fields = [
      'topology',
      'layout',
      'hidden bytes',
      'alignment',
      'warps / SMs / QPs',
      'compiler + flags',
    ];
    fields.forEach((v, i) =>
      drawChapterBox(
        ctx,
        api,
        v,
        210 + (i % 3) * 520,
        365 + Math.floor(i / 3) * 165,
        480,
        i === Math.floor(progress * 6) % 6 ? themeColors.yellow : themeColors.blue,
        105,
      ),
    );
    const changed = progress > 0.55;
    drawChapterGrid(
      ctx,
      api,
      [
        ['Compiler/target receipt', 'Generated code identity', 'Required artifact'],
        [
          currentBeat ? 'host extension installed' : 'compiler available',
          changed ? 'alignment changed → new identity' : 'original specialization',
          changed ? 'compile / validate' : 'compatible warm hit',
        ],
      ],
      160,
      770,
      1600,
      170,
      themeColors.cyan,
      27,
    );
    drawChapterText(
      ctx,
      api,
      currentBeat
        ? 'Pre-warm each actual specialization on each worker'
        : 'Cold compilation and warm execution have different timing work',
      960,
      1020,
      29,
      themeColors.muted,
      'center',
    );
  });
}
export default {
  id: 'jit-cold-start',
  draw: drawJitColdStart,
  cues: ['de-jit-cold-start-b0', 'de-jit-cold-start-b1'],
};
