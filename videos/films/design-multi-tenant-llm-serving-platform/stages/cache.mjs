import { clamp } from '../arithmetic.mjs';
import { sampleModel } from '../observations.mjs';
import { drawTenantCard, drawTenantText } from '../defaults.mjs';
export function drawCache(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('cache', state),
    currentBeat = modelState.step;
  const transfer = (source, target, color = themeColors.cyan, p = modelState.q) =>
    teaching.transfer({
      source: {
        shape: source,
        opacity: 1,
      },
      target: {
        shape: target,
        opacity: 1,
      },
      progress: p,
      color,
      particle: {
        radius: 8,
        fill: color,
      },
    });
  {
    drawTenantText(
      ctx,
      api,
      modelState.step
        ? 'A changed permission revision changes the request key'
        : 'A request pins its exact adapter for the batch lifetime',
      960,
      280,
      34,
      themeColors.ink,
      'center',
    );
    const request = drawTenantCard(
      ctx,
      api,
      'Request A-1 · Alice / tenant A',
      140,
      365,
      650,
      themeColors.blue,
      105,
      32,
    );
    const adapter = api.focus.target('cache-immutable-adapter-docs-v2', () =>
      drawTenantCard(
        ctx,
        api,
        'Immutable adapter docs-v2',
        1130,
        365,
        650,
        themeColors.cyan,
        105,
        32,
      ),
    );
    drawTenantCard(
      ctx,
      api,
      'Request ACL ' + modelState.acl,
      140,
      580,
      650,
      modelState.changed ? themeColors.yellow : themeColors.blue,
      100,
      35,
    );
    api.focus.target('cache-stored-prefix-acl-v1', () =>
      drawTenantCard(ctx, api, 'Stored prefix · ACL v1', 1130, 580, 650, themeColors.cyan, 100, 35),
    );
    if (modelState.activeReferences) {
      transfer(request, adapter, themeColors.blue, clamp((modelState.q - 0.12) / 0.18));
      drawTenantText(
        ctx,
        api,
        'PIN A-1 · active reference 1',
        1455,
        520,
        28,
        themeColors.yellow,
        'center',
      );
    } else
      drawTenantText(
        ctx,
        api,
        modelState.retired
          ? 'A-1 retired · active references 0'
          : 'Adapter available · active references 0',
        1455,
        520,
        27,
        themeColors.muted,
        'center',
      );
    if (modelState.step) {
      const gate = drawTenantCard(
        ctx,
        api,
        'Authorize Alice in A',
        690,
        760,
        540,
        themeColors.green,
        90,
        31,
      );
      drawTenantText(
        ctx,
        api,
        modelState.hit
          ? 'Compatible prefix may be read'
          : 'ACL v2 request cannot reuse ACL v1 entry',
        960,
        910,
        34,
        modelState.hit ? themeColors.green : themeColors.pink,
        'center',
      );
      if (modelState.changed)
        drawTenantText(
          ctx,
          api,
          'MISS · evaluate fresh permitted context',
          960,
          990,
          29,
          themeColors.yellow,
          'center',
        );
      else
        drawTenantText(
          ctx,
          api,
          'Resolve authority and compatible identity before reuse',
          960,
          990,
          28,
          themeColors.muted,
          'center',
        );
    } else {
      api.focus.target(
        'cache-s-attempted-s-evictable-eviction-permitted-after-retirement-eviction',
        () =>
          drawTenantCard(
            ctx,
            api,
            modelState.attempted
              ? modelState.evictable
                ? 'Eviction permitted after retirement'
                : 'Eviction requested · WAIT for A-1'
              : 'Another tenant needs a cache slot',
            425,
            775,
            1070,
            modelState.attempted
              ? modelState.evictable
                ? themeColors.green
                : themeColors.pink
              : themeColors.muted,
            100,
            32,
          ),
      );
    }
  }
}
export default {
  id: 'cache',
  draw: drawCache,
  cues: [
    'cache-beat-1-focus-1',
    'cache-beat-1-focus-2',
    'cache-beat-2-focus-1',
    'cache-beat-2-focus-2',
  ],
};
