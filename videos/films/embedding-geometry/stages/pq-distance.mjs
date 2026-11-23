import { PQ_QUERY } from '../fixtures.mjs';
import { pqTables } from '../model.mjs';
import { cell, geometryText, heading, line } from '../defaults.mjs';
export function drawPqDistance(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z),
    cue = (id) => {
      const c = state.cues?.[id];
      return c?.phase === 'before' ? 0 : c?.phase === 'after' ? 1 : (c?.progress ?? cueProgress());
    };
  {
    if (currentBeat < 2) {
      heading(ctx, api, 'Toy ADC · full query stays unquantized · squared-L2 table');
      const table = pqTables(),
        q = cueProgress();
      ['Subspace / query pair', 'centroid0', 'centroid1'].forEach((v, i) =>
        geometryText(ctx, api, v, [390, 1000, 1510][i], 350, 29, themeColors.muted, 'center'),
      );
      for (let i = 0; i < 4; i++) {
        const y = 410 + i * 130;
        geometryText(
          ctx,
          api,
          i + ' : [' + PQ_QUERY[i].join(', ') + ']',
          390,
          y + 42,
          31,
          themeColors.cyan,
          'center',
        );
        for (let j = 0; j < 2; j++) {
          const x = 830 + j * 510;
          api.rect(
            ctx,
            x,
            y,
            340,
            80,
            themeColors.panel,
            j ? themeColors.blue : themeColors.pink,
            3,
          );
          if (currentBeat === 1 || q > (i + 1) / 5)
            geometryText(
              ctx,
              api,
              table[i][j].toFixed(2),
              x + 170,
              y + 51,
              37,
              j ? themeColors.blue : themeColors.pink,
              'center',
            );
        }
      }
      if (currentBeat === 1) {
        const part = Math.min(4, Math.floor(cue('pq-add') * 5)),
          totals = [0, 0];
        for (let i = 0; i < part; i++) {
          totals[0] += table[i][0];
          totals[1] += table[i][1];
          line(ctx, api, 830 + 510 + 340, 450 + i * 130, 1745, 450 + i * 130, themeColors.blue, 5);
        }
        api.focus.target('pq-totals', () =>
          geometryText(
            ctx,
            api,
            part === 4
              ? 'IDs1111 → 0.08 · IDs0000 → 56.57'
              : 'Sum ' +
                  part +
                  ' selected subspace entries: ' +
                  totals[1].toFixed(2) +
                  ' / ' +
                  totals[0].toFixed(2),
            960,
            1030,
            37,
            themeColors.yellow,
            'center',
          ),
        );
      }
    } else {
      const q = cueProgress();
      heading(
        ctx,
        api,
        q < 0.3
          ? 'Real 96×256 FP32 lookup table: 98,304 B = 96 KiB'
          : 'Separate scalar codebook: centroids 0 and 2 · query 1.4',
      );
      if (q < 0.3) {
        for (let i = 0; i < 12; i++)
          for (let j = 0; j < 32; j++)
            api.rect(
              ctx,
              330 + j * 40,
              350 + i * 40,
              32,
              30,
              (i + j) % 4 ? themeColors.panel : themeColors.blue,
              themeColors.muted,
              1,
            );
        geometryText(
          ctx,
          api,
          'Schematic table blocks · float lookups and additions',
          960,
          990,
          32,
          themeColors.ink,
          'center',
        );
      } else {
        ['Document', 'True squared gap', 'ADC: full query', 'SDC: query→2'].forEach((v, i) =>
          geometryText(
            ctx,
            api,
            v,
            [260, 680, 1120, 1570][i],
            410,
            27,
            themeColors.muted,
            'center',
          ),
        );
        [1.4, 2].forEach((d, i) => {
          const y = 580 + i * 230,
            vals = [d, (1.4 - d) ** 2, 0.36, 0];
          vals.forEach((v, j) =>
            cell(
              ctx,
              api,
              j === 0 ? v : v.toFixed(2),
              [160, 540, 980, 1430][j],
              y,
              j ? 300 : 210,
              110,
              [themeColors.ink, themeColors.green, themeColors.blue, themeColors.pink][j],
            ),
          );
        });
        geometryText(
          ctx,
          api,
          'Both docs map to centroid 2; neither code can recover their original distinction',
          960,
          1030,
          30,
          themeColors.yellow,
          'center',
        );
      }
    }
    return;
  }
  return;
}
export default {
  id: 'pq-distance',
  draw: drawPqDistance,
  cues: ['pq-add'],
};
