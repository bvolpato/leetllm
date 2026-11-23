import { normComparison } from '../arithmetic.mjs';
import { ended, spoken } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterEquation,
  drawChapterText,
  drawFooter,
  drawTable,
} from '../defaults.mjs';
export function drawArchitectureChoices(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    E = (cue, beat = currentBeat) => ended(state, cue, beat);
  api.focus.target('architecture-choices-mechanism', () => {
    if (currentBeat === 0) {
      drawChapterText(
        ctx,
        api,
        'Historical 2023 comparison · architecture choices retain next-token training',
        960,
        280,
        33,
        themeColors.ink,
        'center',
      );
      drawTable(
        ctx,
        api,
        [
          ['Component', 'This GPT-2-style lab', 'Llama 2'],
          ['Position', 'learned absolute', 'rotary'],
          ['Normalization', 'Pre-LN / LayerNorm', 'RMSNorm'],
          ['MLP', 'GELU', 'SwiGLU'],
          ['Head sharing', '4 query / 4 KV', 'size-specific'],
        ],
        180,
        355,
        1560,
        425,
        30,
      );
      if (cueProgress('historical-stack', 0) > 0)
        drawChapterCard(
          ctx,
          api,
          'Released Llama 2: 7B/13B use MHA · 70B uses GQA',
          250,
          865,
          1420,
          themeColors.cyan,
          90,
          32,
        );
    } else if (currentBeat === 1) {
      const n = normComparison(),
        rope = cueProgress('relative-rotation', 1) > 0;
      if (!rope) {
        drawChapterText(
          ctx,
          api,
          'Same supplied x = [1, 3] · unit gains · zero offsets · ε = 0',
          960,
          280,
          33,
          themeColors.ink,
          'center',
        );
        drawTable(
          ctx,
          api,
          [
            ['', 'LayerNorm', 'RMSNorm'],
            ['Statistic', 'mean 2; variance 1', 'mean square 5'],
            ['Operation', '(x − 2) / 1', 'x / √5'],
            [
              'Output',
              cueProgress('norm-compare', 1) > 0 ? '[−1, 1]' : 'compute',
              cueProgress('norm-compare', 1) > 0 ? '[0.4472, 1.3416]' : 'compute',
            ],
          ],
          180,
          375,
          1560,
          450,
          32,
        );
        drawChapterText(
          ctx,
          api,
          'Mean square = second moment · no centering in RMSNorm',
          960,
          925,
          30,
          themeColors.yellow,
          'center',
        );
      } else {
        drawChapterText(
          ctx,
          api,
          'RoPE pair rotation · shared shift preserves relative inner product',
          960,
          280,
          33,
          themeColors.ink,
          'center',
        );
        const turn = 0.6 * cueProgress('relative-rotation', 1),
          cx = 665,
          cy = 615,
          r = 225;
        api.circle(ctx, cx, cy, r, null, themeColors.muted, 2);
        const a = 0.35 + turn,
          k = 1.05 + turn;
        api.arrow(ctx, cx, cy, cx + r * Math.cos(a), cy - r * Math.sin(a), themeColors.blue, 6);
        api.arrow(ctx, cx, cy, cx + r * Math.cos(k), cy - r * Math.sin(k), themeColors.yellow, 6);
        drawChapterCard(
          ctx,
          api,
          'q and k rotate together',
          1050,
          395,
          650,
          themeColors.cyan,
          100,
          32,
        );
        drawChapterEquation(
          ctx,
          api,
          String.raw`q_m^Tk_n\ \propto\ \cos(\theta_n-\theta_m)`,
          1340,
          630,
          34,
        );
        drawChapterText(
          ctx,
          api,
          'Relative angle 0.70 radians',
          1340,
          760,
          30,
          themeColors.green,
          'center',
        );
        drawChapterText(
          ctx,
          api,
          'Illustrative coordinate pair · unchanged difference',
          960,
          925,
          29,
          themeColors.muted,
          'center',
        );
      }
    } else {
      const shared = cueProgress('shared-kv', 2) > 0;
      drawChapterText(
        ctx,
        api,
        'Four query heads · keep sequence length, head width and dtype fixed',
        960,
        280,
        32,
        themeColors.ink,
        'center',
      );
      for (let i = 0; i < 4; i++) {
        const x = 220 + i * 410;
        drawChapterCard(ctx, api, 'Q' + i, x, 390, 270, themeColors.blue, 95, 38);
        const group = shared ? Math.floor(i / 2) : i,
          dest = shared ? 500 + group * 820 : x + 135;
        api.arrow(ctx, x + 135, 520, dest, 650, themeColors.cyan, 4);
      }
      for (let i = 0; i < (shared ? 2 : 4); i++)
        drawChapterCard(
          ctx,
          api,
          'K' + i + ' / V' + i,
          shared ? 330 + i * 820 : 220 + i * 410,
          690,
          shared ? 600 : 270,
          themeColors.cyan,
          115,
          35,
        );
      drawChapterText(
        ctx,
        api,
        shared
          ? E('shared-kv', 2)
            ? '2 KV head pairs · 50% ideal KV elements'
            : '2 KV head pairs · ideal storage comparison pending'
          : '4 KV head pairs · baseline ideal storage',
        960,
        915,
        38,
        shared && !E('shared-kv', 2) ? themeColors.muted : themeColors.yellow,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'Architecture, storage, quality and measured speed are separate comparisons',
    );
  });
}
export default {
  id: 'architecture-choices',
  draw: drawArchitectureChoices,
  cues: [
    'architecture-choices-1',
    'historical-stack',
    'architecture-choices-2',
    'norm-compare',
    'relative-rotation',
    'architecture-choices-3',
    'shared-kv',
  ],
};
