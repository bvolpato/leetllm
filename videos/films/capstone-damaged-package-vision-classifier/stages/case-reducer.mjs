import { visionOutcomes } from '../fixtures.mjs';
import { visionJoin } from '../arithmetic.mjs';
import { visionServed, visionTestRows } from '../construction.mjs';
import { visionFrame } from '../model.mjs';
import { visionCard, visionMetrics, visionNote, visionText } from '../defaults.mjs';
export function drawCaseReducer(ctx, scene, state, api) {
  const frameState = visionFrame('case-reducer', state);
  return api.focus.target('dv-case-reducer-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      if (currentBeat === 0) {
        const a = visionCard(
            ctx,
            api,
            'R-404-a · priority',
            180,
            370,
            600,
            110,
            themeColors.yellow,
          ),
          z = visionCard(ctx, api, 'R-404-b · priority', 180, 560, 600, 110, themeColors.yellow);
        const target = visionCard(
          ctx,
          api,
          resultComplete('case-priority', 0)
            ? 'R-404 · ONE priority case'
            : 'Reduce by physical identity',
          1120,
          460,
          650,
          120,
          resultComplete('case-priority', 0) ? themeColors.cyan : themeColors.muted,
        );
        for (const source of [a, z])
          api.teaching.transfer({
            source: {
              shape: source,
              opacity: 1,
            },
            target: {
              shape: target,
              opacity: 1,
            },
            progress: frameState.op,
            color: themeColors.cyan,
            particle: {
              radius: 6,
              fill: themeColors.cyan,
            },
            gap: 18,
          });
        if (resultComplete('case-normal', 0))
          visionText(
            ctx,
            api,
            'Any priority > any normal > all request-new-photo',
            960,
            850,
            35,
            themeColors.ink,
            'center',
          );
        visionNote(
          ctx,
          api,
          'Two priority views retain two traces and contribute one physical decision unit.',
        );
      } else if (currentBeat === 1) {
        visionCard(ctx, api, 'Human label: usable + damaged', 180, 380, 650, 115, themeColors.blue);
        visionCard(
          ctx,
          api,
          'Served action: request new photo',
          1080,
          380,
          650,
          115,
          themeColors.pink,
        );
        visionText(
          ctx,
          api,
          'Human usability selects the evaluation cohort',
          960,
          650,
          37,
          themeColors.ink,
          'center',
        );
        if (resultComplete('quality-false-negative', 1))
          visionCard(
            ctx,
            api,
            'Nonpriority + damaged → false negative',
            460,
            790,
            1000,
            110,
            themeColors.pink,
          );
        visionNote(
          ctx,
          api,
          'Illustrative quality-stage error. Cohort selection does not rewrite the action originally served.',
        );
      } else {
        const report = visionJoin(visionTestRows, visionServed, visionOutcomes, 12),
          show = resultComplete('confusion-definition', 2);
        api.teaching.grid({
          x: 280,
          y: 340,
          width: 1360,
          height: 340,
          rows: 3,
          columns: 3,
          labels: [
            ['Case action', 'Damaged', 'Clear'],
            ['Priority', show ? 'TP · R-404' : 'pending', show ? 'FP · R-407' : 'pending'],
            ['Nonpriority', show ? 'FN · R-408' : 'pending', show ? 'TN · R-405' : 'pending'],
          ],
          fontSize: 31,
          padding: 16,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.ink,
        });
        visionMetrics(ctx, api, report, resultComplete('confusion-ratios', 2));
        visionNote(
          ctx,
          api,
          'Precision uses priority decisions. Recall uses damaged cases. Empty denominators remain undefined.',
        );
      }
    }
  });
}
export default {
  id: 'case-reducer',
  draw: drawCaseReducer,
  cues: [
    'dv-case-reducer-0',
    'dv-case-reducer-operation-0',
    'dv-case-priority',
    'dv-case-normal',
    'dv-case-reducer-1',
    'dv-case-reducer-operation-1',
    'dv-quality-false-negative',
    'dv-case-reducer-2',
    'dv-case-reducer-operation-2',
    'dv-confusion-definition',
    'dv-confusion-ratios',
  ],
};
