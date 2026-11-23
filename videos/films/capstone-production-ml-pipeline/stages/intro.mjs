import { HAND_FAIL } from '../fixtures.mjs';
import { pipelineOffline } from '../model.mjs';
export function drawIntro(ctx, scene, state, api) {
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
    const trained = false,
      rows = HAND_FAIL,
      shown = 4,
      gate = shown === 4 ? pipelineOffline(rows) : null;
    drawText(
      'Separate hand-entered controller fixture · supplied costs',
      960,
      280,
      32,
      themeColors.yellow,
      'center',
    );
    teaching.grid({
      x: 130,
      y: 360,
      width: 1160,
      height: 400,
      rows: 5,
      columns: 6,
      labels: [
        ['ID', 'Delay', 'Critical', 'Late', 'Warn', 'Cost'],
        ...rows.map((r, i) => [
          r.id,
          r.x,
          r.critical ? 'yes' : 'no',
          r.gold ? 'yes' : 'no',
          i < shown ? (r.pred ? 'yes' : 'NO') : 'pending',
          i < shown ? r.cost : '—',
        ]),
      ],
      fontSize: 29,
      padding: 12,
      fill: themeColors.panel,
      stroke: themeColors.muted,
      textColor: themeColors.ink,
      highlights: [
        {
          row: 2,
          column: 4,
          stroke: gate ? themeColors.pink : themeColors.muted,
          fill: themeColors.panel,
        },
      ],
    });
    drawText('Critical positives', 1550, 405, 29, themeColors.muted, 'center');
    drawText(
      gate ? `${gate.hits} / ${gate.positives}` : 'pending',
      1550,
      485,
      52,
      gate?.pass ? themeColors.green : themeColors.pink,
      'center',
    );
    drawText(
      gate ? `Cost ${gate.cost} / ${gate.base}` : 'Cost pending',
      1550,
      610,
      32,
      themeColors.cyan,
      'center',
    );
    drawText(
      gate ? `${(gate.delta * 100).toFixed(0)}%` : '—',
      1550,
      680,
      40,
      themeColors.cyan,
      'center',
    );
    drawText(
      gate ? (gate.pass ? 'OPEN CANARY' : 'HOLD OFFLINE') : 'PENDING',
      1550,
      790,
      31,
      gate?.pass ? themeColors.green : themeColors.pink,
      'center',
    );
    footer(
      'Production remains v0; registration, offline evidence and canary entry have separate effects',
    );
  }
  return;
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-b1-1', 'intro-b1-2', 'intro-b1-3', 'intro-b2-1', 'intro-b2-2'],
};
