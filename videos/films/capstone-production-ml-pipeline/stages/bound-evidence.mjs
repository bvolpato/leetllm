import { arrow, line, panel } from '../defaults.mjs';
export function drawBoundEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const drawText = (v, x, y, z = 30, col = themeColors.ink, a = 'left', mono = false) => {
    const text = String(v);
    const paint = () =>
      api.text(ctx, text, x, y, z, col, a, mono || text.includes('_') ? 'mono' : 'sans');
    return paint();
  };
  const cueProgress = (n) => api.focus.progress('bound-evidence-' + n, 0),
    cueStarted = (n) => cueProgress(n) > 0,
    footer = (v) => drawText(v, 960, 1025, 24, themeColors.muted, 'center');
  const paper = (title, rows, x, y, w = 760, col = themeColors.blue) => {
    panel(ctx, api, x, y, w, 95 + rows.length * 48, col);
    drawText(title, x + 20, y + 40, 30, col);
    line(ctx, api, x + 18, y + 60, x + w - 18, y + 60, col, 2);
    rows.forEach((v, i) => drawText(v, x + 22, y + 105 + i * 48, 27, col));
  };
  {
    if (currentBeat === 0) {
      paper(
        'Train membership',
        [
          'T1 · T2 · T3 · T4 · T5 · T6',
          cueStarted('overlap') ? 'Injected E1 → overlap FAIL' : 'Evaluate E1 · E2 · E3 · E4',
        ],
        140,
        340,
        850,
        themeColors.blue,
      );
      paper(
        'Derived from exact rows',
        [
          'Critical recall = hits / positives',
          'Cost delta = candidate / baseline − 1',
          'No positives / zero baseline → missing',
        ],
        1090,
        340,
        700,
        themeColors.yellow,
      );
      drawText(
        'Held-out identity and clock checks answer separate leakage questions',
        960,
        890,
        33,
        themeColors.ink,
        'center',
      );
    } else {
      const values = [
        ['Artifact A1', 'rows + model digest'],
        ['Release R1', 'tuple + previous v0'],
        ['Policy P1', 'recall .90 · cost 0'],
        ['Evidence E3', 'A1 / R1 / P1 digests'],
      ];
      values.forEach(([v, z], i) => {
        const x = 135 + i * 450;
        paper(v, [z], x, 430, 390, i === 3 ? themeColors.green : themeColors.blue);
        if (i < 3) arrow(ctx, api, x + 405, 500, x + 435, 500, themeColors.cyan);
      });
      drawText(
        currentBeat === 1
          ? 'Stored ID selects evidence; current tuple and production base are rechecked'
          : 'A matching digest is byte consistency; trusted writer authority is separate',
        960,
        805,
        33,
        currentBeat === 1 ? themeColors.yellow : themeColors.pink,
        'center',
      );
      if (currentBeat === 2)
        drawText(
          'Replacing evidence AND expected hashes can still produce a matching checksum',
          960,
          925,
          30,
          themeColors.pink,
          'center',
        );
    }
    footer(
      'Short visible IDs label retained objects; digests do not make mutable dictionaries immutable',
    );
  }
  return;
}
export default {
  id: 'bound-evidence',
  draw: drawBoundEvidence,
  cues: ['bound-evidence-b1', 'bound-evidence-overlap', 'bound-evidence-b2', 'bound-evidence-b3'],
};
