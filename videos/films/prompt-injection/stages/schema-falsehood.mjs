import { PI_SOURCE } from '../fixtures.mjs';
import { promptCueSnapshot } from '../construction.mjs';
import { drawPromptCard, drawPromptCells, drawPromptRows, drawPromptText } from '../defaults.mjs';
export function drawSchemaFalsehood(ctx, scene, state, api) {
  return paintSchemaFalsehood(ctx, scene, state, api);
}
function paintSchemaFalsehood(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = promptCueSnapshot('schema-falsehood', state),
    {
      b: currentBeat,
      p: progress,
      progress: sentenceProgress,
      P: cueProgress,
      D: resultComplete,
    } = modelState;
  const withMechanismFocus = (paint) => api.focus.target('pi-schema-falsehood-mechanism', paint);
  const active = Math.min(4, Math.floor(sentenceProgress * 5));
  withMechanismFocus(() => {
    const expected = {
        ...PI_SOURCE,
        gate: 'failed',
      },
      proposed = {
        candidate: 'C17',
        suite: 'R42',
        gate: 'passed',
      };
    drawPromptText(ctx, api, 'Proposed, well-typed', 170, 320, 31, themeColors.blue);
    drawPromptText(ctx, api, 'Expected source', 1050, 320, 31, themeColors.green);
    drawPromptRows(ctx, api, Object.entries(proposed), 170, 410, 700, {
      active: active % 3,
    });
    drawPromptRows(
      ctx,
      api,
      Object.entries(expected).filter(([k]) => k !== 'source_id'),
      1050,
      410,
      700,
      {
        active: active % 3,
      },
    );
    if (currentBeat === 0 && resultComplete('pi-false-reject', sentenceProgress > 0.6))
      drawPromptCard(
        ctx,
        api,
        'Shape passes · exact source comparison rejects gate',
        170,
        790,
        1580,
        themeColors.pink,
        100,
        30,
      );
    else if (currentBeat === 1) {
      drawPromptCard(
        ctx,
        api,
        'Necessary: approval is required before release',
        170,
        745,
        1580,
        themeColors.green,
        80,
        30,
      );
      if (sentenceProgress > 0.4)
        drawPromptCard(
          ctx,
          api,
          'Unsupported inference: approval alone authorizes release',
          170,
          855,
          1580,
          themeColors.pink,
          80,
          29,
        );
    } else if (currentBeat === 2) {
      drawPromptCells(ctx, api, ['shape', 'support', 'authority'], 250, 775, {
        size: 150,
        gap: 320,
        color: themeColors.cyan,
      });
      drawPromptText(
        ctx,
        api,
        'Eligibility stays unresolved until every required crossing is earned',
        960,
        965,
        28,
        themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'schema-falsehood',
  draw: drawSchemaFalsehood,
  cues: [
    'pi-schema-falsehood-0',
    'pi-false-reject',
    'pi-schema-falsehood-1',
    'pi-schema-falsehood-2',
  ],
};
