import { evidence } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { verifierScore } from '../model.mjs';
import { card, mechanismFocus, mechanismText, text, visualFocus } from '../defaults.mjs';
function drawDistinctEvidenceBoundary(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    extra = currentBeat === 3;
  if (!extra) return false;
  const { C: themeColors } = api;
  mechanismFocus(ctx, api, extra ? 'search-completion' : 'search-mechanism', () => {
    mechanismText(
      ctx,
      api,
      'Fixed authored candidates · distinct trusted IDs',
      960,
      275,
      38,
      themeColors.yellow,
      'center',
    );
    mechanismText(ctx, api, 'run R42', 450, 400, 37, themeColors.blue, 'center');
    mechanismText(ctx, api, 'run R42', 960, 400, 37, themeColors.muted, 'center');
    mechanismText(ctx, api, 'invented ID', 1470, 400, 37, themeColors.pink, 'center');
    api.line(ctx, 925, 450, 995, 520, themeColors.pink, 4);
    api.line(ctx, 995, 450, 925, 520, themeColors.pink, 4);
    api.line(ctx, 1435, 450, 1505, 520, themeColors.pink, 4);
    api.line(ctx, 1505, 450, 1435, 520, themeColors.pink, 4);
    api.arrow(ctx, 450, 470, 450, 650, themeColors.blue, 4);
    mechanismText(ctx, api, 'Set membership counts once', 960, 770, 37, themeColors.cyan, 'center');
    mechanismText(
      ctx,
      api,
      'Score = ' +
        verifierScore({
          route: 'quality',
          evidence: ['run R42', 'run R42', 'invented ID'],
        }),
      960,
      900,
      48,
      themeColors.green,
      'center',
    );
    mechanismText(
      ctx,
      api,
      'Selection budget in a list does not measure a real generator',
      960,
      1020,
      31,
      themeColors.muted,
      'center',
    );
  });
  return true;
}
export function drawSearch(ctx, scene, state, api) {
  if (drawDistinctEvidenceBoundary(ctx, scene, state, api)) return;
  const { C: themeColors } = api;
  const modelState = sampleModel('search', state);
  {
    visualFocus(ctx, api, 'search-object-rag-evaluation-run-r42-citation-precision-39', () =>
      text(
        ctx,
        api,
        'RAG evaluation · run R42 · citation precision',
        960,
        310,
        28,
        themeColors.muted,
        'center',
      ),
    );
    visualFocus(ctx, api, 'search-simulation-40', () =>
      modelState.candidates.forEach((row, index) => {
        const y = 390 + index * 112;
        const chosen = row.action === modelState.chosen.action;
        card(
          ctx,
          api,
          row.action.replaceAll('_', ' '),
          245,
          y,
          950,
          78,
          chosen ? themeColors.green : themeColors.blue,
          23,
        );
        const checkedEvidence = [...new Set(row.evidence.filter((id) => evidence.has(id)))];
        const evidenceLabel = checkedEvidence.length
          ? checkedEvidence.map((id) => id.replaceAll('_', ' ')).join(' + ')
          : 'no trusted evidence';
        card(
          ctx,
          api,
          evidenceLabel + ' · score ' + row.score,
          1230,
          y,
          450,
          78,
          chosen ? themeColors.yellow : themeColors.cyan,
          20,
        );
      }),
    );
    visualFocus(ctx, api, 'search-budget', () =>
      text(
        ctx,
        api,
        'candidate budget · ' + modelState.budget,
        960,
        850,
        27,
        themeColors.yellow,
        'center',
      ),
    );
    if (modelState.unsafeVisible) {
      const y = 900;
      visualFocus(ctx, api, 'search-object-unsafe-action-delete-evaluation-report-44', () =>
        card(
          ctx,
          api,
          'Unsafe action · delete evaluation report',
          280,
          y,
          850,
          72,
          themeColors.pink,
          23,
        ),
      );
      card(
        ctx,
        api,
        'same evidence score · ' + modelState.unsafeScore,
        1180,
        y,
        470,
        72,
        themeColors.pink,
        22,
      );
    }
    {
    }
  }
}
export default {
  id: 'search',
  draw: drawSearch,
  cues: [
    'search-beat-1-focus-1',
    'search-beat-2-focus-1',
    'search-beat-2-focus-2',
    'search-four-candidates',
    'search-beat-3-focus-1',
    'search-beat-3-focus-2',
    'search-core-completion',
  ],
};
