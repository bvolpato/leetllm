import { point } from '../geometry.mjs';
import { text, rect, arrow } from '../defaults.mjs';
export function drawPromptPrefix(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  ctx.save();
  {
    api.focus.target('prompt-prefix-mechanism', () => {
      const promptP = api.focus.progress('prompt-vectors', stage(0, 0.2, 0.6));
      const prefixP = api.focus.progress('prefix-layer-state', stage(1, 0.05, 0.4));
      const loraP = api.focus.progress('prefix-lora-placement', stage(1, 0.4, 0.75));
      text(
        ctx,
        api,
        'LEARNED STATE ENTERS AT DIFFERENT LOCATIONS',
        190,
        285,
        30,
        themeColors.muted,
      );
      const columns = [300, 850, 1400];
      for (const [i, title] of ['soft prompt', 'layer prefix', 'LoRA weights'].entries()) {
        const cx = columns[i];
        text(
          ctx,
          api,
          title,
          cx + 100,
          360,
          32,
          [themeColors.cyan, themeColors.green, themeColors.yellow][i],
          'center',
        );
        const active = i === 0 ? promptP : i === 1 ? prefixP : loraP;
        for (let layer = 0; layer < 3; layer++) {
          const y = 440 + layer * 150;
          rect(ctx, api, cx, y, 210, 85, themeColors.panel, themeColors.blue, 8);
          text(ctx, api, `W${3 - layer}`, cx + 105, y + 56, 35, themeColors.blue, 'center', 'mono');
          if (layer < 2)
            arrow(
              ctx,
              api,
              point(cx + 105, y + 135),
              point(cx + 105, y + 100),
              themeColors.muted,
              2,
            );
          if (i === 1 && active > layer / 3) {
            rect(ctx, api, cx - 135, y + 5, 105, 35, '#89d98130', themeColors.green, 3);
            rect(ctx, api, cx - 135, y + 45, 105, 35, '#89d98130', themeColors.green, 3);
            text(ctx, api, 'K', cx - 82, y + 32, 25, themeColors.green, 'center');
            text(ctx, api, 'V', cx - 82, y + 72, 25, themeColors.green, 'center');
            arrow(ctx, api, point(cx - 22, y + 45), point(cx - 8, y + 45), themeColors.green, 2);
          }
          if (i === 2 && active > layer / 3) {
            rect(ctx, api, cx + 260, y, 120, 85, '#ffd75e20', themeColors.yellow, 8);
            text(ctx, api, 'BA', cx + 320, y + 56, 31, themeColors.yellow, 'center', 'mono');
            arrow(
              ctx,
              api,
              point(cx + 250, y + 45),
              point(cx + 225, y + 45),
              themeColors.yellow,
              3,
            );
          }
        }
        for (let j = 0; j < 4; j++)
          rect(ctx, api, cx + j * 50, 935, 38, 35, '#79aaff30', themeColors.blue, 3);
        if (i === 0 && active > 0) {
          for (let j = 0; j < 2; j++)
            rect(ctx, api, cx - 120 + j * 50, 935, 38, 35, '#63deec40', themeColors.cyan, 3);
          api.trace(
            ctx,
            [point(cx - 75, 920), point(cx - 75, 865), point(cx + 105, 865), point(cx + 105, 830)],
            active,
            themeColors.cyan,
            4,
          );
          text(ctx, api, 'virtual vectors', cx - 65, 1020, 25, themeColors.cyan, 'center');
        }
      }
      if (beat === 2)
        text(
          ctx,
          api,
          'Embedding rows · per-layer K/V state · factor matrices: different checkpoint tensors',
          190,
          1080 - 35,
          28,
          themeColors.muted,
        );
    });
  }
  ctx.restore();
}
export default {
  id: 'prompt-prefix',
  draw: drawPromptPrefix,
  cues: [
    'prompt-prefix-1',
    'prompt-vectors',
    'prompt-prefix-2',
    'prefix-layer-state',
    'prefix-lora-placement',
    'prompt-prefix-3',
  ],
};
