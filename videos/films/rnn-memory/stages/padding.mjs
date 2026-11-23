import { spokenProgress } from '../construction.mjs';
import { actorMemoryTrace } from '../model.mjs';
import { math, text } from '../defaults.mjs';
export function drawPadding(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    F = components.fade;
  {
    const trace = actorMemoryTrace('dog'),
      nextState = api.lerp(trace.final, trace.padded, spokenProgress(state, 'unmasked-ending'));
    if (currentBeat === 0) {
      text(ctx, api, 'The dog chased the cat', 960, 250, 36, themeColors.ink, 'center');
      api.focus.target('unmasked-ending', () => {
        components.panel({
          x: 315,
          y: 335,
          width: 570,
          height: 390,
          fill: themeColors.panel,
          stroke: themeColors.pink,
          padding: 24,
        });
        text(ctx, api, 'unmasked padding step', 600, 390, 31, themeColors.pink, 'center');
        components.card({
          label: 'real end · ' + trace.final.toFixed(3),
          x: 385,
          y: 455,
          width: 430,
          height: 86,
          fill: themeColors.panel,
          stroke: themeColors.blue,
          textColor: themeColors.blue,
          fontSize: 30,
          padding: 14,
        });
        api.arrow(ctx, 600, 555, 600, 610, themeColors.pink, 5);
        components.card({
          label: 'zero input  →  ' + nextState.toFixed(3),
          x: 385,
          y: 625,
          width: 430,
          height: 86,
          fill: themeColors.panel,
          stroke: themeColors.pink,
          textColor: themeColors.pink,
          fontSize: 28,
          padding: 14,
        });
      });
      text(
        ctx,
        api,
        'A filler transition changes the state seen by the readout.',
        1380,
        525,
        30,
        themeColors.muted,
        'center',
      );
      math(ctx, api, String.raw`h_6=\tanh(0.9h_5)`, 1300, 595, 43, themeColors.ink, 'center');
    } else if (currentBeat === 1) {
      text(ctx, api, 'The dog chased the cat', 960, 250, 36, themeColors.ink, 'center');
      components.panel({
        x: 440,
        y: 360,
        width: 1040,
        height: 300,
        fill: themeColors.panel,
        stroke: themeColors.green,
        padding: 24,
      });
      text(
        ctx,
        api,
        'masked or packed sequence · stop at the real length',
        960,
        420,
        31,
        themeColors.green,
        'center',
      );
      api.focus.target('preserved-ending', () =>
        components.card({
          label: 'state stays at  ' + trace.final.toFixed(3),
          x: 665,
          y: 465,
          width: 590,
          height: 90,
          fill: themeColors.panel,
          stroke: themeColors.green,
          textColor: themeColors.green,
          fontSize: 32,
          padding: 16,
        }),
      );
      math(
        ctx,
        api,
        String.raw`h_{t+1}=h_t\quad\text{when the mask is zero}`,
        960,
        620,
        42,
        themeColors.ink,
        'center',
      );
      text(
        ctx,
        api,
        'Reset the state before an independent sequence.',
        960,
        790,
        32,
        themeColors.muted,
        'center',
      );
    } else {
      const rows = [
        {
          words: ['The', 'dog', 'chased', 'the', 'cat'],
          y: 350,
          actor: 'dog',
          target: 'dog-actor-readout',
          color: themeColors.blue,
        },
        {
          words: ['The', 'cat', 'chased', 'the', 'dog'],
          y: 650,
          actor: 'cat',
          target: 'cat-actor-readout',
          color: themeColors.pink,
        },
      ];
      rows.forEach(({ words, y, actor, target, color }) => {
        words.forEach((word, i) =>
          components.card({
            label: word,
            x: 115 + i * 174,
            y,
            width: 155,
            height: 76,
            fill: themeColors.panel,
            stroke: i === 1 ? color : themeColors.cyan,
            textColor: themeColors.ink,
            fontSize: 28,
            padding: 9,
          }),
        );
        api.focus.target(target, () =>
          components.card({
            label: actor + ' acted',
            x: 1030,
            y: y - 1,
            width: 390,
            height: 80,
            fill: themeColors.panel,
            stroke: color,
            textColor: color,
            fontSize: 34,
            padding: 14,
          }),
        );
      });
      api.focus.target('reversed-roles', () =>
        text(
          ctx,
          api,
          'one word-order change · a different actor',
          960,
          560,
          31,
          themeColors.yellow,
          'center',
        ),
      );
      text(
        ctx,
        api,
        'The carried clue reaches the final decision.',
        960,
        850,
        33,
        themeColors.muted,
        'center',
      );
    }
  }
}
export default {
  id: 'padding',
  draw: drawPadding,
  cues: ['unmasked-ending', 'preserved-ending', 'opening-payoff', 'reversed-payoff'],
};
