import { chapterModel } from '../construction.mjs';
import { bar, chapterEquation, chapterText, note, operation } from '../defaults.mjs';
export function drawModelConfig(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('model-config', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    if (currentBeat === 0) {
      chapterText(ctx, api, 'Llama 3.1 · released head counts', 960, 275, 38, themeColors.cyan);
      [32, 64, 128].forEach((heads, i) => {
        const y = 380 + i * 165;
        chapterText(ctx, api, ['8B', '70B', '405B'][i], 250, y + 40, 34, themeColors.ink);
        bar(ctx, api, 420, y, 1100, heads, 128, themeColors.blue, 55);
        bar(ctx, api, 420, y + 75, 1100, 8, 128, themeColors.green, 36);
        chapterText(ctx, api, heads + '/8 = ' + heads / 8, 1720, y + 65, 35, themeColors.yellow);
      });
      operation(ctx, api, 'model-config', () =>
        chapterText(
          ctx,
          api,
          '128K context belongs to this release; original Llama 3 used 8K',
          960,
          955,
          31,
          themeColors.yellow,
        ),
      );
    } else if (currentBeat === 1) {
      chapterText(ctx, api, 'A layer-specific retention worksheet', 960, 275, 38, themeColors.cyan);
      for (let i = 0; i < 8; i++) {
        const x = 250 + i * 180,
          global = i % 2;
        api.rect(
          ctx,
          x,
          430,
          140,
          global ? 320 : 160,
          global ? themeColors.pink : themeColors.blue,
          global ? themeColors.pink : themeColors.blue,
          1,
        );
        chapterText(
          ctx,
          api,
          global ? '8K' : '4K',
          x + 70,
          global ? 805 : 655,
          29,
          global ? themeColors.pink : themeColors.blue,
        );
      }
      operation(ctx, api, 'model-config', () =>
        chapterText(
          ctx,
          api,
          'Gemma 2 alternates local 4K and global 8K layers',
          960,
          890,
          36,
          themeColors.yellow,
        ),
      );
      note(
        ctx,
        api,
        'Eight schematic layer positions · real depth comes from the actual configuration',
      );
    } else {
      chapterText(
        ctx,
        api,
        'The configuration determines the retained state',
        960,
        280,
        38,
        themeColors.cyan,
      );
      chapterText(ctx, api, 'Mistral 7B v0.3', 510, 430, 38, themeColors.blue);
      chapterText(ctx, api, 'sliding window = null', 510, 550, 37, themeColors.yellow);
      chapterText(ctx, api, 'GQA / MQA', 1400, 430, 38, themeColors.green);
      chapterText(ctx, api, 'trained projections', 1400, 550, 37, themeColors.green);
      operation(ctx, api, 'model-config', () =>
        chapterEquation(
          ctx,
          api,
          String.raw`\mathrm{total\ KV}=\sum_{\ell}\mathrm{KV}_{\ell}(\mathrm{retained\ positions}_{\ell})`,
          960,
          760,
          43,
          themeColors.ink,
        ),
      );
      note(
        ctx,
        api,
        'Allocation and RoPE flags alone do not validate long-context retrieval or model quality',
      );
    }
  }
}
export default {
  id: 'model-config',
  draw: drawModelConfig,
  cues: ['model-config-0', 'model-config-1', 'model-config-2'],
};
