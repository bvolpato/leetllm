import { ended, spoken } from '../construction.mjs';
import { drawChapterCard, drawChapterEquation, drawChapterText, drawTable } from '../defaults.mjs';
export function drawPrelnBlock(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    E = (cue, beat = currentBeat) => ended(state, cue, beat);
  api.focus.target('preln-block-mechanism', () => {
    if (currentBeat === 0) {
      drawChapterText(
        ctx,
        api,
        'Full-lab dimensions · structural view of one batch',
        960,
        280,
        35,
        themeColors.ink,
        'center',
      );
      drawTable(
        ctx,
        api,
        [
          ['IDs', 'Hidden', 'Each Q / K / V'],
          [
            '[12, 48]',
            '[12, 48, 96]',
            cueProgress('split-heads', 0) > 0 ? '[12, 4, 48, 24]' : '96 → 4 heads',
          ],
        ],
        170,
        360,
        1580,
        190,
        33,
      );
      if (cueProgress('score-shape', 0) > 0) {
        const x = 245,
          y = 635,
          cell = 22;
        for (let r = 0; r < 12; r++)
          for (let col = 0; col < 12; col++)
            api.rect(
              ctx,
              x + col * cell,
              y + r * cell,
              cell - 2,
              cell - 2,
              col <= r ? themeColors.blue : themeColors.panel,
              themeColors.muted,
              1,
            );
        drawChapterText(
          ctx,
          api,
          'Causal score structure',
          390,
          950,
          27,
          themeColors.cyan,
          'center',
        );
        drawChapterEquation(
          ctx,
          api,
          String.raw`\operatorname{softmax}(QK^T/\sqrt{24}+M)V`,
          1200,
          715,
          44,
        );
        drawChapterText(
          ctx,
          api,
          'Scores [12, 4, 48, 48]',
          1200,
          840,
          33,
          themeColors.yellow,
          'center',
        );
        drawChapterText(
          ctx,
          api,
          'Shown triangle is a magnified structural slice',
          1200,
          930,
          26,
          themeColors.muted,
          'center',
        );
      }
    } else if (currentBeat === 1) {
      const u = E('residual-block', 1);
      drawChapterText(
        ctx,
        api,
        'One token through a decoder block',
        960,
        280,
        35,
        themeColors.ink,
        'center',
      );
      const h = drawChapterCard(ctx, api, 'h', 180, 425, 200, themeColors.blue, 100, 44),
        ln = drawChapterCard(ctx, api, 'LN(h)', 505, 425, 280, themeColors.cyan, 100, 35),
        att = drawChapterCard(ctx, api, 'Attention', 920, 425, 350, themeColors.cyan, 100, 34),
        out = drawChapterCard(
          ctx,
          api,
          u ? 'u = h + branch' : 'Add',
          1460,
          425,
          290,
          themeColors.yellow,
          100,
          31,
        );
      api.connect(ctx, h, ln, {
        color: themeColors.blue,
        gap: 16,
      });
      api.connect(ctx, ln, att, {
        color: themeColors.cyan,
        gap: 16,
      });
      api.connect(ctx, att, out, {
        color: themeColors.cyan,
        gap: 16,
      });
      api.line(ctx, 280, 400, 280, 335, themeColors.blue, 4);
      api.line(ctx, 280, 335, 1605, 335, themeColors.blue, 4);
      api.arrow(ctx, 1605, 335, 1605, 395, themeColors.blue, 4);
      if (u) {
        const expand = cueProgress('expand-width', 1);
        const project = cueProgress('gelu-width', 1);
        const added = E('add-mlp', 1);
        const groupWidth = 144;
        const width = groupWidth * (1 + 3 * expand * (1 - project));
        const branchLeft = 540;
        drawChapterCard(ctx, api, 'u', 180, 706, 200, themeColors.blue, 100, 44);
        api.arrow(ctx, 396, 756, branchLeft - 24, 756, themeColors.cyan, 4);
        api.rect(ctx, branchLeft, 726, width, 60, themeColors.cyan, undefined, 0);
        for (let mark = groupWidth; mark < width - 1; mark += groupWidth) {
          api.line(ctx, branchLeft + mark, 728, branchLeft + mark, 784, themeColors.bg, 3);
        }
        const operation =
          project > 0
            ? 'Output projection'
            : cueProgress('apply-gelu', 1) > 0
              ? 'GELU   x Φ(x)'
              : expand > 0
                ? 'Input projection'
                : 'Layer normalization';
        drawChapterText(ctx, api, operation, branchLeft, 684, 35, themeColors.ink);
        const widthLabel =
          project > 0 && project < 1
            ? '384 → 96 features'
            : expand > 0 && expand < 1
              ? '96 → 384 features'
              : width === groupWidth
                ? '96 features'
                : '384 features';
        drawChapterText(ctx, api, widthLabel, branchLeft, 844, 33, themeColors.cyan);
        api.line(ctx, 280, 826, 280, 926, themeColors.blue, 4);
        api.line(ctx, 280, 926, 1605, 926, themeColors.blue, 4);
        api.arrow(ctx, 1605, 926, 1605, 826, themeColors.blue, 4);
        if (project === 1)
          api.arrow(ctx, branchLeft + width + 16, 756, 1440, 756, themeColors.cyan, 4);
        drawChapterCard(
          ctx,
          api,
          added ? 'h′ = u + branch' : 'Add',
          1460,
          706,
          290,
          themeColors.yellow,
          100,
          31,
        );
      }
    } else {
      drawChapterText(
        ctx,
        api,
        'Two blocks → final LN → tied vocabulary head',
        960,
        285,
        35,
        themeColors.ink,
        'center',
      );
      ['Block 1', 'Block 2', 'Final LN'].forEach((v, i) =>
        drawChapterCard(ctx, api, v, 180 + i * 450, 380, 350, themeColors.cyan, 100, 34),
      );
      if (cueProgress('tied-output', 2) > 0) {
        api.line(ctx, 1580, 355, 1580, 580, themeColors.blue, 4);
        drawChapterCard(ctx, api, 'Wtokenᵀ', 1480, 620, 270, themeColors.blue, 110, 36);
        drawChapterText(ctx, api, 'Same token storage', 1615, 800, 25, themeColors.blue, 'center');
        drawTable(
          ctx,
          api,
          [
            ['Logits', 'Flattened rows'],
            ['[12, 48, 17485]', '[576, 17485]'],
          ],
          210,
          625,
          1070,
          180,
          31,
        );
      }
      if (E('logit-storage', 2))
        drawChapterCard(
          ctx,
          api,
          '12 × 48 × 17,485 × 4 = 40,285,440 bytes',
          210,
          875,
          1500,
          themeColors.yellow,
          85,
          35,
        );
    }
  });
}
export default {
  id: 'preln-block',
  draw: drawPrelnBlock,
  cues: [
    'preln-block-1',
    'split-heads',
    'score-shape',
    'preln-block-2',
    'residual-block',
    'expand-width',
    'apply-gelu',
    'gelu-width',
    'add-mlp',
    'preln-block-3',
    'tied-output',
    'logit-storage',
  ],
};
