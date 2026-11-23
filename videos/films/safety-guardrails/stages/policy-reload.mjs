import { guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismArrow,
  drawGuardMechanismBlock,
  drawGuardMechanismLabel,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
import { createHash } from 'node:crypto';
export function paintPolicyReload(ctx, scene, state, api, themeColors, currentBeat, cueProgress) {
  if (currentBeat === 0) {
    const sourceA = '{"threshold":0.8}',
      sourceB = '{ "threshold": 0.8 }';
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'policy-validation',
      'Validate the candidate before activation',
      [
        '≤ 65,536 decoded characters',
        'reject duplicate keys · exact known fields',
        'threshold types / domain · known action policy',
      ],
      150,
      300,
      1620,
      255,
      themeColors.yellow,
      33,
    );
    withGuardMechanismFocus(ctx, api, 'policy-hash', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Hash these two policy fragments',
        180,
        590,
        27,
        themeColors.muted,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        sourceA,
        180,
        655,
        35,
        themeColors.blue,
        'left',
        true,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        sourceB,
        1030,
        655,
        35,
        themeColors.cyan,
        'left',
        true,
      );
      const q = cueProgress('policy-reload-hash', 0);
      if (q === 1) {
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          createHash('sha256').update(sourceA).digest('hex').slice(0, 24) + '…',
          180,
          735,
          27,
          themeColors.blue,
          'left',
          true,
        );
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          createHash('sha256').update(sourceB).digest('hex').slice(0, 24) + '…',
          1030,
          735,
          27,
          themeColors.cyan,
          'left',
          true,
        );
      }
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Same parsed threshold · different decoded-text digests',
        960,
        865,
        32,
        themeColors.yellow,
        'center',
      );
    });
  } else if (currentBeat === 1) {
    const q = cueProgress('policy-reload-retain', 1),
      copy = cueProgress('policy-reload-copy', 1);
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'policy-active',
      'Active validated policy',
      ['revision 7', 'trigger: 0.80'],
      155,
      350,
      600,
      240,
      themeColors.green,
      37,
    );
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'policy-active',
      'Replacement file',
      [
        'invalid / missing / unreadable',
        q === 1 ? 'Keep serving revision 7' : 'validate complete candidate',
      ],
      1040,
      350,
      730,
      240,
      themeColors.pink,
      31,
    );
    withGuardMechanismFocus(ctx, api, 'policy-copy', () => {
      drawGuardMechanismText(ctx, api, themeColors, 'Request copy', 190, 750, 33, themeColors.blue);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'revision 7 · trigger 0.80',
        190,
        825,
        33,
        themeColors.blue,
      );
      if (copy > 0) {
        drawGuardMechanismArrow(ctx, api, themeColors, 470, 625, 470, 685, themeColors.blue);
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          'Each request keeps its own editable copy',
          960,
          950,
          29,
          themeColors.yellow,
          'center',
        );
      }
    });
  } else {
    withGuardMechanismFocus(ctx, api, 'policy-unknown', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Unknown signal',
        170,
        310,
        35,
        themeColors.yellow,
      );
      ['read', 'privileged action'].forEach((s, i) => {
        drawGuardMechanismText(ctx, api, themeColors, s, 210, 450 + i * 190, 34, themeColors.blue);
        drawGuardMechanismArrow(
          ctx,
          api,
          themeColors,
          620,
          435 + i * 190,
          1080,
          435 + i * 190,
          themeColors.yellow,
        );
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          i ? 'REQUIRE APPROVAL' : 'BLOCK',
          1180,
          450 + i * 190,
          36,
          themeColors.pink,
        );
      });
    });
    drawGuardMechanismLabel(
      ctx,
      api,
      themeColors,
      'policy-write',
      'Executor permissions apply to every write',
      960,
      855,
      32,
      themeColors.pink,
      'center',
    );
  }
}
export function drawPolicyReload(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintPolicyReload(ctx, scene, state, api, themeColors, currentBeat, cueProgress);
}
export default {
  id: 'policy-reload',
  draw: drawPolicyReload,
  cues: [
    'policy-reload-validate',
    'policy-reload-hash',
    'policy-reload-retain',
    'policy-reload-copy',
    'policy-reload-unknown',
    'policy-reload-write',
  ],
};
