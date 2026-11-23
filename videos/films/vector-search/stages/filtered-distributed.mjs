import { cueProgress } from '../construction.mjs';
import { detailText } from '../defaults.mjs';
export function drawFilteredDistributed(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const target =
    currentBeat === 3
      ? 'filtered-distributed-extension'
      : currentBeat === 4
        ? 'filtered-bridge-repair'
        : 'filtered-distributed-mechanism';
  api.focus.target(target, () => {
    if (currentBeat === 0) {
      const pool = ['EU-1', 'US-1', 'US-2', 'US-3', 'EU-2'];
      const increase = cueProgress(state, 'expand-filter-window');
      const count = 3 + Math.ceil(2 * increase);
      const result = pool.slice(0, count).filter((id) => id.startsWith('EU'));
      detailText(ctx, api, 'Trusted retrieval service', 155, 298, 38, themeColors.ink);
      api.rect(ctx, 125, 340, 1150, 410, null, themeColors.muted, 10);
      detailText(ctx, api, 'Candidate window', 175, 423, 32, themeColors.muted);
      pool.forEach((id, i) => {
        const x = 255 + 210 * i;
        const active = i < count;
        const color = active ? (id.startsWith('EU') ? themeColors.green : themeColors.ink) : themeColors.muted;
        detailText(ctx, api, id, x, 575, 46, color, 'center');
      });
      api.line(ctx, 182, 633, 322 + (count - 1) * 210, 633, themeColors.yellow, 7);
      detailText(ctx, api, 'EU results', 1390, 430, 38, themeColors.ink);
      result.forEach((id, i) => detailText(ctx, api, id, 1450, 562 + i * 113, 48, themeColors.green));
      detailText(ctx, api, result.length + ' of 2 eligible passages returned', 960, 935, 44, themeColors.yellow, 'center');
    } else if (currentBeat === 1) {
      const probability = 0.005, size = 100;
      const models = [
        ['Independent candidates', (1 - probability) ** size, 'independent-empty'],
        ['One shared region', 1 - probability, 'shared-empty'],
      ];
      detailText(ctx, api, '100 candidates    ×    0.5% chance of a match    =    0.5 expected matches', 960, 345, 39, themeColors.ink, 'center');
      models.forEach(([label, empty, cue], i) => {
        const y = 515 + 195 * i;
        detailText(ctx, api, label, 160, y, 36, themeColors.muted);
        api.line(ctx, 695, y - 14, 1475, y - 14, themeColors.muted, 3);
        const progress = cueProgress(state, cue);
        if (progress > 0)
          api.line(ctx, 695, y - 14, 695 + 780 * empty * progress, y - 14, themeColors.pink, 15);
        if (state.cues?.[cue]?.phase === 'after')
          detailText(ctx, api, (empty * 100).toFixed(1) + '%', 1725, y, 41, themeColors.pink, 'right');
      });
      detailText(ctx, api, 'Probability the candidate window is empty', 960, 825, 38, themeColors.ink, 'center');
    } else if (currentBeat === 2) {
      const missing = cueProgress(state, 'lose-shard') > 0;
      detailText(ctx, api, 'Local cutoff: five records from each shard', 960, 280, 37, themeColors.ink, 'center');
      for (let s = 0; s < 10; s++) {
        const x = 245 + (s % 5) * 312;
        const y = 370 + Math.floor(s / 5) * 232;
        const available = !(missing && s === 9);
        for (let i = 0; i < 5; i++) api.rect(ctx, x + i * 36, y, 25, 95, available ? themeColors.green : themeColors.panel, available ? null : themeColors.muted, 1);
        detailText(ctx, api, available ? 'shard ' + (s + 1) : 'no response', x + 85, y + 148, 30, available ? themeColors.muted : themeColors.yellow, 'center');
      }
      detailText(ctx, api, missing ? '45 candidates · partial response' : '50 candidates contain the exact global five', 960, 957, 42, missing ? themeColors.yellow : themeColors.green, 'center');
    } else if (currentBeat === 3) {
      const prob = 0.99 ** 10;
      detailText(
        ctx,
        api,
        'Independent illustrative shard completion events',
        960,
        290,
        35,
        themeColors.muted,
        'center',
      );
      for (let i = 0; i < 10; i++) {
        const x = 190 + i * 155;
        api.rect(ctx, x, 420, 115, 190, themeColors.panel, themeColors.blue, 3, 10);
        detailText(ctx, api, '99%', x + 57.5, 540, 31, themeColors.blue, 'center');
      }
      detailText(
        ctx,
        api,
        'P(all 10 by threshold) = 0.99¹⁰ ≈ ' + (prob * 100).toFixed(1) + '%',
        960,
        770,
        43,
        themeColors.yellow,
        'center',
      );
      detailText(
        ctx,
        api,
        'Slowest required shard + merge still remaining · measure dependence',
        960,
        970,
        31,
        themeColors.muted,
        'center',
      );
    } else {
      detailText(
        ctx,
        api,
        'Disallowed bridge stays inside the trusted traversal',
        960,
        300,
        37,
        themeColors.yellow,
        'center',
      );
      const row = [
        {
          id: 'eligible A',
          x: 330,
          c: themeColors.green,
        },
        {
          id: 'bridge',
          x: 960,
          c: themeColors.muted,
        },
        {
          id: 'eligible B',
          x: 1590,
          c: themeColors.green,
        },
      ];
      row.forEach((n) => {
        api.circle(ctx, n.x, 565, 45, n.c);
        detailText(ctx, api, n.id, n.x, 700, 34, n.c, 'center');
      });
      api.line(ctx, 390, 565, 900, 565, themeColors.cyan, 5);
      api.line(ctx, 1020, 565, 1530, 565, themeColors.cyan, 5);
      detailText(
        ctx,
        api,
        'Return A/B only · cap scans, time and resource work',
        960,
        905,
        37,
        themeColors.green,
        'center',
      );
      detailText(
        ctx,
        api,
        'Compare with filter-then-exact on a small eligible subset',
        960,
        995,
        30,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'filtered-distributed',
  draw: drawFilteredDistributed,
  cues: [
    'filtered-distributed-b1', 'expand-filter-window',
    'filtered-distributed-b2', 'independent-empty', 'shared-region', 'shared-empty',
    'filtered-distributed-b3', 'lose-shard',
    'filtered-distributed-b3-extension',
    'filter-aware-repair',
  ],
};
