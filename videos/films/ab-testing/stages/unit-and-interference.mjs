import { abClamp } from '../arithmetic.mjs';
import { abCue, abStarted } from '../construction.mjs';
import { abExtendedScenes, clusterDesignEffect } from '../model.mjs';
import {
  drawExpansionBox,
  drawExpansionCell,
  drawExpansionLine,
  drawExpansionNote,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawUnitAndInterference(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = abClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  if (!abExtendedScenes.has('unit-and-interference')) return;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'unit-and-interference-mechanism', () => {
    if (beat === 0) {
      writeExpansionText(
        ctx,
        api,
        'One assigned rewrite policy · include delays and failures',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      drawExpansionCell(
        ctx,
        api,
        'Raw question\n7% errors; owner acked',
        200,
        390,
        650,
        140,
        themeColors.blue,
        32,
      );
      drawExpansionCell(
        ctx,
        api,
        'Retrieval-focused query\ncanary · rollback · policy owner',
        1050,
        390,
        650,
        140,
        themeColors.pink,
        30,
      );
      const shared = ['runbooks-2026-05-01', 'generator + prompt', 'greedy · answer schema'];
      shared.forEach((v, i) =>
        drawExpansionCell(ctx, api, v, 260 + i * 490, 650, 430, 105, themeColors.cyan, 28),
      );
      writeExpansionText(
        ctx,
        api,
        'Estimand: average outcome effect of assigned policy',
        960,
        885,
        36,
        themeColors.yellow,
        'center',
      );
      drawExpansionNote(
        ctx,
        api,
        'Different model, prompt or decoder settings would define a different comparison.',
      );
    } else if (beat === 1) {
      writeExpansionText(
        ctx,
        api,
        'Two distinct spillover paths',
        960,
        280,
        36,
        themeColors.blue,
        'center',
      );
      drawExpansionCell(
        ctx,
        api,
        'Treatment incident\nengineer learns procedure',
        180,
        380,
        670,
        140,
        themeColors.pink,
        32,
      );
      drawExpansionCell(
        ctx,
        api,
        'Later control incident\nsame engineer uses that knowledge',
        1060,
        380,
        670,
        140,
        themeColors.blue,
        31,
      );
      if (abStarted(state, 'unit-learning', progress > 0.2)) {
        drawExpansionLine(
          ctx,
          api,
          {
            x: 860,
            y: 450,
          },
          {
            x: 1050,
            y: 450,
          },
          themeColors.yellow,
          5,
        );
        api.circle(ctx, 860 + 190 * abCue(state, 'unit-learning', q), 450, 12, themeColors.yellow);
      }
      drawExpansionCell(
        ctx,
        api,
        'Treatment rewrite jobs',
        180,
        690,
        670,
        115,
        themeColors.pink,
        32,
      );
      drawExpansionCell(
        ctx,
        api,
        'Shared worker pool\ncontrol requests wait here too',
        1060,
        665,
        670,
        165,
        themeColors.blue,
        30,
      );
      if (abStarted(state, 'unit-compute', progress > 0.45)) {
        for (let i = 0; i < 6; i++) api.circle(ctx, 900 + i * 24, 745, 8, themeColors.pink);
        drawExpansionLine(
          ctx,
          api,
          {
            x: 860,
            y: 745,
          },
          {
            x: 1050,
            y: 745,
          },
          themeColors.pink,
          4,
        );
      }
      drawExpansionNote(
        ctx,
        api,
        'Team randomization can contain within-team learning; shared infrastructure still needs its own design.',
      );
    } else {
      writeExpansionText(
        ctx,
        api,
        'Equal-cluster planning approximation',
        960,
        280,
        36,
        themeColors.blue,
        'center',
      );
      for (let team = 0; team < 4; team++) {
        drawExpansionBox(
          ctx,
          api,
          180 + team * 440,
          370,
          390,
          300,
          team % 2 ? themeColors.pink : themeColors.blue,
        );
        writeExpansionText(
          ctx,
          api,
          'Team ' + (team + 1),
          375 + team * 440,
          420,
          30,
          team % 2 ? themeColors.pink : themeColors.blue,
          'center',
        );
        for (let i = 0; i < 20; i++)
          api.circle(
            ctx,
            225 + team * 440 + (i % 5) * 65,
            475 + Math.floor(i / 5) * 50,
            13,
            team % 2 ? themeColors.pink : themeColors.blue,
          );
      }
      writeExpansionText(
        ctx,
        api,
        '20 incident outcomes / team · common ICC = 0.10',
        960,
        765,
        31,
        themeColors.ink,
        'center',
      );
      if (abStarted(state, 'unit-deff', progress > 0.3))
        writeExpansionText(
          ctx,
          api,
          '1 + (20 − 1) × 0.10 = ' + clusterDesignEffect(20, 0.1).toFixed(1) + ' variance factor',
          960,
          880,
          37,
          themeColors.yellow,
          'center',
        );
      drawExpansionNote(
        ctx,
        api,
        'More correlated messages do not create more independent teams. Unequal clusters require a design-specific calculation.',
      );
    }
  });
  return;
}
export default {
  id: 'unit-and-interference',
  draw: drawUnitAndInterference,
  cues: [
    'unit-and-interference-step-1',
    'unit-and-interference-step-2',
    'unit-learning',
    'unit-compute',
    'unit-and-interference-step-3',
    'unit-deff',
  ],
};
