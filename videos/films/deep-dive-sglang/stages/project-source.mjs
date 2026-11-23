import { phase } from '../arithmetic.mjs';
import { box, extensionText, footer, table, title } from '../defaults.mjs';
export function drawProjectSource(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('project-source-mechanism', () => {
    title(ctx, api, 'Paper, source revision and installed wheel are different evidence');
    if (currentBeat === 0) {
      box(
        ctx,
        api,
        '2024 paper\nprogram / cache / grammar mechanisms',
        200,
        390,
        690,
        160,
        themeColors.blue,
        31,
      );
      box(
        ctx,
        api,
        'Apache-2.0 core source\nseparate checkpoint / data / kernel terms',
        1030,
        390,
        690,
        160,
        themeColors.cyan,
        29,
      );
      extensionText(
        ctx,
        api,
        'Multi-contributor sgl-project · LMSYS incubation',
        960,
        745,
        35,
        themeColors.yellow,
        'center',
      );
      extensionText(
        ctx,
        api,
        'MAINTAINER.md and CODEOWNERS list review responsibilities',
        960,
        865,
        31,
        themeColors.muted,
        'center',
      );
    } else {
      extensionText(ctx, api, 'Exact reading pin', 960, 365, 30, themeColors.muted, 'center');
      extensionText(
        ctx,
        api,
        'f8e62a9224815cc9c6fc56b940eb7fde791a8870',
        960,
        435,
        37,
        themeColors.cyan,
        'center',
      );
      table(
        ctx,
        api,
        [
          ['Source owner', 'Mechanism to inspect'],
          ['API / IR / interpreter', 'named generation / dependencies'],
          ['scheduler / radix cache', 'budget / key / lock'],
          ['grammar / speculative registry', 'per-request next-token state'],
          ['prefill / decode modules', 'reservation / transfer lifecycle'],
        ],
        240,
        545,
        1440,
        76,
        27,
      );
    }
    if (currentBeat) footer(ctx, api, 'For a deployed worker, follow its installed revision.');
  });
}
export default {
  id: 'project-source',
  draw: drawProjectSource,
  cues: ['sg-project-source-beat-0', 'sg-project-source-beat-1'],
};
