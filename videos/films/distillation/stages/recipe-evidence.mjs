import {
  contractNote,
  contractRectangle,
  contractTag,
  contractText,
  cueComplete,
  cueProgress,
  probabilityBar,
} from '../defaults.mjs';
export function drawRecipeEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('recipe-evidence-mechanism', () => {
    if (currentBeat === 0) {
      contractText(
        ctx,
        api,
        'Reported controlled Gemma 2B · 500B tokens · three-benchmark mean',
        960,
        285,
        33,
        themeColors.muted,
      );
      [
        ['from scratch', 60.3, themeColors.cyan],
        ['7B teacher token probabilities', 67.7, themeColors.blue],
      ].forEach(([s, v, c], i) => {
        contractText(ctx, api, s, 500 + i * 880, 410, 31, c);
        probabilityBar(
          ctx,
          api,
          (v / 100) * cueProgress(ctx, api, 'gemma-evidence'),
          330 + i * 880,
          850,
          300,
          500,
          c,
        );
        if (cueComplete(ctx, api, 'gemma-evidence'))
          contractText(ctx, api, v.toFixed(1), 480 + i * 880, 930, 42, c);
      });
    } else if (currentBeat === 1) {
      contractText(
        ctx,
        api,
        'Original January 2025 DeepSeek-R1 report',
        960,
        285,
        36,
        themeColors.muted,
      );
      contractRectangle(
        ctx,
        api,
        280,
        430,
        1020 * cueProgress(ctx, api, 'r1-dataset'),
        110,
        themeColors.blue,
      );
      contractRectangle(
        ctx,
        api,
        1300,
        430,
        340 * cueProgress(ctx, api, 'r1-dataset'),
        110,
        themeColors.cyan,
      );
      contractText(ctx, api, '600k reasoning', 790, 610, 35, themeColors.blue);
      contractText(ctx, api, '200k general', 1470, 610, 35, themeColors.cyan);
      if (cueComplete(ctx, api, 'r1-evidence')) {
        contractText(ctx, api, 'Qwen 32B: AIME 2024 pass@1 72.6%', 960, 750, 36, themeColors.green);
        contractText(
          ctx,
          api,
          'MATH 500 94.3% · T = 0.6 · top-p = 0.95 · max 32768',
          960,
          865,
          32,
          themeColors.yellow,
        );
      }
      contractNote(ctx, api, 'AIME pass@1 estimates correctness for one sampled answer.');
    } else {
      [
        'Orca: explanation-trace SFT',
        'phi 1.5: synthetic pretraining',
        'Gemma 2: teacher token probabilities',
      ].forEach((s, i) =>
        contractTag(
          ctx,
          api,
          s,
          960,
          420 + i * 190,
          [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
          1200,
        ),
      );
      contractText(
        ctx,
        api,
        'Compare signal, collection, divergence, decoding and evaluation budget',
        960,
        940,
        32,
        themeColors.muted,
      );
    }
    if (currentBeat !== 1)
      contractNote(ctx, api, 'Reported training setups and evaluation budgets');
  });
  return;
}
export default {
  id: 'recipe-evidence',
  draw: drawRecipeEvidence,
  cues: ['gemma-evidence', 'r1-dataset', 'r1-evidence'],
};
