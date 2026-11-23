import { sampleModel } from '../model.mjs';
import { drawLegacyCard, drawLegacyText } from '../defaults.mjs';
export function drawBoundary(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = sampleModel('boundary', state);
  {
    api.focus.target('boundary-host-kernel-kvm-resource-controls', () =>
      drawLegacyCard(
        ctx,
        api,
        'Host kernel + KVM + resource controls',
        170,
        790,
        1580,
        themeColors.yellow,
        110,
        41,
      ),
    );
    ['TENANT A', 'TENANT B'].forEach((name, i) => {
      const x = 220 + i * 850;
      components.panel({
        x,
        y: 300,
        width: 630,
        height: 380,
        fill: themeColors.panel,
        stroke: i ? themeColors.pink : themeColors.blue,
      });
      drawLegacyText(
        ctx,
        api,
        name,
        x + 315,
        370,
        35,
        i ? themeColors.pink : themeColors.blue,
        'center',
      );
      api.focus.target('boundary-guest-kernel', () =>
        drawLegacyCard(ctx, api, 'Guest kernel', x + 50, 420, 530, themeColors.cyan),
      );
      api.focus.target('boundary-restricted-vmm-process', () =>
        drawLegacyCard(
          ctx,
          api,
          'Restricted VMM process',
          x + 50,
          550,
          530,
          themeColors.green,
          90,
          31,
        ),
      );
    });
    drawLegacyText(
      ctx,
      api,
      'Separate guest kernels · host and VMM remain trusted attack surfaces',
      960,
      985,
      29,
      themeColors.muted,
      'center',
    );
  }
}

// These supplied ownership and byte models are local illustrations, not a VMM or host-security test.
export default {
  id: 'boundary',
  draw: drawBoundary,
  cues: [
    'boundary-beat-1-focus-1',
    'boundary-beat-1-focus-2',
    'boundary-beat-2-focus-1',
    'boundary-beat-2-focus-2',
  ],
};
