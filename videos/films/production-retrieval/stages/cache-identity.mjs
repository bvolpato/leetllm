import { prEvent } from '../construction.mjs';
import { arrow, card, centeredText, extensionFooter, meter, sourcePage } from '../defaults.mjs';
export function drawCacheIdentity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => prEvent(state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('cache-identity-mechanism', () => {
    if (currentBeat === 0) {
      const fields = [
        'principal',
        'ACL revision',
        'region',
        'effective date',
        'index bundle',
        'prompt version',
        'model version',
        'source dependencies',
      ];
      fields.forEach((v, i) =>
        card(
          ctx,
          api,
          v,
          150 + (i % 4) * 440,
          370 + Math.floor(i / 4) * 230,
          400,
          135,
          i < 4 ? themeColors.blue : themeColors.cyan,
          29,
        ),
      );
      centeredText(
        ctx,
        api,
        'All required key dimensions precede response reuse',
        960,
        930,
        33,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      sourcePage(ctx, api, 100, 350, 760, 390);
      const age = 10 + 5 * ev('ages', 1);
      centeredText(ctx, api, 'Cached yes · stale age 10', 1410, 390, 32, themeColors.green);
      meter(
        ctx,
        api,
        1080,
        650,
        650,
        age,
        20,
        themeColors.yellow,
        'New request age ' + age.toFixed(1) + ' days',
      );
      api.line(ctx, 1535, 610, 1535, 730, themeColors.pink, 4);
      if (done('ages', 1))
        centeredText(ctx, api, '15 > 14 · cached yes is invalid', 1410, 850, 34, themeColors.pink);
    } else {
      card(
        ctx,
        api,
        'General trace\nversions · permitted IDs · decisions',
        150,
        410,
        700,
        170,
        themeColors.cyan,
      );
      card(
        ctx,
        api,
        'Controlled audit store\nexact inputs and outputs',
        1080,
        410,
        700,
        170,
        themeColors.yellow,
      );
      arrow(ctx, api, 875, 495, 1050, 495, themeColors.yellow);
      centeredText(
        ctx,
        api,
        'Retention and access policy control this copy',
        960,
        850,
        32,
        themeColors.yellow,
      );
    }
    extensionFooter(
      ctx,
      api,
      'Semantic similarity cannot replace policy inputs, current grants or retained dependencies',
    );
  });
}
export default {
  id: 'cache-identity',
  draw: drawCacheIdentity,
  cues: ['pr-key', 'pr-ages', 'pr-audit'],
};
