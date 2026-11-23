export function drawProductMonitoring(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const drawText = (v, x, y, z = 30, col = themeColors.ink, a = 'left', mono = false) => {
    const text = String(v);
    const paint = () =>
      api.text(ctx, text, x, y, z, col, a, mono || text.includes('_') ? 'mono' : 'sans');
    return paint();
  };
  const footer = (v) => drawText(v, 960, 1025, 24, themeColors.muted, 'center');
  {
    const rows = [
      ['Product', 'Immediate data', 'Delayed quality', 'Retained transform'],
      ['ETA', 'scan freshness', 'late-warning cost', 'fitted imputer'],
      ['Ranking', 'eligible supply', 'purchase / return', 'feature rule'],
      ['Forecast', 'counts loaded', 'residual / alert cost', 'calendar features'],
      ['Vision', 'photo quality', 'reviewed damage', 'cropper + threshold'],
    ];
    teaching.grid({
      x: 130,
      y: 350,
      width: 1660,
      height: 450,
      rows: 5,
      columns: 4,
      labels: rows,
      fontSize: 27,
      padding: 12,
      fill: themeColors.panel,
      stroke: themeColors.muted,
      textColor: themeColors.ink,
    });
    drawText(
      currentBeat === 0
        ? 'One evidence contract, different product observations'
        : 'A schedule or trigger creates another candidate; it does not bypass release checks',
      960,
      920,
      32,
      currentBeat === 0 ? themeColors.yellow : themeColors.green,
      'center',
    );
    footer('Canary exposure and randomized outcome estimation answer different questions');
  }
  return;
}
export default {
  id: 'product-monitoring',
  draw: drawProductMonitoring,
  cues: ['product-monitoring-b1', 'product-monitoring-b2'],
};
