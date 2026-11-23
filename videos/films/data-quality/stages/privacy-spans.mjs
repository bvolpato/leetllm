import {
  drawConstructionArrow,
  drawConstructionChip,
  drawConstructionMeasure,
  drawConstructionNote,
  drawConstructionP,
  drawConstructionSheet,
  drawConstructionText,
} from '../defaults.mjs';
export function drawPrivacySpans(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawConstructionP(ctx, api, id) === 1;
  api.focus.target('privacy-spans-construction', () => {
    drawConstructionText(
      ctx,
      api,
      currentBeat < 2
        ? 'Review queue  ·  email pattern'
        : 'Dolma’s original web filter',
      160,
      300,
      34,
      themeColors.cyan,
    );
    if (currentBeat < 2) {
      drawConstructionSheet(
        ctx,
        api,
        '501',
        'Incident INC-10234 mentions a private timeline',
        160,
        405,
        1590,
        130,
        themeColors.yellow,
      );
      api.rect(ctx, 160, 635, 1590, 130, themeColors.panel, themeColors.cyan, 2);
      drawConstructionText(ctx, api, '502', 180, 669, 26, themeColors.cyan, 'left', true);
      const span =
          currentBeat === 1 && drawConstructionP(ctx, api, 'spans-mask') > 0
            ? '<EMAIL>'
            : 'alex@example.com',
        sx = 180 + drawConstructionMeasure(ctx, api, 'Send updates to ');
      drawConstructionText(ctx, api, 'Send updates to ', 180, 718, 30);
      drawConstructionText(
        ctx,
        api,
        span,
        sx,
        718,
        30,
        currentBeat === 0 && done('spans-detected') ? themeColors.pink : themeColors.ink,
      );
      drawConstructionText(
        ctx,
        api,
        ' please',
        sx + drawConstructionMeasure(ctx, api, span),
        718,
        30,
      );
      if (currentBeat === 0 && done('spans-detected')) {
        drawConstructionText(
          ctx,
          api,
          'email span → redaction review',
          1500,
          840,
          30,
          themeColors.pink,
          'center',
        );
        drawConstructionText(
          ctx,
          api,
          'No email match · context still private',
          960,
          570,
          30,
          themeColors.yellow,
          'center',
        );
      }
      if (currentBeat === 1) {
        drawConstructionText(
          ctx,
          api,
          'Mask the email span',
          960,
          865,
          31,
          themeColors.yellow,
          'center',
        );
        drawConstructionText(
          ctx,
          api,
          'Incident context remains for release review',
          960,
          930,
          31,
          themeColors.pink,
          'center',
        );
      }
      drawConstructionNote(
        ctx,
        api,
        'Review the private incident details in ticket 501.',
      );
    } else {
      const count = done('spans-dolma') ? 6 : 5;
      const masked = done('spans-mask-five');
      const dropped = done('spans-drop');
      drawConstructionText(
        ctx,
        api,
        'One page  ·  detected spans',
        160,
        365,
        30,
        themeColors.muted,
      );
      api.rect(ctx, 200, 430, 1060, 425, themeColors.panel, themeColors.cyan, 3);
      for (let i = 0; i < 6; i++) {
        const active = i < count;
        drawConstructionChip(
          ctx,
          api,
          active ? (masked && i < 5 && count === 5 ? '<MASK>' : 'PII') : '·',
          270 + (i % 3) * 310,
          490 + Math.floor(i / 3) * 160,
          230,
          active ? (count === 6 ? themeColors.pink : themeColors.yellow) : themeColors.muted,
          85,
        );
      }
      drawConstructionText(
        ctx,
        api,
        count + ' detected spans',
        1510,
        515,
        38,
        themeColors.yellow,
        'center',
      );
      if ((count === 5 && masked) || dropped) {
        drawConstructionText(
          ctx,
          api,
          count === 6 ? 'drop document' : 'mask spans',
          1510,
          660,
          39,
          count === 6 ? themeColors.pink : themeColors.green,
          'center',
        );
        if (count === 6) drawConstructionArrow(ctx, api, 1290, 770, 1460, 770, themeColors.pink);
      }
      drawConstructionNote(
        ctx,
        api,
        'The page decision depends on the number of detected spans.',
      );
    }
  });
}
export default {
  id: 'privacy-spans',
  draw: drawPrivacySpans,
  cues: [
    'privacy-spans-b1',
    'privacy-spans-voice-1',
    'spans-detected',
    'privacy-spans-b2',
    'privacy-spans-voice-2',
    'spans-mask',
    'privacy-spans-b3',
    'privacy-spans-voice-3',
    'spans-dolma',
    'spans-mask-five',
    'spans-drop',
  ],
};
