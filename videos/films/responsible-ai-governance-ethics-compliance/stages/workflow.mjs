import { workflows } from '../fixtures.mjs';
import { cueProgress, governancePermission } from '../construction.mjs';
import { triage } from '../model.mjs';
import {
  drawGovernanceConstructionBox,
  drawGovernanceConstructionFlight,
  drawGovernanceConstructionFooter,
  drawGovernanceConstructionRows,
  drawGovernanceConstructionText,
} from '../defaults.mjs';
function paintGovernanceMechanism(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress2 = (id) => cueProgress(state, id),
    resultComplete = (id) => governancePermission(state, id);
  return api.focus.target('workflow-mechanism', () => {
    {
      drawGovernanceConstructionBox(
        ctx,
        api,
        'Same general-purpose model',
        610,
        280,
        700,
        themeColors.blue,
      );
      const examples =
        currentBeat === 2
          ? [
              {
                name: 'Incomplete intake',
                flags: [null, null, null, null],
                cue: 'unknown-route',
              },
            ]
          : [
              {
                ...workflows[1],
                cue: 'credit-route',
              },
              {
                ...workflows[2],
                cue: 'effect-route',
              },
              {
                ...workflows[0],
                cue: 'baseline-route',
              },
            ];
      examples.forEach((v, i) => {
        const y = 445 + i * 165,
          complete = currentBeat > 0 && resultComplete(v.cue),
          route = triage(v.flags);
        drawGovernanceConstructionBox(ctx, api, v.name, 140, y, 470, themeColors.blue, 86);
        drawGovernanceConstructionBox(ctx, api, '', 710, y, 500, themeColors.cyan, 86);
        v.flags.forEach((flag, j) =>
          drawGovernanceConstructionText(
            ctx,
            api,
            flag === null ? '?' : flag ? 'YES' : 'no',
            772.5 + j * 125,
            y + 54,
            28,
            flag === null ? themeColors.pink : flag ? themeColors.cyan : themeColors.ink,
            'center',
          ),
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [640, y + 43],
          [680, y + 43],
          currentBeat === 0 ? state.beatP : cueProgress2(v.cue),
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [1240, y + 43],
          [1320, y + 43],
          cueProgress2(v.cue),
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          complete ? route : 'Review route pending',
          1350,
          y,
          440,
          complete
            ? route === 'Facts review'
              ? themeColors.pink
              : themeColors.green
            : themeColors.muted,
          86,
        );
      });
      ['Credit', 'Workers', 'Interaction', 'Effects'].forEach((label, j) =>
        drawGovernanceConstructionText(
          ctx,
          api,
          label,
          772.5 + j * 125,
          415,
          22,
          themeColors.cyan,
          'center',
        ),
      );
      if (currentBeat === 2) {
        drawGovernanceConstructionRows(
          ctx,
          api,
          [
            '? remains unknown',
            'Legal basis + review date follow the workflow',
            'Model and application responsibilities can coexist',
          ],
          480,
          725,
          themeColors.yellow,
          78,
          32,
        );
      }
      drawGovernanceConstructionFooter(
        ctx,
        api,
        'Engineering intake route / qualified classification still follows jurisdiction, actor and use',
      );
    }
    return true;
  });
}

export function drawWorkflow(ctx, scene, state, api) {
  return api.focus.target('gov-' + scene.id + '-mechanism', () => {
    paintGovernanceMechanism(ctx, scene, state, api);
  });
}
export default {
  id: 'workflow',
  draw: drawWorkflow,
  cues: [
    'gov-workflow-b1',
    'gov-workflow-b2',
    'gov-credit-route',
    'gov-effect-route',
    'gov-baseline-route',
    'gov-workflow-b3',
    'gov-unknown-route',
  ],
};
