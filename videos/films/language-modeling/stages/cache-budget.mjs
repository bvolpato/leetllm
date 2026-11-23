import { languageStep } from '../construction.mjs';
import { extendedLanguageState } from '../model.mjs';
import {
  drawExtendedBox,
  drawExtendedHead,
  drawExtendedText,
  drawExtendedTokenRow,
  formatLanguage,
} from '../defaults.mjs';
export function drawCacheBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('cache-budget', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('cache-budget-construction', () => {
    const m = extendedLanguageState('cache-budget', state),
      gib = m.bytes / 1024 ** 3;
    drawExtendedHead(ctx, api, 'Raw K/V payload · retain every dimension');
    drawExtendedTokenRow(
      ctx,
      api,
      ['2 arrays', '32 layers', '8 KV heads', '128 coords'],
      140,
      330,
      380,
      35,
      themeColors.cyan,
    );
    if (currentBeat === 0)
      for (const [a, name] of ['K', 'V'].entries()) {
        const x = 170 + a * 850;
        drawExtendedText(
          ctx,
          api,
          name + ' · one layer’s stored-head slice',
          x + 365,
          485,
          29,
          a ? themeColors.green : themeColors.blue,
          'center',
        );
        for (let r = 0; r < 8; r++)
          for (let c = 0; c < 16; c++)
            api.rect(
              ctx,
              x + c * 43,
              535 + r * 35,
              37,
              29,
              a ? themeColors.green : themeColors.blue,
              themeColors.muted,
              1,
            );
        drawExtendedText(
          ctx,
          api,
          '8 head rows × position groups; 128 values per head/position',
          x + 350,
          875,
          23,
          themeColors.muted,
          'center',
        );
      }
    else {
      drawExtendedText(
        ctx,
        api,
        'Each request: 32,768 positions · 4 GiB raw K/V',
        960,
        470,
        30,
        themeColors.cyan,
        'center',
      );
      for (let r = 0; r < 32; r++) {
        const x = 160 + (r % 8) * 200,
          y = 520 + Math.floor(r / 8) * 88,
          active = r < m.requests;
        drawExtendedBox(ctx, api, x, y, 180, 73, active ? themeColors.cyan : themeColors.muted);
        if (active) {
          drawExtendedText(
            ctx,
            api,
            'request ' + (r + 1),
            x + 90,
            y + 27,
            22,
            themeColors.ink,
            'center',
          );
          api.rect(ctx, x + 20, y + 42, 70, 16, themeColors.blue);
          api.rect(ctx, x + 92, y + 42, 70, 16, themeColors.green);
        }
      }
    }
    drawExtendedText(
      ctx,
      api,
      'cached positions/request ' + m.positions.toLocaleString('en-US'),
      540,
      945,
      30,
      themeColors.yellow,
      'center',
    );
    drawExtendedText(
      ctx,
      api,
      m.requests + ' requests × 2 bytes/value',
      1390,
      945,
      30,
      themeColors.yellow,
      'center',
    );
    const reveal = currentBeat === 0 ? E(0, 2) : E(1, 0);
    if (reveal)
      drawExtendedText(
        ctx,
        api,
        formatLanguage(ctx, api, gib, 3) + ' GiB raw batch payload',
        960,
        1010,
        33,
        themeColors.green,
        'center',
      );
    if (currentBeat === 0 && S(0, 3) > 0) {
      const x = 1780,
        hh = 420;
      api.rect(ctx, x, 535, 32, hh, themeColors.panel, themeColors.muted, 1);
      api.rect(ctx, x, 535 + hh * (1 - gib / 16), 32, (hh * gib) / 16, themeColors.yellow);
    }
  });
}
export default {
  id: 'cache-budget',
  draw: drawCacheBudget,
  cues: [
    'cache-budget-b1',
    'cache-budget-voice-1',
    'cache-budget-step-0-1',
    'cache-budget-step-0-2',
    'cache-budget-step-0-3',
    'cache-budget-step-0-4',
    'cache-budget-step-0-5',
    'cache-budget-b2',
    'cache-budget-voice-2',
    'cache-budget-step-1-1',
    'cache-budget-step-1-2',
    'cache-budget-step-1-3',
    'cache-budget-step-1-4',
  ],
};
