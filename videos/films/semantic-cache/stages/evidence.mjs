import {
  drawSemanticCard,
  drawSemanticText,
  withSemanticConstructionFrame,
  withSemanticLegacyFrame,
} from '../defaults.mjs';
export function paintEvidence(ctx, scene, state, api, themeColors, c, t, s, currentBeat) {
  drawSemanticText(
    ctx,
    api,
    themeColors,
    currentBeat === 0
      ? 'Four labeled probes · actual miniature suite'
      : 'Separate hypothetical independent review population',
    140,
    275,
    31,
    themeColors.muted,
  );
  api.focus.target('review-population', () =>
    drawSemanticCard(
      ctx,
      api,
      themeColors,
      c,
      `${s.success.toLocaleString('en-US')} successes / ${s.n.toLocaleString('en-US')} reviewed`,
      280,
      385,
      1360,
      themeColors.cyan,
      110,
    ),
  );
  const x = (v) => 200 + v * 1500;
  api.line(ctx, x(0), 665, x(1), 665, themeColors.muted, 3);
  api.focus.target('confidence-bound', () =>
    api.line(ctx, x(s.lower), 665, x(1), 665, themeColors.green, 12),
  );
  api.focus.target('confidence-bound', () =>
    api.circle(ctx, x(s.lower), 665, 12, themeColors.yellow),
  );
  drawSemanticText(ctx, api, themeColors, '0%', x(0), 745, 26, themeColors.muted, 'center');
  drawSemanticText(ctx, api, themeColors, '100%', x(1), 745, 26, themeColors.muted, 'center');
  api.focus.target('confidence-bound', () =>
    drawSemanticText(
      ctx,
      api,
      themeColors,
      `95% Wilson lower bound: ${(s.lower * 100).toFixed(2)}%`,
      960,
      860,
      36,
      themeColors.yellow,
      'center',
    ),
  );
  drawSemanticText(
    ctx,
    api,
    themeColors,
    'Sample independence and representative coverage are evaluation assumptions',
    960,
    975,
    28,
    themeColors.muted,
    'center',
  );
}
export function drawEvidence(ctx, scene, state, api) {
  if (withSemanticConstructionFrame(ctx, scene, state, api, paintEvidence)) return;
  withSemanticLegacyFrame(ctx, scene, state, api, paintEvidence);
}
export default {
  id: 'evidence',
  draw: drawEvidence,
  cues: ['small-suite', 'wide-bound', 'independent-population', 'evaluated-config'],
};
