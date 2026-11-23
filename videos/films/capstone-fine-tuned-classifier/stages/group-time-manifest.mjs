import { clamp01, mix } from '../arithmetic.mjs';
import { classifierCueProgress } from '../construction.mjs';
import {
  drawExpandedClassifierCard,
  drawExpandedClassifierLine,
  drawExpandedClassifierNote,
  drawExpandedClassifierText,
} from '../defaults.mjs';
export function drawGroupTimeManifest(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0),
    cueProgress = (id) => classifierCueProgress(state, id);
  api.focus.target('account-manifest', () => {
    const delta = currentBeat >= 1 ? cueProgress('manifest-delta') : 0,
      q = currentBeat >= 1 ? cueProgress('manifest-quarantine') : 0,
      columns = [
        ['Jan–Feb', 'Training', themeColors.blue],
        ['March', 'Development', themeColors.cyan],
        ['April', 'Untouched test', themeColors.pink],
      ];
    columns.forEach(([date, role, color], i) => {
      drawExpandedClassifierLine(ctx, api, 140 + i * 570, 430, 640 + i * 570, 430, color, 3);
      drawExpandedClassifierText(ctx, api, date, 390 + i * 570, 350, 34, color, 'center');
      drawExpandedClassifierText(ctx, api, role, 390 + i * 570, 400, 28, color, 'center');
    });
    [
      ['Acme · A1/A2', 0, 0],
      ['North · N1/N2', 0, 1],
      ['Summit · S1/S2', 1, 0],
      ['Harbor · H1/H2', 2, 0],
    ].forEach(([label, col, row]) =>
      drawExpandedClassifierCard(
        ctx,
        api,
        label,
        185 + col * 570,
        455 + row * 112,
        410,
        [themeColors.blue, themeColors.cyan, themeColors.pink][col],
        76,
        28,
      ),
    );
    if (delta > 0) {
      const x = mix(185, 745, q),
        y = mix(700, 875, q);
      drawExpandedClassifierCard(
        ctx,
        api,
        'Delta · January',
        x,
        y,
        410,
        q ? themeColors.yellow : themeColors.pink,
        76,
        28,
      );
      drawExpandedClassifierCard(
        ctx,
        api,
        'Delta · April',
        1325,
        700,
        410,
        themeColors.pink,
        76,
        28,
      );
      if (q < 1)
        drawExpandedClassifierLine(ctx, api, x + 410, y + 38, 1325, 738, themeColors.pink, 4);
      if (q === 1)
        drawExpandedClassifierText(
          ctx,
          api,
          'Quarantine earlier related history',
          960,
          845,
          29,
          themeColors.yellow,
          'center',
        );
    }
    drawExpandedClassifierNote(
      ctx,
      api,
      currentBeat === 0
        ? '8 rows · unique ticket IDs · disjoint account sets'
        : currentBeat === 1
          ? 'Delta remains one account as its earlier row moves'
          : 'Freeze text, identity, timestamps and label version',
    );
  });
}
export default {
  id: 'group-time-manifest',
  draw: drawGroupTimeManifest,
  cues: ['manifest-groups', 'manifest-delta', 'manifest-quarantine', 'manifest-freeze'],
};
