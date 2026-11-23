import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionPacket,
  drawConstructionText,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawSharingContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('sharing-contract', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'sharing-contract', () => {
    drawConstructionBox(
      ctx,
      api,
      'One frozen compatible weight artifact',
      480,
      280,
      960,
      100,
      themeColors.cyan,
      34,
    );
    const owners = [
      {
        id: 'A-1',
        principal: 'Alice',
        tenant: 'A',
        color: themeColors.blue,
      },
      {
        id: 'B-1',
        principal: 'Bob',
        tenant: 'B',
        color: themeColors.pink,
      },
    ];
    owners.forEach((o, i) => {
      const y = 475 + i * 210;
      drawConstructionText(ctx, api, o.principal + ' / ' + o.tenant, 130, y - 25, 29, o.color);
      ['evidence', 'history', 'adapter', 'usage'].forEach((v, j) =>
        drawConstructionBox(ctx, api, o.id + ' · ' + v, 450 + j * 330, y, 280, 90, o.color, 25),
      );
      if (currentBeat === 0)
        drawConstructionPacket(
          ctx,
          api,
          'sharing-contract',
          o.id,
          130,
          y + 100,
          1490,
          y + 100,
          modelState.laneProgress,
          o.color,
          230,
          45,
        );
    });
    if (currentBeat === 1) {
      drawConstructionBox(
        ctx,
        api,
        modelState.weightVisible ? modelState.weightGB + ' GB / copy' : '72 billion × 2 bytes = ?',
        230,
        880,
        650,
        90,
        modelState.weightVisible ? themeColors.green : themeColors.muted,
        31,
      );
      drawConstructionBox(
        ctx,
        api,
        modelState.copiesVisible
          ? modelState.copiesTB + ' TB for 100 copies'
          : '100 copies × same artifact = ?',
        1040,
        880,
        650,
        90,
        modelState.copiesVisible ? themeColors.green : themeColors.muted,
        31,
      );
    } else if (currentBeat === 2)
      drawConstructionCenter(
        ctx,
        api,
        'Identity → scoped state → admission → service share → usage → retirement',
        960,
        935,
        29,
        themeColors.yellow,
      );
    drawConstructionFoot(
      ctx,
      api,
      'Sharing weights changes storage duplication; the request lanes retain their readers and state',
    );
  });
}
export default {
  id: 'sharing-contract',
  draw: drawSharingContract,
  cues: [
    'mt-sharing-contract-b0',
    'mt-sharing-contract-b1',
    'mt-sharing-contract-s1-0',
    'mt-sharing-contract-s1-1',
    'mt-sharing-contract-b2',
  ],
};
