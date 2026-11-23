import { REQUIRED_RAG_GATES } from '../fixtures.mjs';
import { prEvent } from '../construction.mjs';
import { arrow, card, centeredText, extensionFooter, sourcePage } from '../defaults.mjs';
export function drawTailsAndGates(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => prEvent(state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('tails-and-gates-mechanism', () => {
    if (currentBeat === 0) {
      centeredText(
        ctx,
        api,
        'Five independent stage-bound events',
        960,
        290,
        35,
        themeColors.yellow,
      );
      let product = 1;
      for (let i = 0; i < 5; i++) {
        product *= 0.95;
        card(
          ctx,
          api,
          'Stage ' + (i + 1) + '\n0.95',
          180 + i * 340,
          430,
          280,
          140,
          themeColors.cyan,
          31,
        );
        if (i < 4) arrow(ctx, api, 475 + i * 340, 500, 505 + i * 340, 500, themeColors.cyan);
        if (ev('joint', 0) >= (i + 1) / 5)
          centeredText(
            ctx,
            api,
            'P(all ' + (i + 1) + ') ' + product.toFixed(3),
            320 + i * 340,
            720,
            28,
            themeColors.cyan,
          );
      }
      if (done('joint', 0))
        centeredText(
          ctx,
          api,
          '0.95⁵ = 0.774 · not a percentile of the sum',
          960,
          900,
          34,
          themeColors.yellow,
        );
    } else if (currentBeat === 1) {
      sourcePage(ctx, api, 100, 350, 760, 390);
      card(
        ctx,
        api,
        'Candidate claim\n“limit 30” · cites E1',
        1100,
        410,
        650,
        170,
        themeColors.pink,
        33,
      );
      if (done('mutation', 1)) {
        arrow(ctx, api, 910, 545, 1060, 545, themeColors.pink);
        centeredText(
          ctx,
          api,
          'E1 says 14 · wrong-limit candidate blocked',
          960,
          895,
          34,
          themeColors.pink,
        );
      }
    } else {
      const count = Math.floor(ev('required', 2) * 6);
      REQUIRED_RAG_GATES.forEach((name, i) =>
        card(
          ctx,
          api,
          name + '\n' + (i < count ? 'true' : '?'),
          200 + (i % 3) * 570,
          370 + Math.floor(i / 3) * 220,
          510,
          140,
          i < count ? themeColors.green : themeColors.muted,
          30,
        ),
      );
      if (done('alltrue', 2))
        centeredText(
          ctx,
          api,
          'Missing field / empty report / non-true value → block',
          960,
          950,
          31,
          themeColors.pink,
        );
    }
    extensionFooter(
      ctx,
      api,
      'Deterministic contract checks do not estimate production model accuracy; track false refusals too',
    );
  });
}
export default {
  id: 'tails-and-gates',
  draw: drawTailsAndGates,
  cues: ['pr-joint', 'pr-mutation', 'pr-required', 'pr-alltrue'],
};
