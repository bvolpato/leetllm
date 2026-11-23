import { derivedScopeState } from '../construction.mjs';
import { drawOriginalCard, drawOriginalLink, drawOriginalText } from '../defaults.mjs';
export function drawTenantAndScope(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const current = derivedScopeState(currentBeat, progress);
    drawOriginalText(
      ctx,
      api,
      'Same document title · tenant-qualified identities',
      960,
      270,
      35,
      themeColors.ink,
    );
    const aDoc = api.focus.target('tenant-a-document', () =>
        drawOriginalCard(
          ctx,
          api,
          'A:doc · incident checklist',
          140,
          360,
          510,
          themeColors.cyan,
          1,
          95,
          28,
        ),
      ),
      bDoc = api.focus.target('tenant-b-document', () =>
        drawOriginalCard(
          ctx,
          api,
          'B:doc · incident checklist',
          140,
          690,
          510,
          themeColors.pink,
          1,
          95,
          28,
        ),
      );
    const aChunk = api.focus.target('tenant-a-chunk', () =>
        drawOriginalCard(
          ctx,
          api,
          'A:chunk · operations',
          800,
          360,
          420,
          themeColors.cyan,
          current.chunk,
          95,
          28,
        ),
      ),
      bChunk = api.focus.target('tenant-b-chunk', () =>
        drawOriginalCard(
          ctx,
          api,
          'B:chunk · operations',
          800,
          690,
          420,
          themeColors.pink,
          current.chunk,
          95,
          28,
        ),
      );
    if (current.chunk > 0) {
      drawOriginalLink(ctx, api, aDoc, aChunk, current.chunk, themeColors.cyan);
      drawOriginalLink(ctx, api, bDoc, bChunk, current.chunk, themeColors.pink);
    }
    if (currentBeat === 1) {
      drawOriginalText(
        ctx,
        api,
        'Tenant · current revision · live grant',
        960,
        550,
        31,
        themeColors.yellow,
      );
      drawOriginalText(
        ctx,
        api,
        'Trusted policy42 · caller tenantA / operations',
        960,
        945,
        30,
        themeColors.muted,
      );
    }
    if (currentBeat === 2) {
      const report = api.focus.target('tenant-a-report', () =>
        drawOriginalCard(
          ctx,
          api,
          'A:report · grant checked',
          1400,
          360,
          420,
          themeColors.green,
          current.report,
          95,
          27,
        ),
      );
      if (current.report > 0)
        drawOriginalLink(ctx, api, aChunk, report, current.report, themeColors.green);
      if (current.foreignAttempt) {
        const foreign = api.focus.target('tenant-b-report', () =>
          drawOriginalCard(
            ctx,
            api,
            'B:report · metadata only',
            1400,
            690,
            420,
            current.foreignDenied ? themeColors.pink : themeColors.yellow,
            1,
            95,
            27,
          ),
        );
        drawOriginalLink(
          ctx,
          api,
          aChunk,
          foreign,
          Math.min(1, (current.seconds - 6.025) / 2.5),
          themeColors.pink,
        );
        drawOriginalText(
          ctx,
          api,
          current.foreignDenied
            ? 'DENY · caller in A cannot read B'
            : 'Check source scope before fetching text',
          1495,
          875,
          28,
          current.foreignDenied ? themeColors.pink : themeColors.yellow,
        );
      }
      drawOriginalText(
        ctx,
        api,
        'A:doc → A:chunk → A:report · same tenant and live grants',
        960,
        945,
        30,
        themeColors.green,
      );
    } else if (currentBeat === 0)
      drawOriginalText(
        ctx,
        api,
        'A child chunk inherits its tenant-qualified source identity',
        960,
        945,
        31,
        themeColors.ink,
      );
  }
}
export default {
  id: 'tenant-and-scope',
  draw: drawTenantAndScope,
  cues: ['tenant-and-scope-b1-1', 'tenant-and-scope-b2-1', 'tenant-and-scope-b3-1'],
};
