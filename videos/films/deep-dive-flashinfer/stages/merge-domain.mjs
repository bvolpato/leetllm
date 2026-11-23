import { flashinferExtensionFrame } from '../construction.mjs';
import { extensionCard, extensionText, footer, header } from '../defaults.mjs';
export function drawMergeDomain(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = flashinferExtensionFrame('merge-domain', state),
    { b: currentBeat, p: progress } = modelState;
  return api.focus.target('fi-merge-domain-mechanism', () => {
    header(
      ctx,
      api,
      currentBeat === 2
        ? 'Scale finite coordinates before adding'
        : 'CPU reference: branch on empty mass first',
    );
    if (currentBeat === 0) {
      const rows = [
        ['empty + nonempty', 'return nonempty state'],
        ['empty + empty', 'zero vector, b=−∞'],
      ];
      rows.forEach(([v, z], i) => {
        extensionCard(ctx, api, v, 180, 400 + i * 220, 640, themeColors.blue);
        if (progress > (i + 0.2) / 2)
          extensionCard(ctx, api, z, 1050, 400 + i * 220, 700, themeColors.green);
      });
      extensionText(
        ctx,
        api,
        'Empty convention: zero vector, b=−∞',
        960,
        850,
        34,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      const cases = [
        '−∞−(−∞) is undefined',
        'NaN / +∞ statistic: reject',
        'unequal dimensions: reject',
        'nonzero empty sentinel: reject',
      ];
      cases.forEach((v, i) =>
        extensionCard(
          ctx,
          api,
          progress > (i + 0.2) / 4 ? v : 'validate state',
          250,
          365 + i * 125,
          1400,
          progress > (i + 0.2) / 4 ? themeColors.pink : themeColors.muted,
          85,
        ),
      );
    } else {
      extensionCard(ctx, api, 'A =1e308', 160, 390, 620, themeColors.blue);
      extensionCard(ctx, api, 'B =1e308', 1140, 390, 620, themeColors.pink);
      if (modelState.halfReady) {
        extensionCard(ctx, api, '0.5×A =5e307', 160, 610, 620, themeColors.blue);
        extensionCard(ctx, api, '0.5×B =5e307', 1140, 610, 620, themeColors.pink);
        extensionText(
          ctx,
          api,
          '5e307+5e307 =1e308 (finite)',
          960,
          860,
          39,
          themeColors.green,
          'center',
        );
      } else
        extensionText(
          ctx,
          api,
          'A+B would overflow before division',
          960,
          720,
          35,
          themeColors.pink,
          'center',
        );
    }
    footer(ctx, api, 'CPU empty state: zero output vector and zero normalization mass');
  });
}
export default {
  id: 'merge-domain',
  draw: drawMergeDomain,
  cues: [
    'fi-merge-domain-0',
    'fi-merge-domain-0-result',
    'fi-merge-domain-1',
    'fi-merge-domain-1-result',
    'fi-merge-domain-2',
    'fi-merge-domain-2-result',
    'fi-merge-domain-half',
  ],
};
