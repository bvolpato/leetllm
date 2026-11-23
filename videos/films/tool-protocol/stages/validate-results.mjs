import { validationFixture } from '../model.mjs';
import { chip, codePanel, footer, text } from '../defaults.mjs';
export function drawValidateResults(ctx, scene, state, api) {
  return api.focus.target('validate-results-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueComplete = (key) => api.focus.cue(`t-validate-results-${key}`)?.phase === 'after';
    {
      const fixture = validationFixture();
      if (currentBeat === 0) {
        codePanel(
          ctx,
          api,
          'request ID 51',
          ['method: tools/call', 'name: get_release_status', '"arguments": []'],
          150,
          350,
          750,
          350,
        );
        chip(
          ctx,
          api,
          'envelope needs arguments object',
          1060,
          350,
          710,
          themeColors.yellow,
          85,
          30,
        );
        text(ctx, api, 'observed: array', 1415, 550, 35, themeColors.pink);
        if (cueComplete('error')) {
          chip(ctx, api, 'ID 51 · protocol error −32602', 1060, 670, 710, themeColors.red, 100, 32);
          text(ctx, api, 'dispatch stopped', 1415, 840, 31, themeColors.red);
        }
      } else if (currentBeat === 1) {
        codePanel(
          ctx,
          api,
          'request ID 52',
          ['method: tools/call', 'arguments object', 'release_id: missing-release'],
          150,
          350,
          750,
          350,
          themeColors.blue,
        );
        chip(ctx, api, 'recognized status tool', 1060, 350, 710, themeColors.cyan, 85, 30);
        if (cueComplete('lookup'))
          text(ctx, api, 'backend: release not found', 1415, 550, 33, themeColors.yellow);
        if (cueComplete('tool-error'))
          chip(
            ctx,
            api,
            'ID 52 · complete · isError true',
            1060,
            680,
            710,
            themeColors.yellow,
            100,
            31,
          );
      } else {
        codePanel(
          ctx,
          api,
          'reply ID 53',
          [
            'complete · isError false',
            '3 string fields / allowed status',
            'release_id: reranker-v16',
          ],
          150,
          350,
          750,
          350,
          themeColors.blue,
        );
        chip(ctx, api, 'schema gate', 1060, 350, 710, themeColors.cyan, 85, 32);
        if (cueComplete('schema'))
          text(ctx, api, 'field set and types pass', 1415, 525, 32, themeColors.cyan);
        text(ctx, api, 'task target: reranker-v17', 1415, 625, 34, themeColors.yellow);
        if (cueComplete('identity')) {
          chip(
            ctx,
            api,
            'wrong target · observation discarded',
            1030,
            730,
            770,
            themeColors.red,
            100,
            31,
          );
        }
      }
      footer(
        ctx,
        api,
        'Inspect one failing field at its actual dispatch, execution or observation boundary.',
      );
    }
  });
}
export default {
  id: 'validate-results',
  draw: drawValidateResults,
  cues: [
    'validate-results-beat-1-focus-1',
    'validation-envelope-id',
    'validation-envelope-error',
    't-validate-results-error',
    'validate-results-beat-2-focus-1',
    'validation-domain-lookup',
    't-validate-results-lookup',
    't-validate-results-tool-error',
    'validate-results-beat-3-focus-1',
    'validation-schema-check',
    'validation-release-check',
    't-validate-results-schema',
    't-validate-results-identity',
  ],
};
