import { TRIALS } from '../fixtures.mjs';
import { repeatEstimates } from '../arithmetic.mjs';
import {
  cueProgress,
  cueVisible,
  evidenceBox,
  evidenceEquation,
  evidenceFootnote,
  evidenceLine,
  evidenceText,
} from '../defaults.mjs';
export function drawMetricEstimators(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    resultComplete = (id) =>
      state.cues?.[id] ? state.cues[id].phase === 'after' : cueProgress(ctx, api, id) === 1;
  api.focus.target('metric-estimators-mechanism', () => {
    if (currentBeat === 0) {
      TRIALS.forEach((r, i) => {
        evidenceText(ctx, api, r.task, 220, 355 + i * 130, 30, themeColors.ink);
        r.pass.forEach((pass, j) => {
          evidenceBox(
            ctx,
            api,
            pass ? '✓' : '×',
            665 + j * 170,
            300 + i * 130,
            110,
            90,
            pass ? themeColors.green : themeColors.pink,
          );
        });
        if (cueVisible(ctx, api, 'all-k-rule')) {
          evidenceLine(
            ctx,
            api,
            655,
            407 + i * 130,
            1130,
            407 + i * 130,
            r.pass.every(Boolean) ? themeColors.green : themeColors.pink,
          );
          evidenceBox(
            ctx,
            api,
            r.pass.every(Boolean) ? 'ALL 3' : 'fails all-3',
            1270,
            300 + i * 130,
            360,
            90,
            r.pass.every(Boolean) ? themeColors.green : themeColors.pink,
          );
        }
      });
      if (cueVisible(ctx, api, 'all-k-rule'))
        evidenceEquation(
          ctx,
          api,
          String.raw`\widehat{\mathrm{pass}^{k}}=\frac{\binom{c}{k}}{\binom{n}{k}}`,
          960,
          805,
          44,
        );
      if (cueVisible(ctx, api, 'task-average'))
        evidenceText(
          ctx,
          api,
          'Equal task average: (1 + 0 + 0) / 3 = 1/3',
          960,
          905,
          35,
          themeColors.yellow,
          'center',
        );
      evidenceFootnote(
        ctx,
        api,
        'IID reruns under one frozen protocol · task contributions receive equal weight',
      );
    } else if (currentBeat === 1) {
      const patches = [false, true, false, false, true];
      const combos = [];
      for (let i = 0; i < 5; i++)
        for (let j = i + 1; j < 5; j++) for (let k = j + 1; k < 5; k++) combos.push([i, j, k]);
      evidenceText(
        ctx,
        api,
        'One task   ·   five sampled patches   ·   choose three',
        960,
        280,
        32,
        themeColors.ink,
        'center',
      );
      for (let i = 0; i < 5; i++)
        evidenceBox(
          ctx,
          api,
          String(i + 1) + (patches[i] ? ' ✓' : ' ×'),
          560 + i * 170,
          325,
          130,
          80,
          patches[i] ? themeColors.green : themeColors.pink,
        );
      const count = cueVisible(ctx, api, 'patch-subsets')
        ? Math.min(10, Math.ceil(cueProgress(ctx, api, 'patch-subsets') * 10))
        : 0;
      combos.slice(0, count).forEach((set, i) => {
        const x = 250 + (i % 5) * 300,
          y = 510 + Math.floor(i / 5) * 160,
          hit = set.some((j) => patches[j]);
        set.forEach((j, k) => {
          api.circle(
            ctx,
            x + 35 + k * 75,
            y,
            20,
            patches[j] ? themeColors.green : themeColors.pink,
          );
          evidenceText(
            ctx,
            api,
            String(j + 1),
            x + 35 + k * 75,
            y + 8,
            24,
            themeColors.bg,
            'center',
          );
        });
        evidenceLine(
          ctx,
          api,
          x + 5,
          y + 45,
          x + 220,
          y + 45,
          resultComplete('missed-triple')
            ? hit
              ? themeColors.green
              : themeColors.pink
            : themeColors.muted,
          4,
        );
      });
      const hits = combos.filter((set) => set.some((j) => patches[j])).length;
      const estimate = repeatEstimates(patches.length, patches.filter(Boolean).length, 3);
      if (cueVisible(ctx, api, 'hit-rule'))
        evidenceEquation(
          ctx,
          api,
          String.raw`\widehat{\mathrm{pass@}k}=1-\frac{\binom{n-c}{k}}{\binom{n}{k}}`,
          960,
          840,
          43,
        );
      if (resultComplete('patch-result'))
        evidenceText(
          ctx,
          api,
          hits + ' / ' + combos.length + ' subsets contain a pass = ' + estimate.any.toFixed(2),
          960,
          917,
          35,
          themeColors.green,
          'center',
        );
      evidenceFootnote(
        ctx,
        api,
        'In production, the selector needs its own way to recognize a working patch.',
      );
    } else {
      const hetero = cueVisible(ctx, api, 'two-tasks') || cueVisible(ctx, api, 'heterogeneous');
      if (!hetero) {
        const p = 0.7,
          all = p ** 3,
          missed = 1 - all;
        const x = 535,
          width = 965;
        evidenceText(
          ctx,
          api,
          'Same reservation · independent runs',
          960,
          280,
          40,
          themeColors.ink,
          'center',
        );
        const rows = [
          ['First pass', 'first-pass'],
          ['Two passes', 'second-pass'],
          ['Three passes', 'third-pass'],
        ];
        rows.forEach(([label, cue], i) => {
          const y = 360 + i * 125;
          evidenceText(ctx, api, label, 185, y + 47, 39, themeColors.ink);
          api.rect(ctx, x, y, width, 61, themeColors.panel, themeColors.line, 3);
          const progress = i === 0 ? 1 : cueProgress(ctx, api, cue);
          const fraction = p ** (i + 1);
          if (progress > 0) {
            const previous = p ** i;
            const extent = width * (previous + (fraction - previous) * progress);
            api.rect(ctx, x, y, extent, 61, themeColors.green, undefined, 2);
          }
          const settled = i === 0 || resultComplete(i === 2 ? 'power-cube' : cue);
          if (settled)
            evidenceText(
              ctx,
              api,
              Number((100 * fraction).toFixed(1)) + '%',
              x + (width * fraction) / 2,
              y + 44,
              38,
              themeColors.bg,
              'center',
            );
          else if (i === 2 && state.beat === 2)
            evidenceText(ctx, api, '?', 1550, y + 47, 42, themeColors.yellow);
          if (i === 2 && resultComplete('failure-complement')) {
            api.rect(ctx, x + width * all, y, width * missed, 61, themeColors.pink, undefined, 2);
            evidenceText(
              ctx,
              api,
              (100 * missed).toFixed(1) + '%',
              x + width * (all + missed / 2),
              y + 44,
              38,
              themeColors.bg,
              'center',
            );
          }
        });
        if (resultComplete('power-cube')) {
          evidenceText(ctx, api, 'All three pass', 550, 790, 34, themeColors.green, 'center');
          evidenceEquation(ctx, api, `${p}^3=${all.toFixed(3)}`, 550, 880, 52, themeColors.green);
        }
        if (resultComplete('failure-complement')) {
          evidenceText(ctx, api, 'At least one fails', 1350, 790, 34, themeColors.pink, 'center');
          evidenceEquation(
            ctx,
            api,
            `1-${all.toFixed(3)}=${missed.toFixed(3)}`,
            1350,
            880,
            52,
            themeColors.pink,
          );
        }
      } else {
        evidenceText(ctx, api, 'Two different tasks', 960, 290, 35, themeColors.ink, 'center');
        evidenceBox(ctx, api, 'Task A · p = 1\nall-3 = 1', 260, 380, 580, 190, themeColors.green);
        evidenceBox(ctx, api, 'Task B · p = 0\nall-3 = 0', 1080, 380, 580, 190, themeColors.pink);
        evidenceText(
          ctx,
          api,
          resultComplete('heterogeneous')
            ? 'Equal task mean: (1 + 0) / 2 = 0.5'
            : 'Equal task average pending',
          960,
          690,
          38,
          resultComplete('heterogeneous') ? themeColors.green : themeColors.muted,
          'center',
        );
        if (resultComplete('pooled-wrong')) {
          evidenceText(
            ctx,
            api,
            'Pooled shortcut: ((1 + 0) / 2)³ = 0.125',
            960,
            805,
            37,
            themeColors.pink,
            'center',
          );
          evidenceLine(ctx, api, 445, 825, 1475, 825, themeColors.pink, 4);
        }
      }
    }
  });
  return;
}
export default {
  id: 'metric-estimators',
  draw: drawMetricEstimators,
  cues: [
    'all-k-rule',
    'task-average',
    'hit-rule',
    'patch-subsets',
    'missed-triple',
    'patch-result',
    'first-pass',
    'second-pass',
    'third-pass',
    'power-cube',
    'failure-complement',
    'two-tasks',
    'heterogeneous',
    'pooled-wrong',
  ],
};
