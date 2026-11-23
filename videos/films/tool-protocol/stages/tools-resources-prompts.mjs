import { linearInterpolate } from '../arithmetic.mjs';
import { chip, codePanel, footer, line, text } from '../defaults.mjs';
export function drawToolsResourcesPrompts(ctx, scene, state, api) {
  return api.focus.target('tools-resources-prompts-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueProgress = (key) => api.focus.progress(`t-tools-resources-prompts-${key}`, 0),
      cueVisible = (key) => api.focus.visible(`t-tools-resources-prompts-${key}`);
    {
      if (currentBeat < 2) {
        line(ctx, api, 1030, 300, 1750, 300, themeColors.muted);
        line(ctx, api, 1750, 300, 1750, 840, themeColors.muted);
        line(ctx, api, 1030, 840, 1750, 840, themeColors.muted);
        text(ctx, api, 'host conversation context', 1390, 345, 33, themeColors.blue);
        const rows = [
          ['tool proposal', 'get_release_status(v17)', 'tool', themeColors.blue],
          ['selected resource', 'pinned rollback runbook', 'resource', themeColors.cyan],
          ['chosen prompt', 'release review template', 'prompt', themeColors.yellow],
        ];
        rows.forEach(([label, value, key, col], i) => {
          const y = 390 + i * 165;
          text(ctx, api, label, 380, y - 35, 28, col);
          chip(ctx, api, value, 150, y, 650, col, 85, 29);
          const q = cueProgress(key);
          if (q > 0)
            chip(ctx, api, value, linearInterpolate(820, 1110, q), y + 5, 550, col, 75, 26);
        });
        footer(
          ctx,
          api,
          'Model, application and user control different selections; none of these grants a new permission.',
        );
      } else {
        chip(ctx, api, 'advertised input schema', 180, 310, 1560, themeColors.blue, 85, 32);
        if (cueVisible('schema')) {
          codePanel(
            ctx,
            api,
            'provider function format',
            ['name: get_release_status', 'arguments: release ID string'],
            180,
            460,
            720,
            260,
            themeColors.cyan,
          );
          codePanel(
            ctx,
            api,
            'model proposal',
            ['name: get_release_status', 'release_id: reranker-v17'],
            1020,
            460,
            720,
            260,
            themeColors.blue,
          );
        }
        if (cueVisible('policy'))
          chip(
            ctx,
            api,
            'host checks the actual proposal before client invocation',
            300,
            810,
            1320,
            themeColors.yellow,
            80,
            31,
          );
        footer(
          ctx,
          api,
          'A pinned passage or selected template remains context, not tool authority.',
        );
      }
    }
  });
}
export default {
  id: 'tools-resources-prompts',
  draw: drawToolsResourcesPrompts,
  cues: [
    'tools-resources-prompts-beat-1-focus-1',
    't-tools-resources-prompts-tool',
    'tools-resources-prompts-beat-2-focus-1',
    'tools-resources-prompts-beat-2-focus-2',
    't-tools-resources-prompts-resource',
    't-tools-resources-prompts-prompt',
    'tools-resources-prompts-beat-3-focus-1',
    'tools-resources-prompts-beat-3-focus-2',
    't-tools-resources-prompts-schema',
    't-tools-resources-prompts-policy',
  ],
};
