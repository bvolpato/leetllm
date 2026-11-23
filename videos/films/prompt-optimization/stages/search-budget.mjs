import { plannedPromptRequests } from '../arithmetic.mjs';
import {
  cueComplete,
  cueProgress,
  detailNote,
  detailPanel,
  detailText,
  progressArrow,
  unitGrid,
} from '../defaults.mjs';
const full = plannedPromptRequests({ trials: 40, cases: 50 });
const format = (n) => n.toLocaleString('en-US');
export function drawSearchBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('search-budget-mechanism', () => {
    if (currentBeat === 0) {
      detailText(ctx, api, '40 full trials × 50 validation cases', 960, 285, 38, themeColors.blue);
      const n = Math.floor(cueProgress(ctx, api, 'trial-work') * 40);
      unitGrid(ctx, api, n, 40, 310, 420, 1300, themeColors.cyan);
      detailText(ctx, api, 'Each mark = one 50-case trial', 960, 640, 29, themeColors.muted);
      if (cueComplete(ctx, api, 'trial-work'))
        detailText(ctx, api, 'Trial executions: 2,000', 960, 745, 37, themeColors.cyan);
      if (cueProgress(ctx, api, 'baseline-work'))
        detailPanel(ctx, api, 'Default-program baseline: +50', 960, 840, themeColors.yellow, 1450);
      if (cueComplete(ctx, api, 'logical-budget'))
        detailText(ctx, api, 'Planned logical executions: 2,050', 960, 945, 38, themeColors.green);
    } else if (currentBeat === 1) {
      detailPanel(ctx, api, '2,050 logical program executions', 960, 280, themeColors.blue, 1400);
      if (cueProgress(ctx, api, 'three-roles')) {
        ['predictor 1', 'predictor 2', 'model judge'].forEach((v, i) => {
          detailPanel(
            ctx,
            api,
            v,
            360 + i * 600,
            500,
            [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
            520,
          );
          progressArrow(
            ctx,
            api,
            960,
            345,
            360 + i * 600,
            430,
            [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
          );
        });
      }
      if (cueComplete(ctx, api, 'request-expansion'))
        detailText(
          ctx,
          api,
          format(full.executions) +
            ' × ' +
            full.roles +
            ' = ' +
            format(full.requests) +
            ' requests',
          960,
          720,
          50,
          themeColors.green,
        );
      if (cueComplete(ctx, api, 'cache-hit'))
        detailText(
          ctx,
          api,
          'One cache hit  →  ' + format(full.requests - 1) + ' requests',
          510,
          860,
          39,
          themeColors.cyan,
        );
      if (cueComplete(ctx, api, 'retry-call'))
        detailText(
          ctx,
          api,
          'One retry instead  →  ' + format(full.requests + 1) + ' requests',
          1410,
          860,
          39,
          themeColors.yellow,
        );
      detailNote(ctx, api, 'Teacher and proposal requests are additional in each scenario.');
    } else {
      if (!cueProgress(ctx, api, 'host-caps')) {
        detailPanel(
          ctx,
          api,
          'Retained plan: 2,050 logical executions',
          960,
          310,
          themeColors.blue,
          1450,
        );
        detailPanel(
          ctx,
          api,
          'Base role calls: 6,150 · other roles stay additional',
          960,
          510,
          themeColors.cyan,
          1450,
        );
      }
      if (cueProgress(ctx, api, 'host-caps')) {
        detailPanel(
          ctx,
          api,
          'Host admission: spend cap + latency cap',
          960,
          310,
          themeColors.yellow,
          1450,
        );
        detailPanel(ctx, api, 'Unknown remote outcome', 500, 510, themeColors.pink, 750);
        detailPanel(
          ctx,
          api,
          'Reserve / reconcile observed use',
          1430,
          510,
          themeColors.yellow,
          770,
        );
        progressArrow(ctx, api, 920, 510, 1000, 510, themeColors.yellow);
      }
      if (cueComplete(ctx, api, 'logical-token-rate'))
        api.math(
          ctx,
          String.raw`2{,}500\ \frac{\text{logical tokens}}{\text{request}}\times100\ \frac{\text{requests}}{\text{s}}=250{,}000\ \frac{\text{logical tokens}}{\text{s}}`,
          960,
          755,
          35,
          themeColors.cyan,
          'center',
        );
      if (cueComplete(ctx, api, 'cost-boundary'))
        detailText(
          ctx,
          api,
          'Logical token rate does not establish billable tokens, dollars or TTFT',
          960,
          925,
          30,
          themeColors.pink,
        );
      detailNote(
        ctx,
        api,
        'Retain role, input/output usage and observed outcome for the actual served artifact-model pair',
      );
    }
  });
  return;
}
export default {
  id: 'search-budget',
  draw: drawSearchBudget,
  cues: [
    'logical-budget',
    'trial-work',
    'baseline-work',
    'request-expansion',
    'cache-hit',
    'retry-call',
    'three-roles',
    'cost-boundary',
    'host-caps',
    'logical-token-rate',
  ],
};
