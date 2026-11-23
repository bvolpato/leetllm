import { ROTATION_RULE } from '../fixtures.mjs';
import { prEvent } from '../construction.mjs';
import { arrow, card, centeredText, extensionFooter, sourcePage } from '../defaults.mjs';
export function drawPinnedBundle(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => prEvent(state, name, beat);
  api.focus.target('pinned-bundle-mechanism', () => {
    const switched = ev('mixed', 1),
      repaired = ev('repair', 1);
    centeredText(
      ctx,
      api,
      'One retained request · child eu-key-v2',
      960,
      280,
      32,
      themeColors.yellow,
    );
    if (currentBeat < 2)
      card(ctx, api, 'Request owns bundle A', 140, 365, 600, 120, themeColors.blue);
    if (currentBeat < 2)
      card(
        ctx,
        api,
        'Global pointer → ' + (currentBeat === 0 ? 'A' : switched > 0 ? 'B' : 'A'),
        1170,
        365,
        600,
        120,
        currentBeat === 0 ? themeColors.blue : themeColors.pink,
      );
    const pa = sourcePage(ctx, api, 150, 610, 730, 360, {
        title: 'A · parent eu-access-v2',
      }),
      pb = sourcePage(ctx, api, 1050, 610, 730, 360, {
        title: 'B · changed parent revision',
        text: ROTATION_RULE.replace('14', '30'),
        color: themeColors.pink,
        version: 'Different revision · not A’s parent',
      });
    if (currentBeat === 0) {
      if (ev('pin', 0) > 0) arrow(ctx, api, 440, 500, 440, 590, themeColors.blue);
    } else if (currentBeat === 1) {
      if (switched > 0 && repaired === 0) {
        arrow(ctx, api, 750, 535, 1020, 590, themeColors.pink);
        centeredText(
          ctx,
          api,
          'A child + B parent → revision mismatch',
          960,
          315,
          29,
          themeColors.pink,
        );
      }
      if (repaired > 0) {
        arrow(ctx, api, 440, 500, 440, 590, themeColors.green);
        centeredText(ctx, api, 'Hold A through parent resolution', 960, 555, 29, themeColors.green);
      }
    } else {
      card(ctx, api, 'Query encoder A · document encoder A', 330, 365, 1260, 120, themeColors.cyan);
      centeredText(
        ctx,
        api,
        ev('migration', 2) > 0
          ? 'Build B alongside A; replay source-span expectations'
          : 'Equal dimensions do not establish compatible spaces',
        960,
        555,
        31,
        themeColors.yellow,
      );
    }
    extensionFooter(
      ctx,
      api,
      'Atomic pointer switch selects a bundle; the request keeps that immutable selection',
    );
  });
}
export default {
  id: 'pinned-bundle',
  draw: drawPinnedBundle,
  cues: ['pr-snapshot', 'pr-pin', 'pr-mixed', 'pr-repair', 'pr-migration', 'pr-switch'],
};
