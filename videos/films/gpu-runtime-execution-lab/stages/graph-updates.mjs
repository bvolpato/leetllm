import { sampleRuntimeChapter } from '../construction.mjs';
import { runtimeNote, runtimeRule, runtimeText, runtimeTile, runtimeTitle } from '../defaults.mjs';
export function drawGraphUpdates(ctx, scene, state, api) {
  return api.focus.target('gr-graph-updates-mechanism', () =>
    paintGraphUpdates(ctx, scene, state, api),
  );
}
function paintGraphUpdates(ctx, scene, state, api) {
  const modelState = sampleRuntimeChapter('graph-updates', state),
    { id, b: currentBeat, g: cueProgress, done: resultComplete } = modelState;
  const { C: themeColors } = api;
  {
    runtimeTitle(ctx, api, 'An accepted update changes future launches only');
    const updated = resultComplete(1, 3),
      failed = resultComplete(2, 0);
    const xs = [3, 3],
      biases = [1, updated ? -2 : 1];
    ['Launch L0 · already in flight', 'Launch L1 · next launch'].forEach((v, i) => {
      const x = 190 + i * 900;
      runtimeTile(ctx, api, v, x, 370, 720, i ? themeColors.cyan : themeColors.blue, 90, 30);
      runtimeText(
        ctx,
        api,
        `x = ${xs[i]} · bias ${biases[i]}`,
        x + 360,
        580,
        35,
        themeColors.ink,
        'center',
      );
      runtimeText(
        ctx,
        api,
        `2 × 3 ${biases[i] < 0 ? '− 2' : '+ 1'} = ${2 * 3 + biases[i]}`,
        x + 360,
        710,
        48,
        i ? themeColors.cyan : themeColors.blue,
        'center',
      );
    });
    runtimeRule(
      ctx,
      api,
      failed
        ? 'Rejected context change · establish replacement or fallback'
        : updated
          ? 'L0 retains old parameters · L1 uses accepted new bias'
          : 'Check native update status before naming a new executable',
      935,
      failed ? themeColors.pink : themeColors.yellow,
      31,
    );
    runtimeNote(
      ctx,
      api,
      'Illustrative affine launch · selected whole-graph update contract, not a native update benchmark',
    );
    return;
  }
}
export default {
  id: 'graph-updates',
  draw: drawGraphUpdates,
  cues: [
    'gr-graph-updates-b0-operation',
    'gr-graph-updates-b0-s0',
    'gr-graph-updates-b0-s1',
    'gr-graph-updates-b0-s2',
    'gr-graph-updates-b1-operation',
    'gr-graph-updates-b1-s0',
    'gr-graph-updates-b1-s1',
    'gr-graph-updates-b1-s2',
    'gr-graph-updates-b1-s3',
    'gr-graph-updates-b2-operation',
    'gr-graph-updates-b2-s0',
    'gr-graph-updates-b2-s1',
    'gr-graph-updates-b2-s2',
  ],
};
