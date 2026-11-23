import { prEvent } from '../construction.mjs';
import { card, centeredText, extensionFooter, sourcePage } from '../defaults.mjs';
export function drawFreshEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => prEvent(state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('fresh-evidence-mechanism', () => {
    const rolled = currentBeat > 0 || done('freshrollback', 0),
      deleted = ev('deletion', 0) > 0,
      decide = currentBeat > 0 && done('discard', 1),
      alternative = currentBeat > 0 && ev('counterfactual-input', 1) > 0,
      alternativeReady = done('newage', 1);
    centeredText(
      ctx,
      api,
      alternative
        ? 'Permitted counterfactual · 16 stale days · signal 47 hours'
        : 'New request · 13 stale days · signal 47 hours',
      960,
      285,
      34,
      themeColors.yellow,
    );
    sourcePage(ctx, api, 110, 355, 780, 390, {
      title: alternative
        ? 'Counterfactual · currently permitted E1'
        : 'Bundle ' + (rolled ? 'B' : 'C') + ' · same E1 bytes',
    });
    card(
      ctx,
      api,
      alternative
        ? 'Counterfactual: current permission valid'
        : deleted
          ? 'Current authority: policy tombstoned'
          : 'Current authority: permitted',
      1080,
      365,
      690,
      120,
      alternative ? themeColors.green : deleted ? themeColors.pink : themeColors.green,
      30,
    );
    card(
      ctx,
      api,
      alternative
        ? 'Fresh typed request · E1'
        : decide
          ? 'Dependent cached draft invalidated'
          : 'Buffered draft · answer held',
      1080,
      620,
      690,
      115,
      alternative ? themeColors.blue : decide ? themeColors.pink : themeColors.muted,
      30,
    );
    if (alternative)
      centeredText(
        ctx,
        api,
        alternativeReady
          ? 'If permitted but age 16: ineligible · E1'
          : 'Counterfactual decision pending',
        960,
        900,
        34,
        alternativeReady ? themeColors.yellow : themeColors.muted,
      );
    else if (decide)
      centeredText(
        ctx,
        api,
        'Tombstone persists through rollback → abstain',
        960,
        900,
        34,
        themeColors.pink,
      );
    extensionFooter(
      ctx,
      api,
      currentBeat === 0
        ? 'Retain the request, both ages, current authority and selected bundle'
        : 'Complete policy support and permission to disclose have distinct outcomes',
    );
  });
}
export default {
  id: 'fresh-evidence',
  draw: drawFreshEvidence,
  cues: [
    'pr-inputs',
    'pr-deletion',
    'pr-freshrollback',
    'pr-discard',
    'pr-counterfactual-input',
    'pr-newage',
    'pr-trace',
  ],
};
