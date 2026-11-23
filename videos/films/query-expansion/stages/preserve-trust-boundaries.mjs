import { accessConstruction } from '../model.mjs';
import { spoken } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawPreserveTrustBoundaries(ctx, scene, state, api) {
  const { C: themeColors, components } = api;
  const beat = state.beat ?? 0;
  {
    const example = accessConstruction(1, 1);
    const ranked = spoken(state, 1, 'access-rank') === 1;
    const current = {
      ...example,
      matchesReady: spoken(state, 1, 'access-match') > 0,
      filtered: spoken(state, 1, 'access-filter') === 1,
      ranked,
      rankedRows: ranked ? example.rankedRows : [],
      rechecked: spoken(state, 2, 'access-recheck') === 1,
    };
    api.focus.target('caller-scope', () =>
      card(
        ctx,
        api,
        'Caller: support agent · tenant: support · grant: support.read',
        140,
        275,
        1640,
        themeColors.blue,
        85,
        29,
      ),
    );
    text(ctx, api, 'Expanded query: “burst quota”', 140, 420, 31, themeColors.cyan);
    text(ctx, api, 'Document ID', 140, 510, 26, themeColors.muted);
    text(ctx, api, 'Tenant', 565, 510, 26, themeColors.muted);
    text(ctx, api, 'Term hits', 790, 510, 26, themeColors.muted);
    text(ctx, api, 'Eligibility', 995, 510, 26, themeColors.muted);
    current.rows.forEach((row, i) => {
      const y = 585 + i * 90,
        tone = current.filtered
          ? row.eligible
            ? themeColors.green
            : themeColors.pink
          : current.matchesReady && row.score
            ? themeColors.yellow
            : themeColors.ink;
      api.focus.target('source-identities', () => text(ctx, api, row.id, 140, y, 29, tone));
      text(ctx, api, row.tenant, 565, y, 28, tone);
      api.focus.target('matching-terms', () =>
        text(ctx, api, current.matchesReady ? row.score : '—', 835, y, 29, tone, 'center'),
      );
      api.focus.target('source-eligibility', () =>
        text(
          ctx,
          api,
          current.filtered ? (row.eligible ? 'PERMITTED' : 'DENIED') : 'pending',
          995,
          y,
          27,
          tone,
        ),
      );
    });
    api.line(
      ctx,
      1240,
      465,
      1240,
      900,
      current.filtered ? themeColors.pink : themeColors.muted,
      current.filtered ? 5 : 3,
    );
    if (current.filtered) {
      api.arrow(ctx, 1135, 855, 1220, 855, themeColors.pink, 4);
    }
    components.panel({
      x: 1310,
      y: 475,
      width: 480,
      height: 380,
      fill: themeColors.panel,
      stroke: current.ranked ? themeColors.green : themeColors.muted,
      radius: 14,
    });
    text(
      ctx,
      api,
      'Eligible ranked results',
      1550,
      535,
      29,
      current.ranked ? themeColors.green : themeColors.muted,
      'center',
    );
    if (current.rankedRows.length) {
      text(ctx, api, '1 · burst-policy', 1550, 640, 30, themeColors.green, 'center');
      text(ctx, api, '2 matching terms', 1550, 700, 27, themeColors.cyan, 'center');
      text(ctx, api, '“burst quota limit…”', 1550, 780, 26, themeColors.ink, 'center');
    } else text(ctx, api, 'Filter before ranking', 1550, 675, 28, themeColors.muted, 'center');
    if (current.filtered)
      text(
        ctx,
        api,
        'restricted-ops matches 2 terms, but its admin tenant is outside this request',
        960,
        930,
        28,
        themeColors.pink,
        'center',
      );
    if (beat === 2)
      text(
        ctx,
        api,
        current.rechecked
          ? 'Current authorization rechecked · support.read valid'
          : 'Cache context: support | support.read · current access check pending',
        960,
        1005,
        26,
        current.rechecked ? themeColors.green : themeColors.yellow,
        'center',
      );
  }
}
export default {
  id: 'preserve-trust-boundaries',
  draw: drawPreserveTrustBoundaries,
  cues: ['access-scope', 'access-match', 'access-filter', 'access-rank', 'access-recheck'],
};
