import { pca } from '../fixtures.mjs';
import { visibleLineSegments } from '../arithmetic.mjs';
import { directed, energyRows } from '../model.mjs';
import {
  extensionAxes,
  extensionMath,
  extensionNote,
  extensionRows,
  extensionSegment,
  extensionText,
} from '../defaults.mjs';
export function drawSolverContract(ctx, scene, state, api) {
  return api.focus.target('solver-contract-construction', () => {
    {
      const { C: themeColors } = api,
        currentBeat = state.beat ?? 0;
      const labelBoxes = [],
        pendingSegments = [];
      const cueProgress = (beat, sentence) =>
          directed(state, `cp-solver-contract-${beat}-${sentence}`, beat),
        resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
      {
        const energy = energyRows(),
          squares = [
            energy.reduce((s, r) => s + r.retained, 0),
            energy.reduce((s, r) => s + r.discarded, 0),
          ],
          cov = [0, 1].map((i) =>
            [0, 1].map((j) => energy.reduce((s, r) => s + r.centered[i] * r.centered[j], 0) / 5),
          );
        if (currentBeat < 2) {
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Same centered Xc · 6 × 2',
            430,
            270,
            34,
            themeColors.cyan,
          );
          energy.forEach((row, i) => {
            extensionText(ctx, api, labelBoxes, row.id, 180, 370 + i * 77, 26, themeColors.muted);
            row.centered.forEach((v, j) =>
              extensionText(
                ctx,
                api,
                labelBoxes,
                v.toFixed(3),
                360 + j * 220,
                370 + i * 77,
                31,
                themeColors.cyan,
              ),
            );
          });
          extensionText(
            ctx,
            api,
            labelBoxes,
            currentBeat === 0 ? 'Covariance C = XcᵀXc / 5' : 'σ² / (n − 1) = λ',
            1400,
            320,
            35,
            themeColors.yellow,
          );
          if (currentBeat === 0) {
            cov.forEach((row, i) =>
              row.forEach((v, j) =>
                extensionText(
                  ctx,
                  api,
                  labelBoxes,
                  cueProgress(0, 1) > 0 ? v.toFixed(4) : '?',
                  1250 + j * 280,
                  460 + i * 120,
                  37,
                  themeColors.cyan,
                ),
              ),
            );
            if (cueProgress(0, 3) > 0) {
              extensionText(
                ctx,
                api,
                labelBoxes,
                'Direct SVD: Xc = U Σ Vᵀ',
                1400,
                745,
                37,
                themeColors.green,
              );
              extensionText(
                ctx,
                api,
                labelBoxes,
                'V columns give the same principal directions',
                1400,
                845,
                27,
                themeColors.muted,
              );
            }
          } else {
            squares.forEach((v, i) =>
              extensionMath(
                ctx,
                api,
                '(' +
                  Math.sqrt(v).toFixed(4) +
                  ')² / 5 = ' +
                  (resultComplete(1, 1) ? (v / 5).toFixed(4) : '?'),
                1400,
                475 + i * 150,
                38,
                i ? themeColors.pink : themeColors.cyan,
              ),
            );
            if (resultComplete(1, 2))
              extensionText(
                ctx,
                api,
                labelBoxes,
                'λ₁ / (λ₁ + λ₂) = ' + pca.varianceKept.toFixed(4),
                1400,
                835,
                32,
                themeColors.green,
              );
          }
          extensionNote(
            ctx,
            api,
            labelBoxes,
            currentBeat === 1 && resultComplete(1, 3)
              ? 'If total centered variance is zero, stop before taking a ratio.'
              : 'Squared energy and sample covariance share the same divisor n − 1.',
          );
        } else if (currentBeat === 2) {
          const ratio = 10 ** (cueProgress(2, 1) * 3),
            gramRatio = ratio ** 2;
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Illustrative nonzero spectrum',
            500,
            295,
            33,
            themeColors.cyan,
          );
          extensionText(
            ctx,
            api,
            labelBoxes,
            'σmax / σmin = ' + ratio.toFixed(1),
            500,
            450,
            38,
            themeColors.cyan,
          );
          extensionText(
            ctx,
            api,
            labelBoxes,
            'λmax / λmin = ' + gramRatio.toFixed(1),
            500,
            615,
            38,
            themeColors.pink,
          );
          if (cueProgress(2, 3) > 0) {
            api.rect(ctx, 1070, 390, 620, 450, themeColors.panel, themeColors.muted, 2);
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Xc: 100 × 1536',
              1380,
              315,
              33,
              themeColors.yellow,
            );
            extensionText(
              ctx,
              api,
              labelBoxes,
              'C: 1536 × 1536',
              1380,
              500,
              36,
              themeColors.yellow,
            );
            extensionText(ctx, api, labelBoxes, 'rank ≤ 99', 1380, 640, 37, themeColors.pink);
            if (resultComplete(2, 4))
              extensionText(
                ctx,
                api,
                labelBoxes,
                'Full condition number: ∞',
                1380,
                770,
                32,
                themeColors.pink,
              );
          }
          extensionNote(
            ctx,
            api,
            labelBoxes,
            'A finite squared spectral ratio describes a positive spectrum; zero eigenvalues require a rank qualifier.',
          );
        } else {
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Keep solver identity with the representation',
            960,
            300,
            35,
            themeColors.cyan,
          );
          const theta = (cueProgress(3, 4) * Math.PI) / 2;
          const q = extensionAxes(ctx, api, [-1.5, 1.5], [-1.5, 1.5], 180, 390, 650, 470);
          extensionSegment(
            ctx,
            api,
            pendingSegments,
            q,
            [-Math.cos(theta), -Math.sin(theta)],
            [Math.cos(theta), Math.sin(theta)],
            themeColors.yellow,
            5,
          );
          extensionSegment(
            ctx,
            api,
            pendingSegments,
            q,
            [Math.sin(theta), -Math.cos(theta)],
            [-Math.sin(theta), Math.cos(theta)],
            themeColors.cyan,
            5,
          );
          extensionRows(
            ctx,
            api,
            labelBoxes,
            [
              'Tall / narrow: covariance can be efficient',
              'Direct SVD: avoid large covariance',
              'Randomized: record approximation settings',
              'Tied spectrum: retained axis can rotate',
            ],
            1390,
            435,
            125,
          );
          extensionNote(
            ctx,
            api,
            labelBoxes,
            'The tied two-dimensional subspace is fixed while its chosen one-axis cut rotates.',
          );
        }
      }
      for (const { q, a, z, color, width } of pendingSegments)
        for (const points of visibleLineSegments(a, z, labelBoxes))
          api.path(ctx, points, {
            color,
            width,
            clip: q.bounds,
          });
    }
    {
      const { C } = api;
      [
        'A · charged twice',
        'B · duplicate payment',
        'C · reset link',
        'D · two-factor code',
        'E · release runbook',
        'F · release approval',
      ].forEach((v, i) => api.text(ctx, v, 130 + i * 282, 196, 22, C.muted, 'left'));
    }
  });
}
export default {
  id: 'solver-contract',
  draw: drawSolverContract,
  cues: [
    'cp-solver-contract-0-0',
    'cp-solver-contract-0-1',
    'cp-solver-contract-0-2',
    'cp-solver-contract-0-3',
    'cp-solver-contract-1-0',
    'cp-solver-contract-1-1',
    'cp-solver-contract-1-2',
    'cp-solver-contract-1-3',
    'cp-solver-contract-2-0',
    'cp-solver-contract-2-1',
    'cp-solver-contract-2-2',
    'cp-solver-contract-2-3',
    'cp-solver-contract-2-4',
    'cp-solver-contract-3-0',
    'cp-solver-contract-3-1',
    'cp-solver-contract-3-2',
    'cp-solver-contract-3-3',
    'cp-solver-contract-3-4',
  ],
};
