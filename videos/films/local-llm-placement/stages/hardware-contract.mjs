import { sentenceCounts } from '../fixtures.mjs';
import {
  constructionCell,
  constructionLine,
  constructionNote,
  constructionRectangle,
  constructionText,
} from '../defaults.mjs';
export function drawHardwareContract(ctx, scene, state, api) {
  api.focus.target('pl-hardware-contract-trace', () => {
    const { C, components: c } = api,
      b = state.beat,
      beatP = state.beatP ?? 0;
    const op = (beat, sentence) => {
      if (
        !sentenceCounts['hardware-contract'] ||
        sentence < 0 ||
        sentence >= sentenceCounts['hardware-contract'][beat]
      )
        throw Error('Invalid placement sentence hardware-contract/' + beat + '/' + sentence);
      if (b > beat) return 1;
      if (b < beat) return 0;
      return state.cues
        ? api.focus.progress(`pl-${'hardware-contract'}-${beat}-${sentence}`, 0)
        : Math.max(0, Math.min(1, beatP * sentenceCounts['hardware-contract'][beat] - sentence));
    };
    const done = (beat, sentence) => op(beat, sentence) >= 1;
    {
      constructionText(
        ctx,
        api,
        'Hardware specifications cited in the lesson',
        150,
        265,
        30,
        C.muted,
      );
      if (b === 0) {
        constructionText(ctx, api, 'RTX 4090', 160, 350, 40, C.blue);
        constructionText(ctx, api, 'Physical capacity', 160, 430, 30);
        constructionText(ctx, api, 'Peak bandwidth', 1000, 430, 30);
        const ready = done(0, 2);
        constructionRectangle(ctx, api, 160, 490, 640, 260, C.muted);
        if (ready) {
          for (let i = 0; i < 24; i++)
            constructionRectangle(
              ctx,
              api,
              175 + (i % 8) * 77,
              510 + Math.floor(i / 8) * 72,
              58,
              48,
              C.blue,
              true,
            );
          constructionText(ctx, api, '24 GB · GDDR6X', 160, 810, 35, C.blue);
          constructionText(ctx, api, '384-bit interface', 1000, 510, 35, C.cyan);
          for (let i = 0; i < 12; i++)
            constructionLine(ctx, api, 1000, 550 + i * 14, 1570, 550 + i * 14, C.cyan);
          constructionText(ctx, api, '1,008 GB/s peak', 1000, 810, 35, C.cyan);
        }
        if (done(0, 3)) {
          constructionCell(ctx, api, '4-bit stored codes', 160, 870, 460, 64, C.yellow);
          constructionText(ctx, api, 'unpack → floating-point arithmetic', 720, 914, 30, C.green);
        }
      } else if (b === 1) {
        const vals = [
          {
            name: 'M5 Max',
            gb: 128,
            bw: 460,
          },
          {
            name: 'M5 Max',
            gb: 128,
            bw: 614,
          },
          {
            name: 'M5 Ultra',
            gb: 512,
            bw: 1200,
          },
        ];
        vals.forEach((r, i) => {
          const y = 390 + i * 170,
            ready = done(1, i === 2 ? 1 : 0);
          constructionText(ctx, api, r.name, 160, y, 34, C.blue);
          constructionText(ctx, api, 'Capacity', 460, y - 35, 25, C.muted);
          constructionText(ctx, api, 'Peak GB/s', 1010, y - 35, 25, C.muted);
          constructionRectangle(ctx, api, 460, y - 18, 450, 32, C.muted);
          constructionRectangle(ctx, api, 1010, y - 18, 560, 32, C.muted);
          if (ready) {
            constructionRectangle(ctx, api, 460, y - 18, (r.gb / 512) * 450, 32, C.blue, true);
            constructionRectangle(ctx, api, 1010, y - 18, (r.bw / 1200) * 560, 32, C.cyan, true);
            constructionText(ctx, api, r.gb + ' GB', 460, y + 65, 28, C.blue);
            constructionText(ctx, api, r.bw.toLocaleString() + ' GB/s', 1010, y + 65, 28, C.cyan);
          }
        });
        constructionNote(
          ctx,
          api,
          'Separate axes: more capacity does not establish a faster measured request',
        );
      } else {
        constructionText(
          ctx,
          api,
          'One physical storage pool · separate live allocations',
          150,
          300,
          32,
          C.cyan,
        );
        const widths = [
          ['OS + apps', 310, C.yellow],
          ['Weights', 500, C.blue],
          ['KV', 300, C.cyan],
          ['Workspace', 180, C.pink],
        ];
        let x = 150;
        for (const [name, w, col] of widths) {
          constructionRectangle(ctx, api, x, 420, w, 190, col, true);
          constructionText(ctx, api, name, x + w / 2, 665, 29, col, 'center');
          x += w;
        }
        if (done(2, 2)) {
          constructionCell(ctx, api, 'MLX CPU', 220, 760, 440, 85, C.yellow);
          constructionCell(ctx, api, 'MLX GPU', 790, 760, 440, 85, C.cyan);
          constructionCell(ctx, api, 'Neural Engine', 1330, 760, 420, 85, C.muted);
          constructionText(ctx, api, 'not an MLX device', 1540, 900, 27, C.pink, 'center');
        }
        constructionNote(
          ctx,
          api,
          'Shared storage still needs dependency and working-set evidence',
        );
      }
    }
  });
}
export default {
  id: 'hardware-contract',
  draw: drawHardwareContract,
  cues: [
    'pl-hardware-contract-0-0',
    'pl-hardware-contract-0-1',
    'pl-hardware-contract-0-2',
    'pl-hardware-contract-0-3',
    'pl-hardware-contract-1-0',
    'pl-hardware-contract-1-1',
    'pl-hardware-contract-1-2',
    'pl-hardware-contract-1-3',
    'pl-hardware-contract-2-0',
    'pl-hardware-contract-2-1',
    'pl-hardware-contract-2-2',
    'pl-hardware-contract-2-3',
  ],
};
