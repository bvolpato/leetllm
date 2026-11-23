import { vvProgress, vvState } from '../construction.mjs';
import { chapterCard, chapterText, grid } from '../defaults.mjs';
export function drawPrefixLimit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('prefix-limit', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (name, beat = currentBeat) => vvProgress(state, 'vv-prefix-limit-' + name, beat),
    resultComplete = (name, beat = currentBeat) => cueProgress(name, beat) === 1;
  let title = '',
    limit = 'Illustrative source contract · no serving engine or GPU execution';
  const head = (x) => (title = x),
    foot = (x) => (limit = x);
  api.focus.target('vllm-prefix-limit-mechanism', () => {
    head(
      currentBeat === 0
        ? 'Cap by prompt length minus one; round the eligible hit down'
        : currentBeat === 1
          ? 'Change one matching position while keeping the cache fixed'
          : 'A fully cached prompt still needs current logits',
    );
    const cache = 'ABCDEFGH'.split(''),
      prompt =
        currentBeat === 2
          ? cache
          : (
              'ABCDEF' +
              (modelState.shared >= 7 ? 'G' : 'X') +
              (modelState.shared >= 8 ? 'H' : 'Y') +
              'Z'
            ).split('');
    chapterText(ctx, api, 'Cached sequence · adapter A', 140, 345, 29, themeColors.blue);
    grid(ctx, api, [cache], 140, 390, 1500, 95, themeColors.blue);
    chapterText(
      ctx,
      api,
      'Changed prompt · length ' + modelState.length + ' / shared ' + modelState.shared,
      140,
      565,
      29,
      themeColors.pink,
    );
    prompt.forEach((token, i) =>
      chapterCard(
        ctx,
        api,
        token,
        140 + i * (1500 / prompt.length),
        615,
        1500 / prompt.length - 8,
        modelState.ready && i < modelState.skipped ? themeColors.green : themeColors.pink,
        95,
        28,
      ),
    );
    for (let block = 0; block < Math.ceil(prompt.length / 4); block++) {
      const count = Math.min(4, prompt.length - block * 4),
        x = 140 + block * 4 * (1500 / prompt.length);
      api.rect(
        ctx,
        x - 3,
        600,
        count * (1500 / prompt.length) - 4,
        125,
        'transparent',
        modelState.ready && block * 4 < modelState.skipped ? themeColors.green : themeColors.muted,
        3,
      );
    }
    if (modelState.apc) {
      const n = Math.floor(cueProgress('apc-step', 1) * 6);
      for (let i = 0; i < 6; i++)
        chapterCard(
          ctx,
          api,
          i === 0 ? 'R0 decode' : 'R1 tail ' + i,
          150 + i * 270,
          820,
          245,
          i < n ? themeColors.green : i === 0 ? themeColors.blue : themeColors.pink,
          80,
          26,
        );
      if (modelState.ready)
        chapterText(
          ctx,
          api,
          'Eligible adapter A: 1 decode +5 prompt inputs =6',
          960,
          975,
          29,
          themeColors.green,
          'center',
        );
    } else if (modelState.ready) {
      chapterCard(
        ctx,
        api,
        'skip ' + modelState.skipped + ' positions',
        150,
        820,
        490,
        themeColors.green,
      );
      chapterCard(
        ctx,
        api,
        'compute ' + modelState.compute + ' input' + (modelState.compute === 1 ? '' : 's') + '',
        710,
        820,
        490,
        themeColors.yellow,
      );
      chapterCard(
        ctx,
        api,
        'new blocks ' + Math.ceil(modelState.compute / 4),
        1270,
        820,
        490,
        themeColors.cyan,
      );
    } else
      chapterText(
        ctx,
        api,
        'Derive min(shared,length−1), then align to4',
        960,
        880,
        34,
        themeColors.yellow,
        'center',
      );
    if (currentBeat === 1) {
      const done = [];
      if (resultComplete('match-six', 1)) done.push('shared 6: skip 4 / compute 5');
      if (resultComplete('match-seven', 1)) done.push('shared 7: skip 4 / compute 5');
      if (resultComplete('match-eight', 1)) done.push('shared 8: skip 8 / compute 1');
      if (done.length)
        chapterText(
          ctx,
          api,
          'Completed · ' + done.join(' · '),
          960,
          modelState.apc ? 780 : 975,
          27,
          themeColors.green,
          'center',
        );
    }
    foot(
      'Separate symbolic-position example · eligible full-attention blocks · no other cache groups',
    );
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
  chapterText(ctx, api, limit, 960, 1060, 23, themeColors.muted, 'center');
}
export default {
  id: 'prefix-limit',
  draw: drawPrefixLimit,
  cues: [
    'vv-prefix-limit-op-0',
    'vv-prefix-limit-op-1',
    'vv-prefix-limit-match-six',
    'vv-prefix-limit-match-seven',
    'vv-prefix-limit-match-eight',
    'vv-prefix-limit-apc-step',
    'vv-prefix-limit-apc-input',
    'vv-prefix-limit-op-2',
    'vv-prefix-limit-prompt-eight',
  ],
};
