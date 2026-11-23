import { draftRows, testRows } from '../fixtures.mjs';
import { mappedJudgeConstruction, phase, sampleModel, smooth } from '../construction.mjs';
import { reviewJudgeOrder } from '../model.mjs';
import {
  card,
  cueVisible,
  detailFooter,
  detailHeading,
  detailRow,
  detailTarget,
  detailText,
  text,
} from '../defaults.mjs';
export function drawEvaluationBoundary(ctx, scene, state, api) {
  if (drawJudgeCalibration(ctx, scene, state, api)) return;
  const { C: themeColors, teaching: teaching } = api,
    beat = state.beat,
    progress = state.beatP,
    q = phase(progress),
    modelState = sampleModel('evaluation-boundary', state);
  const route = (source, target, color = themeColors.cyan) =>
    teaching.transfer({
      source: {
        shape: source,
        opacity: 1,
      },
      target: {
        shape: target,
        opacity: 1,
      },
      color,
      progress: q,
      gap: 22,
      particle: {
        radius: 7,
        fill: color,
      },
      margin: 4,
    });
  {
    if (!modelState.showJudge) {
      const training = api.focus.target('train-copy', () =>
          card(
            ctx,
            api,
            'Training draft\nattack-014-copy',
            180,
            385,
            600,
            themeColors.pink,
            150,
            30,
          ),
        ),
        test = api.focus.target('private-test', () =>
          card(ctx, api, 'Private test\nattack-014', 1140, 385, 600, themeColors.yellow, 150, 30),
        );
      route(training, test, themeColors.pink);
      text(
        ctx,
        api,
        'The record IDs differ. Compare the parent source.',
        960,
        650,
        31,
        themeColors.ink,
        'center',
      );
      if (beat === 1) {
        api.focus.target('source-parent', () =>
          text(
            ctx,
            api,
            `Parent: ${draftRows[3].parents[0]}`,
            480,
            740,
            31,
            themeColors.pink,
            'center',
          ),
        );
        api.focus.target('source-parent', () =>
          text(
            ctx,
            api,
            `Reserved: ${testRows[0].id}`,
            1440,
            740,
            31,
            themeColors.yellow,
            'center',
          ),
        );
      }
      if (beat === 1 && progress >= 0.24)
        api.focus.target('lineage-overlap', () =>
          text(
            ctx,
            api,
            `Computed overlap: ${modelState.findings[0]}`,
            960,
            850,
            30,
            themeColors.pink,
            'center',
          ),
        );
      text(
        ctx,
        api,
        'Normalize content, check source lineage, and review near-duplicates.',
        960,
        990,
        28,
        themeColors.muted,
        'center',
      );
    } else {
      const mapped = mappedJudgeConstruction(
        state.cues?.['map-identities']
          ? 0.22 + 0.37 * api.focus.progress('map-identities', 0)
          : progress,
      );
      ['Case', 'Human', 'Original', 'Swapped', 'Mapped back'].forEach((label, i) =>
        text(
          ctx,
          api,
          label,
          [250, 700, 1000, 1300, 1630][i],
          360,
          28,
          themeColors.muted,
          'center',
        ),
      );
      mapped.rows.forEach((row, i) => {
        const y = 490 + i * 145;
        text(ctx, api, row.id, 250, y, 29, themeColors.ink, 'center');
        text(ctx, api, row.human, 700, y, 39, themeColors.green, 'center');
        api.focus.target('original-choices', () =>
          text(ctx, api, row.original, 1000, y, 39, themeColors.green, 'center'),
        );
        if (progress >= 0.18 && !(mapped.active === i && mapped.travel > 0))
          text(ctx, api, row.swapped, 1300, y, 39, themeColors.blue, 'center');
        if (i < mapped.completed)
          api.focus.target('mapped-choices', () =>
            text(
              ctx,
              api,
              row.mapped,
              1630,
              y,
              39,
              row.mapped !== row.original ? themeColors.pink : themeColors.green,
              'center',
            ),
          );
        if (mapped.active === i && mapped.travel > 0)
          api.focus.target('mapped-choices', () =>
            card(
              ctx,
              api,
              `Swapped ${row.swapped}\nOriginal ${row.mapped}`,
              1200 + 340 * smooth(mapped.travel),
              y - 53,
              180,
              themeColors.yellow,
              90,
              24,
            ),
          );
      });
      const active = mapped.rows[mapped.active ?? 0];
      text(
        ctx,
        api,
        progress < 0.18
          ? 'Reverse the answer positions'
          : mapped.completed === 3
            ? 'All choices mapped back to their original answer identities'
            : `Swapped position ${active.swapped} refers to original answer ${active.mapped}`,
        960,
        850,
        28,
        themeColors.ink,
        'center',
      );
      api.focus.target('mapping-count', () =>
        text(
          ctx,
          api,
          `Original agreement: ${(modelState.agreement * 100).toFixed(0)}% · checked ${mapped.completed}/3 · changed ${mapped.changed}`,
          960,
          960,
          31,
          themeColors.yellow,
          'center',
        ),
      );
    }
  }
}
function drawJudgeCalibration(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (!(currentBeat === 3)) return false;
  const { C: themeColors } = api;
  {
    detailHeading(
      ctx,
      api,
      'Repeated judge trials and principle-based synthetic feedback need their own checks',
    );
    const repeat = cueVisible(ctx, api, 'judge-limits'),
      synth = cueVisible(ctx, api, 'synthetic-scope');
    const rows = reviewJudgeOrder().rows;
    rows.forEach((r, i) => {
      detailRow(
        ctx,
        api,
        r.id + ': original ' + r.original + ' / mapped ' + r.mapped,
        150,
        370 + i * 110,
        1620,
        r.original === r.mapped ? themeColors.green : themeColors.pink,
      );
    });
    detailTarget(ctx, api, 'judge-repeat', () => {
      if (repeat)
        detailText(
          ctx,
          api,
          'Stochastic judge: repeat balanced trials before systematic attribution',
          960,
          785,
          29,
          themeColors.yellow,
          'center',
        );
    });
    detailTarget(ctx, api, 'synthetic-scope', () => {
      if (synth) {
        detailText(
          ctx,
          api,
          'Human-authored principles → critique / revision → supervised training',
          960,
          895,
          29,
          themeColors.blue,
          'center',
        );
        detailText(
          ctx,
          api,
          'AI comparisons → preference model → reinforcement learning',
          960,
          960,
          29,
          themeColors.cyan,
          'center',
        );
      }
    });
    detailFooter(
      ctx,
      api,
      'Task-specific human calibration remains separate from the original CAI method.',
    );
  }
  return true;
}
export default {
  id: 'evaluation-boundary',
  draw: drawEvaluationBoundary,
  cues: [
    'separate-test',
    'source-overlap',
    'detect-overlap',
    'map-identities',
    'changed-choices',
    'judge-limits',
    'synthetic-scope',
  ],
};
