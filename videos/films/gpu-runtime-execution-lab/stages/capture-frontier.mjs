import { sampleRuntimeChapter } from '../construction.mjs';
import { runtimeNote, runtimeRule, runtimeTile, runtimeTitle, runtimeWire } from '../defaults.mjs';
export function drawCaptureFrontier(ctx, scene, state, api) {
  return api.focus.target('gr-capture-frontier-mechanism', () =>
    paintCaptureFrontier(ctx, scene, state, api),
  );
}
function paintCaptureFrontier(ctx, scene, state, api) {
  const modelState = sampleRuntimeChapter('capture-frontier', state),
    { id, b: currentBeat, g: cueProgress, done: resultComplete } = modelState;
  const { C: themeColors } = api;
  {
    if (currentBeat < 2) {
      runtimeTitle(ctx, api, 'A captured fork must return before capture ends');
      const missing = cueProgress(0, 2) > 0,
        branch = cueProgress(0, 1),
        join = Math.max(0, branch * 2 - 1);
      [
        ['A · origin', 180, 550, themeColors.blue],
        ['B', 690, 365, themeColors.cyan],
        ['C', 690, 735, themeColors.pink],
        [
          missing ? 'D · capture invalid' : 'D · join',
          1300,
          550,
          missing ? themeColors.pink : themeColors.green,
        ],
      ].forEach(([v, x, y, c]) => runtimeTile(ctx, api, v, x, y, 360, c, 100, 32));
      runtimeWire(ctx, api, 540, 600, 690, 415, Math.min(1, branch * 2), themeColors.cyan);
      runtimeWire(ctx, api, 540, 600, 690, 785, Math.min(1, branch * 2), themeColors.pink);
      runtimeWire(ctx, api, 1050, 415, 1300, 600, join, themeColors.cyan);
      if (!missing) runtimeWire(ctx, api, 1050, 785, 1300, 600, join, themeColors.pink);
      else {
        api.line(ctx, 1150, 725, 1190, 765, themeColors.pink, 4);
        api.line(ctx, 1150, 765, 1190, 725, themeColors.pink, 4);
      }
      runtimeRule(
        ctx,
        api,
        missing
          ? 'Missing C join · capture invalid'
          : branch >= 1
            ? 'Both event branches rejoined · end capture on origin'
            : 'Origin remains open while a captured branch is outstanding',
        940,
        themeColors.yellow,
        31,
      );
    } else {
      runtimeTitle(ctx, api, 'Native conditional graph nodes have their own backend contract');
      runtimeTile(ctx, api, 'Supported native condition', 180, 520, 560, themeColors.blue, 105, 30);
      ['if', 'while', 'switch'].forEach((v, i) => {
        const y = 365 + i * 190;
        runtimeTile(
          ctx,
          api,
          v + ' node',
          1160,
          y,
          550,
          cueProgress(2, 1) > i / 3 ? themeColors.cyan : themeColors.muted,
          95,
          32,
        );
        runtimeWire(ctx, api, 740, 572, 1160, y + 47, cueProgress(2, 1), themeColors.cyan);
      });
      runtimeRule(
        ctx,
        api,
        'Check supported nodes and returned capture status',
        955,
        themeColors.yellow,
        31,
      );
    }
    runtimeNote(
      ctx,
      api,
      currentBeat === 1
        ? 'Captured work is not executing · query, synchronization and allocation have mode-specific restrictions'
        : 'Native capabilities do not capture arbitrary replayed Python control flow',
    );
    return;
  }
}
export default {
  id: 'capture-frontier',
  draw: drawCaptureFrontier,
  cues: [
    'gr-capture-frontier-b0-operation',
    'gr-capture-frontier-b0-s0',
    'gr-capture-frontier-b0-s1',
    'gr-capture-frontier-b0-s2',
    'gr-capture-frontier-b1-operation',
    'gr-capture-frontier-b1-s0',
    'gr-capture-frontier-b1-s1',
    'gr-capture-frontier-b1-s2',
    'gr-capture-frontier-b1-s3',
    'gr-capture-frontier-b2-operation',
    'gr-capture-frontier-b2-s0',
    'gr-capture-frontier-b2-s1',
    'gr-capture-frontier-b2-s2',
    'gr-capture-frontier-b2-s3',
  ],
};
