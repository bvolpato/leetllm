import { phase } from '../arithmetic.mjs';
import { sgBegun } from '../construction.mjs';
import { arrow, box, cells, extensionText, footer, title } from '../defaults.mjs';
export function drawContextPosition(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('context-position-mechanism', () => {
    title(ctx, api, 'Equal later strings inherit different earlier contexts');
    const early = currentBeat === 1 && sgBegun(state, 'context-early', q > 0.1),
      schema = currentBeat === 1 && sgBegun(state, 'context-schema', q > 0.7),
      prefix = early ? ['new time', 'system', 'user'] : ['system', 'rules', 'user'];
    if (currentBeat === 1) {
      extensionText(ctx, api, 'Stored template key', 200, 380, 30, themeColors.blue);
      cells(ctx, api, ['system', 'rules', 'user'], 800, 335, 880, 80, themeColors.cyan);
      extensionText(ctx, api, 'New request key', 200, 570, 30, themeColors.pink);
      cells(
        ctx,
        api,
        early ? ['timestamp', 'rules', 'user'] : ['system', 'rules', 'user'],
        800,
        525,
        880,
        80,
        early ? themeColors.pink : themeColors.cyan,
      );
      extensionText(
        ctx,
        api,
        early
          ? 'First position differs → old longest hit ends immediately'
          : 'Matching early positions remain reusable',
        960,
        735,
        34,
        early ? themeColors.pink : themeColors.green,
        'center',
      );
      if (schema)
        box(
          ctx,
          api,
          'Schema rendered into input → another token-key change',
          260,
          840,
          1400,
          85,
          themeColors.yellow,
          30,
        );
      else
        box(
          ctx,
          api,
          'Output-only grammar → separate request state',
          330,
          840,
          1260,
          85,
          themeColors.blue,
          31,
        );
    } else {
      cells(ctx, api, prefix, 200, 340, 660, 75, themeColors.cyan);
      extensionText(ctx, api, 'Shared leading context', 530, 300, 28, themeColors.cyan, 'center');
      [
        ['R42', 'dark mode', 'Label', 'Explanation'],
        ['R43', 'login error', 'Label', 'Explanation'],
      ].forEach((row, i) => {
        const y = 565 + i * 205;
        arrow(ctx, api, 875, 378, 975, y + 30, i ? themeColors.pink : themeColors.blue);
        box(
          ctx,
          api,
          row[0] + ' · ' + row[1],
          990,
          y - 10,
          380,
          85,
          i ? themeColors.pink : themeColors.blue,
        );
        cells(
          ctx,
          api,
          row.slice(2),
          1410,
          y - 10,
          330,
          85,
          i ? themeColors.pink : themeColors.blue,
        );
      });
      extensionText(
        ctx,
        api,
        'Label / Explanation repeat after divergence: separate hidden states',
        960,
        910,
        32,
        themeColors.yellow,
        'center',
      );
    }
    footer(
      ctx,
      api,
      'Prompt-rendered schema changes context · output-only masks own per-request progress',
    );
  });
}
export default {
  id: 'context-position',
  draw: drawContextPosition,
  cues: [
    'sg-context-position-beat-0',
    'sg-context-diverge',
    'sg-context-position-beat-1',
    'sg-context-early',
    'sg-context-schema',
  ],
};
