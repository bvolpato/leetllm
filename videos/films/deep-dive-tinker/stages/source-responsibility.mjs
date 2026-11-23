import { sentence, tinkerConstruction } from '../construction.mjs';
import {
  drawExtendedCard,
  drawExtendedNote,
  drawExtendedRow,
  drawExtendedText,
} from '../defaults.mjs';
export function drawSourceResponsibility(ctx, scene, state, api) {
  return paintSourceResponsibility(ctx, scene, state, api);
}
function paintSourceResponsibility(ctx, scene, state, api) {
  const { C: themeColors, focus } = api,
    modelState = tinkerConstruction('source-responsibility', state),
    currentBeat = modelState.b;
  const cueProgress = (beat, index) => sentence(state, 'source-responsibility', beat, index);
  return focus.target('tk-source-responsibility-trace', () => {
    drawExtendedText(
      ctx,
      api,
      currentBeat === 0
        ? 'One training client carries exact sequence identities'
        : currentBeat === 1
          ? 'Cookbook conversion owns local learning evidence'
          : 'Separate client contribution from service authority',
      960,
      275,
      32,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 0) {
      const stages = [
        'chunk builder',
        'take-turn sequence',
        'protobuf fields',
        'resource request',
        'API future',
      ];
      stages.forEach((name, i) => {
        drawExtendedText(ctx, api, name, 170, 375 + i * 118, 28, themeColors.blue);
        const visible = Math.min(3, Math.floor(cueProgress(0, Math.min(i, 4)) * 3));
        [0, 1, 2].forEach((seq) =>
          drawExtendedCard(
            ctx,
            api,
            'seq ' + seq + (i === 2 ? ' · wire fields' : ''),
            720 + seq * 330,
            325 + i * 118,
            300,
            90,
            seq < visible ? themeColors.cyan : themeColors.muted,
            26,
          ),
        );
      });
      drawExtendedNote(
        ctx,
        api,
        'Concurrent submission and logical client turn order are separate from hidden worker placement.',
      );
    } else if (currentBeat === 1) {
      drawExtendedRow(ctx, api, 'Supervised targets', [11, 20, 21], 350, themeColors.blue);
      drawExtendedRow(ctx, api, 'Response weights', [0, 1, 1], 470, themeColors.green);
      drawExtendedRow(ctx, api, 'RL advantages', [0, 0.5, 0.5], 590, themeColors.yellow);
      drawExtendedRow(
        ctx,
        api,
        'Backend request',
        ['chosen loss', 'mask removed', 'ordered client'],
        710,
        themeColors.cyan,
      );
      drawExtendedCard(
        ctx,
        api,
        'Export helper: separate downloadable layout',
        430,
        860,
        1060,
        100,
        themeColors.blue,
        31,
      );
      drawExtendedNote(
        ctx,
        api,
        'Renderer, group processing, training loop and export own different transformations.',
      );
    } else {
      drawExtendedRow(
        ctx,
        api,
        'Contribution scope',
        ['client code', 'Cookbook recipe', 'local checks'],
        400,
        themeColors.blue,
      );
      drawExtendedRow(
        ctx,
        api,
        'Operator scope',
        ['catalog / account', 'hosted recovery', 'data agreement'],
        565,
        themeColors.yellow,
      );
      drawExtendedCard(
        ctx,
        api,
        'Public attribution does not grant authority over hosted resources',
        250,
        790,
        1420,
        120,
        themeColors.pink,
        31,
      );
      drawExtendedNote(
        ctx,
        api,
        'Follow source contribution guidance; retain the service ownership boundary.',
      );
    }
  });
}
export default {
  id: 'source-responsibility',
  draw: drawSourceResponsibility,
  cues: [
    'tk-source-responsibility-0-0',
    'tk-source-responsibility-0-1',
    'tk-source-responsibility-0-2',
    'tk-source-responsibility-0-3',
    'tk-source-responsibility-0-4',
    'tk-source-responsibility-1-0',
    'tk-source-responsibility-1-1',
    'tk-source-responsibility-1-2',
    'tk-source-responsibility-1-3',
    'tk-source-responsibility-1-4',
    'tk-source-responsibility-2-0',
    'tk-source-responsibility-2-1',
    'tk-source-responsibility-2-2',
  ],
};
