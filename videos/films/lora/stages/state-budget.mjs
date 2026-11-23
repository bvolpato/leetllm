import { num } from '../geometry.mjs';
import { text, rect } from '../defaults.mjs';
export function drawStateBudget(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const earned = (id, index, start = 0.1, end = 0.8) =>
    beat > index ||
    (beat === index && api.focus.progress(id, api.phase(progress, start, end)) >= 0.999);
  ctx.save();
  {
    api.focus.target('state-budget-mechanism', () => {
      const count = beat === 0 ? 70 : 65,
        unit = 1.3;
      text(
        ctx,
        api,
        'DECIMAL GB · specified state recipe · activations and temporaries excluded',
        190,
        285,
        28,
        themeColors.muted,
      );
      const drawState = (y, label, parts) => {
        text(ctx, api, label, 190, y - 30, 31, themeColors.ink);
        let x = 190;
        for (const part of parts) {
          const width = part.gb * unit;
          if (width > 0) rect(ctx, api, x, y, width, 65, part.color, undefined, 3);
          if (width >= 90 && Number.isInteger(part.gb))
            text(
              ctx,
              api,
              num(part.gb),
              x + width / 2,
              y + 45,
              29,
              part.color === '#7d86984d' ? themeColors.ink : '#0b0c0e',
              'center',
              'mono',
            );
          x += width;
        }
        return x;
      };
      if (beat === 0) {
        const baseP = api.focus.progress('state-twelve', stage(0, 0.2, 0.5));
        const masterP = api.focus.progress('state-master', stage(0, 0.5, 0.85));
        const parts = [
          {
            gb: 140,
            color: themeColors.blue,
          },
          {
            gb: 140 * baseP,
            color: themeColors.pink,
          },
          {
            gb: 280 * baseP,
            color: themeColors.yellow,
          },
          {
            gb: 280 * baseP,
            color: themeColors.cyan,
          },
        ];
        drawState(430, '70B full training: weights + gradients + Adam m + Adam v', parts);
        text(ctx, api, '2 B', 190, 570, 31, themeColors.blue);
        text(ctx, api, '+ 2 B', 400, 570, 31, themeColors.pink);
        text(ctx, api, '+ 4 B', 650, 570, 31, themeColors.yellow);
        text(ctx, api, '+ 4 B', 1000, 570, 31, themeColors.cyan);
        if (baseP >= 0.999)
          text(ctx, api, '70 × 12 = 840 GB', 190, 665, 43, themeColors.ink, 'left', 'mono');
        if (masterP > 0) {
          drawState(805, 'Separate recipe: add an FP32 master copy', [
            ...parts,
            {
              gb: 280 * masterP,
              color: themeColors.green,
            },
          ]);
          if (masterP >= 0.999)
            text(ctx, api, '840 + 280 = 1120 GB', 190, 955, 41, themeColors.green, 'left', 'mono');
        }
      } else if (beat === 1) {
        const freeze = api.focus.progress('state-freeze', stage(1, 0.05, 0.4));
        const sixtyFive = earned('state-sixty-five', 1, 0.5, 0.9);
        drawState(430, '70B: frozen base removes its gradients and optimizer moments', [
          {
            gb: 140,
            color: themeColors.blue,
          },
          {
            gb: 140 * (1 - freeze),
            color: themeColors.pink,
          },
          {
            gb: 280 * (1 - freeze),
            color: themeColors.yellow,
          },
          {
            gb: 280 * (1 - freeze),
            color: themeColors.cyan,
          },
        ]);
        if (freeze >= 0.999)
          text(ctx, api, '140 GB base floor + adapters + runtime', 190, 585, 41, themeColors.blue);
        if (sixtyFive) {
          drawState(740, 'Separate 65B planning case', [
            {
              gb: 130,
              color: themeColors.blue,
            },
            {
              gb: 650,
              color: '#7d86984d',
            },
          ]);
          text(
            ctx,
            api,
            '130 GB frozen base · 780 GB full recipe',
            190,
            910,
            37,
            themeColors.ink,
            'left',
            'mono',
          );
        }
      } else {
        const raw = earned('state-four-bit', 2, 0.05, 0.25),
          metadata = earned('state-nested', 2, 0.25, 0.45),
          room = earned('state-room', 2, 0.45, 0.65);
        const scale = 28,
          x = 190,
          y = 505;
        text(
          ctx,
          api,
          'Separate 65B four-bit estimate · 48 GB total capacity',
          190,
          370,
          34,
          themeColors.muted,
        );
        rect(ctx, api, x, y, 48 * scale, 95, themeColors.panel, themeColors.muted, 3);
        if (raw) rect(ctx, api, x, y, 32.5 * scale, 95, themeColors.blue, undefined, 3);
        if (metadata)
          rect(
            ctx,
            api,
            x + 32.5 * scale,
            y,
            1.031494140625 * scale,
            95,
            themeColors.yellow,
            undefined,
            2,
          );
        if (room)
          rect(
            ctx,
            api,
            x + 33.531494140625 * scale,
            y,
            (48 - 33.531494140625) * scale,
            95,
            '#89d98125',
            themeColors.green,
            2,
          );
        text(
          ctx,
          api,
          raw ? '32.5 GB packed weights' : 'packed weights: ?',
          190,
          700,
          36,
          themeColors.blue,
        );
        if (metadata)
          text(ctx, api, '+ ~1.0315 GB nested scales', 190, 775, 35, themeColors.yellow);
        if (room) {
          text(
            ctx,
            api,
            '~14.4685 GB remains for every omitted allocation',
            190,
            875,
            36,
            themeColors.green,
          );
          text(
            ctx,
            api,
            'Remaining GPU space must cover activations, adapters and temporary buffers.',
            190,
            975,
            30,
            themeColors.muted,
          );
        }
      }
      void count;
    });
  }
  ctx.restore();
}
export default {
  id: 'state-budget',
  draw: drawStateBudget,
  cues: [
    'state-budget-1',
    'state-twelve',
    'state-master',
    'state-budget-2',
    'state-freeze',
    'state-sixty-five',
    'state-budget-3',
    'state-four-bit',
    'state-nested',
    'state-room',
  ],
};
