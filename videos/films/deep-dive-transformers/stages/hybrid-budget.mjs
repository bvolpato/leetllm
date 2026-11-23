import { sampleModel } from '../model.mjs';
import {
  chapterBox,
  chapterGrid,
  chapterMath,
  chapterText,
  chapterTitle,
  chapterTransfer,
} from '../defaults.mjs';
export function drawHybridBudget(ctx, scene, state, api) {
  return api.focus.target('hf-hybrid-budget-mechanism', () => {
    const { C: themeColors, components: components } = api,
      modelState = sampleModel('hybrid-budget', state),
      { b: currentBeat, p: progress } = modelState;
    {
      chapterTitle(
        ctx,
        api,
        currentBeat === 0
          ? 'Sum payload factors for actual stored KV'
          : currentBeat === 1
            ? 'Two full layers and two windowed layers'
            : 'Cache offload and serving pools have different owners',
      );
      if (currentBeat === 0) {
        chapterGrid(
          ctx,
          api,
          [
            ['Factor', 'K/V', 'layers', 'active seq', 'length', 'KV heads', 'head width', 'bytes'],
            ['Payload', '2', 'L', 'B', 'S', 'H', 'D', 'p'],
          ],
          160,
          430,
          1600,
          180,
          themeColors.cyan,
          26,
        );
        chapterMath(
          ctx,
          api,
          String.raw`\mathrm{MiB}=\mathrm{bytes}/1048576`,
          960,
          810,
          47,
          themeColors.yellow,
        );
      } else if (currentBeat === 1) {
        for (let i = 0; i < 4; i++) {
          chapterText(
            ctx,
            api,
            'Layer ' + i + (i < 2 ? ' full' : ' window'),
            220,
            425 + i * 110,
            28,
            themeColors.blue,
          );
          components.panel({
            x: 640,
            y: 385 + i * 110,
            width: modelState.lengths[i] * 9,
            height: 65,
            fill: i < 2 ? themeColors.cyan : themeColors.pink,
            stroke: i < 2 ? themeColors.cyan : themeColors.pink,
          });
          chapterText(
            ctx,
            api,
            modelState.lengths[i],
            1670,
            430 + i * 110,
            30,
            themeColors.ink,
            'right',
          );
        }
        chapterText(
          ctx,
          api,
          modelState.showLengths ? 'Retained lengths = 240' : 'Retained lengths = ?',
          960,
          900,
          35,
          modelState.showLengths ? themeColors.cyan : themeColors.yellow,
          'center',
        );
        chapterText(
          ctx,
          api,
          modelState.showBytes
            ? '240 × 64 = 15,360 bytes'
            : '2 K/V × 2 heads × 8 width × 2 bytes = 64',
          960,
          985,
          35,
          modelState.showBytes ? themeColors.green : themeColors.yellow,
          'center',
        );
      } else {
        chapterBox(ctx, api, 'Dynamic / static cache', 180, 420, 650, themeColors.blue);
        chapterBox(ctx, api, 'Attention on execution device', 1090, 420, 650, themeColors.cyan);
        chapterTransfer(
          ctx,
          api,
          [
            {
              x: 850,
              y: 470,
            },
            {
              x: 1050,
              y: 470,
            },
          ],
          progress,
        );
        chapterGrid(
          ctx,
          api,
          [
            ['Cache object', 'Versioned offload support'],
            ['Serving runtime', 'Paging, sharing references, admission'],
          ],
          260,
          700,
          1400,
          190,
          themeColors.pink,
          29,
        );
      }
      return;
    }
  });
}
export default {
  id: 'hybrid-budget',
  draw: drawHybridBudget,
  cues: [
    'hf-hybrid-budget-0',
    'hf-hybrid-budget-1',
    'hf-hybrid-length',
    'hf-hybrid-bytes',
    'hf-hybrid-budget-2',
  ],
};
