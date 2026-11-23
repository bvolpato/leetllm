export function drawSynthesis(ctx, scene, state, api) {
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
      ['Transition', 'Retained reason', 'Selected computation'],
      ['Offline hand fixture', 'E1 recall 1/2 → HOLD', 'v0 · delay 9 silent'],
      ['Canary readiness', 'E3 + ordered quality', 'v0 until promotion'],
      ['Promote', 'Current ready receipt + reload', 'v1 · delay 9 warns'],
      ['Recover', 'Current measured regression', 'v0 · delay 9 silent'],
    ];
    teaching.grid({
      x: 130,
      y: 350,
      width: 1660,
      height: 460,
      rows: 5,
      columns: 3,
      labels: rows,
      fontSize: 28,
      padding: 12,
      fill: themeColors.panel,
      stroke: themeColors.muted,
      textColor: themeColors.ink,
    });
    drawText(
      'The same probe changes only when a different retained computation is selected',
      960,
      930,
      31,
      themeColors.yellow,
      'center',
    );
    footer('Complete evidence chain persists into the new independent repair case');
  }
  return;
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['synthesis-b1-1', 'synthesis-b1-2', 'synthesis-b2-1', 'synthesis-b2-2'],
};
