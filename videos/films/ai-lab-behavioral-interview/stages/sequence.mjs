import {
  drawArtifactBox,
  drawArtifactLine,
  drawArtifactText,
  originalCueProgress,
  withArtifactFocus,
} from '../defaults.mjs';
export function drawSequence(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  const { C: themeColors } = api;
  {
    const service = currentBeat > 0 ? originalCueProgress(ctx, api, 'sequence-service-repair') : 0,
      release = currentBeat > 0 ? originalCueProgress(ctx, api, 'sequence-release-approval') : 0,
      hold = currentBeat > 0 ? originalCueProgress(ctx, api, 'sequence-beat-2-focus-1') : 0,
      x = release > 0 ? 930 + 570 * release : service > 0 ? 360 + 570 * service : 360;
    const xs = [350, 960, 1570],
      owners = [
        'You · reproduce + write gate',
        'Service owner · repair path',
        'Release owner · approve stage',
      ];
    owners.forEach((s, i) =>
      drawArtifactBox(
        ctx,
        api,
        ['sequence-node-hold', 'sequence-node-repair', 'sequence-node-review'][i],
        s,
        xs[i] - 260,
        300,
        520,
        110,
        [themeColors.blue, themeColors.cyan, themeColors.green][i],
        27,
      ),
    );
    withArtifactFocus(ctx, api, 'sequence-node-failure', () => {
      drawArtifactLine(ctx, api, 180, 575, 1740, 575, themeColors.muted, 3);
      drawArtifactBox(
        ctx,
        api,
        'sequence-retained-receipt',
        'B17 · acl-denied-snippet\nExpected DENY · restricted text observed',
        x - 335,
        640,
        670,
        120,
        themeColors.pink,
        27,
      );
      drawArtifactText(
        ctx,
        api,
        'Same offline request / response receipt',
        960,
        510,
        32,
        themeColors.yellow,
      );
    });
    drawArtifactText(
      ctx,
      api,
      currentBeat === 0
        ? 'Product proposes learning through a 5% canary'
        : 'Release check keeps candidate exposure at zero',
      960,
      875,
      31,
      themeColors.yellow,
    );
    drawArtifactText(
      ctx,
      api,
      service >= 1
        ? 'Service repair candidate B18 · verification follows offline'
        : 'B17 failure retained; repair not yet verified',
      960,
      960,
      28,
      service >= 1 ? themeColors.cyan : themeColors.muted,
    );
    drawArtifactText(
      ctx,
      api,
      'A recommendation, a technical repair and approval have different owners',
      960,
      1040,
      27,
      themeColors.muted,
    );
  }
}
export default {
  id: 'sequence',
  draw: drawSequence,
  cues: [
    'sequence-beat-1-focus-1',
    'sequence-beat-2-focus-1',
    'sequence-service-repair',
    'sequence-your-check',
    'sequence-release-approval',
  ],
};
