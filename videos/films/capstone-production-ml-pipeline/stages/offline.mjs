import { HAND_FAIL } from '../fixtures.mjs';
import { passingEvaluation } from '../construction.mjs';
import { pipelineOffline } from '../model.mjs';
import { line, panel } from '../defaults.mjs';
export function drawOffline(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const drawText = (v, x, y, z = 30, col = themeColors.ink, a = 'left', mono = false) => {
    const text = String(v);
    const paint = () =>
      api.text(ctx, text, x, y, z, col, a, mono || text.includes('_') ? 'mono' : 'sans');
    return paint();
  };
  const cueProgress = (n) => api.focus.progress('offline-' + n, 0),
    footer = (v) => drawText(v, 960, 1025, 24, themeColors.muted, 'center');
  const paper = (title, rows, x, y, w = 760, col = themeColors.blue) => {
    panel(ctx, api, x, y, w, 95 + rows.length * 48, col);
    drawText(title, x + 20, y + 40, 30, col);
    line(ctx, api, x + 18, y + 60, x + w - 18, y + 60, col, 2);
    rows.forEach((v, i) => drawText(v, x + 22, y + 105 + i * 48, 27, col));
  };
  {
    const trained = currentBeat > 0,
      rows = trained ? passingEvaluation : HAND_FAIL,
      shown = currentBeat === 1 ? Math.ceil(4 * cueProgress('row-build')) : 4,
      gate =
        shown === 4 && (currentBeat !== 1 || cueProgress('row-build') === 1)
          ? pipelineOffline(rows)
          : null;
    drawText(
      trained
        ? 'Reloaded fitted candidate · warning cost 2 / missed late cost 25'
        : 'Separate hand-entered controller fixture · supplied costs',
      960,
      280,
      32,
      trained ? themeColors.green : themeColors.yellow,
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
          stroke: gate ? (trained ? themeColors.green : themeColors.pink) : themeColors.muted,
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
    {
      paper(
        'Retained failed evidence E1',
        ['eval-2 misses late warning', 'Recall 1/2 · HOLD'],
        130,
        795,
        650,
        themeColors.pink,
      );
      paper(
        trained && gate
          ? 'Current E3 · A1 / R1 / P1'
          : trained
            ? 'Current evidence pending'
            : 'Candidate evidence',
        [
          'Exact row identities retained',
          trained
            ? gate
              ? 'Recall 2/2 · 4/50 cost'
              : 'Current recall and cost pending'
            : 'Recall 1/2 · 96/100 cost',
        ],
        890,
        795,
        900,
        trained ? (gate ? themeColors.green : themeColors.muted) : themeColors.yellow,
      );
    }
    footer(
      'Production remains v0; registration, offline evidence and canary entry have separate effects',
    );
  }
  return;
}
export default {
  id: 'offline',
  draw: drawOffline,
  cues: [
    'offline-b1-1',
    'offline-b1-2',
    'offline-b1-3',
    'failed-evaluation-receipt',
    'offline-b2-1',
    'offline-b2-2',
    'offline-row-build',
    'offline-extension-3',
  ],
};
