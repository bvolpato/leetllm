import { AUTH } from '../fixtures.mjs';
import { authorizedSearch, deploymentFrame } from '../model.mjs';
import { cell, geometryText, heading, line } from '../defaults.mjs';
export function drawDeployment(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z),
    cue = (id) => {
      const c = state.cues?.[id];
      return c?.phase === 'before' ? 0 : c?.phase === 'after' ? 1 : (c?.progress ?? cueProgress());
    };
  {
    const rec = true,
      q = cueProgress(),
      pre = false,
      k = currentBeat === 0 ? 1 : currentBeat === 1 ? (cue('widen-shortlist') > 0.35 ? 2 : 1) : 1,
      run = authorizedSearch(k, false);
    heading(
      ctx,
      api,
      'Trusted search diagnostic · same query signs1010 · permission checked before text fetch',
    );
    {
      const current = deploymentFrame(currentBeat, progress, state.cues),
        rows = authorizedSearch(3, true).survivors;
      api.focus.target('retrieval-access-filter', () => {
        [
          [330, 535],
          [665, 705],
          [835, 930],
        ].forEach(([a, z]) => line(ctx, api, 850, a, 850, z, themeColors.yellow, 4));
        geometryText(ctx, api, 'Current permission', 850, 300, 28, themeColors.yellow, 'center');
        if (current.filter === 1)
          geometryText(
            ctx,
            api,
            '2 eligible · 1 excluded',
            850,
            1010,
            28,
            themeColors.yellow,
            'center',
          );
      });
      AUTH.rows.forEach((r, i) => {
        const x = r.allow ? 230 + 760 * current.filter : 230,
          y = 390 + i * 170;
        cell(ctx, api, r.id, x, y, 430, 90, r.allow ? themeColors.blue : themeColors.pink);
        if (!r.allow && current.filter > 0.8)
          geometryText(
            ctx,
            api,
            'DENIED before evidence fetch',
            480,
            y + 145,
            24,
            themeColors.pink,
            'center',
          );
      });
      api.focus.target('eligible-score-results', () => {
        geometryText(
          ctx,
          api,
          current.rank === 1 ? '2 eligible passages scored' : 'Score approved rows',
          1530,
          500,
          28,
          themeColors.green,
          'center',
        );
        if (current.rank > 0)
          rows.forEach((r, i) => {
            const y = 625 + i * 170;
            geometryText(
              ctx,
              api,
              current.rank > 0.8 ? r.id + ' · cosine ' + r.cosine.toFixed(3) : r.id + ' · score ?',
              1630,
              y,
              27,
              themeColors.green,
              'center',
            );
          });
      });
      if (current.filter === 1)
        geometryText(ctx, api, 'approved rows only', 1210, 910, 26, themeColors.green, 'center');
      if (currentBeat === 1) {
        api.focus.target('retrieval-byte-cost', () =>
          geometryText(
            ctx,
            api,
            '4D: FP32 16 B · signs 1 B',
            1480,
            370,
            27,
            themeColors.cyan,
            'center',
          ),
        );
        api.focus.target('retrieval-quality', () =>
          geometryText(
            ctx,
            api,
            'Filtered toy: target survives at K 1',
            1460,
            1050,
            26,
            themeColors.pink,
            'center',
          ),
        );
      }
      if (currentBeat === 2) {
        api.focus.target('retrieval-latency', () =>
          geometryText(
            ctx,
            api,
            'Include retained-vector fetch and rescore time',
            1430,
            965,
            27,
            themeColors.yellow,
            'center',
          ),
        );
        geometryText(
          ctx,
          api,
          'encoder / width / normalization / metric / codec / index generation',
          960,
          1050,
          27,
          themeColors.muted,
          'center',
        );
      }
    }
    return;
  }
  return;
}
export default {
  id: 'deployment',
  draw: drawDeployment,
  cues: [
    'deployment-retrieval-access-filter-b1-1',
    'deployment-rank-eligible',
    'deployment-retrieval-byte-cost-b2-1',
    'deployment-retrieval-quality-b2-2',
    'deployment-retrieval-latency-b3-1',
  ],
};
