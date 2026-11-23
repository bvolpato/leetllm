import { card, equation, footer, particleGap } from '../defaults.mjs';
export function drawLexicalLane(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api;
  const beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = phase(progress, 0.06, 0.85);
  const route = (a, b, color = themeColors.cyan, amount = q) => {
    const r = api.connect(ctx, a, b, {
      color,
      fromGap: particleGap(ctx, api, a, b),
      toGap: particleGap(ctx, api, b, a),
      width: 3,
    });
    components.particle({
      points: [r.from, r.to],
      progress: amount,
      radius: 8,
      fill: color,
    });
  };
  {
    const queryText = beat === 0 ? 'tomato' : beat === 1 ? 'G-14' : 'growing tomatoes';
    const indexedText = beat === 0 ? 'tomato' : beat === 1 ? 'g-14' : 'No exact overlap';
    const passageTokens =
      beat === 0
        ? ['Garden', 'tomato', 'plants']
        : beat === 2
          ? ['raising', 'tomato', 'plants']
          : ['Guide', 'G-14', 'gardening'];
    const query = api.focus.target('lexical-query', () =>
      card(ctx, api, queryText, 180, 335, 370, themeColors.yellow),
    );
    const term = api.focus.target('indexed-term', () =>
      card(ctx, api, indexedText, 745, 335, 380, beat === 2 ? themeColors.muted : themeColors.blue),
    );
    const target = api.focus.target('matched-book', () =>
      card(ctx, api, 'Garden guide', 1360, 335, 360, themeColors.green),
    );
    route(query, term, themeColors.yellow, q);
    if (beat < 2) route(term, target, themeColors.blue, q);
    api.focus.target('passage-tokens', () =>
      components.tokenRow({
        values: passageTokens,
        centerX: 960,
        y: 610,
        height: 80,
        advance: 21,
        gap: 22,
        minWidth: 160,
        style: {
          fill: themeColors.panel,
          stroke: themeColors.cyan,
          textColor: themeColors.ink,
          fontSize: 32,
        },
        reveal: 1,
      }),
    );
    if (beat >= 1) {
      api.focus.target('bm25-mechanism', () =>
        equation(
          ctx,
          api,
          String.raw`\text{rarity}\times\text{saturating frequency}`,
          960,
          805,
          42,
        ),
      );
    }
    footer(
      ctx,
      api,
      beat === 2
        ? 'A simple exact matcher can lose a useful paraphrase'
        : 'An inverted index links terms to containing records',
    );
  }
}
export default {
  id: 'lexical-lane',
  draw: drawLexicalLane,
  cues: [
    'posting-list',
    'tomato-postings',
    'rarity-frequency',
    'rare-code-postings',
    'paraphrase-miss',
  ],
};
