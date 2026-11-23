import { openingWords } from '../fixtures.mjs';
import { cueStarted } from '../construction.mjs';
import { card, math, text } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    F = components.fade;
  {
    const sentenceRow = (words, y, reverse = false) => {
      const draw = () =>
        words.forEach((word, i) => {
          const actor = i === 1,
            color = actor ? (reverse ? themeColors.pink : themeColors.blue) : themeColors.cyan;
          components.card({
            label: word,
            x: 230 + i * 310,
            y,
            width: 220,
            height: 82,
            fill: themeColors.panel,
            stroke: color,
            textColor: themeColors.ink,
            fontSize: 34,
            padding: 12,
          });
          if (actor) text(ctx, api, 'actor', 340 + i * 310, y + 122, 27, color, 'center');
          if (i === 4)
            text(
              ctx,
              api,
              'receiver',
              1580,
              y + 122,
              27,
              reverse ? themeColors.blue : themeColors.muted,
              'center',
            );
        });
      if (reverse) api.focus.target('reversed-sentence', draw);
      else draw();
    };
    api.focus.target('actor-question', () =>
      text(ctx, api, 'Who acted?', 960, 220, 48, themeColors.yellow, 'center'),
    );
    sentenceRow(openingWords, 330);
    const reverseCue = state.cues?.['reversed-sentence'];
    if (cueStarted(state, 'reversed-sentence')) {
      const reveal = Math.min(1, (reverseCue?.reveal ?? 1) * 1.4);
      F(reveal, () => {
        sentenceRow(['The', 'cat', 'chased', 'the', 'dog'], 530, true);
        api.focus.target('reversed-roles', () =>
          text(ctx, api, 'cat acts  →  dog receives', 960, 700, 32, themeColors.pink, 'center'),
        );
      });
    }
    if (currentBeat > 0) {
      api.focus.target('recurrent-memory', () =>
        card(ctx, api, 'hidden state · clues so far', 660, 820, 600, themeColors.yellow),
      );
      api.focus.target('recurrent-update', () =>
        math(ctx, api, String.raw`h_t=f(h_{t-1},x_t)`, 960, 975, 48, themeColors.ink, 'center'),
      );
    }
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'reversed-sentence',
    'actor-role-reverses',
    'hidden-state',
    'previous-state',
    'build-memory',
    'control-retention',
  ],
};
