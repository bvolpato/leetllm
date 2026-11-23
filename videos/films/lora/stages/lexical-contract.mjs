import { point } from '../geometry.mjs';
import { text, rect, arrow } from '../defaults.mjs';
export function drawLexicalContract(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const earned = (id, index, start = 0.1, end = 0.8) =>
    beat > index ||
    (beat === index && api.focus.progress(id, api.phase(progress, start, end)) >= 0.999);
  ctx.save();
  {
    api.focus.target('lexical-contract-mechanism', () => {
      const resize = api.focus.progress('lexical-resize', stage(0, 0.2, 0.5));
      const both = api.focus.progress('lexical-both', stage(1, 0.1, 0.5));
      const reload = earned('lexical-reload', 2, 0.4, 0.7);
      text(
        ctx,
        api,
        'UNTIED STRUCTURAL FIXTURE · token ID 4 is newly added',
        190,
        280,
        30,
        themeColors.muted,
      );
      const drawRows = (x, title, color, output = false) => {
        text(ctx, api, title, x, 365, 33, color);
        for (let i = 0; i < 5; i++) {
          const y = 410 + i * 88,
            exists = i < 4 || resize >= 0.999;
          text(
            ctx,
            api,
            String(i),
            x - 45,
            y + 43,
            28,
            i === 4 ? themeColors.yellow : themeColors.muted,
            'right',
            'mono',
          );
          for (let j = 0; j < 3; j++)
            rect(
              ctx,
              api,
              x + j * 100,
              y,
              85,
              65,
              exists ? (i === 4 ? '#ffd75e25' : '#79aaff25') : themeColors.panel,
              exists ? (i === 4 ? themeColors.yellow : color) : themeColors.pink,
              3,
            );
          if (i === 4)
            text(
              ctx,
              api,
              !exists
                ? 'missing row'
                : both >= 0.999
                  ? 'train + save this row'
                  : 'allocated; verify training',
              x,
              y + 110,
              25,
              both >= 0.999 ? themeColors.green : themeColors.muted,
            );
        }
        if (output) text(ctx, api, 'separate readout weights', x, 970, 27, themeColors.muted);
      };
      drawRows(300, 'input embeddings', themeColors.blue);
      drawRows(1150, 'output head', themeColors.cyan, true);
      const signalY = 620;
      if (beat === 0) {
        text(ctx, api, 'tokenizer ID exists', 760, 460, 30, themeColors.yellow, 'center');
        text(
          ctx,
          api,
          resize >= 0.999 ? 'model rows resized' : 'model rows absent',
          760,
          540,
          28,
          resize >= 0.999 ? themeColors.green : themeColors.pink,
          'center',
        );
      } else {
        arrow(
          ctx,
          api,
          point(655, signalY),
          point(1085, signalY),
          both >= 0.999 ? themeColors.green : themeColors.muted,
          4,
        );
        text(ctx, api, 'attention adapters', 850, signalY - 70, 28, themeColors.yellow, 'center');
        text(
          ctx,
          api,
          'do not train frozen rows',
          850,
          signalY + 75,
          27,
          themeColors.muted,
          'center',
        );
        if (reload) {
          rect(ctx, api, 720, 830, 320, 115, '#89d98120', themeColors.green);
          text(ctx, api, 'saved ID 4 rows', 880, 880, 30, themeColors.green, 'center');
          text(ctx, api, 'reload + generation test', 880, 925, 24, themeColors.green, 'center');
        }
      }
      text(
        ctx,
        api,
        'Tied weights need a separate tying check after wrapping and saving.',
        190,
        1040,
        28,
        themeColors.muted,
      );
    });
  }
  ctx.restore();
}
export default {
  id: 'lexical-contract',
  draw: drawLexicalContract,
  cues: [
    'lexical-contract-1',
    'lexical-resize',
    'lexical-contract-2',
    'lexical-both',
    'lexical-contract-3',
    'lexical-reload',
  ],
};
