import { clamp } from '../arithmetic.mjs';
import { ONLINE_RUBRIC } from '../fixtures.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { rubricReadout } from '../model.mjs';
import { box, caption, text as constructionText } from '../defaults.mjs';
export function drawRubricEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'rubric-evidence'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1,
    N = (n, p) => Math.min(n, Math.floor(clamp(p) * n + 1e-8));
  api.focus.target('oa-rubric-evidence-mechanism', () => {
    const axes = ['Clarity', 'Accuracy', 'Citation'],
      r = rubricReadout();
    constructionText(
      ctx,
      api,
      'Supplied paired rubric scores · A / B',
      180,
      275,
      30,
      themeColors.muted,
    );
    if (B === 0)
      axes.forEach((a, i) =>
        constructionText(ctx, api, a, 760 + i * 340, 325, 30, themeColors.cyan, 'center'),
      );
    else
      constructionText(
        ctx,
        api,
        B === 1
          ? 'Pairwise preference · five supplied comparisons'
          : 'Balanced source-grounded review packet',
        960,
        325,
        30,
        themeColors.cyan,
        'center',
      );
    if (B === 0) {
      const shown = N(5, cueProgress('rows', 0));
      ONLINE_RUBRIC.forEach((row, i) => {
        const y = 380 + i * 70;
        constructionText(ctx, api, row.id, 250, y, 30, themeColors.muted);
        axes.forEach((_, j) =>
          constructionText(
            ctx,
            api,
            i < shown ? `${row.a[j]} / ${row.b[j]}` : '·',
            760 + j * 340,
            y,
            33,
            i < shown ? themeColors.ink : themeColors.muted,
            'center',
          ),
        );
      });
      axes.forEach((_, j) => {
        const reveal = resultComplete(['clarity', 'accuracy', 'citation'][j], 0);
        constructionText(
          ctx,
          api,
          reveal ? `${r.a[j].toFixed(1)} / ${r.b[j].toFixed(1)}` : 'sum / 5',
          760 + j * 340,
          780,
          35,
          reveal ? themeColors.green : themeColors.muted,
          'center',
        );
      });
    }
    if (B === 1) {
      [1, 1, 1, 1, 0.5].forEach((v, i) =>
        box(
          ctx,
          api,
          v === 0.5 ? 'TIE: ½' : 'B: 1',
          215 + i * 305,
          400,
          260,
          110,
          v === 0.5 ? themeColors.yellow : themeColors.cyan,
          33,
        ),
      );
      if (resultComplete('ties', 1))
        box(ctx, api, '(4 + ½) / 5 = 90%', 540, 620, 840, 115, themeColors.green, 44);
    }
    if (B === 2) {
      box(
        ctx,
        api,
        ['Presentation slot 1: candidate X', 'Presentation slot 2: candidate Y'],
        300,
        380,
        1320,
        150,
        themeColors.cyan,
        32,
      );
      if (resultComplete('blind', 2)) {
        box(
          ctx,
          api,
          ['Swap the display order', 'Keep question, rubric and source fixed'],
          300,
          620,
          1320,
          130,
          themeColors.yellow,
          31,
        );
      }
    }
    caption(
      ctx,
      api,
      B < 2
        ? 'Each selected question contributes one comparison'
        : 'Blind identities, balance positions and audit against held-out human labels',
    );
  });
}
export default {
  id: 'rubric-evidence',
  draw: drawRubricEvidence,
  cues: [
    'oa-rubric-evidence-0',
    'oa-rubric-evidence-rows',
    'oa-rubric-evidence-clarity',
    'oa-rubric-evidence-accuracy',
    'oa-rubric-evidence-citation',
    'oa-rubric-evidence-1',
    'oa-rubric-evidence-ties',
    'oa-rubric-evidence-2',
    'oa-rubric-evidence-blind',
  ],
};
