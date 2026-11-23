import { drawOriginalText, drawOriginalVisualFocus } from '../defaults.mjs';
export function drawPrivacy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    drawOriginalText(
      ctx,
      api,
      'Illustrated support record · supplied recognizer spans',
      960,
      285,
      33,
      themeColors.muted,
    );
    drawOriginalVisualFocus(ctx, api, 'privacy-node-records', () => {
      api.rect(ctx, 170, 350, 1580, 435, themeColors.panel, themeColors.blue, 3);
      drawOriginalText(
        ctx,
        api,
        'Alex',
        365,
        455,
        41,
        currentBeat >= 2 ? themeColors.yellow : themeColors.ink,
      );
      drawOriginalText(ctx, api, 'asked for incident', 825, 455, 35, themeColors.ink);
      drawOriginalVisualFocus(ctx, api, 'privacy-object-incident-id-67', () =>
        drawOriginalText(ctx, api, 'INC-10234', 1420, 455, 38, themeColors.pink),
      );
      drawOriginalText(ctx, api, 'Contact', 365, 600, 35, themeColors.ink);
      drawOriginalVisualFocus(ctx, api, 'privacy-scanner', () =>
        drawOriginalText(
          ctx,
          api,
          'alex@example.com',
          1090,
          600,
          42,
          currentBeat > 0 ? themeColors.cyan : themeColors.ink,
        ),
      );
      drawOriginalText(ctx, api, 'Credential: <TOKEN-EXAMPLE>', 960, 725, 34, themeColors.ink);
    });
    drawOriginalVisualFocus(ctx, api, 'privacy-object-process-states-and-transitions-66', () => {
      if (currentBeat > 0) {
        drawOriginalText(
          ctx,
          api,
          'email pattern → candidate span',
          550,
          875,
          31,
          themeColors.cyan,
        );
        drawOriginalText(
          ctx,
          api,
          'context and access review: pending',
          1320,
          875,
          31,
          themeColors.pink,
        );
      }
      if (currentBeat >= 2)
        drawOriginalText(
          ctx,
          api,
          'Alex: possible entity span · evaluated detector coverage still required',
          960,
          955,
          29,
          themeColors.yellow,
        );
    });
  }
}

// The executable Python article is authoritative. This illustrated subset covers its
// ASCII ticket fixture plus the explicitly demonstrated compatibility/sharp-s forms.
export default {
  id: 'privacy',
  draw: drawPrivacy,
  cues: [
    'privacy-beat-1-focus-1',
    'privacy-beat-1-focus-2',
    'privacy-beat-2-focus-1',
    'privacy-beat-3-focus-1',
    'privacy-beat-3-focus-2',
  ],
};
