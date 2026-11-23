import { point } from '../geometry.mjs';
import { text, rect } from '../defaults.mjs';
export function drawShardedTraining(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  ctx.save();
  {
    api.focus.target('sharded-training-mechanism', () => {
      const gather = api.focus.progress('sharded-gather', stage(1, 0.2, 0.6));
      const block = api.focus.progress('sharded-block', stage(1, 0.6, 0.85));
      text(
        ctx,
        api,
        beat === 0
          ? 'Automatic device mapping describes inference placement'
          : 'SHARDED FROZEN BASE · four-rank illustrative unit',
        190,
        285,
        30,
        themeColors.muted,
      );
      for (let rank = 0; rank < 4; rank++) {
        const y = 380 + rank * 120;
        text(ctx, api, `rank ${rank}`, 190, y + 45, 30, themeColors.muted, 'left', 'mono');
        for (let j = 0; j < 2; j++) {
          rect(ctx, api, 430 + j * 110, y, 85, 70, '#79aaff30', themeColors.blue, 4);
          text(
            ctx,
            api,
            `w${rank + j * 4}`,
            472 + j * 110,
            y + 47,
            28,
            themeColors.blue,
            'center',
            'mono',
          );
        }
        if (beat === 1 && gather > 0 && rank > 0) {
          api.trace(
            ctx,
            [point(690, y + 35), point(830, y + 35), point(830, 415), point(950, 415)],
            gather,
            themeColors.blue,
            3,
          );
        }
      }
      if (beat === 0) {
        text(ctx, api, 'A training launcher must establish', 1000, 430, 35, themeColors.ink);
        [
          'gradient synchronization',
          'trainable optimizer ownership',
          'supported quantized/adapter layout',
        ].forEach((s, i) => text(ctx, api, s, 1000, 530 + i * 100, 30, themeColors.yellow));
      } else if (beat === 1) {
        text(ctx, api, 'rank 0: materialize before compute', 970, 345, 31, themeColors.blue);
        const max = block > 0 ? 4 : 8;
        for (let i = 0; i < max; i++) {
          const own = i === 0 || i === 4,
            visible = own || gather >= (i + 1) / 8;
          rect(
            ctx,
            api,
            980 + (i % 4) * 170,
            390 + Math.floor(i / 4) * 115,
            135,
            80,
            visible ? '#79aaff40' : themeColors.panel,
            visible ? themeColors.blue : themeColors.muted,
            4,
          );
          if (visible)
            text(
              ctx,
              api,
              `w${i}`,
              1047 + (i % 4) * 170,
              445 + Math.floor(i / 4) * 115,
              30,
              themeColors.blue,
              'center',
              'mono',
            );
        }
        if (block > 0)
          text(ctx, api, 'smaller wrapped unit → smaller gather', 970, 675, 30, themeColors.green);
        text(ctx, api, '+ live activations', 970, 775, 30, themeColors.pink);
        text(
          ctx,
          api,
          '+ factors, optimizer and temporary buffers',
          970,
          855,
          28,
          themeColors.yellow,
        );
      } else {
        text(ctx, api, 'Resume from a training checkpoint', 970, 380, 34, themeColors.yellow);
        const fields = [
          'base + tokenizer + targets',
          'quantization + optimizer + schedule',
          'RNG + data cursor + worker state',
        ];
        fields.forEach((s, i) => {
          rect(
            ctx,
            api,
            970,
            450 + i * 140,
            760,
            90,
            themeColors.panel,
            i === 2 ? themeColors.green : themeColors.muted,
          );
          text(ctx, api, s, 1000, 510 + i * 140, 30, i === 2 ? themeColors.green : themeColors.ink);
        });
      }
    });
  }
  ctx.restore();
}
export default {
  id: 'sharded-training',
  draw: drawShardedTraining,
  cues: [
    'sharded-training-1',
    'sharded-training-2',
    'sharded-gather',
    'sharded-block',
    'sharded-training-3',
  ],
};
