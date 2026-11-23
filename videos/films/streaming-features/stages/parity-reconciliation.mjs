import {
  drawFooter,
  drawLine,
  drawPill,
  drawRectangle,
  drawText,
  withFocus,
} from '../defaults.mjs';
export function drawParityReconciliation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (k) => state.cues?.['sf-parity-reconciliation-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    cueProgress = (k) => {
      const c = cue(k);
      return !c || c.phase === 'before' ? 0 : c.phase === 'after' ? 1 : c.progress;
    };
  api.focus.target('parity-reconciliation-mechanism', () => {
    const swapping = currentBeat === 1 ? cueProgress('swap') : currentBeat >= 2 ? 1 : 0,
      repair = currentBeat === 2 ? cueProgress('repair') : currentBeat > 2 ? 1 : 0,
      q = swapping * (1 - repair),
      settled = q === 0 || q === 1,
      known = (currentBeat === 2 && resultComplete('paired')) || currentBeat > 2,
      repaired = (currentBeat === 2 && resultComplete('agreement')) || currentBeat > 2;
    withFocus(ctx, api, 'parity-reconciliation-simulation-48', () => {
      drawText(ctx, api, 'Queue length by job', 960, 295, 35, themeColors.yellow);
      [0, 1].forEach((i) => {
        const y = 465 + i * 225;
        withFocus(ctx, api, 'parity-reconciliation-object-replay-49', () =>
          drawPill(
            ctx,
            api,
            'J-' + (201 + i) + ' replay ' + [5, 18][i],
            420,
            y,
            620,
            themeColors.blue,
          ),
        );
        drawRectangle(ctx, api, 1230, y - 45, 370, 90, themeColors.panel, themeColors.border);
        drawText(ctx, api, 'J-' + (201 + i) + ' slot', 1415, y - 65, 27, themeColors.muted);
      });
      withFocus(ctx, api, 'parity-reconciliation-object-serving-50', () =>
        [5, 18].forEach((value, i) => {
          const horizontal = q < 0.25 ? q / 0.25 : q > 0.75 ? (1 - q) / 0.25 : 1,
            vertical = Math.max(0, Math.min(1, (q - 0.25) / 0.5)),
            x = 1415 + (i ? 310 : -365) * horizontal,
            y = 465 + i * 225 + (i ? -225 : 225) * vertical;
          drawPill(
            ctx,
            api,
            'value ' + value,
            x,
            y,
            280,
            i ? themeColors.cyan : themeColors.blue,
            80,
            31,
          );
        }),
      );
    });
    if (settled && known && (q === 1 || repaired))
      [0, 1].forEach((i) =>
        drawLine(
          ctx,
          api,
          770,
          465 + i * 225,
          1200,
          465 + i * 225,
          repaired ? themeColors.green : themeColors.pink,
          3,
        ),
      );
    drawText(ctx, api, 'replay marginal [5, 18]', 520, 830, 31, themeColors.blue);
    drawText(ctx, api, 'serving marginal [5, 18]', 1400, 830, 31, themeColors.cyan);
    if (currentBeat === 1)
      drawText(ctx, api, 'Predict paired mismatch count', 960, 935, 36, themeColors.yellow);
    else if (known)
      drawText(
        ctx,
        api,
        repaired
          ? '0 paired mismatches after restoring keys'
          : q === 1
            ? '2 paired mismatches despite equal marginals'
            : 'Check the two job IDs again',
        960,
        935,
        35,
        repaired ? themeColors.green : themeColors.pink,
      );
    else
      drawText(
        ctx,
        api,
        'Compare by prediction ID, cutoff, version and routing',
        960,
        935,
        31,
        themeColors.muted,
      );
    if (state.cues?.['parity-reconciliation-beat-3-focus-2']?.phase === 'after')
      drawFooter(ctx, api, 'Check one backlog against the queue log for that request.');
  });
}
export default {
  id: 'parity-reconciliation',
  draw: drawParityReconciliation,
  cues: [
    'parity-reconciliation-beat-1-focus-1',
    'parity-reconciliation-beat-1-focus-2',
    'parity-reconciliation-beat-2-focus-1',
    'parity-reconciliation-beat-2-focus-2',
    'sf-parity-reconciliation-swap',
    'sf-parity-reconciliation-paired',
    'sf-parity-reconciliation-repair',
    'sf-parity-reconciliation-agreement',
    'parity-reconciliation-beat-3-focus-1',
    'parity-reconciliation-beat-3-focus-2',
    'sf-parity-reconciliation-types',
  ],
};
