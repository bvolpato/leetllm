import { phase } from '../arithmetic.mjs';
import { sampleOriginalModel } from '../construction.mjs';
import { legacyCard, refinedCard, refinedText } from '../defaults.mjs';
function drawLegacyContractBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleOriginalModel('contract-boundary', state);
  {
    const request = api.focus.target('api-caller', () =>
      legacyCard(ctx, api, 'Caller request', 60, 400, 320, 105, themeColors.blue, 25),
    );
    const auth = api.focus.target('authenticated-server', () =>
      legacyCard(ctx, api, 'Authenticate + authorize', 425, 400, 340, 105, themeColors.cyan, 24),
    );
    const wrapper = api.focus.target('shared-api-wrapper', () =>
      legacyCard(
        ctx,
        api,
        'Wrapper · trace · deadline',
        810,
        400,
        340,
        105,
        themeColors.yellow,
        20,
      ),
    );
    const adapter = api.focus.target('provider-adapter', () =>
      legacyCard(ctx, api, 'Provider adapter', 1195, 400, 320, 105, themeColors.green, 25),
    );
    const provider = legacyCard(ctx, api, 'Model API', 1560, 400, 300, 105, themeColors.pink, 25);
    api.connect(ctx, request, auth, {
      color: themeColors.cyan,
      gap: 12,
    });
    api.connect(ctx, auth, wrapper, {
      color: themeColors.cyan,
      gap: 12,
    });
    api.connect(ctx, wrapper, adapter, {
      color: themeColors.cyan,
      gap: 12,
    });
    api.connect(ctx, adapter, provider, {
      color: themeColors.cyan,
      gap: 12,
    });
    if (modelState.step > 0) {
      api.focus.target('server-secret', () =>
        legacyCard(
          ctx,
          api,
          'Server secret stays on the server',
          420,
          690,
          620,
          90,
          themeColors.yellow,
          24,
        ),
      );
      legacyCard(
        ctx,
        api,
        'Trusted facts · P-7 · prompt version',
        1120,
        690,
        650,
        90,
        themeColors.green,
        24,
      );
    }
    if (modelState.step > 1)
      api.focus.target('validated-api-result', () =>
        legacyCard(
          ctx,
          api,
          'Typed result returns after validation',
          535,
          870,
          850,
          90,
          themeColors.blue,
          26,
        ),
      );
    void 0;
  }
}
export function drawContractBoundary(ctx, scene, state, api) {
  if (!state.cues) {
    drawLegacyContractBoundary(ctx, scene, state, api);
    return;
  }
  const { C: themeColors } = api,
    currentBeat = state.beat,
    u = api.focus.progress('ap-contract-boundary-' + currentBeat),
    done = u >= 0.999999;
  {
    const names = ['caller', 'auth + access', 'wrapper', 'adapter', 'provider'],
      xs = [90, 440, 790, 1140, 1490],
      nodes = names.map((n, i) =>
        refinedCard(
          ctx,
          api,
          n,
          xs[i],
          420,
          300,
          100,
          [
            themeColors.blue,
            themeColors.green,
            themeColors.yellow,
            themeColors.cyan,
            themeColors.pink,
          ][i],
          27,
        ),
      );
    nodes.slice(0, -1).forEach((n, i) =>
      api.connect(ctx, n, nodes[i + 1], {
        color: themeColors.cyan,
        gap: 15,
      }),
    );
    const x =
      currentBeat === 0
        ? 110 + 350 * phase(u, 0.1, 0.8)
        : currentBeat === 1
          ? 810 + 700 * phase(u, 0.1, 0.8)
          : 1510 - 1050 * phase(u, 0.1, 0.75);
    refinedCard(
      ctx,
      api,
      currentBeat === 2 ? 'candidate T-17' : 'intent T-17',
      x,
      650,
      220,
      80,
      currentBeat === 2 ? themeColors.yellow : themeColors.cyan,
      25,
    );
    if (currentBeat >= 1)
      api.focus.target('server-secret', () =>
        refinedCard(ctx, api, 'secret stays server-side', 500, 810, 900, 85, themeColors.green, 30),
      );
    if (currentBeat === 2)
      api.focus.target('validated-api-result', () =>
        refinedCard(
          ctx,
          api,
          done ? 'candidate enters shared validator' : 'candidate returning to validator',
          420,
          930,
          1080,
          80,
          themeColors.green,
          30,
        ),
      );
    for (const [target, i] of [
      ['api-caller', 0],
      ['authenticated-server', 1],
      ['shared-api-wrapper', 2],
      ['provider-adapter', 3],
    ])
      api.focus.target(target, () =>
        refinedText(
          ctx,
          api,
          i === 0
            ? 'account 10234'
            : i === 1
              ? 'tenant checked'
              : i === 2
                ? 'trace + deadline'
                : 'wire mapping',
          xs[i] + 150,
          370,
          23,
          themeColors.muted,
          'center',
        ),
      );
  }
}
export default {
  id: 'contract-boundary',
  draw: drawContractBoundary,
  cues: [
    'authenticated-server-b1-1',
    'ap-contract-boundary-0',
    'server-secret-b2-1',
    'ap-contract-boundary-1',
    'validated-api-result-b3-1',
    'ap-contract-boundary-2',
  ],
};
