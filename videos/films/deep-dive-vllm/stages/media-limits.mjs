import { vvProgress, vvState } from '../construction.mjs';
import { arrow, chapterCard, chapterText, grid } from '../defaults.mjs';
export function drawMediaLimits(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('media-limits', state),
    { b: currentBeat } = modelState,
    cueProgress = (name, beat = currentBeat) => vvProgress(state, 'vv-media-limits-' + name, beat),
    resultComplete = (name, beat = currentBeat) => cueProgress(name, beat) === 1;
  let title = '';
  const head = (x) => (title = x);
  api.focus.target('vllm-media-limits-mechanism', () => {
    head(
      currentBeat === 0
        ? 'Compressed bytes and decoded allocations use separate meters'
        : currentBeat === 1
          ? 'Server overrides need their own trust boundary'
          : 'Keep media work at its API owner',
    );
    if (currentBeat === 0) {
      grid(ctx, api, [['red ×6', 'blue ×6']], 150, 400, 680, 120, themeColors.blue, 33);
      chapterText(
        ctx,
        api,
        'Two runs of color',
        490,
        650,
        28,
        themeColors.blue,
        'center',
      );
      const n = Math.ceil(cueProgress('expand', 0) * 12);
      for (let i = 0; i < n; i++)
        api.rect(
          ctx,
          1050 + (i % 4) * 170,
          380 + Math.floor(i / 4) * 150,
          150,
          125,
          i < 6 ? themeColors.red : themeColors.blue,
          null,
          8,
        );
      chapterText(
        ctx,
        api,
        'Downloaded representation',
        490,
        850,
        30,
        themeColors.yellow,
        'center',
      );
      chapterText(ctx, api, 'Decoded pixels', 1400, 920, 30, themeColors.yellow, 'center');
    } else if (currentBeat === 1) {
      grid(
        ctx,
        api,
        [
          ['URL/domain', 'Compressed bytes', 'Image pixels'],
          ['Audio bytes', 'Duration', 'Decoded audio bytes'],
        ],
        150,
        370,
        1600,
        300,
        themeColors.blue,
        28,
      );
      chapterCard(ctx, api, 'Client processor overrides', 150, 820, 730, themeColors.pink);
      chapterCard(
        ctx,
        api,
        resultComplete('trust-override', 1)
          ? 'Server trust flag required'
          : 'Apply installed server policy',
        1040,
        820,
        730,
        themeColors.yellow,
        90,
        27,
      );
    } else {
      chapterCard(ctx, api, 'R1 · permitted source', 150, 370, 700, themeColors.blue);
      chapterCard(ctx, api, 'API media /tokenizer', 1060, 370, 700, themeColors.yellow);
      arrow(ctx, api, 880, 415, 1040, 415);
      grid(
        ctx,
        api,
        [
          ['Request', 'URL /bytes', 'Decoded demand'],
          ['R1', 'same source retained', 'decoded pixel count'],
        ],
        150,
        700,
        1600,
        230,
        themeColors.cyan,
        28,
      );
      chapterText(
        ctx,
        api,
        'Compare API input time with worker prefill time.',
        960,
        1010,
        29,
        themeColors.green,
        'center',
      );
    }
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
}
export default {
  id: 'media-limits',
  draw: drawMediaLimits,
  cues: [
    'vv-media-limits-op-0',
    'vv-media-limits-expand',
    'vv-media-limits-op-1',
    'vv-media-limits-trust-override',
    'vv-media-limits-op-2',
  ],
};
