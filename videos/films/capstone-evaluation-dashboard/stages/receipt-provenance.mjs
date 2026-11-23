import { DASHBOARD_FIXTURES } from '../fixtures.mjs';
import {
  dashboardClamp,
  dashboardCue,
  dashboardDecision,
  dashboardDigest,
  dashboardReceiptErrors,
  dashboardRows,
  dashboardStarted,
} from '../arithmetic.mjs';
import { dashboardBox, dashboardCell, dashboardNote, dashboardText } from '../defaults.mjs';
export function drawReceiptProvenance(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = dashboardClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  const { C: themeColors } = api;
  api.focus.target('receipt-provenance-mechanism', () => {
    if (beat === 0) {
      const clean = dashboardRows('hybrid-v2'),
        forged = clean.map((r, i) =>
          i === 3
            ? {
                ...r,
                passed: false,
              }
            : r,
        ),
        errors = dashboardReceiptErrors(forged);
      dashboardText(
        ctx,
        api,
        'One retained receipt · four distinct fixture identities',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      dashboardText(ctx, api, 'STORED PASS', 1180, 365, 28, themeColors.muted, 'center');
      dashboardText(ctx, api, 'RECOMPUTED', 1580, 365, 28, themeColors.muted, 'center');
      clean.forEach((r, i) => {
        const y = 410 + i * 115;
        dashboardText(ctx, api, DASHBOARD_FIXTURES[i].short, 200, y + 45, 30, themeColors.ink);
        dashboardCell(
          ctx,
          api,
          String(forged[i].passed),
          1010,
          y,
          340,
          80,
          i === 3 ? themeColors.pink : themeColors.cyan,
          31,
        );
        const reveal = dashboardCue(state, 'receipt-recompute', q) > i / 5;
        dashboardCell(
          ctx,
          api,
          reveal ? String(r.passed) : '…',
          1410,
          y,
          340,
          80,
          reveal ? themeColors.cyan : themeColors.muted,
          31,
        );
      });
      if (dashboardStarted(state, 'receipt-hold', progress > 0.7))
        dashboardText(
          ctx,
          api,
          errors.length ? 'HOLD COMPARISON · stored grade differs' : 'Valid',
          960,
          955,
          39,
          themeColors.pink,
          'center',
        );
      dashboardNote(
        ctx,
        api,
        'The same receipt rules reject absent, repeated, unexpected or mismatched identities before aggregation.',
      );
    } else if (beat === 1) {
      dashboardText(
        ctx,
        api,
        'Two policy texts carry the same version label',
        960,
        280,
        37,
        themeColors.blue,
        'center',
      );
      const texts = ['Identity verification is required.', 'Identity verification is optional.'];
      texts.forEach((text, i) => {
        const y = 380 + i * 235;
        dashboardBox(ctx, api, 200, y, 1520, 170, i ? themeColors.pink : themeColors.cyan);
        dashboardText(ctx, api, 'corpus-v3', 260, y + 55, 30, themeColors.blue);
        dashboardText(ctx, api, text, 600, y + 55, 32, i ? themeColors.pink : themeColors.cyan);
        const digest = dashboardDigest(text);
        dashboardText(
          ctx,
          api,
          'SHA-256 prefix: ' + digest.slice(0, 24),
          600,
          y + 125,
          28,
          themeColors.muted,
          'left',
          'mono',
        );
      });
      dashboardText(
        ctx,
        api,
        'Choose one approved snapshot → rerun compared systems',
        960,
        925,
        36,
        themeColors.yellow,
        'center',
      );
    } else {
      const rows = dashboardRows('hybrid-v2');
      dashboardText(
        ctx,
        api,
        'Four example replies from the test author',
        960,
        280,
        36,
        themeColors.yellow,
        'center',
      );
      rows.forEach((r, i) => {
        const y = 365 + i * 115;
        dashboardCell(ctx, api, DASHBOARD_FIXTURES[i].short, 220, y, 650, 80, themeColors.blue, 29);
        dashboardCell(
          ctx,
          api,
          r.passed ? 'CHECKS PASS' : 'FAIL',
          1030,
          y,
          650,
          80,
          themeColors.cyan,
          29,
        );
      });
      if (dashboardStarted(state, 'receipt-example-grade', progress > 0.25)) {
        dashboardText(
          ctx,
          api,
          'Local gate    ' + dashboardDecision(rows),
          960,
          890,
          39,
          themeColors.cyan,
          'center',
        );
      }
      if (dashboardStarted(state, 'receipt-provenance-step-3', progress > 0.7)) {
        dashboardText(
          ctx,
          api,
          'Run record    Saved outputs + source digests from the runner',
          960,
          955,
          34,
          themeColors.ink,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'receipt-provenance',
  draw: drawReceiptProvenance,
  cues: [
    'receipt-provenance-step-1',
    'receipt-recompute',
    'receipt-hold',
    'receipt-provenance-step-2',
    'receipt-provenance-step-3',
    'receipt-example-grade',
  ],
};
