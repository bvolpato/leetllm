import { clamp01 } from '../arithmetic.mjs';
import { classifierCueProgress } from '../construction.mjs';
import {
  drawExpandedClassifierCard,
  drawExpandedClassifierLine,
  drawExpandedClassifierNote,
  drawExpandedClassifierText,
} from '../defaults.mjs';
export function drawReloadContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0),
    cueProgress = (id) => classifierCueProgress(state, id),
    done = (id) => cueProgress(id) >= 1;
  api.focus.target('export-inventory', () => {
    const names = [
      'config.json',
      'model.safetensors',
      'tokenizer.json',
      'Label mapping',
      'Approved manifest',
    ];
    names.forEach((v, i) => {
      drawExpandedClassifierCard(
        ctx,
        api,
        v,
        230,
        345 + i * 104,
        610,
        i === 3 ? themeColors.pink : themeColors.blue,
        76,
        28,
      );
      if (cueProgress('reload-inventory') > i / names.length)
        drawExpandedClassifierText(
          ctx,
          api,
          i < 3 ? 'match' : i === 3 ? '0 / 1' : 'trusted',
          960,
          395 + i * 104,
          27,
          themeColors.green,
        );
    });
    if (currentBeat === 0 && cueProgress('reload-inventory') > 0) {
      drawExpandedClassifierCard(
        ctx,
        api,
        'unexpected.py',
        1250,
        420,
        460,
        themeColors.pink,
        80,
        29,
      );
      drawExpandedClassifierCard(
        ctx,
        api,
        'tokenizer link → elsewhere',
        1210,
        560,
        540,
        themeColors.pink,
        80,
        27,
      );
      drawExpandedClassifierText(
        ctx,
        api,
        'reject inventory or symlink',
        1480,
        745,
        28,
        themeColors.pink,
        'center',
      );
    } else if (currentBeat === 1) {
      if (cueProgress('reload-labels') > 0) {
        drawExpandedClassifierCard(
          ctx,
          api,
          '0 = guarded  ·  1 = human',
          1110,
          370,
          650,
          themeColors.pink,
          95,
          30,
        );
        drawExpandedClassifierCard(
          ctx,
          api,
          'routine confidence 0.88',
          1110,
          540,
          650,
          themeColors.blue,
          95,
          30,
        );
        if (done('reload-score'))
          drawExpandedClassifierCard(
            ctx,
            api,
            'review column 1 = 0.12',
            1110,
            710,
            650,
            themeColors.green,
            95,
            31,
          );
      }
    } else if (currentBeat === 2) {
      drawExpandedClassifierCard(
        ctx,
        api,
        'Score file + editable metadata',
        1090,
        420,
        690,
        themeColors.yellow,
        100,
        30,
      );
      drawExpandedClassifierLine(ctx, api, 1090, 620, 1780, 620, themeColors.pink, 5);
      drawExpandedClassifierText(
        ctx,
        api,
        'Producer evidence still required',
        1435,
        735,
        29,
        themeColors.pink,
        'center',
      );
    }
    drawExpandedClassifierNote(
      ctx,
      api,
      'Inspected flat-export recipe · keep bytes fixed through verification and use',
    );
  });
}
export default {
  id: 'reload-contract',
  draw: drawReloadContract,
  cues: ['reload-inventory', 'reload-mutable', 'reload-labels', 'reload-score', 'reload-meta'],
};
