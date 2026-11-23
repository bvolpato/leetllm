import { cueProgress } from '../construction.mjs';
import { drawTrainingAndMemoryTarget, drawTrainingAndMemoryText } from '../defaults.mjs';
export function drawOptimizerMemory(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    currentBeat = state.beat ?? 0;
  const phase = (id, b) => cueProgress(state, id, b);
  {
    drawTrainingAndMemoryText(
      ctx,
      api,
      themeColors,
      'Float32 moment state · 4 bytes per value · count trained parameters',
      170,
      245,
      31,
      themeColors.muted,
    );
    const buffer = (x, y, label, color) => {
      api.rect(ctx, x, y, 135, 42, color);
      drawTrainingAndMemoryText(ctx, api, themeColors, label, x, y + 87, 27, color);
    };
    if (currentBeat === 0) {
      drawTrainingAndMemoryTarget(ctx, api, 'state-buffers', () => {
        const methods = [
          ['SGD', 0],
          ['Momentum', 1],
          ['RMSProp', 1],
          ['AdamW', 2],
        ];
        methods.forEach(([label, count], i) => {
          const x = 230 + i * 420;
          drawTrainingAndMemoryText(ctx, api, themeColors, label, x, 365, 36, themeColors.ink);
          if (!count)
            drawTrainingAndMemoryText(
              ctx,
              api,
              themeColors,
              '0 moment bytes',
              x,
              475,
              29,
              themeColors.muted,
            );
          for (let j = 0; j < count; j++)
            buffer(
              x,
              430 + j * 145,
              j ? 'v · 4 bytes' : (label === 'RMSProp' ? 's' : 'm') + ' · 4 bytes',
              j ? themeColors.green : themeColors.cyan,
            );
        });
      });
      drawTrainingAndMemoryTarget(ctx, api, 'state-bytes', () =>
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          phase('state-bytes', 0) === 1
            ? 'AdamW: 2 × 4 = 8 bytes per trained parameter'
            : 'AdamW moment bytes per parameter = ?',
          960,
          770,
          37,
          themeColors.yellow,
          'center',
        ),
      );
      drawTrainingAndMemoryTarget(ctx, api, 'state-billion', () => {
        const count = Math.floor(phase('state-billion', 0) * 7);
        for (let i = 0; i < 7; i++) {
          const x = 250 + i * 205;
          api.rect(
            ctx,
            x,
            845,
            185,
            60,
            i < count ? themeColors.cyan : themeColors.bg,
            themeColors.cyan,
            2,
          );
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            '1B params',
            x + 92,
            955,
            26,
            themeColors.muted,
            'center',
          );
          if (i < count)
            drawTrainingAndMemoryText(
              ctx,
              api,
              themeColors,
              '8 GB',
              x + 92,
              886,
              28,
              themeColors.bg,
              'center',
            );
        }
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          count === 7 ? '7 billion × 8 bytes = 56 decimal GB' : count + ' / 7 billion counted',
          960,
          1040,
          34,
          themeColors.green,
          'center',
        );
      });
    } else if (currentBeat === 1) {
      drawTrainingAndMemoryTarget(ctx, api, 'state-extra', () => {
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          '56 GB of AdamW moments',
          220,
          345,
          39,
          themeColors.cyan,
        );
        for (const [i, label] of [
          'Parameters',
          'Gradients',
          'Activations',
          'Master copies, when used',
        ].entries())
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            '+ ' + label + ' · additional bytes',
            230,
            445 + i * 100,
            32,
            themeColors.muted,
          );
      });
      drawTrainingAndMemoryTarget(ctx, api, 'state-shards', () => {
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Four equal shards, one copy of each value',
          1030,
          345,
          29,
          themeColors.muted,
        );
        const p = phase('state-shards', 1);
        for (let i = 0; i < 4; i++) {
          const x = 1080 + (i % 2) * 360,
            y = 450 + Math.floor(i / 2) * 260;
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            'Owner ' + i,
            x,
            y - 40,
            30,
            themeColors.ink,
          );
          api.rect(ctx, x, y, 125 * p, 75, themeColors.cyan, undefined, 2);
          api.rect(ctx, x + 125 * p, y, 125 * p, 75, themeColors.green, undefined, 2);
          if (p === 1) {
            drawTrainingAndMemoryText(
              ctx,
              api,
              themeColors,
              'm 7 GB',
              x,
              y + 125,
              26,
              themeColors.cyan,
            );
            drawTrainingAndMemoryText(
              ctx,
              api,
              themeColors,
              'v 7 GB',
              x + 125,
              y + 125,
              26,
              themeColors.green,
            );
          } else
            drawTrainingAndMemoryText(
              ctx,
              api,
              themeColors,
              'Transferring moments…',
              x,
              y + 125,
              24,
              themeColors.muted,
            );
        }
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          p === 1
            ? '7 GB + 7 GB = 14 GB of moments per device'
            : 'Total moment bytes remain 56 GB.',
          960,
          1040,
          31,
          themeColors.yellow,
          'center',
        );
      });
    } else {
      drawTrainingAndMemoryTarget(ctx, api, 'trained-mask', () => {
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Fresh AdamW optimizer · four scalar weights',
          200,
          350,
          37,
          themeColors.ink,
        );
        for (let i = 0; i < 4; i++) {
          const x = 240 + i * 420,
            active = i % 2 === 0;
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            'p' + i,
            x,
            465,
            40,
            active ? themeColors.ink : themeColors.muted,
          );
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            active ? 'Receives gradient' : 'Frozen from start',
            x,
            545,
            29,
            active ? themeColors.cyan : themeColors.muted,
          );
        }
      });
      drawTrainingAndMemoryTarget(ctx, api, 'frozen-moments', () => {
        if (phase('frozen-moments', 2) > 0) {
          for (let i = 0; i < 4; i++) {
            const x = 240 + i * 420;
            if (i % 2 === 0) {
              buffer(x, 640, 'm · 4 bytes', themeColors.cyan);
              buffer(x, 800, 'v · 4 bytes', themeColors.green);
            } else
              drawTrainingAndMemoryText(
                ctx,
                api,
                themeColors,
                'No moment allocation',
                x,
                705,
                28,
                themeColors.muted,
              );
          }
        }
      });
      drawTrainingAndMemoryTarget(ctx, api, 'actual-state', () =>
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          phase('actual-state', 2) === 1
            ? '4 blocks × 4 bytes = 16 bytes of moments'
            : 'How many blocks does this optimizer allocate?',
          960,
          1040,
          29,
          themeColors.yellow,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'optimizer-memory',
  draw: drawOptimizerMemory,
  cues: [
    'state-buffers',
    'state-bytes',
    'state-billion',
    'state-extra',
    'state-shards',
    'trained-mask',
    'frozen-moments',
    'actual-state',
  ],
};
