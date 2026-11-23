import { sqlCueStep } from '../construction.mjs';
import {
  drawExtendedSqlArrow,
  drawExtendedSqlCard,
  drawExtendedSqlEquation,
  drawExtendedSqlFooter,
  drawExtendedSqlGrid,
  drawExtendedSqlHeading,
  drawExtendedSqlText,
} from '../defaults.mjs';
export function drawQueryNull(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    stepProgress = (beat, i = 0) => sqlCueStep('query-null', state, beat, i),
    stepComplete = (beat, i = 0) => stepProgress(beat, i) === 1;
  api.focus.target('query-null-construction', () => {
    drawExtendedSqlHeading(
      ctx,
      api,
      currentBeat === 0
        ? 'Evaluate the complete time predicate'
        : 'Compare instants under a declared representation',
    );
    if (currentBeat === 0) {
      const rows = [
        ['edition', 'start', 'end', 'end = NULL', 'end IS NULL'],
        ['current', 'July 1', 'NULL', 'unknown', 'true'],
        ['future', 'January 1, 2027', 'NULL', 'unknown', 'true'],
      ];
      drawExtendedSqlGrid(ctx, api, rows, 140, 355, 1640, 255, themeColors.blue, 27);
      if (stepProgress(0, 2) > 0) {
        drawExtendedSqlText(
          ctx,
          api,
          'request: August 12, 2026',
          960,
          675,
          29,
          themeColors.yellow,
          'center',
        );
        drawExtendedSqlEquation(
          ctx,
          api,
          String.raw`\mathrm{start}\le t\;\land\;(\mathrm{end\ IS\ NULL}\;\lor\;t<\mathrm{end})`,
          960,
          750,
          38,
          themeColors.cyan,
        );
        if (stepComplete(0, 3))
          drawExtendedSqlText(
            ctx,
            api,
            'future edition fails start ≤ request time',
            960,
            900,
            32,
            themeColors.pink,
            'center',
          );
      }
    } else {
      drawExtendedSqlCard(ctx, api, '10:00 UTC', 190, 400, 650, 100, themeColors.blue, 40);
      drawExtendedSqlCard(ctx, api, '12:00 +02:00', 1080, 400, 650, 100, themeColors.green, 40);
      drawExtendedSqlArrow(
        ctx,
        api,
        {
          x: 865,
          y: 450,
        },
        {
          x: 1055,
          y: 450,
        },
        stepProgress(1, 3),
        themeColors.yellow,
      );
      if (stepComplete(1, 3))
        drawExtendedSqlText(
          ctx,
          api,
          'one instant · different written local times',
          960,
          650,
          36,
          themeColors.yellow,
          'center',
        );
      drawExtendedSqlCard(
        ctx,
        api,
        'SQLite lab: fixed UTC text',
        190,
        780,
        650,
        85,
        themeColors.blue,
        29,
      );
      drawExtendedSqlCard(
        ctx,
        api,
        'PostgreSQL sketch: TIMESTAMPTZ',
        1080,
        780,
        650,
        85,
        themeColors.green,
        29,
      );
    }
    drawExtendedSqlFooter(
      ctx,
      api,
      'Use IS NULL for unknown ends; normalize formats before relying on textual date order',
    );
  });
}
export default {
  id: 'query-null',
  draw: drawQueryNull,
  cues: [
    'query-null-b1',
    'query-null-voice-1',
    'query-null-step-0-1',
    'query-null-step-0-2',
    'query-null-step-0-3',
    'query-null-step-0-4',
    'query-null-b2',
    'query-null-voice-2',
    'query-null-step-1-1',
    'query-null-step-1-2',
    'query-null-step-1-3',
    'query-null-step-1-4',
    'query-null-step-1-5',
  ],
};
