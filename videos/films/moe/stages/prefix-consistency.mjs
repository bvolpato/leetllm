import { mc } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { arrow, footer, matrix, mechanismText, rectangle, tag } from '../defaults.mjs';
export function drawPrefixConsistency(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    Q = (id) => moeCue(state, id, 'settle'),
    cols = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  api.focus.target('mo-prefix-consistency-mechanism', () => {
    const future = resultComplete('future-score'),
      wins = resultComplete('future-wins'),
      loses = resultComplete('prefix-loses');
    mechanismText(
      ctx,
      api,
      'One expert slot · fixed earlier hidden state and score',
      960,
      290,
      35,
      themeColors.yellow,
    );
    tag(ctx, api, 'Earlier token · score 0.6', 390, 460, 580, themeColors.blue);
    if (future) tag(ctx, api, 'Future token · score 0.9', 390, 730, 580, themeColors.pink);
    rectangle(ctx, api, 1240, 430, 420, 170, themeColors.panel, themeColors.yellow);
    mechanismText(ctx, api, 'Expert bucket: 1 slot', 1450, 380, 33, themeColors.yellow);
    if (resultComplete('prefix-score')) {
      const move = wins ? Q('future-wins') : 0;
      rectangle(ctx, api, 1300, 470, 300, 80, wins ? themeColors.pink : themeColors.blue);
      mechanismText(ctx, api, wins ? 'future 0.9' : 'earlier 0.6', 1450, 520, 32, themeColors.bg);
      arrow(ctx, api, 700, wins ? 730 : 460, 1210, 510, wins ? themeColors.pink : themeColors.blue);
      if (move > 0) arrow(ctx, api, 1450, 620, 1450, 620 + move * 160, themeColors.blue);
    }
    if (loses && currentBeat < 2)
      tag(ctx, api, 'Earlier expert contribution removed', 1390, 875, 760, themeColors.pink);
    if (currentBeat === 0)
      mechanismText(
        ctx,
        api,
        'Will the earlier assignment stay unchanged?',
        960,
        960,
        35,
        themeColors.yellow,
      );
    else if (currentBeat === 2) {
      matrix(ctx, api, cols, [['past', 'past', 'masked future']], 260, 760, 230, [
        themeColors.blue,
      ]);
      mechanismText(
        ctx,
        api,
        'Causal attention mask ≠ causal routing selection',
        960,
        960,
        34,
        themeColors.pink,
      );
    }
    footer(ctx, api, 'The earlier score stays 0.6; only a later group member is introduced.');
  });
}
export default {
  id: 'prefix-consistency',
  draw: drawPrefixConsistency,
  cues: [
    'mo-prefix-consistency-op-0',
    'mo-prefix-score',
    'mo-future-score',
    'mo-prefix-consistency-op-1',
    'mo-future-wins',
    'mo-prefix-loses',
    'mo-prefix-consistency-op-2',
  ],
};
