import { DOCS, TERMS } from '../fixtures.mjs';
import { openingSnapshot } from '../model.mjs';
import { box, focus, text } from '../defaults.mjs';
export function drawOpening(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    const s = openingSnapshot(state);
    text(
      ctx,
      api,
      themeColors,
      'Why did the login test fail after the identity-provider update?',
      960,
      205,
      39,
    );
    focus(ctx, api, themeColors, 'passage-work', () => {
      if (s.open > 0)
        TERMS.forEach((term, j) => {
          const done = j < s.compared,
            match = DOCS[0].words.includes(term);
          box(
            ctx,
            api,
            themeColors,
            term + (done ? (match ? ' ✓' : ' ×') : ' ?'),
            580 + j * 300,
            260,
            275,
            70,
            done ? (match ? themeColors.green : themeColors.pink) : themeColors.muted,
            31,
          );
        });
      DOCS.forEach((d, i) => {
        const y = 365 + i * 120;
        box(
          ctx,
          api,
          themeColors,
          d.name,
          150,
          y,
          380,
          86,
          s.winnerReady && i === 0 ? themeColors.green : themeColors.blue,
          31,
        );
        if (i === 0 && s.open > 0) {
          d.words.forEach((word, j) =>
            box(
              ctx,
              api,
              themeColors,
              word,
              580 + j * 255,
              y,
              235,
              86,
              TERMS.slice(0, s.compared).includes(word) ? themeColors.green : themeColors.muted,
              30,
            ),
          );
          if (s.compared > 0)
            text(
              ctx,
              api,
              themeColors,
              s.matches + ' / 3 selected query terms match',
              1110,
              478,
              27,
              themeColors.yellow,
            );
        } else
          text(
            ctx,
            api,
            themeColors,
            i < s.inspected
              ? s.scores[i] + ' matching query ' + (s.scores[i] === 1 ? 'term' : 'terms')
              : 'awaiting inspection',
            1110,
            y + 55,
            30,
            i < s.inspected ? themeColors.ink : themeColors.muted,
          );
      });
    });
    focus(ctx, api, themeColors, 'scan-work', () => {
      text(
        ctx,
        api,
        themeColors,
        s.inspected + ' / 4 candidates inspected',
        960,
        930,
        40,
        themeColors.yellow,
      );
      for (let i = 0; i < 4; i++)
        box(
          ctx,
          api,
          themeColors,
          i < s.inspected ? '✓' : '?',
          1560 + (i % 2) * 115,
          800 + Math.floor(i / 2) * 80,
          90,
          65,
          i < s.inspected ? themeColors.green : themeColors.muted,
          32,
        );
    });
  }
}
export default {
  id: 'opening',
  draw: drawOpening,
  cues: ['opening-open', 'opening-terms', 'opening-rest', 'opening-result'],
};
