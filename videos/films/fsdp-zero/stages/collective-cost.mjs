import { onWords } from '../card-memory.mjs';
import { bounded } from '../arithmetic.mjs';
import { GRADIENT_CONTRIBUTIONS, SHARDS } from '../fixtures.mjs';
import { reduceScatter } from '../model.mjs';
import {
  drawExpandedBar,
  drawExpandedText,
  drawExpandedTitle,
} from '../defaults.mjs';
export function drawCollectiveCost(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (a = 0.1, z = 0.85) => api.phase(progress, a, z);
  {
    if (currentBeat < 2) {
      const selected = 2;
      const changedRank = 3;
      const change = onWords(state, api, 0, 'change-c', 0.32, 0.48);
      const contributions = GRADIENT_CONTRIBUTIONS.map(row => [...row]);
      if (change >= 1) contributions[changedRank][selected] = 9;
      const sums = reduceScatter(contributions);
      const fold = onWords(state, api, 1, 'fold-column', 0, 0.15);
      const deliver = onWords(state, api, 1, 'owned-coordinate', 0.15, 0.28);
      const gather = onWords(state, api, 1, 'gather-results', 0.5, 0.68);
      const counted = Math.min(4, Math.floor(4 * fold));
      const values = contributions.map(row => row[selected]);
      const partial = values.slice(0, counted).reduce((sum, value) => sum + value, 0);
      const left = i => 335 + i * 128;
      const right = i => 1170 + i * 158;
      const rowY = r => 415 + r * 112;

      api.text(ctx, 'Local contributions', 490, 270, 41, themeColors.ink, 'center');
      api.text(ctx, 'Result held on each rank', 1395, 270, 41, themeColors.ink, 'center');
      SHARDS.forEach((id, i) => {
        api.text(ctx, id, left(i), 352, 33, i === selected ? themeColors.yellow : themeColors.muted, 'center');
        api.text(ctx, id, right(i), 352, 33, i === selected ? themeColors.yellow : themeColors.muted, 'center');
      });
      contributions.forEach((row, r) => {
        const y = rowY(r);
        api.text(ctx, 'Rank ' + r, 245, y + 12, 32, themeColors.muted, 'right');
        api.text(ctx, 'Rank ' + r, 1068, y + 12, 32, themeColors.muted, 'right');
        row.forEach((value, i) => {
          const selectedColumn = i === selected;
          api.focus.target(selectedColumn ? 'column-c' : 'other-columns', () => {
            const color = selectedColumn ? themeColors.yellow : themeColors.muted;
            const added = selectedColumn && r < counted;
            api.rect(ctx, left(i) - 50, y - 36, 100, 72, added ? color : themeColors.panel, color, 4);
            const paintValue = () => api.text(ctx, value, left(i), y + 13, 36, added ? themeColors.bg : color, 'center');
            if (selectedColumn && r === changedRank) api.focus.target('changed-contribution', paintValue);
            else paintValue();
          });
          const owner = r === i;
          const target = owner && i === selected ? 'rank-two-output' : 'output-grid';
          api.focus.target('output-grid', () => api.focus.target(target, () => {
            const x = right(i);
            const arrived = deliver > 0 && (owner || gather >= (1 + Math.abs(i - r)) / 4);
            const fill = arrived ? (owner ? themeColors.green : themeColors.blue) : themeColors.panel;
            api.rect(ctx, x - 62, y - 36, 124, 72, fill, owner ? themeColors.green : themeColors.muted, 4);
            if (arrived || (owner && i === selected))
              api.text(ctx, arrived ? sums[i] : '?', x, y + 14, 38, arrived ? themeColors.bg : themeColors.yellow, 'center');
          }));
        });
      });
      if (currentBeat === 0)
        api.text(ctx, 'After reduce-scatter, what does rank 2 receive for C?', 960, 936, 41, themeColors.ink, 'center');
      else {
        api.focus.target('column-c', () => {
          const terms = values.map((value, i) => i < counted ? value : '·').join(' + ');
          const expression = counted === values.length && deliver > 0 ? terms + '  =  ' + partial : values.slice(0, counted).join(' + ');
          api.text(ctx, 'C     ' + (expression || '?'), 535, 935, 43, themeColors.yellow, 'center');
        });
        api.text(ctx, gather === 1 ? 'Full sum on every rank' : deliver > 0 ? 'One owned sum per rank' : 'Add down C',
          1410, 935, 35, themeColors.ink, 'center');
      }
      return;
    }
    if (currentBeat === 2) {
      const half = onWords(state, api, 2, 'half-tensor', 0.23, 0.34);
      const both = onWords(state, api, 2, 'two-phases', 0.77, 0.85);
      const n = 2 + Math.floor(onWords(state, api, 2, 'ring-size', 0.4, 0.55) * 30),
        fraction = (n - 1) / n;
      drawExpandedTitle(ctx, api, 'Ring model · full tensor size S · sent bytes per rank');
      [
        ['Reduce-scatter', fraction, themeColors.pink],
        ['All-gather', fraction, themeColors.blue],
        ['All-reduce', 2 * fraction, themeColors.green],
      ].forEach(([name, v, col], i) => {
        const y = 420 + i * 180;
        const reveal = i === 2 ? both : half;
        api.focus.target(i === 2 ? 'sent-total' : 'sent-chunk', () => {
          drawExpandedText(ctx, api, name, 200, y + 40, 32, col);
          drawExpandedBar(ctx, api, v * reveal, 620, y, 900, 75, 2, col);
          drawExpandedText(ctx, api, reveal === 1 ? Number(v.toFixed(4)) + ' S' : '?', 1650, y + 50, 34, col, 'center');
        });
      });
      api.focus.target('ring-group', () => drawExpandedText(
        ctx,
        api,
        'N = ' + n + (n === 2 ? ' ranks' : ' · each single phase sends (N − 1) / N × S'),
        960,
        990,
        36,
        themeColors.yellow,
        'center',
      ));
    }
    if (currentBeat === 3) {
      drawExpandedTitle(
        ctx,
        api,
        'Equal 140 GB parameter and gradient payloads · large-group approximation',
      );
      const names = ['Gradient RS', 'Gradient AG', 'Parameter AG', 'Backward AG'];
      const q = cueProgress();
      [
        [2, 'DDP', themeColors.blue],
        [3, 'Full shard', themeColors.pink],
      ].forEach(([count, name, col], r) => {
        drawExpandedText(ctx, api, name, 190, 470 + r * 250, 34, col);
        for (let j = 0; j < count; j++) {
          const label = r === 0 ? names[j] : ['Forward AG', 'Backward AG', 'Gradient RS'][j];
          const width = 380 * bounded(q * count - j);
          api.rect(
            ctx,
            460 + j * 420,
            410 + r * 250,
            380,
            100,
            themeColors.panel,
            themeColors.muted,
            5,
          );
          if (width > 0) api.rect(ctx, 460 + j * 420, 410 + r * 250, width, 100, col, undefined, 0);
          drawExpandedText(ctx, api, label, 650 + j * 420, 560 + r * 250, 26, col, 'center');
        }
        if (q > 0.95)
          drawExpandedText(
            ctx,
            api,
            count * 140 + ' GB sent / rank',
            950,
            615 + r * 250,
            35,
            col,
            'center',
          );
      });
      if (q > 0.95)
        drawExpandedText(
          ctx,
          api,
          '420 / 280 = 1.5× volume · step time still depends on critical-path overlap',
          960,
          1000,
          30,
          themeColors.yellow,
          'center',
        );
    }
    return;
  }
  return;
}
export default {
  id: 'collective-cost',
  draw: drawCollectiveCost,
  cues: ['change-c', 'fold-column', 'owned-coordinate', 'gather-results', 'half-tensor', 'ring-size', 'two-phases'],
};
