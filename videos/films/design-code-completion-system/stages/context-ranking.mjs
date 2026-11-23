import { completionCue } from '../construction.mjs';
import {
  completionCode,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawContextRanking(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    done = (id) => completionCue(state, id) >= 1;
  const drawMechanism = () => {
    completionHeading(ctx, api, 'Authorized candidate files · exact unique-symbol membership');
    const names = [
        'PolicyGraph',
        'ScopeRule',
        'TokenClaims',
        'AuditEvent',
        'Node',
        'Counter',
        'Histogram',
      ],
      sets = [
        new Set(names.slice(0, 3)),
        new Set(['ScopeRule', 'TokenClaims', 'AuditEvent']),
        new Set(['PolicyGraph', 'Node']),
        new Set(['Counter', 'Histogram']),
      ];
    ['Active', 'scope rules', 'policy graph', 'metrics'].forEach((s, j) =>
      completionText(
        ctx,
        api,
        s,
        700 + j * 280,
        370,
        27,
        j === 0 ? themeColors.yellow : themeColors.cyan,
        'center',
      ),
    );
    names.forEach((s, i) => {
      completionCode(ctx, api, s, 180, 450 + i * 60, 25, themeColors.muted);
      sets.forEach((v, j) => {
        api.rect(
          ctx,
          645 + j * 280,
          410 + i * 60,
          110,
          42,
          v.has(s) ? (j === 0 ? themeColors.yellow : themeColors.blue) : themeColors.panel,
          themeColors.muted,
          1,
          3,
        );
      });
    });
    if (currentBeat > 0) {
      ['2 / 4 = 0.5', '1 / 4 = 0.25', '0 / 5 = 0'].forEach((v, j) => {
        const ready =
          currentBeat > 1 ||
          done(['cc-jaccard-half', 'cc-jaccard-quarter', 'cc-jaccard-select'][j]);
        completionText(
          ctx,
          api,
          ready ? v : '…',
          980 + j * 280,
          925,
          31,
          ready ? (j < 2 ? themeColors.green : themeColors.pink) : themeColors.muted,
          'center',
        );
      });
    }
    completionFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Inspect extraction, authorization and index freshness before increasing prompt length'
        : done('cc-jaccard-select')
          ? 'Inclusive threshold 0.25 keeps scope rules and policy graph'
          : 'Build intersection and union from the same authorized membership rows',
    );
  };
  api.focus.target('cc-context-ranking-mechanism', drawMechanism);
  return;
}
export default {
  id: 'context-ranking',
  draw: drawContextRanking,
  cues: [
    'cc-context-ranking-0',
    'cc-context-ranking-1',
    'cc-jaccard-half',
    'cc-jaccard-quarter',
    'cc-jaccard-select',
    'cc-context-ranking-2',
  ],
};
