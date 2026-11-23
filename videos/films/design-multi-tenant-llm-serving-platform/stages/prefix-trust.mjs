import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionLine,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawPrefixTrust(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('prefix-trust', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'prefix-trust', () => {
    const labels = ['tenant', 'reader', 'ACL', 'model', 'adapter', 'tokenizer', 'layout', 'tokens'];
    drawConstructionCenter(
      ctx,
      api,
      'Stored compatible identity · explicit reader scope',
      960,
      285,
      34,
      themeColors.cyan,
    );
    modelState.key.forEach((v, i) =>
      drawConstructionBox(
        ctx,
        api,
        labels[i] + '\n' + v,
        140 + (i % 4) * 445,
        385 + Math.floor(i / 4) * 155,
        400,
        115,
        i < 3 ? themeColors.blue : themeColors.cyan,
        27,
      ),
    );
    if (currentBeat === 0)
      drawConstructionCenter(
        ctx,
        api,
        'Complete prefix visibility + compatible computation + authorized cache read',
        960,
        900,
        29,
        themeColors.yellow,
      );
    else if (currentBeat === 1) {
      drawConstructionBox(
        ctx,
        api,
        'Caller salt: B / Bob',
        150,
        820,
        650,
        100,
        themeColors.pink,
        31,
      );
      drawConstructionLine(ctx, api, 960, 790, 960, 980, themeColors.pink, 6);
      drawConstructionBox(
        ctx,
        api,
        'Authenticated A / Alice\nB salt grants no membership',
        1110,
        805,
        650,
        130,
        themeColors.yellow,
        28,
      );
    } else {
      drawConstructionBox(
        ctx,
        api,
        'Current request ' + modelState.acl,
        180,
        815,
        700,
        110,
        modelState.miss ? themeColors.yellow : themeColors.blue,
        32,
      );
      drawConstructionBox(
        ctx,
        api,
        'Stored prefix ' + modelState.oldEntry,
        1040,
        815,
        700,
        110,
        themeColors.cyan,
        32,
      );
      if (modelState.miss)
        drawConstructionCenter(
          ctx,
          api,
          'ACL revision changed → stale entry unavailable',
          960,
          985,
          31,
          themeColors.pink,
        );
    }
    drawConstructionFoot(
      ctx,
      api,
      'A cache key partitions compatibility; the cache service still authorizes every read',
    );
  });
}
export default {
  id: 'prefix-trust',
  draw: drawPrefixTrust,
  cues: [
    'mt-prefix-trust-b0',
    'mt-prefix-trust-s0-1',
    'mt-prefix-trust-s0-2',
    'mt-prefix-trust-b1',
    'mt-prefix-trust-s1-1',
    'mt-prefix-trust-s1-3',
    'mt-prefix-trust-b2',
    'mt-prefix-trust-s2-0',
  ],
};
