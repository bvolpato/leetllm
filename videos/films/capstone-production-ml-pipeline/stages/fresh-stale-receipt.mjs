import { freshPipelineState } from '../model.mjs';
import { line, panel } from '../defaults.mjs';
export function drawFreshStaleReceipt(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const drawText = (v, x, y, z = 30, col = themeColors.ink, a = 'left', mono = false) => {
    const text = String(v),
      key = text.startsWith('Policy fingerprint')
        ? 'fresh-stale-receipt-policy-output'
        : text.startsWith('Same delay 9 probe')
          ? 'fresh-stale-receipt-probe-output'
          : null;
    const paint = () =>
      api.text(ctx, text, x, y, z, col, a, mono || text.includes('_') ? 'mono' : 'sans');
    return key ? api.focus.target(key, paint) : paint();
  };
  const cueProgress = (n) => api.focus.progress('fresh-stale-receipt-' + n, 0),
    cueStarted = (n) => cueProgress(n) > 0,
    resultComplete = (n) => api.focus.progress('pipe-result-' + n, 0) === 1,
    footer = (v) => drawText(v, 960, 1025, 24, themeColors.muted, 'center');
  const paper = (title, rows, x, y, w = 760, col = themeColors.blue) => {
    panel(ctx, api, x, y, w, 95 + rows.length * 48, col);
    drawText(title, x + 20, y + 40, 30, col);
    line(ctx, api, x + 18, y + 60, x + w - 18, y + 60, col, 2);
    rows.forEach((v, i) => drawText(v, x + 22, y + 105 + i * 48, 27, col));
  };
  {
    const receiptStage =
        currentBeat === 0
          ? 0
          : currentBeat === 1
            ? cueStarted('restore-policy')
              ? 2
              : 1
            : cueStarted('new-commit')
              ? 3
              : 2,
      fixture = freshPipelineState(receiptStage),
      held = resultComplete('fresh-compound-hold'),
      policy = resultComplete('restored-policy-match'),
      promoted = resultComplete('fresh-promotion'),
      warned = resultComplete('fresh-warning-probe'),
      production = promoted ? 'v1' : 'v0';
    paper(
      'Retained ready-3',
      ['candidate v1 · base v0', 'policy P1: latency 250', 'history: newer hold-4'],
      130,
      330,
      850,
      themeColors.blue,
    );
    paper(
      'Current controller state',
      [
        `P1 latency ${fixture.policy.latency}`,
        `latest receipt ${fixture.latestReceiptId}`,
        `production ${production}`,
      ],
      1100,
      330,
      690,
      themeColors.yellow,
    );
    if (currentBeat > 0) {
      const reason = fixture.decision.reasons,
        movingPolicy = currentBeat === 1 && cueStarted('restore-policy') && !policy;
      drawText(
        !held || movingPolicy
          ? 'Policy fingerprint: pending'
          : policy
            ? 'Policy fingerprint: MATCH'
            : 'Policy fingerprint: MISMATCH',
        960,
        675,
        34,
        !held || movingPolicy ? themeColors.muted : policy ? themeColors.green : themeColors.pink,
        'center',
      );
      drawText(
        !held
          ? 'Receipt comparison pending'
          : receiptStage === 3
            ? 'New ready receipt: CURRENT'
            : 'Old ready receipt: SUPERSEDED',
        960,
        750,
        34,
        !held ? themeColors.muted : receiptStage === 3 ? themeColors.green : themeColors.pink,
        'center',
      );
      drawText(
        !held
          ? 'Promotion decision pending'
          : promoted
            ? 'PROMOTE'
            : receiptStage === 3
              ? 'Promotion checks pending'
              : 'HOLD PROMOTION',
        960,
        835,
        39,
        !held || (receiptStage === 3 && !promoted)
          ? themeColors.muted
          : promoted
            ? themeColors.green
            : themeColors.pink,
        'center',
      );
      const probeText = warned
        ? 'Same delay 9 probe → WARN (0.98)'
        : promoted
          ? 'Same delay 9 probe pending · prior v0 SILENT (0.00)'
          : resultComplete('fresh-unchanged-silent-probe')
            ? 'Same delay 9 probe → SILENT (0.00)'
            : 'Same delay 9 probe pending';
      drawText(
        probeText,
        960,
        935,
        promoted && !warned ? 30 : 37,
        warned
          ? themeColors.green
          : promoted || !resultComplete('fresh-unchanged-silent-probe')
            ? themeColors.muted
            : themeColors.blue,
        'center',
      );
    } else
      drawText(
        'Predict the pointer and unchanged probe',
        960,
        850,
        38,
        themeColors.yellow,
        'center',
      );
    footer(
      resultComplete('fresh-repair-guidance')
        ? 'Independent fresh branch; restore policy and obtain current complete evidence before the local move'
        : 'Independent fresh branch; retain the receipt, policy, history and probe inputs',
    );
  }
  return;
}
export default {
  id: 'fresh-stale-receipt',
  draw: drawFreshStaleReceipt,
  cues: [
    'fresh-stale-receipt-b1',
    'fresh-stale-receipt-b2',
    'fresh-stale-receipt-restore-policy',
    'pipe-result-fresh-compound-hold',
    'pipe-result-fresh-unchanged-silent-probe',
    'pipe-result-restored-policy-match',
    'fresh-stale-receipt-b3',
    'fresh-stale-receipt-new-commit',
    'pipe-result-fresh-promotion',
    'pipe-result-fresh-warning-probe',
    'pipe-result-fresh-repair-guidance',
  ],
};
