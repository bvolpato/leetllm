import { sampleSlimeChapter } from '../construction.mjs';
import {
  drawSlimeNote,
  drawSlimeRule,
  drawSlimeText,
  drawSlimeTile,
  drawSlimeTitle,
} from '../defaults.mjs';
export function drawIdentityGroups(ctx, scene, state, api) {
  return api.focus.target('sl-identity-groups-mechanism', () =>
    paintIdentityGroups(ctx, scene, state, api),
  );
}
function paintIdentityGroups(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('identity-groups', state),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  {
    drawSlimeTitle(ctx, api, 'One prompt branches into independent executions');
    drawSlimeTile(ctx, api, 'prompt group P7', 135, 540, 330, themeColors.yellow, 110, 31);
    [0, 1, 2].forEach((i) => {
      const y = 370 + i * 185;
      api.path(
        ctx,
        [
          {
            x: 465,
            y: 595,
          },
          {
            x: 530,
            y: 595,
          },
          {
            x: 530,
            y: y + 44,
          },
          {
            x: 600,
            y: y + 44,
          },
        ],
        {
          color: themeColors.muted,
          width: 2,
        },
      );
      drawSlimeTile(ctx, api, `rollout ${[0, 8, 9][i]}`, 600, y, 310, themeColors.blue, 88, 31);
      for (let j = 0; j < modelState.segments[i]; j++) {
        const x = 1040 + j * 235;
        drawSlimeTile(ctx, api, `S${i + 1}.${j + 1}`, x, y, 205, themeColors.cyan, 88, 31);
        drawSlimeText(
          ctx,
          api,
          `policy ${i === 2 ? 12 : 11}`,
          x + 102,
          y + 135,
          25,
          themeColors.muted,
          'center',
        );
      }
    });
    if (currentBeat === 2 && modelState.identityZero)
      drawSlimeRule(
        ctx,
        api,
        'rollout identity 0 is valid · only None invokes the fallback',
        950,
        themeColors.yellow,
        32,
      );
    else
      drawSlimeRule(
        ctx,
        api,
        modelState.countReady
          ? '1 prompt group · 3 execution identities · 6 Samples'
          : 'Join sibling segments by execution identity',
        950,
        themeColors.cyan,
        34,
      );
    drawSlimeNote(
      ctx,
      api,
      'Prompt group, execution identity and serving version encode different relationships',
    );
    return;
  }
}
export default {
  id: 'identity-groups',
  draw: drawIdentityGroups,
  cues: [
    'sl-identity-groups-b0-operation',
    'sl-identity-groups-b0-s0',
    'sl-identity-groups-b0-s1',
    'sl-identity-groups-b0-s2',
    'sl-identity-groups-b0-s3',
    'sl-identity-groups-b1-operation',
    'sl-identity-groups-b1-s0',
    'sl-identity-groups-b1-s1',
    'sl-identity-groups-b1-s2',
    'sl-identity-groups-b1-s3',
    'sl-identity-groups-b2-operation',
    'sl-identity-groups-b2-s0',
    'sl-identity-groups-b2-s1',
    'sl-identity-groups-b2-s2',
  ],
};
