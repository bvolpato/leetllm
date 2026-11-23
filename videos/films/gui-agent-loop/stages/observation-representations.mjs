import { portalPanel, readoutCell, rectangle, taskHeader, text } from '../defaults.mjs';
export function drawObservationRepresentations(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    taskHeader(ctx, api);
    if (currentBeat === 0) {
      portalPanel(ctx, api, 160, 390, 750, 8);
      rectangle(ctx, api, 1060, 390, 700, 440, themeColors.cyan);
      text(ctx, api, 'Semantic observation', 1410, 450, 35, themeColors.cyan, 'center');
      [
        'tab: Failed tests',
        'button: expand failure',
        'state: collapsed',
        'hidden DOM text: untrusted',
      ]
        .slice(0, Math.max(1, Math.ceil(q(0) * 4)))
        .forEach((v, i) =>
          text(ctx, api, v, 1100, 540 + i * 70, 29, i === 3 ? themeColors.pink : themeColors.ink),
        );
      text(
        ctx,
        api,
        'Pixels, DOM and accessibility expose different evidence',
        960,
        1010,
        34,
        themeColors.yellow,
        'center',
      );
    } else {
      const ambiguous = currentBeat === 2;
      portalPanel(ctx, api, 160, 390, 750, 8, ambiguous ? 2 : 1);
      text(
        ctx,
        api,
        ambiguous
          ? 'Two matching tabs remain after scoping'
          : 'Current mark map: mark17 → frame8 / intended run',
        1320,
        430,
        30,
        ambiguous ? themeColors.pink : themeColors.cyan,
        'center',
      );
      readoutCell(
        ctx,
        api,
        ambiguous ? 'match count2 → no input' : 'mark17 → unique actionable target',
        1040,
        570,
        720,
        ambiguous ? themeColors.pink : themeColors.green,
      );
      text(
        ctx,
        api,
        ambiguous ? 'Re-observe or escalate' : 'visibility · stability · enabled · event reception',
        1400,
        800,
        29,
        ambiguous ? themeColors.pink : themeColors.green,
        'center',
      );
      text(
        ctx,
        api,
        'Coordinates and mark IDs do not supply authorization',
        960,
        1010,
        34,
        themeColors.yellow,
        'center',
      );
    }
  };
  api.focus.target('observation-representations-construction', body);
}
export default {
  id: 'observation-representations',
  draw: drawObservationRepresentations,
  cues: [
    'observation-representations-construct-0',
    'observation-representations-construct-1',
    'observation-representations-construct-2',
  ],
};
