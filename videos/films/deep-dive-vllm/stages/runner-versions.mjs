import { vvProgress, vvState } from '../construction.mjs';
import { chapterCard, chapterText, grid, panel } from '../defaults.mjs';
export function drawRunnerVersions(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('runner-versions', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (name, beat = currentBeat) =>
      vvProgress(state, 'vv-runner-versions-' + name, beat),
    resultComplete = (name, beat = currentBeat) => cueProgress(name, beat) === 1;
  let title = '';
  const head = (x) => (title = x);
  api.focus.target('vllm-runner-versions-mechanism', () => {
    head(
      currentBeat === 0
        ? 'Two selected runner implementations remain inside V1'
        : currentBeat === 1
          ? 'Platform support and feature combinations are separate axes'
          : 'Resolve guide/release disagreement using installed code',
    );
    if (currentBeat === 0) {
      panel(ctx, api, 150, 360, 1600, 480, themeColors.blue);
      chapterText(ctx, api, 'V1 engine · GPU worker', 960, 420, 38, themeColors.blue, 'center');
      const modular = progress > 0.5;
      chapterCard(ctx, api, 'use-v2-model-runner =' + modular, 340, 530, 1240, themeColors.yellow);
      chapterCard(
        ctx,
        api,
        modular ? 'V1 worker modular GPU runner' : 'V1 worker standard GPU runner',
        340,
        730,
        1240,
        themeColors.cyan,
        100,
        32,
      );
    } else if (currentBeat === 1) {
      grid(
        ctx,
        api,
        [
          ['Platform', 'Functional path', 'Feature matrix'],
          ['NVIDIA /AMD /Intel', 'installed backend', 'dtype /arch /kernel'],
          ['TPU /CPU /plugins', 'installed runner', 'full attention /hybrid'],
        ],
        150,
        390,
        1600,
        340,
        themeColors.blue,
        28,
      );
      chapterText(
        ctx,
        api,
        'A full-attention token formula does not size every recurrent state',
        960,
        930,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      chapterCard(
        ctx,
        api,
        'Moving guide: Mamba restriction',
        150,
        390,
        730,
        themeColors.pink,
        120,
        30,
      );
      chapterCard(
        ctx,
        api,
        'Pinned release: default support',
        1040,
        390,
        730,
        themeColors.yellow,
        120,
        30,
      );
      chapterCard(
        ctx,
        api,
        'Installed code  ·  model and cache settings  ·  relevant tests',
        150,
        730,
        1620,
        themeColors.green,
        120,
        34,
      );
      if (resultComplete('guide-conflict', 2))
        chapterText(
          ctx,
          api,
          'Check prefix support for this model in the installed release.',
          960,
          950,
          29,
          themeColors.yellow,
          'center',
        );
    }
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
}
export default {
  id: 'runner-versions',
  draw: drawRunnerVersions,
  cues: [
    'vv-runner-versions-op-0',
    'vv-runner-versions-v1-engine',
    'vv-runner-versions-op-1',
    'vv-runner-versions-op-2',
    'vv-runner-versions-guide-conflict',
  ],
};
