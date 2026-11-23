import { AUTH } from '../fixtures.mjs';
import { authorizedSearch } from '../model.mjs';
import { cell, geometryText, heading } from '../defaults.mjs';
export function drawAuthorizedFunnel(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z),
    cue = (id) => {
      const c = state.cues?.[id];
      return c?.phase === 'before' ? 0 : c?.phase === 'after' ? 1 : (c?.progress ?? cueProgress());
    };
  {
    const rec = false,
      q = cueProgress(),
      pre = currentBeat === 2 || (currentBeat === 1 && cue('native-filter') > 0.6),
      k = pre
        ? 1
        : currentBeat === 0
          ? 1
          : currentBeat === 1
            ? cue('widen-shortlist') > 0.35
              ? 2
              : 1
            : 1,
      run = authorizedSearch(k, pre);
    heading(
      ctx,
      api,
      'Trusted search diagnostic · same query signs1010 · permission checked before text fetch',
    );
    {
      AUTH.rows.forEach((r, i) => {
        const y = 370 + i * 130;
        geometryText(
          ctx,
          api,
          r.id,
          220,
          y + 40,
          31,
          r.allow ? themeColors.blue : themeColors.pink,
        );
        r.vector.forEach((v, j) =>
          cell(
            ctx,
            api,
            v > 0 ? 1 : 0,
            450 + j * 95,
            y,
            75,
            65,
            v > 0 ? themeColors.blue : themeColors.muted,
          ),
        );
        geometryText(
          ctx,
          api,
          'Hamming ' + [0, 0, 2][i],
          1040,
          y + 40,
          30,
          themeColors.yellow,
          'center',
        );
        geometryText(
          ctx,
          api,
          r.allow ? 'ALLOW' : 'DENY',
          1430,
          y + 40,
          31,
          r.allow ? themeColors.green : themeColors.pink,
          'center',
        );
      });
      if (currentBeat > 0) {
        api.focus.target('authorized-result', () => {
          const survivors = run.survivors.map((r) => r.id).join(', ') || 'empty';
          geometryText(
            ctx,
            api,
            (pre ? 'Native permission filter → ' : 'Unfiltered top' + k + ' → permission gate → ') +
              survivors,
            960,
            900,
            34,
            run.winner ? themeColors.green : themeColors.pink,
            'center',
          );
          if (run.winner)
            cell(ctx, api, 'Retained FP32: ' + run.winner, 1100, 955, 600, 75, themeColors.green);
          else cell(ctx, api, 'No vector to rescore', 1100, 955, 600, 75, themeColors.pink);
        });
        geometryText(
          ctx,
          api,
          'Rescoring can reorder only retained authorized survivors',
          650,
          1040,
          28,
          themeColors.yellow,
          'center',
        );
      }
    }
    return;
  }
  return;
}
export default {
  id: 'authorized-funnel',
  draw: drawAuthorizedFunnel,
  cues: ['widen-shortlist', 'native-filter'],
};
