import { sampleRuntimeChapter } from '../construction.mjs';
import { runtimeNote, runtimeRule, runtimeTile, runtimeTitle, runtimeWire } from '../defaults.mjs';
export function drawRealLabWalk(ctx, scene, state, api) {
  return api.focus.target('gr-real-lab-walk-mechanism', () =>
    paintRealLabWalk(ctx, scene, state, api),
  );
}
function paintRealLabWalk(ctx, scene, state, api) {
  const modelState = sampleRuntimeChapter('real-lab-walk', state),
    { id, b: currentBeat, g: cueProgress, done: resultComplete } = modelState;
  const { C: themeColors } = api;
  {
    runtimeTitle(ctx, api, 'Keep the same work and reference across all three modes');
    const modes = ['eager', 'explicit stream', 'graph replay'];
    modes.forEach((v, i) => {
      runtimeTile(
        ctx,
        api,
        v,
        160 + i * 560,
        370,
        500,
        i === Math.min(2, Math.floor(cueProgress(1, 0) * 3))
          ? themeColors.yellow
          : themeColors.blue,
        95,
        32,
      );
      const x = 410 + i * 560;
      ['copy', '2x + 1', 'square', 'reduce'].forEach((v, j) => {
        runtimeTile(ctx, api, v, x - 170, 530 + j * 100, 340, themeColors.cyan, 66, 27);
        if (j < 3)
          runtimeWire(
            ctx,
            api,
            x,
            596 + j * 100,
            x,
            630 + j * 100,
            cueProgress(1, 0),
            themeColors.cyan,
          );
      });
    });
    runtimeRule(
      ctx,
      api,
      currentBeat === 0
        ? 'Retained buffers and actual stored source define the common reference'
        : 'Dependent operations stay dependent in every mode',
      975,
      themeColors.yellow,
      31,
    );
    runtimeNote(
      ctx,
      api,
      currentBeat === 2
        ? 'Setup excludes earlier allocation/warmup; lazy events primed separately · first replay correctness outside setup'
        : 'Actual downloadable program · zero/one fresh checks run before timing',
    );
    return;
  }
}
export default {
  id: 'real-lab-walk',
  draw: drawRealLabWalk,
  cues: [
    'gr-real-lab-walk-b0-operation',
    'gr-real-lab-walk-b0-s0',
    'gr-real-lab-walk-b0-s1',
    'gr-real-lab-walk-b0-s2',
    'gr-real-lab-walk-b0-s3',
    'gr-real-lab-walk-b1-operation',
    'gr-real-lab-walk-b1-s0',
    'gr-real-lab-walk-b1-s1',
    'gr-real-lab-walk-b1-s2',
    'gr-real-lab-walk-b2-operation',
    'gr-real-lab-walk-b2-s0',
    'gr-real-lab-walk-b2-s1',
    'gr-real-lab-walk-b2-s2',
    'gr-real-lab-walk-b2-s3',
  ],
};
