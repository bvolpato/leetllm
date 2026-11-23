import { PROPOSAL, TRUSTED } from '../fixtures.mjs';
import { cueBegun, cueProgress } from '../arithmetic.mjs';
import { disclosureAllowed, promotionAllowed } from '../model.mjs';
import { card, text, visualFocus } from '../defaults.mjs';
export function drawProtectedSinks(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const rows = [
      {
        id: 'disclosure',
        y: 355,
        input: 'Request: private red-team notes',
        gate: 'Private-field + egress grant\nMissing → DENY',
        sink: 'outside.example\nUnapproved destination',
        color: themeColors.pink,
        allowed: disclosureAllowed({
          field: 'private-red-team-notes',
          destination: 'outside.example',
          caller: TRUSTED.caller,
        }),
      },
      {
        id: 'deployment',
        y: 665,
        input: 'Promote C17 · 25% · revision 3',
        gate: 'Worker + revision + approval\nNo approval → DENY',
        sink: 'release-service\nProduction endpoint',
        color: themeColors.yellow,
        allowed: promotionAllowed(PROPOSAL),
      },
    ];
    const visible =
      currentBeat > 0 || cueBegun(state.cues, 'protected-sinks-beat-1-focus-1', progress > 0.6);
    rows.forEach((row) => {
      const move =
        currentBeat > 0
          ? cueProgress(
              state.cues,
              row.id === 'disclosure'
                ? 'protected-sinks-beat-2-focus-1'
                : 'protected-operation-check',
              progress,
            )
          : 0;
      visualFocus(ctx, api, 'protected-' + row.id + '-request', () => {
        text(
          ctx,
          api,
          row.id === 'disclosure' ? 'Toy private payload · NOTES' : row.input,
          400,
          row.y + 25,
          28,
          row.color,
        );
        if (row.id === 'disclosure') {
          const bytes = new TextEncoder().encode('NOTES');
          bytes.forEach((byte, i) => {
            const x = 160 + i * 67 + 190 * move;
            api.rect(ctx, x, row.y + 65, 58, 65, themeColors.panel, row.color, 2);
            text(ctx, api, byte.toString(16).toUpperCase(), x + 29, row.y + 106, 26, row.color);
          });
        } else
          card(
            ctx,
            api,
            'C17 / production / 25% / r3',
            150 + 145 * move,
            row.y + 65,
            470,
            themeColors.yellow,
            1,
            75,
            26,
          );
      });
      if (!visible) return;
      visualFocus(ctx, api, 'protected-' + row.id + '-gate', () => {
        api.line(ctx, 800, row.y - 10, 800, row.y + 150, themeColors.green, 5);
        card(ctx, api, row.gate, 850, row.y + 10, 450, themeColors.green, 1, 110, 27);
      });
      visualFocus(ctx, api, 'protected-' + row.id + '-endpoint', () =>
        card(ctx, api, row.sink, 1425, row.y + 10, 365, row.color, 1, 110, 26),
      );
      visualFocus(ctx, api, 'protected-' + row.id + '-result', () => {
        text(
          ctx,
          api,
          row.id === 'disclosure'
            ? 'All five payload bytes remain before the boundary'
            : 'C17 stays shadow · revision 3 · traffic 0%',
          960,
          row.y + 205,
          29,
          themeColors.pink,
        );
        text(
          ctx,
          api,
          row.id === 'disclosure' ? 'Outgoing bytes: 0' : 'Committed writes: 0',
          1600,
          row.y + 165,
          28,
          themeColors.muted,
        );
      });
    });
  }
}
export default {
  id: 'protected-sinks',
  draw: drawProtectedSinks,
  cues: [
    'protected-sinks-beat-1-focus-1',
    'protected-sinks-beat-2-focus-1',
    'protected-destination-check',
    'protected-operation-check',
  ],
};
