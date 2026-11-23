import { CORPUS, EVAL_DATE } from '../fixtures.mjs';
import { scopeSnapshot } from '../construction.mjs';
import { requestPath } from '../model.mjs';
import { drawText } from '../defaults.mjs';
export function drawAuthorizedRetrieval(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.04, 0.92);
  {
    const run = requestPath(),
      scopeState = scopeSnapshot(
        beat,
        beat === 0 ? api.focus.progress('form-evidence-set', progress2) : progress2,
      ),
      rankProgress = beat > 1 ? 1 : beat === 1 ? api.focus.progress('rank-allowed', q) : 0;
    api.focus.target('trusted-caller', () =>
      drawText(
        ctx,
        api,
        'Luna · trusted EU · support:eu · ' + EVAL_DATE,
        960,
        280,
        30,
        themeColors.blue,
        'center',
      ),
    );
    api.focus.target('permitted-set', () => {
      drawText(
        ctx,
        api,
        'Inspected records · ' + scopeState.inspected.length + ' / 5',
        420,
        345,
        29,
        themeColors.muted,
        'center',
      );
      drawText(
        ctx,
        api,
        'Permitted ranking lane · ' + scopeState.admitted.length + ' admitted',
        1440,
        345,
        29,
        themeColors.green,
        'center',
      );
    });
    api.line(ctx, 1050, 380, 1830, 380, themeColors.green, 3);
    api.line(ctx, 1050, 960, 1830, 960, themeColors.green, 3);
    CORPUS.forEach((record, i) => {
      const decision = scopeState.decisions.find((row) => row.id === record.id),
        admitted = decision?.status === 'Admitted',
        amount = admitted ? rankProgress : 0,
        x = api.lerp(110, 1120, amount),
        y = 405 + i * 108,
        color = !decision ? themeColors.muted : admitted ? themeColors.green : themeColors.pink;
      api.focus.target(admitted && amount > 0 ? 'ranked-hits' : 'access-decisions', () => {
        components.panel({
          x,
          y,
          width: 620,
          height: 85,
          fill: themeColors.panel,
          stroke: color,
        });
        drawText(ctx, api, record.id, x + 22, y + 34, 26, color);
        drawText(
          ctx,
          api,
          decision?.status ?? 'Awaiting scope check',
          x + 22,
          y + 66,
          24,
          themeColors.muted,
        );
        if (admitted && amount === 1) {
          const hit = run.hits.find((h) => h.record.id === record.id);
          drawText(
            ctx,
            api,
            hit.score + ' shared terms',
            x + 590,
            y + 53,
            25,
            themeColors.cyan,
            'right',
          );
        }
      });
    });
    api.focus.target('ranked-hits', () =>
      drawText(
        ctx,
        api,
        rankProgress === 1
          ? 'Only admitted record objects entered ranking'
          : 'Ranking waits for the caller’s permitted set',
        1440,
        1000,
        27,
        themeColors.cyan,
        'center',
      ),
    );
  }
}
export default {
  id: 'authorized-retrieval',
  draw: drawAuthorizedRetrieval,
  cues: [
    'trusted-request',
    'form-evidence-set',
    'rank-allowed',
    'preserve-permission',
    'deny-near-match',
    'permitted-only',
  ],
};
