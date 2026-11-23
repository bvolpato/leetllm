import { phase } from '../arithmetic.mjs';
import { sgProgress } from '../construction.mjs';
import { arrow, box, cells, extensionText, footer, title } from '../defaults.mjs';
export function drawCompressedGrammar(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('compressed-grammar-mechanism', () => {
    title(ctx, api, 'Forced string paths and tokenizer boundaries are different objects');
    const forced = '{"label":"',
      compress = sgProgress(state, 'compress', q),
      re = currentBeat === 1 ? sgProgress(state, 'retokenize', q) : 0;
    if (currentBeat === 0 && compress < 1) {
      cells(ctx, api, [...'{"label":"'], 180, 410, 1300, 78, themeColors.cyan);
      for (let i = 0; i < 9; i++)
        arrow(
          ctx,
          api,
          180 + (i + 1) * 130 - 8,
          530,
          180 + (i + 1) * 130 + 25,
          530,
          themeColors.cyan,
        );
      extensionText(
        ctx,
        api,
        'One allowed character continuation at each transition',
        960,
        670,
        32,
        themeColors.cyan,
        'center',
      );
    } else {
      box(ctx, api, '{"label":"', 260, 395, 1000, 100, themeColors.cyan, 43);
      arrow(ctx, api, 1280, 445, 1430, 445);
      box(ctx, api, 'bug\nfeature\nquestion', 1460, 355, 300, 180, themeColors.blue, 30);
      extensionText(
        ctx,
        api,
        'One forced string · variable value still branches',
        960,
        650,
        34,
        themeColors.cyan,
        'center',
      );
    }
    if (currentBeat === 1) {
      cells(
        ctx,
        api,
        re >= 1 ? ['token ab'] : ['token a', 'token b'],
        390,
        770,
        1140,
        85,
        re >= 1 ? themeColors.green : themeColors.pink,
      );
      extensionText(
        ctx,
        api,
        'Illustrative tokenizer: prior "a" + forced "b" retokenizes as "ab"',
        960,
        920,
        29,
        themeColors.yellow,
        'center',
      );
    }
    footer(
      ctx,
      api,
      'Historical compressed FSM · probability and preparation costs require backend checks',
    );
  });
}
export default {
  id: 'compressed-grammar',
  draw: drawCompressedGrammar,
  cues: [
    'sg-compressed-grammar-beat-0',
    'sg-compress',
    'sg-compressed-grammar-beat-1',
    'sg-retokenize',
  ],
};
