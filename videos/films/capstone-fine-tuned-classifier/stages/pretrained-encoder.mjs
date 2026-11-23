import { clamp01 } from '../arithmetic.mjs';
import { classifierCueProgress } from '../construction.mjs';
import {
  drawExpandedClassifierCard,
  drawExpandedClassifierLine,
  drawExpandedClassifierNote,
  drawExpandedClassifierRect,
  drawExpandedClassifierText,
} from '../defaults.mjs';
export function drawPretrainedEncoder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0),
    cueProgress = (id) => classifierCueProgress(state, id);
  api.focus.target('pretrained-architecture', () => {
    const layers = cueProgress('pretrained-layers'),
      headP = cueProgress('pretrained-head'),
      causal = currentBeat >= 1 ? cueProgress('pretrained-causal') : 0;
    drawExpandedClassifierText(
      ctx,
      api,
      'DistilBERT sequence classifier',
      960,
      280,
      30,
      themeColors.yellow,
      'center',
    );
    ['[CLS]', 'ticket', 'tokens', '[SEP]'].forEach((v, i) =>
      drawExpandedClassifierCard(
        ctx,
        api,
        v,
        220 + i * 220,
        350,
        180,
        i ? themeColors.cyan : themeColors.pink,
        70,
        28,
      ),
    );
    const count = Math.floor(layers * 6);
    for (let i = 0; i < 6; i++) {
      drawExpandedClassifierRect(
        ctx,
        api,
        230,
        470 + i * 55,
        820,
        40,
        i < count ? themeColors.cyan : themeColors.muted,
      );
      drawExpandedClassifierText(
        ctx,
        api,
        'Transformer ' + (i + 1),
        640,
        500 + i * 55,
        24,
        i < count ? themeColors.cyan : themeColors.muted,
        'center',
      );
    }
    if (headP > 0) {
      drawExpandedClassifierLine(ctx, api, 310, 420, 310, 810, themeColors.pink, 5);
      drawExpandedClassifierCard(
        ctx,
        api,
        'First-token vector',
        1230,
        370,
        490,
        themeColors.pink,
        76,
        30,
      );
      ['Dense', 'ReLU', 'Dropout', '2-class head'].forEach((v, i) =>
        drawExpandedClassifierCard(ctx, api, v, 1290, 480 + i * 100, 370, themeColors.pink, 68, 28),
      );
    }
    if (causal > 0) {
      drawExpandedClassifierText(
        ctx,
        api,
        'Compare a causal decoder’s final token',
        650,
        850,
        29,
        themeColors.blue,
        'center',
      );
      for (let r = 0; r < 4; r++)
        for (let col = 0; col < 4; col++)
          drawExpandedClassifierRect(
            ctx,
            api,
            420 + col * 65,
            885 + r * 22,
            52,
            16,
            col <= r ? themeColors.blue : themeColors.muted,
            col <= r ? themeColors.blue : themeColors.panel,
          );
    }
    drawExpandedClassifierNote(
      ctx,
      api,
      currentBeat === 0
        ? 'DistilBERT · 6 layers · configured capacity 512 positions'
        : currentBeat === 1
          ? 'The final causal input token can see the entire admitted prefix'
          : 'Compare encoder candidates on the same held-out tickets',
    );
  });
}
export default {
  id: 'pretrained-encoder',
  draw: drawPretrainedEncoder,
  cues: [
    'pretrained-layers',
    'pretrained-head',
    'pretrained-causal',
    'pretrained-trainable',
    'pretrained-other',
  ],
};
