import { BASE, WORDS } from '../fixtures.mjs';
import { nucleus } from '../arithmetic.mjs';
import { truncationState } from '../model.mjs';
import { originalBars, originalText } from '../defaults.mjs';
export function drawNucleus(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const { values, ids, sum, normalized } = truncationState('nucleus', state);
    if (currentBeat === 1) {
      const retained = nucleus(BASE),
        prefix = retained.slice(0, -1);
      const subtotal = prefix.reduce((total, id) => total + BASE[id], 0);
      const complete = retained.reduce((total, id) => total + BASE[id], 0);
      api.focus.target('nucleus-prefix-subtotal', () =>
        originalText(
          ctx,
          api,
          `First two: ${subtotal.toFixed(3)} < 0.80 · with ${WORDS[retained.at(-1)]}: ${complete.toFixed(3)} ≥ 0.80`,
          960,
          380,
          30,
          themeColors.cyan,
          'center',
        ),
      );
    }
    api.focus.target('nucleus-mass', () =>
      originalText(
        ctx,
        api,
        `Top-p 0.80 · ${ids.length} candidates accumulated`,
        960,
        300,
        40,
        themeColors.green,
        'center',
      ),
    );
    api.focus.target('nucleus-candidates', () =>
      originalBars(
        ctx,
        api,
        values,
        WORDS.map((_, i) => (ids.includes(i) ? themeColors.green : themeColors.muted)),
      ),
    );
    originalText(
      ctx,
      api,
      `Original mass accumulated: ${sum.toFixed(3)}${sum >= 0.8 ? ' · threshold reached' : ' · below threshold'}`,
      960,
      950,
      32,
      themeColors.ink,
      'center',
    );
    originalText(
      ctx,
      api,
      normalized > 0 && normalized < 1
        ? 'Renormalizing retained candidates'
        : normalized === 1
          ? `Final sampling mass: ${values.reduce((a, v) => a + v, 0).toFixed(3)}`
          : 'Sorted model probabilities',
      960,
      1020,
      28,
      themeColors.muted,
      'center',
    );
    return;
  }
}
export default {
  id: 'nucleus',
  draw: drawNucleus,
  cues: ['nucleus-b1-1', 'nucleus-b2-1', 'nucleus-prefix-subtotal', 'nucleus-b3-1'],
};
