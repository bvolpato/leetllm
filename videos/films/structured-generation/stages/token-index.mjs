import {
  arrow,
  box,
  constructionCode,
  constructionFooter,
  focusProgress,
  label,
} from '../defaults.mjs';
export function drawTokenIndex(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-token-index-mechanism', () => {
      const chars = ['i', 'l', 'e', 'd', '"', '}'],
        q = focusProgress(ctx, api, 'sg-trie-shared'),
        count = Math.floor(q * chars.length);
      label(ctx, api, 'Two tokens share their first six bytes', 960, 280, themeColors.blue, 34);
      chars.forEach((ch, i) => {
        const x = 200 + i * 137;
        api.rect(
          ctx,
          x,
          370,
          95,
          85,
          themeColors.panel,
          i < count ? themeColors.cyan : themeColors.blue,
          8,
        );
        constructionCode(
          ctx,
          api,
          ch,
          x + 47,
          426,
          38,
          i < count ? themeColors.cyan : themeColors.blue,
          'center',
        );
        if (i < chars.length - 1) arrow(ctx, api, x + 103, 412, x + 127, 412);
      });
      api.line(ctx, 988, 412, 1100, 412, themeColors.cyan, 3);
      api.line(ctx, 1100, 412, 1100, 575, themeColors.cyan, 3);
      arrow(ctx, api, 1100, 575, 1215, 575);
      box(
        ctx,
        api,
        'Token IDs share this traversal',
        ['iled"}    · candidate A', 'iled"}!   · candidate B'],
        1230,
        350,
        500,
        180,
        themeColors.blue,
      );
      api.rect(ctx, 1230, 550, 95, 85, themeColors.panel, themeColors.pink, 8);
      constructionCode(ctx, api, '!', 1278, 607, 38, themeColors.pink, 'center');
      if (currentBeat === 0) {
        box(
          ctx,
          api,
          'Finite-state position index',
          ['state → allowed token IDs', 'one compiled lookup is reused'],
          240,
          735,
          1440,
          165,
          themeColors.blue,
        );
      } else {
        const dynamic = focusProgress(ctx, api, 'sg-index-local'),
          fresh = done('sg-index-new-request');
        box(
          ctx,
          api,
          'Compiled local-rule mask',
          ['check without walking parents'],
          180,
          735,
          740,
          150,
          themeColors.blue,
        );
        box(
          ctx,
          api,
          fresh ? 'New request · independent stack' : 'This request · live return stack',
          fresh ? ['three unresolved returns'] : ['test a parent-closing token'],
          1030,
          735,
          710,
          150,
          themeColors.yellow,
        );
        if (dynamic > 0) {
          for (let i = 0; i < 3; i++)
            api.rect(
              ctx,
              1120 + i * 165,
              650,
              120,
              36,
              themeColors.panel,
              i < Math.floor(dynamic * 3) ? themeColors.yellow : themeColors.muted,
              5,
            );
        }
        if (currentBeat === 2)
          label(
            ctx,
            api,
            'Earley parser · regex lexer · tokenizer trie',
            960,
            935,
            themeColors.cyan,
            28,
          );
      }
      constructionFooter(
        ctx,
        api,
        'The shared trie saves repeated byte checks; it does not share request state.',
      );
    });
  }
}
export default {
  id: 'token-index',
  draw: drawTokenIndex,
  cues: [
    'sg-token-index-0',
    'sg-trie-shared',
    'sg-token-index-1',
    'sg-index-local',
    'sg-index-new-request',
    'sg-token-index-2',
  ],
};
